import { useEffect, useState } from "react"
import {
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  ShieldCheck,
  UserRound,
  Users,
} from "lucide-react"

import { Link } from "react-router-dom"

import { supabase } from "@/lib/supabase"

type GuardianPlayer = {
  id: string
  relationship: string
  is_primary: boolean

  player: {
    id: string
    first_name: string
    last_name: string
    birth_date: string | null
    graduation_year: number | null
  } | null
}

export function GuardianDashboardPage() {
  const [guardianPlayers, setGuardianPlayers] =
    useState<GuardianPlayer[]>([])

  const [loading, setLoading] =
    useState(true)

  const [error, setError] =
    useState("")

  const [guardianName, setGuardianName] =
    useState("")

  useEffect(() => {
    async function loadGuardianDashboard() {
      setLoading(true)
      setError("")

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser()

      if (userError || !user) {
        setError("Unable to load guardian account.")
        setLoading(false)
        return
      }

      const firstName =
        user.user_metadata?.first_name ?? ""

      setGuardianName(firstName)

      const {
        data,
        error: guardianError,
      } = await supabase
        .from("player_guardians")
        .select(`
          id,
          relationship,
          is_primary,

          player:players (
            id,
            first_name,
            last_name,
            birth_date,
            graduation_year
          )
        `)
        .eq("user_id", user.id)
        .eq("status", "confirmed")
        .order("created_at", {
          ascending: true,
        })

      if (guardianError) {
        console.error(
          "GUARDIAN DASHBOARD ERROR:",
          guardianError
        )

        setError(guardianError.message)
        setLoading(false)
        return
      }

      setGuardianPlayers(
        (data ?? []) as unknown as GuardianPlayer[]
      )

      setLoading(false)
    }

    void loadGuardianDashboard()
  }, [])

  if (loading) {
    return (
      <main className="min-h-screen bg-scoreboard-dark px-6 py-12 text-scoreboard-cream">
        <div className="mx-auto max-w-6xl">
          <p className="scoreboard-label">
            Loading Family Dashboard...
          </p>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-scoreboard-dark text-scoreboard-cream">

      {/* HERO */}
      <section className="border-b border-scoreboard-cream/20 bg-scoreboard-green">
        <div className="mx-auto max-w-6xl px-6 py-12">

          <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">

            <div>

              <p className="scoreboard-label text-scoreboard-amber">
                Parent / Guardian Portal
              </p>

              <h1 className="mt-3 text-4xl font-black uppercase leading-none tracking-[0.05em] sm:text-5xl">
                {guardianName
                  ? `Welcome, ${guardianName}`
                  : "Family Dashboard"}
              </h1>

              <p className="mt-4 max-w-2xl text-sm leading-7 text-scoreboard-muted sm:text-base">
                Manage player information, schedules,
                availability, and team activity from one place.
              </p>

            </div>

            <div className="
              inline-flex
              items-center
              gap-3
              border
              border-scoreboard-cream/25
              bg-scoreboard-dark
              px-5
              py-4
            ">
              <ShieldCheck className="h-5 w-5 text-scoreboard-amber" />

              <div>
                <p className="scoreboard-label text-scoreboard-muted">
                  Account
                </p>

                <p className="mt-1 text-sm font-black uppercase">
                  Guardian Access
                </p>
              </div>
            </div>

          </div>

        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-10">

        {error && (
          <div className="mb-6 border border-scoreboard-red/60 bg-scoreboard-green p-6">
            <p className="scoreboard-label text-scoreboard-amber">
              Unable To Load Dashboard
            </p>

            <p className="mt-3 text-sm text-scoreboard-muted">
              {error}
            </p>
          </div>
        )}

        {/* SUMMARY */}
        <div className="grid border-l border-t border-scoreboard-cream/25 sm:grid-cols-2">

          <SummaryBlock
            label="My Players"
            value={String(guardianPlayers.length)}
            icon={Users}
          />

          <SummaryBlock
            label="Guardian Status"
            value="Confirmed"
            icon={CheckCircle2}
          />

        </div>

        {/* PLAYERS */}
        <div className="mt-8">

          <div className="flex items-end justify-between border-b border-scoreboard-cream/20 pb-4">

            <div>
              <p className="scoreboard-label text-scoreboard-amber">
                Family
              </p>

              <h2 className="mt-2 text-2xl font-black uppercase tracking-[0.06em]">
                My Players
              </h2>
            </div>

            <UserRound className="h-6 w-6 text-scoreboard-amber" />

          </div>

          {guardianPlayers.length === 0 ? (
            <div className="mt-5 border border-scoreboard-cream/20 bg-scoreboard-green p-8">

              <Users className="h-8 w-8 text-scoreboard-amber" />

              <h3 className="mt-5 text-xl font-black uppercase">
                No Players Connected
              </h3>

              <p className="mt-3 max-w-xl text-sm leading-7 text-scoreboard-muted">
                Once you accept a parent or guardian
                invitation, your player will appear here.
              </p>

            </div>
          ) : (
            <div className="mt-5 grid gap-5 md:grid-cols-2">

              {guardianPlayers.map((guardian) => {
                const player = guardian.player

                if (!player) return null

                return (
                  <article
                    key={guardian.id}
                    className="
                      border
                      border-scoreboard-cream/25
                      bg-scoreboard-green
                      p-6
                    "
                  >

                    <div className="flex items-start justify-between gap-4">

                      <div>

                        <p className="scoreboard-label text-scoreboard-amber">
                          {guardian.relationship}
                          {guardian.is_primary
                            ? " • Primary"
                            : ""}
                        </p>

                        <h3 className="mt-3 text-2xl font-black uppercase tracking-[0.05em]">
                          {player.first_name}{" "}
                          {player.last_name}
                        </h3>

                      </div>

                      <ShieldCheck className="h-6 w-6 shrink-0 text-scoreboard-amber" />

                    </div>

                    <div className="mt-6 space-y-3 border-t border-scoreboard-cream/15 pt-5">

                      {player.birth_date && (
                        <div>
                          <p className="scoreboard-label text-scoreboard-muted">
                            Date of Birth
                          </p>

                          <p className="mt-1 text-sm font-bold">
                            {new Date(
                              `${player.birth_date}T12:00:00`
                            ).toLocaleDateString([], {
                              month: "long",
                              day: "numeric",
                              year: "numeric",
                            })}
                          </p>
                        </div>
                      )}

                      {player.graduation_year && (
                        <div>
                          <p className="scoreboard-label text-scoreboard-muted">
                            Graduation Year
                          </p>

                          <p className="mt-1 text-sm font-bold">
                            Class of {player.graduation_year}
                          </p>
                        </div>
                      )}

                    </div>

                    {/* FIRST GUARDIAN ACTION */}
                    <div className="mt-6 border-t border-scoreboard-cream/20 pt-4">

                    <Link
  to={`/guardian/players/${player.id}`}
  className="
    group
    flex
    w-full
    items-center
    justify-between
    text-left
  "
>
  <div>
    <p className="text-xs font-black uppercase tracking-[0.14em]">
      Player Information
    </p>

    <p className="mt-1 text-xs text-scoreboard-muted">
      Review and confirm player details
    </p>
  </div>

  <ChevronRight className="
    h-5
    w-5
    text-scoreboard-amber
    transition-transform
    group-hover:translate-x-1
  " />
</Link>

                    </div>

                  </article>
                )
              })}

            </div>
          )}

        </div>

        {/* UPCOMING / RSVP PLACEHOLDER */}
        <div className="mt-8 border border-scoreboard-cream/25 bg-scoreboard-green p-6">

          <div className="flex items-start justify-between gap-4">

            <div>

              <p className="scoreboard-label text-scoreboard-amber">
                Schedule
              </p>

              <h2 className="mt-2 text-2xl font-black uppercase tracking-[0.06em]">
                Upcoming & RSVP
              </h2>

            </div>

            <CalendarDays className="h-6 w-6 text-scoreboard-amber" />

          </div>

          <div className="mt-6 border-t border-scoreboard-cream/20 pt-5">

            <p className="text-sm leading-7 text-scoreboard-muted">
              Games, practices, tournaments, and player
              availability requests will appear here.
            </p>

          </div>

        </div>

      </section>

    </main>
  )
}

function SummaryBlock({
  label,
  value,
  icon: Icon,
}: {
  label: string
  value: string
  icon: typeof Users
}) {
  return (
    <div className="border-b border-r border-scoreboard-cream/25 bg-scoreboard-green p-6">

      <div className="flex items-center justify-between">

        <p className="scoreboard-label">
          {label}
        </p>

        <Icon className="h-5 w-5 text-scoreboard-amber" />

      </div>

      <div className="scoreboard-number mt-4 text-3xl text-scoreboard-cream">
        {value}
      </div>

    </div>
  )
}