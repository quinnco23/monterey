import { useEffect, useMemo, useState } from "react"
import {
  CalendarDays,
  Clock,
  MapPin,
  Trophy,
} from "lucide-react"
import { useParams } from "react-router-dom"

import { supabase } from "@/lib/supabase"

type ScheduleEvent = {
  id: string
  event_type: string
  title: string
  description: string | null
  start_time: string
  end_time: string | null
  location_name: string | null
  opponent_name: string | null
  status: string

  organizations: {
    id: string
    name: string
  } | null

  teams: {
    id: string
    name: string
    age_group: string | null
  } | null

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

type FilterType =
  | "all"
  | "practice"
  | "scrimmage"
  | "game"
  | "tournament"

export function PublicSchedulePage() {
  const [events, setEvents] = useState<ScheduleEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  const [filter, setFilter] = useState<FilterType>("all")
  const [teamFilter, setTeamFilter] = useState("all")

  const { organizationId } = useParams()

const [organizationName, setOrganizationName] = useState("")

useEffect(() => {
    async function loadSchedule() {
      if (!organizationId) {
        setError("Missing organization ID.")
        setLoading(false)
        return
      }
  
      setLoading(true)
      setError("")
  
      const [
        organizationResult,
        eventsResult,
      ] = await Promise.all([
        supabase
          .from("organizations")
          .select(`
            id,
            name
          `)
          .eq("id", organizationId)
          .single(),
  
        supabase
          .from("organization_events")
          .select(`
            id,
            event_type,
            title,
            description,
            start_time,
            end_time,
            location_name,
            opponent_name,
            status,
  
            organizations (
              id,
              name
            ),
  
            teams (
              id,
              name,
              age_group
            ),
  
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
          .eq("organization_id", organizationId)
          .eq("status", "scheduled")
          .gte("start_time", new Date().toISOString())
          .order("start_time", {
            ascending: true,
          }),
      ])
  
      if (organizationResult.error) {
        setError(organizationResult.error.message)
        setLoading(false)
        return
      }
  
      if (eventsResult.error) {
        setError(eventsResult.error.message)
        setLoading(false)
        return
      }
  
      setOrganizationName(
        organizationResult.data?.name ?? "Organization"
      )
  
      setEvents(
        (eventsResult.data ?? []) as unknown as ScheduleEvent[]
      )
  
      setLoading(false)
    }
  
    void loadSchedule()
  }, [organizationId])

  const teams = useMemo(() => {
    const map = new Map<
      string,
      {
        id: string
        label: string
      }
    >()

    events.forEach((event) => {
      if (!event.teams) return

      map.set(event.teams.id, {
        id: event.teams.id,

        label: [
          event.teams.age_group,
          event.teams.name,
        ]
          .filter(Boolean)
          .join(" "),
      })
    })

    return Array.from(map.values()).sort(
      (a, b) =>
        a.label.localeCompare(b.label)
    )
  }, [events])

  const filteredEvents = useMemo(() => {
    return events.filter((event) => {
      if (
        filter !== "all" &&
        event.event_type !== filter
      ) {
        return false
      }

      if (
        teamFilter !== "all" &&
        event.teams?.id !== teamFilter
      ) {
        return false
      }

      return true
    })
  }, [events, filter, teamFilter])

  const groupedEvents = useMemo(() => {
    const groups = new Map<
      string,
      ScheduleEvent[]
    >()

    filteredEvents.forEach((event) => {
      const date = new Date(
        event.start_time
      )

      const key = [
        date.getFullYear(),
        String(
          date.getMonth() + 1
        ).padStart(2, "0"),
        String(
          date.getDate()
        ).padStart(2, "0"),
      ].join("-")

      const current =
        groups.get(key) ?? []

      current.push(event)

      groups.set(key, current)
    })

    return Array.from(
      groups.entries()
    )
  }, [filteredEvents])

  return (
    <main className="min-h-screen bg-scoreboard-dark text-scoreboard-cream">

      {/* HERO */}
      <section className="border-b border-scoreboard-cream/20 bg-scoreboard-green">

        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16">

        <p className="scoreboard-label text-scoreboard-amber">
  Organization Schedule
</p>

<h1 className="mt-3 break-words text-4xl font-black uppercase leading-tight tracking-[0.04em] sm:text-5xl sm:tracking-[0.06em]">
  {organizationName}
</h1>

<p className="mt-4 max-w-2xl text-sm leading-7 text-scoreboard-muted sm:text-base">
  Upcoming practices, scrimmages, games, and tournaments.
</p>

          {/* <p className="mt-4 max-w-2xl text-sm leading-7 text-scoreboard-muted sm:text-base">
            Practices, scrimmages, games and tournaments
            from baseball organizations across the community.
          </p> */}

        </div>

      </section>

      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10">

        {/* FILTER PANEL */}
        <div className="mb-8 border border-scoreboard-cream/25 bg-scoreboard-green p-4">

          <div className="grid gap-3 md:grid-cols-[1fr_1fr_auto]">

            <select
              value={filter}
              onChange={(e) =>
                setFilter(
                  e.target.value as FilterType
                )
              }
              className="
                min-h-11
                w-full
                min-w-0
                rounded-none
                border
                border-scoreboard-cream/30
                bg-scoreboard-cream
                px-3
                text-base
                text-scoreboard-dark
              "
            >
              <option value="all">
                All Event Types
              </option>

              <option value="practice">
                Practices
              </option>

              <option value="scrimmage">
                Scrimmages
              </option>

              <option value="game">
                Games
              </option>

              <option value="tournament">
                Tournaments
              </option>
            </select>

            <select
              value={teamFilter}
              onChange={(e) =>
                setTeamFilter(
                  e.target.value
                )
              }
              className="
                min-h-11
                w-full
                min-w-0
                rounded-none
                border
                border-scoreboard-cream/30
                bg-scoreboard-cream
                px-3
                text-base
                text-scoreboard-dark
              "
            >
              <option value="all">
                All Teams
              </option>

              {teams.map((team) => (
                <option
                  key={team.id}
                  value={team.id}
                >
                  {team.label}
                </option>
              ))}

            </select>

            <div className="flex min-h-11 items-center justify-center border border-scoreboard-cream/30 px-4">

              <span className="scoreboard-number text-scoreboard-amber">
                {filteredEvents.length}
              </span>

              <span className="ml-2 text-xs font-black uppercase tracking-[0.08em] text-scoreboard-muted">
                Events
              </span>

            </div>

          </div>

        </div>

        {loading && (
          <div className="border border-scoreboard-cream/20 bg-scoreboard-green p-6">
            <p className="scoreboard-label">
              Loading Schedule...
            </p>
          </div>
        )}

        {error && (
          <div className="border border-scoreboard-red/60 bg-scoreboard-green p-6">

            <p className="scoreboard-label text-scoreboard-amber">
              Unable To Load Schedule
            </p>

            <p className="mt-3 text-sm text-scoreboard-muted">
              {error}
            </p>

          </div>
        )}

        {!loading &&
          !error &&
          groupedEvents.length === 0 && (
            <div className="border border-scoreboard-cream/20 bg-scoreboard-green p-8">

              <CalendarDays className="h-7 w-7 text-scoreboard-amber" />

              <h2 className="mt-5 text-xl font-black uppercase tracking-[0.05em]">
                No Upcoming Events
              </h2>

              <p className="mt-3 text-sm leading-7 text-scoreboard-muted">
                There are currently no scheduled events
                matching these filters.
              </p>

            </div>
          )}

        {/* DAYS */}
        {!loading &&
          !error && (
            <div className="space-y-10">

              {groupedEvents.map(
                ([dateKey, dayEvents]) => {
                  const date =
                    new Date(
                      `${dateKey}T12:00:00`
                    )

                  return (
                    <section
                      key={dateKey}
                    >

                      {/* DATE HEADER */}
                      <div className="mb-4 flex flex-col gap-1 border-b border-scoreboard-cream/20 pb-3 sm:flex-row sm:items-end sm:justify-between">

                        <div>

                          <p className="scoreboard-label text-scoreboard-amber">
                            {date.toLocaleDateString(
                              [],
                              {
                                weekday:
                                  "long",
                              }
                            )}
                          </p>

                          <h2 className="mt-1 text-2xl font-black uppercase tracking-[0.04em] sm:text-3xl">
                            {date.toLocaleDateString(
                              [],
                              {
                                month:
                                  "long",
                                day:
                                  "numeric",
                              }
                            )}
                          </h2>

                        </div>

                        <span className="scoreboard-number text-sm text-scoreboard-muted">
                          {dayEvents.length}{" "}
                          {dayEvents.length === 1
                            ? "EVENT"
                            : "EVENTS"}
                        </span>

                      </div>

                      <div className="grid gap-3">

                        {dayEvents.map(
                          (event) => {
                            const start =
                              new Date(
                                event.start_time
                              )

                            const end =
                              event.end_time
                                ? new Date(
                                    event.end_time
                                  )
                                : null

                            const location =
                              event
                                .booking_resources
                                ?.name ??
                              event.location_name

                            return (
                              <article
                                key={
                                  event.id
                                }
                                className="
                                  border
                                  border-scoreboard-cream/25
                                  bg-scoreboard-green
                                  p-5
                                  transition-colors
                                  hover:border-scoreboard-amber/60
                                  hover:bg-scoreboard-light
                                  sm:p-6
                                "
                              >

                                <div className="grid min-w-0 gap-5 md:grid-cols-[120px_1fr_auto] md:items-center">

                                  {/* TIME */}
                                  <div>

                                    <p className="scoreboard-label text-scoreboard-amber">
                                      {event.event_type.replaceAll(
                                        "_",
                                        " "
                                      )}
                                    </p>

                                    <div className="scoreboard-number mt-2 text-xl">

                                      {start.toLocaleTimeString(
                                        [],
                                        {
                                          hour:
                                            "numeric",
                                          minute:
                                            "2-digit",
                                        }
                                      )}

                                    </div>

                                    {end && (
                                      <p className="mt-1 text-xs text-scoreboard-muted">
                                        to{" "}
                                        {end.toLocaleTimeString(
                                          [],
                                          {
                                            hour:
                                              "numeric",
                                            minute:
                                              "2-digit",
                                          }
                                        )}
                                      </p>
                                    )}

                                  </div>

                                  {/* MAIN */}
                                  <div className="min-w-0">

                                    <h3 className="break-words text-xl font-black uppercase leading-tight tracking-[0.04em]">
                                      {
                                        event.title
                                      }
                                    </h3>

                                    {event.organizations && (
                                      <p className="mt-2 text-xs font-bold uppercase tracking-[0.08em] text-scoreboard-muted">
                                        {
                                          event
                                            .organizations
                                            .name
                                        }
                                      </p>
                                    )}

                                    <div className="mt-4 flex flex-wrap gap-x-6 gap-y-3 text-sm text-scoreboard-muted">

                                      {event.teams && (
                                        <div className="flex min-w-0 items-center gap-2">

                                          <Trophy className="h-4 w-4 shrink-0 text-scoreboard-amber" />

                                          <span className="break-words">
                                            {[
                                              event
                                                .teams
                                                .age_group,
                                              event
                                                .teams
                                                .name,
                                            ]
                                              .filter(
                                                Boolean
                                              )
                                              .join(
                                                " "
                                              )}
                                          </span>

                                        </div>
                                      )}

                                      {location && (
                                        <div className="flex min-w-0 items-center gap-2">

                                          <MapPin className="h-4 w-4 shrink-0 text-scoreboard-amber" />

                                          <span className="break-words">
                                            {
                                              location
                                            }
                                          </span>

                                        </div>
                                      )}

                                      <div className="flex items-center gap-2">

                                        <Clock className="h-4 w-4 shrink-0 text-scoreboard-amber" />

                                        Scheduled

                                      </div>

                                    </div>

                                    {event.opponent_name && (
                                      <p className="mt-4 text-sm">
                                        <span className="scoreboard-label">
                                          Opponent
                                        </span>

                                        <span className="ml-2 font-bold">
                                          {
                                            event.opponent_name
                                          }
                                        </span>
                                      </p>
                                    )}

                                    {event.tournaments && (
                                      <p className="mt-3 text-sm text-scoreboard-muted">
                                        Tournament:{" "}
                                        <span className="font-bold text-scoreboard-cream">
                                          {
                                            event
                                              .tournaments
                                              .name
                                          }
                                        </span>
                                      </p>
                                    )}

                                  </div>

                                  {/* TYPE MARKER */}
                                  <div className="md:text-right">

                                    <span
                                      className="
                                        inline-flex
                                        border
                                        border-scoreboard-cream/30
                                        px-3
                                        py-2
                                        text-[10px]
                                        font-black
                                        uppercase
                                        tracking-[0.10em]
                                        text-scoreboard-muted
                                      "
                                    >
                                      {event.event_type}
                                    </span>

                                  </div>

                                </div>

                              </article>
                            )
                          }
                        )}

                      </div>

                    </section>
                  )
                }
              )}

            </div>
          )}

      </section>

    </main>
  )
}