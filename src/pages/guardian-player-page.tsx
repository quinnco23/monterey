import { useEffect, useMemo, useState } from "react"
import {
  ArrowLeft,
  CheckCircle2,
  ShieldCheck,
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
}

type TeamMembership = {
  id: string

  team: {
    id: string
    name: string
    age_group: string | null
    season_year: number | null
  } | null
}

type Confirmation = {
  id: string
  confirmed_at: string
}

export function GuardianPlayerPage() {
  const { playerId } = useParams()

  const [player, setPlayer] =
    useState<Player | null>(null)

  const [teams, setTeams] =
    useState<TeamMembership[]>([])

  const [confirmation, setConfirmation] =
    useState<Confirmation | null>(null)

  const [confirmedChecked, setConfirmedChecked] =
    useState(false)

  const [loading, setLoading] =
    useState(true)

  const [saving, setSaving] =
    useState(false)

  const [error, setError] =
    useState("")

  useEffect(() => {
    async function loadPlayer() {
      if (!playerId) {
        setError("Missing player ID.")
        setLoading(false)
        return
      }

      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        setError("You must be signed in.")
        setLoading(false)
        return
      }

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
          graduation_year
        `)
        .eq("id", playerId)
        .maybeSingle()

      if (playerError) {
        setError(playerError.message)
        setLoading(false)
        return
      }

      if (!playerData) {
        setError(
          "Player not found or you do not have access."
        )
        setLoading(false)
        return
      }

      const {
        data: teamData,
        error: teamError,
      } = await supabase
        .from("team_players")
        .select(`
          id,

          team:teams (
            id,
            name,
            age_group,
            season_year
          )
        `)
        .eq("player_id", playerId)
        .eq("active", true)

      if (teamError) {
        setError(teamError.message)
        setLoading(false)
        return
      }

      const {
        data: confirmationData,
        error: confirmationError,
      } = await supabase
        .from("player_information_confirmations")
        .select(`
          id,
          confirmed_at
        `)
        .eq("player_id", playerId)
        .eq("guardian_user_id", user.id)
        .maybeSingle()

      if (confirmationError) {
        setError(confirmationError.message)
        setLoading(false)
        return
      }

      setPlayer(playerData)

      setTeams(
        (teamData ?? []) as unknown as TeamMembership[]
      )

      setConfirmation(
        confirmationData ?? null
      )

      setConfirmedChecked(
        Boolean(confirmationData)
      )

      setLoading(false)
    }

    void loadPlayer()
  }, [playerId])

  const leagueAge = useMemo(() => {
    if (
      !player?.birth_date ||
      teams.length === 0
    ) {
      return null
    }

    const seasonYear =
      teams[0]?.team?.season_year

    if (!seasonYear) {
      return null
    }

    const dob =
      new Date(
        `${player.birth_date}T12:00:00`
      )

    const cutoff =
      new Date(
        seasonYear,
        3,
        30,
        12,
        0,
        0
      )

    let age =
      cutoff.getFullYear() -
      dob.getFullYear()

    const birthdayThisYear =
      new Date(
        seasonYear,
        dob.getMonth(),
        dob.getDate(),
        12,
        0,
        0
      )

    if (
      birthdayThisYear >
      cutoff
    ) {
      age -= 1
    }

    return age
  }, [player, teams])

  async function handleConfirm() {
    if (
      !player ||
      !playerId ||
      !confirmedChecked
    ) {
      return
    }

    setSaving(true)
    setError("")

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      setError("You must be signed in.")
      setSaving(false)
      return
    }

    const {
      data,
      error,
    } = await supabase
      .from("player_information_confirmations")
      .upsert(
        {
          player_id: playerId,
          guardian_user_id: user.id,
          organization_id:
            player.organization_id,
          confirmed_at:
            new Date().toISOString(),
        },
        {
          onConflict:
            "player_id,guardian_user_id",
        }
      )
      .select(`
        id,
        confirmed_at
      `)
      .single()

    if (error) {
      setError(error.message)
      setSaving(false)
      return
    }

    setConfirmation(data)
    setSaving(false)
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-scoreboard-dark px-6 py-12 text-scoreboard-cream">
        <p className="scoreboard-label">
          Loading Player...
        </p>
      </main>
    )
  }

  if (error || !player) {
    return (
      <main className="min-h-screen bg-scoreboard-dark px-6 py-12 text-scoreboard-cream">
        <div className="mx-auto max-w-3xl">
          <div className="border border-scoreboard-red/60 bg-scoreboard-green p-6">
            <p className="scoreboard-label text-scoreboard-amber">
              Unable To Load Player
            </p>

            <p className="mt-3 text-sm text-scoreboard-muted">
              {error || "Player not found."}
            </p>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-scoreboard-dark text-scoreboard-cream">

      <section className="border-b border-scoreboard-cream/20 bg-scoreboard-green">
        <div className="mx-auto max-w-3xl px-6 py-10">

          <Link
            to="/guardian"
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
            Guardian Dashboard
          </Link>

          <p className="scoreboard-label mt-8 text-scoreboard-amber">
            Player Information
          </p>

          <h1 className="mt-3 text-4xl font-black uppercase tracking-[0.06em]">
            {player.first_name}{" "}
            {player.last_name}
          </h1>

        </div>
      </section>

      <section className="mx-auto max-w-3xl px-6 py-10">

        <div className="border border-scoreboard-cream/25 bg-scoreboard-green p-6 sm:p-8">

          <div className="flex items-start justify-between gap-4 border-b border-scoreboard-cream/20 pb-5">

            <div>
              <p className="scoreboard-label text-scoreboard-amber">
                Review
              </p>

              <h2 className="mt-2 text-2xl font-black uppercase tracking-[0.05em]">
                Confirm Player Information
              </h2>
            </div>

            <ShieldCheck className="h-6 w-6 text-scoreboard-amber" />

          </div>

          <div className="mt-6 grid gap-5 sm:grid-cols-2">

            <InfoField
              label="First Name"
              value={player.first_name}
            />

            <InfoField
              label="Last Name"
              value={player.last_name}
            />

            <InfoField
              label="Date of Birth"
              value={
                player.birth_date
                  ? new Date(
                      `${player.birth_date}T12:00:00`
                    ).toLocaleDateString([], {
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                    })
                  : "Not provided"
              }
            />

            <InfoField
              label="Graduation Year"
              value={
                player.graduation_year
                  ? String(
                      player.graduation_year
                    )
                  : "Not provided"
              }
            />

            {leagueAge !== null && (
              <InfoField
                label="League Age"
                value={String(leagueAge)}
              />
            )}

          </div>

          {teams.length > 0 && (
            <div className="mt-7 border-t border-scoreboard-cream/20 pt-6">

              <p className="scoreboard-label">
                Current Teams
              </p>

              <div className="mt-3 space-y-3">

                {teams.map((membership) => (
                  <div
                    key={membership.id}
                    className="
                      border
                      border-scoreboard-cream/20
                      bg-scoreboard-dark
                      p-4
                    "
                  >
                    <p className="font-black uppercase">
                      {membership.team?.name ??
                        "Team"}
                    </p>

                    <p className="mt-1 text-xs uppercase tracking-[0.10em] text-scoreboard-muted">
                      {[
                        membership.team?.age_group,
                        membership.team?.season_year,
                      ]
                        .filter(Boolean)
                        .join(" • ")}
                    </p>
                  </div>
                ))}

              </div>

            </div>
          )}

          <div className="mt-7 border-t border-scoreboard-cream/20 pt-6">

            {confirmation ? (
              <div className="border border-scoreboard-amber/50 bg-scoreboard-dark p-5">

                <div className="flex items-start gap-3">

                  <CheckCircle2 className="mt-0.5 h-5 w-5 text-scoreboard-amber" />

                  <div>

                    <p className="font-black uppercase">
                      Player Information Confirmed
                    </p>

                    <p className="mt-2 text-sm text-scoreboard-muted">
                      Confirmed{" "}
                      {new Date(
                        confirmation.confirmed_at
                      ).toLocaleDateString()}
                    </p>

                  </div>

                </div>

              </div>
            ) : (
              <>
                <label className="flex cursor-pointer items-start gap-3">

                  <input
                    type="checkbox"
                    checked={confirmedChecked}
                    onChange={(e) =>
                      setConfirmedChecked(
                        e.target.checked
                      )
                    }
                    className="mt-1 h-4 w-4"
                  />

                  <span className="text-sm leading-6 text-scoreboard-muted">
                    I confirm that the player information
                    shown above is accurate to the best of
                    my knowledge.
                  </span>

                </label>

                <Button
                  type="button"
                  disabled={
                    !confirmedChecked ||
                    saving
                  }
                  onClick={handleConfirm}
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
                    hover:bg-scoreboard-cream
                    disabled:opacity-40
                  "
                >
                  {saving
                    ? "Confirming..."
                    : "Confirm Player Information"}
                </Button>
              </>
            )}

          </div>

        </div>

      </section>

    </main>
  )
}

function InfoField({
  label,
  value,
}: {
  label: string
  value: string
}) {
  return (
    <div className="border border-scoreboard-cream/20 bg-scoreboard-dark p-4">

      <p className="scoreboard-label text-scoreboard-muted">
        {label}
      </p>

      <p className="mt-2 font-black">
        {value}
      </p>

    </div>
  )
}