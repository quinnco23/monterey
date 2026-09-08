import { useEffect, useMemo, useState } from "react"
import {
  ArrowLeft,
  CalendarDays,
  MapPin,
  Plus,
  Trophy,
} from "lucide-react"
import { Link, useParams } from "react-router-dom"

import { supabase } from "@/lib/supabase"

type Tournament = {
  id: string
  name: string
  start_date: string
  end_date: string
  city: string | null
  state: string | null
}

type Division = {
  id: string
  tournament_id: string
  name: string
  age_group: string
}

type TournamentTeam = {
  id: string
  display_name: string
  team_id: string | null
  status: string
}

type FieldResource = {
  id: string
  name: string
  city: string | null
  state: string | null
}

type TournamentGameRow = {
  id: string
  tournament_id: string
  division_id: string
  home_tournament_team_id: string | null
  away_tournament_team_id: string | null
  field_resource_id: string | null
  scheduled_start: string | null
  game_number: number | null
  round_name: string | null
  status: string
  home_score: number | null
  away_score: number | null
  gameon_game_id: string | null

  division: Division | null
  home_team: TournamentTeam | null
  away_team: TournamentTeam | null
  field: FieldResource | null
}

type FilterValue = "all" | string

export function TournamentSchedulePage() {
  const { tournamentId } = useParams()

  const [tournament, setTournament] =
    useState<Tournament | null>(null)

  const [divisions, setDivisions] =
    useState<Division[]>([])

  const [games, setGames] =
    useState<TournamentGameRow[]>([])

  const [divisionFilter, setDivisionFilter] =
    useState<FilterValue>("all")

  const [loading, setLoading] =
    useState(true)

  const [error, setError] =
    useState("")

  useEffect(() => {
    async function loadSchedule() {
      if (!tournamentId) {
        setError("Missing tournament ID.")
        setLoading(false)
        return
      }

      setLoading(true)
      setError("")

      const [
        tournamentResult,
        divisionResult,
        gamesResult,
      ] = await Promise.all([
        supabase
          .from("tournaments")
          .select(`
            id,
            name,
            start_date,
            end_date,
            city,
            state
          `)
          .eq("id", tournamentId)
          .single(),

        supabase
          .from("tournament_divisions")
          .select(`
            id,
            tournament_id,
            name,
            age_group
          `)
          .eq("tournament_id", tournamentId)
          .order("age_group"),

        supabase
          .from("tournament_games")
          .select(`
            id,
            tournament_id,
            division_id,
            home_tournament_team_id,
            away_tournament_team_id,
            field_resource_id,
            scheduled_start,
            game_number,
            round_name,
            status,
            home_score,
            away_score,
            gameon_game_id,

            division:tournament_divisions!tournament_games_division_id_fkey (
              id,
              tournament_id,
              name,
              age_group
            ),

            home_team:tournament_teams!tournament_games_home_tournament_team_id_fkey (
              id,
              display_name,
              team_id,
              status
            ),

            away_team:tournament_teams!tournament_games_away_tournament_team_id_fkey (
              id,
              display_name,
              team_id,
              status
            ),

            field:booking_resources!tournament_games_field_resource_id_fkey (
              id,
              name,
              city,
              state
            )
          `)
          .eq("tournament_id", tournamentId)
          .neq("status", "cancelled")
          .order("scheduled_start", {
            ascending: true,
            nullsFirst: false,
          }),
      ])

      if (tournamentResult.error) {
        setError(
          tournamentResult.error.message
        )
        setLoading(false)
        return
      }

      if (divisionResult.error) {
        setError(
          divisionResult.error.message
        )
        setLoading(false)
        return
      }

      if (gamesResult.error) {
        setError(
          gamesResult.error.message
        )
        setLoading(false)
        return
      }

      setTournament(
        tournamentResult.data as Tournament
      )

      setDivisions(
        (divisionResult.data ?? []) as Division[]
      )

      setGames(
        (gamesResult.data ?? []) as unknown as TournamentGameRow[]
      )

      setLoading(false)
    }

    void loadSchedule()
  }, [tournamentId])

  const filteredGames = useMemo(() => {
    if (divisionFilter === "all") {
      return games
    }

    return games.filter(
      (game) =>
        game.division_id === divisionFilter
    )
  }, [
    games,
    divisionFilter,
  ])

  const groupedGames = useMemo(() => {
    const groups =
      new Map<string, TournamentGameRow[]>()

    filteredGames.forEach((game) => {
      if (!game.scheduled_start) {
        return
      }

      const date =
        new Date(game.scheduled_start)

      const key = [
        date.getFullYear(),
        String(
          date.getMonth() + 1
        ).padStart(2, "0"),
        String(
          date.getDate()
        ).padStart(2, "0"),
      ].join("-")

      const current =
        groups.get(key) ?? []

      current.push(game)

      groups.set(
        key,
        current
      )
    })

    return Array.from(
      groups.entries()
    )
  }, [filteredGames])

  const unscheduledGames =
    filteredGames.filter(
      (game) =>
        !game.scheduled_start
    )

  if (loading) {
    return (
      <main className="min-h-screen bg-scoreboard-dark px-6 py-12 text-scoreboard-cream">
        <p className="scoreboard-label">
          Loading Tournament Schedule...
        </p>
      </main>
    )
  }

  if (
    error ||
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
              {error ||
                "Tournament not found."}
            </p>

          </div>

        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-scoreboard-dark text-scoreboard-cream">

      {/* HEADER */}
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

          <div className="mt-8 flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">

            <div>

              <p className="scoreboard-label text-scoreboard-amber">
                Tournament Schedule
              </p>

              <h1 className="mt-3 text-4xl font-black uppercase tracking-[0.05em] sm:text-5xl">
                {tournament.name}
              </h1>

              <div className="mt-5 flex flex-wrap gap-x-6 gap-y-2 text-sm text-scoreboard-muted">

                <div className="flex items-center gap-2">

                  <CalendarDays className="h-4 w-4 text-scoreboard-amber" />

                  {new Date(
                    `${tournament.start_date}T12:00:00`
                  ).toLocaleDateString(
                    [],
                    {
                      month: "short",
                      day: "numeric",
                    }
                  )}

                  {" – "}

                  {new Date(
                    `${tournament.end_date}T12:00:00`
                  ).toLocaleDateString(
                    [],
                    {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    }
                  )}

                </div>

                {(tournament.city ||
                  tournament.state) && (

                  <div className="flex items-center gap-2">

                    <MapPin className="h-4 w-4 text-scoreboard-amber" />

                    {[
                      tournament.city,
                      tournament.state,
                    ]
                      .filter(Boolean)
                      .join(", ")}

                  </div>

                )}

              </div>

            </div>

            <Link
              to={`/dashboard/tournaments/${tournament.id}/schedule/new`}
              className="
                inline-flex
                min-h-11
                items-center
                justify-center
                gap-2
                border
                border-scoreboard-amber
                bg-scoreboard-amber
                px-5
                py-3
                text-xs
                font-black
                uppercase
                tracking-[0.12em]
                text-scoreboard-dark
                hover:bg-scoreboard-cream
              "
            >
              <Plus className="h-4 w-4" />
              Schedule Game
            </Link>

          </div>

        </div>

      </section>

      <section className="mx-auto max-w-7xl px-6 py-10">

        {/* DIVISION FILTERS */}
        <div className="mb-8 flex flex-wrap gap-2">

          <button
            type="button"
            onClick={() =>
              setDivisionFilter("all")
            }
            className={
              divisionFilter === "all"
                ? "border border-scoreboard-amber bg-scoreboard-amber px-4 py-2 text-xs font-black uppercase tracking-[0.10em] text-scoreboard-dark"
                : "border border-scoreboard-cream/30 px-4 py-2 text-xs font-black uppercase tracking-[0.10em] hover:border-scoreboard-amber"
            }
          >
            All
          </button>

          {divisions.map(
            (division) => (

              <button
                key={division.id}
                type="button"
                onClick={() =>
                  setDivisionFilter(
                    division.id
                  )
                }
                className={
                  divisionFilter ===
                  division.id
                    ? "border border-scoreboard-amber bg-scoreboard-amber px-4 py-2 text-xs font-black uppercase tracking-[0.10em] text-scoreboard-dark"
                    : "border border-scoreboard-cream/30 px-4 py-2 text-xs font-black uppercase tracking-[0.10em] hover:border-scoreboard-amber"
                }
              >
                {division.age_group}
              </button>

            )
          )}

        </div>

        {filteredGames.length === 0 ? (

          <div className="border border-scoreboard-cream/25 bg-scoreboard-green p-8">

            <Trophy className="h-8 w-8 text-scoreboard-amber" />

            <h2 className="mt-5 text-2xl font-black uppercase tracking-[0.05em]">
              No Games Scheduled
            </h2>

            <p className="mt-3 max-w-xl text-sm leading-7 text-scoreboard-muted">
              Add the first tournament game and begin building the event schedule.
            </p>

            <Link
              to={`/dashboard/tournaments/${tournament.id}/schedule/new`}
              className="
                mt-6
                inline-flex
                items-center
                gap-2
                border
                border-scoreboard-cream
                px-4
                py-3
                text-xs
                font-black
                uppercase
                tracking-[0.10em]
                hover:bg-scoreboard-cream
                hover:text-scoreboard-dark
              "
            >
              <Plus className="h-4 w-4" />
              Schedule First Game
            </Link>

          </div>

        ) : (

          <div className="space-y-10">

            {groupedGames.map(
              ([dateKey, dayGames]) => {

                const day =
                  new Date(
                    `${dateKey}T12:00:00`
                  )

                return (
                  <section key={dateKey}>

                    <div className="mb-4 border-b border-scoreboard-cream/20 pb-3">

                      <p className="scoreboard-label text-scoreboard-amber">
                        {day.toLocaleDateString(
                          [],
                          {
                            weekday: "long",
                          }
                        )}
                      </p>

                      <h2 className="mt-1 text-2xl font-black uppercase tracking-[0.05em]">
                        {day.toLocaleDateString(
                          [],
                          {
                            month: "long",
                            day: "numeric",
                            year: "numeric",
                          }
                        )}
                      </h2>

                    </div>

                    <div className="space-y-3">

                      {dayGames.map(
                        (game) => {

                          const start =
                            new Date(
                              game.scheduled_start!
                            )

                          const awayName =
                            game.away_team
                              ?.display_name ??
                            "TBD"

                          const homeName =
                            game.home_team
                              ?.display_name ??
                            "TBD"

                          return (
                            <article
                              key={game.id}
                              className="border border-scoreboard-cream/25 bg-scoreboard-green p-5"
                            >

                              <div className="grid gap-5 md:grid-cols-[130px_1fr_auto] md:items-center">

                                <div>

                                  <p className="scoreboard-label text-scoreboard-amber">
                                    {game.division
                                      ?.age_group ??
                                      "Tournament"}
                                  </p>

                                  <div className="scoreboard-number mt-2 text-xl">

                                    {start.toLocaleTimeString(
                                      [],
                                      {
                                        hour: "numeric",
                                        minute: "2-digit",
                                      }
                                    )}

                                  </div>

                                  {game.field && (

                                    <p className="mt-2 text-xs text-scoreboard-muted">
                                      {game.field.name}
                                    </p>

                                  )}

                                </div>

                                <div className="min-w-0">

                                  {game.game_number !==
                                    null && (

                                    <p className="scoreboard-label mb-3 text-scoreboard-muted">
                                      Game {game.game_number}
                                    </p>

                                  )}

                                  <div className="grid gap-2 sm:grid-cols-[1fr_auto_1fr] sm:items-center">

                                    <p className="font-black uppercase tracking-[0.05em]">
                                      {awayName}
                                    </p>

                                    <span className="scoreboard-label text-scoreboard-muted">
                                      VS
                                    </span>

                                    <p className="font-black uppercase tracking-[0.05em] sm:text-right">
                                      {homeName}
                                    </p>

                                  </div>

                                  <div className="mt-4 flex flex-wrap gap-3 text-xs text-scoreboard-muted">

                                    {game.round_name && (
                                      <span className="uppercase">
                                        {game.round_name}
                                      </span>
                                    )}

                                    <span className="uppercase">
                                      {game.status.replaceAll(
                                        "_",
                                        " "
                                      )}
                                    </span>

                                    {game.home_score !==
                                      null &&
                                      game.away_score !==
                                        null && (

                                      <span className="font-black text-scoreboard-cream">
                                        {awayName}{" "}
                                        {game.away_score}
                                        {" – "}
                                        {homeName}{" "}
                                        {game.home_score}
                                      </span>

                                    )}

                                  </div>

                                </div>

                                <Link
                                  to={`/dashboard/tournaments/${tournament.id}/schedule/${game.id}/edit`}
                                  className="
                                    inline-flex
                                    items-center
                                    justify-center
                                    border
                                    border-scoreboard-cream/30
                                    px-4
                                    py-3
                                    text-xs
                                    font-black
                                    uppercase
                                    tracking-[0.10em]
                                    hover:border-scoreboard-amber
                                  "
                                >
                                  Edit
                                </Link>

                              </div>

                            </article>
                          )
                        }
                      )}

                    </div>

                  </section>
                )
              }
            )}

            {unscheduledGames.length > 0 && (

              <section>

                <div className="mb-4 border-b border-scoreboard-cream/20 pb-3">

                  <p className="scoreboard-label text-scoreboard-amber">
                    Tournament Operations
                  </p>

                  <h2 className="mt-1 text-2xl font-black uppercase tracking-[0.05em]">
                    Unscheduled Games
                  </h2>

                </div>

                <div className="space-y-3">

                  {unscheduledGames.map(
                    (game) => (

                      <article
                        key={game.id}
                        className="border border-scoreboard-cream/25 bg-scoreboard-green p-5"
                      >

                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

                          <div>

                            <p className="scoreboard-label text-scoreboard-amber">
                              {game.division
                                ?.age_group ??
                                "Tournament"}
                            </p>

                            <h3 className="mt-2 font-black uppercase tracking-[0.05em]">
                              {game.away_team
                                ?.display_name ??
                                "TBD"}{" "}
                              vs{" "}
                              {game.home_team
                                ?.display_name ??
                                "TBD"}
                            </h3>

                          </div>

                          <Link
                            to={`/dashboard/tournaments/${tournament.id}/schedule/${game.id}/edit`}
                            className="border border-scoreboard-cream/30 px-4 py-3 text-xs font-black uppercase tracking-[0.10em] hover:border-scoreboard-amber"
                          >
                            Schedule
                          </Link>

                        </div>

                      </article>

                    )
                  )}

                </div>

              </section>

            )}

          </div>

        )}

      </section>

    </main>
  )
}
