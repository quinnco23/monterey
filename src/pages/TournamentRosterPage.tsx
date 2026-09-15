import { useEffect, useMemo, useState } from "react"

import {
  ArrowLeft,
  CheckCircle2,
  RefreshCw,
  Send,
  ShieldCheck,
  Trophy,
  Users,
} from "lucide-react"

import {
  Link,
  useParams,
} from "react-router-dom"

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

  tournament: {
    id: string
    name: string
    start_date: string
    end_date: string
    city: string | null
    state: string | null
  } | null

  division: {
    id: string
    name: string
    age_group: string
    classification: string | null
  } | null

  team: {
    id: string
    name: string
    age_group: string | null
    classification: string | null
  } | null
}

type TeamRoster = {
  id: string
  name: string
  season_year: number
  season_type: string
  status: string
}

type TournamentRosterSubmission = {
  id: string
  tournament_registration_id: string
  tournament_id: string
  division_id: string
  team_id: string
  organization_id: string | null
  source_roster_id: string
  status: string
  submitted_by_user_id: string | null
  submitted_at: string | null
  reviewed_at: string | null
  locked_at: string | null
  notes: string | null
}

type TournamentRosterPlayer = {
  id: string
  submission_id: string

  player_id: string
  source_roster_player_id: string | null

  first_name: string
  last_name: string

  birth_date: string | null
  graduation_year: number | null

  jersey_number: string | null
  primary_position: string | null
  secondary_position: string | null

  source_invitation_status: string | null
  source_roster_status: string | null
  source_eligibility_status: string | null

  eligibility_status: string
  approval_status: string
}

