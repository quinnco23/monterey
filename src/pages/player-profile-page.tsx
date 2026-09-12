import { useEffect, useState } from "react"
import {
  ArrowLeft,
  Mail,
  ShieldCheck,
  UserPlus,
  Users,
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
}

type TeamMembership = {
  id: string
  jersey_number: string | null
  primary_position: string | null
  secondary_position: string | null
  roster_status: string | null
  active: boolean

  team: {
    id: string
    name: string
    age_group: string | null
    classification: string | null
    season_year: number | null
  } | null
}

type Guardian = {
  id: string
  user_id: string
  relationship: string
  status: string
  is_primary: boolean
}

type GuardianInvitation = {
  id: string
  email: string
  first_name: string | null
  last_name: string | null
  phone: string | null
  relationship: string | null
  status: string
  expires_at: string
}

export function PlayerProfilePage() {
  const {
    organizationId,
    playerId,
  } = useParams()

  const [player, setPlayer] =
    useState<Player | null>(null)

  const [teams, setTeams] =
    useState<TeamMembership[]>([])

  const [guardians, setGuardians] =
    useState<Guardian[]>([])

  const [invitations, setInvitations] =
    useState<GuardianInvitation[]>([])

  const [loading, setLoading] =
    useState(true)

  const [error, setError] =
    useState("")

  useEffect(() => {
    async function loadPage() {
      if (!organizationId || !playerId) {
        setError(
          "Missing organization or player ID."
        )
        setLoading(false)
        return
      }

      setLoading(true)
      setError("")

      const [
        playerResult,
        teamResult,
        guardianResult,
        invitationResult,
      ] = await Promise.all([
        supabase
          .from("players")
          .select(`
            id,
            organization_id,
            first_name,
            last_name,
            birth_date,
            graduation_year,
            city,
            state
          `)
          .eq("id", playerId)
          .eq(
            "organization_id",
            organizationId
          )
          .maybeSingle(),

        supabase
          .from("team_players")
          .select(`
            id,
            jersey_number,
            primary_position,
            secondary_position,
            roster_status,
            active,

            team:team_id (
              id,
              name,
              age_group,
              classification,
              season_year
            )
          `)
          .eq("player_id", playerId)
          .eq("active", true),

        supabase
          .from("player_guardians")
          .select(`
            id,
            user_id,
            relationship,
            status,
            is_primary
          `)
          .eq("player_id", playerId)
          .eq("organization_id", organizationId)
          .eq("status", "confirmed"),

        supabase
          .from("player_guardian_invitations")
          .select(`
            id,
            email,
            first_name,
            last_name,
            phone,
            relationship,
            status,
            expires_at
          `)
          .eq("player_id", playerId)
          .eq(
            "organization_id",
            organizationId
          )
          .eq("status", "pending")
          .order("created_at", {
            ascending: false,
          }),
      ])

      if (playerResult.error) {
        setError(playerResult.error.message)
        setLoading(false)
        return
      }

      if (!playerResult.data) {
        setError("Player not found.")
        setLoading(false)
        return
      }

      if (teamResult.error) {
        setError(teamResult.error.message)
        setLoading(false)
        return
      }

      if (guardianResult.error) {
        setError(guardianResult.error.message)
        setLoading(false)
        return
      }

      if (invitationResult.error) {
        setError(invitationResult.error.message)
        setLoading(false)
        return
      }

      setPlayer(playerResult.data)

      setTeams(
        (teamResult.data ?? []) as unknown as TeamMembership[]
      )

      setGuardians(
        guardianResult.data ?? []
      )

      setInvitations(
        invitationResult.data ?? []
      )

      setLoading(false)
    }

    void loadPage()
  }, [organizationId, playerId])

  if (loading) {
    return (
      <main className="min-h-screen bg-scoreboard-dark px-6 py-12 text-scoreboard-cream">
        <div className="mx-auto max-w-5xl">
          <p className="scoreboard-label">
            Loading Player...
          </p>
        </div>
      </main>
    )
  }

  if (error || !player) {
    return (
      <main className="min-h-screen bg-scoreboard-dark px-6 py-12 text-scoreboard-cream">
        <div className="mx-auto max-w-5xl">
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

      {/* HERO */}
      <section className="border-b border-scoreboard-cream/20 bg-scoreboard-green">
        <div className="mx-auto max-w-5xl px-6 py-10">

          <Link
            to={`/dashboard/organizations/${organizationId}`}
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
            Organization Dashboard
          </Link>

          <p className="scoreboard-label mt-8 text-scoreboard-amber">
            Player Profile
          </p>

          <h1 className="mt-3 text-4xl font-black uppercase tracking-[0.06em]">
            {player.first_name}{" "}
            {player.last_name}
          </h1>

          <div className="mt-4 flex flex-wrap gap-5 text-sm text-scoreboard-muted">

            {player.birth_date && (
              <span>
                DOB{" "}
                {new Date(
                  `${player.birth_date}T12:00:00`
                ).toLocaleDateString()}
              </span>
            )}

            {player.graduation_year && (
              <span>
                Class of{" "}
                {player.graduation_year}
              </span>
            )}

            {(player.city || player.state) && (
              <span>
                {[
                  player.city,
                  player.state,
                ]
                  .filter(Boolean)
                  .join(", ")}
              </span>
            )}

          </div>

          <Link
  to={`/dashboard/organizations/${organizationId}/players/${playerId}/edit`}
>
  <Button
    variant="outline"
    className="
      rounded-none
      border-scoreboard-cream/40
      bg-transparent
      font-black
      uppercase
      tracking-[0.12em]
      text-scoreboard-cream
      hover:bg-scoreboard-light
      hover:text-scoreboard-amber
    "
  >
    Edit Player
  </Button>
</Link>

        </div>
      </section>

      <section className="mx-auto max-w-5xl space-y-6 px-6 py-10">

        {/* CURRENT TEAMS */}
        <div className="border border-scoreboard-cream/25 bg-scoreboard-green p-6">

          <div className="flex items-center justify-between border-b border-scoreboard-cream/20 pb-4">

            <div>
              <p className="scoreboard-label text-scoreboard-amber">
                Teams
              </p>

              <h2 className="mt-2 text-2xl font-black uppercase tracking-[0.06em]">
                Current Teams
              </h2>
            </div>

            <Users className="h-6 w-6 text-scoreboard-amber" />

          </div>

          {teams.length === 0 ? (
            <p className="mt-5 text-sm text-scoreboard-muted">
              This player is not currently assigned to an active team.
            </p>
          ) : (
            <div className="mt-5 space-y-3">

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

                  <div className="flex flex-wrap items-center justify-between gap-4">

                    <div>
                      <p className="text-lg font-black uppercase">
                        {membership.team?.name ?? "Team"}
                      </p>

                      <p className="mt-1 text-xs uppercase tracking-[0.10em] text-scoreboard-muted">
                        {[
                          membership.team?.age_group,
                          membership.team?.classification,
                          membership.team?.season_year,
                        ]
                          .filter(Boolean)
                          .join(" • ")}
                      </p>
                    </div>

                    {membership.jersey_number && (
                      <div className="scoreboard-number text-2xl text-scoreboard-amber">
                        #{membership.jersey_number}
                      </div>
                    )}

                  </div>

                  {(membership.primary_position ||
                    membership.secondary_position) && (
                    <p className="mt-3 text-sm text-scoreboard-muted">
                      {membership.primary_position ?? ""}
                      {membership.secondary_position
                        ? ` / ${membership.secondary_position}`
                        : ""}
                    </p>
                  )}

                </div>
              ))}

            </div>
          )}

        </div>

        {/* GUARDIANS */}
        <div className="border border-scoreboard-cream/25 bg-scoreboard-green p-6">

          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-scoreboard-cream/20 pb-4">

            <div>
              <p className="scoreboard-label text-scoreboard-amber">
                Family Access
              </p>

              <h2 className="mt-2 text-2xl font-black uppercase tracking-[0.06em]">
                Parents / Guardians
              </h2>
            </div>

            <Link
              to={`/dashboard/organizations/${organizationId}/players/${playerId}/guardians/invite`}
            >
              <Button
                type="button"
                className="
                  rounded-none
                  bg-scoreboard-amber
                  font-black
                  uppercase
                  tracking-[0.12em]
                  text-scoreboard-dark
                  hover:bg-scoreboard-cream
                "
              >
                <UserPlus className="mr-2 h-4 w-4" />
                Invite Parent / Guardian
              </Button>
            </Link>

          </div>

          {/* CONFIRMED */}
          <div className="mt-6">

            <p className="scoreboard-label">
              Confirmed Guardians
            </p>

            {guardians.length === 0 ? (
              <p className="mt-3 text-sm text-scoreboard-muted">
                No confirmed parents or guardians yet.
              </p>
            ) : (
              <div className="mt-3 space-y-3">

                {guardians.map((guardian) => (
                  <div
                    key={guardian.id}
                    className="
                      flex
                      items-center
                      justify-between
                      border
                      border-scoreboard-cream/20
                      bg-scoreboard-dark
                      p-4
                    "
                  >
                    <div className="flex items-center gap-3">

                      <ShieldCheck className="h-5 w-5 text-scoreboard-amber" />

                      <div>
                        <p className="font-black uppercase">
                          {guardian.relationship}
                        </p>

                        <p className="mt-1 text-xs text-scoreboard-muted">
                          Guardian access confirmed
                        </p>
                      </div>

                    </div>

                    {guardian.is_primary && (
                      <span className="
                        border
                        border-scoreboard-amber
                        px-2
                        py-1
                        text-[10px]
                        font-black
                        uppercase
                        tracking-[0.12em]
                        text-scoreboard-amber
                      ">
                        Primary
                      </span>
                    )}

                  </div>
                ))}

              </div>
            )}

          </div>

          {/* PENDING INVITES */}
          <div className="mt-8 border-t border-scoreboard-cream/20 pt-6">

            <p className="scoreboard-label">
              Pending Invitations
            </p>

            {invitations.length === 0 ? (
              <p className="mt-3 text-sm text-scoreboard-muted">
                No pending guardian invitations.
              </p>
            ) : (
              <div className="mt-3 space-y-3">

                {invitations.map((invite) => (
                  <div
                    key={invite.id}
                    className="
                      border
                      border-scoreboard-cream/20
                      bg-scoreboard-dark
                      p-4
                    "
                  >

                    <div className="flex flex-wrap items-start justify-between gap-4">

                      <div>
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-scoreboard-amber" />

                          <p className="font-black uppercase">
                            {[
                              invite.first_name,
                              invite.last_name,
                            ]
                              .filter(Boolean)
                              .join(" ") ||
                              invite.email}
                          </p>
                        </div>

                        <p className="mt-2 text-sm text-scoreboard-muted">
                          {invite.email}
                        </p>

                        {invite.phone && (
                          <p className="mt-1 text-sm text-scoreboard-muted">
                            {invite.phone}
                          </p>
                        )}

                      </div>

                      <div className="text-right">

                        <span className="
                          border
                          border-scoreboard-amber/50
                          px-2
                          py-1
                          text-[10px]
                          font-black
                          uppercase
                          tracking-[0.12em]
                          text-scoreboard-amber
                        ">
                          Pending
                        </span>

                        {invite.relationship && (
                          <p className="mt-2 text-xs uppercase text-scoreboard-muted">
                            {invite.relationship}
                          </p>
                        )}

                      </div>

                    </div>

                  </div>
                ))}

              </div>
            )}

          </div>

        </div>

      </section>

    </main>
  )
}