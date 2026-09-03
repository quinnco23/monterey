import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useAuth } from "@/features/auth/auth-context"
import { getMyOrganizations, type Organization } from "@/features/organizations/organization-service"

export function DashboardPage() {
  const { user } = useAuth()
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    void getMyOrganizations()
      .then(setOrganizations)
      .catch((err) => setError(err instanceof Error ? err.message : "Unable to load organizations"))
      .finally(() => setLoading(false))
  }, [])

  return (
    <main className="mx-auto max-w-6xl px-6 py-12">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-red-700">Dashboard</p>
          <h1 className="mt-2 text-4xl font-black tracking-tight">Welcome to MBLB</h1>
          <p className="mt-2 text-slate-600">{user?.email}</p>
        </div>
        <Link className={cn(buttonVariants())} to="/onboarding">Create organization</Link>
      </div>

      <section className="mt-10">
        <h2 className="text-xl font-bold">Your organizations</h2>
        {loading && <p className="mt-4 text-slate-500">Loading...</p>}
        {error && <p className="mt-4 text-red-700">{error}</p>}
        {!loading && !error && organizations.length === 0 && (
          <div className="mt-4 rounded-2xl border border-dashed border-slate-300 p-8">
            <h3 className="font-bold">No organization yet</h3>
            <p className="mt-2 text-sm text-slate-600">Create your club, league, or tournament organization to begin managing teams.</p>
            <Link className={cn(buttonVariants(), "mt-5")} to="/onboarding">Start organization setup</Link>
          </div>
        )}
        <div className="mt-5 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
  {organizations.map((org) => (
    <Link
      key={org.id}
      to={`/dashboard/organizations/${org.id}`}
      className="group block"
    >
      <article
        className="
          h-full
          cursor-pointer
          rounded-2xl
          border
          border-slate-200
          p-5
          shadow-sm
          transition
          hover:border-scoreboard-amber
          hover:shadow-md
        "
      >
        <p className="text-xs font-bold uppercase tracking-wider text-red-700">
          {org.organization_type.replaceAll("_", " ")}
        </p>

        <h3 className="mt-2 text-xl font-black transition-colors group-hover:text-scoreboard-amber">
          {org.name}
        </h3>

        <p className="mt-1 text-sm text-slate-500">
          {[org.city, org.state].filter(Boolean).join(", ") ||
            "Location not set"}
        </p>

        <div className="mt-4 flex items-center justify-between">
          <p className="text-xs text-slate-400">
            /org/{org.slug}
          </p>

          <span className="text-xs font-bold uppercase tracking-wider">
            Open →
          </span>
        </div>
      </article>
    </Link>
  ))}
</div>
      </section>
    </main>
  )
}
