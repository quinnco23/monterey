import {
    ArrowRight,
    CalendarDays,
    Settings,
    ShieldCheck,
    Users,
  } from "lucide-react"
  import { Link, useParams } from "react-router-dom"
  import {
    type ReactNode,
    useEffect,
    useState,
  } from "react"
  
  import { Button } from "@/components/ui/button"
  import { supabase } from "@/lib/supabase"

  import { CalendarPlus, Trophy } from "lucide-react"
  
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

  type Tournament = {
    id: string
    organization_id: string
    name: string
    slug: string
    city: string | null
    state: string | null
    start_date: string
    end_date: string
    status: string
  }

  type TournamentRegistrationSummary = {
    id: string
    tournament_id: string
    division_id: string
    team_id: string
    organization_id: string | null
  
    status: string
    payment_status: string
    registration_fee_cents: number
  
    submitted_at: string | null
    created_at: string
  
    team: {
      id: string
      name: string
      age_group: string | null
      classification: string | null
    } | null
  
    division: {
      id: string
      name: string
      age_group: string
      classification: string | null
    } | null
  
    tournament: {
      id: string
      name: string
      city: string | null
      state: string | null
      start_date: string
      end_date: string
      status: string
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

  
  
  const [tournaments, setTournaments] =
  useState<Tournament[]>([])

  const [
    tournamentRegistrations,
    setTournamentRegistrations,
  ] = useState<TournamentRegistrationSummary[]>([])
  
  async function checkCurrentSession() {
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession()
  
    console.log("SESSION USER ID:", session?.user?.id)
    console.log("SESSION EMAIL:", session?.user?.email)
    console.log("SESSION ERROR:", error)
  }

  
  const [isPlatformAdmin, setIsPlatformAdmin] =
  useState(false)
    
  async function testAcceptGuardianInvite() {
    const { data, error } = await supabase.rpc(
      "accept_player_guardian_invitation",
      {
        invitation_id: "9ddb163e-658f-4542-9dd2-b8e50db5b32c",
      }
    )
  
    console.log("ACCEPT DATA:", data)
    console.log("ACCEPT ERROR:", error)
  }
    
    
    useEffect(() => {
  async function loadDashboard() {
    if (!organizationId) return

    setLoading(true)
    setError(null)

    const {
      data: platformAdmin,
      error: platformAdminError,
    } = await supabase.rpc("is_platform_admin")
    
    if (platformAdminError) {
      console.error(
        "PLATFORM ADMIN CHECK ERROR:",
        platformAdminError
      )
    
      setIsPlatformAdmin(false)
    } else {
      setIsPlatformAdmin(platformAdmin === true)
    }

    const now = new Date().toISOString()

    const [
      organizationResult,
      teamsResult,
      membersResult,
      eventsResult,
      tournamentsResult,
      registrationsResult,
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
        .eq(
          "status",
          "active"
        ),
    
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
        .eq(
          "status",
          "scheduled"
        )
        .or(
          `end_time.gte.${now},and(end_time.is.null,start_time.gte.${now})`
        )
        .order(
          "start_time",
          {
            ascending: true,
          }
        )
        .limit(20),
    
      // TOURNAMENTS OWNED BY THIS ORGANIZATION
      supabase
        .from("tournaments")
        .select(`
          id,
          organization_id,
          name,
          slug,
          city,
          state,
          start_date,
          end_date,
          status
        `)
        .eq(
          "organization_id",
          organizationId
        )
        .order(
          "start_date",
          {
            ascending: true,
          }
        ),

        // TOURNAMENT REGISTRATIONS FOR THIS ORGANIZATION
supabase
.from("tournament_registrations")
.select(`
  id,
  tournament_id,
  division_id,
  team_id,
  organization_id,

  status,
  payment_status,
  registration_fee_cents,

  submitted_at,
  created_at,

  team:teams (
    id,
    name,
    age_group,
    classification
  ),

  division:tournament_divisions (
    id,
    name,
    age_group,
    classification
  ),

  tournament:tournaments (
    id,
    name,
    city,
    state,
    start_date,
    end_date,
    status
  )
`)
.eq("organization_id", organizationId)
.order("created_at", {
  ascending: false,
}),
    
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

      if (registrationsResult.error) {
        setError(
          registrationsResult.error.message
        )
      
        setLoading(false)
        return
      }
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
    setTournaments(
      tournamentsResult.data ?? []
    )

    setTournamentRegistrations(
      (
        registrationsResult.data ?? []
      ) as unknown as TournamentRegistrationSummary[]
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

async function testTournamentInvite() {
  const {
    data,
    error,
  } = await supabase.functions.invoke(
    "send-tournament-invite",
    {
      body: {
        invitationId:
          "1d0a2466-16d7-4457-b212-980f0e50b506",
      },
    }
  )

  console.log(
    "INVITE DATA:",
    data
  )

  console.log(
    "INVITE ERROR:",
    error
  )

  if (error) {
    try {
      const context =
        (error as any)?.context

      if (context) {
        const body =
          await context
            .clone()
            .json()

            console.log(
              "INVITE ERROR BODY:",
              JSON.stringify(
                body,
                null,
                2
              )
            )
      }
    } catch (bodyError) {
      console.log(
        "COULD NOT READ INVITE ERROR BODY:",
        bodyError
      )
    }
  }
}

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
    
        {/* =====================================================
            ORGANIZATION HEADER
        ===================================================== */}
        <section className="border-b border-scoreboard-cream/15 bg-scoreboard-green">
    
          <div className="mx-auto max-w-7xl px-6 py-10 lg:py-12">
    
            <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
    
              {/* IDENTITY */}
              <div>
    
                <p className="scoreboard-label text-scoreboard-amber">
                  Organization Dashboard
                </p>
    
                <h1 className="mt-3 text-4xl font-black uppercase tracking-[0.05em] sm:text-5xl">
                  {organization.name}
                </h1>
    
                <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm text-scoreboard-muted">
    
                  <span className="uppercase tracking-[0.08em]">
                    {organization.organization_type.replace(
                      "_",
                      " "
                    )}
                  </span>
    
                  {(organization.city ||
                    organization.state) && (
                    <span>
                      {[
                        organization.city,
                        organization.state,
                      ]
                        .filter(Boolean)
                        .join(", ")}
                    </span>
                  )}
    
                </div>
    
              </div>
    
              {/* PRIMARY ACTIONS */}
              <div className="flex flex-wrap gap-2">
    
                <Link
                  to={`/dashboard/organizations/${organization.id}/teams/new`}
                >
                  <Button
                    className="
                      min-h-11
                      rounded-none
                      border
                      border-scoreboard-cream
                      bg-scoreboard-cream
                      px-5
                      font-black
                      uppercase
                      tracking-[0.10em]
                      text-scoreboard-dark
                      hover:bg-scoreboard-amber
                    "
                  >
                    Create Team
                  </Button>
                </Link>
    
                <Link
                  to={`/dashboard/organizations/${organization.id}/schedule/new`}
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
                    text-xs
                    font-black
                    uppercase
                    tracking-[0.10em]
                    text-scoreboard-dark
                    transition
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
                    inline-flex
                    min-h-11
                    items-center
                    justify-center
                    border
                    border-scoreboard-cream/30
                    px-5
                    text-xs
                    font-black
                    uppercase
                    tracking-[0.10em]
                    transition
                    hover:border-scoreboard-amber
                    hover:text-scoreboard-amber
                  "
                >
                  Reservations
                </Link>
    
                <Link
                  to={`/dashboard/organizations/${organization.id}/settings`}
                >
                  <Button
                    variant="outline"
                    className="
                      min-h-11
                      rounded-none
                      border-scoreboard-cream/30
                      bg-transparent
                      px-5
                      font-black
                      uppercase
                      tracking-[0.10em]
                      text-scoreboard-cream
                      hover:border-scoreboard-amber
                      hover:bg-transparent
                      hover:text-scoreboard-amber
                    "
                  >
                    <Settings className="mr-2 h-4 w-4" />
                    Settings
                  </Button>
                </Link>
    
              </div>
    
            </div>
    
            {/* PLATFORM ADMIN ACTION */}
            {isPlatformAdmin && (
              <div className="mt-8 border-t border-scoreboard-cream/15 pt-6">
    
                <Link
                  to="/dashboard/admin/tournament-invites/new"
                  className="
                    inline-flex
                    items-center
                    gap-3
                    border
                    border-scoreboard-red/60
                    px-4
                    py-3
                    text-xs
                    font-black
                    uppercase
                    tracking-[0.10em]
                    text-scoreboard-red
                    transition
                    hover:bg-scoreboard-red/10
                  "
                >
                  Invite Team To Tournament
                  <ArrowRight className="h-4 w-4" />
                </Link>
    
              </div>
            )}
    
          </div>
    
        </section>
    
    
        {/* =====================================================
            STATS
        ===================================================== */}
        <section className="mx-auto max-w-7xl px-6 py-8">
    
          <div className="grid border-l border-t border-scoreboard-cream/20 sm:grid-cols-3">
    
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
    
    
        {/* =====================================================
            TEAMS
        ===================================================== */}
        <section className="mx-auto max-w-7xl px-6 pb-12">
    
          <SectionHeader
            eyebrow="Organization"
            title="Teams"
            action={
              <Link
                to={`/dashboard/organizations/${organization.id}/teams/new`}
                className="
                  text-xs
                  font-black
                  uppercase
                  tracking-[0.12em]
                  text-scoreboard-cream
                  hover:text-scoreboard-amber
                "
              >
                + Create Team
              </Link>
            }
          />
    
          {teams.length === 0 ? (
    
            <div className="mt-6 border border-scoreboard-cream/20 bg-scoreboard-green p-8">
    
              <p className="scoreboard-label text-scoreboard-amber">
                No Teams
              </p>
    
              <h3 className="mt-3 text-xl font-black uppercase tracking-[0.05em]">
                Create Your First Team
              </h3>
    
              <p className="mt-3 max-w-xl text-sm leading-6 text-scoreboard-muted">
                Add a team to begin building rosters,
                registering for tournaments, and connecting
                games to GameOn.
              </p>
    
              <Link
                to={`/dashboard/organizations/${organization.id}/teams/new`}
                className="
                  mt-6
                  inline-flex
                  items-center
                  gap-2
                  text-xs
                  font-black
                  uppercase
                  tracking-[0.12em]
                  text-scoreboard-amber
                "
              >
                Create Team
                <ArrowRight className="h-4 w-4" />
              </Link>
    
            </div>
    
          ) : (
    
            <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
    
              {teams.map((team) => (
    
                <Link
                  key={team.id}
                  to={`/dashboard/organizations/${organization.id}/teams/${team.id}`}
                  className="
                    group
                    border
                    border-scoreboard-cream/20
                    bg-scoreboard-green
                    p-5
                    transition
                    hover:border-scoreboard-amber/70
                  "
                >
    
                  <div className="flex items-start justify-between gap-4">
    
                    <div>
    
                      <p className="scoreboard-label text-scoreboard-amber">
                        {team.age_group}
    
                        {team.classification &&
                          ` • ${team.classification.toUpperCase()}`}
                      </p>
    
                      <h3 className="mt-2 text-xl font-black uppercase tracking-[0.04em]">
                        {team.name}
                      </h3>
    
                    </div>
    
                    <ShieldCheck className="h-5 w-5 shrink-0 text-scoreboard-amber" />
    
                  </div>
    
                  <p className="mt-4 text-sm text-scoreboard-muted">
                    {[
                      team.season_year
                        ? `${team.season_year} Season`
                        : null,
    
                      [team.city, team.state]
                        .filter(Boolean)
                        .join(", "),
                    ]
                      .filter(Boolean)
                      .join(" • ")}
                  </p>
    
                  <div className="mt-5 flex items-center justify-between border-t border-scoreboard-cream/15 pt-4">
    
                    <span className="text-xs font-black uppercase tracking-[0.10em] text-scoreboard-amber">
                      Team Dashboard
                    </span>
    
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
    
                  </div>
    
                </Link>
    
              ))}
    
            </div>
    
          )}
    
        </section>
    
    
        {/* =====================================================
            TOURNAMENT REGISTRATIONS
        ===================================================== */}
        <section className="mx-auto max-w-7xl px-6 pb-12">
    
          <SectionHeader
            eyebrow="Competition"
            title="Tournament Registrations"
            description="Tournament entries for your organization's teams."
            icon={
              <Trophy className="h-5 w-5 text-scoreboard-amber" />
            }
          />
    
          {tournamentRegistrations.length === 0 ? (
    
            <div className="mt-6 border-y border-scoreboard-cream/15 py-8">
    
              <p className="text-sm text-scoreboard-muted">
                No tournament registrations yet.
              </p>
    
            </div>
    
          ) : (
    
            <div className="mt-4">
    
              {tournamentRegistrations.map(
                (registration) => {
    
                  const tournament =
                    registration.tournament
    
                  const team =
                    registration.team
    
                  const division =
                    registration.division
    
                  const statusTone =
                    registration.status === "approved"
                      ? "border-green-500/40 text-green-400"
                      : registration.status === "waitlisted"
                        ? "border-amber-500/40 text-amber-400"
                        : registration.status === "declined"
                          ? "border-scoreboard-red/50 text-scoreboard-red"
                          : registration.status === "withdrawn"
                            ? "border-scoreboard-muted/40 text-scoreboard-muted"
                            : "border-scoreboard-cream/30 text-scoreboard-cream"
    
                  return (
                    <Link
                      key={registration.id}
                      to={`/dashboard/organizations/${organization.id}/tournament-registrations/${registration.id}`}
                      className="
                        group
                        flex
                        flex-col
                        gap-5
                        border-b
                        border-scoreboard-cream/15
                        py-5
                        transition
                        hover:bg-scoreboard-green/30
                        sm:flex-row
                        sm:items-center
                        sm:justify-between
                        sm:px-3
                      "
                    >
    
                      <div className="min-w-0">
    
                        <div className="flex flex-wrap items-center gap-3">
    
                          <span className="scoreboard-label text-scoreboard-amber">
                            {division?.age_group ??
                              team?.age_group ??
                              "Tournament"}
                          </span>
    
                          <span
                            className={`
                              inline-flex
                              border
                              px-2
                              py-1
                              text-[9px]
                              font-black
                              uppercase
                              tracking-[0.10em]
                              ${statusTone}
                            `}
                          >
                            {registration.status.replaceAll(
                              "_",
                              " "
                            )}
                          </span>
    
                        </div>
    
                        <h3 className="mt-2 text-xl font-black uppercase tracking-[0.04em]">
                          {tournament?.name ??
                            "Tournament"}
                        </h3>
    
                        <p className="mt-2 text-sm text-scoreboard-muted">
                          {[
                            team?.name,
                            division?.name,
                          ]
                            .filter(Boolean)
                            .join(" • ")}
                        </p>
    
                        {tournament && (
                          <p className="mt-1 text-xs text-scoreboard-muted">
    
                            {new Date(
                              tournament.start_date
                            ).toLocaleDateString([], {
                              month: "short",
                              day: "numeric",
                            })}
    
                            {" – "}
    
                            {new Date(
                              tournament.end_date
                            ).toLocaleDateString([], {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })}
    
                            {(tournament.city ||
                              tournament.state) && (
                              <>
                                {" • "}
    
                                {[
                                  tournament.city,
                                  tournament.state,
                                ]
                                  .filter(Boolean)
                                  .join(", ")}
                              </>
                            )}
    
                          </p>
                        )}
    
                      </div>
    
                      <div className="flex shrink-0 items-center justify-between gap-6 sm:justify-end">
    
                        <div className="text-left sm:text-right">
    
                          <p className="scoreboard-label text-scoreboard-muted">
                            Payment
                          </p>
    
                          <p
                            className={`
                              mt-1
                              text-xs
                              font-black
                              uppercase
                              ${
                                registration.payment_status ===
                                "paid"
                                  ? "text-scoreboard-amber"
                                  : "text-scoreboard-cream"
                              }
                            `}
                          >
                            {registration.payment_status.replaceAll(
                              "_",
                              " "
                            )}
                          </p>
    
                        </div>
    
                        <ArrowRight className="h-4 w-4 text-scoreboard-amber transition-transform group-hover:translate-x-1" />
    
                      </div>
    
                    </Link>
                  )
                }
              )}
    
            </div>
    
          )}
    
        </section>
    
    
        {/* =====================================================
            UPCOMING SCHEDULE
        ===================================================== */}
        <section className="mx-auto max-w-7xl px-6 pb-12">
    
          <SectionHeader
            eyebrow="Schedule"
            title="Upcoming"
            action={
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
            }
          />
    
          <div className="mt-4">
    
            {upcomingSchedule.length === 0 ? (
    
              <div className="border-b border-scoreboard-cream/15 py-6">
    
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
                      gap-5
                      border-b
                      border-scoreboard-cream/15
                      py-5
                      transition
                      hover:bg-scoreboard-green/30
                      sm:px-3
                    "
                  >
    
                    <div className="min-w-0">
    
                      <div className="flex flex-wrap items-center gap-2">
    
                        <span className="scoreboard-label text-scoreboard-amber">
                          {event.source ===
                          "registered_tournament"
                            ? "Tournament"
                            : event.event_type.replaceAll(
                                "_",
                                " "
                              )}
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
    
                      <p className="mt-2 font-black uppercase tracking-[0.04em] group-hover:text-scoreboard-amber">
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
    
                    <ArrowRight className="h-4 w-4 shrink-0 text-scoreboard-amber transition-transform group-hover:translate-x-1" />
    
                  </Link>
                )
              })
    
            )}
    
          </div>
    
        </section>
    
    
        {/* =====================================================
            ORGANIZATION TOOLS
        ===================================================== */}
        <section className="mx-auto max-w-7xl px-6 pb-12">
    
          <SectionHeader
            eyebrow="Organization"
            title="Tools"
          />
    
          <div className="mt-6 grid gap-4 md:grid-cols-2">
    
            <DashboardPanel
              eyebrow="Roster Management"
              title="Player Pool"
              description="Manage players and build team rosters."
              href={`/dashboard/organizations/${organization.id}/players`}
              action="Manage Players"
            />
    
            <DashboardPanel
              eyebrow="Organization"
              title="Members & Staff"
              description="Manage coaches, managers, scorekeepers, and organization access."
              href={`/dashboard/organizations/${organization.id}/members`}
              action="Manage Members"
            />
    
          </div>
    
        </section>
    
    
        {/* =====================================================
            TOURNAMENT OPERATIONS
            Only visible when this organization hosts tournaments.
        ===================================================== */}
        {tournaments.length > 0 && (
    
          <section className="mx-auto max-w-7xl px-6 pb-12">
    
            <SectionHeader
              eyebrow="Tournament Operations"
              title="Hosted Tournaments"
              description="Manage registrations, pools, and scheduling for tournaments operated by this organization."
              icon={
                <Trophy className="h-5 w-5 text-scoreboard-amber" />
              }
            />
    
            <div className="mt-6 space-y-3">
    
              {tournaments.map((tournament) => (
    
                <div
                  key={tournament.id}
                  className="
                    border
                    border-scoreboard-cream/20
                    bg-scoreboard-green
                    p-5
                  "
                >
    
                  <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
    
                    <div>
    
                      <div className="flex flex-wrap items-center gap-3">
    
                        <h3 className="text-lg font-black uppercase tracking-[0.04em]">
                          {tournament.name}
                        </h3>
    
                        <span className="border border-scoreboard-cream/25 px-2 py-1 text-[9px] font-black uppercase tracking-[0.10em] text-scoreboard-muted">
                          {tournament.status.replaceAll(
                            "_",
                            " "
                          )}
                        </span>
    
                      </div>
    
                      <p className="mt-2 text-xs text-scoreboard-muted">
    
                        {new Date(
                          tournament.start_date
                        ).toLocaleDateString([], {
                          month: "short",
                          day: "numeric",
                        })}
    
                        {" – "}
    
                        {new Date(
                          tournament.end_date
                        ).toLocaleDateString([], {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
    
                        {(tournament.city ||
                          tournament.state) && (
                          <>
                            {" • "}
                            {[
                              tournament.city,
                              tournament.state,
                            ]
                              .filter(Boolean)
                              .join(", ")}
                          </>
                        )}
    
                      </p>
    
                    </div>
    
                    <div className="flex flex-wrap gap-2">
    
                      <Link
                        to={`/dashboard/tournaments/${tournament.id}/registrations`}
                        className="
                          inline-flex
                          min-h-10
                          items-center
                          justify-center
                          border
                          border-scoreboard-amber
                          bg-scoreboard-amber
                          px-4
                          text-xs
                          font-black
                          uppercase
                          tracking-[0.08em]
                          text-scoreboard-dark
                          hover:bg-scoreboard-cream
                        "
                      >
                        Registrations
                      </Link>
    
                      <Link
                        to={`/dashboard/tournaments/${tournament.id}/pools`}
                        className="
                          inline-flex
                          min-h-10
                          items-center
                          justify-center
                          border
                          border-scoreboard-cream/30
                          px-4
                          text-xs
                          font-black
                          uppercase
                          tracking-[0.08em]
                          hover:border-scoreboard-amber
                          hover:text-scoreboard-amber
                        "
                      >
                        Pools
                      </Link>
    
                      <Link
                        to={`/dashboard/tournaments/${tournament.id}/schedule`}
                        className="
                          inline-flex
                          min-h-10
                          items-center
                          justify-center
                          border
                          border-scoreboard-cream/30
                          px-4
                          text-xs
                          font-black
                          uppercase
                          tracking-[0.08em]
                          hover:border-scoreboard-amber
                          hover:text-scoreboard-amber
                        "
                      >
                        Schedule
                      </Link>
    
                    </div>
    
                  </div>
    
                </div>
    
              ))}
    
            </div>
    
          </section>
    
        )}
    
    
        {/* =====================================================
            ADMINISTRATION
        ===================================================== */}
        <section className="border-t border-scoreboard-cream/15 bg-scoreboard-green/30">
    
          <div className="mx-auto max-w-7xl px-6 py-8">
    
            <Link
              to={`/dashboard/organizations/${organization.id}/settings`}
              className="
                group
                flex
                items-center
                justify-between
                gap-6
                py-3
              "
            >
    
              <div>
    
                <p className="scoreboard-label text-scoreboard-amber">
                  Administration
                </p>
    
                <h2 className="mt-2 text-lg font-black uppercase tracking-[0.05em]">
                  Organization Settings
                </h2>
    
                <p className="mt-1 text-sm text-scoreboard-muted">
                  Organization details, preferences, and administration.
                </p>
    
              </div>
    
              <ArrowRight className="h-5 w-5 shrink-0 text-scoreboard-amber transition-transform group-hover:translate-x-1" />
    
            </Link>
    
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

  function SectionHeader({
    eyebrow,
    title,
    description,
    action,
    icon,
  }: {
    eyebrow: string
    title: string
    description?: string
    action?: React.ReactNode
    icon?: React.ReactNode
  }) {
    return (
      <div className="flex items-end justify-between gap-6 border-b border-scoreboard-cream/20 pb-4">
  
        <div>
  
          <p className="scoreboard-label text-scoreboard-amber">
            {eyebrow}
          </p>
  
          <h2 className="mt-2 text-2xl font-black uppercase tracking-[0.07em]">
            {title}
          </h2>
  
          {description && (
            <p className="mt-2 max-w-2xl text-sm text-scoreboard-muted">
              {description}
            </p>
          )}
  
        </div>
  
        {action ?? icon}
  
      </div>
    )
  }