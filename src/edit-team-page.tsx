import { FormEvent, useEffect, useState } from "react"
import { ArrowLeft, Save, Settings } from "lucide-react"
import { Link, useNavigate, useParams } from "react-router-dom"

import { Button } from "@/components/ui/button"
import { supabase } from "@/lib/supabase"

type Team = {
  id: string
  organization_id: string
  name: string
  slug: string | null
  age_group: string | null
  classification: string | null
  season_year: number | null
  city: string | null
  state: string | null
  status: string
}

const AGE_GROUPS = [
  "6U", "7U", "8U", "9U", "10U", "11U", "12U",
  "13U", "14U", "15U", "16U", "17U", "18U",
]

const CLASSIFICATIONS = [
  "Open", "A", "AA", "AAA", "Major", "Elite",
]

const TEAM_STATUSES = ["active", "inactive"]

function toSlug(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

export function EditTeamPage() {
  const { organizationId, teamId } = useParams()
  const navigate = useNavigate()

  const [team, setTeam] = useState<Team | null>(null)
  const [name, setName] = useState("")
  const [ageGroup, setAgeGroup] = useState("")
  const [classification, setClassification] = useState("")
  const [seasonYear, setSeasonYear] = useState("")
  const [city, setCity] = useState("")
  const [state, setState] = useState("")
  const [status, setStatus] = useState("active")
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    async function loadTeam() {
      if (!organizationId || !teamId) {
        setError("Missing organization or team ID.")
        setLoading(false)
        return
      }

      setLoading(true)
      setError("")

      const { data, error: teamError } = await supabase
        .from("teams")
        .select(`
          id,
          organization_id,
          name,
          slug,
          age_group,
          classification,
          season_year,
          city,
          state,
          status
        `)
        .eq("id", teamId)
        .eq("organization_id", organizationId)
        .maybeSingle()

      if (teamError) {
        setError(teamError.message)
        setLoading(false)
        return
      }

      if (!data) {
        setError("Team not found.")
        setLoading(false)
        return
      }

      const loadedTeam = data as Team
      setTeam(loadedTeam)
      setName(loadedTeam.name ?? "")
      setAgeGroup(loadedTeam.age_group ?? "")
      setClassification(loadedTeam.classification ?? "")
      setSeasonYear(loadedTeam.season_year ? String(loadedTeam.season_year) : "")
      setCity(loadedTeam.city ?? "")
      setState(loadedTeam.state ?? "")
      setStatus(loadedTeam.status ?? "active")
      setLoading(false)
    }

    void loadTeam()
  }, [organizationId, teamId])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!organizationId || !teamId) return

    if (!name.trim()) {
      setError("Team name is required.")
      return
    }

    if (!ageGroup) {
      setError("Select an age division.")
      return
    }

    const parsedSeasonYear = seasonYear ? Number(seasonYear) : null

    if (
      parsedSeasonYear !== null &&
      (!Number.isInteger(parsedSeasonYear) ||
        parsedSeasonYear < 2000 ||
        parsedSeasonYear > 2100)
    ) {
      setError("Enter a valid season year.")
      return
    }

    setSaving(true)
    setError("")

    const { data, error: updateError } = await supabase
      .from("teams")
      .update({
        name: name.trim(),
        slug: toSlug(name),
        age_group: ageGroup,
        classification: classification || null,
        season_year: parsedSeasonYear,
        city: city.trim() || null,
        state: state.trim().toUpperCase() || null,
        status,
        updated_at: new Date().toISOString(),
      })
      .eq("id", teamId)
      .eq("organization_id", organizationId)
      .select(`
        id,
        organization_id,
        name,
        slug,
        age_group,
        classification,
        season_year,
        city,
        state,
        status
      `)
      .maybeSingle()

    if (updateError) {
      setSaving(false)
      setError(updateError.message)
      return
    }

    if (!data) {
      setSaving(false)
      setError("Team was not updated. Check your permissions.")
      return
    }

    navigate(
      `/dashboard/organizations/${organizationId}/teams/${teamId}`,
      { replace: true }
    )
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-scoreboard-dark px-6 py-12 text-scoreboard-cream">
        <div className="mx-auto max-w-4xl">
          <p className="scoreboard-label">Loading Team Settings...</p>
        </div>
      </main>
    )
  }

  if (error && !team) {
    return (
      <main className="min-h-screen bg-scoreboard-dark px-6 py-12 text-scoreboard-cream">
        <div className="mx-auto max-w-4xl">
          <div className="border border-scoreboard-red/60 bg-scoreboard-green p-6">
            <p className="scoreboard-label text-scoreboard-amber">
              Unable To Load Team
            </p>
            <p className="mt-3 text-sm text-scoreboard-muted">{error}</p>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-scoreboard-dark text-scoreboard-cream">
      <section className="border-b border-scoreboard-cream/20 bg-scoreboard-green">
        <div className="mx-auto max-w-4xl px-6 py-10">
          <Link
            to={`/dashboard/organizations/${organizationId}/teams/${teamId}`}
            className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.14em] text-scoreboard-muted hover:text-scoreboard-amber"
          >
            <ArrowLeft className="h-4 w-4" />
            Team Dashboard
          </Link>

          <div className="mt-8 flex items-center gap-3">
            <Settings className="h-6 w-6 text-scoreboard-amber" />
            <p className="scoreboard-label text-scoreboard-amber">
              Team Administration
            </p>
          </div>

          <h1 className="mt-3 text-4xl font-black uppercase tracking-[0.06em]">
            Team Settings
          </h1>

          <p className="mt-3 text-sm text-scoreboard-muted">
            Update team division, season, classification, location and status.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-6 py-10">
        <form onSubmit={handleSubmit} className="scoreboard-panel p-4">
          <div className="space-y-7 border border-scoreboard-cream/30 bg-scoreboard-green p-6 sm:p-8">
            <div>
              <p className="scoreboard-label text-scoreboard-amber">Team</p>
              <h2 className="mt-2 text-xl font-black uppercase tracking-[0.06em]">
                Identity
              </h2>

              <div className="mt-5 grid gap-5 sm:grid-cols-2">
                <TeamInput
                  label="Team Name"
                  value={name}
                  onChange={setName}
                  required
                />

                <label>
                  <span className="scoreboard-label text-scoreboard-cream">
                    Status
                  </span>
                  <select
                    value={status}
                    onChange={(event) => setStatus(event.target.value)}
                    className="mt-2 w-full rounded-none border border-scoreboard-cream/30 bg-scoreboard-cream px-3 py-3 text-base text-scoreboard-dark"
                  >
                    {TEAM_STATUSES.map((value) => (
                      <option key={value} value={value}>
                        {value.toUpperCase()}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            </div>

            <div className="border-t border-scoreboard-cream/20 pt-7">
              <p className="scoreboard-label text-scoreboard-amber">
                Competition
              </p>
              <h2 className="mt-2 text-xl font-black uppercase tracking-[0.06em]">
                Division & Season
              </h2>

              <div className="mt-5 grid gap-5 sm:grid-cols-3">
                <label>
                  <span className="scoreboard-label text-scoreboard-cream">
                    Age Division
                  </span>
                  <select
                    value={ageGroup}
                    onChange={(event) => setAgeGroup(event.target.value)}
                    className="mt-2 w-full rounded-none border border-scoreboard-cream/30 bg-scoreboard-cream px-3 py-3 text-base text-scoreboard-dark"
                  >
                    <option value="">Select Division</option>
                    {AGE_GROUPS.map((value) => (
                      <option key={value} value={value}>
                        {value}
                      </option>
                    ))}
                  </select>
                </label>

                <label>
                  <span className="scoreboard-label text-scoreboard-cream">
                    Classification
                  </span>
                  <select
                    value={classification}
                    onChange={(event) => setClassification(event.target.value)}
                    className="mt-2 w-full rounded-none border border-scoreboard-cream/30 bg-scoreboard-cream px-3 py-3 text-base text-scoreboard-dark"
                  >
                    <option value="">Not Set</option>
                    {CLASSIFICATIONS.map((value) => (
                      <option key={value} value={value}>
                        {value}
                      </option>
                    ))}
                  </select>
                </label>

                <TeamInput
                  label="Season Year"
                  type="number"
                  value={seasonYear}
                  onChange={setSeasonYear}
                />
              </div>

              <div className="mt-4 border border-scoreboard-amber/25 bg-scoreboard-dark p-4">
                <p className="text-xs leading-6 text-scoreboard-muted">
                  The age division and season year determine roster eligibility.
                  League age is calculated using the player's age on April 30 of
                  the season year.
                </p>
              </div>
            </div>

            <div className="border-t border-scoreboard-cream/20 pt-7">
              <p className="scoreboard-label text-scoreboard-amber">Home</p>
              <h2 className="mt-2 text-xl font-black uppercase tracking-[0.06em]">
                Team Location
              </h2>

              <div className="mt-5 grid gap-5 sm:grid-cols-[1fr_160px]">
                <TeamInput label="City" value={city} onChange={setCity} />
                <TeamInput
                  label="State"
                  value={state}
                  onChange={(value) => setState(value.toUpperCase())}
                />
              </div>
            </div>

            {error && (
              <div className="border border-scoreboard-red/60 bg-scoreboard-dark p-4">
                <p className="text-sm text-scoreboard-muted">{error}</p>
              </div>
            )}

            <Button
              type="submit"
              disabled={saving}
              className="w-full rounded-none bg-scoreboard-cream py-5 font-black uppercase tracking-[0.14em] text-scoreboard-dark hover:bg-scoreboard-amber disabled:opacity-50"
            >
              <Save className="mr-2 h-4 w-4" />
              {saving ? "Saving Team..." : "Save Team Settings"}
            </Button>
          </div>
        </form>
      </section>
    </main>
  )
}

function TeamInput({
  label,
  value,
  onChange,
  required = false,
  type = "text",
}: {
  label: string
  value: string
  onChange: (value: string) => void
  required?: boolean
  type?: string
}) {
  return (
    <label>
      <span className="scoreboard-label text-scoreboard-cream">{label}</span>
      <input
        type={type}
        value={value}
        required={required}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 w-full rounded-none border border-scoreboard-cream/30 bg-scoreboard-cream px-3 py-3 text-base text-scoreboard-dark outline-none focus:border-scoreboard-amber"
      />
    </label>
  )
}
