import { useEffect, useState } from "react"
import {
  ArrowRight,
  CalendarDays,
  MapPin,
  Trophy,
} from "lucide-react"
import { Link } from "react-router-dom"

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

export function TournamentsPage() {
  const [tournaments, setTournaments] = useState<Tournament[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    async function loadTournaments() {
      setLoading(true)
      setError("")

      const { data, error } = await supabase
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
        .neq("status", "cancelled")
        .order("start_date", { ascending: true })

      if (error) {
        setError(error.message)
        setLoading(false)
        return
      }

      setTournaments(data ?? [])
      setLoading(false)
    }

    void loadTournaments()
  }, [])

  return (
    <main className="min-h-screen bg-scoreboard-dark text-scoreboard-cream">

      {/* HERO */}
      <section className="border-b border-scoreboard-cream/20 bg-scoreboard-green">
        <div className="mx-auto max-w-7xl px-6 py-14">

          <p className="scoreboard-label text-scoreboard-amber">
            Travel Baseball
          </p>

          <h1 className="mt-3 text-4xl font-black uppercase tracking-[0.08em] sm:text-5xl">
            Tournaments
          </h1>

          <p className="mt-4 max-w-2xl text-scoreboard-muted">
           Upcoming tournaments,
            divisions, schedules, teams. 
          </p>

        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-10">

        {/* SECTION HEADER */}
        <div className="mb-6 flex items-end justify-between border-b border-scoreboard-cream/20 pb-4">

          <div>
            <p className="scoreboard-label">
              Upcoming Events
            </p>

            <h2 className="mt-2 text-2xl font-black uppercase tracking-[0.08em]">
              Tournament Schedule
            </h2>
          </div>

          {!loading && !error && (
            <div className="scoreboard-number text-2xl text-scoreboard-amber">
              {tournaments.length}
            </div>
          )}

        </div>

        {/* LOADING */}
        {loading && (
          <div className="border border-scoreboard-cream/20 bg-scoreboard-green p-6">
            <p className="scoreboard-label">
              Loading Tournaments...
            </p>
          </div>
        )}

        {/* ERROR */}
        {error && (
          <div className="border border-scoreboard-red/60 bg-scoreboard-green p-6">

            <p className="scoreboard-label text-scoreboard-amber">
              Unable To Load Tournaments
            </p>

            <p className="mt-3 text-sm text-scoreboard-muted">
              {error}
            </p>

          </div>
        )}

        {/* EMPTY */}
        {!loading && !error && tournaments.length === 0 && (
          <div className="border border-scoreboard-cream/20 bg-scoreboard-green p-8">

            <Trophy className="h-8 w-8 text-scoreboard-amber" />

            <h3 className="mt-5 text-xl font-black uppercase tracking-[0.06em]">
              No Tournaments Scheduled
            </h3>

            <p className="mt-3 text-sm text-scoreboard-muted">
              Upcoming tournaments will appear here.
            </p>

          </div>
        )}

        {/* TOURNAMENT CARDS */}
        {!loading && !error && tournaments.length > 0 && (
          <div className="grid gap-5 lg:grid-cols-2">

            {tournaments.map((tournament) => {
              const start = new Date(`${tournament.start_date}T12:00:00`)
              const end = new Date(`${tournament.end_date}T12:00:00`)

              const sameMonth =
                start.getMonth() === end.getMonth()

              const dateLabel = sameMonth
                ? `${start.toLocaleDateString([], {
                    month: "short",
                  })} ${start.getDate()}–${end.getDate()}, ${end.getFullYear()}`
                : `${start.toLocaleDateString([], {
                    month: "short",
                    day: "numeric",
                  })} – ${end.toLocaleDateString([], {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}`

              return (
                <Link
                  key={tournament.id}
                  to={`/tournaments/${tournament.id}`}
                  className="
                    group
                    border
                    border-scoreboard-cream/25
                    bg-scoreboard-green
                    p-6
                    transition-colors
                    hover:border-scoreboard-amber/60
                    hover:bg-scoreboard-light
                    sm:p-8
                  "
                >

                  <div className="flex items-start justify-between gap-5">

                    <div>

                      <div className="flex flex-wrap items-center gap-3">

                        <p className="scoreboard-label text-scoreboard-amber">
                          Tournament
                        </p>

                        <span
                          className="
                            border
                            border-scoreboard-cream/25
                            px-2
                            py-1
                            text-[10px]
                            font-black
                            uppercase
                            tracking-[0.12em]
                            text-scoreboard-muted
                          "
                        >
                          {tournament.status.replaceAll("_", " ")}
                        </span>

                      </div>

                      <h3 className="mt-4 text-2xl font-black uppercase leading-tight tracking-[0.05em] sm:text-3xl">
                        {tournament.name}
                      </h3>

                    </div>

                    <Trophy className="h-6 w-6 shrink-0 text-scoreboard-amber" />

                  </div>

                  {tournament.description && (
                    <p className="mt-5 max-w-xl text-sm leading-7 text-scoreboard-muted">
                      {tournament.description}
                    </p>
                  )}

                  <div className="mt-6 grid gap-3 border-t border-scoreboard-cream/20 pt-5 text-sm text-scoreboard-muted sm:grid-cols-2">

                    <div className="flex items-center gap-3">
                      <CalendarDays className="h-4 w-4 text-scoreboard-amber" />
                      {dateLabel}
                    </div>

                    {(tournament.city || tournament.state) && (
                      <div className="flex items-center gap-3">
                        <MapPin className="h-4 w-4 text-scoreboard-amber" />

                        {[tournament.city, tournament.state]
                          .filter(Boolean)
                          .join(", ")}
                      </div>
                    )}

                  </div>

                  <div className="mt-7 flex items-center justify-between border-t border-scoreboard-cream/20 pt-5">

                    <span className="text-xs font-black uppercase tracking-[0.14em]">
                      View Tournament
                    </span>

                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />

                  </div>

                </Link>
              )
            })}

          </div>
        )}

      </section>

    </main>
  )
}