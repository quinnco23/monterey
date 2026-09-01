import { useEffect, useMemo, useState } from "react"
import {
  CalendarDays,
  Clock,
  MapPin,
} from "lucide-react"
import { Link } from "react-router-dom"

import { supabase } from "@/lib/supabase"
import { useAuth } from "@/features/auth/auth-context"

type Reservation = {
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
    booking_resources: {
      id: string
      name: string
      resource_type: string
      city: string | null
      state: string | null
    } | null
  }[]
}

export function MyReservationsPage() {
  const { user } = useAuth()

  const [reservations, setReservations] = useState<Reservation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [filter, setFilter] = useState("upcoming")
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  useEffect(() => {
    async function loadReservations() {
      if (!user) {
        setLoading(false)
        return
      }

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
            booking_resources (
              id,
              name,
              resource_type,
              city,
              state
            )
          )
        `)
        .eq("created_by_user_id", user.id)
        .order("start_time", { ascending: true })

      if (error) {
        setError(error.message)
        setLoading(false)
        return
      }

      setReservations((data ?? []) as unknown as Reservation[])
      setLoading(false)
    }

    void loadReservations()
  }, [user])

  const filteredReservations = useMemo(() => {
    const now = new Date()

    return reservations.filter((reservation) => {
      const end = new Date(reservation.end_time)

      if (filter === "upcoming") {
        return (
          end >= now &&
          reservation.status !== "cancelled"
        )
      }

      if (filter === "past") {
        return (
          end < now &&
          reservation.status !== "cancelled"
        )
      }

      if (filter === "cancelled") {
        return reservation.status === "cancelled"
      }

      return true
    })
  }, [reservations, filter])

  async function cancelReservation(reservationId: string) {
    const confirmed = window.confirm(
      "Cancel this reservation? The time slot will become available again."
    )

    if (!confirmed) return

    setUpdatingId(reservationId)
    setError("")

    const { error } = await supabase
      .from("reservations")
      .update({
        status: "cancelled",
        updated_at: new Date().toISOString(),
      })
      .eq("id", reservationId)
      .eq("created_by_user_id", user?.id)

    if (error) {
      setError(error.message)
      setUpdatingId(null)
      return
    }

    setReservations((current) =>
      current.map((reservation) =>
        reservation.id === reservationId
          ? {
              ...reservation,
              status: "cancelled",
            }
          : reservation
      )
    )

    setUpdatingId(null)
  }

  return (
    <main className="min-h-screen bg-scoreboard-dark text-scoreboard-cream">

      <section className="border-b border-scoreboard-cream/20 bg-scoreboard-green">
        <div className="mx-auto max-w-7xl px-6 py-12">

          <p className="scoreboard-label text-scoreboard-amber">
            Dashboard
          </p>

          <div className="mt-3 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">

            <div>
              <h1 className="text-4xl font-black uppercase tracking-[0.06em] sm:text-5xl">
                My Reservations
              </h1>

              <p className="mt-3 text-sm text-scoreboard-muted">
                Review your upcoming and previous field,
                facility, and training reservations.
              </p>
            </div>

            <Link
              to="/book"
              className="
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
              Book Something
            </Link>

          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-10">

        <div className="mb-6 flex flex-wrap gap-2">

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
                  ? `
                    border
                    border-scoreboard-amber
                    bg-scoreboard-amber
                    px-4
                    py-2
                    text-xs
                    font-black
                    uppercase
                    tracking-[0.12em]
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
                    tracking-[0.12em]
                    text-scoreboard-cream
                    hover:border-scoreboard-amber
                  `
              }
            >
              {label}
            </button>
          ))}

        </div>

        {loading && (
          <div className="border border-scoreboard-cream/20 bg-scoreboard-green p-6">
            <p className="scoreboard-label">
              Loading Reservations...
            </p>
          </div>
        )}

        {error && (
          <div className="mb-6 border border-scoreboard-red/60 bg-scoreboard-green p-5">
            <p className="text-sm text-scoreboard-muted">
              {error}
            </p>
          </div>
        )}

        {!loading &&
          !error &&
          filteredReservations.length === 0 && (
            <div className="border border-scoreboard-cream/20 bg-scoreboard-green p-8">

              <h2 className="text-xl font-black uppercase tracking-[0.06em]">
                No Reservations
              </h2>

              <p className="mt-3 text-sm text-scoreboard-muted">
                You do not have any reservations in this view.
              </p>

              <Link
                to="/book"
                className="
                  mt-6
                  inline-flex
                  border
                  border-scoreboard-cream
                  px-4
                  py-3
                  text-xs
                  font-black
                  uppercase
                  tracking-[0.12em]
                  hover:bg-scoreboard-cream
                  hover:text-scoreboard-dark
                "
              >
                Browse Resources
              </Link>

            </div>
          )}

        <div className="space-y-4">

          {filteredReservations.map((reservation) => {
            const start = new Date(reservation.start_time)
            const end = new Date(reservation.end_time)

            const resource =
              reservation.reservation_resources[0]
                ?.booking_resources

            return (
              <article
                key={reservation.id}
                className="border border-scoreboard-cream/25 bg-scoreboard-green p-6"
              >

                <div className="grid gap-6 lg:grid-cols-[1fr_auto]">

                  <div>

                    <div className="flex flex-wrap items-center gap-3">

                      <p className="scoreboard-label text-scoreboard-amber">
                        {resource?.resource_type
                          ?.replaceAll("_", " ") ??
                          "Reservation"}
                      </p>

                      <span
                        className={
                          reservation.status === "confirmed"
                            ? "bg-scoreboard-amber px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-scoreboard-dark"
                            : reservation.status === "cancelled"
                              ? "border border-scoreboard-red/60 px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-scoreboard-red"
                              : "border border-scoreboard-cream/30 px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-scoreboard-muted"
                        }
                      >
                        {reservation.status}
                      </span>

                    </div>

                    <h2 className="mt-3 text-2xl font-black uppercase tracking-[0.05em]">
                      {resource?.name ?? "Unknown Resource"}
                    </h2>

                    <div className="mt-5 grid gap-3 text-sm text-scoreboard-muted sm:grid-cols-2">

                      <div className="flex items-center gap-2">
                        <CalendarDays className="h-4 w-4 text-scoreboard-amber" />

                        {start.toLocaleDateString([], {
                          weekday: "long",
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
                          {reservation.organizations?.name ??
                            "Personal"}
                        </p>
                      </div>

                      <div>
                        <p className="scoreboard-label">
                          Team
                        </p>

                        <p className="mt-2 text-sm font-bold">
                          {reservation.teams
                            ? `${reservation.teams.age_group ?? ""} ${reservation.teams.name}`.trim()
                            : "No Team"}
                        </p>
                      </div>

                      <div>
                        <p className="scoreboard-label">
                          Purpose
                        </p>

                        <p className="mt-2 text-sm font-bold">
                          {reservation.purpose ??
                            "Not specified"}
                        </p>
                      </div>

                    </div>

                    {reservation.notes && (
                      <div className="mt-5 border-t border-scoreboard-cream/20 pt-5">

                        <p className="scoreboard-label">
                          Notes
                        </p>

                        <p className="mt-2 text-sm leading-6 text-scoreboard-muted">
                          {reservation.notes}
                        </p>

                      </div>
                    )}

                    {reservation.status === "confirmed" && (
                      <div className="mt-6 border-t border-scoreboard-cream/20 pt-5">

                        <button
                          type="button"
                          disabled={updatingId === reservation.id}
                          onClick={() =>
                            void cancelReservation(
                              reservation.id
                            )
                          }
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
                            hover:bg-scoreboard-red
                            disabled:opacity-50
                          "
                        >
                          {updatingId === reservation.id
                            ? "Cancelling..."
                            : "Cancel Reservation"}
                        </button>

                      </div>
                    )}

                  </div>

                  <div className="lg:text-right">

                    <p className="scoreboard-label">
                      Total
                    </p>

                    <div className="scoreboard-number mt-2 text-3xl text-scoreboard-amber">
                      {reservation.total_amount !== null
                        ? `$${Number(
                            reservation.total_amount
                          ).toFixed(2)}`
                        : "TBD"}
                    </div>

                  </div>

                </div>

              </article>
            )
          })}

        </div>

      </section>

    </main>
  )
}