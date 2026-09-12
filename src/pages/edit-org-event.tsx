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

type EventStatus =
  | "scheduled"
  | "completed"
  | "cancelled"

  type DivisionDraft = {
  id?: string
  name: string
  age_group: string
  classification?: string
}



  function toSlug(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

export function EditOrganizationEventPage() {
  const { organizationId, eventId } = useParams()
  const [divisions, setDivisions] =
  useState<DivisionDraft[]>([])

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

  const [status, setStatus] =
    useState<EventStatus>("scheduled")

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
    useState("")

  const [endTime, setEndTime] =
    useState("")

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
    const [publiclyRegisterable, setPubliclyRegisterable] =
  useState(false)

const [publicTournamentId, setPublicTournamentId] =
  useState<string | null>(null)

  useEffect(() => {
    async function loadPage() {
      if (!organizationId || !eventId) {
        setError(
          "Missing organization or event ID."
        )
        setLoading(false)
        return
      }

      setLoading(true)
      setError("")

      const [
        organizationResult,
        teamsResult,
        resourcesResult,
        eventResult,
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
          .eq(
            "organization_id",
            organizationId
          )
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
          .in(
            "resource_type",
            ["field", "trainer"]
          )
          .order("name"),

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
            resource_id,
            opponent_name,
            status,
            public_tournament_id
          `)
          .eq("id", eventId)
          .eq(
            "organization_id",
            organizationId
          )
          .single(),
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

      if (eventResult.error) {
        setError(
          eventResult.error.message
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

     const existingEvent =
  eventResult.data

const existingPublicTournamentId =
  existingEvent.public_tournament_id ?? null

setPublicTournamentId(
  existingPublicTournamentId
)



if (existingPublicTournamentId) {
  const {
    data: linkedTournament,
    error: linkedTournamentError,
  } = await supabase
    .from("tournaments")
    .select(`
      id,
      status
    `)
    .eq("id", existingPublicTournamentId)
    .maybeSingle()

  if (linkedTournamentError) {
    setError(linkedTournamentError.message)
    setLoading(false)
    return
  }

  setPubliclyRegisterable(
    linkedTournament?.status ===
      "registration_open"
  )
} else {
  setPubliclyRegisterable(false)
}

// LOAD TOURNAMENT DIVISIONS

const {
  data: divisionData,
  error: divisionError,
} =
  existingPublicTournamentId
    ? await supabase
        .from("tournament_divisions")
        .select(`
          id,
          name,
          age_group
        `)
        .eq(
          "tournament_id",
          existingPublicTournamentId
        )
        .order("age_group")
    : {
        data: [],
        error: null,
      }

if (divisionError) {
  setError(divisionError.message)
  setLoading(false)
  return
}

setDivisions(
  (divisionData ?? []).map(
    (division) => ({
      id: division.id,
      name: division.name ?? "",
      age_group:
        division.age_group ?? "",
    })
  )
)
      setEventType(
        existingEvent.event_type as EventType
      )

      setStatus(
        existingEvent.status as EventStatus
      )

      setTeamId(
        existingEvent.team_id ?? ""
      )

      setTitle(
        existingEvent.title ?? ""
      )

      setDescription(
        existingEvent.description ?? ""
      )

      setResourceId(
        existingEvent.resource_id ?? ""
      )

      setLocationName(
        existingEvent.location_name ?? ""
      )

      setOpponentName(
        existingEvent.opponent_name ?? ""
      )

      const start =
        new Date(existingEvent.start_time)

      setEventDate(
        [
          start.getFullYear(),
          String(
            start.getMonth() + 1
          ).padStart(2, "0"),
          String(
            start.getDate()
          ).padStart(2, "0"),
        ].join("-")
      )

      setStartTime(
        [
          String(
            start.getHours()
          ).padStart(2, "0"),
          String(
            start.getMinutes()
          ).padStart(2, "0"),
        ].join(":")
      )

      if (existingEvent.end_time) {
        const end =
          new Date(
            existingEvent.end_time
          )

        setEndDate(
          [
            end.getFullYear(),
            String(
              end.getMonth() + 1
            ).padStart(2, "0"),
            String(
              end.getDate()
            ).padStart(2, "0"),
          ].join("-")
        )

        setEndTime(
          [
            String(
              end.getHours()
            ).padStart(2, "0"),
            String(
              end.getMinutes()
            ).padStart(2, "0"),
          ].join(":")
        )
      } else {
        setEndDate("")
        setEndTime("")
      }

      setLoading(false)
    }

    void loadPage()
  }, [organizationId, eventId])

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

    if (
      !organizationId ||
      !eventId ||
      !user
    ) {
      setError(
        "Missing organization, event, or user."
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

    let nextPublicTournamentId =
    publicTournamentId
  
  if (eventType === "tournament") {
    const tournamentSlug =
      toSlug(title)
  
    // --------------------------------
    // NO LINKED PUBLIC TOURNAMENT YET
    // --------------------------------
  
    if (
      publiclyRegisterable &&
      !publicTournamentId
    ) {
      // First check whether a tournament
      // with this slug already exists.
      const {
        data: existingTournament,
        error: lookupError,
      } = await supabase
        .from("tournaments")
        .select(`
          id,
          status
        `)
        .eq(
          "organization_id",
          organizationId
        )
        .eq(
          "slug",
          tournamentSlug
        )
        .maybeSingle()
  
      if (lookupError) {
        setSaving(false)
        setError(
          lookupError.message
        )
        return
      }
  
      // --------------------------------
      // EXISTING TOURNAMENT FOUND
      // Reconnect and republish it
      // --------------------------------
  
      if (existingTournament) {
        nextPublicTournamentId =
          existingTournament.id
  
        const {
          error: restoreError,
        } = await supabase
          .from("tournaments")
          .update({
            name:
              title.trim(),
  
            description:
              description.trim() || null,
  
            location_name:
              resourceId
                ? selectedResource?.name ?? null
                : locationName.trim() || null,
  
            start_date:
              eventDate,
  
            end_date:
              endDate,
  
            status:
              "registration_open",
          })
          .eq(
            "id",
            existingTournament.id
          )
  
        if (restoreError) {
          setSaving(false)
          setError(
            restoreError.message
          )
          return
        }
      }
  
      // --------------------------------
      // NO EXISTING TOURNAMENT
      // Create a new one
      // --------------------------------
  
      else {
        const {
          data,
          error: tournamentError,
        } = await supabase
          .from("tournaments")
          .insert({
            organization_id:
              organizationId,
  
            created_by_user_id:
              user.id,
  
            name:
              title.trim(),
  
            slug:
              tournamentSlug,
  
            description:
              description.trim() || null,
  
            location_name:
              resourceId
                ? selectedResource?.name ?? null
                : locationName.trim() || null,
  
            start_date:
              eventDate,
  
            end_date:
              endDate,
  
            status:
              "registration_open",
          })
          .select("id")
          .single()
  
        if (tournamentError) {
          setSaving(false)
          setError(
            tournamentError.message
          )
          return
        }
  
        nextPublicTournamentId =
          data.id
      }
    }
  
    // --------------------------------
    // LINKED TOURNAMENT ALREADY EXISTS
    // Update it whether registration
    // is ON or OFF.
    // --------------------------------
  
    if (publicTournamentId) {
      const {
        error: tournamentUpdateError,
      } = await supabase
        .from("tournaments")
        .update({
          name:
            title.trim(),
  
          description:
            description.trim() || null,
  
          location_name:
            resourceId
              ? selectedResource?.name ?? null
              : locationName.trim() || null,
  
          start_date:
            eventDate,
  
          end_date:
            endDate,
  
          status:
            publiclyRegisterable
              ? "registration_open"
              : "draft",
        })
        .eq(
          "id",
          publicTournamentId
        )
  
      if (tournamentUpdateError) {
        setSaving(false)
        setError(
          tournamentUpdateError.message
        )
        return
      }
  
      nextPublicTournamentId =
        publicTournamentId
    }
  }

/* SAVE TOURNAMENT DIVISIONS */

if (
  nextPublicTournamentId &&
  eventType === "tournament" &&
  publiclyRegisterable
) {
  const {
    error: deleteError,
  } =
    await supabase
      .from("tournament_divisions")
      .delete()
      .eq(
        "tournament_id",
        nextPublicTournamentId
      )

  if (deleteError) {
    setSaving(false)
    setError(
      deleteError.message
    )
    return
  }

  const rows =
    divisions
      .filter(
        (division) =>
          division.age_group.trim()
      )
      .map((division) => ({
        tournament_id:
          nextPublicTournamentId,

        age_group:
          division.age_group.trim(),

        name:
          division.name.trim() ||
          `${division.age_group.trim()} Division`,
      }))

  if (rows.length > 0) {
    const {
      error: divisionError,
    } =
      await supabase
        .from("tournament_divisions")
        .insert(rows)

    if (divisionError) {
      setSaving(false)
      setError(
        divisionError.message
      )
      return
    }
  }
}

    const { error } =
      await supabase
        .from("organization_events")
        .update({
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

         status,

         public_tournament_id:
         eventType === "tournament"
           ? nextPublicTournamentId
           : null,

updated_at:
  new Date().toISOString(),
        })
        .eq("id", eventId)
        .eq(
          "organization_id",
          organizationId
        )

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
            Loading Event...
          </p>

        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-scoreboard-dark text-scoreboard-cream">

      {/* HEADER */}

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
            Edit Event
          </h1>

          <p className="mt-4 max-w-2xl text-sm leading-7 text-scoreboard-muted">
            Update event details, timing,
            location, opponent, or status.
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

            {/* STATUS */}

            <label className="block">

              <span className="scoreboard-label text-scoreboard-cream">
                Status
              </span>

              <select
                value={status}
                onChange={(e) =>
                  setStatus(
                    e.target.value as EventStatus
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
                <option value="scheduled">
                  Scheduled
                </option>

                <option value="completed">
                  Completed
                </option>

                <option value="cancelled">
                  Cancelled
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

            {eventType === "tournament" ? (
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

            {eventType === "tournament" && (
  <div className="border border-scoreboard-cream/20 bg-scoreboard-dark p-5">

    <p className="scoreboard-label text-scoreboard-amber">
      Tournament Divisions
    </p>

    <p className="mt-2 text-sm text-scoreboard-muted">
      Add the age groups teams can register for.
    </p>

    <div className="mt-5 space-y-4">

      {divisions.map((division, index) => (
        <div
          key={division.id ?? index}
          className="grid gap-3 sm:grid-cols-[1fr_1fr_auto]"
        >

          <input
            value={division.age_group}
            onChange={(e) => {
              const next = [...divisions]

              next[index] = {
                ...next[index],
                age_group: e.target.value,
              }

              setDivisions(next)
            }}
            placeholder="10U"
            className="
              w-full
              rounded-none
              border
              border-scoreboard-cream/30
              bg-scoreboard-cream
              px-3
              py-3
              text-scoreboard-dark
            "
          />

          <input
            value={division.name}
            onChange={(e) => {
              const next = [...divisions]

              next[index] = {
                ...next[index],
                name: e.target.value,
              }

              setDivisions(next)
            }}
            placeholder="Open Division"
            className="
              w-full
              rounded-none
              border
              border-scoreboard-cream/30
              bg-scoreboard-cream
              px-3
              py-3
              text-scoreboard-dark
            "
          />

          <button
            type="button"
            onClick={() =>
              setDivisions(
                divisions.filter(
                  (_, i) => i !== index
                )
              )
            }
            className="
              border
              border-scoreboard-cream/30
              px-4
              text-xs
              font-black
              uppercase
              tracking-[0.10em]
              hover:border-scoreboard-amber
            "
          >
            Remove
          </button>

        </div>
      ))}

    </div>

    <button
      type="button"
      onClick={() =>
        setDivisions([
          ...divisions,
          {
            name: "",
            age_group: "",
          },
        ])
      }
      className="
        mt-5
        text-xs
        font-black
        uppercase
        tracking-[0.10em]
        text-scoreboard-amber
        hover:text-scoreboard-cream
      "
    >
      + Add Division
    </button>

  </div>
)}

            {/* PUBLIC TOURNAMENT REGISTRATION */}

{eventType === "tournament" && (
  <div
    className="
      border
      border-scoreboard-amber/40
      bg-scoreboard-dark
      p-5
    "
  >

    <div className="flex items-start gap-4">

      <input
        id="public-registration"
        type="checkbox"
        checked={publiclyRegisterable}
        onChange={(e) =>
          setPubliclyRegisterable(
            e.target.checked
          )
        }
        className="
          mt-1
          h-5
          w-5
          accent-scoreboard-amber
        "
      />

      <label
        htmlFor="public-registration"
        className="cursor-pointer"
      >

        <p className="scoreboard-label text-scoreboard-amber">
          Public Registration
        </p>

        <p className="mt-2 font-black uppercase tracking-[0.04em]">
          Allow Teams To Register
        </p>

        <p className="mt-2 max-w-2xl text-sm leading-6 text-scoreboard-muted">
          Publish this tournament to the public
          tournament directory and allow teams to
          register.
        </p>

      </label>

    </div>

    {publicTournamentId && (
      <div className="mt-4 border-t border-scoreboard-cream/15 pt-4">

        <p className="text-xs font-black uppercase tracking-[0.10em] text-scoreboard-amber">
          ✓ Public Tournament Published
        </p>

      </div>
    )}

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
                  placeholder="name 10U"
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
                ? "Saving..."
                : "Save Changes"}
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