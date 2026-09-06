import {
  FormEvent,
  useEffect,
  useMemo,
  useState,
} from "react"

import {
  ArrowLeft,
  CalendarDays,
  Clock,
  MapPin,
  Save,
} from "lucide-react"

import {
  Link,
  useNavigate,
  useParams,
} from "react-router-dom"

import { Button } from "@/components/ui/button"
import { useAuth } from "@/features/auth/auth-context"
import { supabase } from "@/lib/supabase"

type Team = {
  id: string
  name: string
  age_group: string | null
}

type Resource = {
  id: string
  name: string
  resource_type: string
}

type EventType =
  | "practice"
  | "scrimmage"
  | "game"
  | "tournament"
  | "meeting"
  | "other"

export function CreateOrganizationEventPage() {
  const { organizationId } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()

  const [organizationName, setOrganizationName] =
    useState("")

  const [teams, setTeams] =
    useState<Team[]>([])

  const [resources, setResources] =
    useState<Resource[]>([])

  const [eventType, setEventType] =
    useState<EventType>("practice")

  const [teamId, setTeamId] =
    useState("")

  const [title, setTitle] =
    useState("")

  const [description, setDescription] =
    useState("")

  const [eventDate, setEventDate] =
    useState("")

  const [endDate, setEndDate] =
    useState("")

  const [startTime, setStartTime] =
    useState("17:00")

  const [endTime, setEndTime] =
    useState("19:00")

  const [resourceId, setResourceId] =
    useState("")

  const [locationName, setLocationName] =
    useState("")

  const [opponentName, setOpponentName] =
    useState("")

  const [loading, setLoading] =
    useState(true)

  const [saving, setSaving] =
    useState(false)

  const [error, setError] =
    useState("")

  useEffect(() => {
    async function loadPage() {
      if (!organizationId) {
        setError("Missing organization ID.")
        setLoading(false)
        return
      }

      setLoading(true)
      setError("")

      const [
        organizationResult,
        teamsResult,
        resourcesResult,
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
          .from("teams")
          .select(`
            id,
            name,
            age_group
          `)
          .eq("organization_id", organizationId)
          .eq("status", "active")
          .order("name"),

        supabase
          .from("booking_resources")
          .select(`
            id,
            name,
            resource_type
          `)
          .eq("active", true)
          .in("resource_type", [
            "field",
            "trainer",
          ])
          .order("name"),
      ])

      if (organizationResult.error) {
        setError(
          organizationResult.error.message
        )
        setLoading(false)
        return
      }

      if (teamsResult.error) {
        setError(
          teamsResult.error.message
        )
        setLoading(false)
        return
      }

      if (resourcesResult.error) {
        setError(
          resourcesResult.error.message
        )
        setLoading(false)
        return
      }

      setOrganizationName(
        organizationResult.data?.name ??
          "Organization"
      )

      setTeams(
        teamsResult.data ?? []
      )

      setResources(
        resourcesResult.data ?? []
      )

      if (
        teamsResult.data &&
        teamsResult.data.length > 0
      ) {
        setTeamId(
          teamsResult.data[0].id
        )
      }

      setLoading(false)
    }

    void loadPage()
  }, [organizationId])

  useEffect(() => {
    if (!teamId) return

    const team =
      teams.find(
        (item) => item.id === teamId
      )

    if (!team) return

    const teamLabel = [
      team.age_group,
      team.name,
    ]
      .filter(Boolean)
      .join(" ")

    if (eventType === "practice") {
      setTitle(
        `${teamLabel} Practice`
      )
    }

    if (eventType === "scrimmage") {
      setTitle(
        `${teamLabel} Scrimmage`
      )
    }

    if (eventType === "game") {
      setTitle(
        `${teamLabel} Game`
      )
    }
  }, [eventType, teamId, teams])

  const showOpponent =
    eventType === "scrimmage" ||
    eventType === "game"

  const selectedResource =
    useMemo(
      () =>
        resources.find(
          (resource) =>
            resource.id === resourceId
        ) ?? null,
      [resources, resourceId]
    )

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault()

    if (!organizationId || !user) {
      setError(
        "Missing organization or user."
      )
      return
    }

    if (!title.trim()) {
      setError(
        "Event title is required."
      )
      return
    }

    if (!eventDate || !startTime) {
      setError(
        "Date and start time are required."
      )
      return
    }

    if (
      eventType === "tournament" &&
      !endDate
    ) {
      setError(
        "Tournament end date is required."
      )
      return
    }

    const start =
      new Date(
        `${eventDate}T${startTime}:00`
      )

    const effectiveEndDate =
      eventType === "tournament"
        ? endDate
        : eventDate

    const end =
      endTime
        ? new Date(
            `${effectiveEndDate}T${endTime}:00`
          )
        : null

    if (end && end <= start) {
      setError(
        "End date/time must be after start date/time."
      )
      return
    }

    setSaving(true)
    setError("")

    const { error } =
      await supabase
        .from("organization_events")
        .insert({
          organization_id:
            organizationId,

          team_id:
            teamId || null,

          event_type:
            eventType,

          title:
            title.trim(),

          description:
            description.trim() || null,

          start_time:
            start.toISOString(),

          end_time:
            end
              ? end.toISOString()
              : null,

          resource_id:
            resourceId || null,

          location_name:
            resourceId
              ? selectedResource?.name ??
                null
              : locationName.trim() ||
                null,

          opponent_name:
            showOpponent
              ? opponentName.trim() ||
                null
              : null,

          status:
            "scheduled",

          created_by_user_id:
            user.id,
        })

    setSaving(false)

    if (error) {
      setError(error.message)
      return
    }

    navigate(
      `/dashboard/organizations/${organizationId}/schedule`
    )
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-scoreboard-dark px-4 py-12 text-scoreboard-cream sm:px-6">
        <div className="mx-auto max-w-5xl">
          <p className="scoreboard-label">
            Loading Event Creator...
          </p>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-scoreboard-dark text-scoreboard-cream">

      <section className="border-b border-scoreboard-cream/20 bg-scoreboard-green">

        <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">

          <Link
            to={`/dashboard/organizations/${organizationId}/schedule`}
            className="
              inline-flex
              items-center
              gap-2
              text-xs
              font-black
              uppercase
              tracking-[0.10em]
              text-scoreboard-muted
              hover:text-scoreboard-amber
            "
          >
            <ArrowLeft className="h-4 w-4" />
            Schedule
          </Link>

          <p className="scoreboard-label mt-8 text-scoreboard-amber">
            {organizationName}
          </p>

          <h1 className="mt-3 text-3xl font-black uppercase leading-tight tracking-[0.04em] sm:text-4xl sm:tracking-[0.06em]">
            Create Event
          </h1>

          <p className="mt-4 max-w-2xl text-sm leading-7 text-scoreboard-muted">
            Add a practice, scrimmage,
            game, tournament, meeting,
            or other organization event.
          </p>

        </div>

      </section>

      <section className="mx-auto max-w-5xl px-4 py-10 sm:px-6">

        <form
          onSubmit={handleSubmit}
          className="
            border
            border-scoreboard-cream/25
            bg-scoreboard-green
            p-5
            sm:p-8
          "
        >

          <div>

            <p className="scoreboard-label text-scoreboard-amber">
              Event
            </p>

            <h2 className="mt-2 text-2xl font-black uppercase tracking-[0.05em]">
              Details
            </h2>

          </div>

          <div className="mt-7 grid gap-5">

            {/* EVENT TYPE */}

            <label className="block">

              <span className="scoreboard-label text-scoreboard-cream">
                Event Type
              </span>

              <select
                value={eventType}
                onChange={(e) =>
                  setEventType(
                    e.target.value as EventType
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
                  text-base
                  text-scoreboard-dark
                "
              >
                <option value="practice">
                  Practice
                </option>

                <option value="scrimmage">
                  Scrimmage
                </option>

                <option value="game">
                  Game
                </option>

                <option value="tournament">
                  Tournament
                </option>

                <option value="meeting">
                  Meeting
                </option>

                <option value="other">
                  Other
                </option>
              </select>

            </label>

            {/* TEAM */}

            <label className="block">

              <span className="scoreboard-label text-scoreboard-cream">
                Team
              </span>

              <select
                value={teamId}
                onChange={(e) =>
                  setTeamId(
                    e.target.value
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
                  text-base
                  text-scoreboard-dark
                "
              >
                <option value="">
                  Organization Wide
                </option>

                {teams.map(
                  (team) => (
                    <option
                      key={team.id}
                      value={team.id}
                    >
                      {[
                        team.age_group,
                        team.name,
                      ]
                        .filter(Boolean)
                        .join(" ")}
                    </option>
                  )
                )}

              </select>

            </label>

            {/* TITLE */}

            <label className="block">

              <span className="scoreboard-label text-scoreboard-cream">
                Event Title
              </span>

              <input
                value={title}
                onChange={(e) =>
                  setTitle(
                    e.target.value
                  )
                }
                placeholder="10U Practice"
                required
                className="
                  mt-2
                  w-full
                  rounded-none
                  border
                  border-scoreboard-cream/30
                  bg-scoreboard-cream
                  px-3
                  py-3
                  text-base
                  text-scoreboard-dark
                "
              />

            </label>

            {/* DATE / TIMES */}

            {eventType ===
            "tournament" ? (
              <div className="grid gap-5 sm:grid-cols-2">

                <label className="block">

                  <span className="scoreboard-label text-scoreboard-cream">
                    Start Date
                  </span>

                  <div className="relative mt-2">

                    <CalendarDays className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-scoreboard-dark/60" />

                    <input
                      type="date"
                      value={eventDate}
                      onChange={(e) =>
                        setEventDate(
                          e.target.value
                        )
                      }
                      required
                      className="
                        w-full
                        min-w-0
                        rounded-none
                        border
                        border-scoreboard-cream/30
                        bg-scoreboard-cream
                        py-3
                        pl-10
                        pr-3
                        text-base
                        text-scoreboard-dark
                      "
                    />

                  </div>

                </label>

                <label className="block">

                  <span className="scoreboard-label text-scoreboard-cream">
                    End Date
                  </span>

                  <div className="relative mt-2">

                    <CalendarDays className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-scoreboard-dark/60" />

                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) =>
                        setEndDate(
                          e.target.value
                        )
                      }
                      required
                      className="
                        w-full
                        min-w-0
                        rounded-none
                        border
                        border-scoreboard-cream/30
                        bg-scoreboard-cream
                        py-3
                        pl-10
                        pr-3
                        text-base
                        text-scoreboard-dark
                      "
                    />

                  </div>

                </label>

                <label className="block">

                  <span className="scoreboard-label text-scoreboard-cream">
                    Start Time
                  </span>

                  <div className="relative mt-2">

                    <Clock className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-scoreboard-dark/60" />

                    <input
                      type="time"
                      value={startTime}
                      onChange={(e) =>
                        setStartTime(
                          e.target.value
                        )
                      }
                      required
                      className="
                        w-full
                        min-w-0
                        rounded-none
                        border
                        border-scoreboard-cream/30
                        bg-scoreboard-cream
                        py-3
                        pl-10
                        pr-3
                        text-base
                        text-scoreboard-dark
                      "
                    />

                  </div>

                </label>

                <label className="block">

                  <span className="scoreboard-label text-scoreboard-cream">
                    End Time
                  </span>

                  <div className="relative mt-2">

                    <Clock className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-scoreboard-dark/60" />

                    <input
                      type="time"
                      value={endTime}
                      onChange={(e) =>
                        setEndTime(
                          e.target.value
                        )
                      }
                      className="
                        w-full
                        min-w-0
                        rounded-none
                        border
                        border-scoreboard-cream/30
                        bg-scoreboard-cream
                        py-3
                        pl-10
                        pr-3
                        text-base
                        text-scoreboard-dark
                      "
                    />

                  </div>

                </label>

              </div>
            ) : (
              <div className="grid gap-5 sm:grid-cols-3">

                <label className="block">

                  <span className="scoreboard-label text-scoreboard-cream">
                    Date
                  </span>

                  <div className="relative mt-2">

                    <CalendarDays className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-scoreboard-dark/60" />

                    <input
                      type="date"
                      value={eventDate}
                      onChange={(e) =>
                        setEventDate(
                          e.target.value
                        )
                      }
                      required
                      className="
                        w-full
                        min-w-0
                        rounded-none
                        border
                        border-scoreboard-cream/30
                        bg-scoreboard-cream
                        py-3
                        pl-10
                        pr-3
                        text-base
                        text-scoreboard-dark
                      "
                    />

                  </div>

                </label>

                <label className="block">

                  <span className="scoreboard-label text-scoreboard-cream">
                    Start
                  </span>

                  <div className="relative mt-2">

                    <Clock className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-scoreboard-dark/60" />

                    <input
                      type="time"
                      value={startTime}
                      onChange={(e) =>
                        setStartTime(
                          e.target.value
                        )
                      }
                      required
                      className="
                        w-full
                        min-w-0
                        rounded-none
                        border
                        border-scoreboard-cream/30
                        bg-scoreboard-cream
                        py-3
                        pl-10
                        pr-3
                        text-base
                        text-scoreboard-dark
                      "
                    />

                  </div>

                </label>

                <label className="block">

                  <span className="scoreboard-label text-scoreboard-cream">
                    End
                  </span>

                  <div className="relative mt-2">

                    <Clock className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-scoreboard-dark/60" />

                    <input
                      type="time"
                      value={endTime}
                      onChange={(e) =>
                        setEndTime(
                          e.target.value
                        )
                      }
                      className="
                        w-full
                        min-w-0
                        rounded-none
                        border
                        border-scoreboard-cream/30
                        bg-scoreboard-cream
                        py-3
                        pl-10
                        pr-3
                        text-base
                        text-scoreboard-dark
                      "
                    />

                  </div>

                </label>

              </div>
            )}

            {/* RESOURCE */}

            <label className="block">

              <span className="scoreboard-label text-scoreboard-cream">
                Booked Resource
              </span>

              <select
                value={resourceId}
                onChange={(e) =>
                  setResourceId(
                    e.target.value
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
                  text-base
                  text-scoreboard-dark
                "
              >
                <option value="">
                  No Linked Resource
                </option>

                {resources.map(
                  (resource) => (
                    <option
                      key={resource.id}
                      value={resource.id}
                    >
                      {resource.name}
                    </option>
                  )
                )}

              </select>

            </label>

            {/* LOCATION */}

            {!resourceId && (
              <label className="block">

                <span className="scoreboard-label text-scoreboard-cream">
                  Location
                </span>

                <div className="relative mt-2">

                  <MapPin className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-scoreboard-dark/60" />

                  <input
                    value={locationName}
                    onChange={(e) =>
                      setLocationName(
                        e.target.value
                      )
                    }
                    placeholder="Harvey West Park"
                    className="
                      w-full
                      rounded-none
                      border
                      border-scoreboard-cream/30
                      bg-scoreboard-cream
                      py-3
                      pl-10
                      pr-3
                      text-base
                      text-scoreboard-dark
                    "
                  />

                </div>

              </label>
            )}

            {/* OPPONENT */}

            {showOpponent && (
              <label className="block">

                <span className="scoreboard-label text-scoreboard-cream">
                  Opponent
                </span>

                <input
                  value={opponentName}
                  onChange={(e) =>
                    setOpponentName(
                      e.target.value
                    )
                  }
                  placeholder="SC Waves 10U"
                  className="
                    mt-2
                    w-full
                    rounded-none
                    border
                    border-scoreboard-cream/30
                    bg-scoreboard-cream
                    px-3
                    py-3
                    text-base
                    text-scoreboard-dark
                  "
                />

              </label>
            )}

            {/* NOTES */}

            <label className="block">

              <span className="scoreboard-label text-scoreboard-cream">
                Notes
              </span>

              <textarea
                value={description}
                onChange={(e) =>
                  setDescription(
                    e.target.value
                  )
                }
                rows={5}
                placeholder="Practice focus, arrival instructions, field notes..."
                className="
                  mt-2
                  w-full
                  rounded-none
                  border
                  border-scoreboard-cream/30
                  bg-scoreboard-cream
                  px-3
                  py-3
                  text-base
                  text-scoreboard-dark
                "
              />

            </label>

          </div>

          {error && (
            <div className="mt-6 border border-scoreboard-red/60 bg-scoreboard-dark p-4">

              <p className="text-sm leading-6 text-scoreboard-muted">
                {error}
              </p>

            </div>
          )}

          <div className="mt-8 flex flex-col gap-3 border-t border-scoreboard-cream/20 pt-6 sm:flex-row">

            <Button
              type="submit"
              disabled={saving}
              className="
                min-h-11
                rounded-none
                bg-scoreboard-cream
                px-6
                font-black
                uppercase
                tracking-[0.10em]
                text-scoreboard-dark
                hover:bg-scoreboard-amber
              "
            >
              <Save className="mr-2 h-4 w-4" />

              {saving
                ? "Creating..."
                : "Create Event"}
            </Button>

            <Link
              to={`/dashboard/organizations/${organizationId}/schedule`}
              className="
                inline-flex
                min-h-11
                items-center
                justify-center
                border
                border-scoreboard-cream/30
                px-6
                py-3
                text-xs
                font-black
                uppercase
                tracking-[0.10em]
                hover:border-scoreboard-amber
              "
            >
              Cancel
            </Link>

          </div>

        </form>

      </section>

    </main>
  )
}