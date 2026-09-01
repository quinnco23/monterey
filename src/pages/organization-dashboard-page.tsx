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
  
    useEffect(() => {
      async function loadDashboard() {
        if (!organizationId) return
  
        setLoading(true)
        setError(null)
  
        const [
          organizationResult,
          teamsResult,
          membersResult,
        ] = await Promise.all([
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
  
          supabase
            .from("organization_members")
            .select("*", { count: "exact", head: true })
            .eq("organization_id", organizationId)
            .eq("status", "active"),
        ])
  
        if (organizationResult.error) {
          setError(organizationResult.error.message)
          setLoading(false)
          return
        }
  
        setOrganization(organizationResult.data)

        if (teamsResult.error) {
            setError(teamsResult.error.message)
            setLoading(false)
            return
          }
          
          setTeams(teamsResult.data ?? [])
  
          setStats({
            teams: teamsResult.data?.length ?? 0,
            members: membersResult.count ?? 0,
            tournaments: 0,
          })
  
        setLoading(false)
      }
  
      loadDashboard()
    }, [organizationId])
  
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
<DashboardPanel
  eyebrow="Staff & Coaches"
  title="Members"
  description="Invite coaches, team managers, scorekeepers, and organization administrators."
  href={`/dashboard/organizations/${organization.id}/members`}
  action="Manage Members"
/>

{/* TOURNAMENTS */}
<DashboardPanel
  eyebrow="Competition"
  title="Tournaments"
  description="View tournament registrations, upcoming events, schedules, and results."
  href={`/dashboard/organizations/${organization.id}/tournaments`}
  action="View Tournaments"
/>

{/* SETTINGS */}
<DashboardPanel
  eyebrow="Administration"
  title="Organization Settings"
  description="Manage your organization profile, branding, location, permissions, and public information."
  href={`/dashboard/organizations/${organization.id}/settings`}
  action="Organization Settings"
/>

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