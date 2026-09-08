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
  <main className="min-h-[calc(100vh-73px)] bg-scoreboard-dark px-6 py-12 text-scoreboard-cream">
    <div className="mx-auto w-full max-w-2xl">

      {/* PAGE HEADER */}

      <div className="mb-8 border-l-4 border-scoreboard-amber pl-5">
        <p className="scoreboard-label text-scoreboard-amber">
          Organization Setup
        </p>

        <h1 className="mt-3 text-3xl font-black uppercase leading-tight tracking-[0.05em] sm:text-4xl">
          Create Your Organization
        </h1>

        <p className="mt-3 max-w-xl text-sm leading-6 text-scoreboard-muted">
          This becomes the home for your teams, staff,
          tournament registrations, schedules, and league tools.
        </p>
      </div>

      {/* SCOREBOARD FRAME */}

      <div className="scoreboard-panel p-4">
        <div className="border border-scoreboard-cream/35 bg-scoreboard-green">

          {/* PANEL HEADER */}

          <div className="flex items-center justify-between border-b border-scoreboard-cream/25 px-6 py-4">
            <div>
              <p className="scoreboard-label text-scoreboard-amber">
                New Organization
              </p>

              <p className="mt-1 text-xs uppercase tracking-[0.12em] text-scoreboard-muted">
                Organization Profile
              </p>
            </div>

            <div className="text-right">
              <p className="scoreboard-number text-2xl text-scoreboard-amber">
                01
              </p>

              <p className="scoreboard-label text-[9px]">
                Setup
              </p>
            </div>
          </div>

          <form
            onSubmit={handleSubmit}
            className="space-y-6 p-6 sm:p-8"
          >

            {/* ORGANIZATION NAME */}

            <label className="block">
              <span className="scoreboard-label text-scoreboard-cream">
                Organization Name
              </span>

              <input
                className="
                  mt-2
                  w-full
                  rounded-none
                  border
                  border-scoreboard-cream/30
                  bg-scoreboard-cream
                  px-3
                  py-3
                  text-base
                  text-scoreboard-dark
                  outline-none
                  transition
                  placeholder:text-scoreboard-dark/40
                  focus:border-scoreboard-amber
                "
                value={name}
                onChange={(e) => {
                  setName(e.target.value)

                  if (!slug) {
                    setSlug(toSlug(e.target.value))
                  }
                }}
                placeholder="Name"
                required
                minLength={2}
              />
            </label>

            {/* PUBLIC URL */}

            <label className="block">
              <span className="scoreboard-label text-scoreboard-cream">
                Public URL
              </span>

              <div
                className="
                  mt-2
                  flex
                  items-center
                  border
                  border-scoreboard-cream/30
                  bg-scoreboard-cream
                  focus-within:border-scoreboard-amber
                "
              >
                <span
                  className="
                    border-r
                    border-scoreboard-dark/20
                    px-3
                    py-3
                    text-xs
                    font-black
                    uppercase
                    tracking-[0.08em]
                    text-scoreboard-dark/50
                  "
                >
                  /org/
                </span>

                <input
                  className="
                    min-w-0
                    flex-1
                    bg-transparent
                    px-3
                    py-3
                    text-base
                    text-scoreboard-dark
                    outline-none
                    placeholder:text-scoreboard-dark/40
                  "
                  value={slug}
                  onChange={(e) =>
                    setSlug(toSlug(e.target.value))
                  }
                  placeholder="santa-cruz-ballers"
                  required
                />
              </div>

              <p className="mt-2 text-xs leading-5 text-scoreboard-muted">
                This will become your organization's public
                address.
              </p>
            </label>

            {/* ORGANIZATION TYPE */}

            <label className="block">
              <span className="scoreboard-label text-scoreboard-cream">
                Organization Type
              </span>

              <select
                className="
                  mt-2
                  w-full
                  rounded-none
                  border
                  border-scoreboard-cream/30
                  bg-scoreboard-cream
                  px-3
                  py-3
                  text-base
                  text-scoreboard-dark
                  outline-none
                  focus:border-scoreboard-amber
                "
                value={organizationType}
                onChange={(e) =>
                  setOrganizationType(
                    e.target.value as OrganizationType
                  )
                }
              >
                <option value="travel_club">
                  Travel Baseball Club
                </option>

                <option value="league">
                  League
                </option>

                <option value="tournament_operator">
                  Tournament Operator
                </option>

                <option value="training_facility">
                  Training Facility
                </option>
              </select>
            </label>

            {/* LOCATION */}

            <div className="border-t border-scoreboard-cream/20 pt-6">

              <p className="scoreboard-label text-scoreboard-amber">
                Home Location
              </p>

              <div className="mt-4 grid gap-4 sm:grid-cols-[1fr_120px]">

                <label className="block">
                  <span className="scoreboard-label text-scoreboard-cream">
                    City
                  </span>

                  <input
                    className="
                      mt-2
                      w-full
                      rounded-none
                      border
                      border-scoreboard-cream/30
                      bg-scoreboard-cream
                      px-3
                      py-3
                      text-base
                      text-scoreboard-dark
                      outline-none
                      placeholder:text-scoreboard-dark/40
                      focus:border-scoreboard-amber
                    "
                    value={city}
                    onChange={(e) =>
                      setCity(e.target.value)
                    }
                    placeholder="Santa Cruz"
                  />
                </label>

                <label className="block">
                  <span className="scoreboard-label text-scoreboard-cream">
                    State
                  </span>

                  <input
                    className="
                      mt-2
                      w-full
                      rounded-none
                      border
                      border-scoreboard-cream/30
                      bg-scoreboard-cream
                      px-3
                      py-3
                      text-base
                      uppercase
                      text-scoreboard-dark
                      outline-none
                      placeholder:text-scoreboard-dark/40
                      focus:border-scoreboard-amber
                    "
                    value={state}
                    onChange={(e) =>
                      setState(
                        e.target.value.toUpperCase()
                      )
                    }
                    maxLength={2}
                    placeholder="CA"
                  />
                </label>

              </div>
            </div>

            {/* ERROR */}

            {error && (
              <div
                className="
                  border
                  border-scoreboard-red
                  bg-scoreboard-dark
                  px-4
                  py-3
                "
              >
                <p className="scoreboard-label text-scoreboard-red">
                  Unable To Create Organization
                </p>

                <p className="mt-2 text-sm text-scoreboard-muted">
                  {error}
                </p>
              </div>
            )}

            {/* SUBMIT */}

            <div className="border-t border-scoreboard-cream/20 pt-6">

              <Button
                className="
                  w-full
                  rounded-none
                  border
                  border-scoreboard-cream
                  bg-scoreboard-cream
                  py-5
                  font-black
                  uppercase
                  tracking-[0.14em]
                  text-scoreboard-dark
                  hover:bg-scoreboard-amber
                  hover:text-scoreboard-dark
                "
                disabled={loading}
              >
                {loading
                  ? "Creating Organization..."
                  : "Create Organization"}
              </Button>

              <p className="mt-4 text-center text-[10px] font-bold uppercase tracking-[0.12em] text-scoreboard-muted">
                You can add teams and staff next
              </p>

            </div>

          </form>
        </div>
      </div>
    </div>
  </main>
)
}
