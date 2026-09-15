import { useEffect, useState } from "react"

import {
  ArrowLeft,
  CheckCircle2,
  LogIn,
  UserPlus,
} from "lucide-react"

import {
  Link,
  useNavigate,
  useParams,
} from "react-router-dom"

import { Button } from "@/components/ui/button"
import { supabase } from "@/lib/supabase"

type InvitationDetails = {
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

  roster_id: string | null
  roster_name: string | null
  roster_season_year: number | null
  roster_season_type: string | null
  roster_status: string | null
}

export function PlayerInvitationPage() {
  const {
    invitationId,
  } = useParams()

  const navigate =
    useNavigate()

  const [
    invitation,
    setInvitation,
  ] =
    useState<InvitationDetails | null>(
      null
    )

  const [userEmail, setUserEmail] =
    useState<string | null>(null)

  const [loading, setLoading] =
    useState(true)

  const [accepting, setAccepting] =
    useState(false)

  const [error, setError] =
    useState("")

  const [accepted, setAccepted] =
    useState(false)

  useEffect(() => {
    async function loadInvitation() {
      if (!invitationId) {
        setError(
          "Invitation ID is missing."
        )

        setLoading(false)
        return
      }

      setLoading(true)
      setError("")

      const {
        data:
          invitationRows,
        error:
          invitationError,
      } =
        await supabase.rpc(
          "get_player_team_invitation_details",
          {
            invitation_id:
              invitationId,
          }
        )

      if (
        invitationError
      ) {
        console.error(
          "PLAYER INVITATION LOAD ERROR:",
          invitationError
        )

        setError(
          invitationError.message
        )

        setLoading(false)
        return
      }

      const invitationData =
        Array.isArray(
          invitationRows
        )
          ? invitationRows[0]
          : invitationRows

      if (!invitationData) {
        setError(
          "This invitation was not found, has expired, or is no longer available."
        )

        setLoading(false)
        return
      }

      setInvitation(
        invitationData
      )

      const {
        data: {
          user,
        },
      } =
        await supabase.auth.getUser()

      setUserEmail(
        user?.email ?? null
      )

      setLoading(false)
    }

    void loadInvitation()
  }, [invitationId])

  async function handleAccept() {
    if (
      !invitationId ||
      !invitation
    ) {
      return
    }

    setAccepting(true)
    setError("")

    const {
      data,
      error:
        acceptError,
    } =
      await supabase.rpc(
        "accept_player_team_invitation",
        {
          invitation_id:
            invitationId,
        }
      )

    if (acceptError) {
      console.error(
        "PLAYER INVITATION ACCEPT ERROR:",
        acceptError
      )

      setError(
        acceptError.message
      )

      setAccepting(false)
      return
    }

    console.log(
      "PLAYER INVITATION ACCEPTED:",
      data
    )

    setAccepted(true)
    setAccepting(false)
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-scoreboard-dark px-6 py-12 text-scoreboard-cream">

        <div className="mx-auto max-w-2xl">
          <p className="scoreboard-label">
            Loading Invitation...
          </p>
        </div>

      </main>
    )
  }

  if (
    error &&
    !invitation
  ) {
    return (
      <main className="min-h-screen bg-scoreboard-dark px-6 py-12 text-scoreboard-cream">

        <div className="mx-auto max-w-2xl">

          <div className="border border-scoreboard-red/60 bg-scoreboard-green p-6">

            <p className="scoreboard-label text-scoreboard-amber">
              Invitation Unavailable
            </p>

            <p className="mt-3 text-sm leading-7 text-scoreboard-muted">
              {error}
            </p>

            <Link
              to="/"
              className="
                mt-6
                inline-flex
                items-center
                gap-2
                text-xs
                font-black
                uppercase
                tracking-[0.12em]
                text-scoreboard-amber
              "
            >
              <ArrowLeft className="h-4 w-4" />

              Back Home
            </Link>

          </div>

        </div>

      </main>
    )
  }

  if (!invitation) {
    return null
  }

  const playerName =
    `${invitation.player_first_name} ${invitation.player_last_name}`

  const rosterLabel =
    invitation.roster_name ??
    (
      invitation.roster_season_year
        ? `${invitation.roster_season_year} Season`
        : "Team Roster"
    )

  const seasonType =
    invitation.roster_season_type
      ? invitation.roster_season_type.replaceAll(
          "_",
          " "
        )
      : null

  const signedIn =
    Boolean(userEmail)

  const emailMatches =
    userEmail
      ? userEmail.toLowerCase() ===
        invitation.email.toLowerCase()
      : false

  if (accepted) {
    return (
      <main className="min-h-screen bg-scoreboard-dark px-6 py-12 text-scoreboard-cream">

        <div className="mx-auto max-w-2xl">

          <div className="scoreboard-panel p-4">

            <div className="border border-scoreboard-cream/30 bg-scoreboard-green p-8 text-center">

              <CheckCircle2 className="mx-auto h-12 w-12 text-scoreboard-amber" />

              <p className="scoreboard-label mt-6 text-scoreboard-amber">
                Invitation Accepted
              </p>

              <h1 className="mt-3 text-3xl font-black uppercase tracking-[0.06em]">
                {playerName}
              </h1>

              <p className="mt-4 text-sm leading-7 text-scoreboard-muted">
                The roster invitation for{" "}
                <strong className="text-scoreboard-cream">
                  {invitation.team_name}
                </strong>{" "}
                has been accepted.
              </p>

              <p className="mt-2 text-sm text-scoreboard-muted">
                The player is now awaiting roster activation
                and eligibility confirmation.
              </p>

              <Button
                type="button"
                onClick={() =>
                  navigate("/")
                }
                className="
                  mt-7
                  rounded-none
                  bg-scoreboard-amber
                  font-black
                  uppercase
                  tracking-[0.12em]
                  text-scoreboard-dark
                  hover:bg-scoreboard-cream
                "
              >
                Continue
              </Button>

            </div>

          </div>

        </div>

      </main>
    )
  }

  return (
    <main className="min-h-screen bg-scoreboard-dark text-scoreboard-cream">

      <section className="border-b border-scoreboard-cream/20 bg-scoreboard-green">

        <div className="mx-auto max-w-2xl px-6 py-10">

          <p className="scoreboard-label text-scoreboard-amber">
            Roster Invitation
          </p>

          <h1 className="mt-3 text-4xl font-black uppercase tracking-[0.06em]">
            {playerName}
          </h1>

          <p className="mt-3 text-sm text-scoreboard-muted">
            You have been invited to join{" "}
            {invitation.team_name}.
          </p>

        </div>

      </section>

      <section className="mx-auto max-w-2xl px-6 py-10">

        <div className="scoreboard-panel p-4">

          <div className="border border-scoreboard-cream/30 bg-scoreboard-green p-6 sm:p-8">

            <div className="grid gap-4 sm:grid-cols-2">

              <InfoBlock
                label="Organization"
                value={
                  invitation.organization_name
                }
              />

              <InfoBlock
                label="Team"
                value={
                  invitation.team_name
                }
              />

              <InfoBlock
                label="Roster"
                value={
                  rosterLabel
                }
              />

              <InfoBlock
                label="Season"
                value={
                  invitation.roster_season_year
                    ? String(
                        invitation.roster_season_year
                      )
                    : "—"
                }
              />

              {seasonType && (
                <InfoBlock
                  label="Season Type"
                  value={
                    seasonType
                  }
                />
              )}

              <InfoBlock
                label="Invitation Email"
                value={
                  invitation.email
                }
              />

            </div>

            <div className="mt-8 border-t border-scoreboard-cream/20 pt-6">

              {!signedIn ? (
                <>
                  <p className="scoreboard-label text-scoreboard-amber">
                    Account Required
                  </p>

                  <p className="mt-3 text-sm leading-7 text-scoreboard-muted">
                    Sign in or create an account using{" "}
                    <strong className="text-scoreboard-cream">
                      {invitation.email}
                    </strong>
                    {" "}to accept this roster invitation.
                  </p>

                  <div className="mt-6 grid gap-3 sm:grid-cols-2">

                    <Link
                      to={`/login?redirect=/player/invitations/${invitationId}`}
                      className="
                        inline-flex
                        min-h-11
                        items-center
                        justify-center
                        border
                        border-scoreboard-cream/40
                        px-4
                        text-xs
                        font-black
                        uppercase
                        tracking-[0.12em]
                        text-scoreboard-cream
                        hover:border-scoreboard-amber
                        hover:text-scoreboard-amber
                      "
                    >
                      <LogIn className="mr-2 h-4 w-4" />

                      Sign In
                    </Link>

                    <Link
                      to={`/register?redirect=/player/invitations/${invitationId}&email=${encodeURIComponent(invitation.email)}`}
                      className="
                        inline-flex
                        min-h-11
                        items-center
                        justify-center
                        border
                        border-scoreboard-amber
                        bg-scoreboard-amber
                        px-4
                        text-xs
                        font-black
                        uppercase
                        tracking-[0.12em]
                        text-scoreboard-dark
                        hover:bg-scoreboard-cream
                      "
                    >
                      <UserPlus className="mr-2 h-4 w-4" />

                      Create Account
                    </Link>

                  </div>
                </>
              ) : !emailMatches ? (
                <div className="border border-scoreboard-red/60 bg-scoreboard-dark p-4">

                  <p className="scoreboard-label text-scoreboard-amber">
                    Wrong Account
                  </p>

                  <p className="mt-2 text-sm leading-7 text-scoreboard-muted">
                    You are signed in as{" "}
                    <strong className="text-scoreboard-cream">
                      {userEmail}
                    </strong>
                    , but this invitation was sent to{" "}
                    <strong className="text-scoreboard-cream">
                      {invitation.email}
                    </strong>
                    .
                  </p>

                </div>
              ) : (
                <>
                  <p className="scoreboard-label text-scoreboard-amber">
                    Ready To Accept
                  </p>

                  <p className="mt-3 text-sm leading-7 text-scoreboard-muted">
                    Accepting confirms this roster invitation.
                    The team manager will still control roster
                    activation and eligibility.
                  </p>

                  {error && (
                    <div className="mt-5 border border-scoreboard-red/60 bg-scoreboard-dark p-4">
                      <p className="text-sm text-scoreboard-muted">
                        {error}
                      </p>
                    </div>
                  )}

                  <Button
                    type="button"
                    disabled={accepting}
                    onClick={handleAccept}
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
                      disabled:opacity-50
                    "
                  >
                    {accepting
                      ? "Accepting..."
                      : "Accept Roster Invitation"}
                  </Button>
                </>
              )}

            </div>

          </div>

        </div>

      </section>

    </main>
  )
}

function InfoBlock({
  label,
  value,
}: {
  label: string
  value: string
}) {
  return (
    <div className="border border-scoreboard-cream/20 bg-scoreboard-dark/20 p-4">

      <p className="scoreboard-label text-scoreboard-muted">
        {label}
      </p>

      <p className="mt-2 font-black uppercase tracking-[0.04em] text-scoreboard-cream">
        {value}
      </p>

    </div>
  )
}