import { ArrowLeft, CalendarDays, Clock, MapPin } from "lucide-react"
import { Link } from "react-router-dom"

import { Button } from "@/components/ui/button"

const timeSlots = [
  {
    time: "8:00 AM",
    status: "available",
    label: "Available",
  },
  {
    time: "10:00 AM",
    status: "reserved",
    label: "Reserved",
  },
  {
    time: "12:00 PM",
    status: "available",
    label: "Available",
  },
  {
    time: "2:00 PM",
    status: "available",
    label: "Available",
  },
  {
    time: "4:00 PM",
    status: "hold",
    label: "Tournament Hold",
  },
  {
    time: "6:00 PM",
    status: "available",
    label: "Available",
  },
]

export function FieldDetailPage() {
  return (
    <main className="min-h-screen bg-scoreboard-dark text-scoreboard-cream">
      <section className="border-b border-scoreboard-cream/20 bg-scoreboard-green">
        <div className="mx-auto max-w-7xl px-6 py-12">
          <Link
            to="/fields"
            className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-scoreboard-muted transition-colors hover:text-scoreboard-amber"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to fields
          </Link>

          <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_auto] lg:items-end">
            <div>
              <p className="scoreboard-label text-scoreboard-amber">
                Aptos, California
              </p>

              <h1 className="mt-3 text-4xl font-black uppercase tracking-[0.08em] sm:text-5xl">
                Polo Grounds
              </h1>

              <p className="mt-2 text-xl font-bold uppercase tracking-[0.08em] text-scoreboard-muted">
                Field 2
              </p>

              <div className="mt-6 flex flex-wrap gap-x-6 gap-y-3 text-sm text-scoreboard-muted">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-scoreboard-amber" />
                  Aptos, CA
                </div>

                <div className="flex items-center gap-2">
                  <CalendarDays className="h-4 w-4 text-scoreboard-amber" />
                  Saturday, June 20
                </div>

                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-scoreboard-amber" />
                  2-hour reservation blocks
                </div>
              </div>
            </div>

            <div className="border border-scoreboard-cream/25 bg-scoreboard-dark px-5 py-4">
              <div className="scoreboard-label">
                Field Status
              </div>

              <div className="mt-2 flex items-center gap-3">
                <span className="h-3 w-3 bg-scoreboard-amber" />

                <span className="text-sm font-black uppercase tracking-[0.12em]">
                  Open for booking
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-6 py-12">
        <div className="mb-6 flex items-end justify-between border-b border-scoreboard-cream/20 pb-4">
          <div>
            <p className="scoreboard-label">
              Reservation Board
            </p>

            <h2 className="mt-2 text-2xl font-black uppercase tracking-[0.08em]">
              Saturday, June 20
            </h2>
          </div>

          <div className="hidden text-right sm:block">
            <div className="scoreboard-label">
              Polo Grounds
            </div>

            <div className="scoreboard-number mt-1 text-xl text-scoreboard-amber">
              FIELD 2
            </div>
          </div>
        </div>

        <div className="border-l border-t border-scoreboard-cream/25">
          {timeSlots.map((slot) => {
            const isAvailable = slot.status === "available"
            const isReserved = slot.status === "reserved"

            return (
              <div
                key={slot.time}
                className="
                  grid
                  grid-cols-[120px_1fr_auto]
                  items-center
                  border-b
                  border-r
                  border-scoreboard-cream/25
                  bg-scoreboard-green
                  transition-colors
                  hover:bg-scoreboard-light
                "
              >
                <div className="border-r border-scoreboard-cream/20 px-4 py-5">
                  <div className="scoreboard-number text-xl sm:text-2xl">
                    {slot.time}
                  </div>
                </div>

                <div className="px-4 py-5">
                  <div className="flex items-center gap-3">
                    <span
                      className={
                        slot.status === "available"
                          ? "h-3 w-3 bg-scoreboard-amber"
                          : slot.status === "reserved"
                            ? "h-3 w-3 bg-scoreboard-red"
                            : "h-3 w-3 bg-scoreboard-muted"
                      }
                    />

                    <span
                      className={
                        slot.status === "available"
                          ? "text-sm font-black uppercase tracking-[0.14em] text-scoreboard-cream"
                          : "text-sm font-black uppercase tracking-[0.14em] text-scoreboard-muted"
                      }
                    >
                      {slot.label}
                    </span>
                  </div>
                </div>

                <div className="px-4 py-4">
                  {isAvailable ? (
                    <Button
                      className="
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
                  ) : (
                    <Button
                      disabled
                      className="
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
                        opacity-60
                      "
                    >
                      {isReserved ? "Booked" : "Held"}
                    </Button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </section>
    </main>
  )
}