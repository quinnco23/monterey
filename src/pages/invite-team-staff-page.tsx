import { FormEvent, useEffect, useState } from "react"
import {
  ArrowLeft,
  UserPlus,
} from "lucide-react"
import {
  Link,
  useNavigate,
  useParams,
} from "react-router-dom"

import { Button } from "@/components/ui/button"
import { supabase } from "@/lib/supabase"

type Team = {
  id: string
  organization_id: string
  name: string
}

export function InviteTeamStaffPage() {
  const {
    organizationId,
    teamId,
  } = useParams()

  const navigate = useNavigate()

  const [team, setTeam] =
    useState<Team | null>(null)

  const [firstName, setFirstName] =
    useState("")

  const [lastName, setLastName] =
    useState("")

  const [email, setEmail] =
    useState("")

  const [phone, setPhone] =
    useState("")

  const [staffRole, setStaffRole] =
    useState("assistant_coach")

  const [title, setTitle] =
    useState("")

  const [loading, setLoading] =
    useState(true)

  const [saving, setSaving] =
    useState(false)

  const [error, setError] =
    useState("")

  useEffect(() => {
    async function loadTeam() {
      if (!organizationId || !teamId) {
        setError(
          "Missing organization or team ID."
        )

        setLoading(false)
        return
      }

      const {
        data,
        error,
      } = await supabase
        .from("teams")
        .select(`
          id,
          organization_id,
          name
        `)
        .eq("id", teamId)
        .eq(
          "organization_id",
          organizationId
        )
        .maybeSingle()

      if (error) {
        setError(error.message)
        setLoading(false)
        return
      }

      if (!data) {
        setError("Team not found.")
        setLoading(false)
        return
      }

      setTeam(data)
      setLoading(false)
    }

    void loadTeam()
  }, [organizationId, teamId])

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault()

    if (
      !organizationId ||
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
        "You must be signed in to invite team staff."
      )

      setSaving(false)
      return
    }

    const normalizedEmail =
      email.trim().toLowerCase()

    const {
      data: invite,
      error: inviteError,
    } = await supabase
      .from(
        "team_staff_invitations"
      )
      .insert({
        team_id: teamId,
        organization_id:
          organizationId,

        email:
          normalizedEmail,

        first_name:
          firstName.trim() || null,

        last_name:
          lastName.trim() || null,

        phone:
          phone.trim() || null,

        staff_role:
          staffRole,

        title:
          title.trim() || null,

        invited_by_user_id:
          user.id,

        status:
          "pending",
      })
      .select(`
        id,
        email,
        staff_role,
        status
      `)
      .single()

    if (inviteError) {
      console.error(
        "TEAM STAFF INVITE ERROR:",
        inviteError
      )

      setError(
        inviteError.message
      )

      setSaving(false)
      return
    }

    const {
        data: emailData,
        error: emailError,
      } = await supabase.functions.invoke(
        "send-team-staff-invitation",
        {
          body: {
            invitationId: invite.id,
          },
        }
      )
      
      if (emailError) {
        console.error(
          "TEAM STAFF EMAIL ERROR:",
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
        "TEAM STAFF INVITATION EMAIL SENT:",
        emailData
      )

    console.log(
      "TEAM STAFF INVITATION CREATED:",
      invite
    )

    /*
     * Email send will go here next.
     *
     * We'll use:
     * send-team-staff-invitation
     *
     * just like:
     * send-guardian-invitation
     */

    navigate(
      `/dashboard/organizations/${organizationId}/teams/${teamId}`
    )
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-scoreboard-dark px-6 py-12 text-scoreboard-cream">
        <div className="mx-auto max-w-3xl">
          <p className="scoreboard-label">
            Loading Team...
          </p>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-scoreboard-dark text-scoreboard-cream">

      <section className="border-b border-scoreboard-cream/20 bg-scoreboard-green">
        <div className="mx-auto max-w-3xl px-6 py-10">

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
              hover:text-scoreboard-amber
            "
          >
            <ArrowLeft className="h-4 w-4" />
            Team Dashboard
          </Link>

          <p className="scoreboard-label mt-8 text-scoreboard-amber">
            Team Staff
          </p>

          <h1 className="mt-3 text-4xl font-black uppercase tracking-[0.06em]">
            Invite Coach / Staff
          </h1>

          {team && (
            <p className="mt-3 text-sm text-scoreboard-muted">
              Invite a coach or staff member
              to{" "}
              <span className="font-bold text-scoreboard-cream">
                {team.name}
              </span>
            </p>
          )}

        </div>
      </section>

      <section className="mx-auto max-w-3xl px-6 py-10">

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

            <Field
              label="First Name"
              value={firstName}
              onChange={setFirstName}
            />

            <Field
              label="Last Name"
              value={lastName}
              onChange={setLastName}
            />

            <Field
              label="Email"
              value={email}
              onChange={setEmail}
              type="email"
              required
            />

            <Field
              label="Phone"
              value={phone}
              onChange={setPhone}
              type="tel"
            />

            <label className="block">
              <span className="scoreboard-label text-scoreboard-cream">
                Staff Role
              </span>

              <select
                value={staffRole}
                onChange={(e) =>
                  setStaffRole(
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
                "
              >
                <option value="head_coach">
                  Head Coach
                </option>

                <option value="assistant_coach">
                  Assistant Coach
                </option>

                <option value="team_manager">
                  Team Manager
                </option>

                <option value="trainer">
                  Trainer
                </option>

                <option value="scorekeeper">
                  Scorekeeper
                </option>
              </select>
            </label>

            <Field
              label="Title"
              value={title}
              onChange={setTitle}
            />

          </div>

          <div className="mt-6 border border-scoreboard-cream/20 bg-scoreboard-dark p-4">

            <p className="scoreboard-label text-scoreboard-amber">
              Staff Access
            </p>

            <p className="mt-2 text-sm leading-6 text-scoreboard-muted">
              This invitation will give the
              recipient access to the team
              according to their assigned staff
              role after they accept.
            </p>

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
              : "Invite Coach / Staff"}
          </Button>

        </form>

      </section>

    </main>
  )
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  required = false,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  type?: string
  required?: boolean
}) {
  return (
    <label className="block">

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
          text-base
          text-scoreboard-dark
          outline-none
          focus:border-scoreboard-amber
        "
      />

    </label>
  )
}