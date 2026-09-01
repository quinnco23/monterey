import { useEffect, useState } from "react"
import {
  ArrowLeft,
  CalendarDays,
  Clock,
  MapPin,
} from "lucide-react"
import { Link, useParams } from "react-router-dom"

import { Button } from "@/components/ui/button"
import { supabase } from "@/lib/supabase"

type BookingResource = {
  id: string
  name: string
  resource_type: string
  description: string | null
  city: string | null
  state: string | null
  address_line_1: string | null
  hourly_rate: number | null
  active: boolean
}

type AvailabilitySlot = {
  id: string
  resource_id: string
  start_time: string
  end_time: string
  status:
    | "available"
    | "blocked"
    | "maintenance"
    | "tournament_hold"
    | "private_hold"
  note: string | null
}

type BusyTime = {
  start_time: string
  end_time: string
}



export function BookingResourcePage() {
  const { resourceId } = useParams()
  const [busyTimes, setBusyTimes] = useState<BusyTime[]>([])

  const [resource, setResource] =
    useState<BookingResource | null>(null)

  const [slots, setSlots] =
    useState<AvailabilitySlot[]>([])

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
  async function loadResource() {
    if (!resourceId) {
      setError("Missing resource ID.")
      setLoading(false)
      return
    }

    setLoading(true)
    setError("")

    const [
      resourceResult,
      availabilityResult,
      busyResult,
    ] = await Promise.all([
      supabase
        .from("booking_resources")
        .select(`
          id,
          name,
          resource_type,
          description,
          city,
          state,
          address_line_1,
          hourly_rate,
          active
        `)
        .eq("id", resourceId)
        .single(),

      supabase
        .from("resource_availability")
        .select(`
          id,
          resource_id,
          start_time,
          end_time,
          status,
          note
        `)
        .eq("resource_id", resourceId)
        .order("start_time"),

      supabase.rpc("get_resource_busy_times", {
        p_resource_id: resourceId,
      }),
    ])

    if (resourceResult.error) {
      setError(resourceResult.error.message)
      setLoading(false)
      return
    }

    if (availabilityResult.error) {
      setError(availabilityResult.error.message)
      setLoading(false)
      return
    }

    if (busyResult.error) {
      setError(busyResult.error.message)
      setLoading(false)
      return
    }

    setResource(resourceResult.data)
    setSlots(availabilityResult.data ?? [])
    setBusyTimes(busyResult.data ?? [])

    setLoading(false)
  }

  void loadResource()
}, [resourceId])

  if (loading) {
    return (
      <main className="min-h-screen bg-scoreboard-dark px-6 py-12 text-scoreboard-cream">
        <div className="mx-auto max-w-7xl">
          <p className="scoreboard-label">
            Loading Availability...
          </p>
        </div>
      </main>
    )
  }

  if (error || !resource) {
    return (
      <main className="min-h-screen bg-scoreboard-dark px-6 py-12 text-scoreboard-cream">
        <div className="mx-auto max-w-7xl">
          <div className="border border-scoreboard-red/60 bg-scoreboard-green p-6">
            <p className="scoreboard-label text-scoreboard-amber">
              Unable To Load Resource
            </p>

            <p className="mt-3 text-sm text-scoreboard-muted">
              {error || "Resource not found."}
            </p>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-scoreboard-dark text-scoreboard-cream">

      {/* RESOURCE HEADER */}
      <section className="border-b border-scoreboard-cream/20 bg-scoreboard-green">
        <div className="mx-auto max-w-7xl px-6 py-12">

          <Link
            to="/book"
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
            Back To Book
          </Link>

          <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_auto] lg:items-end">

            <div>
              <p className="scoreboard-label text-scoreboard-amber">
                {resource.resource_type.replaceAll("_", " ")}
              </p>

              <h1 className="mt-3 text-4xl font-black uppercase tracking-[0.06em] sm:text-5xl">
                {resource.name}
              </h1>

              {resource.description && (
                <p className="mt-4 max-w-2xl text-sm leading-7 text-scoreboard-muted">
                  {resource.description}
                </p>
              )}

              <div className="mt-6 flex flex-wrap gap-x-6 gap-y-3 text-sm text-scoreboard-muted">

                {(resource.city || resource.state) && (
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-scoreboard-amber" />

                    {[resource.city, resource.state]
                      .filter(Boolean)
                      .join(", ")}
                  </div>
                )}

                {resource.hourly_rate !== null && (
                  <div className="scoreboard-number text-scoreboard-cream">
                    ${Number(resource.hourly_rate).toFixed(2)} / HR
                  </div>
                )}

              </div>
            </div>

            <div className="border border-scoreboard-cream/25 bg-scoreboard-dark px-5 py-4">

              <p className="scoreboard-label">
                Resource Status
              </p>

              <div className="mt-2 flex items-center gap-3">
                <span
                  className={
                    resource.active
                      ? "h-3 w-3 bg-scoreboard-amber"
                      : "h-3 w-3 bg-scoreboard-red"
                  }
                />

                <span className="text-sm font-black uppercase tracking-[0.12em]">
                  {resource.active
                    ? "Open For Booking"
                    : "Unavailable"}
                </span>
              </div>

            </div>

          </div>

        </div>
      </section>

      {/* AVAILABILITY */}
      <section className="mx-auto max-w-5xl px-6 py-12">

        <div className="mb-6 flex items-end justify-between border-b border-scoreboard-cream/20 pb-4">

          <div>
            <p className="scoreboard-label">
              Reservation Board
            </p>

            <h2 className="mt-2 text-2xl font-black uppercase tracking-[0.08em]">
              Availability
            </h2>
          </div>

          <div className="hidden text-right sm:block">
            <div className="scoreboard-label">
              Slots
            </div>

            <div className="scoreboard-number mt-1 text-xl text-scoreboard-amber">
              {slots.length}
            </div>
          </div>

        </div>

        {slots.length === 0 ? (

          <div className="border border-scoreboard-cream/25 bg-scoreboard-green p-8 text-center">

            <CalendarDays className="mx-auto h-8 w-8 text-scoreboard-amber" />

            <h3 className="mt-5 text-xl font-black uppercase tracking-[0.08em]">
              No Availability Posted
            </h3>

            <p className="mt-3 text-sm text-scoreboard-muted">
              There are currently no reservation windows available for this resource.
            </p>

          </div>

        ) : (

          <div className="border-l border-t border-scoreboard-cream/25">

            {slots.map((slot) => {
  const start = new Date(slot.start_time)
  const end = new Date(slot.end_time)

  const isReserved = busyTimes.some((busy) => {
    const busyStart = new Date(busy.start_time)
    const busyEnd = new Date(busy.end_time)

    return busyStart < end && busyEnd > start
  })

  const isAvailable =
    slot.status === "available" &&
    !isReserved

  return (
                <div
                  key={slot.id}
                  className="
                    grid
                    gap-4
                    border-b
                    border-r
                    border-scoreboard-cream/25
                    bg-scoreboard-green
                    p-5
                    transition-colors
                    hover:bg-scoreboard-light
                    sm:grid-cols-[170px_1fr_auto]
                    sm:items-center
                  "
                >

                  <div>
                    <div className="scoreboard-number text-xl">
                      {start.toLocaleTimeString([], {
                        hour: "numeric",
                        minute: "2-digit",
                      })}
                    </div>

                    <div className="mt-1 text-xs text-scoreboard-muted">
                      to{" "}
                      {end.toLocaleTimeString([], {
                        hour: "numeric",
                        minute: "2-digit",
                      })}
                    </div>
                  </div>

                  <div>

                    <div className="flex items-center gap-3">

                      <span
  className={
    isReserved
      ? "h-3 w-3 bg-scoreboard-red"
      : slot.status === "available"
        ? "h-3 w-3 bg-scoreboard-amber"
        : slot.status === "tournament_hold"
          ? "h-3 w-3 bg-scoreboard-red"
          : "h-3 w-3 bg-scoreboard-muted"
  }
/>

                     <span className="text-sm font-black uppercase tracking-[0.14em]">
  {isReserved
    ? "RESERVED"
    : slot.status.replaceAll("_", " ")}
</span>

                    </div>

                    <div className="mt-2 flex items-center gap-2 text-xs text-scoreboard-muted">
                      <Clock className="h-3.5 w-3.5 text-scoreboard-amber" />

                      {start.toLocaleDateString([], {
                        weekday: "long",
                        month: "short",
                        day: "numeric",
                      })}
                    </div>

                    {slot.note && (
                      <p className="mt-2 text-xs text-scoreboard-muted">
                        {slot.note}
                      </p>
                    )}

                  </div>

                  <div>

                    {isAvailable ? (
                      <Link
                        to={`/book/resources/${resource.id}/reserve?slot=${slot.id}`}
                      >
                        <Button
                          className="
                            w-full
                            rounded-none
                            border
                            border-scoreboard-cream
                            bg-scoreboard-cream
                            px-5
                            text-xs
                            font-black
                            uppercase
                            tracking-[0.14em]
                            text-scoreboard-dark
                            hover:bg-scoreboard-amber
                          "
                        >
                          Reserve
                        </Button>
                      </Link>
                    ) : (
                      <Button
                        disabled
                        className="
                          w-full
                          rounded-none
                          border
                          border-scoreboard-cream/20
                          bg-transparent
                          px-5
                          text-xs
                          font-black
                          uppercase
                          tracking-[0.14em]
                          text-scoreboard-muted
                        "
                      >
                        Unavailable
                      </Button>
                    )}

                  </div>

                </div>
              )
            })}

          </div>
        )}

      </section>

    </main>
  )
}