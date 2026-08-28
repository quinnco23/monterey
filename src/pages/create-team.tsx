import { useState } from "react"
import { useNavigate, useParams } from "react-router-dom"

import { Button } from "@/components/ui/button"
import { supabase } from "@/lib/supabase"

export function CreateTeamPage() {
  const { organizationId } = useParams()
  const navigate = useNavigate()

  const [name, setName] = useState("")
  const [ageGroup, setAgeGroup] = useState("10U")
  const [classification, setClassification] = useState("AAA")
  const [seasonYear, setSeasonYear] = useState(2027)
  const [city, setCity] = useState("Santa Cruz")
  const [state, setState] = useState("CA")

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!organizationId) return

    setLoading(true)
    setError("")

    const slug = name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")

    const { data, error } = await supabase
      .from("teams")
      .insert({
        organization_id: organizationId,
        name,
        slug,
        age_group: ageGroup,
        classification: classification.toLowerCase(),
        season_year: seasonYear,
        city,
        state,
        status: "active",
      })
      .select()
      .single()

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    navigate(
      `/dashboard/organizations/${organizationId}/teams/${data.id}`
    )
  }

  return (
    <main className="min-h-screen bg-scoreboard-dark text-scoreboard-cream">
      <section className="border-b border-scoreboard-cream/20 bg-scoreboard-green">
        <div className="mx-auto max-w-4xl px-6 py-12">
          <p className="scoreboard-label text-scoreboard-amber">
            Team Setup
          </p>

          <h1 className="mt-3 text-4xl font-black uppercase tracking-[0.06em]">
            Create Team
          </h1>

          <p className="mt-3 text-sm text-scoreboard-muted">
            Add a team to your organization.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-6 py-10">
        <div className="scoreboard-panel p-4">
          <form
            onSubmit={handleSubmit}
            className="border border-scoreboard-cream/30 bg-scoreboard-green p-6 sm:p-8"
          >
            <div className="grid gap-5 sm:grid-cols-2">
              <label className="sm:col-span-2">
                <span className="scoreboard-label text-scoreboard-cream">
                  Team Name
                </span>

                <input
                  className="mt-2 w-full rounded-none border border-scoreboard-cream/30 bg-scoreboard-cream px-3 py-3 text-scoreboard-dark outline-none focus:border-scoreboard-amber"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="SC Waves"
                  required
                />
              </label>

              <label>
                <span className="scoreboard-label text-scoreboard-cream">
                  Age Group
                </span>

                <select
                  className="mt-2 w-full rounded-none border border-scoreboard-cream/30 bg-scoreboard-cream px-3 py-3 text-scoreboard-dark"
                  value={ageGroup}
                  onChange={(e) => setAgeGroup(e.target.value)}
                >
                  {[
                    "8U",
                    "9U",
                    "10U",
                    "11U",
                    "12U",
                    "13U",
                    "14U",
                  ].map((age) => (
                    <option key={age}>{age}</option>
                  ))}
                </select>
              </label>

              <label>
                <span className="scoreboard-label text-scoreboard-cream">
                  Classification
                </span>

                <select
                  className="mt-2 w-full rounded-none border border-scoreboard-cream/30 bg-scoreboard-cream px-3 py-3 text-scoreboard-dark"
                  value={classification}
                  onChange={(e) => setClassification(e.target.value)}
                >
                  <option>Open</option>
                  <option>Major</option>
                  <option>AAA</option>
                  <option>AA</option>
                  <option>A</option>
                </select>
              </label>

              <label>
                <span className="scoreboard-label text-scoreboard-cream">
                  Season
                </span>

                <input
                  type="number"
                  className="mt-2 w-full rounded-none border border-scoreboard-cream/30 bg-scoreboard-cream px-3 py-3 text-scoreboard-dark"
                  value={seasonYear}
                  onChange={(e) => setSeasonYear(Number(e.target.value))}
                />
              </label>

              <label>
                <span className="scoreboard-label text-scoreboard-cream">
                  City
                </span>

                <input
                  className="mt-2 w-full rounded-none border border-scoreboard-cream/30 bg-scoreboard-cream px-3 py-3 text-scoreboard-dark"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                />
              </label>

              <label>
                <span className="scoreboard-label text-scoreboard-cream">
                  State
                </span>

                <input
                  className="mt-2 w-full rounded-none border border-scoreboard-cream/30 bg-scoreboard-cream px-3 py-3 text-scoreboard-dark"
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                />
              </label>
            </div>

            {error && (
              <div className="mt-5 border border-scoreboard-red/50 bg-scoreboard-dark p-4 text-sm text-scoreboard-muted">
                {error}
              </div>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="mt-7 w-full rounded-none border border-scoreboard-cream bg-scoreboard-cream font-black uppercase tracking-[0.14em] text-scoreboard-dark hover:bg-scoreboard-amber"
            >
              {loading ? "Creating..." : "Create Team"}
            </Button>
          </form>
        </div>
      </section>
    </main>
  )
}