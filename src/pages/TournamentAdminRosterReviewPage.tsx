import {
    useEffect,
    useMemo,
    useState,
  } from "react"
  
  import {
    ArrowLeft,
    CheckCircle2,
    Clock3,
    ShieldCheck,
    UserCheck,
    UserX,
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
    status: string
  
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
  }
  
  type Submission = {
    id: string
    tournament_registration_id: string
    tournament_id: string
    division_id: string
    team_id: string
    source_roster_id: string
    status: string
  
    submitted_at: string | null
    reviewed_at: string | null
    locked_at: string | null
  }
  
  type TournamentRosterPlayer = {
    id: string
    submission_id: string
    player_id: string
  
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
  
    notes: string | null
  }

  
  
  export function TournamentAdminRosterReviewPage() {
    const {
      tournamentId,
      registrationId,
    } = useParams()
  
    const [
      registration,
      setRegistration,
    ] =
      useState<Registration | null>(null)
  
    const [
      submission,
      setSubmission,
    ] =
      useState<Submission | null>(null)
  
    const [
      players,
      setPlayers,
    ] =
      useState<TournamentRosterPlayer[]>([])
  
    const [loading, setLoading] =
      useState(true)
  
    const [error, setError] =
      useState("")
  
    const [
      reviewingPlayerId,
      setReviewingPlayerId,
    ] =
      useState<string | null>(null)
  
    useEffect(() => {
      void loadPage()
    }, [
      tournamentId,
      registrationId,
    ])

    async function handleApproveRoster() {
        if (!submission) return
      
        const {
          data,
          error,
        } = await supabase.rpc(
          "review_tournament_roster_submission",
          {
            target_submission_id:
              submission.id,
            new_status:
              "approved",
            review_notes:
              null,
          }
        )
      
        if (error) {
          setError(error.message)
          return
        }
      
        const updated =
          Array.isArray(data)
            ? data[0]
            : data
      
        if (updated) {
          setSubmission(updated)
        }
      }

      async function handleLockRoster() {
        if (!submission) return
      
        const {
          data,
          error,
        } = await supabase.rpc(
          "review_tournament_roster_submission",
          {
            target_submission_id:
              submission.id,
            new_status:
              "locked",
            review_notes:
              null,
          }
        )
      
        if (error) {
          setError(error.message)
          return
        }
      
        const updated =
          Array.isArray(data)
            ? data[0]
            : data
      
        if (updated) {
          setSubmission(updated)
        }
      }
  
    async function loadPage() {
      if (
        !tournamentId ||
        !registrationId
      ) {
        setError(
          "Missing tournament or registration ID."
        )
  
        setLoading(false)
        return
      }
  
      setLoading(true)
      setError("")
  
      const {
        data: registrationData,
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
  
      setRegistration(
        registrationData as unknown as Registration
      )
  
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
          source_roster_id,
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
  
      if (submissionError) {
        setError(
          submissionError.message
        )
        setLoading(false)
        return
      }
  
      if (!submissionData) {
        setError(
          "No tournament roster submission found."
        )
        setLoading(false)
        return
      }
  
      setSubmission(
        submissionData as Submission
      )
  
      const {
        data: playerRows,
        error: playersError,
      } = await supabase
        .from(
          "tournament_roster_players"
        )
        .select(`
          id,
          submission_id,
          player_id,
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
          approval_status,
          notes
        `)
        .eq(
          "submission_id",
          submissionData.id
        )
        .order(
          "last_name"
        )
        .order(
          "first_name"
        )
  
      if (playersError) {
        setError(
          playersError.message
        )
        setLoading(false)
        return
      }
  
      setPlayers(
        (playerRows ??
          []) as TournamentRosterPlayer[]
      )
  
      setLoading(false)
    }
  
    async function reviewPlayer(
      playerId: string,
      approvalStatus:
        | "approved"
        | "rejected"
        | "pending",
      eligibilityStatus:
        | "eligible"
        | "ineligible"
        | "needs_review"
        | "pending"
    ) {
      setReviewingPlayerId(
        playerId
      )
  
      setError("")
  
      const {
        data,
        error: reviewError,
      } = await supabase.rpc(
        "review_tournament_roster_player",
        {
          target_tournament_roster_player_id:
            playerId,
  
          new_approval_status:
            approvalStatus,
  
          new_eligibility_status:
            eligibilityStatus,
  
          review_notes:
            null,
        }
      )
  
      if (reviewError) {
        setError(
          reviewError.message
        )
  
        setReviewingPlayerId(
          null
        )
  
        return
      }
  
      const updated =
        Array.isArray(data)
          ? data[0]
          : data
  
      if (updated) {
        setPlayers(
          (current) =>
            current.map(
              (player) =>
                player.id ===
                playerId
                  ? {
                      ...player,
                      approval_status:
                        updated.approval_status,
                      eligibility_status:
                        updated.eligibility_status,
                      notes:
                        updated.notes,
                    }
                  : player
            )
        )
  
        if (
          submission?.status ===
          "submitted"
        ) {
          setSubmission({
            ...submission,
            status:
              "under_review",
          })
        }
      }
  
      setReviewingPlayerId(
        null
      )
    }
  
    const approvedCount =
      useMemo(
        () =>
          players.filter(
            (player) =>
              player.approval_status ===
              "approved"
          ).length,
        [players]
      )
  
    const rejectedCount =
      useMemo(
        () =>
          players.filter(
            (player) =>
              player.approval_status ===
              "rejected"
          ).length,
        [players]
      )
  
    const pendingCount =
      players.length -
      approvedCount -
      rejectedCount
  
    if (loading) {
      return (
        <main className="min-h-screen bg-scoreboard-dark px-6 py-12 text-scoreboard-cream">
          <div className="mx-auto max-w-7xl">
            <p className="scoreboard-label">
              Loading Roster Review...
            </p>
          </div>
        </main>
      )
    }
  
    if (
      error &&
      (!registration ||
        !submission)
    ) {
      return (
        <main className="min-h-screen bg-scoreboard-dark px-6 py-12 text-scoreboard-cream">
  
          <div className="mx-auto max-w-7xl">
  
            <div className="border border-scoreboard-red/60 bg-scoreboard-green p-6">
  
              <p className="scoreboard-label text-scoreboard-amber">
                Unable To Load Roster
              </p>
  
              <p className="mt-3 text-sm text-scoreboard-muted">
                {error}
              </p>
  
            </div>
  
          </div>
  
        </main>
      )
    }
  
    if (
      !registration ||
      !submission
    ) {
      return null
    }
  
    const team =
      registration.team
  
    const division =
      registration.division
  
    return (
      <main className="min-h-screen bg-scoreboard-dark text-scoreboard-cream">
  
        <section className="border-b border-scoreboard-cream/20 bg-scoreboard-green">
  
          <div className="mx-auto max-w-7xl px-6 py-10">
  
            <Link
              to={`/dashboard/tournaments/${tournamentId}/registrations`}
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
              Registrations
            </Link>
  
            <p className="scoreboard-label mt-8 text-scoreboard-amber">
              Tournament Director
            </p>
  
            <h1 className="mt-3 text-4xl font-black uppercase tracking-[0.05em]">
              Roster Review
            </h1>

            {submission.status === "under_review" && (
  <Button
    type="button"
    onClick={handleApproveRoster}
  >
    Approve Roster
  </Button>
)}

{submission.status === "approved" && (
  <Button
    type="button"
    onClick={handleLockRoster}
  >
    Lock Roster
  </Button>
)}
  
            <div className="mt-4 flex flex-wrap gap-3 text-sm text-scoreboard-muted">
  
              <span>
                {team?.name ??
                  "Team"}
              </span>
  
              {division && (
                <span>
                  {division.age_group}
                  {" • "}
                  {division.name}
                </span>
              )}
  
            </div>
  
          </div>
  
        </section>
  
        <section className="mx-auto max-w-7xl px-6 py-8">
  
          <div className="grid border-l border-t border-scoreboard-cream/25 sm:grid-cols-4">
  
            <SummaryCard
              label="Players"
              value={
                players.length
              }
            />
  
            <SummaryCard
              label="Approved"
              value={
                approvedCount
              }
            />
  
            <SummaryCard
              label="Pending"
              value={
                pendingCount
              }
            />
  
            <SummaryCard
              label="Rejected"
              value={
                rejectedCount
              }
            />
  
          </div>
  
        </section>
  
        {error && (
          <section className="mx-auto max-w-7xl px-6">
  
            <div className="border border-scoreboard-red/60 bg-scoreboard-green p-4">
              <p className="text-sm text-scoreboard-muted">
                {error}
              </p>
            </div>
  
          </section>
        )}
  
        <section className="mx-auto max-w-7xl px-6 pb-14">
  
          <div className="scoreboard-panel p-4">
  
            <div className="border border-scoreboard-cream/30 bg-scoreboard-green">
  
              <div className="border-b border-scoreboard-cream/20 p-6">
  
                <div className="flex flex-wrap items-center justify-between gap-4">
  
                  <div>
                    <p className="scoreboard-label text-scoreboard-amber">
                      Submitted Roster
                    </p>
  
                    <h2 className="mt-2 text-2xl font-black uppercase tracking-[0.06em]">
                      {team?.name ??
                        "Team"}
                    </h2>
                  </div>
  
                  <StatusBadge
                    label={
                      submission.status
                    }
                    tone={
                      submission.status ===
                      "approved"
                        ? "good"
                        : submission.status ===
                            "under_review"
                          ? "warning"
                          : "muted"
                    }
                  />
  
                </div>
  
              </div>
  
              <div className="hidden grid-cols-[70px_1fr_90px_150px_160px] gap-4 border-b border-scoreboard-cream/20 bg-scoreboard-dark/20 px-5 py-3 md:grid">
  
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
                  Director Review
                </span>
  
              </div>
  
              {players.map(
                (player) => {
                  const busy =
                    reviewingPlayerId ===
                    player.id
  
                  return (
                    <div
                      key={
                        player.id
                      }
                      className="border-b border-scoreboard-cream/15 px-5 py-5 last:border-b-0"
                    >
  
                      <div className="grid gap-5 md:grid-cols-[70px_1fr_90px_150px_160px] md:items-center">
  
                        <p className="scoreboard-number text-2xl text-scoreboard-amber">
                          {player.jersey_number ??
                            "--"}
                        </p>
  
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
  
                          {player.notes && (
                            <p className="mt-2 text-xs text-scoreboard-muted">
                              {player.notes}
                            </p>
                          )}
                        </div>
  
                        <p className="scoreboard-number">
                          {player.primary_position ??
                            "UTIL"}
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
  
                        <div className="grid gap-2">
  
                          <Button
                            type="button"
                            disabled={
                              busy
                            }
                            onClick={() =>
                              reviewPlayer(
                                player.id,
                                "approved",
                                "eligible"
                              )
                            }
                            className="
                              rounded-none
                              bg-scoreboard-amber
                              font-black
                              uppercase
                              tracking-[0.08em]
                              text-scoreboard-dark
                              hover:bg-scoreboard-cream
                            "
                          >
                            <UserCheck className="mr-2 h-4 w-4" />
                            Approve
                          </Button>
  
                          <Button
                            type="button"
                            disabled={
                              busy
                            }
                            onClick={() =>
                              reviewPlayer(
                                player.id,
                                "pending",
                                "needs_review"
                              )
                            }
                            variant="outline"
                            className="
                              rounded-none
                              border-scoreboard-cream/30
                              bg-transparent
                              text-scoreboard-cream
                            "
                          >
                            <Clock3 className="mr-2 h-4 w-4" />
                            Review
                          </Button>
  
                          <Button
                            type="button"
                            disabled={
                              busy
                            }
                            onClick={() =>
                              reviewPlayer(
                                player.id,
                                "rejected",
                                "ineligible"
                              )
                            }
                            variant="outline"
                            className="
                              rounded-none
                              border-scoreboard-red/60
                              bg-transparent
                              text-scoreboard-red
                            "
                          >
                            <UserX className="mr-2 h-4 w-4" />
                            Reject
                          </Button>
  
                        </div>
  
                      </div>
  
                    </div>
                  )
                }
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
  }: {
    label: string
    value: number
  }) {
    return (
      <div className="border-b border-r border-scoreboard-cream/25 bg-scoreboard-green p-6">
        <p className="scoreboard-label">
          {label}
        </p>
  
        <p className="scoreboard-number mt-4 text-4xl">
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