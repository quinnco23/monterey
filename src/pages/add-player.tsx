


import { useEffect, useState } from "react"
import { ArrowLeft } from "lucide-react"
import { Link, useNavigate, useParams } from "react-router-dom"

import { Button } from "@/components/ui/button"
import { supabase } from "@/lib/supabase"


type EligibilityResult = {
  eligible: boolean
  leagueAge: number
  reason?: string
}

type Team = {
  id: string
  name: string
  organization_id: string
  age_group: string | null
  classification: string | null
  season_year: number | null
}

type PoolPlayer = {
  id: string
  first_name: string
  last_name: string
  birth_date: string | null
  graduation_year: number | null
}

type TeamPlayer = {
  player_id: string
}

function checkPlayerEligibility({
  birthDate,
  ageGroup,
  seasonYear,
}: {
  birthDate: string | null
  ageGroup: string | null
  seasonYear: number | null
}): EligibilityResult {
  if (!birthDate) {
    return {
      eligible: false,
      leagueAge: 0,
      reason: "Date of birth required",
    }
  }

  if (!ageGroup || !seasonYear) {
    return {
      eligible: false,
      leagueAge: 0,
      reason: "Team age information is missing",
    }
  }

  const birthYear =
    Number(birthDate.slice(0, 4))

  const leagueAge =
    seasonYear - birthYear

  const maxAge =
    Number(ageGroup.replace(/\D/g, ""))

  if (!maxAge) {
    return {
      eligible: false,
      leagueAge,
      reason: `Unknown age group: ${ageGroup}`,
    }
  }

  if (leagueAge > maxAge) {
    return {
      eligible: false,
      leagueAge,
      reason: `League age ${leagueAge} exceeds ${ageGroup}`,
    }
  }

  return {
    eligible: true,
    leagueAge,
  }
}


