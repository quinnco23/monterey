import { FormEvent, useState } from "react"
import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { createOrganization, type OrganizationType } from "@/features/organizations/organization-service"

function toSlug(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

export function OnboardingPage() {
  const navigate = useNavigate()
  const [name, setName] = useState("")
  const [slug, setSlug] = useState("")
  const [organizationType, setOrganizationType] = useState<OrganizationType>("travel_club")
  const [city, setCity] = useState("")
  const [state, setState] = useState("CA")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError("")
    setLoading(true)

    try {
      await createOrganization({ name, slug: slug || toSlug(name), organizationType, city, state })
      navigate("/dashboard", { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to create organization")
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="mx-auto max-w-2xl px-6 py-12">
      <div className="mb-8">
        <p className="text-sm font-bold uppercase tracking-[0.2em] text-red-700">SCBC setup</p>
        <h1 className="mt-2 text-4xl font-black tracking-tight">Create your baseball organization</h1>
        <p className="mt-3 text-slate-600">This becomes the home for your teams, staff, tournament registrations, and future league tools.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 rounded-2xl border border-slate-200 bg-white p-7 shadow-sm">
        <label className="block text-sm font-semibold">Organization name
          <input className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2" value={name} onChange={(e) => { setName(e.target.value); if (!slug) setSlug(toSlug(e.target.value)) }} placeholder="Santa Cruz Waves" required minLength={2} />
        </label>

        <label className="block text-sm font-semibold">Public URL slug
          <div className="mt-2 flex items-center rounded-md border border-slate-300 bg-white px-3">
            <span className="text-sm text-slate-400">/org/</span>
            <input className="w-full px-1 py-2 outline-none" value={slug} onChange={(e) => setSlug(toSlug(e.target.value))} placeholder="santa-cruz-waves" required />
          </div>
        </label>

        <label className="block text-sm font-semibold">Organization type
          <select className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2" value={organizationType} onChange={(e) => setOrganizationType(e.target.value as OrganizationType)}>
            <option value="travel_club">Travel baseball club</option>
            <option value="league">League</option>
            <option value="tournament_operator">Tournament operator</option>
            <option value="training_facility">Training facility</option>
          </select>
        </label>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-sm font-semibold">City
            <input className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2" value={city} onChange={(e) => setCity(e.target.value)} placeholder="Santa Cruz" />
          </label>
          <label className="block text-sm font-semibold">State
            <input className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2" value={state} onChange={(e) => setState(e.target.value.toUpperCase())} maxLength={2} placeholder="CA" />
          </label>
        </div>

        {error && <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
        <Button className="w-full" disabled={loading}>{loading ? "Creating organization..." : "Create organization"}</Button>
      </form>
    </main>
  )
}
