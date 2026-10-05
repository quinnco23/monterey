import {
    ArrowLeft,
    CalendarDays,
    CheckCircle2,
    CreditCard,
    ShieldCheck,
    Trophy,
    Users,
    XCircle,
  } from "lucide-react"
  
  import {
    Link,
    useParams,
  } from "react-router-dom"
  
  import {
    useEffect,
    useState,
  } from "react"
  
  import { Button } from "@/components/ui/button"
  import { supabase } from "@/lib/supabase"
  
  type Registration = {
    id: string
  
    tournament_id: string
    division_id: string
    team_id: string
    organization_id: string | null
  
    status: string
    payment_status: string
    registration_fee_cents: number
  
    insurance_provider: string | null
    insurance_policy_number: string | null
    insurance_expiration: string | null
  
    insurance_attested: boolean
    eligibility_attested: boolean
    terms_accepted: boolean
    waiver_accepted: boolean
  
    submitted_at: string | null
    created_at: string
  
    team: {
      id: string
      name: string
      age_group: string | null
      classification: string | null
    } | null
  
    division: {
      id: string
      name: string
      age_group: string
      classification: string | null
    } | null
  
    tournament: {
      id: string
      name: string
      city: string | null
      state: string | null
      start_date: string
      end_date: string
      status: string
    } | null
  }
  
  type RosterSubmission = {
    id: string
    status: string
    submitted_at: string | null
    reviewed_at: string | null
    locked_at: string | null
  }
  
  export function OrganizationTournamentRegistrationPage() {
    const {
      organizationId,
      registrationId,
    } = useParams()
  
    const [
      registration,
      setRegistration,
    ] = useState<Registration | null>(null)
  
    const [
      rosterSubmission,
      setRosterSubmission,
    ] = useState<RosterSubmission | null>(
      null
    )
  
    const [loading, setLoading] =
      useState(true)
  
    const [error, setError] =
      useState("")
  
    const [withdrawing, setWithdrawing] =
      useState(false)
  
    useEffect(() => {
      void loadRegistration()
    }, [
      organizationId,
      registrationId,
    ])
  
    async function loadRegistration() {
      if (
        !organizationId ||
        !registrationId
      ) {
        setError(
          "Missing registration information."
        )
  
        setLoading(false)
        return
      }
  
      setLoading(true)
      setError("")
  
      const {
        data,
        error: registrationError,
      } = await supabase
        .from("tournament_registrations")
        .select(`
          id,
          tournament_id,
          division_id,
          team_id,
          organization_id,
  
          status,
          payment_status,
          registration_fee_cents,
  
          insurance_provider,
          insurance_policy_number,
          insurance_expiration,
  
          insurance_attested,
          eligibility_attested,
          terms_accepted,
          waiver_accepted,
  
          submitted_at,
          created_at,
  
          team:teams (
            id,
            name,
            age_group,
            classification
          ),
  
          division:tournament_divisions (
            id,
            name,
            age_group,
            classification
          ),
  
          tournament:tournaments (
            id,
            name,
            city,
            state,
            start_date,
            end_date,
            status
          )
        `)
        .eq(
          "id",
          registrationId
        )
        .eq(
          "organization_id",
          organizationId
        )
        .maybeSingle()
  
      if (registrationError) {
        setError(
          registrationError.message
        )
  
        setLoading(false)
        return
      }
  
      if (!data) {
        setError(
          "Tournament registration not found."
        )
  
        setLoading(false)
        return
      }
  
      const normalized =
        data as unknown as Registration
  
      setRegistration(normalized)
  
      const {
        data: rosterData,
        error: rosterError,
      } = await supabase
        .from(
          "tournament_roster_submissions"
        )
        .select(`
          id,
          status,
          submitted_at,
          reviewed_at,
          locked_at
        `)
        .eq(
          "tournament_registration_id",
          registrationId
        )
        .maybeSingle()
  
      if (rosterError) {
        setError(
          rosterError.message
        )
  
        setLoading(false)
        return
      }
  
      setRosterSubmission(
        rosterData as RosterSubmission | null
      )
  
      setLoading(false)
    }
  
    async function handleWithdrawRegistration() {
      if (!registration) {
        return
      }
  
      const confirmed =
        window.confirm(
          `Withdraw ${registration.team?.name ?? "this team"} from ${registration.tournament?.name ?? "this tournament"}?`
        )
  
      if (!confirmed) {
        return
      }
  
      setWithdrawing(true)
      setError("")
  
      const {
        data,
        error: withdrawError,
      } = await supabase.rpc(
        "withdraw_tournament_registration",
        {
          target_registration_id:
            registration.id,
        }
      )
  
      if (withdrawError) {
        console.error(
          "WITHDRAW REGISTRATION ERROR:",
          withdrawError
        )
  
        setError(
          withdrawError.message
        )
  
        setWithdrawing(false)
        return
      }
  
      const updated =
        Array.isArray(data)
          ? data[0]
          : data
  
      if (updated) {
        setRegistration(
          (current) =>
            current
              ? {
                  ...current,
                  status:
                    updated.status,
                }
              : current
        )
      }
  
      setWithdrawing(false)
    }
  
    if (loading) {
      return (
        <main className="min-h-screen bg-scoreboard-dark px-6 py-12 text-scoreboard-cream">
          <div className="mx-auto max-w-5xl">
            <p className="scoreboard-label">
              Loading registration...
            </p>
          </div>
        </main>
      )
    }
  
    if (
      error &&
      !registration
    ) {
      return (
        <main className="min-h-screen bg-scoreboard-dark px-6 py-12 text-scoreboard-cream">
          <div className="mx-auto max-w-5xl">
            <div className="border border-scoreboard-red/50 bg-scoreboard-green p-6">
  
              <p className="scoreboard-label text-scoreboard-amber">
                Unable To Load Registration
              </p>
  
              <p className="mt-3 text-sm text-scoreboard-muted">
                {error}
              </p>
  
            </div>
          </div>
        </main>
      )
    }
  
    if (!registration) {
      return null
    }
  
    const tournament =
      registration.tournament
  
    const team =
      registration.team
  
    const division =
      registration.division
  
    const canWithdraw =
      registration.status === "submitted" ||
      registration.status === "waitlisted" ||
      registration.status === "approved"
  
    return (
      <main className="min-h-screen bg-scoreboard-dark text-scoreboard-cream">
  
        {/* HEADER */}
        <section className="border-b border-scoreboard-cream/20 bg-scoreboard-green">
  
          <div className="mx-auto max-w-5xl px-6 py-10">
  
            <Link
              to={`/dashboard/organizations/${organizationId}`}
              className="
                inline-flex
                items-center
                gap-2
                text-xs
                font-black
                uppercase
                tracking-[0.12em]
                text-scoreboard-muted
                hover:text-scoreboard-amber
              "
            >
              <ArrowLeft className="h-4 w-4" />
              Organization
            </Link>
  
            <p className="scoreboard-label mt-8 text-scoreboard-amber">
              Tournament Registration
            </p>
  
            <h1 className="mt-3 text-3xl font-black uppercase tracking-[0.05em] sm:text-4xl">
              {tournament?.name ??
                "Tournament"}
            </h1>
  
            <p className="mt-3 text-sm text-scoreboard-muted">
              {[
                team?.name,
                division?.age_group,
                division?.name,
              ]
                .filter(Boolean)
                .join(" • ")}
            </p>
  
          </div>
  
        </section>
  
        <section className="mx-auto max-w-5xl px-6 py-8">
  
          {error && (
            <div className="mb-6 border border-scoreboard-red/50 bg-scoreboard-green p-4">
              <p className="text-sm text-scoreboard-red">
                {error}
              </p>
            </div>
          )}
  
          {/* STATUS */}
          <div className="border border-scoreboard-cream/25 bg-scoreboard-green p-6">
  
            <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
  
              <div>
  
                <p className="scoreboard-label text-scoreboard-amber">
                  Registration Status
                </p>
  
                <h2 className="mt-2 text-2xl font-black uppercase tracking-[0.06em]">
                  {registration.status.replaceAll(
                    "_",
                    " "
                  )}
                </h2>
  
              </div>
  
              <Trophy className="h-6 w-6 text-scoreboard-amber" />
  
            </div>
  
            {tournament && (
              <div className="mt-6 border-t border-scoreboard-cream/20 pt-5">
  
                <div className="flex items-start gap-3">
  
                  <CalendarDays className="mt-0.5 h-4 w-4 text-scoreboard-amber" />
  
                  <div className="text-sm text-scoreboard-muted">
  
                    <p>
                      {new Date(
                        tournament.start_date
                      ).toLocaleDateString()}
  
                      {" – "}
  
                      {new Date(
                        tournament.end_date
                      ).toLocaleDateString()}
                    </p>
  
                    {(tournament.city ||
                      tournament.state) && (
                      <p className="mt-1">
                        {[
                          tournament.city,
                          tournament.state,
                        ]
                          .filter(Boolean)
                          .join(", ")}
                      </p>
                    )}
  
                  </div>
  
                </div>
  
              </div>
            )}
  
          </div>
  
          {/* REQUIREMENTS */}
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
  
            <RequirementCard
              icon={CreditCard}
              label="Payment"
              value={
                registration.payment_status
              }
              complete={
                registration.payment_status ===
                "paid"
              }
            />
  
            <RequirementCard
              icon={ShieldCheck}
              label="Insurance"
              value={
                registration.insurance_attested
                  ? "complete"
                  : "required"
              }
              complete={
                registration.insurance_attested
              }
            />
  
            <RequirementCard
              icon={Users}
              label="Eligibility"
              value={
                registration.eligibility_attested
                  ? "complete"
                  : "required"
              }
              complete={
                registration.eligibility_attested
              }
            />
  
            <RequirementCard
              icon={CheckCircle2}
              label="Terms & Waiver"
              value={
                registration.terms_accepted &&
                registration.waiver_accepted
                  ? "accepted"
                  : "required"
              }
              complete={
                registration.terms_accepted &&
                registration.waiver_accepted
              }
            />
  
          </div>
  
          {/* ROSTER */}
          <div className="mt-6 border border-scoreboard-cream/25 bg-scoreboard-green p-6">
  
            <p className="scoreboard-label text-scoreboard-amber">
              Tournament Roster
            </p>
  
            <div className="mt-3 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
  
              <div>
  
                <h2 className="text-xl font-black uppercase tracking-[0.05em]">
                  {rosterSubmission
                    ? rosterSubmission.status.replaceAll(
                        "_",
                        " "
                      )
                    : "Not Submitted"}
                </h2>
  
                <p className="mt-2 text-sm text-scoreboard-muted">
                  Manage the roster submitted specifically for this tournament.
                </p>
  
              </div>
  
              {rosterSubmission && (
                <Link
                  to={`/dashboard/tournaments/${registration.tournament_id}/registrations/${registration.id}/roster`}
                  className="
                    inline-flex
                    min-h-11
                    items-center
                    justify-center
                    border
                    border-scoreboard-cream/30
                    px-4
                    text-xs
                    font-black
                    uppercase
                    tracking-[0.10em]
                    hover:border-scoreboard-amber
                    hover:text-scoreboard-amber
                  "
                >
                  View Roster
                </Link>
              )}
  
            </div>
  
          </div>
  
          {/* REGISTRATION ACTIONS */}
          <div className="mt-6 border border-scoreboard-cream/25 bg-scoreboard-green p-6">
  
            <p className="scoreboard-label text-scoreboard-amber">
              Registration Actions
            </p>
  
            {registration.status ===
            "withdrawn" ? (
  
              <div className="mt-4 border border-scoreboard-cream/25 bg-scoreboard-dark/30 p-4">
  
                <p className="font-black uppercase tracking-wide text-scoreboard-muted">
                  Registration Withdrawn
                </p>
  
                <p className="mt-2 text-sm text-scoreboard-muted">
                  This team is no longer actively registered for this tournament.
                </p>
  
              </div>
  
            ) : canWithdraw ? (
  
              <div className="mt-4">
  
                <Button
                  type="button"
                  variant="outline"
                  disabled={withdrawing}
                  onClick={
                    handleWithdrawRegistration
                  }
                  className="
                    rounded-none
                    border-scoreboard-red/60
                    bg-transparent
                    font-black
                    uppercase
                    tracking-[0.10em]
                    text-scoreboard-red
                    hover:bg-scoreboard-red/10
                  "
                >
                  <XCircle className="mr-2 h-4 w-4" />
  
                  {withdrawing
                    ? "Withdrawing..."
                    : "Withdraw Registration"}
                </Button>
  
                <p className="mt-3 max-w-xl text-xs leading-5 text-scoreboard-muted">
                  Withdrawing removes this team from active tournament consideration.
                </p>
  
              </div>
  
            ) : (
  
              <p className="mt-4 text-sm text-scoreboard-muted">
                No registration actions are currently available.
              </p>
  
            )}
  
          </div>
  
        </section>
  
      </main>
    )
  }
  
  function RequirementCard({
    icon: Icon,
    label,
    value,
    complete,
  }: {
    icon: typeof ShieldCheck
    label: string
    value: string
    complete: boolean
  }) {
    return (
      <div className="border border-scoreboard-cream/25 bg-scoreboard-green p-5">
  
        <div className="flex items-center justify-between gap-4">
  
          <div>
  
            <p className="scoreboard-label text-scoreboard-muted">
              {label}
            </p>
  
            <p
              className={`
                mt-2
                text-sm
                font-black
                uppercase
                tracking-[0.06em]
                ${
                  complete
                    ? "text-scoreboard-amber"
                    : "text-scoreboard-red"
                }
              `}
            >
              {value.replaceAll(
                "_",
                " "
              )}
            </p>
  
          </div>
  
          <Icon
            className={`
              h-5
              w-5
              ${
                complete
                  ? "text-scoreboard-amber"
                  : "text-scoreboard-muted"
              }
            `}
          />
  
        </div>
  
      </div>
    )
  }