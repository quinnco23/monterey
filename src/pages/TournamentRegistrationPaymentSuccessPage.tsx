import {
    useEffect,
    useState,
  } from "react"
  
  import {
    CheckCircle2,
    Clock3,
    ReceiptText,
  } from "lucide-react"
  
  import {
    Link,
    useParams,
  } from "react-router-dom"
  
  import { supabase } from "@/lib/supabase"
  
  
  type Registration = {
    id: string
    tournament_id: string
    division_id: string
    team_id: string
  
    status: string
  
    payment_status: string
    registration_fee_cents: number
    amount_paid_cents: number
  
    paid_at: string | null
  
    tournament: {
      name: string
    } | null
  
    division: {
      name: string
      age_group: string
    } | null
  
    team: {
      name: string
    } | null
  }
  
  
  export function TournamentRegistrationPaymentSuccessPage() {
    const {
      tournamentId,
      registrationId,
    } = useParams()
  
    const [
      registration,
      setRegistration,
    ] = useState<Registration | null>(
      null
    )
  
    const [
      loading,
      setLoading,
    ] = useState(true)
  
    const [
      error,
      setError,
    ] = useState("")
  
  
    useEffect(() => {
      if (
        !tournamentId ||
        !registrationId
      ) {
        setError(
          "Registration could not be identified."
        )
  
        setLoading(false)
        return
      }
  
      void loadRegistration()
    }, [
      tournamentId,
      registrationId,
    ])
  
  
    async function loadRegistration() {
      if (
        !tournamentId ||
        !registrationId
      ) {
        return
      }
  
      setLoading(true)
      setError("")
  
      const {
        data,
        error: registrationError,
      } = await supabase
        .from(
          "tournament_registrations"
        )
        .select(`
          id,
          tournament_id,
          division_id,
          team_id,
          status,
          payment_status,
          registration_fee_cents,
          amount_paid_cents,
          paid_at,
  
          tournament:tournaments (
            name
          ),
  
          division:tournament_divisions (
            name,
            age_group
          ),
  
          team:teams (
            name
          )
        `)
        .eq(
          "id",
          registrationId
        )
        .eq(
          "tournament_id",
          tournamentId
        )
        .single()
  
      if (registrationError) {
        console.error(
          "REGISTRATION SUCCESS LOAD ERROR:",
          registrationError
        )
  
        setError(
          registrationError.message
        )
  
        setLoading(false)
        return
      }
  
      setRegistration(
        data as unknown as Registration
      )
  
      setLoading(false)
    }
  
  
    if (loading) {
      return (
        <main className="min-h-screen bg-scoreboard-dark px-4 py-12 text-scoreboard-cream sm:px-6">
  
          <div className="mx-auto max-w-3xl">
  
            <p className="scoreboard-label">
              Confirming Registration...
            </p>
  
          </div>
  
        </main>
      )
    }
  
  
    if (
      error ||
      !registration
    ) {
      return (
        <main className="min-h-screen bg-scoreboard-dark px-4 py-12 text-scoreboard-cream sm:px-6">
  
          <div className="mx-auto max-w-3xl">
  
            <div className="border border-scoreboard-red/60 bg-scoreboard-green p-6">
  
              <p className="scoreboard-label text-scoreboard-amber">
                Registration
              </p>
  
              <h1 className="mt-3 text-2xl font-black uppercase">
                Unable To Confirm Registration
              </h1>
  
              <p className="mt-3 text-sm text-scoreboard-muted">
                {error ||
                  "Registration could not be loaded."}
              </p>
  
            </div>
  
          </div>
  
        </main>
      )
    }
  
  
    const paymentPaid =
      registration.payment_status ===
      "paid"
  
    const fee =
      registration.registration_fee_cents /
      100
  
    const amountPaid =
      registration.amount_paid_cents /
      100
  
  
    return (
      <main className="min-h-screen bg-scoreboard-dark text-scoreboard-cream">
  
        <section className="border-b border-scoreboard-cream/20 bg-scoreboard-green">
  
          <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
  
            <p className="scoreboard-label text-scoreboard-amber">
              Tournament Registration
            </p>
  
            <h1 className="mt-3 text-3xl font-black uppercase tracking-[0.05em] sm:text-4xl">
              Registration Received
            </h1>
  
            <p className="mt-3 text-sm text-scoreboard-muted">
              Your tournament entry has been submitted.
            </p>
  
          </div>
  
        </section>
  
  
        <section className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
  
          <div className="border border-scoreboard-cream/25 bg-scoreboard-green">
  
            {/* PAYMENT STATUS */}
  
            <div className="border-b border-scoreboard-cream/20 p-6">
  
              <div className="flex items-start gap-4">
  
                {paymentPaid ? (
                  <CheckCircle2 className="mt-1 h-7 w-7 shrink-0 text-scoreboard-amber" />
                ) : (
                  <Clock3 className="mt-1 h-7 w-7 shrink-0 text-scoreboard-amber" />
                )}
  
                <div>
  
                  <p className="scoreboard-label text-scoreboard-amber">
                    Payment
                  </p>
  
                  <h2 className="mt-2 text-2xl font-black uppercase tracking-[0.05em]">
                    {paymentPaid
                      ? "Payment Confirmed"
                      : "Payment Processing"}
                  </h2>
  
                  <p className="mt-2 text-sm text-scoreboard-muted">
                    {paymentPaid
                      ? "Stripe has confirmed your tournament registration payment."
                      : "Your payment has not been confirmed yet."}
                  </p>
  
                </div>
  
              </div>
  
            </div>
  
  
            {/* REGISTRATION DETAILS */}
  
            <div className="p-6">
  
              <div className="flex items-center gap-3">
  
                <ReceiptText className="h-5 w-5 text-scoreboard-amber" />
  
                <p className="scoreboard-label text-scoreboard-amber">
                  Registration Details
                </p>
  
              </div>
  
  
              <dl className="mt-6 divide-y divide-scoreboard-cream/15">
  
              <DetailRow
  label="Tournament"
  value={
    registration.tournament?.name ??
    "Tournament"
  }
/>

<DetailRow
  label="Team"
  value={
    registration.team?.name ??
    "Team"
  }
/>

<DetailRow
  label="Division"
  value={[
    registration.division?.age_group,
    registration.division?.name,
  ]
    .filter(Boolean)
    .join(" • ")}
/>
  
                <DetailRow
                  label="Registration Status"
                  value={
                    registration.status
                      .replaceAll("_", " ")
                      .toUpperCase()
                  }
                />
  
                <DetailRow
                  label="Payment Status"
                  value={
                    registration.payment_status
                      .replaceAll("_", " ")
                      .toUpperCase()
                  }
                />
  
                <DetailRow
                  label="Entry Fee"
                  value={`$${fee.toFixed(2)}`}
                />
  
                <DetailRow
                  label="Amount Paid"
                  value={`$${amountPaid.toFixed(2)}`}
                />
  
                {registration.paid_at && (
                  <DetailRow
                    label="Paid"
                    value={
                      new Date(
                        registration.paid_at
                      ).toLocaleString()
                    }
                  />
                )}
  
              </dl>
  
  
              {!paymentPaid && (
                <div className="mt-6 border border-scoreboard-amber/40 bg-scoreboard-dark p-4">
  
                  <p className="text-sm text-scoreboard-muted">
                    Stripe may still be confirming the payment. Refresh this page shortly to check the latest status.
                  </p>
  
                </div>
              )}
  
  
              <div className="mt-7 grid gap-3 sm:grid-cols-2">
  
                <button
                  type="button"
                  onClick={() =>
                    void loadRegistration()
                  }
                  className="
                    scoreboard-button
                    w-full
                  "
                >
                  Refresh Status
                </button>
  
  
                <Link
                  to="/dashboard"
                  className="
                    scoreboard-button
                    scoreboard-button-primary
                    flex
                    items-center
                    justify-center
                    text-center
                  "
                >
                  Dashboard
                </Link>
  
              </div>
  
            </div>
  
          </div>
  
        </section>
  
      </main>
    )
  }
  
  
  function DetailRow({
    label,
    value,
  }: {
    label: string
    value: string
  }) {
    return (
      <div className="grid gap-1 py-4 sm:grid-cols-[180px_1fr] sm:gap-5">
  
        <dt className="scoreboard-label">
          {label}
        </dt>
  
        <dd className="text-sm font-bold text-scoreboard-cream sm:text-right">
          {value || "—"}
        </dd>
  
      </div>
    )
  }