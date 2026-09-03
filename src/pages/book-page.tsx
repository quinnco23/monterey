import { useEffect, useState } from "react"
import {
  ArrowRight,
  Building2,
  CircleDot,
  MapPin,
  Search,
  UserRound,
} from "lucide-react"
import { Link } from "react-router-dom"

import { Button } from "@/components/ui/button"
import { supabase } from "@/lib/supabase"

type BookingResource = {
  id: string
  name: string
  resource_type: string
  description: string | null
  city: string | null
  state: string | null
  hourly_rate: number | null
  active: boolean
}

const bookingCategories = [
  {
    title: "Training",
    eyebrow: "Coaches & Instructors",
    href: "/book/trainers",
    icon: UserRound,
  },
  {
    title: "Fields",
    eyebrow: "Diamonds in Santa Cruz",
    href: "/book/fields",
    icon: MapPin,
  },
  // {
  //   title: "Facilities",
  //   eyebrow: "Indoor & Outdoor",
  //   href: "/book/facilities",
  //   icon: Building2,
  // },
  // {
  //   title: "Machines",
  //   eyebrow: "Equipment Time",
  //   href: "/book/machines",
  //   icon: CircleDot,
  // },
]

export function BookPage() {
  const [resources, setResources] = useState<BookingResource[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    async function loadResources() {
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
          hourly_rate,
          active
        `)
        .eq("active", true)
        .order("name")

      if (error) {
        setError(error.message)
        setLoading(false)
        return
      }

      setResources(data ?? [])
      setLoading(false)
    }

    void loadResources()
  }, [])

  return (
    <main className="min-h-screen bg-scoreboard-dark text-scoreboard-cream">

      <section className="border-b border-scoreboard-cream/20 bg-scoreboard-green">
        <div className="mx-auto max-w-7xl px-6 py-16">

          <p className="scoreboard-label text-scoreboard-amber">
            Reservations
          </p>

          <div className="mt-4 grid gap-10 lg:grid-cols-[1.1fr_.9fr] lg:items-end">

            <div>
              <h1 className="text-5xl font-black uppercase tracking-[0.05em] sm:text-6xl">
                Book Santa Cruz 
              </h1>

              <p className="mt-6 max-w-2xl text-lg leading-8 text-scoreboard-muted">
                Find a field, throw a tourney play more Baseball. 
              </p>
            </div>

            <div className="border border-scoreboard-cream/25 bg-scoreboard-dark p-5">
              <p className="scoreboard-label">
                Search Availability
              </p>

              <div className="mt-4 grid gap-3 sm:grid-cols-2">

                <input
                  type="date"
                  className="rounded-none border border-scoreboard-cream/30 bg-scoreboard-cream px-3 py-3 text-scoreboard-dark"
                />

                <select
                  className="rounded-none border border-scoreboard-cream/30 bg-scoreboard-cream px-3 py-3 text-scoreboard-dark"
                >
                  <option>All Types</option>
                  <option>Field</option>
                  <option>Facility</option>
                  <option>Batting Cage</option>
                  <option>Pitching Lane</option>
                  <option>Pitching Machine</option>
                  <option>Trainer</option>
                </select>

              </div>

              <Button
                className="mt-3 w-full rounded-none bg-scoreboard-cream font-black uppercase tracking-[0.14em] text-scoreboard-dark hover:bg-scoreboard-amber"
              >
                <Search className="mr-2 h-4 w-4" />
                Search
              </Button>
            </div>

          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-12">

        <div className="mb-6 border-b border-scoreboard-cream/20 pb-4">
          <p className="scoreboard-label">
            Browse
          </p>

          <h2 className="mt-2 text-2xl font-black uppercase tracking-[0.08em]">
            Categories
          </h2>
        </div>

        <div className="grid border-l border-t border-scoreboard-cream/25 md:grid-cols-2">

          {bookingCategories.map((category) => {
            const Icon = category.icon

            return (
              <Link
                key={category.title}
                to={category.href}
                className="group border-b border-r border-scoreboard-cream/25 bg-scoreboard-green p-6 transition-colors hover:bg-scoreboard-light"
              >
                <div className="flex items-start justify-between">

                  <div>
                    <p className="scoreboard-label text-scoreboard-amber">
                      {category.eyebrow}
                    </p>

                    <h3 className="mt-3 text-2xl font-black uppercase tracking-[0.08em]">
                      {category.title}
                    </h3>
                  </div>

                  <Icon className="h-6 w-6 text-scoreboard-amber" />

                </div>

                <div className="mt-8 flex items-center gap-2 text-xs font-black uppercase tracking-[0.14em]">
                  Browse
                  <ArrowRight className="h-4 w-4" />
                </div>
              </Link>
            )
          })}

        </div>
      </section>

      <section className="border-t border-scoreboard-cream/15 bg-scoreboard-green/30">
        <div className="mx-auto max-w-7xl px-6 py-12">

          <div className="mb-6 flex items-end justify-between border-b border-scoreboard-cream/20 pb-4">

            <div>
              <p className="scoreboard-label">
                Available Now
              </p>

              <h2 className="mt-2 text-2xl font-black uppercase tracking-[0.08em]">
                Book Now
              </h2>
            </div>

            {!loading && !error && (
              <div className="scoreboard-number text-2xl text-scoreboard-amber">
                {resources.length}
              </div>
            )}

          </div>

          {loading && (
            <div className="border border-scoreboard-cream/20 bg-scoreboard-green p-6">
              <p className="scoreboard-label">
                Loading Resources...
              </p>
            </div>
          )}

          {error && (
            <div className="border border-scoreboard-red/60 bg-scoreboard-green p-6">
              <p className="scoreboard-label text-scoreboard-amber">
                Unable To Load Resources
              </p>

              <p className="mt-3 text-sm text-scoreboard-muted">
                {error}
              </p>
            </div>
          )}

          {!loading && !error && resources.length === 0 && (
            <div className="border border-scoreboard-cream/20 bg-scoreboard-green p-8">
              <h3 className="text-xl font-black uppercase">
                No Bookable Resources Yet
              </h3>

              <p className="mt-3 text-sm text-scoreboard-muted">
                Add resources in Supabase to begin accepting reservations.
              </p>
            </div>
          )}

          {!loading && !error && resources.length > 0 && (
            <div className="grid gap-px bg-scoreboard-cream/20 md:grid-cols-2 lg:grid-cols-3">

              {resources.map((resource) => (
                <Link
                  key={resource.id}
                  to={`/book/resources/${resource.id}`}
                  className="group bg-scoreboard-green p-6 transition-colors hover:bg-scoreboard-light"
                >

                  <p className="scoreboard-label text-scoreboard-amber">
                    {resource.resource_type.replaceAll("_", " ")}
                  </p>

                  <h3 className="mt-3 text-xl font-black uppercase tracking-[0.05em]">
                    {resource.name}
                  </h3>

                  {resource.description && (
                    <p className="mt-3 text-sm leading-6 text-scoreboard-muted">
                      {resource.description}
                    </p>
                  )}

                  <div className="mt-5 space-y-2 text-sm text-scoreboard-muted">

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

                  <div className="mt-6 flex items-center justify-between border-t border-scoreboard-cream/20 pt-4">

                    <span className="text-xs font-black uppercase tracking-[0.14em]">
                      View Availability
                    </span>

                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />

                  </div>

                </Link>
              ))}

            </div>
          )}

        </div>
      </section>

    </main>
  )
}