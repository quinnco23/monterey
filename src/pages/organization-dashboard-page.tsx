import {
    ArrowRight,
    CalendarDays,
    Settings,
    ShieldCheck,
    Users,
  } from "lucide-react"
  import { Link, useParams } from "react-router-dom"
  import { useEffect, useState } from "react"
  
  import { Button } from "@/components/ui/button"
  import { supabase } from "@/lib/supabase"

  import { CalendarPlus } from "lucide-react"
  
  type Organization = {
    id: string
    name: string
    slug: string
    organization_type: string
    city: string | null
    state: string | null
  }
  
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

  type DashboardStats = {
    teams: number
    members: number
    tournaments: number
  }

  type OrganizationEvent = {
    id: string
    team_id: string | null
    event_type: string
    title: string
    start_time: string
    end_time: string | null
    location_name: string | null
    status: string
  
    public_tournament_id?: string | null
    tournament_id?: string
    source?: "organization_event" | "registered_tournament"
  
    teams: {
      id: string
      name: string
      age_group: string | null
    } | null
  }
  
  export function OrganizationDashboardPage() {
    const { organizationId } = useParams()
  
    const [organization, setOrganization] =
      useState<Organization | null>(null)
  
    const [stats, setStats] = useState<DashboardStats>({
      teams: 0,
      members: 0,
      tournaments: 0,
    })

    const [teams, setTeams] = useState<Team[]>([])
  
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [events, setEvents] =
  useState<OrganizationEvent[]>([])
    
   
    
    
    useEffect(() => {
  async function loadDashboard() {
    if (!organizationId) return

    setLoading(true)
    setError(null)

    const now = new Date().toISOString()

    const [
      organizationResult,
      teamsResult,
      membersResult,
      eventsResult,
    ] = await Promise.all([
      // ORGANIZATION
      supabase
        .from("organizations")
        .select(`
          id,
          name,
          slug,
          organization_type,
          city,
          state
        `)
        .eq("id", organizationId)
        .single(),

      // TEAMS
      supabase
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
        .eq("organization_id", organizationId)
        .order("name"),

      // MEMBERS
      supabase
        .from("organization_members")
        .select("*", {
          count: "exact",
          head: true,
        })
        .eq(
          "organization_id",
          organizationId
        )
        .eq("status", "active"),

      // UPCOMING ORGANIZATION EVENTS
      supabase
        .from("organization_events")
        .select(`
          id,
          team_id,
          event_type,
          title,
          start_time,
          end_time,
          location_name,
          status,
           public_tournament_id,

          teams (
            id,
            name,
            age_group
          )
        `)
        .eq(
          "organization_id",
          organizationId
        )
        .eq("status", "scheduled")
        .or(
          `end_time.gte.${now},and(end_time.is.null,start_time.gte.${now})`
        )
        .order("start_time", {
          ascending: true,
        })
        .limit(20),
    ])

    // ORGANIZATION ERROR
    if (organizationResult.error) {
      setError(
        organizationResult.error.message
      )
      setLoading(false)
      return
    }

    // TEAMS ERROR
    if (teamsResult.error) {
      setError(
        teamsResult.error.message
      )
      setLoading(false)
      return
    }

    // MEMBERS ERROR
    if (membersResult.error) {
      setError(
        membersResult.error.message
      )
      setLoading(false)
      return
    }

    // EVENTS ERROR
    if (eventsResult.error) {
      setError(
        eventsResult.error.message
      )
      setLoading(false)
      return
    }

    const teamIds =
  (teamsResult.data ?? []).map(
    (team) => team.id
  )

const {
  data: registeredTournamentData,
  error: registeredTournamentError,
} =
  teamIds.length > 0
    ? await supabase
        .from("tournament_teams")
        .select(`
          id,
          team_id,
          status,

          teams (
            id,
            name,
            age_group
          ),

          tournaments (
            id,
            name,
            start_date,
            end_date,
            city,
            state,
            status
          )
        `)
        .in("team_id", teamIds)
        .in("status", [
          "pending",
          "approved",
          "waitlist",
        ])
    : {
        data: [],
        error: null,
      }

if (registeredTournamentError) {
  setError(
    registeredTournamentError.message
  )
  setLoading(false)
  return
}

const organizationEvents: OrganizationEvent[] =
(
  eventsResult.data ?? []
).map((event: any) => ({
  ...event,
  source: "organization_event",
}))

const alreadyScheduledTournamentIds =
new Set(
  organizationEvents
    .map(
      (event) =>
        event.public_tournament_id
    )
    .filter(Boolean)
)

const registeredTournamentEvents: OrganizationEvent[] =
(
  registeredTournamentData ?? []
)
  .filter((entry: any) => {
    const tournament =
      entry.tournaments

    if (!tournament) {
      return false
    }

    // Prevent duplicate cards when this tournament
    // already exists as an organization event.
    return !alreadyScheduledTournamentIds.has(
      tournament.id
    )
  })
  .map((entry: any) => {
    const tournament =
      entry.tournaments

    return {
      id: `registration-${entry.id}`,

      team_id:
        entry.team_id,

      event_type:
        "tournament",

      title:
        tournament.name,

      start_time:
        `${tournament.start_date}T12:00:00`,

      end_time:
        tournament.end_date
          ? `${tournament.end_date}T12:00:00`
          : null,

      location_name:
        [
          tournament.city,
          tournament.state,
        ]
          .filter(Boolean)
          .join(", ") || null,

      status:
        entry.status,

      teams:
        entry.teams ?? null,

      tournament_id:
        tournament.id,

      source:
        "registered_tournament",
    }
  })

const upcomingEvents = [
...organizationEvents,
...registeredTournamentEvents,
]
.filter((event) => {
  const ending =
    event.end_time ??
    event.start_time

  return (
    new Date(ending).getTime() >=
    Date.now()
  )
})
.sort(
  (a, b) =>
    new Date(
      a.start_time
    ).getTime() -
    new Date(
      b.start_time
    ).getTime()
)

const scheduledTournaments =
upcomingEvents.filter(
  (event) =>
    event.event_type ===
    "tournament"
)

    setOrganization(
      organizationResult.data
    )

    setTeams(
      teamsResult.data ?? []
    )

    setEvents(
      upcomingEvents
    )

    setStats({
      teams:
        teamsResult.data?.length ?? 0,

      members:
        membersResult.count ?? 0,

      tournaments:
        scheduledTournaments.length,
    })

    setLoading(false)
  }

  void loadDashboard()
}, [organizationId])

    const scheduledTournaments =
  events.filter(
    (event) =>
      event.event_type ===
      "tournament"
  )

const upcomingSchedule =
  events.slice(0, 5)
  
    if (loading) {
      return (
        <main className="min-h-screen bg-scoreboard-dark px-6 py-12 text-scoreboard-cream">
          <div className="mx-auto max-w-7xl">
            <p className="scoreboard-label">
              Loading organization...
            </p>
          </div>
        </main>
      )
    }
  
    if (error || !organization) {
      return (
        <main className="min-h-screen bg-scoreboard-dark px-6 py-12 text-scoreboard-cream">
          <div className="mx-auto max-w-7xl">
            <div className="border border-scoreboard-red/50 bg-scoreboard-green p-6">
              <p className="scoreboard-label text-scoreboard-amber">
                Unable to load organization
              </p>
  
              <p className="mt-3 text-sm text-scoreboard-muted">
                {error}
              </p>
            </div>
          </div>
        </main>
      )
    }
  
    return (
      <main className="min-h-screen bg-scoreboard-dark text-scoreboard-cream">
  
        {/* ORGANIZATION HEADER */}
        <section className="border-b border-scoreboard-cream/20 bg-scoreboard-green">
          <div className="mx-auto max-w-7xl px-6 py-12">
  
            <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
  
              <div>
                <p className="scoreboard-label text-scoreboard-amber">
                  Organization Dashboard
                </p>
  
                <h1 className="mt-3 text-4xl font-black uppercase tracking-[0.06em] sm:text-5xl">
                  {organization.name}
                </h1>
  
                <div className="mt-4 flex flex-wrap gap-4 text-sm text-scoreboard-muted">
  
                  <span className="uppercase tracking-[0.08em]">
                    {organization.organization_type.replace("_", " ")}
                  </span>
  
                  {organization.city && (
                    <span>
                      {organization.city}
                      {organization.state
                        ? `, ${organization.state}`
                        : ""}
                    </span>
                  )}
  
                </div>
              </div>
  
              <div className="flex flex-wrap gap-3">
  
                <Link
                  to={`/dashboard/organizations/${organization.id}/teams/new`}
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
                    Create Team
                  </Button>

                  
                </Link>

                
  
                <Link
                  to={`/dashboard/organizations/${organization.id}/settings`}
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
                    Settings
                  </Button>
                </Link>
                {/* <Link
  to={`/dashboard/organizations/${organization.id}/schedule`}
  className="
    border
    border-scoreboard-cream/25
    bg-scoreboard-green
    p-5
    transition-colors
    hover:border-scoreboard-amber
  "
>
  <p className="scoreboard-label text-scoreboard-amber">
    Calendar
  </p>

  <h3 className="mt-2 text-xl font-black uppercase tracking-[0.05em]">
    Schedule
  </h3>

  <p className="mt-3 text-sm text-scoreboard-muted">
    Practices, scrimmages, games, and tournaments.
  </p>
</Link> */}
<Link
  to={`/dashboard/organizations/${organizationId}/schedule/new`}
  className="
    inline-flex
    min-h-11
    items-center
    justify-center
    gap-2
    rounded-none
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
    transition-colors
    hover:border-scoreboard-cream
    hover:bg-scoreboard-cream
  "
>
  <CalendarPlus className="h-4 w-4" />
  Schedule Event
</Link>

                <Link
  to="/dashboard/reservations"
  className="
    border
    border-scoreboard-cream/30
    bg-scoreboard-green
    px-5
    py-4
    text-xs
    font-black
    uppercase
    tracking-[0.12em]
    hover:border-scoreboard-amber
  "
>
  My Reservations
</Link>
  
              </div>
            </div>
  
          </div>
        </section>
  
       {/* STATS */}
<section className="mx-auto max-w-7xl px-6 py-8">

<div className="grid border-l border-t border-scoreboard-cream/25 sm:grid-cols-3">

  <StatBlock
    label="Teams"
    value={stats.teams}
    icon={ShieldCheck}
  />

  <StatBlock
    label="Members"
    value={stats.members}
    icon={Users}
  />

  <StatBlock
    label="Tournaments"
    value={stats.tournaments}
    icon={CalendarDays}
  />

</div>

</section>


{/* TEAMS */}
<section className="mx-auto max-w-7xl px-6 pb-8">

  <div className="flex items-end justify-between border-b border-scoreboard-cream/20 pb-4">

    <div>
      <p className="scoreboard-label text-scoreboard-amber">
        Organization
      </p>

      <h2 className="mt-2 text-2xl font-black uppercase tracking-[0.08em]">
        Teams
      </h2>

      <Link
  to={`/dashboard/organizations/${organization.id}/players`}
  className="
    block
    border
    border-scoreboard-cream/20
    bg-scoreboard-green
    p-5
  "
>
  <div className="scoreboard-label">
    Organization
  </div>

  <div className="mt-2 flex items-end justify-between">
    <div>
      <h2 className="text-xl font-bold text-scoreboard-cream">
        Player Pool
      </h2>

      <p className="mt-1 text-sm text-scoreboard-muted">
        Manage players and build team rosters
      </p>
    </div>

    <span className="text-scoreboard-amber">
      View →
    </span>
  </div>
</Link>
    </div>

    <Link
      to={`/dashboard/organizations/${organization.id}/teams/new`}
      className="
        text-xs
        font-black
        uppercase
        tracking-[0.14em]
        text-scoreboard-cream
        transition-colors
        hover:text-scoreboard-amber
      "
    >
      + Create Team
    </Link>

  </div>

  {teams.length === 0 ? (

    <div className="mt-6 border border-scoreboard-cream/25 bg-scoreboard-green p-8">

      <p className="scoreboard-label text-scoreboard-amber">
        No Teams
      </p>

      <h3 className="mt-3 text-xl font-black uppercase tracking-[0.06em]">
        Create Your First Team
      </h3>

      <p className="mt-3 text-sm text-scoreboard-muted">
        Add a team to begin building rosters, registering for tournaments,
        and connecting games to GameOn.
      </p>

      <Link
        to={`/dashboard/organizations/${organization.id}/teams/new`}
        className="
          mt-6
          inline-flex
          items-center
          gap-2
          border
          border-scoreboard-cream
          bg-scoreboard-cream
          px-5
          py-3
          text-xs
          font-black
          uppercase
          tracking-[0.12em]
          text-scoreboard-dark
          hover:bg-scoreboard-amber
        "
      >
        Create Team
        <ArrowRight className="h-4 w-4" />
      </Link>

    </div>

  ) : (

    <div className="mt-6 grid gap-5 md:grid-cols-2 lg:grid-cols-3">

      {teams.map((team) => (

        <Link
          key={team.id}
          to={`/dashboard/organizations/${organization.id}/teams/${team.id}`}
          className="
            group
            block
            cursor-pointer
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
                {team.age_group}

                {team.classification &&
                  ` • ${team.classification.toUpperCase()}`}
              </p>

              <h3 className="mt-3 text-2xl font-black uppercase leading-tight tracking-[0.05em]">
                {team.name}
              </h3>
            </div>

            <ShieldCheck className="h-5 w-5 shrink-0 text-scoreboard-amber" />

          </div>

          <div className="mt-5 space-y-1 text-sm text-scoreboard-muted">

            {team.season_year && (
              <p>{team.season_year} Season</p>
            )}

            {(team.city || team.state) && (
              <p>
                {[team.city, team.state]
                  .filter(Boolean)
                  .join(", ")}
              </p>
            )}

          </div>

          <div className="mt-7 flex items-center justify-between border-t border-scoreboard-cream/20 pt-4">

            <span className="text-xs font-black uppercase tracking-[0.12em]">
              Team Dashboard
            </span>

            <ArrowRight
              className="
                h-4
                w-4
                transition-transform
                group-hover:translate-x-1
              "
            />

          </div>

        </Link>

      ))}

    </div>

  )}

</section>


{/* DASHBOARD PANELS */}
<section className="mx-auto grid max-w-7xl gap-6 px-6 pb-14 lg:grid-cols-2">

{/* TEAMS */}
{/* <DashboardPanel
  eyebrow="Organization"
  title="Teams"
  description="Create and manage your travel baseball teams, age groups, classifications, and team profiles."
  href={`/dashboard/organizations/${organization.id}/teams`}
  action="Manage Teams"
/> */}

{/* MEMBERS */}
<Link
  to={`/dashboard/organizations/${organization.id}/members`}
  className="
    scoreboard-panel
    flex
    items-center
    justify-between
    p-5
    transition
    hover:border-scoreboard-amber
  "
>
  <div>
    <p className="scoreboard-label text-scoreboard-amber">
      Organization
    </p>

    <h2 className="mt-1 text-lg font-black uppercase">
      Members & Staff
    </h2>

    <p className="mt-2 text-sm opacity-60">
      Coaches, managers, scorekeepers, and organization access.
    </p>
  </div>

  <span className="text-xl text-scoreboard-amber">
    →
  </span>
</Link>

{/* TOURNAMENTS */}
{/* UPCOMING SCHEDULE */}
<div className="border border-scoreboard-cream/25 bg-scoreboard-green p-6">

  <div className="flex items-start justify-between gap-4">

    <div>
      <p className="scoreboard-label text-scoreboard-amber">
        Calendar
      </p>

      <h2 className="mt-2 text-xl font-black uppercase tracking-[0.06em]">
        Upcoming events
      </h2>
    </div>

    <Link
      to={`/dashboard/organizations/${organization.id}/schedule`}
      className="
        text-xs
        font-black
        uppercase
        tracking-[0.10em]
        text-scoreboard-amber
        hover:text-scoreboard-cream
      "
    >
      View All →
    </Link>

  </div>

  <div className="mt-6 border-t border-scoreboard-cream/20">

    {upcomingSchedule.length === 0 ? (
      <div className="py-5">

        <p className="text-sm text-scoreboard-muted">
          No upcoming events.
        </p>

        <Link
          to={`/dashboard/organizations/${organization.id}/schedule/new`}
          className="
            mt-4
            inline-flex
            text-xs
            font-black
            uppercase
            tracking-[0.10em]
            text-scoreboard-amber
            hover:text-scoreboard-cream
          "
        >
          + Schedule Event
        </Link>

      </div>
    ) : (
      upcomingSchedule.map((event) => {
        const start =
          new Date(event.start_time)

        return (
          <Link
            key={event.id}
            to={
              event.source ===
                "registered_tournament" &&
              event.tournament_id
                ? `/tournaments/${event.tournament_id}`
                : `/dashboard/organizations/${organization.id}/schedule/${event.id}/edit`
            }
            className="
              group
              flex
              items-center
              justify-between
              gap-4
              border-b
              border-scoreboard-cream/15
              py-4
              last:border-b-0
            "
          >

            <div className="min-w-0">

              <div className="flex flex-wrap items-center gap-2">

                <span className="scoreboard-label text-scoreboard-amber">
                {event.source === "registered_tournament"
  ? "Registered Tournament"
  : event.event_type.replaceAll("_", " ")}
                </span>

                {event.teams && (
                  <span className="text-xs text-scoreboard-muted">
                    {[
                      event.teams.age_group,
                      event.teams.name,
                    ]
                      .filter(Boolean)
                      .join(" ")}
                  </span>
                )}

              </div>

              <p className="
                mt-2
                font-black
                uppercase
                tracking-[0.04em]
                group-hover:text-scoreboard-amber
              ">
                {event.title}
              </p>

              <p className="mt-1 text-xs text-scoreboard-muted">
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

                {event.location_name && (
                  <>
                    {" • "}
                    {event.location_name}
                  </>
                )}
              </p>

            </div>

            <ArrowRight className="h-4 w-4 shrink-0 text-scoreboard-amber" />

          </Link>
        )
      })
    )}

  </div>

</div>


{/* SCHEDULED TOURNAMENTS */}
{/* <div className="border border-scoreboard-cream/25 bg-scoreboard-green p-6">

  <div className="flex items-start justify-between gap-4">

    <div>
      <p className="scoreboard-label text-scoreboard-amber">
        Competition
      </p>

      <h2 className="mt-2 text-xl font-black uppercase tracking-[0.06em]">
        Scheduled Tournaments
      </h2>
    </div>

    <Link
      to={`/dashboard/organizations/${organization.id}/schedule`}
      className="
        text-xs
        font-black
        uppercase
        tracking-[0.10em]
        text-scoreboard-amber
        hover:text-scoreboard-cream
      "
    >
      View Schedule →
    </Link>

  </div>

  <div className="mt-6 border-t border-scoreboard-cream/20">

    {scheduledTournaments.length === 0 ? (
      <div className="py-5">

        <p className="text-sm text-scoreboard-muted">
          No tournaments currently scheduled.
        </p>

        <Link
          to={`/dashboard/organizations/${organization.id}/schedule/new`}
          className="
            mt-4
            inline-flex
            text-xs
            font-black
            uppercase
            tracking-[0.10em]
            text-scoreboard-amber
            hover:text-scoreboard-cream
          "
        >
          + Schedule Tournament
        </Link>

      </div>
    ) : (
      scheduledTournaments.map((event) => {
        const start =
          new Date(event.start_time)

        const end =
          event.end_time
            ? new Date(event.end_time)
            : null

        return (
          <Link
            key={event.id}
            to={`/dashboard/organizations/${organization.id}/schedule/${event.id}/edit`}
            className="
              group
              flex
              items-center
              justify-between
              gap-4
              border-b
              border-scoreboard-cream/15
              py-4
              last:border-b-0
            "
          >

            <div className="min-w-0">

              <p className="
                font-black
                uppercase
                tracking-[0.04em]
                group-hover:text-scoreboard-amber
              ">
                {event.title}
              </p>

              <p className="mt-1 text-xs text-scoreboard-muted">

                {start.toLocaleDateString([], {
                  month: "short",
                  day: "numeric",
                })}

                {end && (
                  <>
                    {" – "}

                    {end.toLocaleDateString([], {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </>
                )}

              </p>

              {(event.teams ||
                event.location_name) && (
                <p className="mt-1 text-xs text-scoreboard-muted">

                  {event.teams &&
                    [
                      event.teams.age_group,
                      event.teams.name,
                    ]
                      .filter(Boolean)
                      .join(" ")}

                  {event.teams &&
                    event.location_name &&
                    " • "}

                  {event.location_name}

                </p>
              )}

            </div>

            <ArrowRight className="h-4 w-4 shrink-0 text-scoreboard-amber" />

          </Link>
        )
      })
    )}

  </div>

</div> */}

{/* SETTINGS */}
<Link
  to={`/dashboard/organizations/${organization.id}/settings`}
  className="
    scoreboard-panel
    flex
    items-center
    justify-between
    p-5
    transition
    hover:border-scoreboard-amber
  "
>
  <div>
    <p className="scoreboard-label text-scoreboard-amber">
      Administration
    </p>

    <h2 className="mt-1 text-lg font-black uppercase">
      Organization Settings
    </h2>

    <p className="mt-2 text-sm opacity-60">
      Manage organization information and preferences.
    </p>
  </div>

  <span className="text-xl text-scoreboard-amber">
    →
  </span>
</Link>

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
    value: number
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
        
  
        <div className="scoreboard-number mt-4 text-5xl text-scoreboard-cream">
          {value}
        </div>
        
      </div>
    )
  }

  
  
  function DashboardPanel({
    eyebrow,
    title,
    description,
    href,
    action,
  }: {
    eyebrow: string
    title: string
    description: string
    href: string
    action: string
  }) {
    return (
      <div className="scoreboard-panel p-4">
  
        <div className="h-full border border-scoreboard-cream/30 bg-scoreboard-green p-6">
  
          <p className="scoreboard-label text-scoreboard-amber">
            {eyebrow}
          </p>
  
          <h2 className="mt-3 text-2xl font-black uppercase tracking-[0.07em]">
            {title}
          </h2>
  
          <p className="mt-4 max-w-lg text-sm leading-7 text-scoreboard-muted">
            {description}
          </p>
  
          <Link
            to={href}
            className="
              mt-8
              flex
              items-center
              justify-between
              border-t
              border-scoreboard-cream/20
              pt-5
              text-xs
              font-black
              uppercase
              tracking-[0.14em]
              text-scoreboard-cream
              transition-colors
              hover:text-scoreboard-amber
            "
          >
            {action}
  
            <ArrowRight className="h-4 w-4" />
          </Link>
  
        </div>
  
      </div>
    )
  }