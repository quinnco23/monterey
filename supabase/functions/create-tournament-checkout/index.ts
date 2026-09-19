import Stripe from "npm:stripe@^22"
import { createClient } from "jsr:@supabase/supabase-js@2"

const stripe = new Stripe(
  Deno.env.get("STRIPE_SECRET_KEY")!
)

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: corsHeaders,
    })
  }

  try {
    const authHeader =
      req.headers.get("Authorization")

    if (!authHeader) {
      return jsonResponse(
        {
          error:
            "Missing authorization.",
        },
        401
      )
    }

    const supabaseUrl =
      Deno.env.get("SUPABASE_URL")

    const supabaseAnonKey =
      Deno.env.get("SUPABASE_ANON_KEY")

    const supabaseServiceRoleKey =
      Deno.env.get(
        "SUPABASE_SERVICE_ROLE_KEY"
      )

    if (
      !supabaseUrl ||
      !supabaseAnonKey ||
      !supabaseServiceRoleKey
    ) {
      throw new Error(
        "Supabase environment variables are not configured."
      )
    }

    /*
     * User-scoped client.
     *
     * Used to:
     * - authenticate the caller
     * - load registration through normal RLS
     */
    const userSupabase =
      createClient(
        supabaseUrl,
        supabaseAnonKey,
        {
          global: {
            headers: {
              Authorization:
                authHeader,
            },
          },

          auth: {
            persistSession: false,
            autoRefreshToken: false,
          },
        }
      )

    /*
     * Service-role client.
     *
     * Used only for trusted server-side
     * payment-state updates.
     */
    const adminSupabase =
      createClient(
        supabaseUrl,
        supabaseServiceRoleKey,
        {
          auth: {
            persistSession: false,
            autoRefreshToken: false,
          },
        }
      )

    /*
     * Authenticate caller.
     */
    const {
      data: { user },
      error: userError,
    } =
      await userSupabase.auth.getUser()

    if (userError || !user) {
      console.error(
        "CHECKOUT AUTH ERROR:",
        userError
      )

      return jsonResponse(
        {
          error:
            "You must be signed in.",
        },
        401
      )
    }

    /*
     * Parse request.
     */
    const body =
      await req.json()

    const registrationId =
      body?.registrationId

    if (!registrationId) {
      return jsonResponse(
        {
          error:
            "Missing registration ID.",
        },
        400
      )
    }

    /*
     * Load trusted registration.
     */
    const {
      data: registration,
      error: registrationError,
    } = await userSupabase
      .from(
        "tournament_registrations"
      )
      .select(`
        id,
        tournament_id,
        division_id,
        team_id,
        organization_id,
        registered_by_user_id,
        registration_fee_cents,
        payment_status,
        stripe_checkout_session_id,

        tournaments (
          name
        ),

        tournament_divisions (
          name,
          age_group
        ),

        teams (
          name
        )
      `)
      .eq(
        "id",
        registrationId
      )
      .single()

    if (
      registrationError ||
      !registration
    ) {
      console.error(
        "REGISTRATION LOOKUP ERROR:",
        registrationError
      )

      return jsonResponse(
        {
          error:
            "Tournament registration could not be loaded.",
        },
        404
      )
    }

    /*
     * Only the user who created the
     * registration may initiate payment.
     */
    if (
      registration.registered_by_user_id !==
      user.id
    ) {
      return jsonResponse(
        {
          error:
            "You do not have permission to pay this registration.",
        },
        403
      )
    }

    /*
     * Never create another Checkout Session
     * for a registration already marked paid.
     */
    if (
      registration.payment_status ===
      "paid"
    ) {
      return jsonResponse(
        {
          error:
            "This registration has already been paid.",
        },
        409
      )
    }

    /*
     * Registration fee always comes from
     * our trusted database snapshot.
     */
    const amount =
      registration.registration_fee_cents

    if (
      !amount ||
      amount <= 0
    ) {
      return jsonResponse(
        {
          error:
            "This registration does not have a valid entry fee.",
        },
        400
      )
    }

    /*
     * ==================================================
     * RECOVER EXISTING CHECKOUT SESSION
     * ==================================================
     *
     * If this registration already has a Stripe
     * Checkout Session, inspect it before creating
     * another one.
     */
    const existingSessionId =
      registration
        .stripe_checkout_session_id

    if (existingSessionId) {
      try {
        const existingSession =
          await stripe.checkout.sessions.retrieve(
            existingSessionId
          )

        console.log(
          "EXISTING CHECKOUT SESSION:",
          {
            registrationId:
              registration.id,

            sessionId:
              existingSession.id,

            status:
              existingSession.status,

            paymentStatus:
              existingSession.payment_status,
          }
        )

        /*
         * Stripe already says it was paid.
         *
         * Do not create another session.
         *
         * Normally the webhook will also have
         * marked Supabase paid. If Supabase is
         * temporarily behind, returning a conflict
         * prevents a duplicate charge.
         */
        if (
          existingSession.payment_status ===
          "paid" ||
          existingSession.status ===
          "complete"
        ) {
          return jsonResponse(
            {
              error:
                "Stripe already shows this registration as paid. Payment confirmation may still be processing.",
              sessionId:
                existingSession.id,
            },
            409
          )
        }

        /*
         * Existing hosted Checkout is still open.
         *
         * Reuse it instead of creating another
         * Checkout Session.
         */
        if (
          existingSession.status ===
            "open" &&
          existingSession.url
        ) {
          /*
           * Keep our DB state aligned.
           */
          const {
            error:
              pendingUpdateError,
          } = await adminSupabase
            .from(
              "tournament_registrations"
            )
            .update({
              payment_status:
                "pending",
            })
            .eq(
              "id",
              registration.id
            )

          if (pendingUpdateError) {
            console.error(
              "PENDING PAYMENT RECOVERY UPDATE ERROR:",
              pendingUpdateError
            )

            throw pendingUpdateError
          }

          console.log(
            "REUSING CHECKOUT SESSION:",
            {
              registrationId:
                registration.id,

              sessionId:
                existingSession.id,
            }
          )

          return jsonResponse(
            {
              url:
                existingSession.url,

              sessionId:
                existingSession.id,

              reused:
                true,
            },
            200
          )
        }

        /*
         * If status is expired, fall through
         * and create a new Checkout Session.
         */
        if (
          existingSession.status ===
          "expired"
        ) {
          console.log(
            "CHECKOUT SESSION EXPIRED — CREATING NEW SESSION:",
            {
              registrationId:
                registration.id,

              sessionId:
                existingSession.id,
            }
          )
        } else {
          /*
           * Any unknown/unusable state also gets
           * a fresh session instead of trapping
           * the user.
           */
          console.log(
            "CHECKOUT SESSION NOT REUSABLE — CREATING NEW SESSION:",
            {
              registrationId:
                registration.id,

              sessionId:
                existingSession.id,

              status:
                existingSession.status,

              paymentStatus:
                existingSession.payment_status,
            }
          )
        }
      } catch (sessionLookupError) {
        /*
         * A stored Stripe session could theoretically
         * be missing or invalid.
         *
         * Do not permanently trap the registration.
         * Log it and create a fresh session.
         */
        console.error(
          "EXISTING CHECKOUT LOOKUP ERROR:",
          sessionLookupError
        )
      }
    }

    /*
     * Normalize joined relation values.
     */
    const tournamentRelation =
      registration.tournaments

    const tournament =
      Array.isArray(
        tournamentRelation
      )
        ? tournamentRelation[0]
        : tournamentRelation

    const divisionRelation =
      registration
        .tournament_divisions

    const division =
      Array.isArray(
        divisionRelation
      )
        ? divisionRelation[0]
        : divisionRelation

    const teamRelation =
      registration.teams

    const team =
      Array.isArray(teamRelation)
        ? teamRelation[0]
        : teamRelation

    const tournamentName =
      tournament?.name ??
      "Tournament"

    const divisionName =
      division?.name ??
      "Division"

    const ageGroup =
      division?.age_group ??
      ""

    const teamName =
      team?.name ??
      "Team"

    const siteUrl =
      Deno.env.get("SITE_URL")

    if (!siteUrl) {
      throw new Error(
        "SITE_URL is not configured."
      )
    }

    /*
     * ==================================================
     * CREATE NEW CHECKOUT SESSION
     * ==================================================
     */
    const session =
      await stripe.checkout.sessions.create({
        mode:
          "payment",

        client_reference_id:
          registration.id,

        customer_email:
          user.email ??
          undefined,

        line_items: [
          {
            quantity:
              1,

            price_data: {
              currency:
                "usd",

              unit_amount:
                amount,

              product_data: {
                name:
                  `${tournamentName} Registration`,

                description:
                  `${ageGroup} ${divisionName} — ${teamName}`,
              },
            },
          },
        ],

        metadata: {
          registration_id:
            registration.id,

          tournament_id:
            registration.tournament_id,

          division_id:
            registration.division_id,

          team_id:
            registration.team_id,
        },

        payment_intent_data: {
          metadata: {
            registration_id:
              registration.id,

            tournament_id:
              registration.tournament_id,

            team_id:
              registration.team_id,
          },
        },

        success_url:
          `${siteUrl}/dashboard/tournaments/${registration.tournament_id}/registration/${registration.id}/payment-success?session_id={CHECKOUT_SESSION_ID}`,

        cancel_url:
          `${siteUrl}/dashboard/tournaments/${registration.tournament_id}/registration/${registration.id}`,
      })

    /*
     * Save new Checkout Session and move the
     * registration into pending payment.
     *
     * The Stripe webhook remains the ONLY
     * code allowed to mark it paid.
     */
    const {
      error: updateError,
    } = await adminSupabase
      .from(
        "tournament_registrations"
      )
      .update({
        payment_status:
          "pending",

        stripe_checkout_session_id:
          session.id,
      })
      .eq(
        "id",
        registration.id
      )

    if (updateError) {
      console.error(
        "REGISTRATION PAYMENT UPDATE ERROR:",
        updateError
      )

      return jsonResponse(
        {
          error:
            "Checkout was created, but registration could not be updated.",
        },
        500
      )
    }

    console.log(
      "CHECKOUT SESSION CREATED:",
      {
        registrationId:
          registration.id,

        sessionId:
          session.id,

        amount,
      }
    )

    return jsonResponse(
      {
        url:
          session.url,

        sessionId:
          session.id,

        reused:
          false,
      },
      200
    )
  } catch (error) {
    console.error(
      "CREATE TOURNAMENT CHECKOUT ERROR:",
      error
    )

    return jsonResponse(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to create checkout session.",
      },
      500
    )
  }
})


function jsonResponse(
  body: Record<string, unknown>,
  status: number
) {
  return new Response(
    JSON.stringify(body),
    {
      status,

      headers: {
        ...corsHeaders,

        "Content-Type":
          "application/json",
      },
    }
  )
}