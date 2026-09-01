import { useEffect, useState } from "react"
import {
  ArrowRight,
  MapPin,
  ShieldCheck,
  Users,
} from "lucide-react"
import { Link } from "react-router-dom"

import { supabase } from "@/lib/supabase"

type Team = {
  id: string
  name: string
  slug: string | null
  age_group: string | null
  classification: string | null
  season_year: number | null
  city: string | null
  state: string | null
  status: string

  organizations: {
    id: string
    name: string
  } | null

  team_roster_members: {
    id: string
  }[]
}

export function TeamsPage() {
  const [teams, setTeams] = useState<Team[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    async function loadTeams() {
      setLoading(true)
      setError("")

      const { data, error } = await supabase
        .from("teams")
        .select(`
          id,
          name,
          slug,
          age_group,
          classification,
          season_year,
          city,
          state,
          status,

          organizations (
            id,
            name
          ),

          team_roster_members (
            id
          )
        `)
        .eq("status", "active")
        .order("age_group")
        .order("name")

      if (error) {
        setError(error.message)
        setLoading(false)
        return
      }

      setTeams((data ?? []) as unknown as Team[])
      setLoading(false)
    }

    void loadTeams()
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
            Teams
          </h1>

          <p className="mt-4 max-w-2xl text-scoreboard-muted">
            Browse organizations, teams, rosters, and tournament participants.
          </p>

        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-10">

        <div className="mb-6 flex items-end justify-between border-b border-scoreboard-cream/20 pb-4">

          <div>
            <p className="scoreboard-label">
              Team Directory
            </p>

            <h2 className="mt-2 text-2xl font-black uppercase tracking-[0.08em]">
              Active Teams
            </h2>
          </div>

          {!loading && !error && (
            <div className="scoreboard-number text-2xl text-scoreboard-amber">
              {teams.length}
            </div>
          )}

        </div>

        {loading && (
          <div className="border border-scoreboard-cream/20 bg-scoreboard-green p-6">
            <p className="scoreboard-label">
              Loading Teams...
            </p>
          </div>
        )}

        {error && (
          <div className="border border-scoreboard-red/60 bg-scoreboard-green p-6">

            <p className="scoreboard-label text-scoreboard-amber">
              Unable To Load Teams
            </p>

            <p className="mt-3 text-sm text-scoreboard-muted">
              {error}
            </p>

          </div>
        )}

        {!loading && !error && teams.length === 0 && (
          <div className="border border-scoreboard-cream/20 bg-scoreboard-green p-8">

            <Users className="h-8 w-8 text-scoreboard-amber" />

            <h3 className="mt-5 text-xl font-black uppercase tracking-[0.06em]">
              No Teams Available
            </h3>

            <p className="mt-3 text-sm text-scoreboard-muted">
              Active teams will appear here once organizations create them.
            </p>

          </div>
        )}

        {!loading && !error && teams.length > 0 && (
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">

            {teams.map((team) => {
              const rosterCount =
                team.team_roster_members?.length ?? 0

              return (
                <article
                  key={team.id}
                  className="
                    border
                    border-scoreboard-cream/25
                    bg-scoreboard-green
                    p-6
                    transition-colors
                    hover:border-scoreboard-amber/60
                    hover:bg-scoreboard-light
                  "
                >

                  <div className="flex items-start justify-between gap-4">

                    <div>

                      <p className="scoreboard-label text-scoreboard-amber">
                        {team.age_group ?? "Team"}

                        {team.classification &&
                          ` • ${team.classification.toUpperCase()}`}
                      </p>

                      <h3 className="mt-3 text-2xl font-black uppercase leading-tight tracking-[0.05em]">
                        {team.name}
                      </h3>

                    </div>

                    <ShieldCheck className="h-6 w-6 shrink-0 text-scoreboard-amber" />

                  </div>

                  {team.organizations?.name && (
                    <p className="mt-3 text-sm font-bold">
                      {team.organizations.name}
                    </p>
                  )}

                  <div className="mt-6 space-y-3 border-t border-scoreboard-cream/15 pt-5 text-sm text-scoreboard-muted">

                    {(team.city || team.state) && (
                      <div className="flex items-center gap-3">

                        <MapPin className="h-4 w-4 text-scoreboard-amber" />

                        {[team.city, team.state]
                          .filter(Boolean)
                          .join(", ")}

                      </div>
                    )}

                    <div className="flex items-center gap-3">

                      <Users className="h-4 w-4 text-scoreboard-amber" />

                      {rosterCount}{" "}
                      {rosterCount === 1
                        ? "Player"
                        : "Players"}

                    </div>

                    {team.season_year && (
                      <div>
                        {team.season_year} Season
                      </div>
                    )}

                  </div>

                  <Link
                    to={`/teams/${team.id}`}
                    className="
                      group
                      mt-6
                      flex
                      items-center
                      justify-between
                      border-t
                      border-scoreboard-cream/20
                      pt-4
                    "
                  >

                    <span className="text-xs font-black uppercase tracking-[0.14em]">
                      View Team
                    </span>

                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />

                  </Link>

                </article>
              )
            })}

          </div>
        )}

      </section>

    </main>
  )
}