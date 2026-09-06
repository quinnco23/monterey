import { useEffect, useMemo, useState } from "react"
import {
  CalendarDays,
  Clock,
  MapPin,
  Plus,
  Trophy,
} from "lucide-react"
import { Link, useParams } from "react-router-dom"

import { supabase } from "@/lib/supabase"

type OrganizationEvent = {
  id: string
  organization_id: string
  team_id: string | null
  event_type: string
  title: string
  description: string | null
  start_time: string
  end_time: string | null
  location_name: string | null
  opponent_name: string | null
  status: string

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

  public_tournament: {
  id: string
  name: string
} | null
}

type FilterValue =
  | "upcoming"
  | "practice"
  | "scrimmage"
  | "game"
  | "tournament"
  | "all"

export function OrganizationSchedulePage() {
  const { organizationId } = useParams()

  const [events, setEvents] = useState<OrganizationEvent[]>([])
  const [organizationName, setOrganizationName] = useState("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [filter, setFilter] = useState<FilterValue>("upcoming")

  useEffect(() => {
    async function loadSchedule() {
      if (!organizationId) {
        setError("Missing organization ID.")
        setLoading(false)
        return
      }

      setLoading(true)
      setError("")

      const [organizationResult, eventsResult] = await Promise.all([
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
      organization_id,
      team_id,
      event_type,
      title,
      description,
      start_time,
      end_time,
      location_name,
      opponent_name,
      status,

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

      public_tournament:tournaments!organization_events_public_tournament_id_fkey (
        id,
        name
      )
    `)
    .eq("organization_id", organizationId)
    .neq("status", "cancelled")
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
        (eventsResult.data ?? []) as unknown as OrganizationEvent[]
      )

      setLoading(false)
    }

    void loadSchedule()
  }, [organizationId])

  const filteredEvents = useMemo(() => {
    const now = new Date()

    if (filter === "upcoming") {
      return events.filter(
        (event) =>
          new Date(event.start_time) >= now &&
          event.status === "scheduled"
      )
    }

    if (filter === "all") {
      return events
    }

    return events.filter(
      (event) => event.event_type === filter
    )
  }, [events, filter])

  const groupedEvents = useMemo(() => {
    const groups = new Map<string, OrganizationEvent[]>()

    filteredEvents.forEach((event) => {
      const date = new Date(event.start_time)

      const key = [
        date.getFullYear(),
        String(date.getMonth() + 1).padStart(2, "0"),
        String(date.getDate()).padStart(2, "0"),
      ].join("-")

      const current = groups.get(key) ?? []
      current.push(event)

      groups.set(key, current)
    })

    return Array.from(groups.entries())
  }, [filteredEvents])

  if (loading) {
    return (
      <main className="min-h-screen bg-scoreboard-dark px-4 py-12 text-scoreboard-cream sm:px-6">
        <div className="mx-auto max-w-7xl">
          <p className="scoreboard-label">
            Loading Schedule...
          </p>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-scoreboard-dark text-scoreboard-cream">

      {/* HEADER */}
      <section className="border-b border-scoreboard-cream/20 bg-scoreboard-green">

        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">

          <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">

            <div className="min-w-0">

              <p className="scoreboard-label text-scoreboard-amber">
                Organization Schedule
              </p>

              <h1 className="mt-3 break-words text-3xl font-black uppercase leading-tight tracking-[0.04em] sm:text-4xl sm:tracking-[0.06em]">
                {organizationName}
              </h1>

              <p className="mt-3 max-w-2xl text-sm leading-7 text-scoreboard-muted">
                Practices, scrimmages, games, tournaments,
                and organization events.
              </p>

            </div>

            <Link
              to={`/dashboard/organizations/${organizationId}/schedule/new`}
              className="
                inline-flex
                min-h-11
                items-center
                justify-center
                gap-2
                border
                border-scoreboard-cream
                bg-scoreboard-cream
                px-5
                py-3
                text-xs
                font-black
                uppercase
                tracking-[0.10em]
                text-scoreboard-dark
                hover:bg-scoreboard-amber
              "
            >
              <Plus className="h-4 w-4" />
              Add Event
            </Link>

          </div>

        </div>

      </section>

      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6">

        {/* FILTERS */}
        <div className="mb-8 flex flex-wrap gap-2">

          {[
            ["upcoming", "Upcoming"],
            ["practice", "Practices"],
            ["scrimmage", "Scrimmages"],
            ["game", "Games"],
            ["tournament", "Tournaments"],
            ["all", "All"],
          ].map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() =>
                setFilter(value as FilterValue)
              }
              className={
                filter === value
                  ? `
                    border
                    border-scoreboard-amber
                    bg-scoreboard-amber
                    px-4
                    py-2
                    text-xs
                    font-black
                    uppercase
                    tracking-[0.08em]
                    text-scoreboard-dark
                  `
                  : `
                    border
                    border-scoreboard-cream/30
                    px-4
                    py-2
                    text-xs
                    font-black
                    uppercase
                    tracking-[0.08em]
                    text-scoreboard-cream
                    hover:border-scoreboard-amber
                  `
              }
            >
              {label}
            </button>
          ))}

        </div>

        {error && (
          <div className="mb-6 border border-scoreboard-red/60 bg-scoreboard-green p-5">
            <p className="text-sm text-scoreboard-muted">
              {error}
            </p>
          </div>
        )}

        {!error && groupedEvents.length === 0 && (
          <div className="border border-scoreboard-cream/20 bg-scoreboard-green p-8">

            <CalendarDays className="h-7 w-7 text-scoreboard-amber" />

            <h2 className="mt-5 text-xl font-black uppercase tracking-[0.06em]">
              No Events Yet
            </h2>

            <p className="mt-3 max-w-xl text-sm leading-7 text-scoreboard-muted">
              Add a practice, scrimmage, game, tournament,
              meeting, or other organization event.
            </p>

            <Link
              to={`/dashboard/organizations/${organizationId}/schedule/new`}
              className="
                mt-6
                inline-flex
                min-h-11
                items-center
                gap-2
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
              <Plus className="h-4 w-4" />
              Create First Event
            </Link>

          </div>
        )}

        {/* EVENT GROUPS */}
        <div className="space-y-8">

          {groupedEvents.map(([dateKey, dayEvents]) => {
            const date = new Date(
              `${dateKey}T12:00:00`
            )

            return (
              <section key={dateKey}>

                <div className="mb-3 border-b border-scoreboard-cream/20 pb-3">

                  <p className="scoreboard-label text-scoreboard-amber">
                    {date.toLocaleDateString([], {
                      weekday: "long",
                    })}
                  </p>

                  <h2 className="mt-1 text-xl font-black uppercase tracking-[0.05em] sm:text-2xl">
                    {date.toLocaleDateString([], {
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </h2>

                </div>

                <div className="space-y-3">

                  {dayEvents.map((event) => {
                    const start = new Date(
                      event.start_time
                    )

                    const end = event.end_time
                      ? new Date(event.end_time)
                      : null

                    return (
                      <article
                        key={event.id}
                        className="border border-scoreboard-cream/25 bg-scoreboard-green p-5"
                      >

                        <div className="grid gap-5 md:grid-cols-[120px_1fr_auto] md:items-center">

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
                                  hour: "numeric",
                                  minute: "2-digit",
                                }
                              )}

                            </div>

                            {end && (
                              <p className="mt-1 text-xs text-scoreboard-muted">
                                to{" "}
                                {end.toLocaleTimeString(
                                  [],
                                  {
                                    hour: "numeric",
                                    minute: "2-digit",
                                  }
                                )}
                              </p>
                            )}

                          </div>

                          {/* DETAILS */}
                          <div className="min-w-0">

                            <h3 className="break-words text-lg font-black uppercase tracking-[0.04em] sm:text-xl">
                              {event.title}
                            </h3>

                            <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm text-scoreboard-muted">

                              {event.teams && (
                                <div className="flex items-center gap-2">

                                  <Trophy className="h-4 w-4 text-scoreboard-amber" />

                                  {[
                                    event.teams.age_group,
                                    event.teams.name,
                                  ]
                                    .filter(Boolean)
                                    .join(" ")}

                                </div>
                              )}

                              {(event.booking_resources ||
                                event.location_name) && (
                                <div className="flex items-center gap-2">

                                  <MapPin className="h-4 w-4 text-scoreboard-amber" />

                                  {event.booking_resources?.name ??
                                    event.location_name}

                                </div>
                              )}

                              <div className="flex items-center gap-2">

                                <Clock className="h-4 w-4 text-scoreboard-amber" />

                                {event.status.replaceAll(
                                  "_",
                                  " "
                                )}

                              </div>

                            </div>

                            {event.opponent_name && (
                              <p className="mt-3 text-sm">
                                <span className="scoreboard-label">
                                  Opponent:
                                </span>{" "}
                                <span className="font-bold">
                                  {event.opponent_name}
                                </span>
                              </p>
                            )}

                          {event.public_tournament && (
  <p className="mt-3 text-sm text-scoreboard-muted">
    Tournament:{" "}
    <span className="font-bold text-scoreboard-cream">
      {event.public_tournament.name}
    </span>
  </p>
)}

                            {event.description && (
                              <p className="mt-3 max-w-2xl text-sm leading-6 text-scoreboard-muted">
                                {event.description}
                              </p>
                            )}

                          </div>

                          {/* STATUS */}
                          <div className="md:text-right">

                            <span
                              className="
                                inline-block
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
                              {event.status}
                            </span>

                            <Link
  to={`/dashboard/organizations/${organizationId}/schedule/${event.id}/edit`}
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
    hover:border-scoreboard-amber
  "
>
  Edit
</Link>

                          </div>

                        </div>

                      </article>
                    )
                  })}

                </div>

              </section>
            )
          })}

        </div>

      </section>

    </main>
  )
}