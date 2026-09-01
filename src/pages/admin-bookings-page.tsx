import { useEffect, useMemo, useState } from "react"
import {
  CalendarDays,
  Clock,
  MapPin,
} from "lucide-react"

import { supabase } from "@/lib/supabase"

type AdminBooking = {
  id: string
  start_time: string
  end_time: string
  status: string
  purpose: string | null
  notes: string | null
  total_amount: number | null

  organizations: {
    id: string
    name: string
  } | null

  teams: {
    id: string
    name: string
    age_group: string | null
  } | null

  reservation_resources: {
    id: string
    price: number | null

    booking_resources: {
      id: string
      name: string
      resource_type: string
      city: string | null
      state: string | null
    } | null
  }[]
}


export function AdminBookingsPage() {
  const [bookings, setBookings] = useState<AdminBooking[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [filter, setFilter] = useState("upcoming")
  const [updatingBookingId, setUpdatingBookingId] =
  useState<string | null>(null)

  useEffect(() => {
    async function loadBookings() {
      setLoading(true)
      setError("")

      const { data, error } = await supabase
        .from("reservations")
        .select(`
          id,
          start_time,
          end_time,
          status,
          purpose,
          notes,
          total_amount,

          organizations (
            id,
            name
          ),

          teams (
            id,
            name,
            age_group
          ),

          reservation_resources (
            id,
            price,

            booking_resources (
              id,
              name,
              resource_type,
              city,
              state
            )
          )
        `)
        .order("start_time", { ascending: true })

      if (error) {
        setError(error.message)
        setLoading(false)
        return
      }

      setBookings((data ?? []) as unknown as AdminBooking[])
      setLoading(false)
    }

    void loadBookings()
  }, [])

  const filteredBookings = useMemo(() => {
    const now = new Date()

    return bookings.filter((booking) => {
      const end = new Date(booking.end_time)

      if (filter === "upcoming") {
        return end >= now && booking.status !== "cancelled"
      }

      if (filter === "past") {
        return end < now
      }

      if (filter === "cancelled") {
        return booking.status === "cancelled"
      }

      return true
    })
  }, [bookings, filter])

  async function updateBookingStatus(
  bookingId: string,
  status: "cancelled" | "completed"
) {
  setUpdatingBookingId(bookingId)
  setError("")

  const { data, error } = await supabase
    .from("reservations")
    .update({
      status,
      updated_at: new Date().toISOString(),
    })
    .eq("id", bookingId)
    .select("id, status")
    .single()

  if (error) {
    console.error("BOOKING UPDATE ERROR:", error)
    setError(error.message)
    setUpdatingBookingId(null)
    return
  }

  console.log("BOOKING UPDATED:", data)

  setBookings((current) =>
    current.map((booking) =>
      booking.id === bookingId
        ? {
            ...booking,
            status,
          }
        : booking
    )
  )

  setUpdatingBookingId(null)
}

  return (
    <main className="min-h-screen bg-scoreboard-dark text-scoreboard-cream">

      <section className="border-b border-scoreboard-cream/20 bg-scoreboard-green">
        <div className="mx-auto max-w-7xl px-6 py-12">

          <p className="scoreboard-label text-scoreboard-amber">
            SCBC Admin
          </p>

          <div className="mt-3 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">

            <div>
              <h1 className="text-4xl font-black uppercase tracking-[0.06em] sm:text-5xl">
                Bookings
              </h1>

              <p className="mt-3 text-sm text-scoreboard-muted">
                Review field, facility, machine, and training reservations.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              {[
                ["upcoming", "Upcoming"],
                ["past", "Past"],
                ["cancelled", "Cancelled"],
                ["all", "All"],
              ].map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setFilter(value)}
                  className={
                    filter === value
                      ? "border border-scoreboard-amber bg-scoreboard-amber px-4 py-2 text-xs font-black uppercase tracking-[0.12em] text-scoreboard-dark"
                      : "border border-scoreboard-cream/30 px-4 py-2 text-xs font-black uppercase tracking-[0.12em] text-scoreboard-cream hover:border-scoreboard-amber"
                  }
                >
                  {label}
                </button>
              ))}
            </div>

          </div>

        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-10">

        <div className="mb-6 flex items-end justify-between border-b border-scoreboard-cream/20 pb-4">

          <div>
            <p className="scoreboard-label">
              Reservation Board
            </p>

            <h2 className="mt-2 text-2xl font-black uppercase tracking-[0.08em]">
              {filter}
            </h2>
          </div>

          {!loading && !error && (
            <div className="scoreboard-number text-2xl text-scoreboard-amber">
              {filteredBookings.length}
            </div>
          )}

        </div>

        {loading && (
          <div className="border border-scoreboard-cream/20 bg-scoreboard-green p-6">
            <p className="scoreboard-label">
              Loading Bookings...
            </p>
          </div>
        )}

        {error && (
          <div className="border border-scoreboard-red/60 bg-scoreboard-green p-6">
            <p className="scoreboard-label text-scoreboard-amber">
              Unable To Load Bookings
            </p>

            <p className="mt-3 text-sm text-scoreboard-muted">
              {error}
            </p>
          </div>
        )}

        {!loading && !error && filteredBookings.length === 0 && (
          <div className="border border-scoreboard-cream/20 bg-scoreboard-green p-8">
            <h3 className="text-xl font-black uppercase tracking-[0.06em]">
              No Bookings
            </h3>

            <p className="mt-3 text-sm text-scoreboard-muted">
              There are no reservations in this view.
            </p>
          </div>
        )}

        {!loading && !error && filteredBookings.length > 0 && (
          <div className="space-y-4">

            {filteredBookings.map((booking) => {
              const start = new Date(booking.start_time)
              const end = new Date(booking.end_time)

              const resource =
                booking.reservation_resources[0]?.booking_resources

              return (
                <article
                  key={booking.id}
                  className="border border-scoreboard-cream/25 bg-scoreboard-green p-6"
                >

                  <div className="grid gap-6 lg:grid-cols-[1fr_auto]">

                    <div>

                      <div className="flex flex-wrap items-center gap-3">

                        <p className="scoreboard-label text-scoreboard-amber">
                          {resource?.resource_type
                            ?.replaceAll("_", " ") ?? "Booking"}
                        </p>

                        <span
                          className={
                            booking.status === "confirmed"
                              ? "bg-scoreboard-amber px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-scoreboard-dark"
                              : "border border-scoreboard-cream/30 px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-scoreboard-muted"
                          }
                        >
                          {booking.status}
                        </span>

                      </div>

                      <h3 className="mt-3 text-2xl font-black uppercase tracking-[0.05em]">
                        {resource?.name ?? "Unknown Resource"}
                      </h3>

                      <div className="mt-5 grid gap-3 text-sm text-scoreboard-muted sm:grid-cols-2">

                        <div className="flex items-center gap-2">
                          <CalendarDays className="h-4 w-4 text-scoreboard-amber" />

                          {start.toLocaleDateString([], {
                            weekday: "short",
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </div>

                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-scoreboard-amber" />

                          {start.toLocaleTimeString([], {
                            hour: "numeric",
                            minute: "2-digit",
                          })}
                          {" – "}
                          {end.toLocaleTimeString([], {
                            hour: "numeric",
                            minute: "2-digit",
                          })}
                        </div>

                        {resource?.city && (
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-scoreboard-amber" />

                            {[resource.city, resource.state]
                              .filter(Boolean)
                              .join(", ")}
                          </div>
                        )}

                      </div>

                      <div className="mt-6 grid gap-4 border-t border-scoreboard-cream/20 pt-5 sm:grid-cols-3">

                        <div>
                          <p className="scoreboard-label">
                            Organization
                          </p>

                          <p className="mt-2 text-sm font-bold">
                            {booking.organizations?.name ?? "Personal"}
                          </p>
                        </div>

                        <div>
                          <p className="scoreboard-label">
                            Team
                          </p>

                          <p className="mt-2 text-sm font-bold">
                            {booking.teams
                              ? `${booking.teams.age_group ?? ""} ${booking.teams.name}`.trim()
                              : "No Team"}
                          </p>
                        </div>

                        <div>
                          <p className="scoreboard-label">
                            Purpose
                          </p>

                          <p className="mt-2 text-sm font-bold">
                            {booking.purpose ?? "Not specified"}
                          </p>
                        </div>

                      </div>

                      {booking.notes && (
                        <div className="mt-5 border-t border-scoreboard-cream/20 pt-5">
                          <p className="scoreboard-label">
                            Notes
                          </p>

                          <p className="mt-2 text-sm leading-6 text-scoreboard-muted">
                            {booking.notes}
                          </p>
                        </div>
                      )}

                    </div>

                    <div className="lg:text-right">

                      <p className="scoreboard-label">
                        Total
                      </p>

                      <div className="scoreboard-number mt-2 text-3xl text-scoreboard-amber">
                        {booking.total_amount !== null
                          ? `$${Number(booking.total_amount).toFixed(2)}`
                          : "TBD"}
                      </div>

                    </div>

                  </div>

                  {booking.status === "confirmed" && (
  <div className="mt-6 flex flex-wrap gap-3 border-t border-scoreboard-cream/20 pt-5">

    <button
      type="button"
      disabled={updatingBookingId === booking.id}
      onClick={() =>
        void updateBookingStatus(
          booking.id,
          "completed"
        )
      }
      className="
        border
        border-scoreboard-cream/40
        px-4
        py-3
        text-xs
        font-black
        uppercase
        tracking-[0.12em]
        text-scoreboard-cream
        transition-colors
        hover:border-scoreboard-amber
        hover:text-scoreboard-amber
        disabled:cursor-not-allowed
        disabled:opacity-50
      "
    >
      {updatingBookingId === booking.id
        ? "Updating..."
        : "Mark Completed"}
    </button>

    <button
      type="button"
      disabled={updatingBookingId === booking.id}
      onClick={() => {
        const confirmed = window.confirm(
          "Cancel this reservation? The time slot will become available for booking again."
        )

        if (!confirmed) return

        void updateBookingStatus(
          booking.id,
          "cancelled"
        )
      }}
      className="
        border
        border-scoreboard-red/60
        px-4
        py-3
        text-xs
        font-black
        uppercase
        tracking-[0.12em]
        text-scoreboard-cream
        transition-colors
        hover:bg-scoreboard-red
        disabled:cursor-not-allowed
        disabled:opacity-50
      "
    >
      Cancel Reservation
    </button>

  </div>
)}


{booking.status === "completed" && (
  <div className="mt-6 border-t border-scoreboard-cream/20 pt-5">
    <span className="text-xs font-black uppercase tracking-[0.14em] text-scoreboard-muted">
      Reservation Completed
    </span>
  </div>
)}

{booking.status === "cancelled" && (
  <div className="mt-6 border-t border-scoreboard-cream/20 pt-5">
    <span className="text-xs font-black uppercase tracking-[0.14em] text-scoreboard-red">
      Reservation Cancelled
    </span>
  </div>
)}
                </article>
              )
            })}

          </div>
        )}

      </section>

    </main>
  )
}