import { useEffect, useState } from "react"
import {
  CheckCircle2,
  ShieldCheck,
} from "lucide-react"
import {
  Link,
  useParams,
} from "react-router-dom"

import { Button } from "@/components/ui/button"
import { supabase } from "@/lib/supabase"

type StaffInvitation = {
  id: string
  email: string
  first_name: string | null
  last_name: string | null
  staff_role: string
  title: string | null
  status: string
  expires_at: string
  team_id: string
  team_name: string
  organization_id: string
  organization_name: string
}

export function AcceptTeamStaffInvitationPage() {
  const { invitationId } = useParams()

  const [invitation, setInvitation] =
    useState<StaffInvitation | null>(null)

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

      const { data, error } = await supabase.rpc(
        "get_team_staff_invitation_details",
        {
          invitation_id: invitationId,
        }
      )

      if (error) {
        console.error(
          "STAFF INVITATION LOAD ERROR:",
          error
        )

        setError(
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
      "accept_team_staff_invitation",
      {
        invitation_id: invitationId,
      }
    )

    if (error) {
      setError(error.message)
      setAccepting(false)
      return
    }

    console.log(
      "TEAM STAFF LINK CREATED:",
      data
    )

    setAccepted(true)
    setAccepting(false)
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-scoreboard-dark px-6 py-12 text-scoreboard-cream">
        <p className="scoreboard-label">
          Loading Team Invitation...
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
              Team Access Confirmed
            </p>

            <h1 className="mt-3 text-3xl font-black uppercase tracking-[0.05em]">
              You're On The Staff
            </h1>

            <p className="mt-4 text-sm leading-7 text-scoreboard-muted">
              You now have access to this team based on your assigned staff role.
            </p>

            {invitation && (
              <Link
                to={`/dashboard/organizations/${invitation.organization_id}/teams/${invitation.team_id}`}
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
                Go To Team
              </Link>
            )}

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
            Team Staff Invitation
          </p>

          <h1 className="mt-3 text-3xl font-black uppercase tracking-[0.05em]">
            Join The Team
          </h1>

          {invitation && (
            <div className="mt-7 border border-scoreboard-cream/20 bg-scoreboard-dark p-5">

              <p className="scoreboard-label">
                Team
              </p>

              <p className="mt-2 text-xl font-black uppercase">
                {invitation.team_name}
              </p>

              <p className="mt-2 text-sm text-scoreboard-muted">
                {invitation.organization_name}
              </p>

              <p className="mt-4 text-sm text-scoreboard-muted">
                Role:{" "}
                <span className="font-bold text-scoreboard-cream">
                  {invitation.staff_role.replaceAll("_", " ")}
                </span>
              </p>

              {invitation.title && (
                <p className="mt-1 text-sm text-scoreboard-muted">
                  Title: {invitation.title}
                </p>
              )}

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
                : "Accept Team Invitation"}
            </Button>
          ) : (
            <div className="mt-7">

              <p className="text-sm leading-6 text-scoreboard-muted">
                Sign in or create a staff account using
                the email address that received this invitation.
              </p>

              <div className="mt-5 grid gap-3 sm:grid-cols-2">

                <Link
                  to={`/login?redirect=${encodeURIComponent(
                    `/staff/invitations/${invitationId}`
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
                      hover:bg-scoreboard-light
                      hover:text-scoreboard-amber
                    "
                  >
                    Sign In
                  </Button>
                </Link>

                <Link
                  to={`/staff/register?invitation=${invitationId}`}
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
                    Create Staff Account
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