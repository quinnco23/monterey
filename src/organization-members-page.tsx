import { useEffect, useState } from "react"
import {
  ArrowLeft,
  ShieldCheck,
  UserRound,
  Users,
} from "lucide-react"
import { Link, useParams } from "react-router-dom"

import { supabase } from "@/lib/supabase"

type OrganizationMember = {
    id: string
    organization_id: string
    user_id: string
    role: string
    status: string
    created_at: string
  
    profile: {
      id: string
      first_name: string | null
      last_name: string | null
      email: string | null
    } | null
  }

export function OrganizationMembersPage() {
  const { organizationId } = useParams()

  const [organizationName, setOrganizationName] = useState("")
  const [members, setMembers] = useState<OrganizationMember[]>([])

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    async function loadMembers() {
      if (!organizationId) {
        setError("Missing organization ID.")
        setLoading(false)
        return
      }
  
      setLoading(true)
      setError("")
  
      const [
        organizationResult,
        membersResult,
      ] = await Promise.all([
        supabase
          .from("organizations")
          .select(`
            id,
            name
          `)
          .eq("id", organizationId)
          .single(),
  
        supabase
          .from("organization_members")
          .select(`
            id,
            organization_id,
            user_id,
            role,
            status,
            created_at
          `)
          .eq("organization_id", organizationId)
          .order("created_at", {
            ascending: true,
          }),
      ])
  
      if (organizationResult.error) {
        setError(organizationResult.error.message)
        setLoading(false)
        return
      }
  
      if (membersResult.error) {
        setError(membersResult.error.message)
        setLoading(false)
        return
      }
  
      const userIds = (membersResult.data ?? []).map(
        (member) => member.user_id
      )
  
      const { data: profileData, error: profileError } =
        userIds.length > 0
          ? await supabase
              .from("profiles")
              .select(`
                id,
                first_name,
                last_name,
                email
              `)
              .in("id", userIds)
          : {
              data: [],
              error: null,
            }
  
      if (profileError) {
        setError(profileError.message)
        setLoading(false)
        return
      }
  
      const profileMap = new Map(
        (profileData ?? []).map((profile) => [
          profile.id,
          profile,
        ])
      )
  
      const combinedMembers = (membersResult.data ?? []).map(
        (member) => ({
          ...member,
  
          profile:
            profileMap.get(member.user_id) ?? null,
        })
      )
  
      setOrganizationName(
        organizationResult.data?.name ?? "Organization"
      )
  
      setMembers(
        combinedMembers as OrganizationMember[]
      )
  
      setLoading(false)
    }
  
    void loadMembers()
  }, [organizationId])

  const activeCount = members.filter(
    (member) => member.status === "active"
  ).length

  if (loading) {
    return (
      <main className="min-h-screen bg-scoreboard-dark px-4 py-12 text-scoreboard-cream sm:px-6">
        <div className="mx-auto max-w-6xl">
          <p className="scoreboard-label">
            Loading Members...
          </p>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-scoreboard-dark text-scoreboard-cream">

      <section className="border-b border-scoreboard-cream/20 bg-scoreboard-green">
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">

          <Link
            to={`/dashboard/organizations/${organizationId}`}
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
            Organization Dashboard
          </Link>

          <div className="mt-8 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">

            <div>
              <p className="scoreboard-label text-scoreboard-amber">
                {organizationName}
              </p>

              <h1 className="mt-3 text-3xl font-black uppercase tracking-[0.05em] sm:text-4xl">
                Members & Staff
              </h1>

              <p className="mt-4 max-w-2xl text-sm leading-7 text-scoreboard-muted">
                Manage organization owners, admins, coaches,
                managers, scorekeepers, and members.
              </p>
            </div>

            <div className="border border-scoreboard-cream/25 bg-scoreboard-dark px-5 py-4">

              <p className="scoreboard-label">
                Active
              </p>

              <p className="scoreboard-number mt-1 text-2xl text-scoreboard-amber">
                {activeCount}
              </p>

            </div>

          </div>

        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6">

        {error && (
          <div className="mb-6 border border-scoreboard-red/60 bg-scoreboard-green p-5">

            <p className="scoreboard-label text-scoreboard-amber">
              Unable To Load Members
            </p>

            <p className="mt-3 text-sm text-scoreboard-muted">
              {error}
            </p>

          </div>
        )}

        {!error && members.length === 0 && (
          <div className="border border-scoreboard-cream/20 bg-scoreboard-green p-8">

            <Users className="h-7 w-7 text-scoreboard-amber" />

            <h2 className="mt-5 text-xl font-black uppercase tracking-[0.05em]">
              No Members Found
            </h2>

            <p className="mt-3 text-sm text-scoreboard-muted">
              Organization members will appear here.
            </p>

          </div>
        )}

        {!error && members.length > 0 && (
          <div className="border border-scoreboard-cream/25">

            <div className="hidden grid-cols-[1.4fr_.7fr_.6fr] border-b border-scoreboard-cream/20 bg-scoreboard-green px-5 py-3 text-xs font-black uppercase tracking-[0.10em] text-scoreboard-muted md:grid">

              <span>Member</span>
              <span>Role</span>
              <span>Status</span>

            </div>

            {members.map((member) => {
              const firstName =
                member.profile?.first_name ?? ""

              const lastName =
                member.profile?.last_name ?? ""

              const fullName =
                `${firstName} ${lastName}`.trim()

              const displayName =
                fullName ||
                member.profile?.email ||
                "Organization Member"

              return (
                <article
                  key={member.id}
                  className="
                    grid
                    gap-4
                    border-b
                    border-scoreboard-cream/15
                    bg-scoreboard-green
                    p-5
                    last:border-b-0
                    md:grid-cols-[1.4fr_.7fr_.6fr]
                    md:items-center
                  "
                >

                  <div className="min-w-0">

                    <div className="flex items-center gap-3">

                      <div
                        className="
                          flex
                          h-10
                          w-10
                          shrink-0
                          items-center
                          justify-center
                          border
                          border-scoreboard-cream/25
                          bg-scoreboard-dark
                        "
                      >
                        <UserRound className="h-5 w-5 text-scoreboard-amber" />
                      </div>

                      <div className="min-w-0">

                        <p className="break-words font-black uppercase tracking-[0.04em]">
                          {displayName}
                        </p>

                        {member.profile?.email && (
                          <p className="mt-1 break-all text-xs text-scoreboard-muted">
                            {member.profile.email}
                          </p>
                        )}

                      </div>

                    </div>

                  </div>

                  <div>

                    <span className="scoreboard-label md:hidden">
                      Role
                    </span>

                    <div className="mt-1 flex items-center gap-2 md:mt-0">

                      <ShieldCheck className="h-4 w-4 text-scoreboard-amber" />

                      <span className="text-sm font-black uppercase tracking-[0.08em]">
                        {member.role.replaceAll("_", " ")}
                      </span>

                    </div>

                  </div>

                  <div>

                    <span className="scoreboard-label md:hidden">
                      Status
                    </span>

                    <span
                      className={
                        member.status === "active"
                          ? `
                            mt-1
                            inline-flex
                            border
                            border-scoreboard-amber/50
                            px-3
                            py-2
                            text-[10px]
                            font-black
                            uppercase
                            tracking-[0.10em]
                            text-scoreboard-amber
                            md:mt-0
                          `
                          : `
                            mt-1
                            inline-flex
                            border
                            border-scoreboard-cream/20
                            px-3
                            py-2
                            text-[10px]
                            font-black
                            uppercase
                            tracking-[0.10em]
                            text-scoreboard-muted
                            md:mt-0
                          `
                      }
                    >
                      {member.status}
                    </span>

                  </div>

                </article>
              )
            })}

          </div>
        )}

      </section>

    </main>
  )
}