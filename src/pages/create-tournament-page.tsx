import { useState } from "react"
import {
  ArrowLeft,
  CalendarDays,
  Save,
  Trophy,
} from "lucide-react"
import { Link, useNavigate } from "react-router-dom"

import { Button } from "@/components/ui/button"
import { supabase } from "@/lib/supabase"

export function CreateTournamentPage() {
  const navigate = useNavigate()

  const [name, setName] = useState("")
  const [slug, setSlug] = useState("")
  const [description, setDescription] = useState("")
  const [city, setCity] = useState("Santa Cruz")
  const [state, setState] = useState("CA")

  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")

  const [status, setStatus] = useState("draft")

  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  function handleNameChange(value: string) {
    setName(value)

    if (!slug) {
      setSlug(
        value
          .toLowerCase()
          .trim()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-|-$/g, "")
      )
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!name.trim()) {
      setError("Tournament name is required.")
      return
    }

    if (!slug.trim()) {
      setError("Tournament slug is required.")
      return
    }

    if (!startDate || !endDate) {
      setError("Start and end dates are required.")
      return
    }

    if (endDate < startDate) {
      setError("End date must be on or after the start date.")
      return
    }

    setSaving(true)
    setError("")

    const { data, error } = await supabase
      .from("tournaments")
      .insert({
        name: name.trim(),
        slug: slug.trim(),
        description: description.trim() || null,
        city: city.trim() || null,
        state: state.trim() || null,
        start_date: startDate,
        end_date: endDate,
        status,
      })
      .select(`
        id,
        name,
        slug
      `)
      .single()

    if (error) {
      setError(error.message)
      setSaving(false)
      return
    }

    navigate(`/admin/tournaments/${data.id}`)
  }

  return (
    <main className="min-h-screen bg-scoreboard-dark text-scoreboard-cream">

      <section className="border-b border-scoreboard-cream/20 bg-scoreboard-green">
        <div className="mx-auto max-w-5xl px-6 py-10">

          <Link
            to="/admin/tournaments"
            className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.14em] text-scoreboard-muted hover:text-scoreboard-amber"
          >
            <ArrowLeft className="h-4 w-4" />
            Admin Tournaments
          </Link>

          <div className="mt-8 flex items-start gap-4">

            <Trophy className="mt-1 h-7 w-7 text-scoreboard-amber" />

            <div>
              <p className="scoreboard-label text-scoreboard-amber">
                Tournament Admin
              </p>

              <h1 className="mt-2 text-4xl font-black uppercase tracking-[0.06em] sm:text-5xl">
                Create Tournament
              </h1>

              <p className="mt-4 max-w-2xl text-sm leading-7 text-scoreboard-muted">
                Create the tournament first. Divisions, teams, fields,
                registrations, and games can be added after setup.
              </p>
            </div>

          </div>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-6 py-10">

        <form
          onSubmit={handleSubmit}
          className="border border-scoreboard-cream/25 bg-scoreboard-green p-6 sm:p-8"
        >

          <p className="scoreboard-label text-scoreboard-amber">
            Tournament Information
          </p>

          <div className="mt-6 grid gap-5">

            <label className="block">
              <span className="scoreboard-label text-scoreboard-cream">
                Tournament Name
              </span>

              <input
                value={name}
                onChange={(e) =>
                  handleNameChange(e.target.value)
                }
                placeholder="Santa Cruz Invitational"
                required
                className="mt-2 w-full rounded-none border border-scoreboard-cream/30 bg-scoreboard-cream px-3 py-3 text-base text-scoreboard-dark"
              />
            </label>

            <label className="block">
              <span className="scoreboard-label text-scoreboard-cream">
                URL Slug
              </span>

              <input
                value={slug}
                onChange={(e) =>
                  setSlug(
                    e.target.value
                      .toLowerCase()
                      .replace(/[^a-z0-9-]/g, "")
                  )
                }
                placeholder="santa-cruz-invitational-2027"
                required
                className="mt-2 w-full rounded-none border border-scoreboard-cream/30 bg-scoreboard-cream px-3 py-3 text-base text-scoreboard-dark"
              />

              <p className="mt-2 text-xs text-scoreboard-muted">
                /tournaments/{slug || "tournament-slug"}
              </p>
            </label>

            <label className="block">
              <span className="scoreboard-label text-scoreboard-cream">
                Description
              </span>

              <textarea
                value={description}
                onChange={(e) =>
                  setDescription(e.target.value)
                }
                rows={5}
                placeholder="Tournament description..."
                className="mt-2 w-full rounded-none border border-scoreboard-cream/30 bg-scoreboard-cream px-3 py-3 text-base text-scoreboard-dark"
              />
            </label>

            <div className="grid gap-5 sm:grid-cols-2">

              <label className="block">
                <span className="scoreboard-label text-scoreboard-cream">
                  City
                </span>

                <input
                  value={city}
                  onChange={(e) =>
                    setCity(e.target.value)
                  }
                  className="mt-2 w-full rounded-none border border-scoreboard-cream/30 bg-scoreboard-cream px-3 py-3 text-base text-scoreboard-dark"
                />
              </label>

              <label className="block">
                <span className="scoreboard-label text-scoreboard-cream">
                  State
                </span>

                <input
                  value={state}
                  onChange={(e) =>
                    setState(e.target.value)
                  }
                  maxLength={2}
                  className="mt-2 w-full rounded-none border border-scoreboard-cream/30 bg-scoreboard-cream px-3 py-3 text-base uppercase text-scoreboard-dark"
                />
              </label>

            </div>

            <div className="grid gap-5 sm:grid-cols-2">

              <label className="block">
                <span className="scoreboard-label text-scoreboard-cream">
                  Start Date
                </span>

                <div className="relative mt-2">
                  <CalendarDays className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-scoreboard-dark/60" />

                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) =>
                      setStartDate(e.target.value)
                    }
                    required
                    className="w-full rounded-none border border-scoreboard-cream/30 bg-scoreboard-cream py-3 pl-10 pr-3 text-base text-scoreboard-dark"
                  />
                </div>
              </label>

              <label className="block">
                <span className="scoreboard-label text-scoreboard-cream">
                  End Date
                </span>

                <div className="relative mt-2">
                  <CalendarDays className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-scoreboard-dark/60" />

                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) =>
                      setEndDate(e.target.value)
                    }
                    required
                    className="w-full rounded-none border border-scoreboard-cream/30 bg-scoreboard-cream py-3 pl-10 pr-3 text-base text-scoreboard-dark"
                  />
                </div>
              </label>

            </div>

            <label className="block">
              <span className="scoreboard-label text-scoreboard-cream">
                Status
              </span>

              <select
                value={status}
                onChange={(e) =>
                  setStatus(e.target.value)
                }
                className="mt-2 w-full rounded-none border border-scoreboard-cream/30 bg-scoreboard-cream px-3 py-3 text-base text-scoreboard-dark"
              >
                <option value="draft">
                  Draft
                </option>

                <option value="registration_open">
                  Registration Open
                </option>

                <option value="registration_closed">
                  Registration Closed
                </option>

                <option value="scheduled">
                  Scheduled
                </option>
              </select>
            </label>

          </div>

          {error && (
            <div className="mt-6 border border-scoreboard-red/60 bg-scoreboard-dark p-4">
              <p className="text-sm text-scoreboard-muted">
                {error}
              </p>
            </div>
          )}

          <div className="mt-8 flex flex-wrap gap-3 border-t border-scoreboard-cream/20 pt-6">

            <Button
              type="submit"
              disabled={saving}
              className="
                rounded-none
                bg-scoreboard-cream
                px-6
                font-black
                uppercase
                tracking-[0.12em]
                text-scoreboard-dark
                hover:bg-scoreboard-amber
              "
            >
              <Save className="mr-2 h-4 w-4" />

              {saving
                ? "Creating..."
                : "Create Tournament"}
            </Button>

            <Link
              to="/admin/tournaments"
              className="
                inline-flex
                items-center
                border
                border-scoreboard-cream/30
                px-6
                py-3
                text-xs
                font-black
                uppercase
                tracking-[0.12em]
                text-scoreboard-cream
                hover:border-scoreboard-amber
              "
            >
              Cancel
            </Link>

          </div>

        </form>

      </section>

    </main>
  )
}