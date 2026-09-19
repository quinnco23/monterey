import Stripe from "npm:stripe@^22"
import { createClient } from "jsr:@supabase/supabase-js@2"

const stripe = new Stripe(
  Deno.env.get("STRIPE_SECRET_KEY")!
)

const cryptoProvider =
  Stripe.createSubtleCryptoProvider()

const supabaseAdmin = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  }
)

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return new Response(
      "Method not allowed",
      {
        status: 405,
      }
    )
  }

  const signature =
    req.headers.get("stripe-signature")

  if (!signature) {
    return new Response(
      "Missing Stripe signature",
      {
        status: 400,
      }
    )
  }

  /*
   * Stripe signature verification requires
   * the RAW request body.
   *
   * Do not call req.json() before this.
   */
  const body =
    await req.text()

  let event: Stripe.Event

  try {
    event =
      await stripe.webhooks.constructEventAsync(
        body,
        signature,
        Deno.env.get(
          "STRIPE_WEBHOOK_SECRET"
        )!,
        undefined,
        cryptoProvider
      )
  } catch (error) {
    console.error(
      "STRIPE WEBHOOK SIGNATURE ERROR:",
      error
    )

    return new Response(
      "Invalid Stripe signature",
      {
        status: 400,
      }
    )
  }

  console.log(
    "STRIPE EVENT:",
    event.id,
    event.type
  )

  try {
    switch (event.type) {
      /*
       * Normal card Checkout payment.
       */
      case "checkout.session.completed": {
        const session =
          event.data.object as Stripe.Checkout.Session

        /*
         * Don't mark it paid unless Stripe
         * actually reports payment as paid.
         */
        if (
          session.payment_status !==
          "paid"
        ) {
          console.log(
            "CHECKOUT COMPLETED BUT NOT PAID:",
            session.id,
            session.payment_status
          )

          break
        }

        await markRegistrationPaid(
          session
        )

        break
      }


      /*
       * Delayed/asynchronous payment success.
       */
      case "checkout.session.async_payment_succeeded": {
        const session =
          event.data.object as Stripe.Checkout.Session

        await markRegistrationPaid(
          session
        )

        break
      }


      /*
       * Delayed/asynchronous payment failure.
       */
      case "checkout.session.async_payment_failed": {
        const session =
          event.data.object as Stripe.Checkout.Session

        const registrationId =
          session.metadata
            ?.registration_id

        if (!registrationId) {
          console.error(
            "FAILED PAYMENT MISSING REGISTRATION ID:",
            session.id
          )

          break
        }

        const {
          error: failedUpdateError,
        } = await supabaseAdmin
          .from(
            "tournament_registrations"
          )
          .update({
            payment_status:
              "failed",
          })
          .eq(
            "id",
            registrationId
          )
          .neq(
            "payment_status",
            "paid"
          )

        if (failedUpdateError) {
          throw failedUpdateError
        }

        console.log(
          "REGISTRATION PAYMENT FAILED:",
          registrationId
        )

        break
      }


      /*
       * Abandoned / expired checkout.
       */
      case "checkout.session.expired": {
        const session =
          event.data.object as Stripe.Checkout.Session

        const registrationId =
          session.metadata
            ?.registration_id

        if (!registrationId) {
          break
        }

        /*
         * Move pending back to unpaid so
         * checkout can be attempted again.
         */
        const {
          error: expiredUpdateError,
        } = await supabaseAdmin
          .from(
            "tournament_registrations"
          )
          .update({
            payment_status:
              "unpaid",
          })
          .eq(
            "id",
            registrationId
          )
          .eq(
            "payment_status",
            "pending"
          )

        if (expiredUpdateError) {
          throw expiredUpdateError
        }

        console.log(
          "REGISTRATION CHECKOUT EXPIRED:",
          registrationId
        )

        break
      }


      default:
        console.log(
          "UNHANDLED STRIPE EVENT:",
          event.type
        )
    }


    return new Response(
      JSON.stringify({
        received: true,
      }),
      {
        status: 200,

        headers: {
          "Content-Type":
            "application/json",
        },
      }
    )
  } catch (error) {
    console.error(
      "STRIPE WEBHOOK PROCESSING ERROR:",
      error
    )

    return new Response(
      "Webhook processing failed",
      {
        status: 500,
      }
    )
  }
})


