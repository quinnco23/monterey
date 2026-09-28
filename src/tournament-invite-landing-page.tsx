import {
    useEffect,
    useState,
  } from "react"
  
  import {
    ArrowRight,
    CalendarDays,
    MapPin,
    Trophy,
  } from "lucide-react"
  
  import {
    Link,
    useParams,
  } from "react-router-dom"
  
  import { Button } from "@/components/ui/button"
  import { useAuth } from "@/features/auth/auth-context"
  import { supabase } from "@/lib/supabase"
  
  type TournamentInviteData = {
    valid: boolean
    reason?: string
  
    invitation_id?: string
    recipient_name?: string | null
    organization_name?: string | null
    team_name?: string | null
    status?: string | null
    expires_at?: string | null
  
    tournament?: {
      id: string
      name: string
      slug: string
      city: string | null
      state: string | null
      start_date: string
      end_date: string
      status: string
    }
  }
  
  export default function TournamentInviteLandingPage() {
    const { token } =
      useParams()
  
    const { user } =
      useAuth()
  
    const [
      invite,
      setInvite,
    ] =
      useState<TournamentInviteData | null>(
        null
      )
  
    const [
      loading,
      setLoading,
    ] = useState(true)
  
    const [
      error,
      setError,
    ] = useState("")
  
  
    useEffect(() => {
      async function loadInvitation() {
        if (!token) {
          setError(
            "This tournament invitation is missing its invitation token."
          )
  
          setLoading(false)
  
          return
        }
  
        setLoading(true)
        setError("")
  
        const {
          data,
          error:
            invitationError,
        } = await supabase.rpc(
          "get_tournament_invitation_by_token",
          {
            target_token:
              token,
          }
        )
  
        if (
          invitationError
        ) {
          console.error(
            "TOURNAMENT INVITE LOOKUP ERROR:",
            invitationError
          )
  
          setError(
            "This tournament invitation could not be loaded."
          )
  
          setLoading(false)
  
          return
        }
  
        const result =
          data as TournamentInviteData | null
  
        setInvite(
          result
        )
  
        setLoading(false)
      }
  
      void loadInvitation()
    }, [
      token,
    ])
  
  
    if (loading) {
      return (
        <main className="min-h-screen bg-scoreboard-dark px-4 py-16 text-scoreboard-cream sm:px-6">
  
          <div className="mx-auto max-w-3xl">
  
            <p className="scoreboard-label text-scoreboard-amber">
              Tournament Invitation
            </p>
  
            <p className="mt-4 text-sm text-scoreboard-muted">
              Loading invitation...
            </p>
  
          </div>
  
        </main>
      )
    }
  
  
    if (
      error ||
      !invite ||
      !invite.valid ||
      !invite.tournament
    ) {
      const reason =
        invite?.reason
  
      let message =
        error ||
        "This tournament invitation is no longer available."
  
      if (
        reason ===
        "INVITATION_EXPIRED"
      ) {
        message =
          "This tournament invitation has expired."
      }
  
      if (
        reason ===
        "INVITATION_NOT_FOUND"
      ) {
        message =
          "This tournament invitation could not be found."
      }
  
      if (
        reason ===
        "TOURNAMENT_NOT_FOUND"
      ) {
        message =
          "The tournament connected to this invitation could not be found."
      }
  
      return (
        <main className="min-h-screen bg-scoreboard-dark px-4 py-16 text-scoreboard-cream sm:px-6">
  
          <div className="mx-auto max-w-3xl">
  
            <div className="border border-scoreboard-red/60 bg-scoreboard-green p-8">
  
              <p className="scoreboard-label text-scoreboard-amber">
                Tournament Invitation
              </p>
  
              <h1 className="mt-3 text-3xl font-black uppercase tracking-[0.05em]">
                Invitation Unavailable
              </h1>
  
              <p className="mt-4 text-sm leading-6 text-scoreboard-muted">
                {message}
              </p>
  
              <Link
                to="/tournaments"
                className="
                  mt-6
                  inline-flex
                  items-center
                  gap-2
                  border
                  border-scoreboard-cream/30
                  px-4
                  py-3
                  text-xs
                  font-black
                  uppercase
                  tracking-[0.10em]
                  text-scoreboard-cream
                  hover:border-scoreboard-amber
                  hover:text-scoreboard-amber
                "
              >
                View Tournaments
  
                <ArrowRight className="h-4 w-4" />
              </Link>
  
            </div>
  
          </div>
  
        </main>
      )
    }
  
  
    const tournament =
      invite.tournament
  
    const startDate =
      new Date(
        `${tournament.start_date}T12:00:00`
      )
  
    const endDate =
      new Date(
        `${tournament.end_date}T12:00:00`
      )
  
  
    return (
      <main className="min-h-screen bg-scoreboard-dark text-scoreboard-cream">
  
        {/* HERO */}
  
        <section className="border-b border-scoreboard-cream/20 bg-scoreboard-green">
  
          <div className="mx-auto max-w-4xl px-4 py-14 sm:px-6">
  
            <div className="flex items-start gap-3">
  
              <Trophy className="mt-1 h-6 w-6 text-scoreboard-amber" />
  
              <div>
  
                <p className="scoreboard-label text-scoreboard-amber">
                  You're Invited
                </p>
  
                <h1 className="mt-3 text-3xl font-black uppercase leading-tight tracking-[0.05em] sm:text-5xl">
                  {tournament.name}
                </h1>
  
              </div>
  
            </div>
  
  
            <div className="mt-6 flex flex-wrap gap-x-6 gap-y-3 text-sm text-scoreboard-muted">
  
              <div className="flex items-center gap-2">
  
                <CalendarDays className="h-4 w-4 text-scoreboard-amber" />
  
                {startDate.toLocaleDateString(
                  [],
                  {
                    month: "short",
                    day: "numeric",
                  }
                )}
  
                {" – "}
  
                {endDate.toLocaleDateString(
                  [],
                  {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  }
                )}
  
              </div>
  
  
              {(tournament.city ||
                tournament.state) && (
                <div className="flex items-center gap-2">
  
                  <MapPin className="h-4 w-4 text-scoreboard-amber" />
  
                  {[
                    tournament.city,
                    tournament.state,
                  ]
                    .filter(
                      Boolean
                    )
                    .join(
                      ", "
                    )}
  
                </div>
              )}
  
            </div>
  
          </div>
  
        </section>
  
  
        {/* CONTENT */}
  
        <section className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
  
          <div className="scoreboard-panel p-4">
  
            <div className="border border-scoreboard-cream/30 bg-scoreboard-green p-6 sm:p-8">
  
              <p className="scoreboard-label text-scoreboard-amber">
                Tournament Invitation
              </p>
  
  
              <h2 className="mt-3 text-2xl font-black uppercase tracking-[0.05em]">
                Register Your Team
              </h2>
  
  
              <p className="mt-4 max-w-2xl text-sm leading-7 text-scoreboard-muted">
  
                {invite.recipient_name
                  ? `${invite.recipient_name}, you've been invited to enter`
                  : "You've been invited to enter"}
  
                {invite.team_name
                  ? ` ${invite.team_name}`
                  : " your team"}
  
                {" in "}
  
                <strong className="text-scoreboard-cream">
                  {tournament.name}
                </strong>
                .
  
              </p>
  
  
              {(invite.organization_name ||
                invite.team_name) && (
                <div className="mt-6 border border-scoreboard-cream/20 bg-scoreboard-dark p-5">
  
                  <p className="scoreboard-label text-scoreboard-amber">
                    Invitation For
                  </p>
  
                  {invite.team_name && (
                    <p className="mt-2 text-xl font-black uppercase tracking-[0.05em]">
                      {invite.team_name}
                    </p>
                  )}
  
                  {invite.organization_name && (
                    <p className="mt-2 text-sm text-scoreboard-muted">
                      {invite.organization_name}
                    </p>
                  )}
  
                </div>
              )}
  
  
              {/* LOGGED IN */}
  
              {user ? (
                <div className="mt-8">
  
                  <p className="text-sm leading-6 text-scoreboard-muted">
                    You're signed in. Continue to tournament registration to select your organization, team, division, roster, and complete payment.
                  </p>
  
  
                  <Link
                    to={`/tournaments/${tournament.id}/register`}
                    className="mt-5 block"
                  >
                    <Button
                      type="button"
                      className="
                        w-full
                        rounded-none
                        bg-scoreboard-amber
                        py-5
                        font-black
                        uppercase
                        tracking-[0.12em]
                        text-scoreboard-dark
                        hover:bg-scoreboard-cream
                      "
                    >
                      Register Team
  
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
  
                </div>
              ) : (
                <div className="mt-8">
  
                  <p className="text-sm leading-6 text-scoreboard-muted">
                    Create an MBL account or sign in to continue with tournament registration.
                  </p>
  
  
                  <div className="mt-5 grid gap-3 sm:grid-cols-2">
  
                    <Link
                      to={`/register?invite=${token}`}
                    >
                      <Button
                        type="button"
                        className="
                          w-full
                          rounded-none
                          bg-scoreboard-amber
                          py-5
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
  
  
                    <Link
                      to={`/login?invite=${token}`}
                    >
                      <Button
                        type="button"
                        variant="outline"
                        className="
                          w-full
                          rounded-none
                          border-scoreboard-cream/40
                          bg-transparent
                          py-5
                          font-black
                          uppercase
                          tracking-[0.12em]
                          text-scoreboard-cream
                          hover:border-scoreboard-amber
                          hover:bg-scoreboard-dark
                          hover:text-scoreboard-amber
                        "
                      >
                        Sign In
                      </Button>
                    </Link>
  
                  </div>
  
                </div>
              )}
  
  
              <div className="mt-8 border-t border-scoreboard-cream/20 pt-5">
  
                <Link
                  to={`/tournaments/${tournament.id}`}
                  className="
                    text-xs
                    font-black
                    uppercase
                    tracking-[0.10em]
                    text-scoreboard-muted
                    hover:text-scoreboard-amber
                  "
                >
                  View Tournament Details →
                </Link>
  
              </div>
  
            </div>
  
          </div>
  
        </section>
  
      </main>
    )
  }