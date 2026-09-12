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
  graduation_year: number | null
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

type TeamEvent = {
  id: string
  event_type: string
  title: string
  start_time: string
  end_time: string | null
  location_name: string | null
  opponent_name: string | null
  status: string
  source?: "organization_event" | "registered_tournament"
  tournament_id?: string
}

type TeamTournamentRegistration = {
  id: string
  status: string

  tournaments: {
    id: string
    name: string
    start_date: string
    end_date: string
    city: string | null
    state: string | null
    status: string
  } | null

  tournament_divisions: {
    id: string
    name: string
    age_group: string | null
  } | null
}

type TeamStaffMember = {
  id: string
  user_id: string
  staff_role: string
  title: string | null
  active: boolean

  profile: {
    id: string
    first_name: string | null
    last_name: string | null
    email: string | null
  } | null
}

export function TeamDashboardPage() {
  const { organizationId, teamId } = useParams()
  const [events, setEvents] =
  useState<TeamEvent[]>([])

const [tournamentRegistrations, setTournamentRegistrations] =
  useState<TeamTournamentRegistration[]>([])

  const [team, setTeam] = useState<Team | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [roster, setRoster] = useState<RosterMember[]>([])
  const [staff, setStaff] =
  useState<TeamStaffMember[]>([])

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

  // =========================
// LOAD TEAM STAFF
// =========================

const {
  data: staffRows,
  error: staffError,
} = await supabase
  .from("team_staff")
  .select(`
    id,
    user_id,
    staff_role,
    title,
    active
  `)
  .eq("team_id", teamId)
  .eq("organization_id", organizationId)
  .eq("active", true)
  .order("staff_role")

if (staffError) {
  console.error(
    "TEAM STAFF ERROR:",
    staffError
  )

  setError(staffError.message)
  setLoading(false)
  return
}

const staffUserIds =
  (staffRows ?? []).map(
    (member) => member.user_id
  )

let profileRows: {
  id: string
  first_name: string | null
  last_name: string | null
  email: string | null
}[] = []

if (staffUserIds.length > 0) {
  const {
    data: profilesData,
    error: profilesError,
  } = await supabase
    .from("profiles")
    .select(`
      id,
      first_name,
      last_name,
      email
    `)
    .in("id", staffUserIds)

  if (profilesError) {
    console.error(
      "TEAM STAFF PROFILES ERROR:",
      profilesError
    )

    setError(profilesError.message)
    setLoading(false)
    return
  }

  profileRows = profilesData ?? []
}

const normalizedStaff: TeamStaffMember[] =
  (staffRows ?? []).map((member) => ({
    id: member.id,
    user_id: member.user_id,
    staff_role: member.staff_role,
    title: member.title,
    active: member.active,

    profile:
      profileRows.find(
        (profile) =>
          profile.id === member.user_id
      ) ?? null,
  }))

      const { data: rosterData, error: rosterError } = await supabase
  .from("team_players")
  .select(`
    id,
    jersey_number,
    primary_position,
    secondary_position,
    roster_status,

    player:players!team_players_player_id_fkey (
      id,
      first_name,
      last_name,
      graduation_year
    )
  `)
  .eq("team_id", teamId)
  .eq("active", true)
  .eq("roster_status", "active")

if (rosterError) {
 
  setError(rosterError.message)
  setLoading(false)
  
  return
}

const now =
  new Date().toISOString()

const { data: eventData, error: eventError } =
  await supabase
    .from("organization_events")
    .select(`
      id,
      event_type,
      title,
      start_time,
      end_time,
      location_name,
      opponent_name,
      status
    `)
    .eq("organization_id", organizationId)
    .eq("team_id", teamId)
    .eq("status", "scheduled")
    .or(
      `end_time.gte.${now},and(end_time.is.null,start_time.gte.${now})`
    )
    .order("start_time", {
      ascending: true,
    })
    .limit(5)

if (eventError) {
  setError(eventError.message)
  setLoading(false)
  return
}

const {
  data: tournamentData,
  error: tournamentError,
} =
  await supabase
    .from("tournament_teams")
    .select(`
      id,
      status,

      tournaments (
        id,
        name,
        start_date,
        end_date,
        city,
        state,
        status
      ),

      tournament_divisions (
        id,
        name,
        age_group
      )
    `)
    .eq("team_id", teamId)
    .order("created_at", {
      ascending: false,
    })

if (tournamentError) {
  setError(tournamentError.message)
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

setStaff(normalizedStaff)



const scheduledEvents: TeamEvent[] =
  ((eventData ?? []) as TeamEvent[]).map((event) => ({
    ...event,
    source: "organization_event",
  }))

const registeredTournamentEntries =
  (tournamentData ?? []) as unknown as TeamTournamentRegistration[]

const registeredTournamentEvents: TeamEvent[] =
  registeredTournamentEntries
    .filter((entry) => entry.tournaments)
    .map((entry) => {
      const tournament = entry.tournaments!

      return {
        id: `registration-${entry.id}`,
        event_type: "tournament",
        title: tournament.name,
        start_time: `${tournament.start_date}T12:00:00`,
        end_time: tournament.end_date
          ? `${tournament.end_date}T12:00:00`
          : null,
        location_name:
          [tournament.city, tournament.state]
            .filter(Boolean)
            .join(", ") || null,
        opponent_name: null,
        status: entry.status,
        source: "registered_tournament",
        tournament_id: tournament.id,
      }
    })

const combinedEvents = [
  ...scheduledEvents,
  ...registeredTournamentEvents,
]
  .filter((event) => {
    const eventEnd =
      event.end_time ?? event.start_time

    return new Date(eventEnd).getTime() >= Date.now()
  })
  .sort(
    (a, b) =>
      new Date(a.start_time).getTime() -
      new Date(b.start_time).getTime()
  )
  .slice(0, 5)

setEvents(combinedEvents)

setTournamentRegistrations(
  registeredTournamentEntries
)

setLoading(false)
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

<Link
  to={`/dashboard/organizations/${organizationId}/teams/${teamId}/settings`}
>
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
</Link>

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
  value={String(tournamentRegistrations.length)}
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

  <div className="grid flex-1 grid-cols-[60px_1fr_80px_auto] gap-3">
  <span className="scoreboard-label">
    No.
  </span>

  <span className="scoreboard-label">
    Player
  </span>

  <span className="scoreboard-label text-right">
    Pos
  </span>

  <span className="scoreboard-label text-right">
    Actions
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
  {/* ROSTER ROWS */}
{roster.map((member) => (
  <div
    key={member.id}
    className="
      grid
      grid-cols-[60px_1fr_80px_auto]
      items-center
      gap-3
      border-b
      border-scoreboard-cream/15
      py-4
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

      {member.player?.graduation_year && (
        <p className="mt-1 text-xs text-scoreboard-muted">
          Class of {member.player.graduation_year}
        </p>
      )}
    </div>

    <span className="scoreboard-number text-right">
      {member.primary_position || "UTIL"}
    </span>

    <div className="flex items-center gap-2">
      {member.player?.id && (
        <>
          <Link
            to={`/dashboard/organizations/${organizationId}/players/${member.player.id}`}
            className="
              inline-flex
              items-center
              justify-center
              border
              border-scoreboard-amber
              px-3
              py-2
              text-[10px]
              font-black
              uppercase
              tracking-[0.12em]
              text-scoreboard-amber
              transition-colors
              hover:bg-scoreboard-amber
              hover:text-scoreboard-dark
            "
          >
            Profile
          </Link>

          <Link
            to={`/dashboard/organizations/${organizationId}/teams/${teamId}/players/${member.player.id}/edit`}
            className="
              inline-flex
              items-center
              justify-center
              border
              border-scoreboard-cream/30
              px-3
              py-2
              text-[10px]
              font-black
              uppercase
              tracking-[0.12em]
              text-scoreboard-cream
              transition-colors
              hover:border-scoreboard-amber
              hover:text-scoreboard-amber
            "
          >
            Edit
          </Link>
        </>
      )}
    </div>
  </div>
))}

</div>
)}

        {/* SIDEBAR */}
        <div className="space-y-6">

          {/* TEAM STAFF */}