async function markRegistrationPaid(
  session: Stripe.Checkout.Session
) {
  const registrationId =
    session.metadata
      ?.registration_id

  if (!registrationId) {
    throw new Error(
      `Stripe session ${session.id} is missing registration_id metadata.`
    )
  }


  /*
   * Load the registration and team information.
   *
   * This is our trusted DB snapshot.
   */
  const {
    data: registration,
    error: registrationError,
  } = await supabaseAdmin
    .from(
      "tournament_registrations"
    )
    .select(`
      id,
      tournament_id,
      division_id,
      team_id,
      organization_id,
      registration_fee_cents,
      payment_status,

      teams (
        name,
        city,
        state
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

    throw new Error(
      `Registration ${registrationId} could not be loaded.`
    )
  }


  /*
   * Verify Stripe amount against our
   * trusted registration snapshot.
   */
  if (
    session.amount_total !==
    registration.registration_fee_cents
  ) {
    console.error(
      "PAYMENT AMOUNT MISMATCH:",
      {
        registrationId,

        expected:
          registration.registration_fee_cents,

        stripeAmount:
          session.amount_total,
      }
    )

    throw new Error(
      "Stripe payment amount does not match registration fee."
    )
  }


  let paymentIntentId:
    string | null = null


  if (
    typeof session.payment_intent ===
    "string"
  ) {
    paymentIntentId =
      session.payment_intent
  } else if (
    session.payment_intent &&
    typeof session.payment_intent ===
      "object"
  ) {
    paymentIntentId =
      session.payment_intent.id
  }


  /*
   * Mark registration paid.
   *
   * Only the Stripe webhook should perform
   * this state transition.
   */
  const {
    error: updateError,
  } = await supabaseAdmin
    .from(
      "tournament_registrations"
    )
    .update({
      payment_status:
        "paid",

      amount_paid_cents:
        session.amount_total ?? 0,

      paid_at:
        new Date().toISOString(),

      stripe_checkout_session_id:
        session.id,

      stripe_payment_intent_id:
        paymentIntentId,
    })
    .eq(
      "id",
      registrationId
    )


  if (updateError) {
    console.error(
      "PAYMENT UPDATE ERROR:",
      updateError
    )

    throw updateError
  }


  console.log(
    "REGISTRATION PAID:",
    {
      registrationId,

      checkoutSessionId:
        session.id,

      paymentIntentId,

      amount:
        session.amount_total,
    }
  )


  /*
   * =====================================================
   * CREATE TOURNAMENT PARTICIPANT
   * =====================================================
   *
   * Payment has now been verified.
   *
   * Only now should this team become a
   * tournament participant.
   *
   * First check whether Stripe already caused
   * this participant to be created.
   *
   * Webhooks can be delivered more than once,
   * so this needs to be idempotent.
   */
  const {
    data: existingTournamentTeam,
    error: existingTeamError,
  } = await supabaseAdmin
    .from(
      "tournament_teams"
    )
    .select(`
      id,
      registration_id
    `)
    .eq(
      "tournament_id",
      registration.tournament_id
    )
    .eq(
      "division_id",
      registration.division_id
    )
    .eq(
      "team_id",
      registration.team_id
    )
    .maybeSingle()


  if (existingTeamError) {
    console.error(
      "TOURNAMENT TEAM LOOKUP ERROR:",
      existingTeamError
    )

    throw existingTeamError
  }


  /*
   * Already created.
   *
   * This can happen when Stripe retries a
   * webhook. Do not create a duplicate.
   */
  if (existingTournamentTeam) {
    console.log(
      "TOURNAMENT TEAM ALREADY EXISTS:",
      {
        tournamentTeamId:
          existingTournamentTeam.id,

        registrationId:
          registration.id,

        teamId:
          registration.team_id,
      }
    )

    return
  }


  /*
   * Supabase relation joins may be typed as
   * an object or array depending on generated
   * relationship metadata, so normalize it.
   */
  const teamRelation =
    registration.teams

  const team =
    Array.isArray(teamRelation)
      ? teamRelation[0]
      : teamRelation


  /*
   * Create the actual tournament participant.
   *
   * Status remains pending because payment
   * success does NOT equal tournament approval.
   *
   * Platform admin still reviews registration.
   */
  const {
    data: tournamentTeam,
    error: teamEntryError,
  } = await supabaseAdmin
    .from(
      "tournament_teams"
    )
    .insert({
      tournament_id:
        registration.tournament_id,

      division_id:
        registration.division_id,

      team_id:
        registration.team_id,

      display_name:
        team?.name ??
        "Team",

      city:
        team?.city ??
        null,

      state:
        team?.state ??
        null,

      status:
        "pending",

      registration_id:
        registration.id,
    })
    .select(`
      id,
      tournament_id,
      division_id,
      team_id,
      registration_id,
      status
    `)
    .single()


  if (teamEntryError) {
    console.error(
      "TOURNAMENT TEAM CREATE ERROR:",
      teamEntryError
    )

    throw teamEntryError
  }


  console.log(
    "TOURNAMENT PARTICIPANT CREATED:",
    {
      tournamentTeamId:
        tournamentTeam.id,

      registrationId:
        registration.id,

      teamId:
        registration.team_id,

      tournamentId:
        registration.tournament_id,

      divisionId:
        registration.division_id,

      status:
        tournamentTeam.status,
    }
  )
}