export function TournamentRosterPage() {
  const {
    registrationId,
  } = useParams()

  const [registration, setRegistration] =
    useState<Registration | null>(null)

  const [currentRoster, setCurrentRoster] =
    useState<TeamRoster | null>(null)

  const [submission, setSubmission] =
    useState<TournamentRosterSubmission | null>(null)

  const [players, setPlayers] =
    useState<TournamentRosterPlayer[]>([])

  const [loading, setLoading] =
    useState(true)

  const [building, setBuilding] =
    useState(false)

  const [submitting, setSubmitting] =
    useState(false)

  const [error, setError] =
    useState("")

  useEffect(() => {
    async function loadPage() {
      if (!registrationId) {
        setError(
          "Missing tournament registration ID."
        )
        setLoading(false)
        return
      }

      setLoading(true)
      setError("")

      // =========================
      // LOAD REGISTRATION
      // =========================

      const {
        data: registrationData,
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

          tournament:tournaments (
            id,
            name,
            start_date,
            end_date,
            city,
            state
          ),

          division:tournament_divisions (
            id,
            name,
            age_group,
            classification
          ),

          team:teams (
            id,
            name,
            age_group,
            classification
          )
        `)
        .eq(
          "id",
          registrationId
        )
        .maybeSingle()

      if (registrationError) {
        setError(
          registrationError.message
        )
        setLoading(false)
        return
      }

      if (!registrationData) {
        setError(
          "Tournament registration not found."
        )
        setLoading(false)
        return
      }

      const normalizedRegistration =
        registrationData as unknown as Registration

      setRegistration(
        normalizedRegistration
      )

      // =========================
      // LOAD CURRENT TEAM ROSTER
      // =========================

      const {
        data: rosterData,
        error: rosterError,
      } = await supabase
        .from("rosters")
        .select(`
          id,
          name,
          season_year,
          season_type,
          status
        `)
        .eq(
          "team_id",
          normalizedRegistration.team_id
        )
        .eq(
          "organization_id",
          normalizedRegistration.organization_id
        )
        .in(
          "status",
          [
            "open",
            "active",
            "locked",
          ]
        )
        .order(
          "season_year",
          {
            ascending: false,
          }
        )
        .limit(1)
        .maybeSingle()

      if (rosterError) {
        setError(
          rosterError.message
        )
        setLoading(false)
        return
      }

      setCurrentRoster(
        rosterData ?? null
      )

      // =========================
      // LOAD EXISTING SUBMISSION
      // =========================

      const {
        data: submissionData,
        error: submissionError,
      } = await supabase
        .from(
          "tournament_roster_submissions"
        )
        .select(`
          id,
          tournament_registration_id,
          tournament_id,
          division_id,
          team_id,
          organization_id,
          source_roster_id,
          status,
          submitted_by_user_id,
          submitted_at,
          reviewed_at,
          locked_at,
          notes
        `)
        .eq(
          "tournament_registration_id",
          registrationId
        )
        .maybeSingle()

      if (submissionError) {
        setError(
          submissionError.message
        )
        setLoading(false)
        return
      }

      if (submissionData) {
        const normalizedSubmission =
          submissionData as TournamentRosterSubmission

        setSubmission(
          normalizedSubmission
        )

        await loadSubmissionPlayers(
          normalizedSubmission.id
        )
      } else {
        setSubmission(null)
        setPlayers([])
      }

      setLoading(false)
    }

    void loadPage()
  }, [registrationId])

  async function loadSubmissionPlayers(
    submissionId: string
  ) {
    const {
      data,
      error,
    } = await supabase
      .from(
        "tournament_roster_players"
      )
      .select(`
        id,
        submission_id,
        player_id,
        source_roster_player_id,
        first_name,
        last_name,
        birth_date,
        graduation_year,
        jersey_number,
        primary_position,
        secondary_position,
        source_invitation_status,
        source_roster_status,
        source_eligibility_status,
        eligibility_status,
        approval_status
      `)
      .eq(
        "submission_id",
        submissionId
      )
      .order(
        "jersey_number",
        {
          ascending: true,
        }
      )

    if (error) {
      throw error
    }

    setPlayers(
      (data ?? []) as TournamentRosterPlayer[]
    )
  }

  async function handleBuildRoster() {
    if (
      !registrationId ||
      !currentRoster
    ) {
      return
    }

    setBuilding(true)
    setError("")

    const {
      data: submissionId,
      error: createError,
    } = await supabase.rpc(
      "create_tournament_roster_submission",
      {
        target_registration_id:
          registrationId,

        target_source_roster_id:
          currentRoster.id,
      }
    )

    if (createError) {
      console.error(
        "TOURNAMENT ROSTER CREATE ERROR:",
        createError
      )

      setError(
        createError.message
      )
      setBuilding(false)
      return
    }

    const {
      data: submissionData,
      error: submissionError,
    } = await supabase
      .from(
        "tournament_roster_submissions"
      )
      .select(`
        id,
        tournament_registration_id,
        tournament_id,
        division_id,
        team_id,
        organization_id,
        source_roster_id,
        status,
        submitted_by_user_id,
        submitted_at,
        reviewed_at,
        locked_at,
        notes
      `)
      .eq(
        "id",
        submissionId
      )
      .single()

    if (submissionError) {
      setError(
        submissionError.message
      )
      setBuilding(false)
      return
    }

    setSubmission(
      submissionData as TournamentRosterSubmission
    )

    try {
      await loadSubmissionPlayers(
        submissionId
      )
    } catch (err: any) {
      setError(
        err?.message ??
          "Could not load tournament roster players."
      )
    }

    setBuilding(false)
  }

  async function handleSubmitRoster() {
    if (!submission) {
      return
    }

    const confirmed =
      window.confirm(
        "Submit this tournament roster? Once submitted, it can no longer be refreshed from the live team roster."
      )

    if (!confirmed) {
      return
    }

    setSubmitting(true)
    setError("")

    const {
      data,
      error: submitError,
    } = await supabase.rpc(
      "submit_tournament_roster_submission",
      {
        target_submission_id:
          submission.id,
      }
    )

    if (submitError) {
      console.error(
        "TOURNAMENT ROSTER SUBMIT ERROR:",
        submitError
      )

      setError(
        submitError.message
      )
      setSubmitting(false)
      return
    }

    const updated =
      Array.isArray(data)
        ? data[0]
        : data

    if (updated) {
      setSubmission(
        updated as TournamentRosterSubmission
      )
    }

    setSubmitting(false)
  }

  const eligibleCount =
    useMemo(
      () =>
        players.filter(
          (player) =>
            player.eligibility_status ===
            "eligible"
        ).length,
      [players]
    )

  const pendingCount =
    useMemo(
      () =>
        players.filter(
          (player) =>
            player.eligibility_status ===
              "pending" ||
            player.eligibility_status ===
              "needs_review"
        ).length,
      [players]
    )

  const ineligibleCount =
    useMemo(
      () =>
        players.filter(
          (player) =>
            player.eligibility_status ===
            "ineligible"
        ).length,
      [players]
    )

  if (loading) {
    return (
      <main className="min-h-screen bg-scoreboard-dark px-6 py-12 text-scoreboard-cream">
        <div className="mx-auto max-w-6xl">
          <p className="scoreboard-label">
            Loading Tournament Roster...
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

        <div className="mx-auto max-w-6xl">

          <div className="border border-scoreboard-red/60 bg-scoreboard-green p-6">

            <p className="scoreboard-label text-scoreboard-amber">
              Unable To Load Tournament Roster
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

  const division =
    registration.division

  const team =
    registration.team

  const submissionLocked =
    submission?.status ===
      "submitted" ||
    submission?.status ===
      "under_review" ||
    submission?.status ===
      "approved" ||
    submission?.status ===
      "locked"

  return (
    <main className="min-h-screen bg-scoreboard-dark text-scoreboard-cream">

      {/* =========================
          HEADER
      ========================= */}

      <section className="border-b border-scoreboard-cream/20 bg-scoreboard-green">

        <div className="mx-auto max-w-6xl px-6 py-10">

          <Link
            to="/dashboard"
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

            Dashboard
          </Link>

          <p className="scoreboard-label mt-8 text-scoreboard-amber">
            Tournament Roster
          </p>

          <h1 className="mt-3 text-4xl font-black uppercase tracking-[0.05em]">
            {tournament?.name ??
              "Tournament"}
          </h1>

          <div className="mt-5 flex flex-wrap gap-3 text-sm text-scoreboard-muted">

            {team?.name && (
              <span>
                {team.name}
              </span>
            )}

            {division && (
              <span>
                {division.age_group}
                {" • "}
                {division.name}
              </span>
            )}

            {tournament &&
              (tournament.city ||
                tournament.state) && (
                <span>
                  {[
                    tournament.city,
                    tournament.state,
                  ]
                    .filter(Boolean)
                    .join(", ")}
                </span>
              )}

          </div>

        </div>

      </section>

      {/* =========================
          MAIN CONTENT
      ========================= */}

      <section className="mx-auto max-w-6xl px-6 py-10">

        <div className="grid gap-6 lg:grid-cols-[1.6fr_.4fr]">

          {/* =========================
              ROSTER PANEL
          ========================= */}

          <div className="scoreboard-panel p-4">

            <div className="border border-scoreboard-cream/30 bg-scoreboard-green">

              {/* TOP */}

              <div className="border-b border-scoreboard-cream/20 p-6">

                <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">

                  <div>

                    <p className="scoreboard-label text-scoreboard-amber">
                      Submitted Roster
                    </p>

                    <div className="mt-2 flex flex-wrap items-center gap-3">

                      <h2 className="text-2xl font-black uppercase tracking-[0.06em]">
                        {currentRoster?.name ??
                          "Team Roster"}
                      </h2>

                      {submission && (
                        <StatusBadge
                          label={
                            submission.status
                          }
                          tone={
                            submission.status ===
                              "approved" ||
                            submission.status ===
                              "locked"
                              ? "good"
                              : submission.status ===
                                  "submitted" ||
                                submission.status ===
                                  "under_review"
                                ? "warning"
                                : "muted"
                          }
                        />
                      )}

                    </div>

                    {currentRoster && (
                      <p className="mt-2 text-sm capitalize text-scoreboard-muted">
                        {currentRoster.season_year}
                        {" • "}
                        {currentRoster.season_type.replaceAll(
                          "_",
                          " "
                        )}
                        {" • "}
                        {currentRoster.status}
                      </p>
                    )}

                  </div>

                  {!submission && (
                    <Button
                      type="button"
                      disabled={
                        building ||
                        !currentRoster
                      }
                      onClick={
                        handleBuildRoster
                      }
                      className="
                        rounded-none
                        bg-scoreboard-amber
                        font-black
                        uppercase
                        tracking-[0.12em]
                        text-scoreboard-dark
                        hover:bg-scoreboard-cream
                        disabled:opacity-50
                      "
                    >
                      <Users className="mr-2 h-4 w-4" />

                      {building
                        ? "Building..."
                        : "Build Tournament Roster"}
                    </Button>
                  )}

                </div>

                {error && (
                  <div className="mt-5 border border-scoreboard-red/60 bg-scoreboard-dark p-4">
                    <p className="text-sm text-scoreboard-muted">
                      {error}
                    </p>
                  </div>
                )}

              </div>

              {/* SUMMARY */}

              {submission && (
                <div className="grid grid-cols-2 border-b border-scoreboard-cream/20 sm:grid-cols-4">

                  <RosterSummary
                    label="Players"
                    value={players.length}
                  />

                  <RosterSummary
                    label="Eligible"
                    value={eligibleCount}
                  />

                  <RosterSummary
                    label="Review"
                    value={pendingCount}
                  />

                  <RosterSummary
                    label="Ineligible"
                    value={ineligibleCount}
                  />

                </div>
              )}

              {/* NO SUBMISSION */}

              {!submission ? (
                <div className="flex min-h-[360px] flex-col items-center justify-center px-6 text-center">

                  <Trophy className="h-10 w-10 text-scoreboard-amber" />

                  <p className="scoreboard-label mt-6 text-scoreboard-amber">
                    Tournament Roster
                  </p>

                  <h3 className="mt-2 text-2xl font-black uppercase tracking-[0.06em]">
                    Build Submission
                  </h3>

                  <p className="mt-3 max-w-lg text-sm leading-7 text-scoreboard-muted">
                    Create a snapshot of the team roster for
                    this tournament. The snapshot can be reviewed
                    before final submission.
                  </p>

                  {!currentRoster && (
                    <p className="mt-4 text-sm text-scoreboard-red">
                      This team does not have an open, active,
                      or locked source roster.
                    </p>
                  )}

                </div>
              ) : players.length === 0 ? (
                <div className="p-8 text-center text-scoreboard-muted">
                  No players are currently in this tournament roster.
                </div>
              ) : (
                <>
                  {/* DESKTOP HEADER */}

                  <div className="hidden grid-cols-[70px_1fr_100px_150px_140px] gap-4 border-b border-scoreboard-cream/20 bg-scoreboard-dark/20 px-5 py-3 md:grid">

                    <span className="scoreboard-label">
                      No.
                    </span>

                    <span className="scoreboard-label">
                      Player
                    </span>

                    <span className="scoreboard-label">
                      Pos
                    </span>

                    <span className="scoreboard-label">
                      Eligibility
                    </span>

                    <span className="scoreboard-label">
                      Approval
                    </span>

                  </div>

                  {/* PLAYERS */}

                  <div>
                    {players.map(
                      (player) => (
                        <div
                          key={player.id}
                          className="
                            border-b
                            border-scoreboard-cream/15
                            px-5
                            py-5
                            last:border-b-0
                          "
                        >

                          <div className="grid gap-4 md:grid-cols-[70px_1fr_100px_150px_140px] md:items-center">

                            <div>
                              <p className="scoreboard-number text-2xl text-scoreboard-amber">
                                {player.jersey_number ??
                                  "--"}
                              </p>
                            </div>

                            <div>

                              <p className="font-black uppercase tracking-[0.04em]">
                                {player.first_name}{" "}
                                {player.last_name}
                              </p>

                              {player.graduation_year && (
                                <p className="mt-1 text-xs text-scoreboard-muted">
                                  Class of{" "}
                                  {player.graduation_year}
                                </p>
                              )}

                            </div>

                            <div>

                              <p className="scoreboard-label md:hidden">
                                Position
                              </p>

                              <p className="scoreboard-number mt-1 md:mt-0">
                                {player.primary_position ??
                                  "UTIL"}
                              </p>

                              {player.secondary_position && (
                                <p className="mt-1 text-[10px] uppercase tracking-[0.10em] text-scoreboard-muted">
                                  {player.secondary_position}
                                </p>
                              )}

                            </div>

                            <div>

                              <p className="scoreboard-label mb-2 md:hidden">
                                Eligibility
                              </p>

                              <StatusBadge
                                label={
                                  player.eligibility_status
                                }
                                tone={
                                  player.eligibility_status ===
                                  "eligible"
                                    ? "good"
                                    : player.eligibility_status ===
                                        "ineligible"
                                      ? "danger"
                                      : "warning"
                                }
                              />

                            </div>

                            <div>

                              <p className="scoreboard-label mb-2 md:hidden">
                                Approval
                              </p>

                              <StatusBadge
                                label={
                                  player.approval_status
                                }
                                tone={
                                  player.approval_status ===
                                  "approved"
                                    ? "good"
                                    : player.approval_status ===
                                        "rejected"
                                      ? "danger"
                                      : "muted"
                                }
                              />

                            </div>

                          </div>

                        </div>
                      )
                    )}
                  </div>
                </>
              )}

              {/* ACTIONS */}

              {submission && (
                <div className="border-t border-scoreboard-cream/20 p-6">

                  <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">

                    {!submissionLocked && (
                      <Button
                        type="button"
                        disabled={building}
                        onClick={
                          handleBuildRoster
                        }
                        variant="outline"
                        className="
                          rounded-none
                          border-scoreboard-cream/30
                          bg-transparent
                          font-black
                          uppercase
                          tracking-[0.12em]
                          text-scoreboard-cream
                          hover:border-scoreboard-amber
                          hover:text-scoreboard-amber
                        "
                      >
                        <RefreshCw className="mr-2 h-4 w-4" />

                        {building
                          ? "Refreshing..."
                          : "Refresh Draft"}
                      </Button>
                    )}

                    {submission.status ===
                      "draft" && (
                      <Button
                        type="button"
                        disabled={
                          submitting ||
                          players.length === 0 ||
                          ineligibleCount > 0
                        }
                        onClick={
                          handleSubmitRoster
                        }
                        className="
                          rounded-none
                          bg-scoreboard-amber
                          font-black
                          uppercase
                          tracking-[0.12em]
                          text-scoreboard-dark
                          hover:bg-scoreboard-cream
                          disabled:opacity-50
                        "
                      >
                        <Send className="mr-2 h-4 w-4" />

                        {submitting
                          ? "Submitting..."
                          : "Submit Tournament Roster"}
                      </Button>
                    )}

                  </div>

                  {submission.status ===
                    "submitted" && (
                    <p className="mt-4 text-right text-xs uppercase tracking-[0.10em] text-scoreboard-muted">
                      Submitted{" "}
                      {submission.submitted_at
                        ? new Date(
                            submission.submitted_at
                          ).toLocaleString()
                        : ""}
                    </p>
                  )}

                </div>
              )}

            </div>

          </div>

          {/* =========================
              SIDEBAR
          ========================= */}

          <div className="space-y-6">

            <SidePanel
              icon={Trophy}
              eyebrow="Registration"
              title={
                registration.status
              }
              rows={[
                [
                  "Payment",
                  registration.payment_status,
                ],
                [
                  "Team",
                  team?.name ?? "—",
                ],
                [
                  "Division",
                  division
                    ? `${division.age_group} ${division.name}`
                    : "—",
                ],
              ]}
            />

            <SidePanel
              icon={ShieldCheck}
              eyebrow="Roster Source"
              title={
                currentRoster?.name ??
                "No Roster"
              }
              rows={[
                [
                  "Season",
                  currentRoster
                    ? String(
                        currentRoster.season_year
                      )
                    : "—",
                ],
                [
                  "Type",
                  currentRoster
                    ? currentRoster.season_type.replaceAll(
                        "_",
                        " "
                      )
                    : "—",
                ],
                [
                  "Status",
                  currentRoster?.status ??
                    "—",
                ],
              ]}
            />

            {submission && (
              <SidePanel
                icon={CheckCircle2}
                eyebrow="Submission"
                title={
                  submission.status
                }
                rows={[
                  [
                    "Players",
                    String(
                      players.length
                    ),
                  ],
                  [
                    "Eligible",
                    String(
                      eligibleCount
                    ),
                  ],
                  [
                    "Review",
                    String(
                      pendingCount
                    ),
                  ],
                ]}
              />
            )}

          </div>

        </div>

      </section>

    </main>
  )
}

function RosterSummary({
  label,
  value,
}: {
  label: string
  value: number
}) {
  return (
    <div className="border-b border-r border-scoreboard-cream/20 p-4 last:border-r-0 sm:border-b-0">

      <p className="scoreboard-label">
        {label}
      </p>

      <p className="scoreboard-number mt-2 text-2xl text-scoreboard-cream">
        {value}
      </p>

    </div>
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

function SidePanel({
  icon: Icon,
  eyebrow,
  title,
  rows,
}: {
  icon: typeof Trophy
  eyebrow: string
  title: string
  rows: [string, string][]
}) {
  return (
    <div className="scoreboard-panel p-4">

      <div className="border border-scoreboard-cream/30 bg-scoreboard-green p-6">

        <div className="flex items-start justify-between gap-4">

          <div>

            <p className="scoreboard-label text-scoreboard-amber">
              {eyebrow}
            </p>

            <h2 className="mt-2 text-xl font-black uppercase tracking-[0.06em]">
              {title.replaceAll(
                "_",
                " "
              )}
            </h2>

          </div>

          <Icon className="h-5 w-5 text-scoreboard-amber" />

        </div>

        <div className="mt-5 border-t border-scoreboard-cream/20">

          {rows.map(
            ([label, value]) => (
              <div
                key={label}
                className="flex items-center justify-between gap-4 border-b border-scoreboard-cream/15 py-3 last:border-b-0"
              >
                <span className="text-xs uppercase tracking-[0.10em] text-scoreboard-muted">
                  {label}
                </span>

                <span className="text-right text-xs font-black uppercase text-scoreboard-cream">
                  {value.replaceAll(
                    "_",
                    " "
                  )}
                </span>
              </div>
            )
          )}

        </div>

      </div>

    </div>
  )
}