import { useEffect, useState } from "react"
import {
  ArrowLeft,
  Edit3,
  Save,
  X,
} from "lucide-react"
import {
  Link,
  useParams,
} from "react-router-dom"

import { Button } from "@/components/ui/button"
import { supabase } from "@/lib/supabase"

type Player = {
  id: string
  organization_id: string
  first_name: string
  last_name: string
  birth_date: string | null
  graduation_year: number | null
  city: string | null
  state: string | null
  gameon_player_id: string | null
}

type TeamMembership = {
  id: string
  jersey_number: string | null
  primary_position: string | null
  secondary_position: string | null
  roster_status: string | null

  team: {
    id: string
    name: string
    age_group: string | null
    season_year: number | null
  } | null
}

export default function OrganizationPlayerPage() {
  const {
    organizationId,
    playerId,
  } = useParams()

  const [player, setPlayer] =
    useState<Player | null>(null)

  const [memberships, setMemberships] =
    useState<TeamMembership[]>([])

  const [loading, setLoading] =
    useState(true)

  const [saving, setSaving] =
    useState(false)

  const [editing, setEditing] =
    useState(false)

  const [error, setError] =
    useState("")

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    birthDate: "",
    graduationYear: "",
    city: "",
    state: "",
  })

  useEffect(() => {
    if (!playerId || !organizationId) {
      return
    }

    loadPlayer()
  }, [playerId, organizationId])

  async function loadPlayer() {
    if (!playerId || !organizationId) {
      return
    }

    setLoading(true)
    setError("")

    try {
      const {
        data: playerData,
        error: playerError,
      } = await supabase
        .from("players")
        .select(`
          id,
          organization_id,
          first_name,
          last_name,
          birth_date,
          graduation_year,
          city,
          state,
          gameon_player_id
        `)
        .eq("id", playerId)
        .eq(
          "organization_id",
          organizationId
        )
        .single()

      if (playerError) {
        throw playerError
      }

      setPlayer(playerData)

      setForm({
        firstName:
          playerData.first_name ?? "",

        lastName:
          playerData.last_name ?? "",

        birthDate:
          playerData.birth_date ?? "",

        graduationYear:
          playerData.graduation_year
            ? String(
                playerData.graduation_year
              )
            : "",

        city:
          playerData.city ?? "",

        state:
          playerData.state ?? "",
      })

      const {
        data: membershipData,
        error: membershipError,
      } = await supabase
        .from("team_players")
        .select(`
          id,
          jersey_number,
          primary_position,
          secondary_position,
          roster_status,
          team:teams (
            id,
            name,
            age_group,
            season_year
          )
        `)
        .eq("player_id", playerId)

      if (membershipError) {
        throw membershipError
      }

      const normalizedMemberships =
      (membershipData ?? []).map(
        (membership) => ({
          ...membership,
    
          team: Array.isArray(membership.team)
            ? membership.team[0] ?? null
            : membership.team ?? null,
        })
      )
    
    setMemberships(
      normalizedMemberships as TeamMembership[]
    )
    } catch (err: any) {
      console.error(
        "Could not load player:",
        err
      )

      setError(
        err?.message ||
          "Could not load player."
      )
    } finally {
      setLoading(false)
    }
  }

  function updateField(
    field: keyof typeof form,
    value: string
  ) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }))
  }

  function cancelEdit() {
    if (!player) return

    setForm({
      firstName:
        player.first_name ?? "",

      lastName:
        player.last_name ?? "",

      birthDate:
        player.birth_date ?? "",

      graduationYear:
        player.graduation_year
          ? String(
              player.graduation_year
            )
          : "",

      city:
        player.city ?? "",

      state:
        player.state ?? "",
    })

    setEditing(false)
  }

  async function handleSave() {
    if (!playerId || !organizationId) {
      return
    }

    if (
      !form.firstName.trim() ||
      !form.lastName.trim()
    ) {
      setError(
        "First and last name are required."
      )
      return
    }

    setSaving(true)
    setError("")

    try {
      const {
        data,
        error: updateError,
      } = await supabase
        .from("players")
        .update({
          first_name:
            form.firstName.trim(),

          last_name:
            form.lastName.trim(),

          birth_date:
            form.birthDate || null,

          graduation_year:
            form.graduationYear
              ? Number(
                  form.graduationYear
                )
              : null,

          city:
            form.city.trim() || null,

          state:
            form.state
              .trim()
              .toUpperCase() ||
            null,

          updated_at:
            new Date().toISOString(),
        })
        .eq("id", playerId)
        .eq(
          "organization_id",
          organizationId
        )
        .select()
        .single()

      if (updateError) {
        throw updateError
      }

      setPlayer(data)
      setEditing(false)
    } catch (err: any) {
      console.error(
        "Could not update player:",
        err
      )

      setError(
        err?.message ||
          "Could not update player."
      )
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-scoreboard-dark p-6 text-scoreboard-cream">
        Loading player...
      </main>
    )
  }

  if (!player) {
    return (
      <main className="min-h-screen bg-scoreboard-dark p-6 text-scoreboard-cream">
        Player not found.
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-scoreboard-dark text-scoreboard-cream">

      {/* HEADER */}

      <section className="border-b border-scoreboard-cream/20 bg-scoreboard-green">
        <div className="mx-auto max-w-4xl px-6 py-10">

          <Link
            to={`/dashboard/organizations/${organizationId}/players`}
            className="
              inline-flex
              items-center
              gap-2
              text-xs
              font-black
              uppercase
              tracking-[0.14em]
              text-scoreboard-muted
              hover:text-scoreboard-amber
            "
          >
            <ArrowLeft className="h-4 w-4" />
            Player Pool
          </Link>

          <p className="scoreboard-label mt-8 text-scoreboard-amber">
            Player Profile
          </p>

          <div className="mt-3 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">

            <div>
              <h1 className="text-4xl font-black uppercase tracking-[0.06em]">
                {player.first_name}{" "}
                {player.last_name}
              </h1>

              {player.graduation_year && (
                <p className="mt-2 text-scoreboard-muted">
                  Class of{" "}
                  {player.graduation_year}
                </p>
              )}
            </div>

            {!editing && (
              <Button
                type="button"
                onClick={() =>
                  setEditing(true)
                }
                className="
                  rounded-none
                  bg-scoreboard-cream
                  font-black
                  uppercase
                  text-scoreboard-dark
                  hover:bg-scoreboard-amber
                "
              >
                <Edit3 className="mr-2 h-4 w-4" />
                Edit Player
              </Button>
            )}

          </div>
        </div>
      </section>

      <section className="mx-auto max-w-4xl space-y-8 px-6 py-10">

        {error && (
          <div className="border border-scoreboard-red/60 p-4 text-sm text-scoreboard-muted">
            {error}
          </div>
        )}

        {/* PROFILE */}

        <div className="scoreboard-panel p-5">

          {editing ? (
            <PlayerEditForm
              form={form}
              updateField={updateField}
            />
          ) : (
            <PlayerDetails
              player={player}
            />
          )}

          {editing && (
            <div className="mt-6 flex gap-3 border-t border-scoreboard-cream/20 pt-5">

              <Button
                type="button"
                onClick={cancelEdit}
                disabled={saving}
                className="
                  flex-1
                  rounded-none
                  border
                  border-scoreboard-cream/30
                  bg-transparent
                  font-black
                  uppercase
                  text-scoreboard-cream
                "
              >
                <X className="mr-2 h-4 w-4" />
                Cancel
              </Button>

              <Button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="
                  flex-1
                  rounded-none
                  bg-scoreboard-amber
                  font-black
                  uppercase
                  text-scoreboard-dark
                "
              >
                <Save className="mr-2 h-4 w-4" />

                {saving
                  ? "Saving..."
                  : "Save Changes"}
              </Button>

            </div>
          )}

        </div>

        {/* TEAM MEMBERSHIPS */}

        <section>
          <div className="mb-4">
            <p className="scoreboard-label text-scoreboard-amber">
              Rosters
            </p>

            <h2 className="mt-2 text-2xl font-black uppercase">
              Team Memberships
            </h2>
          </div>

          {memberships.length === 0 ? (
            <div className="scoreboard-panel p-6 text-scoreboard-muted">
              This player is not currently
              assigned to a team.
            </div>
          ) : (
            <div className="space-y-3">

              {memberships.map(
                (membership) => {

                  const team =
                    membership.team

                  if (!team) {
                    return null
                  }

                  return (
                    <div
                      key={membership.id}
                      className="
                        scoreboard-panel
                        flex
                        flex-col
                        gap-4
                        p-5
                        sm:flex-row
                        sm:items-center
                        sm:justify-between
                      "
                    >
                      <div>
                        <p className="font-black uppercase">
                          {team.name}
                        </p>

                        <p className="mt-1 text-sm text-scoreboard-muted">
                          {team.age_group ??
                            "Age group —"}

                          {team.season_year
                            ? ` • ${team.season_year}`
                            : ""}
                        </p>

                        <p className="mt-2 text-sm text-scoreboard-cream">
                          {membership.jersey_number
                            ? `#${membership.jersey_number}`
                            : "No number"}

                          {membership.primary_position
                            ? ` • ${membership.primary_position}`
                            : ""}

                          {membership.secondary_position
                            ? ` / ${membership.secondary_position}`
                            : ""}
                        </p>
                      </div>

                      <Link
                        to={`/dashboard/organizations/${organizationId}/teams/${team.id}`}
                        className="
                          scoreboard-label
                          text-scoreboard-amber
                        "
                      >
                        View Team →
                      </Link>
                    </div>
                  )
                }
              )}

            </div>
          )}
        </section>

      </section>
    </main>
  )
}

