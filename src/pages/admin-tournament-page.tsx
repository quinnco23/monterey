import { useEffect, useState } from "react"
import {
  ArrowLeft,
  CalendarDays,
  MapPin,
  Plus,
  Trophy,
  Users,
} from "lucide-react"
import { Link, useParams } from "react-router-dom"

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
}

type TournamentGame = {
  id: string
  division_id: string
  game_number: number | null
  scheduled_start: string | null
  status: string
}

export function AdminTournamentPage() {
  const { tournamentId } = useParams()

  const [tournament, setTournament] =
    useState<Tournament | null>(null)

  const [divisions, setDivisions] =
    useState<Division[]>([])

  const [teams, setTeams] =
    useState<TournamentTeam[]>([])

  const [games, setGames] =
    useState<TournamentGame[]>([])

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
            status
          `)
          .eq("tournament_id", tournamentId)
          .order("display_name"),

        supabase
          .from("tournament_games")
          .select(`
            id,
            division_id,
            game_number,
            scheduled_start,
            status
          `)
          .eq("tournament_id", tournamentId)
          .order("scheduled_start"),
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
      setGames(gamesResult.data ?? [])

      setLoading(false)
    }

    void loadTournament()
  }, [tournamentId])

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

  const start = new Date(
    `${tournament.start_date}T12:00:00`
  )

  const end = new Date(
    `${tournament.end_date}T12:00:00`
  )

  const pendingTeams = teams.filter(
    (team) => team.status === "pending"
  ).length

  const approvedTeams = teams.filter(
    (team) => team.status === "approved"
  ).length

  return (
    <main className="min-h-screen bg-scoreboard-dark text-scoreboard-cream">

      {/* HEADER */}
      <section className="border-b border-scoreboard-cream/20 bg-scoreboard-green">

        <div className="mx-auto max-w-7xl px-6 py-10">

          <Link
            to="/admin/tournaments"
            className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.14em] text-scoreboard-muted hover:text-scoreboard-amber"
          >
            <ArrowLeft className="h-4 w-4" />
            Admin Tournaments
          </Link>

          <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_auto] lg:items-end">

            <div>

              <p className="scoreboard-label text-scoreboard-amber">
                Tournament Admin
              </p>

              <h1 className="mt-3 text-4xl font-black uppercase tracking-[0.06em] sm:text-5xl">
                {tournament.name}
              </h1>

              <div className="mt-5 flex flex-wrap gap-5 text-sm text-scoreboard-muted">

                <div className="flex items-center gap-2">
                  <CalendarDays className="h-4 w-4 text-scoreboard-amber" />

                  {start.toLocaleDateString([], {
                    month: "long",
                    day: "numeric",
                  })}

                  {" – "}

                  {end.toLocaleDateString([], {
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

            <div className="border border-scoreboard-cream/25 bg-scoreboard-dark p-5">

              <p className="scoreboard-label">
                Status
              </p>

              <div className="scoreboard-number mt-2 text-xl text-scoreboard-amber">
                {tournament.status.replaceAll("_", " ")}
              </div>

            </div>

          </div>

        </div>

      </section>

      <section className="mx-auto max-w-7xl px-6 py-10">

        {/* SUMMARY */}
        <div className="grid gap-px bg-scoreboard-cream/20 md:grid-cols-2 lg:grid-cols-4">

          <div className="bg-scoreboard-green p-6">

            <Trophy className="h-5 w-5 text-scoreboard-amber" />

            <p className="scoreboard-label mt-4">
              Divisions
            </p>

            <div className="scoreboard-number mt-2 text-3xl">
              {divisions.length}
            </div>

          </div>

          <div className="bg-scoreboard-green p-6">

            <Users className="h-5 w-5 text-scoreboard-amber" />

            <p className="scoreboard-label mt-4">
              Approved Teams
            </p>

            <div className="scoreboard-number mt-2 text-3xl">
              {approvedTeams}
            </div>

          </div>

          <div className="bg-scoreboard-green p-6">

            <Users className="h-5 w-5 text-scoreboard-amber" />

            <p className="scoreboard-label mt-4">
              Pending Teams
            </p>

            <div className="scoreboard-number mt-2 text-3xl text-scoreboard-amber">
              {pendingTeams}
            </div>

          </div>

          <div className="bg-scoreboard-green p-6">

            <CalendarDays className="h-5 w-5 text-scoreboard-amber" />

            <p className="scoreboard-label mt-4">
              Games
            </p>

            <div className="scoreboard-number mt-2 text-3xl">
              {games.length}
            </div>

          </div>

        </div>

        {/* DIVISIONS */}
        <section className="mt-10">

          <div className="flex flex-wrap items-end justify-between gap-4 border-b border-scoreboard-cream/20 pb-4">

            <div>
              <p className="scoreboard-label text-scoreboard-amber">
                Tournament Setup
              </p>

              <h2 className="mt-2 text-2xl font-black uppercase tracking-[0.07em]">
                Divisions
              </h2>
            </div>

            <Link
              to={`/admin/tournaments/${tournament.id}/divisions/new`}
              className="
                inline-flex
                items-center
                gap-2
                border
                border-scoreboard-cream/30
                px-4
                py-3
                text-xs
                font-black
                uppercase
                tracking-[0.12em]
                hover:border-scoreboard-amber
              "
            >
              <Plus className="h-4 w-4" />
              Add Division
            </Link>

          </div>

          {divisions.length === 0 ? (
            <div className="mt-5 border border-scoreboard-cream/20 bg-scoreboard-green p-8">

              <h3 className="text-xl font-black uppercase">
                No Divisions
              </h3>

              <p className="mt-3 text-sm text-scoreboard-muted">
                Add the first age group or classification for this tournament.
              </p>

            </div>
          ) : (
            <div className="mt-5 grid gap-4 md:grid-cols-2 lg:grid-cols-3">

              {divisions.map((division) => (
                <article
                  key={division.id}
                  className="border border-scoreboard-cream/25 bg-scoreboard-green p-5"
                >

                  <p className="scoreboard-label text-scoreboard-amber">
                    {division.age_group}
                  </p>

                  <h3 className="mt-2 text-xl font-black uppercase tracking-[0.05em]">
                    {division.name}
                  </h3>

                  {division.classification && (
                    <p className="mt-2 text-sm text-scoreboard-muted">
                      {division.classification}
                    </p>
                  )}

                  {division.max_teams !== null && (
                    <p className="mt-4 text-xs text-scoreboard-muted">
                      Max {division.max_teams} teams
                    </p>
                  )}

                </article>
              ))}

            </div>
          )}

        </section>

        {/* TEAMS */}
        <section className="mt-10">

          <div className="flex flex-wrap items-end justify-between gap-4 border-b border-scoreboard-cream/20 pb-4">

            <div>
              <p className="scoreboard-label text-scoreboard-amber">
                Registration
              </p>

              <h2 className="mt-2 text-2xl font-black uppercase tracking-[0.07em]">
                Teams
              </h2>
            </div>

            <Link
              to={`/admin/tournaments/${tournament.id}/teams`}
              className="
                border
                border-scoreboard-cream/30
                px-4
                py-3
                text-xs
                font-black
                uppercase
                tracking-[0.12em]
                hover:border-scoreboard-amber
              "
            >
              Manage Teams
            </Link>

          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-2 lg:grid-cols-3">

            {teams.slice(0, 6).map((team) => {
              const division = divisions.find(
                (item) => item.id === team.division_id
              )

              return (
                <article
                  key={team.id}
                  className="border border-scoreboard-cream/25 bg-scoreboard-green p-5"
                >

                  <p className="scoreboard-label text-scoreboard-amber">
                    {division?.age_group ?? "Division"}
                  </p>

                  <h3 className="mt-2 text-lg font-black uppercase tracking-[0.05em]">
                    {team.display_name}
                  </h3>

                  {(team.city || team.state) && (
                    <p className="mt-2 text-sm text-scoreboard-muted">
                      {[team.city, team.state]
                        .filter(Boolean)
                        .join(", ")}
                    </p>
                  )}

                  <div className="mt-5 border-t border-scoreboard-cream/20 pt-4">

                    <span
                      className={
                        team.status === "approved"
                          ? "text-xs font-black uppercase tracking-[0.12em] text-scoreboard-amber"
                          : "text-xs font-black uppercase tracking-[0.12em] text-scoreboard-muted"
                      }
                    >
                      {team.status}
                    </span>

                  </div>

                </article>
              )
            })}

          </div>

        </section>

        {/* SCHEDULE */}
        <section className="mt-10">

          <div className="flex flex-wrap items-end justify-between gap-4 border-b border-scoreboard-cream/20 pb-4">

            <div>
              <p className="scoreboard-label text-scoreboard-amber">
                Competition
              </p>

              <h2 className="mt-2 text-2xl font-black uppercase tracking-[0.07em]">
                Schedule
              </h2>
            </div>

            <Link
              to={`/admin/tournaments/${tournament.id}/schedule`}
              className="
                border
                border-scoreboard-cream/30
                px-4
                py-3
                text-xs
                font-black
                uppercase
                tracking-[0.12em]
                hover:border-scoreboard-amber
              "
            >
              Manage Schedule
            </Link>

          </div>

          {games.length === 0 ? (
            <div className="mt-5 border border-scoreboard-cream/20 bg-scoreboard-green p-8">

              <h3 className="text-xl font-black uppercase">
                No Games Scheduled
              </h3>

              <p className="mt-3 text-sm text-scoreboard-muted">
                Tournament games will appear here once the schedule is created.
              </p>

            </div>
          ) : (
            <div className="mt-5 border border-scoreboard-cream/25 bg-scoreboard-green p-6">

              <div className="scoreboard-number text-3xl">
                {games.length}
              </div>

              <p className="mt-2 text-sm text-scoreboard-muted">
                Tournament games currently scheduled.
              </p>

            </div>
          )}

        </section>

      </section>

    </main>
  )
}