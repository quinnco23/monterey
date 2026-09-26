import {
    FormEvent,
    useEffect,
    useState,
  } from "react"
  
  import {
    ArrowLeft,
    Mail,
    Send,
    Trophy,
  } from "lucide-react"
  
  import {
    Link,
  } from "react-router-dom"
  
  import { Button } from "@/components/ui/button"
  import { useAuth } from "@/features/auth/auth-context"
  import { supabase } from "@/lib/supabase"
  
  type Tournament = {
    id: string
    name: string
    city: string | null
    state: string | null
    start_date: string
    end_date: string
    status: string
  }
  
  export default function PlatformAdminTournamentInvitePage() {
    const { user } =
      useAuth()
  
    const [
      tournaments,
      setTournaments,
    ] = useState<Tournament[]>([])
  
    const [
      tournamentId,
      setTournamentId,
    ] = useState("")
  
    const [
      email,
      setEmail,
    ] = useState("")
  
    const [
      recipientName,
      setRecipientName,
    ] = useState("")
  
    const [
      organizationName,
      setOrganizationName,
    ] = useState("")
  
    const [
      teamName,
      setTeamName,
    ] = useState("")
  
    const [
      loading,
      setLoading,
    ] = useState(true)
  
    const [
      sending,
      setSending,
    ] = useState(false)
  
    const [
      error,
      setError,
    ] = useState("")
  
    const [
      success,
      setSuccess,
    ] = useState("")
  
  
    // =========================================
    // LOAD TOURNAMENTS
    // =========================================
  
    useEffect(() => {
      async function loadTournaments() {
        setLoading(true)
        setError("")
  
        const {
          data,
          error:
            tournamentsError,
        } = await supabase
          .from("tournaments")
          .select(`
            id,
            name,
            city,
            state,
            start_date,
            end_date,
            status
          `)
          .in(
            "status",
            [
              "registration_open",
              "scheduled",
            ]
          )
          .order(
            "start_date",
            {
              ascending: true,
            }
          )
  
        if (
          tournamentsError
        ) {
          console.error(
            "TOURNAMENT LOAD ERROR:",
            tournamentsError
          )
  
          setError(
            tournamentsError.message
          )
  
          setLoading(false)
  
          return
        }
  
        const rows =
          (data ??
            []) as Tournament[]
  
        setTournaments(
          rows
        )
  
        if (
          rows.length === 1
        ) {
          setTournamentId(
            rows[0].id
          )
        }
  
        setLoading(false)
      }
  
      void loadTournaments()
    }, [])
  
  
    // =========================================
    // SUBMIT INVITATION
    // =========================================
  
    async function handleSubmit(
      event:
        FormEvent<HTMLFormElement>
    ) {
      event.preventDefault()
  
      setError("")
      setSuccess("")
  
      if (!user) {
        setError(
          "You must be signed in."
        )
  
        return
      }
  
      if (!tournamentId) {
        setError(
          "Select a tournament."
        )
  
        return
      }
  
      const normalizedEmail =
        email
          .trim()
          .toLowerCase()
  
      if (!normalizedEmail) {
        setError(
          "Enter an email address."
        )
  
        return
      }
  
      setSending(true)
  
      try {
        // =========================================
        // CREATE INVITATION
        // =========================================
  
        const expiresAt =
          new Date(
            Date.now() +
              30 *
                24 *
                60 *
                60 *
                1000
          ).toISOString()
  
        const {
          data: invitation,
          error:
            invitationError,
        } = await supabase
          .from(
            "platform_invitations"
          )
          .insert({
            email:
              normalizedEmail,
  
            recipient_name:
              recipientName.trim() ||
              null,
  
            tournament_id:
              tournamentId,
  
            organization_name:
              organizationName.trim() ||
              null,
  
            team_name:
              teamName.trim() ||
              null,
  
            invitation_type:
              "tournament",
  
            status:
              "pending",
  
            invited_by_user_id:
              user.id,
  
            expires_at:
              expiresAt,
          })
          .select(`
            id,
            email,
            tournament_id,
            status
          `)
          .single()
  
        if (
          invitationError ||
          !invitation
        ) {
          console.error(
            "INVITATION CREATE ERROR:",
            invitationError
          )
  
          if (
            invitationError?.code ===
            "23505"
          ) {
            setError(
              "An active invitation already exists for this email and tournament."
            )
          } else {
            setError(
              invitationError
                ?.message ??
                "The invitation could not be created."
            )
          }
  
          return
        }
  
  
        // =========================================
        // SEND INVITATION EMAIL
        // =========================================
  
        const {
          data:
            sendResult,
  
          error:
            sendError,
        } =
          await supabase.functions.invoke(
            "send-tournament-invite",
            {
              body: {
                invitationId:
                  invitation.id,
              },
            }
          )
  
  
        if (sendError) {
          console.error(
            "TOURNAMENT INVITE SEND ERROR:",
            sendError
          )
  
          let message =
            "The invitation was created, but the email could not be sent."
  
          try {
            const context =
              (sendError as any)
                ?.context
  
            if (context) {
              const response =
                await context
                  .clone()
                  .json()
  
              console.error(
                "INVITE EDGE FUNCTION RESPONSE:",
                response
              )
  
              if (
                response?.error
              ) {
                message =
                  response.error
              }
            }
          } catch (
            responseError
          ) {
            console.error(
              "Could not read invitation response:",
              responseError
            )
          }
  
          setError(
            message
          )
  
          return
        }
  
  
        console.log(
          "TOURNAMENT INVITE SENT:",
          sendResult
        )
  
  
        const selectedTournament =
          tournaments.find(
            (tournament) =>
              tournament.id ===
              tournamentId
          )
  
  
        setSuccess(
          `Invitation sent to ${normalizedEmail}${
            selectedTournament
              ? ` for ${selectedTournament.name}`
              : ""
          }.`
        )
  
  
        // =========================================
        // RESET RECIPIENT FIELDS
        // Keep tournament selected for quick
        // consecutive invitations.
        // =========================================
  
        setEmail("")
        setRecipientName("")
        setOrganizationName("")
        setTeamName("")
  
      } catch (
        submitError: any
      ) {
        console.error(
          "TOURNAMENT INVITE ERROR:",
          submitError
        )
  
        setError(
          submitError?.message ??
            "The tournament invitation could not be sent."
        )
      } finally {
        setSending(false)
      }
    }
  
  
    const selectedTournament =
      tournaments.find(
        (tournament) =>
          tournament.id ===
          tournamentId
      ) ?? null
  
  
    // =========================================
    // RENDER
    // =========================================
  
    return (
      <main className="min-h-screen bg-scoreboard-dark text-scoreboard-cream">
  
        <section className="border-b border-scoreboard-cream/20 bg-scoreboard-green">
  
          <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
  
            <Link
              to="/dashboard/admin"
              className="
                inline-flex
                items-center
                gap-2
                text-xs
                font-black
                uppercase
                tracking-[0.10em]
                text-scoreboard-muted
                hover:text-scoreboard-amber
              "
            >
              <ArrowLeft className="h-4 w-4" />
  
              Platform Admin
            </Link>
  
  
            <p className="scoreboard-label mt-8 text-scoreboard-amber">
              Team Acquisition
            </p>
  
  
            <h1 className="mt-3 text-3xl font-black uppercase tracking-[0.05em] sm:text-4xl">
              Invite Team
            </h1>
  
  
            <p className="mt-3 max-w-2xl text-sm leading-6 text-scoreboard-muted">
              Send a team or organization an invitation to join SCBC and register for an upcoming tournament.
            </p>
  
          </div>
  
        </section>
  
  
        <section className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
  
          <form
            onSubmit={
              handleSubmit
            }
            className="scoreboard-panel p-4"
          >
  
            <div className="border border-scoreboard-cream/30 bg-scoreboard-green p-6 sm:p-8">
  
              {/* TOURNAMENT */}
  
              <div>
  
                <div className="flex items-start gap-3">
  
                  <Trophy className="mt-1 h-5 w-5 text-scoreboard-amber" />
  
                  <div>
  
                    <p className="scoreboard-label text-scoreboard-amber">
                      Tournament
                    </p>
  
                    <h2 className="mt-2 text-2xl font-black uppercase tracking-[0.05em]">
                      Invitation Details
                    </h2>
  
                  </div>
  
                </div>
  
  
                <label className="mt-6 block">
  
                  <span className="scoreboard-label">
                    Tournament
                  </span>
  
                  <select
                    value={
                      tournamentId
                    }
                    onChange={(
                      event
                    ) =>
                      setTournamentId(
                        event.target.value
                      )
                    }
                    disabled={
                      loading
                    }
                    required
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
  
                    <option value="">
                      Select Tournament
                    </option>
  
  
                    {tournaments.map(
                      (
                        tournament
                      ) => (
                        <option
                          key={
                            tournament.id
                          }
                          value={
                            tournament.id
                          }
                        >
                          {tournament.name}
                        </option>
                      )
                    )}
  
                  </select>
  
                </label>
  
  
                {selectedTournament && (
                  <div className="mt-4 border border-scoreboard-cream/20 bg-scoreboard-dark p-4">
  
                    <p className="font-black uppercase">
                      {
                        selectedTournament.name
                      }
                    </p>
  
                    <p className="mt-2 text-xs uppercase tracking-[0.08em] text-scoreboard-muted">
                      {new Date(
                        `${selectedTournament.start_date}T12:00:00`
                      ).toLocaleDateString()}
  
                      {" – "}
  
                      {new Date(
                        `${selectedTournament.end_date}T12:00:00`
                      ).toLocaleDateString()}
  
                      {(selectedTournament.city ||
                        selectedTournament.state) && (
                          <>
                            {" • "}
  
                            {[
                              selectedTournament.city,
                              selectedTournament.state,
                            ]
                              .filter(
                                Boolean
                              )
                              .join(
                                ", "
                              )}
                          </>
                        )}
  
                    </p>
  
                  </div>
                )}
  
              </div>
  
  
              {/* RECIPIENT */}
  
              <div className="mt-8 border-t border-scoreboard-cream/20 pt-7">
  
                <div className="flex items-center gap-2">
  
                  <Mail className="h-4 w-4 text-scoreboard-amber" />
  
                  <p className="scoreboard-label text-scoreboard-amber">
                    Recipient
                  </p>
  
                </div>
  
  
                <div className="mt-5 grid gap-5 sm:grid-cols-2">
  
                  <label className="block sm:col-span-2">
  
                    <span className="scoreboard-label">
                      Email
                    </span>
  
                    <input
                      type="email"
                      value={
                        email
                      }
                      onChange={(
                        event
                      ) =>
                        setEmail(
                          event.target.value
                        )
                      }
                      placeholder="coach@example.com"
                      required
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
                    />
  
                  </label>
  
  
                  <label className="block">
  
                    <span className="scoreboard-label">
                      Recipient Name
                    </span>
  
                    <input
                      value={
                        recipientName
                      }
                      onChange={(
                        event
                      ) =>
                        setRecipientName(
                          event.target.value
                        )
                      }
                      placeholder="Coach Smith"
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
                    />
  
                  </label>
  
  
                  <label className="block">
  
                    <span className="scoreboard-label">
                      Team Name
                    </span>
  
                    <input
                      value={
                        teamName
                      }
                      onChange={(
                        event
                      ) =>
                        setTeamName(
                          event.target.value
                        )
                      }
                      placeholder="Santa Cruz Waves"
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
                    />
  
                  </label>
  
  
                  <label className="block sm:col-span-2">
  
                    <span className="scoreboard-label">
                      Organization
                    </span>
  
                    <input
                      value={
                        organizationName
                      }
                      onChange={(
                        event
                      ) =>
                        setOrganizationName(
                          event.target.value
                        )
                      }
                      placeholder="Optional organization name"
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
                    />
  
                  </label>
  
                </div>
  
              </div>
  
  
              {/* SUCCESS */}
  
              {success && (
                <div className="mt-6 border border-scoreboard-amber/50 bg-scoreboard-dark p-4">
  
                  <p className="scoreboard-label text-scoreboard-amber">
                    Invitation Sent
                  </p>
  
                  <p className="mt-2 text-sm text-scoreboard-cream">
                    {success}
                  </p>
  
                </div>
              )}
  
  
              {/* ERROR */}
  
              {error && (
                <div className="mt-6 border border-scoreboard-red/60 bg-scoreboard-dark p-4">
  
                  <p className="scoreboard-label text-scoreboard-amber">
                    Invitation Error
                  </p>
  
                  <p className="mt-2 text-sm text-scoreboard-cream">
                    {error}
                  </p>
  
                </div>
              )}
  
  
              {/* SEND */}
  
              <Button
                type="submit"
                disabled={
                  sending ||
                  loading ||
                  !user
                }
                className="
                  mt-7
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
                <Send className="mr-2 h-4 w-4" />
  
                {sending
                  ? "Sending Invitation..."
                  : "Send Tournament Invitation"}
              </Button>
  
            </div>
  
          </form>
  
        </section>
  
      </main>
    )
  }