<div className="scoreboard-panel p-4">
  <div className="border border-scoreboard-cream/30 bg-scoreboard-green p-6">

    <div className="flex items-start justify-between gap-4">
      <div>
        <p className="scoreboard-label text-scoreboard-amber">
          Staff
        </p>

        <h2 className="mt-2 text-xl font-black uppercase tracking-[0.07em]">
          Coaches & Staff
        </h2>
      </div>

      <Users className="h-5 w-5 text-scoreboard-amber" />
    </div>

    <div className="mt-5 border-t border-scoreboard-cream/20">
      {staff.length === 0 ? (
        <div className="py-5">
          <p className="text-sm text-scoreboard-muted">
            No coaches or team staff have been added yet.
          </p>
        </div>
      ) : (
        staff.map((member) => {
          const name = [
            member.profile?.first_name,
            member.profile?.last_name,
          ]
            .filter(Boolean)
            .join(" ")

          return (
            <div
              key={member.id}
              className="border-b border-scoreboard-cream/15 py-4 last:border-b-0"
            >
              <p className="font-black uppercase">
                {name ||
                  member.profile?.email ||
                  "Staff Member"}
              </p>

              <p className="mt-1 text-xs uppercase tracking-[0.10em] text-scoreboard-muted">
                {member.title ||
                  member.staff_role.replaceAll("_", " ")}
              </p>
            </div>
          )
        })
      )}
    </div>

    <Link
      to={`/dashboard/organizations/${organizationId}/teams/${teamId}/staff/invite`}
      className="
        mt-5
        inline-flex
        w-full
        items-center
        justify-center
        border
        border-scoreboard-amber
        bg-scoreboard-amber
        px-4
        py-3
        text-xs
        font-black
        uppercase
        tracking-[0.14em]
        text-scoreboard-dark
        transition-colors
        hover:bg-scoreboard-cream
      "
    >
      <Plus className="mr-2 h-4 w-4" />
      Invite Coach / Staff
    </Link>

  </div>
