import { useEffect, useState } from "react"
import { Link, useParams } from "react-router-dom"
import { Settings } from "lucide-react"

import { supabase } from "@/lib/supabase"

type Organization = {
  id: string
  name: string
  slug: string
  organization_type: string | null
  city: string | null
  state: string | null
}

export function OrganizationSettingsPage() {
  const { organizationId } = useParams()

  const [organization, setOrganization] =
    useState<Organization | null>(null)

  const [name, setName] = useState("")
  const [slug, setSlug] = useState("")
  const [organizationType, setOrganizationType] = useState("")
  const [city, setCity] = useState("")
  const [state, setState] = useState("")

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState("")

  useEffect(() => {
    async function loadOrganization() {
      if (!organizationId) return

      setLoading(true)

      const { data, error } = await supabase
        .from("organizations")
        .select(`
          id,
          name,
          slug,
          organization_type,
          city,
          state
        `)
        .eq("id", organizationId)
        .single()

      if (error) {
        console.error("Unable to load organization:", error)
        setLoading(false)
        return
      }

      setOrganization(data)
      setName(data.name ?? "")
      setSlug(data.slug ?? "")
      setOrganizationType(data.organization_type ?? "")
      setCity(data.city ?? "")
      setState(data.state ?? "")

      setLoading(false)
    }

    void loadOrganization()
  }, [organizationId])

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()

    if (!organizationId) return

    setSaving(true)
    setMessage("")

    const { error } = await supabase
      .from("organizations")
      .update({
        name: name.trim(),
        slug: slug.trim(),
        organization_type: organizationType || null,
        city: city.trim() || null,
        state: state.trim() || null,
      })
      .eq("id", organizationId)

    if (error) {
      console.error("Unable to update organization:", error)
      setMessage("Unable to save changes.")
    } else {
      setMessage("Organization updated.")
    }

    setSaving(false)
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-10">
        Loading organization...
      </div>
    )
  }

  if (!organization) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-10">
        Organization not found.
      </div>
    )
  }

  return (
    <main className="mx-auto max-w-5xl px-4 py-8">

      <Link
        to={`/dashboard/organizations/${organizationId}`}
        className="scoreboard-label text-scoreboard-amber"
      >
        ← Organization Dashboard
      </Link>

      <header className="mt-6 border-b border-scoreboard-cream/20 pb-6">
        <div className="flex items-center gap-3">
          <Settings className="h-5 w-5 text-scoreboard-amber" />

          <div>
            <p className="scoreboard-label text-scoreboard-amber">
              Organization
            </p>

            <h1 className="scoreboard-title mt-1 text-3xl">
              Settings
            </h1>
          </div>
        </div>
      </header>

      <form
        onSubmit={handleSave}
        className="scoreboard-panel mt-8 p-6"
      >
        <div className="grid gap-6 md:grid-cols-2">

          <label className="block">
            <span className="scoreboard-label">
              Organization Name
            </span>

            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-2 w-full border border-scoreboard-cream/30 bg-scoreboard-cream px-3 py-3 text-slate-900"
              required
            />
          </label>

          <label className="block">
            <span className="scoreboard-label">
              Organization Type
            </span>

            <input
              value={organizationType}
              onChange={(e) =>
                setOrganizationType(e.target.value)
              }
              className="mt-2 w-full border border-scoreboard-cream/30 bg-scoreboard-cream px-3 py-3 text-slate-900"
            />
          </label>

          <label className="block">
            <span className="scoreboard-label">
              City
            </span>

            <input
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="mt-2 w-full border border-scoreboard-cream/30 bg-scoreboard-cream px-3 py-3 text-slate-900"
            />
          </label>

          <label className="block">
            <span className="scoreboard-label">
              State
            </span>

            <input
              value={state}
              onChange={(e) => setState(e.target.value)}
              className="mt-2 w-full border border-scoreboard-cream/30 bg-scoreboard-cream px-3 py-3 text-slate-900"
            />
          </label>

          <label className="block md:col-span-2">
            <span className="scoreboard-label">
              Public Slug
            </span>

            <input
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              className="mt-2 w-full border border-scoreboard-cream/30 bg-scoreboard-cream px-3 py-3 text-slate-900"
            />

            <p className="mt-2 text-xs opacity-60">
              Future public URL: /organizations/{slug || "your-organization"}
            </p>
          </label>

        </div>

        <div className="mt-8 flex items-center gap-4 border-t border-scoreboard-cream/20 pt-6">

          <button
            type="submit"
            disabled={saving}
            className="bg-scoreboard-amber px-5 py-3 text-xs font-black uppercase tracking-[0.12em] text-scoreboard-dark disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>

          {message && (
            <span className="text-sm text-scoreboard-cream">
              {message}
            </span>
          )}

        </div>
      </form>

    </main>
  )
}