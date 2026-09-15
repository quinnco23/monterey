import { useEffect, useState } from "react"

import {
  ArrowLeft,
  CalendarDays,
  Plus,
  Settings,
  Trophy,
  Users,
} from "lucide-react"

import {
  Link,
  useParams,
} from "react-router-dom"

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

  invitation_status: string
  roster_status: string
  eligibility_status: string

  jersey_number: string | null
  primary_position: string | null
  secondary_position: string | null

  player: Player | null
}

type TeamRoster = {
  id: string
  name: string
  season_year: number
  season_type: string
  status: string
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

  source?:
    | "organization_event"
    | "registered_tournament"

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
  const {
    organizationId,
    teamId,
  } = useParams()

  const [events, setEvents] =
    useState<TeamEvent[]>([])

  const [
    tournamentRegistrations,
    setTournamentRegistrations,
  ] =
    useState<
      TeamTournamentRegistration[]
    >([])

  const [team, setTeam] =
    useState<Team | null>(null)

  const [loading, setLoading] =
    useState(true)

  const [error, setError] =
    useState("")

  const [roster, setRoster] =
    useState<RosterMember[]>([])

  const [
    currentRoster,
    setCurrentRoster,
  ] =
    useState<TeamRoster | null>(null)

  const [staff, setStaff] =
    useState<TeamStaffMember[]>([])

    const [managingRosterPlayerId, setManagingRosterPlayerId] =
  useState<string | null>(null)

const [manageRosterStatus, setManageRosterStatus] =
  useState("")

const [manageEligibilityStatus, setManageEligibilityStatus] =
  useState("")

const [manageSaving, setManageSaving] =
  useState(false)

const [manageError, setManageError] =
  useState("")

  const [rosterStatusSaving, setRosterStatusSaving] =
  useState(false)

const [rosterStatusError, setRosterStatusError] =
  useState("")

  useEffect(() => {
    async function loadTeam() {
      if (
        !organizationId ||
        !teamId
      ) {
        setError(
          "Missing organization or team ID."
        )

        setLoading(false)
        return
      }

      setLoading(true)
      setError("")

      // =========================
      // LOAD TEAM
      // =========================

      const {
        data: teamData,
        error: teamError,
      } = await supabase
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
        .eq(
          "organization_id",
          organizationId
        )
        .single()

      if (teamError) {
        setError(
          teamError.message
        )

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
        .from("team_members")
        .select(`
          id,
          user_id,
          role,
          title,
          active
        `)
        .eq("team_id", teamId)
        .eq(
          "organization_id",
          organizationId
        )
        .eq("active", true)
        .order("role")

      if (staffError) {
        console.error(
          "TEAM STAFF ERROR:",
          staffError
        )

        setError(
          staffError.message
        )

        setLoading(false)
        return
      }

      const staffUserIds =
        (staffRows ?? []).map(
          (member) =>
            member.user_id
        )

      let profileRows: {
        id: string
        first_name: string | null
        last_name: string | null
        email: string | null
      }[] = []

      if (
        staffUserIds.length > 0
      ) {
        const {
          data: profilesData,
          error:
            profilesError,
        } = await supabase
          .from("profiles")
          .select(`
            id,
            first_name,
            last_name,
            email
          `)
          .in(
            "id",
            staffUserIds
          )

        if (profilesError) {
          console.error(
            "TEAM STAFF PROFILES ERROR:",
            profilesError
          )

          setError(
            profilesError.message
          )

          setLoading(false)
          return
        }

        profileRows =
          profilesData ?? []
      }

      const normalizedStaff:
        TeamStaffMember[] =
        (staffRows ?? []).map(
          (member) => ({
            id: member.id,

            user_id:
              member.user_id,

            staff_role:
              member.role,

            title:
              member.title,

            active:
              member.active,

            profile:
              profileRows.find(
                (profile) =>
                  profile.id ===
                  member.user_id
              ) ?? null,
          })
        )

      // =========================
      // LOAD CURRENT ROSTER
      // =========================

      const {
        data: rosterRecord,
        error: rosterRecordError,
      } = await supabase
        .from("rosters")
        .select(`
          id,
          name,
          season_year,
          season_type,
          status
        `)
        .eq(
          "team_id",
          teamId
        )
        .eq(
          "organization_id",
          organizationId
        )
        .in("status", [
          "draft",
          "open",
          "active",
          "locked",
        ])
        .order(
          "season_year",
          {
            ascending: false,
          }
        )
        .limit(1)
        .maybeSingle()

      if (
        rosterRecordError
      ) {
        console.error(
          "TEAM ROSTER ERROR:",
          rosterRecordError
        )

        setError(
          rosterRecordError.message
        )

        setLoading(false)
        return
      }

      setCurrentRoster(
        rosterRecord ?? null
      )

      // =========================
      // LOAD ROSTER PLAYERS
      // =========================

      let normalizedRoster:
        RosterMember[] = []

      if (rosterRecord) {
        const {
          data:
            rosterPlayerRows,
          error:
            rosterPlayersError,
        } = await supabase
          .from(
            "roster_players"
          )
          .select(`
            id,
            player_id,
            invitation_status,
            roster_status,
            eligibility_status,
            jersey_number,
            primary_position,
            secondary_position
          `)
          .eq(
            "roster_id",
            rosterRecord.id
          )
          .order(
            "jersey_number",
            {
              ascending: true,
            }
          )

        if (
          rosterPlayersError
        ) {
          console.error(
            "ROSTER PLAYERS ERROR:",
            rosterPlayersError
          )

          setError(
            rosterPlayersError.message
          )

          setLoading(false)
          return
        }

        const playerIds =
          (
            rosterPlayerRows ??
            []
          ).map(
            (row) =>
              row.player_id
          )

        let playerRows:
          Player[] = []

        if (
          playerIds.length > 0
        ) {
          const {
            data:
              playersData,
            error:
              playersError,
          } = await supabase
            .from("players")
            .select(`
              id,
              first_name,
              last_name,
              graduation_year
            `)
            .in(
              "id",
              playerIds
            )

          if (
            playersError
          ) {
            console.error(
              "ROSTER PLAYER PROFILE ERROR:",
              playersError
            )

            setError(
              playersError.message
            )

            setLoading(false)
            return
          }

          playerRows =
            playersData ?? []
        }

        normalizedRoster =
          (
            rosterPlayerRows ??
            []
          ).map(
            (member) => ({
              id: member.id,

              invitation_status:
                member.invitation_status,

              roster_status:
                member.roster_status,

              eligibility_status:
                member.eligibility_status,

              jersey_number:
                member.jersey_number,

              primary_position:
                member.primary_position,

              secondary_position:
                member.secondary_position,

              player:
                playerRows.find(
                  (player) =>
                    player.id ===
                    member.player_id
                ) ?? null,
            })
          )
      }

      // =========================
      // LOAD TEAM EVENTS
      // =========================

      const now =
        new Date()
          .toISOString()

      const {
        data: eventData,
        error: eventError,
      } =
        await supabase
          .from(
            "organization_events"
          )
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
          .eq(
            "organization_id",
            organizationId
          )
          .eq(
            "team_id",
            teamId
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
              ascending:
                true,
            }
          )
          .limit(5)

      if (eventError) {
        setError(
          eventError.message
        )

        setLoading(false)
        return
      }

      // =========================
      // LOAD TOURNAMENTS
      // =========================

      const {
        data:
          tournamentData,
        error:
          tournamentError,
      } =
        await supabase
          .from(
            "tournament_teams"
          )
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
          .eq(
            "team_id",
            teamId
          )
          .order(
            "created_at",
            {
              ascending:
                false,
            }
          )

      if (
        tournamentError
      ) {
        setError(
          tournamentError.message
        )

        setLoading(false)
        return
      }

      const scheduledEvents:
        TeamEvent[] =
        (
          (eventData ??
            []) as TeamEvent[]
        ).map(
          (event) => ({
            ...event,

            source:
              "organization_event",
          })
        )

      const registeredTournamentEntries =
        (
          tournamentData ??
          []
        ) as unknown as
          TeamTournamentRegistration[]

      const registeredTournamentEvents:
        TeamEvent[] =
        registeredTournamentEntries
          .filter(
            (entry) =>
              entry.tournaments
          )
          .map(
            (entry) => {
              const tournament =
                entry.tournaments!

              return {
                id:
                  `registration-${entry.id}`,

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
                    .filter(
                      Boolean
                    )
                    .join(
                      ", "
                    ) || null,

                opponent_name:
                  null,

                status:
                  entry.status,

                source:
                  "registered_tournament",

                tournament_id:
                  tournament.id,
              }
            }
          )

      const combinedEvents =
        [
          ...scheduledEvents,
          ...registeredTournamentEvents,
        ]
          .filter(
            (event) => {
              const eventEnd =
                event.end_time ??
                event.start_time

              return (
                new Date(
                  eventEnd
                ).getTime() >=
                Date.now()
              )
            }
          )
          .sort(
            (a, b) =>
              new Date(
                a.start_time
              ).getTime() -
              new Date(
                b.start_time
              ).getTime()
          )
          .slice(
            0,
            5
          )

      setTeam(teamData)

      setRoster(
        normalizedRoster
      )

      setStaff(
        normalizedStaff
      )

      setEvents(
        combinedEvents
      )

      setTournamentRegistrations(
        registeredTournamentEntries
      )

      setLoading(false)
    }

    void loadTeam()
  }, [
    organizationId,
    teamId,
  ])

  async function handleSaveRosterPlayer(
    member: RosterMember
  ) {
    setManageSaving(true)
    setManageError("")
  
    const {
      data,
      error,
    } = await supabase.rpc(
      "update_roster_player_status",
      {
        target_roster_player_id:
          member.id,
  
        new_roster_status:
          manageRosterStatus ||
          null,
  
        new_eligibility_status:
          manageEligibilityStatus ||
          null,
      }
    )
  
    if (error) {
      console.error(
        "ROSTER PLAYER STATUS UPDATE ERROR:",
        error
      )
  
      setManageError(
        error.message
      )
  
      setManageSaving(false)
      return
    }
  
    const updated =
      Array.isArray(data)
        ? data[0]
        : data
  
    if (updated) {
      setRoster((current) =>
        current.map(
          (rosterMember) =>
            rosterMember.id ===
            member.id
              ? {
                  ...rosterMember,
  
                  roster_status:
                    updated.roster_status,
  
                  eligibility_status:
                    updated.eligibility_status,
                }
              : rosterMember
        )
      )
    }
  
    setManagingRosterPlayerId(
      null
    )
  
    setManageSaving(false)
  }

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

  if (
    error ||
    !team
  ) {
    return (
      <main className="min-h-screen bg-scoreboard-dark px-6 py-12 text-scoreboard-cream">

        <div className="mx-auto max-w-7xl">

          <div className="border border-scoreboard-red/60 bg-scoreboard-green p-6">

            <p className="scoreboard-label text-scoreboard-amber">
              Unable To Load Team
            </p>

            <p className="mt-3 text-sm text-scoreboard-muted">
              {error ||
                "Team not found."}
            </p>

          </div>

        </div>

      </main>
    )
  }

  const activeCount =
    roster.filter(
      (member) =>
        member.roster_status ===
        "active"
    ).length

  const pendingCount =
    roster.filter(
      (member) =>
        member.roster_status ===
        "pending"
    ).length

  const eligibleCount =
    roster.filter(
      (member) =>
        member.eligibility_status ===
        "eligible"
    ).length

    async function handleRosterStatusChange(
      newStatus: string
    ) {
      if (!currentRoster) {
        return
      }
    
      if (
        newStatus === "locked" &&
        !window.confirm(
          "Lock this roster? Player additions and roster changes will be blocked until it is unlocked."
        )
      ) {
        return
      }
    
      setRosterStatusSaving(true)
      setRosterStatusError("")
    
      const {
        data,
        error,
      } = await supabase.rpc(
        "update_roster_status",
        {
          target_roster_id:
            currentRoster.id,
    
          new_status:
            newStatus,
        }
      )
    
      if (error) {
        console.error(
          "ROSTER STATUS ERROR:",
          error
        )
    
        setRosterStatusError(
          error.message
        )
    
        setRosterStatusSaving(false)
        return
      }
    
      const updated =
        Array.isArray(data)
          ? data[0]
          : data
    
      if (updated) {
        setCurrentRoster(
          (current) =>
            current
              ? {
                  ...current,
                  status:
                    updated.status,
                }
              : current
        )
      }
    
      setRosterStatusSaving(false)
    }

  return (
    <main className="min-h-screen bg-scoreboard-dark text-scoreboard-cream">

      {/* =========================
          TEAM HEADER
      ========================= */}

      <section className="border-b border-scoreboard-cream/20 bg-scoreboard-green">

        <div className="mx-auto max-w-7xl px-6 py-10">

          <Link
            to={`/dashboard/organizations/${organizationId}`}
            className="
              inline-flex
              items-center
              gap-2
              text-xs
              font-black
              uppercase
              tracking-[0.14em]
              text-scoreboard-muted
              transition-colors
              hover:text-scoreboard-amber
            "
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
                  <span>
                    {team.season_year} Season
                  </span>
                )}

                {(team.city ||
                  team.state) && (
                  <span>
                    {[
                      team.city,
                      team.state,
                    ]
                      .filter(
                        Boolean
                      )
                      .join(
                        ", "
                      )}
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
                    border-scoreboard-amber
                    bg-scoreboard-amber
                    font-black
                    uppercase
                    tracking-[0.12em]
                    text-scoreboard-dark
                    hover:bg-scoreboard-cream
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
                    hover:border-scoreboard-amber
                    hover:text-scoreboard-amber
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

      {/* =========================
          TEAM STATS
      ========================= */}

      <section className="mx-auto max-w-7xl px-6 py-8">

        <div className="grid border-l border-t border-scoreboard-cream/25 sm:grid-cols-2 lg:grid-cols-4">

          <StatBlock
            label="Players"
            value={String(
              roster.length
            )}
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
            value={String(
              tournamentRegistrations.length
            )}
            icon={Trophy}
          />

        </div>

      </section>

      {/* =========================
          MAIN TEAM AREA
      ========================= */}

      <section className="mx-auto grid max-w-7xl gap-6 px-6 pb-14 lg:grid-cols-[1.55fr_.45fr]">

        {/* =========================
            ROSTER
        ========================= */}

        <div className="scoreboard-panel p-4">

          <div className="overflow-hidden border border-scoreboard-cream/30 bg-scoreboard-green">

            {/* ROSTER HEADER */}

            <div className="border-b border-scoreboard-cream/20 p-5 sm:p-6">

              <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">

                <div>

                  <p className="scoreboard-label text-scoreboard-amber">
                    Current Roster
                  </p>

                  <div className="mt-2 flex flex-wrap items-center gap-3">

                    <h2 className="text-2xl font-black uppercase tracking-[0.07em]">
                      {currentRoster?.name ??
                        "Roster"}
                    </h2>

                    {currentRoster && (
                      <span
                        className="
                          border
                          border-scoreboard-amber/60
                          bg-scoreboard-dark
                          px-2
                          py-1
                          text-[10px]
                          font-black
                          uppercase
                          tracking-[0.12em]
                          text-scoreboard-amber
                        "
                      >
                        {currentRoster.status}
                      </span>
                    )}

{currentRoster?.status === "active" && (
  <div className="flex flex-wrap gap-2">

    <button
      type="button"
      disabled={rosterStatusSaving}
      onClick={() =>
        handleRosterStatusChange(
          "open"
        )
      }
      className="
        border
        border-scoreboard-cream/30
        px-3
        py-2
        text-[10px]
        font-black
        uppercase
        tracking-[0.10em]
        text-scoreboard-cream
        hover:border-scoreboard-amber
        hover:text-scoreboard-amber
        disabled:opacity-50
      "
    >
      Open Roster
    </button>

    <button
      type="button"
      disabled={rosterStatusSaving}
      onClick={() =>
        handleRosterStatusChange(
          "locked"
        )
      }
      className="
        border
        border-scoreboard-amber
        bg-scoreboard-amber
        px-3
        py-2
        text-[10px]
        font-black
        uppercase
        tracking-[0.10em]
        text-scoreboard-dark
        hover:bg-scoreboard-cream
        disabled:opacity-50
      "
    >
      Lock Roster
    </button>

  </div>
)}

{currentRoster?.status === "open" && (
  <div className="flex flex-wrap gap-2">

    <button
      type="button"
      disabled={rosterStatusSaving}
      onClick={() =>
        handleRosterStatusChange(
          "draft"
        )
      }
      className="
        border
        border-scoreboard-cream/30
        px-3
        py-2
        text-[10px]
        font-black
        uppercase
        tracking-[0.10em]
        text-scoreboard-cream
        hover:border-scoreboard-amber
        hover:text-scoreboard-amber
      "
    >
      Back To Draft
    </button>

    <button
      type="button"
      disabled={rosterStatusSaving}
      onClick={() =>
        handleRosterStatusChange(
          "active"
        )
      }
      className="
        border
        border-scoreboard-amber
        bg-scoreboard-amber
        px-3
        py-2
        text-[10px]
        font-black
        uppercase
        tracking-[0.10em]
        text-scoreboard-dark
        hover:bg-scoreboard-cream
      "
    >
      Activate
    </button>

  </div>
)}

{currentRoster?.status === "draft" && (
  <div className="flex flex-wrap gap-2">

    <button
      type="button"
      disabled={rosterStatusSaving}
      onClick={() =>
        handleRosterStatusChange(
          "open"
        )
      }
      className="
        border
        border-scoreboard-amber
        bg-scoreboard-amber
        px-3
        py-2
        text-[10px]
        font-black
        uppercase
        tracking-[0.10em]
        text-scoreboard-dark
        hover:bg-scoreboard-cream
      "
    >
      Open Roster
    </button>

    <button
      type="button"
      disabled={rosterStatusSaving}
      onClick={() =>
        handleRosterStatusChange(
          "active"
        )
      }
      className="
        border
        border-scoreboard-cream/30
        px-3
        py-2
        text-[10px]
        font-black
        uppercase
        tracking-[0.10em]
        text-scoreboard-cream
        hover:border-scoreboard-amber
        hover:text-scoreboard-amber
      "
    >
      Activate
    </button>

  </div>
)}

{currentRoster?.status === "locked" && (
  <button
    type="button"
    disabled={rosterStatusSaving}
    onClick={() =>
      handleRosterStatusChange(
        "active"
      )
    }
    className="
      border
      border-scoreboard-amber
      px-3
      py-2
      text-[10px]
      font-black
      uppercase
      tracking-[0.10em]
      text-scoreboard-amber
      hover:bg-scoreboard-amber
      hover:text-scoreboard-dark
    "
  >
    Unlock Roster
  </button>
)}

                  </div>

                  {currentRoster && (
                    <p className="mt-2 text-sm capitalize text-scoreboard-muted">

                      {currentRoster.season_year}

                      {" • "}

                      {currentRoster.season_type.replaceAll(
                        "_",
                        " "
                      )}

                    </p>
                  )}

                </div>

                <Link
                  to={`/dashboard/organizations/${organizationId}/teams/${teamId}/players/new`}
                  className="
                    inline-flex
                    min-h-11
                    items-center
                    justify-center
                    border
                    border-scoreboard-amber
                    bg-scoreboard-amber
                    px-4
                    text-xs
                    font-black
                    uppercase
                    tracking-[0.12em]
                    text-scoreboard-dark
                    transition-colors
                    hover:bg-scoreboard-cream
                  "
                >
                  <Plus className="mr-2 h-4 w-4" />

                  Add Player
                </Link>

              </div>

            </div>

            {rosterStatusError && (
  <div className="mt-4 border border-scoreboard-red/60 bg-scoreboard-dark p-3">
    <p className="text-sm text-scoreboard-muted">
      {rosterStatusError}
    </p>
  </div>
)}

            {/* ROSTER SUMMARY */}

            <div className="grid grid-cols-2 border-b border-scoreboard-cream/20 sm:grid-cols-4">

              <RosterStat
                label="Total"
                value={roster.length}
              />

              <RosterStat
                label="Active"
                value={activeCount}
              />

              <RosterStat
                label="Pending"
                value={pendingCount}
              />

              <RosterStat
                label="Eligible"
                value={eligibleCount}
              />

            </div>

            {/* EMPTY */}

            {roster.length === 0 ? (
              <div className="flex min-h-[360px] flex-col items-center justify-center px-6 text-center">

                <div className="flex h-14 w-14 items-center justify-center border border-scoreboard-amber/50 bg-scoreboard-dark">

                  <Users className="h-6 w-6 text-scoreboard-amber" />

                </div>

                <p className="scoreboard-label mt-6 text-scoreboard-amber">
                  {currentRoster?.name ??
                    "Roster"}
                </p>

                <h3 className="mt-2 text-2xl font-black uppercase tracking-[0.08em]">
                  Build Your Roster
                </h3>

                <p className="mt-3 max-w-md text-sm leading-7 text-scoreboard-muted">
                  Add players from the organization
                  player pool or create a new player
                  for this season.
                </p>

                <Link
                  to={`/dashboard/organizations/${organizationId}/teams/${teamId}/players/new`}
                  className="
                    mt-6
                    inline-flex
                    min-h-11
                    items-center
                    justify-center
                    border
                    border-scoreboard-cream/40
                    px-5
                    text-xs
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
                  <Plus className="mr-2 h-4 w-4" />

                  Add First Player
                </Link>

              </div>
            ) : (
              <>

                {/* DESKTOP COLUMN HEADERS */}

                <div className="hidden grid-cols-[100px_1fr_93px_162px_200px] gap-4 border-b border-scoreboard-cream/20 bg-scoreboard-dark/20 px-5 py-3 md:grid">

                  <span className="scoreboard-label">
                    No.
                  </span>

                  <span className="scoreboard-label">
                    Player
                  </span>

                  <span className="scoreboard-label">
                    Pos
                  </span>

                  <span className="scoreboard-label">
                    Status
                  </span>

                  <span className="scoreboard-label text-center">
                    Actions
                  </span>

                </div>

                {/* ROSTER ROWS */}

                <div>

                  {roster.map(
                    (member) => (
                      <div
                        key={member.id}
                        className="
                          border-b
                          border-scoreboard-cream/15
                          px-5
                          py-5
                          transition-colors
                          last:border-b-0
                          hover:bg-scoreboard-dark/20
                        "
                      >

                        

                        <div className="grid gap-4 md:grid-cols-[64px_1fr_90px_160px_200px] md:items-center">

                          {/* NUMBER */}

                          

                          <div>

                            <p className="scoreboard-number text-2xl text-scoreboard-amber">
                              {member.jersey_number ||
                                "--"}
                            </p>

                          </div>

                          {/* PLAYER */}

                          <div className="min-w-0">

                            <p className="truncate font-black uppercase tracking-[0.05em]">
                              {member.player?.first_name ??
                                "Unknown"}{" "}
                              {member.player?.last_name ??
                                "Player"}
                            </p>

                            {member.player?.graduation_year && (
                              <p className="mt-1 text-xs text-scoreboard-muted">
                                Class of{" "}
                                {member.player.graduation_year}
                              </p>
                            )}

                            <div className="mt-2 flex flex-wrap gap-2">

                              <RosterBadge
                                label={
                                  member.invitation_status
                                }
                                tone={
                                  member.invitation_status ===
                                  "accepted"
                                    ? "good"
                                    : "muted"
                                }
                              />

                              <RosterBadge
                                label={
                                  member.eligibility_status
                                }
                                tone={
                                  member.eligibility_status ===
                                  "eligible"
                                    ? "good"
                                    : member.eligibility_status ===
                                        "ineligible"
                                      ? "danger"
                                      : "warning"
                                }
                              />

                            </div>

                          </div>

                          {/* POSITION */}

                          <div>

                            <p className="scoreboard-label md:hidden">
                              Position
                            </p>

                            <p className="scoreboard-number mt-1 md:mt-0">
                              {member.primary_position ||
                                "UTIL"}
                            </p>

                            {member.secondary_position && (
                              <p className="mt-1 text-[10px] uppercase tracking-[0.10em] text-scoreboard-muted">
                                {member.secondary_position}
                              </p>
                            )}

                          </div>

                          {/* ROSTER STATUS */}

                          <div className="mr-3">
  <p className="scoreboard-label mb-2 md:hidden">
    Roster Status
  </p>

  <RosterBadge
    label={member.roster_status}
    tone={
      member.roster_status === "active"
        ? "good"
        : member.roster_status === "released"
          ? "danger"
          : "warning"
    }
  />
</div>



                          {/* ACTIONS */}

                          <div className="flex gap-2 md:justify-end">

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
                                    tracking-[0.10em]
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
                                    tracking-[0.10em]
                                    text-scoreboard-cream
                                    transition-colors
                                    hover:border-scoreboard-amber
                                    hover:text-scoreboard-amber
                                  "
                                >
                                  Edit
                                </Link>

                                <button
  type="button"
  onClick={() => {
    if (
      managingRosterPlayerId ===
      member.id
    ) {
      setManagingRosterPlayerId(
        null
      )
      setManageError("")
      return
    }

    setManagingRosterPlayerId(
      member.id
    )

    setManageRosterStatus(
      member.roster_status
    )

    setManageEligibilityStatus(
      member.eligibility_status
    )

    setManageError("")
  }}
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
    tracking-[0.10em]
    text-scoreboard-cream
    transition-colors
    hover:border-scoreboard-amber
    hover:text-scoreboard-amber
  "
>
  {managingRosterPlayerId ===
  member.id
    ? "Close"
    : "Manage"}
</button>
                              </>
                            )}

                          </div>
                          

                        
                        </div>

                        {managingRosterPlayerId ===
  member.id && (
  <div className="mt-5 border-t border-scoreboard-cream/20 pt-5">

    <p className="scoreboard-label text-scoreboard-amber">
      Manage Player
    </p>

    <div className="mt-4 grid gap-4 sm:grid-cols-2">

      <label>

        <span className="scoreboard-label">
          Roster Status
        </span>

        <select
          value={
            manageRosterStatus
          }
          onChange={(event) =>
            setManageRosterStatus(
              event.target.value
            )
          }
          className="
            mt-2
            w-full
            rounded-none
            border
            border-scoreboard-cream/30
            bg-scoreboard-cream
            px-3
            py-3
            text-scoreboard-dark
            outline-none
            focus:border-scoreboard-amber
          "
        >
          <option value="pending">
            Pending
          </option>

          <option value="active">
            Active
          </option>

          <option value="inactive">
            Inactive
          </option>

          <option value="waitlist">
            Waitlist
          </option>

          <option value="released">
            Released
          </option>

        </select>

      </label>

      <label>

        <span className="scoreboard-label">
          Eligibility
        </span>

        <select
          value={
            manageEligibilityStatus
          }
          onChange={(event) =>
            setManageEligibilityStatus(
              event.target.value
            )
          }
          className="
            mt-2
            w-full
            rounded-none
            border
            border-scoreboard-cream/30
            bg-scoreboard-cream
            px-3
            py-3
            text-scoreboard-dark
            outline-none
            focus:border-scoreboard-amber
          "
        >
          <option value="pending">
            Pending
          </option>

          <option value="eligible">
            Eligible
          </option>

          <option value="ineligible">
            Ineligible
          </option>

          <option value="needs_review">
            Needs Review
          </option>

        </select>

      </label>

    </div>

    {manageError && (
      <div className="mt-4 border border-scoreboard-red/60 bg-scoreboard-dark p-3">
        <p className="text-sm text-scoreboard-muted">
          {manageError}
        </p>
      </div>
    )}

    <div className="mt-5 flex flex-wrap gap-3">

      <Button
        type="button"
        disabled={
          manageSaving
        }
        onClick={() =>
          handleSaveRosterPlayer(
            member
          )
        }
        className="
          rounded-none
          bg-scoreboard-amber
          font-black
          uppercase
          tracking-[0.12em]
          text-scoreboard-dark
          hover:bg-scoreboard-cream
        "
      >
        {manageSaving
          ? "Saving..."
          : "Save Status"}
      </Button>

      <Button
        type="button"
        variant="outline"
        disabled={
          manageSaving
        }
        onClick={() => {
          setManagingRosterPlayerId(
            null
          )

          setManageError("")
        }}
        className="
          rounded-none
          border-scoreboard-cream/30
          bg-transparent
          font-black
          uppercase
          tracking-[0.12em]
          text-scoreboard-cream
        "
      >
        Cancel
      </Button>

    </div>

  </div>
)}

                      </div>
                    )
                  )}

                </div>
                

              </>
            )}

            

          </div>

        </div>

        {/* =========================
            SIDEBAR
        ========================= */}

        <div className="space-y-6">

          {/* STAFF */}

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
                      No coaches or team staff have
                      been added yet.
                    </p>

                  </div>
                ) : (
                  staff.map(
                    (member) => {
                      const name =
                        [
                          member.profile?.first_name,
                          member.profile?.last_name,
                        ]
                          .filter(
                            Boolean
                          )
                          .join(
                            " "
                          )

                      return (
                        <div
                          key={
                            member.id
                          }
                          className="border-b border-scoreboard-cream/15 py-4 last:border-b-0"
                        >

                          <p className="font-black uppercase">
                            {name ||
                              member.profile?.email ||
                              "Staff Member"}
                          </p>

                          <p className="mt-1 text-xs uppercase tracking-[0.10em] text-scoreboard-muted">
                            {member.title ||
                              member.staff_role.replaceAll(
                                "_",
                                " "
                              )}
                          </p>

                        </div>
                      )
                    }
                  )
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

          {/* GAME CENTER */}

          <DashboardPanel
            eyebrow="GameOn"
            title="Game Center"
            description="Connect this team to GameOn for scoring, game results, box scores, and statistics."
            action="Connect GameOn"
          />

          {/* SCHEDULE */}

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
                      No upcoming events for this
                      team.
                    </p>

                  </div>
                ) : (
                  events.map(
                    (event) => {
                      const start =
                        new Date(
                          event.start_time
                        )

                      return (
                        <Link
                          key={
                            event.id
                          }
                          to={
                            event.source ===
                              "registered_tournament" &&
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
                                {event.source ===
                                "registered_tournament"
                                  ? "Registered Tournament"
                                  : event.event_type.replaceAll(
                                      "_",
                                      " "
                                    )}
                              </p>

                              <p className="mt-2 font-black uppercase tracking-[0.04em] group-hover:text-scoreboard-amber">
                                {event.title}
                              </p>

                              <p className="mt-2 text-xs text-scoreboard-muted">

                                {start.toLocaleDateString(
                                  [],
                                  {
                                    weekday:
                                      "short",

                                    month:
                                      "short",

                                    day:
                                      "numeric",
                                  }
                                )}

                                {" • "}

                                {start.toLocaleTimeString(
                                  [],
                                  {
                                    hour:
                                      "numeric",

                                    minute:
                                      "2-digit",
                                  }
                                )}

                              </p>

                              {event.location_name && (
                                <p className="mt-1 text-xs text-scoreboard-muted">
                                  {event.location_name}
                                </p>
                              )}

                              {event.source ===
                                "registered_tournament" && (
                                <p className="mt-2 text-[10px] font-black uppercase tracking-[0.12em] text-scoreboard-amber">
                                  {event.status.replaceAll(
                                    "_",
                                    " "
                                  )}
                                </p>
                              )}

                            </div>

                            <span className="text-scoreboard-amber">
                              →
                            </span>

                          </div>

                        </Link>
                      )
                    }
                  )
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

function RosterStat({
  label,
  value,
}: {
  label: string
  value: number
}) {
  return (
    <div className="border-b border-r border-scoreboard-cream/20 p-4 last:border-r-0 sm:border-b-0">

      <p className="scoreboard-label">
        {label}
      </p>

      <p className="scoreboard-number mt-2 text-2xl text-scoreboard-cream">
        {value}
      </p>

    </div>
  )
}

function RosterBadge({
  label,
  tone = "muted",
}: {
  label: string

  tone?:
    | "good"
    | "warning"
    | "danger"
    | "muted"
}) {
  const toneClasses = {
    good:
      "border-scoreboard-amber/60 text-scoreboard-amber",

    warning:
      "border-scoreboard-cream/40 text-scoreboard-cream",

    danger:
      "border-scoreboard-red/60 text-scoreboard-red",

    muted:
      "border-scoreboard-muted/40 text-scoreboard-muted",
  }

  return (
    <span
      className={`
        inline-flex
        border
        bg-scoreboard-dark
        px-2
        py-1
        text-[9px]
        font-black
        uppercase
        tracking-[0.10em]
        ${toneClasses[tone]}
      `}
    >
      {label.replaceAll(
        "_",
        " "
      )}
    </span>
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
          className="
            mt-6
            border-t
            border-scoreboard-cream/20
            pt-4
            text-xs
            font-black
            uppercase
            tracking-[0.14em]
            text-scoreboard-cream
            transition-colors
            hover:text-scoreboard-amber
          "
        >
          {action} →
        </button>

      </div>

    </div>
  )
}