export function AddPlayerPage() {
  const { organizationId, teamId } = useParams()
  const navigate = useNavigate()

  const [mode, setMode] =
  useState<"pool" | "new">("pool")

const [team, setTeam] =
  useState<Team | null>(null)

const [poolPlayers, setPoolPlayers] =
  useState<PoolPlayer[]>([])

const [existingPlayerIds, setExistingPlayerIds] =
  useState<Set<string>>(new Set())

const [selectedPlayer, setSelectedPlayer] =
  useState<PoolPlayer | null>(null)

const [pageLoading, setPageLoading] =
  useState(true)

  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [jerseyNumber, setJerseyNumber] = useState("")
  const [primaryPosition, setPrimaryPosition] = useState("")
  const [secondaryPosition, setSecondaryPosition] = useState("")
  const [birthDate, setBirthDate] =
  useState("")

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    if (!organizationId || !teamId) {
      return
    }
  
    async function loadPage() {
      setPageLoading(true)
      setError("")
  
      try {
        const [
          { data: teamData, error: teamError },
          { data: playerData, error: playerError },
          { data: rosterData, error: rosterError },
        ] = await Promise.all([
          supabase
            .from("teams")
            .select(`
              id,
              name,
              organization_id,
              age_group,
              classification,
              season_year
            `)
            .eq("id", teamId)
            .eq(
              "organization_id",
              organizationId
            )
            .single(),
  
          supabase
            .from("players")
            .select(`
              id,
              first_name,
              last_name,
              birth_date,
              graduation_year
            `)
            .eq(
              "organization_id",
              organizationId
            )
            .order("last_name")
            .order("first_name"),
  
          supabase
            .from("team_players")
            .select("player_id")
            .eq("team_id", teamId),
        ])
  
        if (teamError) throw teamError
        if (playerError) throw playerError
        if (rosterError) throw rosterError
  
        setTeam(teamData)
        setPoolPlayers(playerData ?? [])
  
        setExistingPlayerIds(
          new Set(
            (rosterData ?? []).map(
              (row) => row.player_id
            )
          )
        )
      } catch (err: any) {
        console.error(
          "Could not load Add Player page:",
          err
        )
  
        setError(
          err?.message ||
            "Could not load player pool."
        )
      } finally {
        setPageLoading(false)
      }
    }
  
    loadPage()
  }, [organizationId, teamId])

  async function handleAddPoolPlayer() {
    if (
      !selectedPlayer ||
      !team ||
      !teamId
    ) {
      return
    }
  
    const eligibility =
      checkPlayerEligibility({
        birthDate:
          selectedPlayer.birth_date,
        ageGroup:
          team.age_group,
        seasonYear:
          team.season_year,
      })
  
    if (!eligibility.eligible) {
      setError(
        eligibility.reason ||
          "Player is not eligible."
      )
      return
    }
  
    setLoading(true)
    setError("")
  
    const { error: rosterError } =
      await supabase
        .from("team_players")
        .insert({
          team_id: teamId,
          player_id: selectedPlayer.id,
          jersey_number:
            jerseyNumber || null,
          primary_position:
            primaryPosition || null,
          secondary_position:
            secondaryPosition || null,
          roster_status: "active",
          active: true,
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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!teamId || !organizationId) {
      setError("Missing team or organization.")
      return
    }

    if (!team) {
      setError("Team information is not loaded.")
      return
    }
    
    const eligibility =
      checkPlayerEligibility({
        birthDate: birthDate || null,
        ageGroup: team.age_group,
        seasonYear: team.season_year,
      })
    
    if (!eligibility.eligible) {
      setError(
        eligibility.reason ||
          "Player is not eligible for this team."
      )
      return
    }

    setLoading(true)
    setError("")

    const {
      data: player,
      error: playerError,
    } = await supabase
      .from("players")
      .insert({
        organization_id:
          organizationId,
    
        first_name:
          firstName.trim(),
    
        last_name:
          lastName.trim(),
    
        birth_date:
          birthDate || null,
      })
      .select()
      .single()

    if (playerError) {
      setError(playerError.message)
      setLoading(false)
      return
    }
    const { error: rosterError } =
    await supabase
      .from("team_players")
      .insert({
        team_id:
          teamId,
  
        player_id:
          player.id,
  
        jersey_number:
          jerseyNumber || null,
  
        primary_position:
          primaryPosition || null,
  
        secondary_position:
          secondaryPosition || null,
  
        roster_status:
          "active",
  
        active:
          true,
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
  Create a player in the organization pool
  and add them to this team's active roster.
</p>

<p className="mt-2 text-sm text-scoreboard-muted">
  {pageLoading
    ? "Loading player pool..."
    : `${poolPlayers.length} players available • ${team?.name ?? ""}`}
</p>

        </div>
      </section>

      <section className="mx-auto max-w-4xl px-6 py-10">

        <div className="scoreboard-panel p-4">

        <div className="mb-4 grid grid-cols-2 gap-2">
  <button
    type="button"
    onClick={() => {
      setMode("pool")
      setSelectedPlayer(null)
      setError("")
    }}
    className={`
      border
      px-4
      py-3
      text-sm
      font-black
      uppercase
      tracking-[0.12em]
      ${
        mode === "pool"
          ? "border-scoreboard-amber bg-scoreboard-amber text-scoreboard-dark"
          : "border-scoreboard-cream/30 bg-scoreboard-green text-scoreboard-cream"
      }
    `}
  >
    From Player Pool
  </button>

  <button
    type="button"
    onClick={() => {
      setMode("new")
      setSelectedPlayer(null)
      setError("")
    }}
    className={`
      border
      px-4
      py-3
      text-sm
      font-black
      uppercase
      tracking-[0.12em]
      ${
        mode === "new"
          ? "border-scoreboard-amber bg-scoreboard-amber text-scoreboard-dark"
          : "border-scoreboard-cream/30 bg-scoreboard-green text-scoreboard-cream"
      }
    `}
  >
    Create New
  </button>
</div>

{mode === "pool" && (
  <div
    className="
      border
      border-scoreboard-cream/30
      bg-scoreboard-green
      p-4
      sm:p-6
    "
  >
    <div className="mb-5">
      <p className="scoreboard-label text-scoreboard-amber">
        Organization Player Pool
      </p>

      <h2 className="mt-2 text-xl font-black uppercase">
        Select Player
      </h2>

      <p className="mt-1 text-sm text-scoreboard-muted">
        Add an existing organization player to{" "}
        {team?.name ?? "this team"}.
      </p>
    </div>

    {pageLoading ? (
      <p className="text-scoreboard-muted">
        Loading player pool...
      </p>
    ) : poolPlayers.length === 0 ? (
      <p className="text-scoreboard-muted">
        No players are currently in the organization pool.
      </p>
    ) : (
      <div className="space-y-2">
        {poolPlayers.map((player) => {
          const alreadyOnTeam =
            existingPlayerIds.has(player.id)

          const eligibility =
            checkPlayerEligibility({
              birthDate: player.birth_date,
              ageGroup: team?.age_group ?? null,
              seasonYear: team?.season_year ?? null,
            })

          return (
            <div
              key={player.id}
              className="
                flex
                flex-col
                gap-3
                border
                border-scoreboard-cream/20
                bg-scoreboard-dark/30
                p-4
                sm:flex-row
                sm:items-center
                sm:justify-between
              "
            >
              <div>
                <div className="font-black uppercase text-scoreboard-cream">
                  {player.first_name}{" "}
                  {player.last_name}
                </div>

                <div className="mt-1 text-xs text-scoreboard-muted">
                  {player.birth_date
                    ? `DOB ${formatPoolDate(
                        player.birth_date
                      )}`
                    : "DOB not entered"}

                  {player.graduation_year
                    ? ` • Class of ${player.graduation_year}`
                    : ""}
                </div>

                <div className="mt-2 text-xs font-bold uppercase">
                  {alreadyOnTeam ? (
                    <span className="text-scoreboard-muted">
                      Already on roster
                    </span>
                  ) : eligibility.eligible ? (
                    <span className="text-scoreboard-amber">
                      Eligible • League Age{" "}
                      {eligibility.leagueAge}
                    </span>
                  ) : (
                    <span className="text-scoreboard-red">
                      {eligibility.reason ??
                        "Not eligible"}
                    </span>
                  )}
                </div>
              </div>

              <Button
                type="button"
                disabled={
                  alreadyOnTeam ||
                  !eligibility.eligible
                }
                onClick={() => {
                  setSelectedPlayer(player)
                  setJerseyNumber("")
                  setPrimaryPosition("")
                  setSecondaryPosition("")
                  setError("")
                }}
                className="
                  rounded-none
                  bg-scoreboard-cream
                  font-black
                  uppercase
                  text-scoreboard-dark
                  hover:bg-scoreboard-amber
                  disabled:cursor-not-allowed
                  disabled:opacity-40
                "
              >
                {alreadyOnTeam
                  ? "On Roster"
                  : "Select"}
              </Button>
            </div>
          )
        })}
      </div>
    )}
  </div>
)}

{mode === "new" && (<form
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

<label>
  <span className="scoreboard-label text-scoreboard-cream">
    Date of Birth
  </span>

  <input
    type="date"
    value={birthDate}
    onChange={(e) =>
      setBirthDate(
        e.target.value
      )
    }
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
      [color-scheme:light]
      focus:border-scoreboard-amber
    "
  />
</label>

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
          )}
{selectedPlayer && (
  <div
    className="
      mt-6
      border
      border-scoreboard-amber
      bg-scoreboard-dark
      p-5
    "
  >
    <p className="scoreboard-label text-scoreboard-amber">
      Add To Roster
    </p>

    <h3 className="mt-2 text-2xl font-black uppercase">
      {selectedPlayer.first_name}{" "}
      {selectedPlayer.last_name}
    </h3>

    <div className="mt-5 grid gap-5 sm:grid-cols-3">
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
        allowNone
      />
    </div>

    {error && (
      <p className="mt-4 text-sm text-scoreboard-red">
        {error}
      </p>
    )}

    <Button
      type="button"
      disabled={loading}
      onClick={handleAddPoolPlayer}
      className="
        mt-6
        w-full
        rounded-none
        bg-scoreboard-amber
        py-5
        font-black
        uppercase
        tracking-[0.14em]
        text-scoreboard-dark
      "
    >
      {loading
        ? "Adding Player..."
        : "Add To Roster"}
    </Button>
  </div>
)}
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
  allowNone = false,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  allowNone?: boolean
}) {
  return (
    <label>
      <span className="scoreboard-label text-scoreboard-cream">
        {label}
      </span>

      <select
        value={value}
        onChange={(e) =>
          onChange(e.target.value)
        }
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
        <option value="">
          {allowNone
            ? "None"
            : "Select position"}
        </option>

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

function formatPoolDate(date: string) {
  return new Date(
    `${date}T00:00:00`
  ).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}