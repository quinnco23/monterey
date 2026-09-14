import { useEffect, useState } from "react"
import {
  CheckCircle2,
  ShieldCheck,
  XCircle,
} from "lucide-react"
import {
  Link,
  useParams,
} from "react-router-dom"

import { Button } from "@/components/ui/button"
import { supabase } from "@/lib/supabase"

type PlayerTeamInvitation = {
  id: string
  email: string
  status: string
  expires_at: string

  player_id: string
  player_first_name: string
  player_last_name: string

  team_id: string
  team_name: string

  organization_id: string
  organization_name: string
}

export function AcceptPlayerTeamInvitationPage() {
  const { invitationId } = useParams()

  const [invitation, setInvitation] =
    useState<PlayerTeamInvitation | null>(null)

  const [user, setUser] =
    useState<any>(null)

  const [loading, setLoading] =
    useState(true)

  const [accepting, setAccepting] =
    useState(false)

  const [accepted, setAccepted] =
    useState(false)

  const [error, setError] =
    useState("")

  useEffect(() => {
    async function loadInvitation() {
      if (!invitationId) {
        setError("Missing invitation ID.")
        setLoading(false)
        return
      }

      const {
        data: { user: currentUser },
      } = await supabase.auth.getUser()

      setUser(currentUser ?? null)

      const {
        data,
        error,
      } = await supabase.rpc(
        "get_player_team_invitation_details",
        {
          invitation_id: invitationId,
        }
      )

      if (error) {
        console.error(
          "PLAYER TEAM INVITATION LOAD ERROR:",
          error
        )

        setError(
          "Unable to load this roster invitation."
        )

        setLoading(false)
        return
      }

      const invite =
        Array.isArray(data)
          ? data[0] ?? null
          : data

      if (!invite) {
        setError(
          "Invitation not found, expired, or no longer available."
        )

        setLoading(false)
        return
      }

      setInvitation(invite)
      setLoading(false)
    }

    void loadInvitation()
  }, [invitationId])

  async function handleAccept() {
    if (!invitationId) return

    setAccepting(true)
    setError("")

    const {
      data,
      error,
    } = await supabase.rpc(
      "accept_player_team_invitation",
      {
        invitation_id: invitationId,
      }
    )

    if (error) {
      console.error(
        "PLAYER TEAM ACCEPT ERROR:",
        error
      )

      setError(error.message)
      setAccepting(false)
      return
    }

    console.log(
      "PLAYER TEAM INVITATION ACCEPTED:",
      data
    )

    setAccepted(true)
    setAccepting(false)
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-scoreboard-dark px-6 py-12 text-scoreboard-cream">
        <p className="scoreboard-label">
          Loading Roster Invitation...
        </p>
      </main>
    )
  }

  if (accepted) {
    return (
      <main className="min-h-screen bg-scoreboard-dark text-scoreboard-cream">
        <section className="mx-auto max-w-2xl px-6 py-20">

          <div className="border border-scoreboard-amber bg-scoreboard-green p-8 text-center">

            <CheckCircle2 className="mx-auto h-10 w-10 text-scoreboard-amber" />

            <p className="scoreboard-label mt-6 text-scoreboard-amber">
              Roster Invitation Accepted
            </p>

            <h1 className="mt-3 text-3xl font-black uppercase tracking-[0.05em]">
              Spot Accepted
            </h1>

            <p className="mt-4 text-sm leading-7 text-scoreboard-muted">
              This player is now marked as accepted
              for the team roster.
            </p>

            <Link
              to="/guardian"
              className="
                mt-7
                inline-flex
                min-h-11
                items-center
                justify-center
                border
                border-scoreboard-amber
                bg-scoreboard-amber
                px-6
                text-xs
                font-black
                uppercase
                tracking-[0.12em]
                text-scoreboard-dark
              "
            >
              Continue
            </Link>

          </div>

        </section>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-scoreboard-dark text-scoreboard-cream">

      <section className="mx-auto max-w-2xl px-6 py-20">

        <div className="border border-scoreboard-cream/25 bg-scoreboard-green p-8">

          <ShieldCheck className="h-8 w-8 text-scoreboard-amber" />

          <p className="scoreboard-label mt-6 text-scoreboard-amber">
            Player Roster Invitation
          </p>

          <h1 className="mt-3 text-3xl font-black uppercase tracking-[0.05em]">
            Team Invitation
          </h1>

          {invitation && (
            <div className="mt-7 border border-scoreboard-cream/20 bg-scoreboard-dark p-5">

              <p className="scoreboard-label">
                Player
              </p>

              <p className="mt-2 text-xl font-black uppercase">
                {invitation.player_first_name}{" "}
                {invitation.player_last_name}
              </p>

              <div className="mt-5 border-t border-scoreboard-cream/15 pt-4">

                <p className="scoreboard-label">
                  Team
                </p>

                <p className="mt-2 font-black uppercase">
                  {invitation.team_name}
                </p>

                <p className="mt-1 text-sm text-scoreboard-muted">
                  {invitation.organization_name}
                </p>

              </div>

            </div>
          )}

          {error && (
            <div className="mt-6 border border-scoreboard-red/60 bg-scoreboard-dark p-4">
              <p className="text-sm text-scoreboard-muted">
                {error}
              </p>
            </div>
          )}

          {user ? (
            <Button
              type="button"
              disabled={accepting}
              onClick={handleAccept}
              className="
                mt-7
                w-full
                rounded-none
                bg-scoreboard-amber
                py-5
                font-black
                uppercase
                tracking-[0.14em]
                text-scoreboard-dark
                hover:bg-scoreboard-cream
              "
            >
              {accepting
                ? "Accepting..."
                : "Accept Roster Invitation"}
            </Button>
          ) : (
            <div className="mt-7">

              <p className="text-sm leading-6 text-scoreboard-muted">
                Sign in or create an account using
                the email address that received this invitation.
              </p>

              <div className="mt-5 grid gap-3 sm:grid-cols-2">

                <Link
                  to={`/login?redirect=${encodeURIComponent(
                    `/player/invitations/${invitationId}`
                  )}`}
                >
                  <Button
                    type="button"
                    variant="outline"
                    className="
                      w-full
                      rounded-none
                      border-scoreboard-cream/40
                      bg-transparent
                      font-black
                      uppercase
                      tracking-[0.12em]
                      text-scoreboard-cream
                    "
                  >
                    Sign In
                  </Button>
                </Link>

                <Link
                  to={`/guardian/register?invitation=${invitationId}&type=player-team`}
                >
                  <Button
                    type="button"
                    className="
                      w-full
                      rounded-none
                      bg-scoreboard-amber
                      font-black
                      uppercase
                      tracking-[0.12em]
                      text-scoreboard-dark
                      hover:bg-scoreboard-cream
                    "
                  >
                    Create Account
                  </Button>
                </Link>

              </div>

            </div>
          )}

        </div>

      </section>

    </main>
  )
}