</div>

          <DashboardPanel
            eyebrow="GameOn"
            title="Game Center"
            description="Connect this team to GameOn for scoring, game results, box scores, and statistics."
            action="Connect GameOn"
          />

          

          <div className="scoreboard-panel p-4">
  <div className="border border-scoreboard-cream/30 bg-scoreboard-green p-6">

    <div className="flex items-start justify-between gap-4">
      <div>
        <p className="scoreboard-label text-scoreboard-amber">
          Schedule
        </p>

        <h2 className="mt-2 text-xl font-black uppercase tracking-[0.07em]">
          Upcoming
        </h2>
      </div>

      <CalendarDays className="h-5 w-5 text-scoreboard-amber" />
    </div>

    <div className="mt-5 border-t border-scoreboard-cream/20">

      {events.length === 0 ? (
        <div className="py-5">
          <p className="text-sm text-scoreboard-muted">
            No upcoming events for this team.
          </p>
        </div>
      ) : (
        events.map((event) => {
          const start = new Date(event.start_time)

          return (
            <Link
              key={event.id}
              to={
                event.source === "registered_tournament" &&
                event.tournament_id
                  ? `/tournaments/${event.tournament_id}`
                  : `/dashboard/organizations/${organizationId}/schedule/${event.id}/edit`
              }
              className="
                group
                block
                border-b
                border-scoreboard-cream/15
                py-4
                last:border-b-0
              "
            >
              <div className="flex items-start justify-between gap-4">

                <div className="min-w-0">

                  <p className="scoreboard-label text-scoreboard-amber">
                    {event.source === "registered_tournament"
                      ? "Registered Tournament"
                      : event.event_type.replaceAll("_", " ")}
                  </p>

                  <p className="
                    mt-2
                    font-black
                    uppercase
                    tracking-[0.04em]
                    group-hover:text-scoreboard-amber
                  ">
                    {event.title}
                  </p>

                  <p className="mt-2 text-xs text-scoreboard-muted">
                    {start.toLocaleDateString([], {
                      weekday: "short",
                      month: "short",
                      day: "numeric",
                    })}

                    {" • "}

                    {start.toLocaleTimeString([], {
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                  </p>

                  {event.location_name && (
                    <p className="mt-1 text-xs text-scoreboard-muted">
                      {event.location_name}
                    </p>
                  )}

                  {event.source === "registered_tournament" && (
                    <p className="mt-2 text-[10px] font-black uppercase tracking-[0.12em] text-scoreboard-amber">
                      {event.status.replaceAll("_", " ")}
                    </p>
                  )}

                </div>

                <span className="text-scoreboard-amber">
                  →
                </span>

              </div>
            </Link>
          )
        })
      )}

    </div>

    <Link
      to={`/dashboard/organizations/${organizationId}/schedule`}
      className="
        mt-5
        inline-flex
        border-t
        border-scoreboard-cream/20
        pt-4
        text-xs
        font-black
        uppercase
        tracking-[0.14em]
        text-scoreboard-cream
        hover:text-scoreboard-amber
      "
    >
      View Schedule →
    </Link>

  </div>
</div>

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