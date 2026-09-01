import { useEffect, useState } from "react"
import { ArrowRight } from "lucide-react"
import { Link } from "react-router-dom"

import { supabase } from "@/lib/supabase"

type Resource = {
  id: string
  name: string
  resource_type: string
  city: string | null
  state: string | null
  hourly_rate: number | null
  active: boolean
}

export function AdminResourcesPage() {
  const [resources, setResources] = useState<Resource[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    async function loadResources() {
      const { data, error } = await supabase
        .from("booking_resources")
        .select(`
          id,
          name,
          resource_type,
          city,
          state,
          hourly_rate,
          active
        `)
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
        <div className="mx-auto max-w-7xl px-6 py-10">
          <p className="scoreboard-label text-scoreboard-amber">
            SCBC Admin
          </p>

          <h1 className="mt-3 text-4xl font-black uppercase tracking-[0.06em]">
            Resources
          </h1>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-10">
        {loading && (
          <p className="scoreboard-label">
            Loading Resources...
          </p>
        )}

        {error && (
          <p className="text-sm text-scoreboard-red">
            {error}
          </p>
        )}

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {resources.map((resource) => (
            <Link
              key={resource.id}
              to={`/admin/resources/${resource.id}`}
              className="
                group
                border
                border-scoreboard-cream/25
                bg-scoreboard-green
                p-6
                transition-colors
                hover:bg-scoreboard-light
              "
            >
              <p className="scoreboard-label text-scoreboard-amber">
                {resource.resource_type.replaceAll("_", " ")}
              </p>

              <h2 className="mt-3 text-xl font-black uppercase tracking-[0.05em]">
                {resource.name}
              </h2>

              <p className="mt-3 text-sm text-scoreboard-muted">
                {[resource.city, resource.state]
                  .filter(Boolean)
                  .join(", ")}
              </p>

              {resource.hourly_rate !== null && (
                <p className="scoreboard-number mt-4">
                  ${Number(resource.hourly_rate).toFixed(2)} / HR
                </p>
              )}

              <div className="mt-6 flex items-center justify-between border-t border-scoreboard-cream/20 pt-4">
                <span className="text-xs font-black uppercase tracking-[0.12em]">
                  Manage Resource
                </span>

                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </div>
            </Link>
          ))}
        </div>
      </section>
    </main>
  )
}