import { useEffect, useMemo, useState } from "react"
import {
  CalendarDays,
  MapPin,
  Trophy,
  Users,
} from "lucide-react"
import { useParams } from "react-router-dom"

import { supabase } from "@/lib/supabase"

type Tournament = {
  id: string
  name: string
  slug: string
  description: string | null
  city: string | null
  state: string | null
  start_date: string
  end_date: string
  status: string
}

type Division = {
  id: string
  name: string
  age_group: string
  classification: string | null
  max_teams: number | null
}

type TournamentTeam = {
  id: string
  division_id: string
  display_name: string
  city: string | null
  state: string | null
  status: string
  seed: number | null
}

type TournamentGame = {
  id: string
  division_id: string
  scheduled_start: string | null
  game_number: number | null
  round_name: string | null
  status: string
  home_score: number | null
  away_score: number | null

  home_team: {
    id: string
    display_name: string
  } | null

  away_team: {
    id: string
    display_name: string
  } | null

  field: {
    id: string
    name: string
    city: string | null
    state: string | null
  } | null
}

type TabName =
  | "overview"
  | "schedule"
  | "teams"
  | "standings"

export function TournamentDetailPage() {
  const { tournamentId } = useParams()

  const [tournament, setTournament] =
    useState<Tournament | null>(null)

  const [divisions, setDivisions] =
    useState<Division[]>([])

  const [teams, setTeams] =
    useState<TournamentTeam[]>([])

  const [games, setGames] =
    useState<TournamentGame[]>([])

  const [activeTab, setActiveTab] =
    useState<TabName>("overview")

  const [selectedDivision, setSelectedDivision] =
    useState("all")

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    async function loadTournament() {
      if (!tournamentId) {
        setError("Missing tournament ID.")
        setLoading(false)
        return
      }

      setLoading(true)
      setError("")

      const [
        tournamentResult,
        divisionsResult,
        teamsResult,
        gamesResult,
      ] = await Promise.all([
        supabase
          .from("tournaments")
          .select(`
            id,
            name,
            slug,
            description,
            city,
            state,
            start_date,
            end_date,
            status
          `)
          .eq("id", tournamentId)
          .single(),

        supabase
          .from("tournament_divisions")
          .select(`
            id,
            name,
            age_group,
            classification,
            max_teams
          `)
          .eq("tournament_id", tournamentId)
          .order("age_group"),

        supabase
          .from("tournament_teams")
          .select(`
            id,
            division_id,
            display_name,
            city,
            state,
            status,
            seed
          `)
          .eq("tournament_id", tournamentId)
          .order("display_name"),

        supabase
          .from("tournament_games")
          .select(`
            id,
            division_id,
            scheduled_start,
            game_number,
            round_name,
            status,
            home_score,
            away_score,

            home_team:home_tournament_team_id (
              id,
              display_name
            ),

            away_team:away_tournament_team_id (
              id,
              display_name
            ),

            field:field_resource_id (
              id,
              name,
              city,
              state
            )
          `)
          .eq("tournament_id", tournamentId)
          .order("scheduled_start", {
            ascending: true,
          }),
      ])

      if (tournamentResult.error) {
        setError(tournamentResult.error.message)
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

      setTournament(tournamentResult.data)
      setDivisions(divisionsResult.data ?? [])
      setTeams(teamsResult.data ?? [])

      setGames(
        (gamesResult.data ?? []) as unknown as TournamentGame[]
      )

      setLoading(false)
    }

    void loadTournament()
  }, [tournamentId])

  const filteredTeams = useMemo(() => {
    if (selectedDivision === "all") {
      return teams
    }

    return teams.filter(
      (team) => team.division_id === selectedDivision
    )
  }, [teams, selectedDivision])

  const filteredGames = useMemo(() => {
    if (selectedDivision === "all") {
      return games
    }

    return games.filter(
      (game) => game.division_id === selectedDivision
    )
  }, [games, selectedDivision])

  if (loading) {
    return (
      <main className="min-h-screen bg-scoreboard-dark px-6 py-12 text-scoreboard-cream">
        <div className="mx-auto max-w-7xl">
          <p className="scoreboard-label">
            Loading Tournament...
          </p>
        </div>
      </main>
    )
  }

  if (error || !tournament) {
    return (
      <main className="min-h-screen bg-scoreboard-dark px-6 py-12 text-scoreboard-cream">
        <div className="mx-auto max-w-7xl">
          <div className="border border-scoreboard-red/60 bg-scoreboard-green p-6">

            <p className="scoreboard-label text-scoreboard-amber">
              Unable To Load Tournament
            </p>

            <p className="mt-3 text-sm text-scoreboard-muted">
              {error || "Tournament not found."}
            </p>

          </div>
        </div>
      </main>
    )
  }

  const startDate = new Date(
    `${tournament.start_date}T12:00:00`
  )

  const endDate = new Date(
    `${tournament.end_date}T12:00:00`
  )

  return (
    <main className="min-h-screen bg-scoreboard-dark text-scoreboard-cream">

      {/* HERO */}
      <section className="border-b border-scoreboard-cream/20 bg-scoreboard-green">
        <div className="mx-auto max-w-7xl px-6 py-12">

          <p className="scoreboard-label text-scoreboard-amber">
            Tournament
          </p>

          <div className="mt-3 grid gap-8 lg:grid-cols-[1fr_auto] lg:items-end">

            <div>

              <h1 className="text-4xl font-black uppercase tracking-[0.06em] sm:text-5xl">
                {tournament.name}
              </h1>

              {tournament.description && (
                <p className="mt-5 max-w-3xl text-sm leading-7 text-scoreboard-muted sm:text-base">
                  {tournament.description}
                </p>
              )}

              <div className="mt-6 flex flex-wrap gap-5 text-sm text-scoreboard-muted">

                <div className="flex items-center gap-2">
                  <CalendarDays className="h-4 w-4 text-scoreboard-amber" />

                  {startDate.toLocaleDateString([], {
                    month: "long",
                    day: "numeric",
                  })}

                  {" – "}

                  {endDate.toLocaleDateString([], {
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  })}
                </div>

                {(tournament.city || tournament.state) && (
                  <div className="flex items-center gap-2">

                    <MapPin className="h-4 w-4 text-scoreboard-amber" />

                    {[tournament.city, tournament.state]
                      .filter(Boolean)
                      .join(", ")}

                  </div>
                )}

              </div>

            </div>

            <div className="border border-scoreboard-cream/25 bg-scoreboard-dark p-5 lg:min-w-[190px]">

              <p className="scoreboard-label">
                Status
              </p>

              <p className="scoreboard-number mt-2 text-xl text-scoreboard-amber">
                {tournament.status.replaceAll("_", " ")}
              </p>

            </div>

          </div>
        </div>
      </section>

      {/* NAV */}
      <section className="border-b border-scoreboard-cream/20 bg-scoreboard-dark">
        <div className="mx-auto max-w-7xl px-6">

          <div className="flex overflow-x-auto">

            {[
              ["overview", "Overview"],
              ["schedule", "Schedule"],
              ["teams", "Teams"],
              ["standings", "Standings"],
            ].map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() =>
                  setActiveTab(value as TabName)
                }
                className={
                  activeTab === value
                    ? `
                      border-b-2
                      border-scoreboard-amber
                      px-5
                      py-4
                      text-xs
                      font-black
                      uppercase
                      tracking-[0.14em]
                      text-scoreboard-amber
                    `
                    : `
                      border-b-2
                      border-transparent
                      px-5
                      py-4
                      text-xs
                      font-black
                      uppercase
                      tracking-[0.14em]
                      text-scoreboard-muted
                      hover:text-scoreboard-cream
                    `
                }
              >
                {label}
              </button>
            ))}

          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-10">

        {/* DIVISION FILTER */}
        {(activeTab === "schedule" ||
          activeTab === "teams") && (
          <div className="mb-7 flex flex-wrap gap-2">

            <button
              type="button"
              onClick={() =>
                setSelectedDivision("all")
              }
              className={
                selectedDivision === "all"
                  ? "bg-scoreboard-amber px-4 py-2 text-xs font-black uppercase tracking-[0.12em] text-scoreboard-dark"
                  : "border border-scoreboard-cream/30 px-4 py-2 text-xs font-black uppercase tracking-[0.12em]"
              }
            >
              All
            </button>

            {divisions.map((division) => (
              <button
                key={division.id}
                type="button"
                onClick={() =>
                  setSelectedDivision(division.id)
                }
                className={
                  selectedDivision === division.id
                    ? "bg-scoreboard-amber px-4 py-2 text-xs font-black uppercase tracking-[0.12em] text-scoreboard-dark"
                    : "border border-scoreboard-cream/30 px-4 py-2 text-xs font-black uppercase tracking-[0.12em]"
                }
              >
                {division.age_group}
              </button>
            ))}

          </div>
        )}

        {/* OVERVIEW */}
        {activeTab === "overview" && (
          <div className="grid gap-6 lg:grid-cols-3">

            <div className="border border-scoreboard-cream/25 bg-scoreboard-green p-6">

              <Trophy className="h-6 w-6 text-scoreboard-amber" />

              <p className="scoreboard-label mt-5">
                Divisions
              </p>

              <div className="scoreboard-number mt-2 text-3xl">
                {divisions.length}
              </div>

              <div className="mt-5 space-y-2">

                {divisions.map((division) => (
                  <div
                    key={division.id}
                    className="border-t border-scoreboard-cream/15 pt-3 text-sm"
                  >
                    {division.name}
                  </div>
                ))}

              </div>

            </div>

            <div className="border border-scoreboard-cream/25 bg-scoreboard-green p-6">

              <Users className="h-6 w-6 text-scoreboard-amber" />

              <p className="scoreboard-label mt-5">
                Teams
              </p>

              <div className="scoreboard-number mt-2 text-3xl">
                {teams.length}
              </div>

              <p className="mt-4 text-sm text-scoreboard-muted">
                Approved teams currently entered in the tournament.
              </p>

            </div>

            <div className="border border-scoreboard-cream/25 bg-scoreboard-green p-6">

              <CalendarDays className="h-6 w-6 text-scoreboard-amber" />

              <p className="scoreboard-label mt-5">
                Games
              </p>

              <div className="scoreboard-number mt-2 text-3xl">
                {games.length}
              </div>

              <p className="mt-4 text-sm text-scoreboard-muted">
                Scheduled tournament games.
              </p>

            </div>

          </div>
        )}

        {/* SCHEDULE */}
        {activeTab === "schedule" && (
          <div>

            <div className="mb-5 border-b border-scoreboard-cream/20 pb-4">

              <p className="scoreboard-label">
                Game Schedule
              </p>

              <h2 className="mt-2 text-2xl font-black uppercase tracking-[0.07em]">
                Saturday Pool Play
              </h2>

            </div>

            {filteredGames.length === 0 ? (
              <div className="border border-scoreboard-cream/20 bg-scoreboard-green p-8">
                <p className="text-sm text-scoreboard-muted">
                  No games scheduled for this division.
                </p>
              </div>
            ) : (
              <div className="space-y-3">

                {filteredGames.map((game) => {
                  const gameDate = game.scheduled_start
                    ? new Date(game.scheduled_start)
                    : null

                  return (
                    <article
                      key={game.id}
                      className="border border-scoreboard-cream/25 bg-scoreboard-green p-5"
                    >

                      <div className="grid gap-5 lg:grid-cols-[120px_1fr_1fr_auto] lg:items-center">

                        <div>

                          <p className="scoreboard-label text-scoreboard-amber">
                            Game {game.game_number ?? "--"}
                          </p>

                          <div className="scoreboard-number mt-2 text-xl">

                            {gameDate
                              ? gameDate.toLocaleTimeString([], {
                                  hour: "numeric",
                                  minute: "2-digit",
                                })
                              : "TBD"}

                          </div>

                        </div>

                        <div>

                          <p className="scoreboard-label">
                            Matchup
                          </p>

                          <p className="mt-2 font-black uppercase tracking-[0.05em]">
                            {game.away_team?.display_name ??
                              "TBD"}
                          </p>

                          <p className="mt-1 text-xs text-scoreboard-muted">
                            vs
                          </p>

                          <p className="mt-1 font-black uppercase tracking-[0.05em]">
                            {game.home_team?.display_name ??
                              "TBD"}
                          </p>

                        </div>

                        <div>

                          <p className="scoreboard-label">
                            Field
                          </p>

                          <p className="mt-2 text-sm font-bold">
                            {game.field?.name ?? "TBD"}
                          </p>

                          {game.field?.city && (
                            <p className="mt-1 text-xs text-scoreboard-muted">
                              {[game.field.city, game.field.state]
                                .filter(Boolean)
                                .join(", ")}
                            </p>
                          )}

                        </div>

                        <div className="lg:text-right">

                          <span className="border border-scoreboard-cream/30 px-3 py-2 text-[10px] font-black uppercase tracking-[0.12em] text-scoreboard-muted">
                            {game.status}
                          </span>

                        </div>

                      </div>

                    </article>
                  )
                })}

              </div>
            )}

          </div>
        )}

        {/* TEAMS */}
        {activeTab === "teams" && (
          <div>

            <div className="mb-5 border-b border-scoreboard-cream/20 pb-4">

              <p className="scoreboard-label">
                Tournament Field
              </p>

              <h2 className="mt-2 text-2xl font-black uppercase tracking-[0.07em]">
                Registered Teams
              </h2>

            </div>

            <div className="grid gap-px bg-scoreboard-cream/20 md:grid-cols-2 lg:grid-cols-3">

              {filteredTeams.map((team) => {
                const division = divisions.find(
                  (item) => item.id === team.division_id
                )

                return (
                  <article
                    key={team.id}
                    className="bg-scoreboard-green p-6"
                  >

                    <p className="scoreboard-label text-scoreboard-amber">
                      {division?.age_group ?? "Division"}
                    </p>

                    <h3 className="mt-3 text-xl font-black uppercase tracking-[0.05em]">
                      {team.display_name}
                    </h3>

                    {(team.city || team.state) && (
                      <p className="mt-3 text-sm text-scoreboard-muted">
                        {[team.city, team.state]
                          .filter(Boolean)
                          .join(", ")}
                      </p>
                    )}

                    <div className="mt-5 border-t border-scoreboard-cream/20 pt-4">

                      <span className="text-xs font-black uppercase tracking-[0.12em] text-scoreboard-muted">
                        {team.status}
                      </span>

                    </div>

                  </article>
                )
              })}

            </div>

          </div>
        )}

        {/* STANDINGS */}
        {activeTab === "standings" && (
          <div className="border border-scoreboard-cream/25 bg-scoreboard-green p-8">

            <p className="scoreboard-label text-scoreboard-amber">
              Standings
            </p>

            <h2 className="mt-3 text-2xl font-black uppercase tracking-[0.07em]">
              Coming Next
            </h2>

            <p className="mt-4 max-w-2xl text-sm leading-7 text-scoreboard-muted">
              Standings will be calculated from completed tournament games.
              This will eventually update automatically when GameOn finalizes
              a tournament game.
            </p>

          </div>
        )}

      </section>

    </main>
  )
}