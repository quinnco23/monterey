import { useEffect, useState } from "react"
import { ArrowLeft, Save } from "lucide-react"
import {
  Link,
  useNavigate,
  useParams,
} from "react-router-dom"

import { Button } from "@/components/ui/button"
import { supabase } from "@/lib/supabase"

export function EditPlayerPage() {
  const {
    organizationId,
    teamId,
    playerId,
  } = useParams()

  const navigate = useNavigate()

  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [graduationYear, setGraduationYear] = useState("")

  const [jerseyNumber, setJerseyNumber] = useState("")
  const [primaryPosition, setPrimaryPosition] = useState("")
  const [secondaryPosition, setSecondaryPosition] = useState("")

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    async function loadPlayer() {
      if (!organizationId || !teamId || !playerId) {
        setError("Missing organization, team, or player ID.")
        setLoading(false)
        return
      }
  
      // Load the main player record
      const { data: playerData, error: playerError } =
        await supabase
          .from("players")
          .select(`
            id,
            organization_id,
            first_name,
            last_name,
            graduation_year
          `)
          .eq("id", playerId)
          .eq("organization_id", organizationId)
          .maybeSingle()
  
      if (playerError) {
        setError(playerError.message)
        setLoading(false)
        return
      }
  
      if (!playerData) {
        setError("Player not found.")
        setLoading(false)
        return
      }
  
      // Load this player's team roster information
      const { data: rosterData, error: rosterError } =
        await supabase
          .from("team_players")
          .select(`
            id,
            jersey_number,
            primary_position,
            secondary_position,
            roster_status,
            active
          `)
          .eq("team_id", teamId)
          .eq("player_id", playerId)
          .eq("active", true)
          .maybeSingle()
  
      if (rosterError) {
        setError(rosterError.message)
        setLoading(false)
        return
      }
  
      if (!rosterData) {
        setError("This player is not currently on this team's roster.")
        setLoading(false)
        return
      }
  
      // Populate the form
      setFirstName(playerData.first_name ?? "")
      setLastName(playerData.last_name ?? "")
  
      setGraduationYear(
        playerData.graduation_year
          ? String(playerData.graduation_year)
          : ""
      )
  
      setJerseyNumber(rosterData.jersey_number ?? "")
      setPrimaryPosition(rosterData.primary_position ?? "")
      setSecondaryPosition(rosterData.secondary_position ?? "")
  
      setLoading(false)
    }
  
    void loadPlayer()
  }, [organizationId, teamId, playerId])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!organizationId || !teamId || !playerId) return

    setSaving(true)
    setError("")

    const { error: playerError } = await supabase
    .from("players")
    .update({
      first_name: firstName.trim(),
      last_name: lastName.trim(),
      graduation_year: graduationYear
        ? Number(graduationYear)
        : null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", playerId)
    .eq("organization_id", organizationId)

    if (playerError) {
      setError(playerError.message)
      setSaving(false)
      return
    }

   const {
  data: updatedRoster,
  error: rosterError,
} = await supabase
  .from("team_roster_members")
  .update({
    jersey_number: jerseyNumber || null,
    primary_position: primaryPosition || null,
    secondary_position: secondaryPosition || null,
  })
  .eq("team_id", teamId)
  .eq("player_id", playerId)
  .select()

  

    if (rosterError) {
  console.error("ROSTER UPDATE ERROR:", rosterError)

  setError(rosterError.message)
  setSaving(false)
  return
}

console.log("UPDATED ROSTER:", updatedRoster)

    navigate(
      `/dashboard/organizations/${organizationId}/teams/${teamId}`
    )
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-scoreboard-dark px-6 py-12 text-scoreboard-cream">
        <div className="mx-auto max-w-4xl">
          <p className="scoreboard-label">
            Loading Player...
          </p>
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

          <p className="scoreboard-label mt-8 text-scoreboard-amber">
            Roster
          </p>

          <h1 className="mt-3 text-4xl font-black uppercase tracking-[0.06em]">
            Edit Player
          </h1>

        </div>
      </section>

      <section className="mx-auto max-w-4xl px-6 py-10">

        <div className="scoreboard-panel p-4">

          <form
            onSubmit={handleSubmit}
            className="border border-scoreboard-cream/30 bg-scoreboard-green p-6 sm:p-8"
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
  label="Graduation Year"
  value={graduationYear}
  onChange={setGraduationYear}
  type="number"
/>

              <PlayerInput
                label="Jersey Number"
                value={jerseyNumber}
                onChange={setJerseyNumber}
              />

              <PositionSelect
                label="Primary Position"
                value={primaryPosition}
                onChange={setPrimaryPosition}
              />

              <PositionSelect
                label="Secondary Position"
                value={secondaryPosition}
                onChange={setSecondaryPosition}
              />

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
              disabled={saving}
              className="
                mt-7
                w-full
                rounded-none
                bg-scoreboard-cream
                font-black
                uppercase
                tracking-[0.14em]
                text-scoreboard-dark
                hover:bg-scoreboard-amber
              "
            >
              <Save className="mr-2 h-4 w-4" />

              {saving ? "Saving..." : "Save Player"}
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

function PositionSelect({
  label,
  value,
  onChange,
}: {
  label: string
  value: string
  onChange: (value: string) => void
}) {
  return (
    <label>
      <span className="scoreboard-label text-scoreboard-cream">
        {label}
      </span>

      <select
        value={value}
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
  )
}