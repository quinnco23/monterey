import {
  FormEvent,
  useEffect,
  useState,
} from "react"

import {
  Link,
  useLocation,
  useNavigate,
} from "react-router-dom"

import { UserPlus } from "lucide-react"

import { Button } from "@/components/ui/button"
import { supabase } from "@/lib/supabase"
import { PasswordInput } from "@/features/auth/passwoord-input"
import { isStrongPassword } from "@/features/auth/password-utils"

type InvitationDetails = {
  id: string
  email: string
  first_name: string | null
  last_name: string | null
  staff_role: string
  team_name: string
  organization_name: string
}

export function StaffRegisterPage() {
  const navigate = useNavigate()
  const location = useLocation()

  const params =
    new URLSearchParams(location.search)

  const invitationId =
    params.get("invitation")

  const [invitation, setInvitation] =
    useState<InvitationDetails | null>(null)

  const [firstName, setFirstName] =
    useState("")

  const [lastName, setLastName] =
    useState("")

  const [email, setEmail] =
    useState("")

  const [password, setPassword] =
    useState("")

  const [loading, setLoading] =
    useState(true)

  const [saving, setSaving] =
    useState(false)

  const [message, setMessage] =
    useState("")

  useEffect(() => {
    async function loadInvitation() {
      if (!invitationId) {
        setMessage(
          "Missing team staff invitation."
        )
        setLoading(false)
        return
      }

      const {
        data,
        error,
      } = await supabase.rpc(
        "get_team_staff_invitation_details",
        {
          invitation_id:
            invitationId,
        }
      )

      if (error) {
        console.error(
          "STAFF REGISTER INVITE ERROR:",
          error
        )

        setMessage(
          "Unable to load this invitation."
        )

        setLoading(false)
        return
      }

      const invite =
        Array.isArray(data)
          ? data[0] ?? null
          : data

      if (!invite) {
        setMessage(
          "Invitation not found, expired, or no longer available."
        )

        setLoading(false)
        return
      }

      setInvitation(invite)

      setEmail(
        invite.email ?? ""
      )

      setFirstName(
        invite.first_name ?? ""
      )

      setLastName(
        invite.last_name ?? ""
      )

      setLoading(false)
    }

    void loadInvitation()
  }, [invitationId])

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault()

    if (
      !invitationId ||
      !invitation
    ) {
      return
    }

    if (!isStrongPassword(password)) {
      setMessage(
        "Password must be at least 10 characters and include an uppercase letter, lowercase letter, number, and special character."
      )
      return
    }

    setSaving(true)
    setMessage("")

    /*
     * Do not let somebody change the
     * invitation email during registration.
     */
    const normalizedEmail =
      invitation.email
        .trim()
        .toLowerCase()

    const returnPath =
      `/staff/invitations/${invitationId}`

    const { data, error } =
      await supabase.auth.signUp({
        email: normalizedEmail,
        password,

        options: {
          data: {
            first_name:
              firstName.trim(),

            last_name:
              lastName.trim(),
          },

          emailRedirectTo:
            `${window.location.origin}${returnPath}`,
        },
      })

    if (error) {
      console.error(
        "STAFF SIGNUP ERROR:",
        error
      )

      setMessage(error.message)
      setSaving(false)
      return
    }

    /*
     * If email confirmation is disabled,
     * Supabase may create the session immediately.
     */
    if (data.session) {
      navigate(
        returnPath,
        {
          replace: true,
        }
      )

      return
    }

    /*
     * If confirmation is enabled,
     * they will return through emailRedirectTo.
     */
    setMessage(
      "Account created. Check your email to confirm your account, then you'll return to your team invitation."
    )

    setSaving(false)
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-scoreboard-dark px-6 py-12 text-scoreboard-cream">

        <div className="mx-auto max-w-xl">

          <p className="scoreboard-label">
            Loading Invitation...
          </p>

        </div>

      </main>
    )
  }

  return (
    <main className="min-h-screen bg-scoreboard-dark text-scoreboard-cream">

      <section className="mx-auto max-w-xl px-6 py-16">

        <div className="scoreboard-panel p-4">

          <div className="border border-scoreboard-cream/30 bg-scoreboard-green p-6 sm:p-8">

            <UserPlus className="h-8 w-8 text-scoreboard-amber" />

            <p className="scoreboard-label mt-6 text-scoreboard-amber">
              Team Staff Account
            </p>

            <h1 className="mt-3 text-3xl font-black uppercase tracking-[0.06em]">
              Create Your Account
            </h1>

            {invitation && (
              <div className="mt-6 border border-scoreboard-cream/20 bg-scoreboard-dark p-4">

                <p className="scoreboard-label">
                  Invitation
                </p>

                <p className="mt-2 font-black uppercase">
                  {invitation.team_name}
                </p>

                <p className="mt-1 text-sm text-scoreboard-muted">
                  {invitation.organization_name}
                </p>

                <p className="mt-3 text-xs uppercase tracking-[0.10em] text-scoreboard-amber">
                  {invitation.staff_role.replaceAll(
                    "_",
                    " "
                  )}
                </p>

              </div>
            )}

            <form
              onSubmit={handleSubmit}
              className="mt-7 space-y-5"
            >

              <div className="grid gap-4 sm:grid-cols-2">

                <label className="block">

                  <span className="scoreboard-label">
                    First Name
                  </span>

                  <input
                    value={firstName}
                    onChange={(e) =>
                      setFirstName(
                        e.target.value
                      )
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
                  />

                </label>

                <label className="block">

                  <span className="scoreboard-label">
                    Last Name
                  </span>

                  <input
                    value={lastName}
                    onChange={(e) =>
                      setLastName(
                        e.target.value
                      )
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
                  />

                </label>

              </div>

              <label className="block">

                <span className="scoreboard-label">
                  Email
                </span>

                <input
                  type="email"
                  value={email}
                  readOnly
                  className="
                    mt-2
                    w-full
                    cursor-not-allowed
                    rounded-none
                    border
                    border-scoreboard-cream/30
                    bg-scoreboard-cream/80
                    px-3
                    py-3
                    text-scoreboard-dark
                  "
                />

                <p className="mt-2 text-xs text-scoreboard-muted">
                  This must match the email address
                  that received the invitation.
                </p>

              </label>

              <PasswordInput
                value={password}
                onChange={setPassword}
                label="Password"
                showRequirements
              />

              {message && (
                <div className="border border-scoreboard-cream/20 bg-scoreboard-dark p-4">

                  <p className="text-sm leading-6 text-scoreboard-muted">
                    {message}
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
                  ? "Creating Account..."
                  : "Create Staff Account"}
              </Button>

            </form>

            {invitationId && (
              <div className="mt-6 border-t border-scoreboard-cream/20 pt-5">

                <p className="text-sm text-scoreboard-muted">
                  Already have an account?{" "}

                  <Link
                    to={`/login?redirect=${encodeURIComponent(
                      `/staff/invitations/${invitationId}`
                    )}`}
                    className="
                      font-black
                      uppercase
                      tracking-[0.08em]
                      text-scoreboard-amber
                      hover:text-scoreboard-cream
                    "
                  >
                    Sign In
                  </Link>

                </p>

              </div>
            )}

          </div>

        </div>

      </section>

    </main>
  )
}