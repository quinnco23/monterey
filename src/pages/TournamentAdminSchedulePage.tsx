import {
    useEffect,
    useMemo,
    useState,
  } from "react"
  
  import {
    ArrowLeft,
    CalendarDays,
    CheckCircle2,
    ChevronDown,
    Clock,
    MapPin,
    RefreshCw,
    Trophy,
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
  }
  
  
  type Division = {
    id: string
    tournament_id: string
    name: string
    age_group: string
    classification: string | null
    active: boolean
  }
  
  
  type TournamentTeam = {
    id: string
    tournament_id: string
    division_id: string
    display_name: string
    city: string | null
    state: string | null
  }
  
  
  type TournamentGame = {
    id: string
    tournament_id: string
    division_id: string
  
    pool_id: string | null
  
    home_tournament_team_id: string | null
    away_tournament_team_id: string | null
  
    field_resource_id: string | null
  
    scheduled_start: string | null
  
    game_number: number | null
    round_name: string | null
    game_type: string
  
    status: string
  
    home_score: number | null
    away_score: number | null
  }
  
  
  type FieldResource = {
    id: string
    name: string
    city: string | null
    state: string | null
    resource_type: string
    active: boolean
  }
  
  
  type ScheduleDraft = {
    date: string
    time: string
    fieldResourceId: string
  }
  
  
  export function TournamentAdminSchedulePage() {
    const { tournamentId } = useParams()
  
    const [
      tournament,
      setTournament,
    ] = useState<Tournament | null>(null)
  
    const [
      divisions,
      setDivisions,
    ] = useState<Division[]>([])
  
    const [
      teams,
      setTeams,
    ] = useState<TournamentTeam[]>([])
  
    const [
      games,
      setGames,
    ] = useState<TournamentGame[]>([])
  
    const [
      fields,
      setFields,
    ] = useState<FieldResource[]>([])
  
    const [
      selectedDivisionId,
      setSelectedDivisionId,
    ] = useState("")
  
    const [
      drafts,
      setDrafts,
    ] = useState<Record<string, ScheduleDraft>>({})
  
    const [
      workingId,
      setWorkingId,
    ] = useState<string | null>(null)
  
    const [
      loading,
      setLoading,
    ] = useState(true)
  
    const [
      error,
      setError,
    ] = useState("")
  
    const [
      success,
      setSuccess,
    ] = useState("")
  
  
    useEffect(() => {
      void loadPage()
    }, [tournamentId])
  
  
    async function loadPage() {
      if (!tournamentId) {
        setError("Missing tournament ID.")
        setLoading(false)
        return
      }
  
      setLoading(true)
      setError("")
      setSuccess("")
  
      const [
        tournamentResult,
        divisionsResult,
        teamsResult,
        gamesResult,
        fieldsResult,
      ] = await Promise.all([
        supabase
          .from("tournaments")
          .select(`
            id,
            name,
            city,
            state,
            start_date,
            end_date
          `)
          .eq(
            "id",
            tournamentId
          )
          .maybeSingle(),
  
        supabase
          .from("tournament_divisions")
          .select(`
            id,
            tournament_id,
            name,
            age_group,
            classification,
            active
          `)
          .eq(
            "tournament_id",
            tournamentId
          )
          .eq(
            "active",
            true
          )
          .order(
            "age_group"
          ),
  
        supabase
          .from("tournament_teams")
          .select(`
            id,
            tournament_id,
            division_id,
            display_name,
            city,
            state
          `)
          .eq(
            "tournament_id",
            tournamentId
          )
          .eq(
            "status",
            "approved"
          )
          .order(
            "display_name"
          ),
  
        supabase
          .from("tournament_games")
          .select(`
            id,
            tournament_id,
            division_id,
            pool_id,
            home_tournament_team_id,
            away_tournament_team_id,
            field_resource_id,
            scheduled_start,
            game_number,
            round_name,
            game_type,
            status,
            home_score,
            away_score
          `)
          .eq(
            "tournament_id",
            tournamentId
          )
          .order(
            "game_number"
          ),
  
        /*
         * IMPORTANT:
         *
         * This assumes your booking system uses
         * a table called "field_resources".
         *
         * If your actual table name is different,
         * we will change only this query.
         */
        supabase
  .from("booking_resources")
  .select(`
    id,
    name,
    city,
    state,
    resource_type,
    active
  `)
  .eq(
    "resource_type",
    "field"
  )
  .eq(
    "active",
    true
  )
  .order(
    "name"
  ),
      ])
  
  
      if (tournamentResult.error) {
        setError(tournamentResult.error.message)
        setLoading(false)
        return
      }
  
  
      if (!tournamentResult.data) {
        setError("Tournament not found.")
        setLoading(false)
        return
      }
  
  
      if (divisionsResult.error) {
        setError(divisionsResult.error.message)
        setLoading(false)
        return
      }
  
  
      if (teamsResult.error) {
        setError(teamsResult.error.message)
        setLoading(false)
        return
      }
  
  
      if (gamesResult.error) {
        setError(gamesResult.error.message)
        setLoading(false)
        return
      }
  
  
      /*
       * For now, don't kill the whole schedule page
       * if the field-resource query fails.
       *
       * This lets us confirm the games portion works
       * before wiring the exact booking resource table.
       */
      if (fieldsResult.error) {
        console.warn(
          "Unable to load field resources:",
          fieldsResult.error.message
        )
      }
  
  
      const divisionRows =
        (divisionsResult.data ?? []) as Division[]
  
      const gameRows =
        (gamesResult.data ?? []) as TournamentGame[]
  
      const fieldRows =
        fieldsResult.error
          ? []
          : (fieldsResult.data ?? []) as FieldResource[]
  
  
      setTournament(
        tournamentResult.data as Tournament
      )
  
      setDivisions(
        divisionRows
      )
  
      setTeams(
        (teamsResult.data ?? []) as TournamentTeam[]
      )
  
      setGames(
        gameRows
      )
  
      setFields(
        fieldRows
      )
  
  
      setSelectedDivisionId(
        (current) =>
          current &&
          divisionRows.some(
            (division) =>
              division.id === current
          )
            ? current
            : divisionRows[0]?.id ?? ""
      )
  
  
      const nextDrafts: Record<
        string,
        ScheduleDraft
      > = {}
  
  
      for (const game of gameRows) {
        nextDrafts[game.id] =
          buildDraftFromGame(game)
      }
  
  
      setDrafts(nextDrafts)
  
      setLoading(false)
    }
  
  
    function buildDraftFromGame(
      game: TournamentGame
    ): ScheduleDraft {
      if (!game.scheduled_start) {
        return {
          date: "",
          time: "",
          fieldResourceId:
            game.field_resource_id ?? "",
        }
      }
  
  
      const scheduled =
        new Date(game.scheduled_start)
  
  
      const date = [
        scheduled.getFullYear(),
        String(
          scheduled.getMonth() + 1
        ).padStart(2, "0"),
        String(
          scheduled.getDate()
        ).padStart(2, "0"),
      ].join("-")
  
  
      const time = [
        String(
          scheduled.getHours()
        ).padStart(2, "0"),
        String(
          scheduled.getMinutes()
        ).padStart(2, "0"),
      ].join(":")
  
  
      return {
        date,
        time,
        fieldResourceId:
          game.field_resource_id ?? "",
      }
    }
  
  
    function updateDraft(
      gameId: string,
      updates: Partial<ScheduleDraft>
    ) {
      setDrafts(
        (current) => ({
          ...current,
  
          [gameId]: {
            ...(
              current[gameId] ?? {
                date: "",
                time: "",
                fieldResourceId: "",
              }
            ),
  
            ...updates,
          },
        })
      )
    }
  
  
    async function handleSaveSchedule(
      game: TournamentGame
    ) {
      const draft =
        drafts[game.id]
  
  
      if (!draft?.date) {
        setError(
          "Select a game date."
        )
        return
      }
  
  
      if (!draft.time) {
        setError(
          "Select a game time."
        )
        return
      }
  
  
      if (!draft.fieldResourceId) {
        setError(
          "Select a field."
        )
        return
      }
  
  
      const scheduledStart =
        new Date(
          `${draft.date}T${draft.time}:00`
        )
  
  
      if (
        Number.isNaN(
          scheduledStart.getTime()
        )
      ) {
        setError(
          "Invalid scheduled date or time."
        )
        return
      }
  
  
      setWorkingId(game.id)
      setError("")
      setSuccess("")
  
  
      const {
        error: updateError,
      } = await supabase
        .from("tournament_games")
        .update({
          field_resource_id:
            draft.fieldResourceId,
  
          scheduled_start:
            scheduledStart.toISOString(),
  
          status: "scheduled",
        })
        .eq(
          "id",
          game.id
        )
  
  
      if (updateError) {
        setError(
          updateError.message
        )
        setWorkingId(null)
        return
      }
  
  
      setSuccess(
        `Game ${
          game.game_number ?? ""
        } scheduled successfully.`
      )
  
  
      await loadPage()
  
      setWorkingId(null)
    }
  
  
    async function handleUnscheduleGame(
      game: TournamentGame
    ) {
      const confirmed =
        window.confirm(
          `Remove the schedule for Game ${
            game.game_number ?? ""
          }?`
        )
  
  
      if (!confirmed) {
        return
      }
  
  
      setWorkingId(game.id)
      setError("")
      setSuccess("")
  
  
      const {
        error: updateError,
      } = await supabase
        .from("tournament_games")
        .update({
          field_resource_id: null,
          scheduled_start: null,
          status: "unscheduled",
        })
        .eq(
          "id",
          game.id
        )
  
  
      if (updateError) {
        setError(
          updateError.message
        )
        setWorkingId(null)
        return
      }
  
  
      await loadPage()
  
      setWorkingId(null)
    }
  
  
    const selectedDivision =
      useMemo(
        () =>
          divisions.find(
            (division) =>
              division.id ===
              selectedDivisionId
          ) ?? null,
        [
          divisions,
          selectedDivisionId,
        ]
      )
  
  
    const divisionGames =
      useMemo(
        () =>
          games.filter(
            (game) =>
              game.division_id ===
              selectedDivisionId
          ),
        [
          games,
          selectedDivisionId,
        ]
      )
  
  
    const scheduledCount =
      useMemo(
        () =>
          divisionGames.filter(
            (game) =>
              game.status ===
              "scheduled"
          ).length,
        [divisionGames]
      )
  
  
    const unscheduledCount =
      useMemo(
        () =>
          divisionGames.filter(
            (game) =>
              game.status ===
              "unscheduled"
          ).length,
        [divisionGames]
      )
  
  
    function getTeam(
      tournamentTeamId: string | null
    ) {
      if (!tournamentTeamId) {
        return null
      }
  
  
      return (
        teams.find(
          (team) =>
            team.id ===
            tournamentTeamId
        ) ?? null
      )
    }
  
  
    function getFieldName(
      fieldResourceId: string | null
    ) {
      if (!fieldResourceId) {
        return "No Field"
      }
  
  
      return (
        fields.find(
          (field) =>
            field.id ===
            fieldResourceId
        )?.name ?? "Assigned Field"
      )
    }
  
  
    if (loading) {
      return (
        <main className="min-h-screen bg-scoreboard-dark px-6 py-12 text-scoreboard-cream">
  
          <div className="mx-auto max-w-7xl">
  
            <p className="scoreboard-label">
              Loading Tournament Schedule...
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
                Unable To Load Schedule
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
  
        {/* HEADER */}
  
        <section className="border-b border-scoreboard-cream/20 bg-scoreboard-green">
  
          <div className="mx-auto max-w-7xl px-6 py-10">
  
            <Link
              to={`/dashboard/tournaments/${tournament.id}/registrations`}
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
  
              Tournament Admin
            </Link>
  
  
            <p className="scoreboard-label mt-8 text-scoreboard-amber">
              Competition
            </p>
  
  
            <h1 className="mt-3 text-4xl font-black uppercase tracking-[0.05em]">
              Game Schedule
            </h1>
  
  
            <p className="mt-3 text-sm text-scoreboard-muted">
              {tournament.name}
            </p>
  
          </div>
  
        </section>
  
  
        {/* SUMMARY */}
  
        <section className="mx-auto max-w-7xl px-6 py-8">
  
          <div className="grid border-l border-t border-scoreboard-cream/25 sm:grid-cols-3">
  
            <SummaryCard
              label="Games"
              value={divisionGames.length}
              icon={Trophy}
            />
  
            <SummaryCard
              label="Scheduled"
              value={scheduledCount}
              icon={CheckCircle2}
            />
  
            <SummaryCard
              label="Unscheduled"
              value={unscheduledCount}
              icon={Clock}
            />
  
          </div>
  
        </section>
  
  
        <section className="mx-auto max-w-7xl px-6 pb-16">
  
          {/* DIVISION FILTER */}
  
          <div className="border border-scoreboard-cream/25 bg-scoreboard-green p-6">
  
            <div className="max-w-md">
  
              <label className="scoreboard-label text-scoreboard-amber">
                Division
              </label>
  
  
              <div className="relative mt-2">
  
                <select
                  value={
                    selectedDivisionId
                  }
                  onChange={(e) =>
                    setSelectedDivisionId(
                      e.target.value
                    )
                  }
                  className="
                    w-full
                    appearance-none
                    rounded-none
                    border
                    border-scoreboard-cream/30
                    bg-scoreboard-cream
                    px-3
                    py-3
                    pr-10
                    text-scoreboard-dark
                  "
                >
  
                  {divisions.map(
                    (division) => (
                      <option
                        key={
                          division.id
                        }
                        value={
                          division.id
                        }
                      >
                        {division.age_group}
                        {" • "}
                        {division.name}
                      </option>
                    )
                  )}
  
                </select>
  
  
                <ChevronDown className="pointer-events-none absolute right-3 top-3.5 h-4 w-4 text-scoreboard-dark" />
  
              </div>
  
            </div>
  
  
            {selectedDivision && (
              <p className="mt-4 text-xs uppercase tracking-[0.10em] text-scoreboard-muted">
                Managing{" "}
                {selectedDivision.age_group}
                {" • "}
                {selectedDivision.name}
              </p>
            )}
  
          </div>
  
  
          {/* ERROR */}
  
          {error && (
            <div className="mt-6 border border-scoreboard-red/60 bg-scoreboard-green p-4">
  
              <p className="text-sm text-scoreboard-muted">
                {error}
              </p>
  
            </div>
          )}
  
  
          {/* SUCCESS */}
  
          {success && (
            <div className="mt-6 border border-scoreboard-amber/40 bg-scoreboard-green p-4">
  
              <p className="text-sm font-bold text-scoreboard-amber">
                {success}
              </p>
  
            </div>
          )}
  
  
          {/* GAMES */}
  
          <div className="mt-6">
  
            {divisionGames.length === 0 ? (
              <div className="border border-scoreboard-cream/25 bg-scoreboard-green p-8">
  
                <CalendarDays className="h-8 w-8 text-scoreboard-amber" />
  
                <h2 className="mt-5 text-xl font-black uppercase tracking-[0.06em]">
                  No Games Generated
                </h2>
  
                <p className="mt-3 text-sm text-scoreboard-muted">
                  Generate pool-play games from the tournament pools page first.
                </p>
  
              </div>
            ) : (
              <div className="space-y-4">
  
                {divisionGames.map(
                  (game) => {
                    const homeTeam =
                      getTeam(
                        game.home_tournament_team_id
                      )
  
                    const awayTeam =
                      getTeam(
                        game.away_tournament_team_id
                      )
  
                    const draft =
                      drafts[game.id] ?? {
                        date: "",
                        time: "",
                        fieldResourceId: "",
                      }
  
  
                    return (
                      <div
                        key={game.id}
                        className="border border-scoreboard-cream/25 bg-scoreboard-green"
                      >
  
                        {/* GAME HEADER */}
  
                        <div className="flex flex-col gap-3 border-b border-scoreboard-cream/20 p-5 sm:flex-row sm:items-center sm:justify-between">
  
                          <div>
  
                            <p className="scoreboard-label text-scoreboard-amber">
                              Game{" "}
                              {game.game_number ?? "—"}
                            </p>
  
  
                            <h2 className="mt-2 text-lg font-black uppercase tracking-[0.05em]">
                              {game.round_name ??
                                "Tournament Game"}
                            </h2>
  
                          </div>
  
  
                          <GameStatus
                            status={
                              game.status
                            }
                          />
  
                        </div>
  
  
                        {/* MATCHUP */}
  
                        <div className="grid gap-0 border-b border-scoreboard-cream/20 md:grid-cols-[1fr_auto_1fr]">
  
                          <TeamBlock
                            label="Home"
                            team={homeTeam}
                          />
  
                          <div className="flex items-center justify-center border-y border-scoreboard-cream/15 px-6 py-4 md:border-x md:border-y-0">
  
                            <span className="scoreboard-label text-scoreboard-muted">
                              VS
                            </span>
  
                          </div>
  
                          <TeamBlock
                            label="Away"
                            team={awayTeam}
                          />
  
                        </div>
  
  
                        {/* CURRENT SCHEDULE */}
  
                        {game.status ===
                          "scheduled" &&
                          game.scheduled_start && (
                            <div className="grid gap-4 border-b border-scoreboard-cream/20 p-5 md:grid-cols-2">
  
                              <div className="flex items-center gap-3">
  
                                <CalendarDays className="h-5 w-5 text-scoreboard-amber" />
  
                                <div>
  
                                  <p className="scoreboard-label">
                                    Scheduled
                                  </p>
  
                                  <p className="mt-1 text-sm font-bold">
                                    {new Date(
                                      game.scheduled_start
                                    ).toLocaleString()}
                                  </p>
  
                                </div>
  
                              </div>
  
  
                              <div className="flex items-center gap-3">
  
                                <MapPin className="h-5 w-5 text-scoreboard-amber" />
  
                                <div>
  
                                  <p className="scoreboard-label">
                                    Field
                                  </p>
  
                                  <p className="mt-1 text-sm font-bold">
                                    {getFieldName(
                                      game.field_resource_id
                                    )}
                                  </p>
  
                                </div>
  
                              </div>
  
                            </div>
                          )}
  
  
                        {/* SCHEDULER */}
  
                        <div className="p-5">
  
                          <p className="scoreboard-label text-scoreboard-amber">
                            Schedule Game
                          </p>
  
  
                          <div className="mt-4 grid gap-4 md:grid-cols-3">
  
                            {/* DATE */}
  
                            <label className="block">
  
                              <span className="scoreboard-label">
                                Date
                              </span>
  
                              <input
                                type="date"
                                value={
                                  draft.date
                                }
                                onChange={(e) =>
                                  updateDraft(
                                    game.id,
                                    {
                                      date:
                                        e.target.value,
                                    }
                                  )
                                }
                                className="
                                  mt-2
                                  w-full
                                  rounded-none
                                  border
                                  border-scoreboard-cream/30
                                  bg-scoreboard-cream
                                  px-3
                                  py-3
                                  text-base
                                  text-scoreboard-dark
                                  [color-scheme:light]
                                "
                              />
  
                            </label>
  
  
                            {/* TIME */}
  
                            <label className="block">
  
                              <span className="scoreboard-label">
                                Time
                              </span>
  
                              <input
                                type="time"
                                value={
                                  draft.time
                                }
                                onChange={(e) =>
                                  updateDraft(
                                    game.id,
                                    {
                                      time:
                                        e.target.value,
                                    }
                                  )
                                }
                                className="
                                  mt-2
                                  w-full
                                  rounded-none
                                  border
                                  border-scoreboard-cream/30
                                  bg-scoreboard-cream
                                  px-3
                                  py-3
                                  text-base
                                  text-scoreboard-dark
                                  [color-scheme:light]
                                "
                              />
  
                            </label>
  
  
                            {/* FIELD */}
  
                            <label className="block">
  
                              <span className="scoreboard-label">
                                Field
                              </span>
  
                              <select
                                value={
                                  draft.fieldResourceId
                                }
                                onChange={(e) =>
                                  updateDraft(
                                    game.id,
                                    {
                                      fieldResourceId:
                                        e.target.value,
                                    }
                                  )
                                }
                                className="
                                  mt-2
                                  w-full
                                  rounded-none
                                  border
                                  border-scoreboard-cream/30
                                  bg-scoreboard-cream
                                  px-3
                                  py-3
                                  text-base
                                  text-scoreboard-dark
                                "
                              >
  
                                <option value="">
                                  Select Field...
                                </option>
  
  
                                {fields.map(
  (field) => (
    <option
      key={field.id}
      value={field.id}
    >
      {field.name}
      {field.city
        ? ` — ${field.city}${field.state ? `, ${field.state}` : ""}`
        : ""}
    </option>
  )
)}
  
                              </select>
  
                            </label>
  
                          </div>
  
  
                          <div className="mt-5 flex flex-wrap gap-3">
  
                            <Button
                              type="button"
                              disabled={
                                workingId ===
                                game.id
                              }
                              onClick={() =>
                                void handleSaveSchedule(
                                  game
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
                              {workingId ===
                              game.id
                                ? "Saving..."
                                : game.status ===
                                    "scheduled"
                                  ? "Update Schedule"
                                  : "Schedule Game"}
                            </Button>
  
  
                            {game.status ===
                              "scheduled" && (
                              <Button
                                type="button"
                                variant="outline"
                                disabled={
                                  workingId ===
                                  game.id
                                }
                                onClick={() =>
                                  void handleUnscheduleGame(
                                    game
                                  )
                                }
                                className="
                                  rounded-none
                                  border-scoreboard-cream/30
                                  bg-transparent
                                  font-black
                                  uppercase
                                  tracking-[0.08em]
                                  text-scoreboard-cream
                                  hover:bg-scoreboard-cream
                                  hover:text-scoreboard-dark
                                "
                              >
                                <RefreshCw className="mr-2 h-4 w-4" />
  
                                Unschedule
                              </Button>
                            )}
  
                          </div>
  
                        </div>
  
                      </div>
                    )
                  }
                )}
  
              </div>
            )}
  
          </div>
  
        </section>
  
      </main>
    )
  }
  
  
  function TeamBlock({
    label,
    team,
  }: {
    label: string
    team: TournamentTeam | null
  }) {
    return (
      <div className="p-5">
  
        <p className="scoreboard-label">
          {label}
        </p>
  
  
        <p className="mt-2 text-lg font-black uppercase tracking-[0.04em]">
          {team?.display_name ??
            "TBD"}
        </p>
  
  
        {(team?.city ||
          team?.state) && (
          <p className="mt-1 text-xs text-scoreboard-muted">
            {[
              team?.city,
              team?.state,
            ]
              .filter(Boolean)
              .join(", ")}
          </p>
        )}
  
      </div>
    )
  }
  
  
  function GameStatus({
    status,
  }: {
    status: string
  }) {
    return (
      <span
        className={`
          inline-flex
          w-fit
          items-center
          border
          px-3
          py-2
          text-xs
          font-black
          uppercase
          tracking-[0.08em]
  
          ${
            status === "scheduled"
              ? "border-scoreboard-amber text-scoreboard-amber"
              : "border-scoreboard-cream/30 text-scoreboard-muted"
          }
        `}
      >
        {status.replaceAll("_", " ")}
      </span>
    )
  }
  
  
  function SummaryCard({
    label,
    value,
    icon: Icon,
  }: {
    label: string
    value: number
    icon: typeof Trophy
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