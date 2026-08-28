import { useEffect, useState } from "react"
import {
  ArrowLeft,
  CalendarDays,
  Plus,
  Settings,
  Trophy,
  Users,
} from "lucide-react"
import { Link, useParams } from "react-router-dom"

import { Button } from "@/components/ui/button"
import { supabase } from "@/lib/supabase"

type Team = {
  id: string
  organization_id: string
  name: string
  slug: string
  age_group: string
  classification: string | null
  season_year: number | null
  city: string | null
  state: string | null
  status: string
}

export function TeamDashboardPage() {
  const { organizationId, teamId } = useParams()

  const [team, setTeam] = useState<Team | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    async function loadTeam() {
      if (!organizationId || !teamId) return

      setLoading(true)
      setError("")

      const { data, error } = await supabase
        .from("teams")
        .select(`
          id,
          organization_id,
          name,
          slug,
          age_group,
          classification,
          season_year,
          city,
          state,
          status
        `)
        .eq("id", teamId)
        .eq("organization_id", organizationId)
        .single()

      if (error) {
        setError(error.message)
        setLoading(false)
        return
      }

      setTeam(data)
      setLoading(false)
    }

    void loadTeam()
  }, [organizationId, teamId])

  if (loading) {
    return (
      <main className="min-h-screen bg-scoreboard-dark px-6 py-12 text-scoreboard-cream">
        <div className="mx-auto max-w-7xl">
          <p className="scoreboard-label">
            Loading Team...
          </p>
        </div>
      </main>
    )
  }

  if (error || !team) {
    return (
      <main className="min-h-screen bg-scoreboard-dark px-6 py-12 text-scoreboard-cream">
        <div className="mx-auto max-w-7xl">
          <div className="border border-scoreboard-red/60 bg-scoreboard-green p-6">
            <p className="scoreboard-label text-scoreboard-amber">
              Unable To Load Team
            </p>

            <p className="mt-3 text-sm text-scoreboard-muted">
              {error || "Team not found."}
            </p>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-scoreboard-dark text-scoreboard-cream">

      {/* TEAM HEADER */}
      <section className="border-b border-scoreboard-cream/20 bg-scoreboard-green">
        <div className="mx-auto max-w-7xl px-6 py-10">

          <Link
            to={`/dashboard/organizations/${organizationId}`}
            className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.14em] text-scoreboard-muted transition-colors hover:text-scoreboard-amber"
          >
            <ArrowLeft className="h-4 w-4" />
            Organization Dashboard
          </Link>

          <div className="mt-8 flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">

            <div>
              <p className="scoreboard-label text-scoreboard-amber">
                {team.age_group}
                {team.classification &&
                  ` • ${team.classification.toUpperCase()}`}
              </p>

              <h1 className="mt-3 text-4xl font-black uppercase leading-none tracking-[0.05em] sm:text-5xl lg:text-6xl">
                {team.name}
              </h1>

              <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-sm text-scoreboard-muted">

                {team.season_year && (
                  <span>{team.season_year} Season</span>
                )}

                {(team.city || team.state) && (
                  <span>
                    {[team.city, team.state]
                      .filter(Boolean)
                      .join(", ")}
                  </span>
                )}

                <span className="uppercase">
                  {team.status}
                </span>

              </div>
            </div>

            <div className="flex flex-wrap gap-3">

              <Button
                className="
                  rounded-none
                  border
                  border-scoreboard-cream
                  bg-scoreboard-cream
                  font-black
                  uppercase
                  tracking-[0.12em]
                  text-scoreboard-dark
                  hover:bg-scoreboard-amber
                  hover:text-scoreboard-dark
                "
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Player
              </Button>

              <Button
                variant="outline"
                className="
                  rounded-none
                  border-scoreboard-cream/40
                  bg-transparent
                  font-black
                  uppercase
                  tracking-[0.12em]
                  text-scoreboard-cream
                  hover:bg-scoreboard-light
                  hover:text-scoreboard-cream
                "
              >
                <Settings className="mr-2 h-4 w-4" />
                Team Settings
              </Button>

            </div>
          </div>
        </div>
      </section>

      {/* TEAM STATS */}
      <section className="mx-auto max-w-7xl px-6 py-8">

        <div className="grid border-l border-t border-scoreboard-cream/25 sm:grid-cols-2 lg:grid-cols-4">

          <StatBlock
            label="Players"
            value="0"
            icon={Users}
          />

          <StatBlock
            label="Games"
            value="0"
            icon={CalendarDays}
          />

          <StatBlock
            label="Record"
            value="0-0"
            icon={Trophy}
          />

          <StatBlock
            label="Tournaments"
            value="0"
            icon={Trophy}
          />

        </div>
      </section>

      {/* MAIN TEAM AREA */}
      <section className="mx-auto grid max-w-7xl gap-6 px-6 pb-14 lg:grid-cols-[1.4fr_.6fr]">

        {/* ROSTER */}
        <div className="scoreboard-panel p-4">

          <div className="min-h-[420px] border border-scoreboard-cream/30 bg-scoreboard-green p-6">

            <div className="flex items-end justify-between border-b border-scoreboard-cream/20 pb-4">

              <div>
                <p className="scoreboard-label text-scoreboard-amber">
                  Team
                </p>

                <h2 className="mt-2 text-2xl font-black uppercase tracking-[0.07em]">
                  Roster
                </h2>
              </div>

              <div className="scoreboard-number text-3xl">
                00
              </div>

            </div>

            {/* EMPTY ROSTER */}
            <div className="flex min-h-[300px] flex-col items-center justify-center text-center">

              <Users className="h-9 w-9 text-scoreboard-amber" />

              <h3 className="mt-5 text-xl font-black uppercase tracking-[0.08em]">
                Build Your Roster
              </h3>

              <p className="mt-3 max-w-md text-sm leading-7 text-scoreboard-muted">
                Add players to this team or import an existing
                roster from GameOn.
              </p>

              <div className="mt-6 flex flex-wrap justify-center gap-3">

                <Button
                  className="
                    rounded-none
                    bg-scoreboard-cream
                    font-black
                    uppercase
                    tracking-[0.12em]
                    text-scoreboard-dark
                    hover:bg-scoreboard-amber
                  "
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Player
                </Button>

                <Button
                  variant="outline"
                  className="
                    rounded-none
                    border-scoreboard-cream/40
                    bg-transparent
                    font-black
                    uppercase
                    tracking-[0.12em]
                    text-scoreboard-cream
                    hover:bg-scoreboard-light
                    hover:text-scoreboard-cream
                  "
                >
                  Import From GameOn
                </Button>

              </div>

            </div>

          </div>
        </div>

        {/* SIDEBAR */}
        <div className="space-y-6">

          <DashboardPanel
            eyebrow="GameOn"
            title="Game Center"
            description="Connect this team to GameOn for scoring, game results, box scores, and statistics."
            action="Connect GameOn"
          />

          <DashboardPanel
            eyebrow="Schedule"
            title="Upcoming"
            description="No games or tournaments are currently scheduled for this team."
            action="View Schedule"
          />

        </div>

      </section>

    </main>
  )
}

function StatBlock({
  label,
  value,
  icon: Icon,
}: {
  label: string
  value: string
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

      <div className="scoreboard-number mt-4 text-4xl text-scoreboard-cream">
        {value}
      </div>

    </div>
  )
}

function DashboardPanel({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow: string
  title: string
  description: string
  action: string
}) {
  return (
    <div className="scoreboard-panel p-4">

      <div className="border border-scoreboard-cream/30 bg-scoreboard-green p-6">

        <p className="scoreboard-label text-scoreboard-amber">
          {eyebrow}
        </p>

        <h2 className="mt-2 text-xl font-black uppercase tracking-[0.07em]">
          {title}
        </h2>

        <p className="mt-4 text-sm leading-7 text-scoreboard-muted">
          {description}
        </p>

        <button
          type="button"
          className="mt-6 border-t border-scoreboard-cream/20 pt-4 text-xs font-black uppercase tracking-[0.14em] text-scoreboard-cream transition-colors hover:text-scoreboard-amber"
        >
          {action} →
        </button>

      </div>

    </div>
  )
}