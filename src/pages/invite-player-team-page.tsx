import {
    FormEvent,
    useEffect,
    useState,
  } from "react"
  
  import {
    ArrowLeft,
    Mail,
  } from "lucide-react"
  
  import {
    Link,
    useNavigate,
    useParams,
  } from "react-router-dom"
  
  import { Button } from "@/components/ui/button"
  import { supabase } from "@/lib/supabase"
  
  type Player = {
    id: string
    first_name: string
    last_name: string
  }
  
  type Team = {
    id: string
    name: string
    age_group: string | null
  }
  
  export function InvitePlayerToTeamPage() {
    const {
      organizationId,
      playerId,
    } = useParams()
  
    const navigate = useNavigate()
  
    const [player, setPlayer] =
      useState<Player | null>(null)
  
    const [teams, setTeams] =
      useState<Team[]>([])
  
    const [teamId, setTeamId] =
      useState("")
  
    const [email, setEmail] =
      useState("")
  
    const [loading, setLoading] =
      useState(true)
  
    const [saving, setSaving] =
      useState(false)
  
    const [error, setError] =
      useState("")
  
    useEffect(() => {
      async function loadPage() {
        if (
          !organizationId ||
          !playerId
        ) {
          setError(
            "Missing organization or player ID."
          )
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
            first_name,
            last_name
          `)
          .eq("id", playerId)
          .eq(
            "organization_id",
            organizationId
          )
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
  
        const {
          data: teamData,
          error: teamError,
        } = await supabase
          .from("teams")
          .select(`
            id,
            name,
            age_group
          `)
          .eq(
            "organization_id",
            organizationId
          )
          .eq("status", "active")
          .order("name")
  
        if (teamError) {
          setError(teamError.message)
          setLoading(false)
          return
        }
  
        setPlayer(playerData)
        setTeams(teamData ?? [])
  
        if (
          teamData &&
          teamData.length === 1
        ) {
          setTeamId(teamData[0].id)
        }
  
        setLoading(false)
      }
  
      void loadPage()
    }, [organizationId, playerId])
  
    async function handleSubmit(
      event: FormEvent<HTMLFormElement>
    ) {
      event.preventDefault()
  
      if (
        !organizationId ||
        !playerId ||
        !teamId
      ) {
        return
      }
  
      setSaving(true)
      setError("")
  
      const {
        data: { user },
        error: userError,
      } =
        await supabase.auth.getUser()
  
      if (userError || !user) {
        setError(
          "You must be signed in to invite a player."
        )
        setSaving(false)
        return
      }
  
      const normalizedEmail =
        email.trim().toLowerCase()
  
      /*
       * Create the pending roster record first.
       *
       * If the player is already on this team,
       * update them to invited.
       */
      const {
        error: rosterError,
      } = await supabase
        .from("team_players")
        .upsert(
          {
            team_id: teamId,
            player_id: playerId,
            roster_status: "invited",
            active: false,
          },
          {
            onConflict:
              "team_id,player_id",
          }
        )
  
      if (rosterError) {
        console.error(
          "PLAYER ROSTER INVITE ERROR:",
          rosterError
        )
  
        setError(rosterError.message)
        setSaving(false)
        return
      }
  
      const {
        data: invite,
        error: inviteError,
      } = await supabase
        .from(
          "player_team_invitations"
        )
        .insert({
          organization_id:
            organizationId,
  
          team_id: teamId,
  
          player_id: playerId,
  
          email:
            normalizedEmail,
  
          invited_by_user_id:
            user.id,
  
          status:
            "pending",
        })
        .select(`
          id,
          email,
          status
        `)
        .single()
  
      if (inviteError) {
        console.error(
          "PLAYER TEAM INVITE ERROR:",
          inviteError
        )
  
        setError(
          inviteError.code === "23505"
            ? "A pending invitation already exists for this player and team."
            : inviteError.message
        )
  
        setSaving(false)
        return
      }
  
      const {
        data: emailData,
        error: emailError,
      } =
        await supabase.functions.invoke(
          "send-player-team-invitation",
          {
            body: {
              invitationId:
                invite.id,
            },
          }
        )
  
      if (emailError) {
        console.error(
          "PLAYER INVITATION EMAIL ERROR:",
          emailError
        )
  
        try {
          const response =
            await emailError.context.json()
  
          console.error(
            "EDGE FUNCTION RESPONSE:",
            response
          )
        } catch {
          // Ignore response parsing errors.
        }
  
        setError(
          "Invitation was created, but the email could not be sent."
        )
  
        setSaving(false)
        return
      }
  
      console.log(
        "PLAYER INVITATION EMAIL SENT:",
        emailData
      )
  
      navigate(
        `/dashboard/organizations/${organizationId}/players/${playerId}`
      )
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
  
    return (
      <main className="min-h-screen bg-scoreboard-dark text-scoreboard-cream">
  
        <section className="mx-auto max-w-2xl px-6 py-16">
  
          <Link
            to={`/dashboard/organizations/${organizationId}/players/${playerId}`}
            className="
              inline-flex
              items-center
              gap-2
              text-xs
              font-black
              uppercase
              tracking-[0.12em]
              text-scoreboard-muted
              hover:text-scoreboard-amber
            "
          >
            <ArrowLeft className="h-4 w-4" />
            Player Profile
          </Link>
  
          <div className="mt-8 border border-scoreboard-cream/25 bg-scoreboard-green p-6 sm:p-8">
  
            <Mail className="h-8 w-8 text-scoreboard-amber" />
  
            <p className="scoreboard-label mt-6 text-scoreboard-amber">
              Roster Invitation
            </p>
  
            <h1 className="mt-3 text-3xl font-black uppercase tracking-[0.06em]">
              Invite Player
            </h1>
  
            {player && (
              <p className="mt-3 text-sm text-scoreboard-muted">
                Invite{" "}
                <span className="font-bold text-scoreboard-cream">
                  {player.first_name}{" "}
                  {player.last_name}
                </span>{" "}
                to join a team.
              </p>
            )}
  
            <form
              onSubmit={handleSubmit}
              className="mt-8 space-y-5"
            >
  
              <label className="block">
  
                <span className="scoreboard-label">
                  Team
                </span>
  
                <select
                  value={teamId}
                  required
                  onChange={(event) =>
                    setTeamId(
                      event.target.value
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
                  "
                >
                  <option value="">
                    Select Team
                  </option>
  
                  {teams.map((team) => (
                    <option
                      key={team.id}
                      value={team.id}
                    >
                      {team.age_group
                        ? `${team.age_group} — `
                        : ""}
                      {team.name}
                    </option>
                  ))}
  
                </select>
  
              </label>
  
              <label className="block">
  
                <span className="scoreboard-label">
                  Guardian Email
                </span>
  
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(event) =>
                    setEmail(
                      event.target.value
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
                  "
                />
  
                <p className="mt-2 text-xs leading-5 text-scoreboard-muted">
                  The invitation will be sent to
                  the parent or guardian responsible
                  for accepting this roster spot.
                </p>
  
              </label>
  
              {error && (
                <div className="border border-scoreboard-red/60 bg-scoreboard-dark p-4">
                  <p className="text-sm text-scoreboard-muted">
                    {error}
                  </p>
                </div>
              )}
  
              <Button
                type="submit"
                disabled={saving}
                className="
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
                {saving
                  ? "Sending Invitation..."
                  : "Send Roster Invitation"}
              </Button>
  
            </form>
  
          </div>
  
        </section>
  
      </main>
    )
  }