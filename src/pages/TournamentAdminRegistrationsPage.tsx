import { useEffect, useMemo, useState } from "react"

import {
  ArrowLeft,
  CheckCircle2,
  Clock3,
  ShieldCheck,
  Trophy,
  Users,
  XCircle,
} from "lucide-react"

import {
  Link,
  useParams,
} from "react-router-dom"

import { Button } from "@/components/ui/button"
import { supabase } from "@/lib/supabase"

type Tournament = {
  id: string
  name: string
  city: string | null
  state: string | null
  start_date: string
  end_date: string
  status: string
}

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
    city: string | null
    state: string | null
  } | null

  division: {
    id: string
    name: string
    age_group: string
    classification: string | null
  } | null
}

type RosterSubmission = {
  id: string
  tournament_registration_id: string
  status: string
  submitted_at: string | null
  reviewed_at: string | null
  locked_at: string | null
}

type RegistrationWithRoster =
  Registration & {
    roster_submission:
      | RosterSubmission
      | null

    roster_player_count:
      number
  }

export function TournamentAdminRegistrationsPage() {
  const {
    tournamentId,
  } = useParams()

  const [
    tournament,
    setTournament,
  ] =
    useState<Tournament | null>(
      null
    )

  const [
    registrations,
    setRegistrations,
  ] =
    useState<
      RegistrationWithRoster[]
    >([])

  const [loading, setLoading] =
    useState(true)

  const [error, setError] =
    useState("")

  const [
    reviewingRegistrationId,
    setReviewingRegistrationId,
  ] =
    useState<string | null>(null)

  useEffect(() => {
    void loadPage()
  }, [tournamentId])

  async function loadPage() {
    if (!tournamentId) {
      setError(
        "Missing tournament ID."
      )

      setLoading(false)
      return
    }

    setLoading(true)
    setError("")

    // =========================
    // LOAD TOURNAMENT
    // =========================

    const {
      data: tournamentData,
      error: tournamentError,
    } =
      await supabase
        .from("tournaments")
        .select(`
          id,
          name,
          city,
          state,
          start_date,
          end_date,
          status
        `)
        .eq(
          "id",
          tournamentId
        )
        .maybeSingle()

    if (tournamentError) {
      setError(
        tournamentError.message
      )

      setLoading(false)
      return
    }

    if (!tournamentData) {
      setError(
        "Tournament not found."
      )

      setLoading(false)
      return
    }

    setTournament(
      tournamentData
    )

    // =========================
    // LOAD REGISTRATIONS
    // =========================

    const {
      data:
        registrationRows,
      error:
        registrationError,
    } =
      await supabase
        .from(
          "tournament_registrations"
        )
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
            classification,
            city,
            state
          ),

          division:tournament_divisions (
            id,
            name,
            age_group,
            classification
          )
        `)
        .eq(
          "tournament_id",
          tournamentId
        )
        .order(
          "created_at",
          {
            ascending: false,
          }
        )

    if (
      registrationError
    ) {
      setError(
        registrationError.message
      )

      setLoading(false)
      return
    }

    const normalized =
      (
        registrationRows ??
        []
      ) as unknown as Registration[]

    // =========================
    // LOAD ROSTER SUBMISSIONS
    // =========================

    const registrationIds =
      normalized.map(
        (registration) =>
          registration.id
      )

    let rosterSubmissionRows:
      RosterSubmission[] = []

    if (
      registrationIds.length >
      0
    ) {
      const {
        data,
        error:
          rosterSubmissionError,
      } =
        await supabase
          .from(
            "tournament_roster_submissions"
          )
          .select(`
            id,
            tournament_registration_id,
            status,
            submitted_at,
            reviewed_at,
            locked_at
          `)
          .in(
            "tournament_registration_id",
            registrationIds
          )

      if (
        rosterSubmissionError
      ) {
        setError(
          rosterSubmissionError.message
        )

        setLoading(false)
        return
      }

      rosterSubmissionRows =
        (data ??
          []) as RosterSubmission[]
    }

    // =========================
    // LOAD ROSTER PLAYER COUNTS
    // =========================

    const submissionIds =
      rosterSubmissionRows.map(
        (submission) =>
          submission.id
      )

    const playerCountMap =
      new Map<
        string,
        number
      >()

    if (
      submissionIds.length > 0
    ) {
      const {
        data:
          rosterPlayerRows,
        error:
          rosterPlayerError,
      } =
        await supabase
          .from(
            "tournament_roster_players"
          )
          .select(`
            id,
            submission_id
          `)
          .in(
            "submission_id",
            submissionIds
          )

      if (
        rosterPlayerError
      ) {
        setError(
          rosterPlayerError.message
        )

        setLoading(false)
        return
      }

      for (
        const row of
        rosterPlayerRows ?? []
      ) {
        const current =
          playerCountMap.get(
            row.submission_id
          ) ?? 0

        playerCountMap.set(
          row.submission_id,
          current + 1
        )
      }
    }

    const finalRows:
      RegistrationWithRoster[] =
      normalized.map(
        (registration) => {
          const submission =
            rosterSubmissionRows.find(
              (row) =>
                row.tournament_registration_id ===
                registration.id
            ) ?? null

          return {
            ...registration,

            roster_submission:
              submission,

            roster_player_count:
              submission
                ? playerCountMap.get(
                    submission.id
                  ) ?? 0
                : 0,
          }
        }
      )

    setRegistrations(
      finalRows
    )

    setLoading(false)
  }

  async function handleReviewRegistration(
    registrationId: string,
    newStatus:
      | "approved"
      | "waitlisted"
      | "declined"
  ) {
    const actionLabel =
      newStatus === "approved"
        ? "approve"
        : newStatus ===
            "waitlisted"
          ? "waitlist"
          : "decline"

    const confirmed =
      window.confirm(
        `Are you sure you want to ${actionLabel} this registration?`
      )

    if (!confirmed) {
      return
    }

    setReviewingRegistrationId(
      registrationId
    )

    setError("")

    const {
      data,
      error:
        reviewError,
    } =
      await supabase.rpc(
        "review_tournament_registration",
        {
          target_registration_id:
            registrationId,

          new_status:
            newStatus,
        }
      )

    if (reviewError) {
      console.error(
        "REGISTRATION REVIEW ERROR:",
        reviewError
      )

      setError(
        reviewError.message
      )

      setReviewingRegistrationId(
        null
      )

      return
    }

    const updated =
      Array.isArray(data)
        ? data[0]
        : data

    if (updated) {
      setRegistrations(
        (current) =>
          current.map(
            (registration) =>
              registration.id ===
              registrationId
                ? {
                    ...registration,

                    status:
                      updated.status,
                  }
                : registration
          )
      )
    }

    setReviewingRegistrationId(
      null
    )
  }

  const submittedCount =
    useMemo(
      () =>
        registrations.filter(
          (registration) =>
            registration.status ===
            "submitted"
        ).length,
      [registrations]
    )

  const approvedCount =
    useMemo(
      () =>
        registrations.filter(
          (registration) =>
            registration.status ===
            "approved"
        ).length,
      [registrations]
    )

  const waitlistCount =
    useMemo(
      () =>
        registrations.filter(
          (registration) =>
            registration.status ===
            "waitlisted"
        ).length,
      [registrations]
    )

  if (loading) {
    return (
      <main className="min-h-screen bg-scoreboard-dark px-6 py-12 text-scoreboard-cream">

        <div className="mx-auto max-w-7xl">

          <p className="scoreboard-label">
            Loading Tournament Registrations...
          </p>

        </div>

      </main>
    )
  }

  if (
    error &&
    !tournament
  ) {
    return (
      <main className="min-h-screen bg-scoreboard-dark px-6 py-12 text-scoreboard-cream">

        <div className="mx-auto max-w-7xl">

          <div className="border border-scoreboard-red/60 bg-scoreboard-green p-6">

            <p className="scoreboard-label text-scoreboard-amber">
              Unable To Load Tournament
            </p>

            <p className="mt-3 text-sm text-scoreboard-muted">
              {error}
            </p>

          </div>

        </div>

      </main>
    )
  }

  if (!tournament) {
    return null
  }

  return (
    <main className="min-h-screen bg-scoreboard-dark text-scoreboard-cream">

      {/* =========================
          HEADER
      ========================= */}

      <section className="border-b border-scoreboard-cream/20 bg-scoreboard-green">

        <div className="mx-auto max-w-7xl px-6 py-10">

          <Link
            to={`/tournaments/${tournament.id}`}
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

            Tournament
          </Link>

          <p className="scoreboard-label mt-8 text-scoreboard-amber">
            Tournament Admin
          </p>

          <h1 className="mt-3 text-4xl font-black uppercase tracking-[0.05em]">
            {tournament.name}
          </h1>

          <p className="mt-3 text-sm text-scoreboard-muted">
            Registrations & roster submissions
          </p>

        </div>

      </section>

      {/* =========================
          SUMMARY
      ========================= */}

      <section className="mx-auto max-w-7xl px-6 py-8">

        <div className="grid border-l border-t border-scoreboard-cream/25 sm:grid-cols-2 lg:grid-cols-4">

          <SummaryCard
            label="Registrations"
            value={
              registrations.length
            }
            icon={Users}
          />

          <SummaryCard
            label="Submitted"
            value={
              submittedCount
            }
            icon={Clock3}
          />

          <SummaryCard
            label="Approved"
            value={
              approvedCount
            }
            icon={
              CheckCircle2
            }
          />

          <SummaryCard
            label="Waitlist"
            value={
              waitlistCount
            }
            icon={Trophy}
          />

        </div>

      </section>

      {/* =========================
          ERROR
      ========================= */}

      {error && (
        <section className="mx-auto max-w-7xl px-6">

          <div className="border border-scoreboard-red/60 bg-scoreboard-green p-4">

            <p className="text-sm text-scoreboard-muted">
              {error}
            </p>

          </div>

        </section>
      )}

      {/* =========================
          REGISTRATIONS
      ========================= */}

      <section className="mx-auto max-w-7xl px-6 pb-14">

        <div className="scoreboard-panel p-4">

          <div className="border border-scoreboard-cream/30 bg-scoreboard-green">

            <div className="border-b border-scoreboard-cream/20 p-6">

              <p className="scoreboard-label text-scoreboard-amber">
                Team Entries
              </p>

              <h2 className="mt-2 text-2xl font-black uppercase tracking-[0.06em]">
                Registrations
              </h2>

            </div>

            {registrations.length ===
            0 ? (
              <div className="p-10 text-center">

                <Trophy className="mx-auto h-10 w-10 text-scoreboard-amber" />

                <h3 className="mt-5 text-xl font-black uppercase">
                  No Registrations Yet
                </h3>

                <p className="mt-3 text-sm text-scoreboard-muted">
                  Team registrations will appear here.
                </p>

              </div>
            ) : (
              <div className="divide-y divide-scoreboard-cream/15">

                {registrations.map(
                  (
                    registration
                  ) => {
                    const team =
                      registration.team

                    const division =
                      registration.division

                    const roster =
                      registration.roster_submission

                    const isReviewing =
                      reviewingRegistrationId ===
                      registration.id

                    return (
                      <article
                        key={
                          registration.id
                        }
                        className="p-6"
                      >

                        <div className="grid gap-6 xl:grid-cols-[1.1fr_.9fr]">

                          {/* LEFT */}

                          <div>

                            <div className="flex flex-wrap items-center gap-3">

                              <p className="text-xl font-black uppercase tracking-[0.05em]">
                                {team?.name ??
                                  "Team"}
                              </p>

                              <StatusBadge
                                label={
                                  registration.status
                                }
                                tone={
                                  registration.status ===
                                  "approved"
                                    ? "good"
                                    : registration.status ===
                                        "declined"
                                      ? "danger"
                                      : registration.status ===
                                          "waitlisted"
                                        ? "warning"
                                        : "muted"
                                }
                              />

                            </div>

                            <p className="mt-2 text-sm text-scoreboard-muted">
                              {[
                                division?.age_group,
                                division?.name,
                                team?.classification,
                              ]
                                .filter(
                                  Boolean
                                )
                                .join(
                                  " • "
                                )}
                            </p>

                            {(team?.city ||
                              team?.state) && (
                              <p className="mt-1 text-xs text-scoreboard-muted">
                                {[
                                  team.city,
                                  team.state,
                                ]
                                  .filter(
                                    Boolean
                                  )
                                  .join(
                                    ", "
                                  )}
                              </p>
                            )}

                            <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">

                              <InfoStat
                                label="Payment"
                                value={
                                  registration.payment_status
                                }
                              />

                              <InfoStat
                                label="Roster"
                                value={
                                  roster?.status ??
                                  "not built"
                                }
                              />

                              <InfoStat
                                label="Players"
                                value={String(
                                  registration.roster_player_count
                                )}
                              />

                              <InfoStat
                                label="Fee"
                                value={`$${(
                                  registration.registration_fee_cents /
                                  100
                                ).toFixed(
                                  2
                                )}`}
                              />

                            </div>

                            <div className="mt-5 flex flex-wrap gap-2">

                              <ComplianceBadge
                                label="Insurance"
                                complete={
                                  registration.insurance_attested
                                }
                              />

                              <ComplianceBadge
                                label="Eligibility"
                                complete={
                                  registration.eligibility_attested
                                }
                              />

                              <ComplianceBadge
                                label="Terms"
                                complete={
                                  registration.terms_accepted
                                }
                              />

                              <ComplianceBadge
                                label="Waiver"
                                complete={
                                  registration.waiver_accepted
                                }
                              />

                            </div>

                          </div>

                          {/* RIGHT */}

                          <div className="border-t border-scoreboard-cream/15 pt-5 xl:border-l xl:border-t-0 xl:pl-6 xl:pt-0">

                            <p className="scoreboard-label text-scoreboard-amber">
                              Director Actions
                            </p>

                            {registration.status ===
                              "submitted" ||
                            registration.status ===
                              "waitlisted" ? (
                              <div className="mt-4 grid gap-2 sm:grid-cols-3 xl:grid-cols-1">

                                <Button
                                  type="button"
                                  disabled={
                                    isReviewing
                                  }
                                  onClick={() =>
                                    handleReviewRegistration(
                                      registration.id,
                                      "approved"
                                    )
                                  }
                                  className="
                                    rounded-none
                                    bg-scoreboard-amber
                                    font-black
                                    uppercase
                                    tracking-[0.10em]
                                    text-scoreboard-dark
                                    hover:bg-scoreboard-cream
                                  "
                                >
                                  <CheckCircle2 className="mr-2 h-4 w-4" />

                                  Approve
                                </Button>

                                <Button
                                  type="button"
                                  disabled={
                                    isReviewing
                                  }
                                  onClick={() =>
                                    handleReviewRegistration(
                                      registration.id,
                                      "waitlisted"
                                    )
                                  }
                                  variant="outline"
                                  className="
                                    rounded-none
                                    border-scoreboard-cream/30
                                    bg-transparent
                                    font-black
                                    uppercase
                                    tracking-[0.10em]
                                    text-scoreboard-cream
                                    hover:border-scoreboard-amber
                                    hover:text-scoreboard-amber
                                  "
                                >
                                  <Clock3 className="mr-2 h-4 w-4" />

                                  Waitlist
                                </Button>

                                <Button
                                  type="button"
                                  disabled={
                                    isReviewing
                                  }
                                  onClick={() =>
                                    handleReviewRegistration(
                                      registration.id,
                                      "declined"
                                    )
                                  }
                                  variant="outline"
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

                                  Decline
                                </Button>

                              </div>
                            ) : (
                              <div className="mt-4">

                                <StatusBadge
                                  label={
                                    registration.status
                                  }
                                  tone={
                                    registration.status ===
                                    "approved"
                                      ? "good"
                                      : registration.status ===
                                          "declined"
                                        ? "danger"
                                        : "muted"
                                  }
                                />

                              </div>
                            )}

                            <div className="mt-5 border-t border-scoreboard-cream/15 pt-5">

                              {roster ? (
                                <>
                                <Link
                                  to={`/dashboard/tournaments/${tournamentId}/registrations/${registration.id}/roster`}
                                  className="
                                    flex
                                    min-h-11
                                    items-center
                                    justify-between
                                    border
                                    border-scoreboard-cream/30
                                    px-4
                                    text-xs
                                    font-black
                                    uppercase
                                    tracking-[0.10em]
                                    text-scoreboard-cream
                                    hover:border-scoreboard-amber
                                    hover:text-scoreboard-amber
                                  "
                                >
                                  Review Roster

                                  <ShieldCheck className="h-4 w-4" />
                                </Link>
                                <Link
                                to={`/dashboard/tournaments/${tournamentId}/pools`}
                                className="
                                 flex
                                    min-h-11
                                    items-center
                                    justify-between
                                    border
                                    border-scoreboard-cream/30
                                    px-4
                                    text-xs
                                    font-black
                                    uppercase
                                    tracking-[0.10em]
                                    text-scoreboard-cream
                                    hover:border-scoreboard-amber
                                    hover:text-scoreboard-amber
                                "
                              >
                                Manage Pools
                              </Link>
</>
                                
                              ) : (
                                <p className="text-xs uppercase tracking-[0.10em] text-scoreboard-muted">
                                  No tournament roster submitted yet.
                                </p>
                              )}

                            </div>

                          </div>

                        </div>

                      </article>
                    )
                  }
                )}

              </div>
            )}

          </div>

        </div>

      </section>

    </main>
  )
}

function SummaryCard({
  label,
  value,
  icon: Icon,
}: {
  label: string
  value: number
  icon: typeof Users
}) {
  return (
    <div className="border-b border-r border-scoreboard-cream/25 bg-scoreboard-green p-6">

      <div className="flex items-center justify-between">

        <p className="scoreboard-label">
          {label}
        </p>

        <Icon className="h-5 w-5 text-scoreboard-amber" />

      </div>

      <p className="scoreboard-number mt-4 text-4xl">
        {value}
      </p>

    </div>
  )
}

function InfoStat({
  label,
  value,
}: {
  label: string
  value: string
}) {
  return (
    <div className="border border-scoreboard-cream/20 bg-scoreboard-dark/20 p-3">

      <p className="scoreboard-label text-scoreboard-muted">
        {label}
      </p>

      <p className="mt-2 text-xs font-black uppercase text-scoreboard-cream">
        {value.replaceAll(
          "_",
          " "
        )}
      </p>

    </div>
  )
}

function ComplianceBadge({
  label,
  complete,
}: {
  label: string
  complete: boolean
}) {
  return (
    <span
      className={`
        inline-flex
        items-center
        gap-2
        border
        px-2
        py-1
        text-[9px]
        font-black
        uppercase
        tracking-[0.10em]

        ${
          complete
            ? "border-scoreboard-amber/50 text-scoreboard-amber"
            : "border-scoreboard-red/50 text-scoreboard-red"
        }
      `}
    >
      {complete
        ? "✓"
        : "!"}

      {label}
    </span>
  )
}

function StatusBadge({
  label,
  tone = "muted",
}: {
  label: string

  tone?:
    | "good"
    | "warning"
    | "danger"
    | "muted"
}) {
  const toneClasses = {
    good:
      "border-scoreboard-amber/60 text-scoreboard-amber",

    warning:
      "border-scoreboard-cream/50 text-scoreboard-cream",

    danger:
      "border-scoreboard-red/60 text-scoreboard-red",

    muted:
      "border-scoreboard-muted/40 text-scoreboard-muted",
  }

  return (
    <span
      className={`
        inline-flex
        border
        bg-scoreboard-dark
        px-2
        py-1
        text-[9px]
        font-black
        uppercase
        tracking-[0.10em]
        ${toneClasses[tone]}
      `}
    >
      {label.replaceAll(
        "_",
        " "
      )}
    </span>
  )
}