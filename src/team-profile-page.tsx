import { useEffect, useMemo, useState } from "react"
import {
  CalendarDays,
  Clock,
  MapPin,
  Trophy,
  Users,
} from "lucide-react"
import { Link, useParams } from "react-router-dom"

import { supabase } from "@/lib/supabase"

type Team = {
  id: string
  name: string
  age_group: string | null
  classification: string | null
  season_year: number | null
  city: string | null
  state: string | null

  organizations: {
    id: string
    name: string
  } | null
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

  booking_resources: {
    id: string
    name: string
    city: string | null
    state: string | null
  } | null

  tournaments: {
    id: string
    name: string
  } | null
}

type TournamentEntry = {
  id: string
  display_name: string
  status: string

  tournaments: {
    id: string
    name: string
    start_date: string
    end_date: string
    city: string | null
    state: string | null
  } | null

  tournament_divisions: {
    id: string
    name: string
    age_group: string
  } | null
}

export function TeamProfilePage() {
  const { teamId } = useParams()

  const [team, setTeam] = useState<Team | null>(null)
  const [events, setEvents] = useState<TeamEvent[]>([])
  const [tournaments, setTournaments] = useState<TournamentEntry[]>([])
  const [rosterCount, setRosterCount] = useState<number | null>(null)

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    async function loadTeamProfile() {
      if (!teamId) {
        setError("Missing team ID.")
        setLoading(false)
        return
      }

      setLoading(true)
      setError("")

      const [
        teamResult,
        scheduleResult,
        tournamentResult,
      ] = await Promise.all([
        supabase
          .from("teams")
          .select(`
            id,
            name,
            age_group,
            classification,
            season_year,
            city,
            state,

            organizations (
              id,
              name
            )
          `)
          .eq("id", teamId)
          .eq("status", "active")
          .single(),

        supabase
          .from("organization_events")
          .select(`
            id,
            event_type,
            title,
            start_time,
            end_time,
            location_name,
            opponent_name,
            status,

            booking_resources:resource_id (
              id,
              name,
              city,
              state
            ),

            tournaments (
              id,
              name
            )
          `)
          .eq("team_id", teamId)
          .eq("status", "scheduled")
          .gte("start_time", new Date().toISOString())
          .order("start_time", {
            ascending: true,
          }),

        supabase
          .from("tournament_teams")
          .select(`
            id,
            display_name,
            status,

            tournaments (
              id,
              name,
              start_date,
              end_date,
              city,
              state
            ),

            tournament_divisions (
              id,
              name,
              age_group
            )
          `)
          .eq("team_id", teamId)
          .in("status", ["approved", "pending", "waitlist"]),
      ])

      if (teamResult.error) {
        setError(teamResult.error.message)
        setLoading(false)
        return
      }

      if (scheduleResult.error) {
        setError(scheduleResult.error.message)
        setLoading(false)
        return
      }

      if (tournamentResult.error) {
        setError(tournamentResult.error.message)
        setLoading(false)
        return
      }

      setTeam(teamResult.data as unknown as Team)

      setEvents(
        (scheduleResult.data ?? []) as unknown as TeamEvent[]
      )

      setTournaments(
        (tournamentResult.data ?? []) as unknown as TournamentEntry[]
      )

      /*
        For now, keep public roster names private.

        If your RLS currently allows a safe roster count query,
        we can wire that next. Otherwise leave rosterCount null
        and simply show "Roster information private".
      */

      setLoading(false)
    }

    void loadTeamProfile()
  }, [teamId])

  const nextEvent = events[0] ?? null

  const upcomingEvents = useMemo(
    () => events.slice(1, 6),
    [events]
  )

  if (loading) {
    return (
      <main className="min-h-screen bg-scoreboard-dark px-4 py-12 text-scoreboard-cream sm:px-6">
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
      <main className="min-h-screen bg-scoreboard-dark px-4 py-12 text-scoreboard-cream sm:px-6">
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

      {/* HERO */}
      <section className="border-b border-scoreboard-cream/20 bg-scoreboard-green">

        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16">

          <p className="scoreboard-label text-scoreboard-amber">
            {team.organizations?.name ?? "Baseball Team"}
          </p>

          <h1 className="mt-3 break-words text-4xl font-black uppercase leading-tight tracking-[0.04em] sm:text-5xl sm:tracking-[0.06em]">
            {team.name}
          </h1>

          <div className="mt-5 flex flex-wrap gap-x-6 gap-y-3 text-sm text-scoreboard-muted">

            {(team.age_group || team.classification) && (
              <div className="flex items-center gap-2">

                <Trophy className="h-4 w-4 text-scoreboard-amber" />

                {[team.age_group, team.classification]
                  .filter(Boolean)
                  .join(" • ")}

              </div>
            )}

            {(team.city || team.state) && (
              <div className="flex items-center gap-2">

                <MapPin className="h-4 w-4 text-scoreboard-amber" />

                {[team.city, team.state]
                  .filter(Boolean)
                  .join(", ")}

              </div>
            )}

            {team.season_year && (
              <div className="flex items-center gap-2">

                <CalendarDays className="h-4 w-4 text-scoreboard-amber" />

                {team.season_year} Season

              </div>
            )}

          </div>

          {team.organizations && (
            <div className="mt-7 flex flex-wrap gap-3">

              <Link
                to={`/organizations/${team.organizations.id}/schedule`}
                className="
                  inline-flex
                  min-h-11
                  items-center
                  justify-center
                  border
                  border-scoreboard-cream
                  px-4
                  py-3
                  text-xs
                  font-black
                  uppercase
                  tracking-[0.10em]
                  hover:bg-scoreboard-cream
                  hover:text-scoreboard-dark
                "
              >
                Organization Schedule
              </Link>

            </div>
          )}

        </div>

      </section>

      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6">

        <div className="grid gap-8 lg:grid-cols-[1.4fr_.6fr]">

          {/* LEFT COLUMN */}
          <div className="space-y-10">

            {/* NEXT EVENT */}
            <section>

              <div className="mb-5 border-b border-scoreboard-cream/20 pb-4">

                <p className="scoreboard-label text-scoreboard-amber">
                  Up Next
                </p>

                <h2 className="mt-2 text-2xl font-black uppercase tracking-[0.05em]">
                  Next Event
                </h2>

              </div>

              {!nextEvent ? (
                <div className="border border-scoreboard-cream/20 bg-scoreboard-green p-8">

                  <CalendarDays className="h-7 w-7 text-scoreboard-amber" />

                  <h3 className="mt-5 text-xl font-black uppercase">
                    No Upcoming Events
                  </h3>

                  <p className="mt-3 text-sm text-scoreboard-muted">
                    This team does not currently have any scheduled events.
                  </p>

                </div>
              ) : (
                <EventCard
                  event={nextEvent}
                  featured
                />
              )}

            </section>

            {/* UPCOMING */}
            <section>

              <div className="mb-5 border-b border-scoreboard-cream/20 pb-4">

                <p className="scoreboard-label text-scoreboard-amber">
                  Schedule
                </p>

                <h2 className="mt-2 text-2xl font-black uppercase tracking-[0.05em]">
                  Upcoming
                </h2>

              </div>

              {upcomingEvents.length === 0 ? (
                <div className="border border-scoreboard-cream/20 bg-scoreboard-green p-6">
                  <p className="text-sm text-scoreboard-muted">
                    No additional upcoming events.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">

                  {upcomingEvents.map((event) => (
                    <EventCard
                      key={event.id}
                      event={event}
                    />
                  ))}

                </div>
              )}

            </section>

            {/* TOURNAMENTS */}
            <section>

              <div className="mb-5 border-b border-scoreboard-cream/20 pb-4">

                <p className="scoreboard-label text-scoreboard-amber">
                  Competition
                </p>

                <h2 className="mt-2 text-2xl font-black uppercase tracking-[0.05em]">
                  Tournaments
                </h2>

              </div>

              {tournaments.length === 0 ? (
                <div className="border border-scoreboard-cream/20 bg-scoreboard-green p-6">
                  <p className="text-sm text-scoreboard-muted">
                    No tournament registrations are currently listed.
                  </p>
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2">

                  {tournaments.map((entry) => {
                    const tournament = entry.tournaments

                    if (!tournament) return null

                    const start = new Date(
                      `${tournament.start_date}T12:00:00`
                    )

                    return (
                      <Link
                        key={entry.id}
                        to={`/tournaments/${tournament.id}`}
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
                          {entry.tournament_divisions?.age_group ??
                            "Tournament"}
                        </p>

                        <h3 className="mt-3 text-lg font-black uppercase tracking-[0.04em]">
                          {tournament.name}
                        </h3>

                        <p className="mt-3 text-sm text-scoreboard-muted">
                          {start.toLocaleDateString([], {
                            month: "long",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </p>

                        {(tournament.city || tournament.state) && (
                          <p className="mt-2 text-sm text-scoreboard-muted">
                            {[tournament.city, tournament.state]
                              .filter(Boolean)
                              .join(", ")}
                          </p>
                        )}

                        <div className="mt-5 border-t border-scoreboard-cream/20 pt-4">

                          <span className="text-xs font-black uppercase tracking-[0.10em] text-scoreboard-amber">
                            {entry.status}
                          </span>

                        </div>

                      </Link>
                    )
                  })}

                </div>
              )}

            </section>

          </div>

          {/* RIGHT COLUMN */}
          <aside className="space-y-5">

            {/* TEAM CARD */}
            <div className="border border-scoreboard-cream/25 bg-scoreboard-green p-6">

              <p className="scoreboard-label text-scoreboard-amber">
                Team
              </p>

              <h2 className="mt-3 text-2xl font-black uppercase tracking-[0.05em]">
                {team.name}
              </h2>

              <div className="mt-6 space-y-4 border-t border-scoreboard-cream/20 pt-5 text-sm">

                <div>

                  <p className="scoreboard-label">
                    Organization
                  </p>

                  <p className="mt-2 font-bold">
                    {team.organizations?.name ?? "—"}
                  </p>

                </div>

                <div>

                  <p className="scoreboard-label">
                    Division
                  </p>

                  <p className="mt-2 font-bold">
                    {[team.age_group, team.classification]
                      .filter(Boolean)
                      .join(" • ") || "—"}
                  </p>

                </div>

                <div>

                  <p className="scoreboard-label">
                    Location
                  </p>

                  <p className="mt-2 font-bold">
                    {[team.city, team.state]
                      .filter(Boolean)
                      .join(", ") || "—"}
                  </p>

                </div>

              </div>

            </div>

            {/* ROSTER */}
            <div className="border border-scoreboard-cream/25 bg-scoreboard-green p-6">

              <Users className="h-6 w-6 text-scoreboard-amber" />

              <p className="scoreboard-label mt-5 text-scoreboard-amber">
                Roster
              </p>

              {rosterCount !== null ? (
                <>
                  <div className="scoreboard-number mt-2 text-3xl">
                    {rosterCount}
                  </div>

                  <p className="mt-2 text-sm text-scoreboard-muted">
                    Players
                  </p>
                </>
              ) : (
                <p className="mt-4 text-sm leading-7 text-scoreboard-muted">
                  Roster details are private.
                </p>
              )}

            </div>

          </aside>

        </div>

      </section>

    </main>
  )
}

function EventCard({
  event,
  featured = false,
}: {
  event: TeamEvent
  featured?: boolean
}) {
  const start = new Date(event.start_time)

  const end = event.end_time
    ? new Date(event.end_time)
    : null

  const location =
    event.booking_resources?.name ??
    event.location_name

  return (
    <article
      className={
        featured
          ? `
            border
            border-scoreboard-amber/60
            bg-scoreboard-green
            p-6
            sm:p-7
          `
          : `
            border
            border-scoreboard-cream/25
            bg-scoreboard-green
            p-5
          `
      }
    >

      <div className="grid gap-5 sm:grid-cols-[150px_1fr]">

        <div>

          <p className="scoreboard-label text-scoreboard-amber">
            {event.event_type.replaceAll("_", " ")}
          </p>

          <p className="scoreboard-number mt-2 text-xl">
            {start.toLocaleDateString([], {
              month: "short",
              day: "numeric",
            })}
          </p>

          <p className="mt-2 text-sm font-bold">
            {start.toLocaleTimeString([], {
              hour: "numeric",
              minute: "2-digit",
            })}
          </p>

          {end && (
            <p className="mt-1 text-xs text-scoreboard-muted">
              to{" "}
              {end.toLocaleTimeString([], {
                hour: "numeric",
                minute: "2-digit",
              })}
            </p>
          )}

        </div>

        <div className="min-w-0">

          <h3 className="break-words text-xl font-black uppercase leading-tight tracking-[0.04em]">
            {event.title}
          </h3>

          {event.opponent_name && (
            <p className="mt-3 text-sm">
              <span className="scoreboard-label">
                Opponent
              </span>

              <span className="ml-2 font-bold">
                {event.opponent_name}
              </span>
            </p>
          )}

          {location && (
            <div className="mt-4 flex min-w-0 items-center gap-2 text-sm text-scoreboard-muted">

              <MapPin className="h-4 w-4 shrink-0 text-scoreboard-amber" />

              <span className="break-words">
                {location}
              </span>

            </div>
          )}

          <div className="mt-3 flex items-center gap-2 text-xs text-scoreboard-muted">

            <Clock className="h-3.5 w-3.5 text-scoreboard-amber" />

            Scheduled

          </div>

        </div>

      </div>

    </article>
  )
}