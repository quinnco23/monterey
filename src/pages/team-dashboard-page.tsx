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

type Player = {
  id: string
  first_name: string
  last_name: string
  age: number | null
}

type RosterMember = {
  id: string
  jersey_number: string | null
  primary_position: string | null
  secondary_position: string | null
  roster_status: string
  player: Player | null
}

type SupabaseRosterMember = {
  id: string
  jersey_number: string | null
  primary_position: string | null
  secondary_position: string | null
  roster_status: string
  player: Player | Player[] | null
}

export function TeamDashboardPage() {
  const { organizationId, teamId } = useParams()

  const [team, setTeam] = useState<Team | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [roster, setRoster] = useState<RosterMember[]>([])

  useEffect(() => {
    async function loadTeam() {
      if (!organizationId || !teamId) {
        setError("Missing organization or team ID.")
        setLoading(false)
        return
      }

      setLoading(true)
      setError("")

      const { data: teamData, error: teamError } = await supabase
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

      if (teamError) {
        setError(teamError.message)
        setLoading(false)
        return
      }

      const { data: rosterData, error: rosterError } = await supabase
  .from("team_roster_members")
  .select(`
    id,
    jersey_number,
    primary_position,
    secondary_position,
    roster_status,
    player:players!team_roster_members_player_id_fkey (
      id,
      first_name,
      last_name,
      age
    )
  `)
  .eq("team_id", teamId)
  .eq("roster_status", "active")

if (rosterError) {
  setError(rosterError.message)
  setLoading(false)
  return
}

const rawRoster = (rosterData ?? []) as unknown as SupabaseRosterMember[]

const normalizedRoster: RosterMember[] = rawRoster.map((member) => ({
  id: member.id,
  jersey_number: member.jersey_number,
  primary_position: member.primary_position,
  secondary_position: member.secondary_position,
  roster_status: member.roster_status,

  player: Array.isArray(member.player)
    ? member.player[0] ?? null
    : member.player ?? null,
}))

setTeam(teamData)
setRoster(normalizedRoster)
setLoading(false)
      console.log("RAW ROSTER DATA:", rosterData)
console.log("ROSTER ERROR:", rosterError)
    }

    void loadTeam()
  }, [organizationId, teamId])

  

  if (loading)  {
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

              <Link
  to={`/dashboard/organizations/${organizationId}/teams/${teamId}/players/new`}
>
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
</Link>

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
  value={String(roster.length)}
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

        {roster.length === 0 ? (
  <div className="flex min-h-[300px] flex-col items-center justify-center text-center">
    <Users className="h-9 w-9 text-scoreboard-amber" />

    <h3 className="mt-5 text-xl font-black uppercase tracking-[0.08em]">
      Build Your Roster
    </h3>

    <p className="mt-3 max-w-md text-sm leading-7 text-scoreboard-muted">
      Add players to this team or import an existing roster from GameOn.
    </p>
  </div>
) : (
  <div className="mt-4">

  {/* ROSTER HEADER */}
  <div className="flex items-center justify-between border-b border-scoreboard-cream/20 pb-3">

    <div className="grid flex-1 grid-cols-[60px_1fr_80px]">
      <span className="scoreboard-label">
        No.
      </span>

      <span className="scoreboard-label">
        Player
      </span>

      <span className="scoreboard-label text-right">
        Pos
      </span>
    </div>

    <Link
      to={`/dashboard/organizations/${organizationId}/teams/${teamId}/players/new`}
      className="
        ml-5
        shrink-0
        border
        border-scoreboard-cream/40
        px-3
        py-2
        text-[10px]
        font-black
        uppercase
        tracking-[0.12em]
        text-scoreboard-cream
        transition-colors
        hover:border-scoreboard-amber
        hover:bg-scoreboard-amber
        hover:text-scoreboard-dark
      "
    >
      + Add Player
    </Link>

  </div>

  {/* ROSTER ROWS */}
  {roster.map((member) => (
 <Link
    key={member.id}
    to={`/dashboard/organizations/${organizationId}/teams/${teamId}/players/${member.player?.id}/edit`}
    className="
      group
      grid
      grid-cols-[60px_1fr_80px]
      items-center
      border-b
      border-scoreboard-cream/15
      py-4
      transition-colors
      hover:bg-scoreboard-light
    "
  >
      <span className="scoreboard-number text-xl text-scoreboard-amber">
        {member.jersey_number || "--"}
      </span>

   <div>
  <p className="font-black uppercase tracking-[0.05em]">
    {member.player?.first_name ?? "Unknown"}{" "}
    {member.player?.last_name ?? "Player"}
  </p>

  {member.player?.age && (
    <p className="mt-1 text-xs text-scoreboard-muted">
      Class of {member.player.age}
    </p>
  )}
</div>

      <span className="scoreboard-number text-right">
        {member.primary_position || "UTIL"}
      </span>

      <span className="scoreboard-number text-right transition-colors group-hover:text-scoreboard-amber">
  {member.primary_position || "UTIL"}
</span>
    </Link>
  ))}

</div>
)}

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