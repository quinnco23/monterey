


import { useState } from "react"
import { ArrowLeft } from "lucide-react"
import { Link, useNavigate, useParams } from "react-router-dom"

import { Button } from "@/components/ui/button"
import { supabase } from "@/lib/supabase"

export function AddPlayerPage() {
  const { organizationId, teamId } = useParams()
  const navigate = useNavigate()

  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [jerseyNumber, setJerseyNumber] = useState("")
  const [primaryPosition, setPrimaryPosition] = useState("")
  const [secondaryPosition, setSecondaryPosition] = useState("")
const [age, setAge] = useState("")

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!teamId || !organizationId) {
      setError("Missing team or organization.")
      return
    }

    setLoading(true)
    setError("")

    const { data: player, error: playerError } = await supabase
      .from("players")
      .insert({
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        age: age ? Number(age) : null,
      })
      .select()
      .single()

    if (playerError) {
      setError(playerError.message)
      setLoading(false)
      return
    }

    const { error: rosterError } = await supabase
      .from("team_roster_members")
      .insert({
        team_id: teamId,
        player_id: player.id,
        jersey_number: jerseyNumber || null,
        primary_position: primaryPosition || null,
        secondary_position: secondaryPosition || null,
        roster_status: "active",
      })

    if (rosterError) {
      setError(rosterError.message)
      setLoading(false)
      return
    }

    navigate(
      `/dashboard/organizations/${organizationId}/teams/${teamId}`
    )
  }

  return (
    <main className="min-h-screen bg-scoreboard-dark text-scoreboard-cream">
      <section className="border-b border-scoreboard-cream/20 bg-scoreboard-green">
        <div className="mx-auto max-w-4xl px-6 py-10">

          <Link
            to={`/dashboard/organizations/${organizationId}/teams/${teamId}`}
            className="
              inline-flex
              items-center
              gap-2
              text-xs
              font-black
              uppercase
              tracking-[0.14em]
              text-scoreboard-muted
              transition-colors
              hover:text-scoreboard-amber
            "
          >
            <ArrowLeft className="h-4 w-4" />
            Team Dashboard
          </Link>

          <p className="scoreboard-label mt-8 text-scoreboard-amber">
            Roster
          </p>

          <h1 className="mt-3 text-4xl font-black uppercase tracking-[0.06em]">
            Add Player
          </h1>

          <p className="mt-3 text-sm text-scoreboard-muted">
            Add a player to this team's active roster.
          </p>

        </div>
      </section>

      <section className="mx-auto max-w-4xl px-6 py-10">

        <div className="scoreboard-panel p-4">

          <form
            onSubmit={handleSubmit}
            className="
              border
              border-scoreboard-cream/30
              bg-scoreboard-green
              p-6
              sm:p-8
            "
          >

            <div className="grid gap-5 sm:grid-cols-2">

              <PlayerInput
                label="First Name"
                value={firstName}
                onChange={setFirstName}
                required
              />

              <PlayerInput
                label="Last Name"
                value={lastName}
                onChange={setLastName}
                required
              />

              <PlayerInput
                label="Jersey Number"
                value={jerseyNumber}
                onChange={setJerseyNumber}
              />

             <PlayerInput
  label="Age"
  value={age}
  onChange={setAge}
  type="number"
/>

              <label>
                <span className="scoreboard-label text-scoreboard-cream">
                  Primary Position
                </span>

                <select
                  value={primaryPosition}
                  onChange={(e) => setPrimaryPosition(e.target.value)}
                  className="
                    mt-2
                    w-full
                    rounded-none
                    border
                    border-scoreboard-cream/30
                    bg-scoreboard-cream
                    px-3
                    py-3
                    text-scoreboard-dark
                    outline-none
                    focus:border-scoreboard-amber
                  "
                >
                  <option value="">Select position</option>
                  <option value="P">Pitcher</option>
                  <option value="C">Catcher</option>
                  <option value="1B">First Base</option>
                  <option value="2B">Second Base</option>
                  <option value="3B">Third Base</option>
                  <option value="SS">Shortstop</option>
                  <option value="LF">Left Field</option>
                  <option value="CF">Center Field</option>
                  <option value="RF">Right Field</option>
                  <option value="UTIL">Utility</option>
                </select>
              </label>

              <label>
                <span className="scoreboard-label text-scoreboard-cream">
                  Secondary Position
                </span>

                <select
                  value={secondaryPosition}
                  onChange={(e) => setSecondaryPosition(e.target.value)}
                  className="
                    mt-2
                    w-full
                    rounded-none
                    border
                    border-scoreboard-cream/30
                    bg-scoreboard-cream
                    px-3
                    py-3
                    text-scoreboard-dark
                    outline-none
                    focus:border-scoreboard-amber
                  "
                >
                  <option value="">None</option>
                  <option value="P">Pitcher</option>
                  <option value="C">Catcher</option>
                  <option value="1B">First Base</option>
                  <option value="2B">Second Base</option>
                  <option value="3B">Third Base</option>
                  <option value="SS">Shortstop</option>
                  <option value="LF">Left Field</option>
                  <option value="CF">Center Field</option>
                  <option value="RF">Right Field</option>
                  <option value="UTIL">Utility</option>
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

            <Button
              type="submit"
              disabled={loading}
              className="
                mt-7
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
            >
              {loading ? "Adding Player..." : "Add To Roster"}
            </Button>

          </form>

        </div>

      </section>
    </main>
  )
}

function PlayerInput({
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
      <span className="scoreboard-label text-scoreboard-cream">
        {label}
      </span>

      <input
        type={type}
        value={value}
        required={required}
        onChange={(e) => onChange(e.target.value)}
        className="
          mt-2
          w-full
          rounded-none
          border
          border-scoreboard-cream/30
          bg-scoreboard-cream
          px-3
          py-3
          text-scoreboard-dark
          outline-none
          focus:border-scoreboard-amber
        "
      />
    </label>
  )
}