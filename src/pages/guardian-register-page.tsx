import { FormEvent, useEffect, useState } from "react"
import {
  Link,
  Navigate,
  useNavigate,
  useSearchParams,
} from "react-router-dom"

import { Button } from "@/components/ui/button"
import { PasswordInput } from "@/features/auth/passwoord-input"
import { isStrongPassword } from "@/features/auth/password-utils"
import { useAuth } from "@/features/auth/auth-context"
import { supabase } from "@/lib/supabase"

type GuardianInvitation = {
  id: string
  email: string
  first_name: string | null
  last_name: string | null
  relationship: string | null
  status: string
  expires_at: string
}

export function GuardianRegisterPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const { user, loading: authLoading } = useAuth()

  const invitationId =
    searchParams.get("invitation")

  const [invitation, setInvitation] =
    useState<GuardianInvitation | null>(null)

  const [firstName, setFirstName] =
    useState("")

  const [lastName, setLastName] =
    useState("")

  const [email, setEmail] =
    useState("")

  const [password, setPassword] =
    useState("")

  const [pageLoading, setPageLoading] =
    useState(true)

  const [loading, setLoading] =
    useState(false)

  const [message, setMessage] =
    useState("")

  useEffect(() => {
    async function loadInvitation() {
      if (!invitationId) {
        setMessage(
          "Guardian invitation is missing."
        )
        setPageLoading(false)
        return
      }

      /*
       * Because an unsigned user cannot necessarily read
       * player_guardian_invitations through your current RLS,
       * we'll initially use the invitation ID to preserve the flow.
       *
       * Once we add a public-safe invitation lookup RPC,
       * we can load and lock the invited email here.
       */

      setPageLoading(false)
    }

    void loadInvitation()
  }, [invitationId])

  /*
   * If somebody reaches this page while already signed in,
   * send them straight back to the invitation.
   */
  if (
    !authLoading &&
    user &&
    invitationId
  ) {
    return (
      <Navigate
        to={`/guardian/invitations/${invitationId}`}
        replace
      />
    )
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault()

    if (!invitationId) {
      setMessage(
        "Guardian invitation is missing."
      )
      return
    }

    if (!isStrongPassword(password)) {
      setMessage(
        "Password must be at least 10 characters and include an uppercase letter, lowercase letter, number, and special character."
      )
      return
    }

    setLoading(true)
    setMessage("")

    const invitationUrl =
      `${window.location.origin}/guardian/invitations/${invitationId}`

    const {
      data,
      error,
    } = await supabase.auth.signUp({
      email: email.trim().toLowerCase(),

      password,

      options: {
        data: {
          first_name:
            firstName.trim(),

          last_name:
            lastName.trim(),
        },

        /*
         * After Supabase email confirmation,
         * return directly to the invitation.
         */
        emailRedirectTo:
          invitationUrl,
      },
    })

    if (error) {
      setMessage(error.message)
      setLoading(false)
      return
    }

    /*
     * If email confirmation is disabled,
     * Supabase gives us a session immediately.
     */
    if (data.session) {
      navigate(
        `/guardian/invitations/${invitationId}`,
        {
          replace: true,
        }
      )

      return
    }

    setMessage(
      "Account created. Check your email to confirm your account. After confirmation, you'll return to your guardian invitation."
    )

    setLoading(false)
  }

  if (pageLoading || authLoading) {
    return (
      <main className="flex min-h-[calc(100vh-73px)] items-center bg-scoreboard-dark px-6 py-12 text-scoreboard-cream">
        <div className="mx-auto w-full max-w-md">
          <p className="scoreboard-label">
            Loading Invitation...
          </p>
        </div>
      </main>
    )
  }

  return (
    <main className="flex min-h-[calc(100vh-73px)] items-center bg-scoreboard-dark px-6 py-12 text-scoreboard-cream">

      <div className="mx-auto w-full max-w-md">

        <div className="scoreboard-panel p-4">

          <div className="border border-scoreboard-cream/35 bg-scoreboard-green p-6 sm:p-8">

            <div className="border-b border-scoreboard-cream/25 pb-5">

              <p className="scoreboard-label text-scoreboard-amber">
                Parent / Guardian
              </p>

              <h1 className="mt-3 text-3xl font-black uppercase leading-tight tracking-[0.06em]">
                Create Your Account
              </h1>

              <p className="mt-3 text-sm leading-6 text-scoreboard-muted">
                Create your account to connect with your
                player's team, schedules, events, and
                availability requests.
              </p>

            </div>

            <form
              onSubmit={handleSubmit}
              className="mt-7 space-y-5"
            >

              <div className="grid gap-4 sm:grid-cols-2">

                <label className="block">
                  <span className="scoreboard-label text-scoreboard-cream">
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
                      text-base
                      text-scoreboard-dark
                      outline-none
                      focus:border-scoreboard-amber
                    "
                  />
                </label>

                <label className="block">
                  <span className="scoreboard-label text-scoreboard-cream">
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
                      text-base
                      text-scoreboard-dark
                      outline-none
                      focus:border-scoreboard-amber
                    "
                  />
                </label>

              </div>

              <label className="block">

                <span className="scoreboard-label text-scoreboard-cream">
                  Email
                </span>

                <input
                  type="email"
                  value={email}
                  onChange={(e) =>
                    setEmail(e.target.value)
                  }
                  required
                  autoComplete="email"
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

              <PasswordInput
                value={password}
                onChange={setPassword}
                label="Password"
                showRequirements
              />

              <Button
                type="submit"
                disabled={loading}
                className="
                  w-full
                  rounded-none
                  border
                  border-scoreboard-amber
                  bg-scoreboard-amber
                  py-5
                  font-black
                  uppercase
                  tracking-[0.14em]
                  text-scoreboard-dark
                  hover:bg-scoreboard-cream
                "
              >
                {loading
                  ? "Creating Account..."
                  : "Create Guardian Account"}
              </Button>

            </form>

            {message && (
              <div className="mt-5 border border-scoreboard-cream/20 bg-scoreboard-dark px-4 py-3">

                <p className="text-sm leading-6 text-scoreboard-muted">
                  {message}
                </p>

              </div>
            )}

            <div className="mt-7 border-t border-scoreboard-cream/20 pt-5">

              <p className="text-sm text-scoreboard-muted">
                Already have an account?{" "}

                <Link
                  to={`/login?redirect=${encodeURIComponent(
                    `/guardian/invitations/${invitationId}`
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

          </div>

        </div>

      </div>

    </main>
  )
}