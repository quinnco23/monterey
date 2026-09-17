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
   * IMPORTANT:
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
       * Normal card Checkout payments will
       * normally arrive here.
       */
      case "checkout.session.completed": {
        const session =
          event.data.object as Stripe.Checkout.Session

        /*
         * Don't mark it paid unless Stripe
         * actually reports payment as paid.
         *
         * This matters if we later enable
         * asynchronous payment methods.
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
       * Useful later if Stripe Checkout allows
       * delayed/asynchronous payment methods.
       */
      case "checkout.session.async_payment_succeeded": {
        const session =
          event.data.object as Stripe.Checkout.Session

        await markRegistrationPaid(
          session
        )

        break
      }


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

        break
      }


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
         * An expired checkout isn't a successful
         * payment. We move pending back to unpaid
         * so the team can try again later.
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
   * Load the registration before updating it.
   * This lets us verify Stripe charged the
   * expected amount.
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
      registration_fee_cents,
      payment_status
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
   * Verify Stripe's amount against our
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
}