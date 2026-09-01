import { useEffect, useState } from "react"
import {
  CalendarDays,
  Clock,
  MapPin,
} from "lucide-react"
import { Link } from "react-router-dom"

import { Button } from "@/components/ui/button"
import { supabase } from "@/lib/supabase"

type FieldResource = {
  id: string
  name: string
  resource_type: string
  description: string | null
  city: string | null
  state: string | null
  hourly_rate: number | null
}

export function FieldReservationsPage() {
  const [fields, setFields] = useState<FieldResource[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    async function loadFields() {
      setLoading(true)
      setError("")

      const { data, error } = await supabase
        .from("booking_resources")
        .select(`
          id,
          name,
          resource_type,
          description,
          city,
          state,
          hourly_rate
        `)
        .eq("active", true)
        .eq("resource_type", "field")
        .order("name")

      if (error) {
        setError(error.message)
        setLoading(false)
        return
      }

      setFields(data ?? [])
      setLoading(false)
    }

    void loadFields()
  }, [])

  return (
    <main className="min-h-screen bg-scoreboard-dark text-scoreboard-cream">

      {/* HEADER */}
      <section className="border-b border-scoreboard-cream/20 bg-scoreboard-green">
        <div className="mx-auto max-w-7xl px-6 py-14">

          <p className="scoreboard-label text-scoreboard-amber">
            Santa Cruz County
          </p>

          <h1 className="mt-3 text-4xl font-black uppercase tracking-[0.08em] sm:text-5xl">
            Field Reservations
          </h1>

          <p className="mt-4 max-w-2xl text-scoreboard-muted">
            Find an available baseball field, select a date and time,
            and reserve it for your team.
          </p>

        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-10">

        {/* FILTER BAR */}
        <div className="mb-8 grid gap-3 border border-scoreboard-cream/25 bg-scoreboard-green p-4 md:grid-cols-4">

          <input
            type="date"
            className="
              rounded-none
              border
              border-scoreboard-cream/30
              bg-scoreboard-cream
              px-3
              py-3
              text-scoreboard-dark
            "
          />

          <select
            className="
              rounded-none
              border
              border-scoreboard-cream/30
              bg-scoreboard-cream
              px-3
              py-3
              text-scoreboard-dark
            "
          >
            <option>All Areas</option>
            <option>Santa Cruz</option>
            <option>Aptos</option>
            <option>Soquel</option>
            <option>Live Oak</option>
            <option>Scotts Valley</option>
            <option>Ben Lomond</option>
            <option>Felton</option>
            <option>Watsonville</option>
          </select>

          <select
            className="
              rounded-none
              border
              border-scoreboard-cream/30
              bg-scoreboard-cream
              px-3
              py-3
              text-scoreboard-dark
            "
          >
            <option>All Field Types</option>
            <option>Youth Baseball</option>
            <option>Baseball / Softball</option>
            <option>Middle School Baseball</option>
          </select>

          <Button
            className="
              rounded-none
              bg-scoreboard-cream
              font-bold
              uppercase
              tracking-[0.12em]
              text-scoreboard-dark
              hover:bg-scoreboard-amber
            "
          >
            Check Availability
          </Button>

        </div>

        {/* SECTION HEADER */}
        <div className="mb-5 flex items-end justify-between border-b border-scoreboard-cream/20 pb-4">

          <div>
            <p className="scoreboard-label">
              Available Diamonds
            </p>

            <h2 className="mt-1 text-2xl font-black uppercase tracking-[0.08em]">
              Santa Cruz County
            </h2>
          </div>

          {!loading && !error && (
            <span className="scoreboard-number text-scoreboard-amber">
              {fields.length} Fields
            </span>
          )}

        </div>

        {/* LOADING */}
        {loading && (
          <div className="border border-scoreboard-cream/20 bg-scoreboard-green p-6">
            <p className="scoreboard-label">
              Loading Fields...
            </p>
          </div>
        )}

        {/* ERROR */}
        {error && (
          <div className="border border-scoreboard-red/60 bg-scoreboard-green p-6">

            <p className="scoreboard-label text-scoreboard-amber">
              Unable To Load Fields
            </p>

            <p className="mt-3 text-sm text-scoreboard-muted">
              {error}
            </p>

          </div>
        )}

        {/* NO FIELDS */}
        {!loading && !error && fields.length === 0 && (
          <div className="border border-scoreboard-cream/20 bg-scoreboard-green p-8">

            <h3 className="text-xl font-black uppercase tracking-[0.06em]">
              No Fields Available
            </h3>

            <p className="mt-3 text-sm text-scoreboard-muted">
              No active field resources have been added yet.
            </p>

          </div>
        )}

        {/* FIELD CARDS */}
        {!loading && !error && fields.length > 0 && (
          <div className="grid gap-px bg-scoreboard-cream/20 md:grid-cols-2 lg:grid-cols-3">

            {fields.map((field) => (
              <article
                key={field.id}
                className="
                  flex
                  flex-col
                  bg-scoreboard-green
                  p-6
                  transition-colors
                  hover:bg-scoreboard-light
                "
              >

                <div className="flex items-start justify-between gap-4">

                  <div>
                    <p className="scoreboard-label text-scoreboard-amber">
                      {field.city ?? "Santa Cruz County"}
                    </p>

                    <h3 className="mt-2 text-xl font-black uppercase tracking-[0.05em]">
                      {field.name}
                    </h3>

                    {field.description && (
                      <p className="mt-2 text-sm leading-6 text-scoreboard-muted">
                        {field.description}
                      </p>
                    )}
                  </div>

                  <span
                    className="
                      bg-scoreboard-amber
                      px-2
                      py-1
                      text-[10px]
                      font-black
                      uppercase
                      tracking-[0.14em]
                      text-scoreboard-dark
                    "
                  >
                    Reservable
                  </span>

                </div>

                <div className="mt-6 space-y-3 border-t border-scoreboard-cream/15 pt-5 text-sm text-scoreboard-muted">

                  <div className="flex items-center gap-3">
                    <MapPin className="h-4 w-4 text-scoreboard-amber" />

                    {[field.city, field.state]
                      .filter(Boolean)
                      .join(", ") || "Location TBD"}
                  </div>

                  <div className="flex items-center gap-3">
                    <CalendarDays className="h-4 w-4 text-scoreboard-amber" />

                    Baseball Field
                  </div>

                  <div className="flex items-center gap-3">
                    <Clock className="h-4 w-4 text-scoreboard-amber" />

                    View posted availability
                  </div>

                  {field.hourly_rate !== null && (
                    <div className="scoreboard-number pt-2 text-lg text-scoreboard-cream">
                      ${Number(field.hourly_rate).toFixed(2)} / HR
                    </div>
                  )}

                </div>

                <Link
                  to={`/book/resources/${field.id}`}
                  className="mt-auto"
                >
                  <Button
                    className="
                      mt-6
                      w-full
                      rounded-none
                      border
                      border-scoreboard-cream
                      bg-transparent
                      font-bold
                      uppercase
                      tracking-[0.14em]
                      text-scoreboard-cream
                      hover:bg-scoreboard-cream
                      hover:text-scoreboard-dark
                    "
                  >
                    View Times
                  </Button>
                </Link>

              </article>
            ))}

          </div>
        )}

      </section>

    </main>
  )
}