function PlayerDetails({
  player,
}: {
  player: Player
}) {
  return (
    <div className="grid gap-6 sm:grid-cols-2">
      <Detail
        label="Date of Birth"
        value={
          player.birth_date
            ? formatBirthDate(player.birth_date)
            : "Not entered"
        }
      />

      <Detail
        label="Graduation Year"
        value={
          player.graduation_year
            ? `Class of ${player.graduation_year}`
            : "Not entered"
        }
      />

      <Detail
        label="Location"
        value={
          [player.city, player.state]
            .filter(Boolean)
            .join(", ") ||
          "Not entered"
        }
      />

      <Detail
        label="GameOn"
        value={
          player.gameon_player_id
            ? "Connected"
            : "Not connected"
        }
      />
    </div>
  )
}

function Detail({
  label,
  value,
}: {
  label: string
  value: string
}) {
  return (
    <div>
      <p className="scoreboard-label text-scoreboard-muted">
        {label}
      </p>

      <p className="mt-2 text-lg font-bold text-scoreboard-cream">
        {value}
      </p>
    </div>
  )
}

function PlayerEditForm({
  form,
  updateField,
}: {
  form: {
    firstName: string
    lastName: string
    birthDate: string
    graduationYear: string
    city: string
    state: string
  }

  updateField: (
    field:
      | "firstName"
      | "lastName"
      | "birthDate"
      | "graduationYear"
      | "city"
      | "state",
    value: string
  ) => void
}) {
  return (
    <div className="grid gap-5 sm:grid-cols-2">
      <EditInput
        label="First Name"
        value={form.firstName}
        onChange={(value) =>
          updateField("firstName", value)
        }
      />

      <EditInput
        label="Last Name"
        value={form.lastName}
        onChange={(value) =>
          updateField("lastName", value)
        }
      />

      <EditInput
        label="Date of Birth"
        type="date"
        value={form.birthDate}
        onChange={(value) =>
          updateField("birthDate", value)
        }
      />

      <EditInput
        label="Graduation Year"
        type="number"
        value={form.graduationYear}
        onChange={(value) =>
          updateField("graduationYear", value)
        }
      />

      <EditInput
        label="City"
        value={form.city}
        onChange={(value) =>
          updateField("city", value)
        }
      />

      <EditInput
        label="State"
        value={form.state}
        onChange={(value) =>
          updateField(
            "state",
            value.toUpperCase()
          )
        }
      />
    </div>
  )
}

function EditInput({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string
  value: string
  onChange: (value: string) => void
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
          [color-scheme:light]
          focus:border-scoreboard-amber
        "
      />
    </label>
  )
}

function formatBirthDate(date: string) {
  return new Date(
    `${date}T00:00:00`
  ).toLocaleDateString(
    "en-US",
    {
      month: "long",
      day: "numeric",
      year: "numeric",
    }
  )
}

