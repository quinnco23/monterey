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
      return new Response(
        JSON.stringify({
          error: "Missing authorization.",
        }),
        {
          status: 401,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      )
    }

    const supabaseUrl =
      Deno.env.get("SUPABASE_URL")!

    const supabaseAnonKey =
      Deno.env.get("SUPABASE_ANON_KEY")!

    /*
     * User-scoped client.
     *
     * This preserves the calling user's JWT so
     * your existing RLS policies still apply.
     */
    const supabase = createClient(
      supabaseUrl,
      supabaseAnonKey,
      {
        global: {
          headers: {
            Authorization: authHeader,
          },
        },
      }
    )

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return new Response(
        JSON.stringify({
          error: "You must be signed in.",
        }),
        {
          status: 401,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      )
    }

    const body = await req.json()

    const registrationId =
      body?.registrationId

    if (!registrationId) {
      return new Response(
        JSON.stringify({
          error: "Missing registration ID.",
        }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      )
    }

    /*
     * Load the trusted registration amount from DB.
     * Never accept the fee from the browser.
     */
    const {
      data: registration,
      error: registrationError,
    } = await supabase
      .from("tournament_registrations")
      .select(`
        id,
        tournament_id,
        division_id,
        team_id,
        organization_id,
        registered_by_user_id,
        registration_fee_cents,
        payment_status,
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
      .eq("id", registrationId)
      .single()

    if (
      registrationError ||
      !registration
    ) {
      console.error(
        "REGISTRATION LOOKUP ERROR:",
        registrationError
      )

      return new Response(
        JSON.stringify({
          error:
            "Tournament registration could not be loaded.",
        }),
        {
          status: 404,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      )
    }

    if (
      registration.registered_by_user_id !==
      user.id
    ) {
      return new Response(
        JSON.stringify({
          error:
            "You do not have permission to pay this registration.",
        }),
        {
          status: 403,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      )
    }

    if (
      registration.payment_status ===
      "paid"
    ) {
      return new Response(
        JSON.stringify({
          error:
            "This registration has already been paid.",
        }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      )
    }

    const amount =
      registration.registration_fee_cents

    if (
      !amount ||
      amount <= 0
    ) {
      return new Response(
        JSON.stringify({
          error:
            "This registration does not have a valid entry fee.",
        }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      )
    }

    const tournamentName =
      registration.tournaments?.name ??
      "Tournament"

    const divisionName =
      registration.tournament_divisions
        ?.name ?? "Division"

    const ageGroup =
      registration.tournament_divisions
        ?.age_group ?? ""

    const teamName =
      registration.teams?.name ??
      "Team"

    const siteUrl =
      Deno.env.get("SITE_URL")!

    /*
     * Hosted Stripe Checkout Session.
     */
    const session =
      await stripe.checkout.sessions.create({
        mode: "payment",

        client_reference_id:
          registration.id,

        customer_email:
          user.email ?? undefined,

        line_items: [
          {
            quantity: 1,

            price_data: {
              currency: "usd",

              unit_amount: amount,

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
     * Store the Checkout Session ID and move
     * registration into pending payment.
     *
     * Do NOT mark it paid here.
     */
    const {
      error: updateError,
    } = await supabase
      .from("tournament_registrations")
      .update({
        payment_status: "pending",
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

      return new Response(
        JSON.stringify({
          error:
            "Checkout was created, but registration could not be updated.",
        }),
        {
          status: 500,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      )
    }

    return new Response(
      JSON.stringify({
        url: session.url,
        sessionId: session.id,
      }),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    )
  } catch (error) {
    console.error(
      "CREATE TOURNAMENT CHECKOUT ERROR:",
      error
    )

    return new Response(
      JSON.stringify({
        error:
          error instanceof Error
            ? error.message
            : "Unable to create checkout session.",
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    )
  }
})