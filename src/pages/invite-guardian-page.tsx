import { useEffect, useState } from "react"
import { ArrowLeft, Mail, UserPlus } from "lucide-react"
import { Link, useNavigate, useParams } from "react-router-dom"

import { Button } from "@/components/ui/button"
import { supabase } from "@/lib/supabase"

type Player = {
  id: string
  first_name: string
  last_name: string
  organization_id: string
}

export function InviteGuardianPage() {
  const { organizationId, playerId } = useParams()
  const navigate = useNavigate()

  const [player, setPlayer] = useState<Player | null>(null)

  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [relationship, setRelationship] = useState("parent")

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    async function loadPlayer() {
      if (!organizationId || !playerId) {
        setError("Missing organization or player ID.")
        setLoading(false)
        return
      }

      const { data, error } = await supabase
        .from("players")
        .select(`
          id,
          first_name,
          last_name,
          organization_id
        `)
        .eq("id", playerId)
        .eq("organization_id", organizationId)
        .maybeSingle()

      if (error) {
        setError(error.message)
        setLoading(false)
        return
      }

      if (!data) {
        setError("Player not found.")
        setLoading(false)
        return
      }

      setPlayer(data)
      setLoading(false)
    }

    void loadPlayer()
  }, [organizationId, playerId])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!organizationId || !playerId) return

    setSaving(true)
    setError("")

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError) {
      setError(userError.message)
      setSaving(false)
      return
    }

    if (!user) {
      setError("You must be signed in.")
      setSaving(false)
      return
    }

    const normalizedEmail =
      email.trim().toLowerCase()

    const { data, error: inviteError } = await supabase
      .from("player_guardian_invitations")
      .insert({
        player_id: playerId,
        organization_id: organizationId,

        email: normalizedEmail,

        first_name:
          firstName.trim() || null,

        last_name:
          lastName.trim() || null,

        phone:
          phone.trim() || null,

        relationship,

        invited_by_user_id:
          user.id,

        status:
          "pending",
      })
      .select(`
        id,
        email,
        player_id,
        status
      `)
      .single()

    if (inviteError) {
      setError(inviteError.message)
      setSaving(false)
      return
    }

    const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession()
      
      console.log("INVITE SESSION:", session)
      console.log("INVITE SESSION ERROR:", sessionError)
      console.log(
        "INVITE ACCESS TOKEN PRESENT:",
        Boolean(session?.access_token)
      )

    const {
        data: emailData,
        error: emailError,
      } = await supabase.functions.invoke(
        "send-guardian-invitation",
        {
          body: {
            invitationId: data.id,
          },
        }
      )
      
      if (emailError) {
        console.error(
          "GUARDIAN EMAIL ERROR:",
          emailError
        )
      
        try {
          const response =
            await emailError.context.json()
      
          console.error(
            "EDGE FUNCTION RESPONSE:",
            response
          )
        } catch (contextError) {
          console.error(
            "Could not read Edge Function response:",
            contextError
          )
        }
      
        setError(
          "Invitation was created, but the email could not be sent."
        )
      
        setSaving(false)
        return
      }
      
      console.log(
        "GUARDIAN INVITATION EMAIL SENT:",
        emailData
      )
      
      // -------------------------------------
      // RETURN TO PLAYER PROFILE
      // -------------------------------------
      
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

      <section className="border-b border-scoreboard-cream/20 bg-scoreboard-green">
        <div className="mx-auto max-w-4xl px-6 py-10">

          <Link
            to={`/dashboard/organizations/${organizationId}/players/${playerId}`}
            className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.14em] text-scoreboard-muted hover:text-scoreboard-amber"
          >
            <ArrowLeft className="h-4 w-4" />
            Player Profile
          </Link>

          <p className="scoreboard-label mt-8 text-scoreboard-amber">
            Guardian Access
          </p>

          <h1 className="mt-3 text-4xl font-black uppercase tracking-[0.06em]">
            Invite Parent / Guardian
          </h1>

          {player && (
            <p className="mt-3 text-sm text-scoreboard-muted">
              Invite a parent or guardian for{" "}
              <span className="font-bold text-scoreboard-cream">
                {player.first_name} {player.last_name}
              </span>
            </p>
          )}
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-6 py-10">

        <form
          onSubmit={handleSubmit}
          className="
            border
            border-scoreboard-cream/25
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
            />

            <PlayerInput
              label="Last Name"
              value={lastName}
              onChange={setLastName}
            />

            <PlayerInput
              label="Email"
              value={email}
              onChange={setEmail}
              type="email"
              required
            />

            <PlayerInput
              label="Phone"
              value={phone}
              onChange={setPhone}
              type="tel"
            />

            <label className="sm:col-span-2">
              <span className="scoreboard-label text-scoreboard-cream">
                Relationship
              </span>

              <select
                value={relationship}
                onChange={(e) =>
                  setRelationship(e.target.value)
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
                <option value="parent">Parent</option>
                <option value="mother">Mother</option>
                <option value="father">Father</option>
                <option value="guardian">Guardian</option>
                <option value="grandparent">Grandparent</option>
                <option value="other">Other</option>
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
            disabled={saving}
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
            <UserPlus className="mr-2 h-4 w-4" />

            {saving
              ? "Creating Invitation..."
              : "Create Guardian Invitation"}
          </Button>

        </form>

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
      />
    </label>
  )
}