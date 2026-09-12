import {
  ArrowRight,
  CalendarDays,
  ShieldCheck,
  Users,
  MapPin,
} from "lucide-react"

import { Link } from "react-router-dom"

import { Button } from "@/components/ui/button"
import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/features/auth/auth-context"

type Tournament = {
  id: string
  name: string
  slug: string | null
  description: string | null
  location_name: string | null
  city: string | null
  state: string | null
  start_date: string
  end_date: string
  status: string
}

export function HomePage() {

  const { user } = useAuth()

  const [registeredTournamentIds, setRegisteredTournamentIds] =
    useState<Set<string>>(new Set())

  const [tournaments, setTournaments] =
  useState<Tournament[]>([])

const [tournamentsLoading, setTournamentsLoading] =
  useState(true)

useEffect(() => {
  async function loadTournaments() {
    setTournamentsLoading(true)

    const today =
      new Date().toISOString().slice(0, 10)

      const { data, error } = await supabase
      .from("tournaments")
      .select(`
        id,
        name,
        slug,
        description,
        location_name,
        city,
        state,
        start_date,
        end_date,
        status
      `)
      .in("status", [
        "registration_open",
        "registration_closed",
        "scheduled",
        "in_progress",
        "completed",
      ])
      .gte("end_date", today)
      .order("start_date", { ascending: true })
      .limit(6)

    if (error) {
      console.error(
        "Unable to load tournaments:",
        error
      )

      setTournamentsLoading(false)
      return
    }

    setTournaments(
      (data ?? []) as Tournament[]
    )

    let registeredIds = new Set<string>()

    if (user) {
      const { data: membershipData, error: membershipError } =
        await supabase
          .from("organization_members")
          .select(`
            organization_id,
            role,
            status
          `)
          .eq("user_id", user.id)
          .eq("status", "active")

      if (membershipError) {
        console.error(
          "Unable to load organization memberships:",
          membershipError
        )
      } else {
        const organizationIds =
          (membershipData ?? [])
            .filter((membership) =>
              ["team_manager", "owner", "admin"].includes(
                membership.role
              )
            )
            .map(
              (membership) =>
                membership.organization_id
            )

        if (organizationIds.length > 0) {
          const { data: teamData, error: teamError } =
            await supabase
              .from("teams")
              .select("id")
              .in("organization_id", organizationIds)
              .eq("status", "active")

          if (teamError) {
            console.error(
              "Unable to load teams for registration state:",
              teamError
            )
          } else {
            const teamIds =
              (teamData ?? []).map((team) => team.id)

            if (teamIds.length > 0) {
              const {
                data: registrationData,
                error: registrationError,
              } = await supabase
                .from("tournament_teams")
                .select(`
                  tournament_id,
                  team_id,
                  status
                `)
                .in("team_id", teamIds)

              if (registrationError) {
                console.error(
                  "Unable to load tournament registrations:",
                  registrationError
                )
              } else {
                registeredIds =
                  new Set(
                    (registrationData ?? []).map(
                      (row) => row.tournament_id
                    )
                  )
              }
            }
          }
        }
      }
    }

    setRegisteredTournamentIds(registeredIds)
    setTournamentsLoading(false)
  }

   void loadTournaments()
}, [])

const featuredTournament =
  tournaments.length > 0
    ? tournaments[0]
    : null

return (
<main className="min-h-screen bg-scoreboard-dark text-scoreboard-cream">

{/* TOURNAMENT HERO */}
{/* TOURNAMENT HERO */}
<section className="bg-scoreboard-dark">

  <div className="mx-auto max-w-7xl px-6 pt-10">

    <div className="border border-scoreboard-cream/25 bg-scoreboard-green">

      {tournamentsLoading ? (

        <div className="px-6 py-16 sm:px-10 sm:py-20 lg:px-14 lg:py-24">

          <p className="scoreboard-label text-scoreboard-amber">
            Tournament Schedule
          </p>

          <h1 className="mt-4 text-4xl font-black uppercase tracking-[0.05em]">
            Loading...
          </h1>

        </div>

      ) : featuredTournament ? (

        <div className="px-6 py-16 sm:px-10 sm:py-20 lg:px-14 lg:py-24">

          <div className="flex items-center justify-between border-b border-scoreboard-cream/20 pb-5">

            <p className="scoreboard-label text-scoreboard-amber">
              {featuredTournament.name}
            </p>

            <div className="hidden items-center gap-2 sm:flex">

              <span className="h-2.5 w-2.5 bg-scoreboard-red" />

              <span className="text-xs font-black uppercase tracking-[0.14em] text-scoreboard-muted">
                {featuredTournament.status === "registration_open"
                  ? "Registration Open"
                  : featuredTournament.status.replaceAll(
                      "_",
                      " "
                    )}
              </span>

            </div>

          </div>

          <div className="pt-10">

            <p className="scoreboard-label text-scoreboard-muted">
              Featured Tournament
            </p>

            <h1 className="mt-4 text-5xl font-black uppercase leading-[0.95] tracking-[0.03em] sm:text-6xl lg:text-7xl">

              {featuredTournament.name}

              <br />

              <span className="text-scoreboard-amber">

                {new Date(
                  `${featuredTournament.start_date}T12:00:00`
                ).toLocaleDateString([], {
                  month: "short",
                  day: "numeric",
                })}

                {" – "}

                {new Date(
                  `${featuredTournament.end_date}T12:00:00`
                ).toLocaleDateString([], {
                  month: "short",
                  day: "numeric",
                })}

              </span>

            </h1>

            {(
  featuredTournament.location_name ||
  featuredTournament.city ||
  featuredTournament.state
) && (
  <div className="mt-6 flex items-start gap-3">
    <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-scoreboard-amber" />

    <div>
      {featuredTournament.location_name && (
        <p className="text-sm font-black uppercase tracking-[0.10em] text-scoreboard-cream">
          {featuredTournament.location_name}
        </p>
      )}

      {(featuredTournament.city ||
        featuredTournament.state) && (
        <p className="scoreboard-label mt-1 text-scoreboard-muted">
          {[
            featuredTournament.city,
            featuredTournament.state,
          ]
            .filter(Boolean)
            .join(", ")}
        </p>
      )}
    </div>
  </div>
)}

            {featuredTournament.description && (

              <p className="mt-5 max-w-3xl text-base leading-8 text-scoreboard-muted sm:text-lg">
                {featuredTournament.description}
              </p>

            )}

            <div className="mt-9 flex flex-wrap gap-3">

            {registeredTournamentIds.has(featuredTournament.id) ? (
  <Link
    to={`/tournaments/${featuredTournament.id}`}
  >
    <Button
      size="lg"
      className="
        rounded-none
        border
        border-scoreboard-amber
        bg-scoreboard-dark
        px-6
        font-bold
        uppercase
        tracking-[0.12em]
        text-scoreboard-amber
        hover:bg-scoreboard-light
        hover:text-scoreboard-cream
      "
    >
      Registered
      <ShieldCheck className="ml-2 h-4 w-4" />
    </Button>
  </Link>
) : featuredTournament.status === "registration_open" ? (
  <Link
    to={`/tournaments/${featuredTournament.id}/register`}
  >
    <Button
      size="lg"
      className="
        rounded-none
        border
        border-scoreboard-cream
        bg-scoreboard-cream
        px-6
        font-bold
        uppercase
        tracking-[0.12em]
        text-scoreboard-dark
        hover:bg-scoreboard-amber
        hover:text-scoreboard-dark
      "
    >
      Register Team
      <ArrowRight className="ml-2 h-4 w-4" />
    </Button>
  </Link>
) : null}

              <Link
                to={`/tournaments/${featuredTournament.id}`}
              >

                <Button
                  size="lg"
                  variant="outline"
                  className="
                    rounded-none
                    border-scoreboard-cream/55
                    bg-transparent
                    px-6
                    font-bold
                    uppercase
                    tracking-[0.12em]
                    text-scoreboard-cream
                    hover:bg-scoreboard-light
                    hover:text-scoreboard-cream
                  "
                >
                  Tournament Details
                </Button>

              </Link>

            </div>

          </div>

        </div>

      ) : (

        <div className="px-6 py-16 sm:px-10 sm:py-20 lg:px-14 lg:py-24">

          <p className="scoreboard-label text-scoreboard-amber">
            Tournament Schedule
          </p>

          <h1 className="mt-4 text-4xl font-black uppercase tracking-[0.05em]">
            No Upcoming Tournaments
          </h1>

          <p className="mt-5 text-scoreboard-muted">
            Check back soon for upcoming Monterey Bay baseball tournaments.
          </p>

        </div>

      )}

    </div>

  </div>

</section>

<section className="bg-scoreboard-dark">
  <div className="mx-auto max-w-7xl px-6 py-12">

    <div className="flex items-end justify-between border-b border-scoreboard-cream/25 pb-4">

      <div>
        <p className="scoreboard-label text-scoreboard-amber">
          Tournament Calendar
        </p>

        <h2 className="mt-2 text-3xl font-black uppercase tracking-[0.07em]">
          Upcoming Tournaments
        </h2>
      </div>

      <Link
        to="/tournaments"
        className="
          hidden
          text-xs
          font-black
          uppercase
          tracking-[0.12em]
          text-scoreboard-amber
          hover:text-scoreboard-cream
          sm:block
        "
      >
        View All →
      </Link>

    </div>

    {tournamentsLoading ? (
      <div className="py-10">

        <p className="scoreboard-label text-scoreboard-muted">
          Loading Tournaments...
        </p>

      </div>
    ) : tournaments.length === 0 ? (
      <div className="mt-6 border border-scoreboard-cream/25 bg-scoreboard-green p-8">

        <p className="scoreboard-label text-scoreboard-amber">
          Tournament Schedule
        </p>

        <h3 className="mt-3 text-xl font-black uppercase">
          No Upcoming Tournaments
        </h3>

        <p className="mt-3 text-sm text-scoreboard-muted">
          New tournaments will appear here as they are announced.
        </p>

      </div>
    ) : (
      <div className="mt-6 grid gap-5 lg:grid-cols-2">

        {tournaments.map((tournament) => {
          const start =
            new Date(
              `${tournament.start_date}T12:00:00`
            )

          const end =
            new Date(
              `${tournament.end_date}T12:00:00`
            )

          return (
            <article
              key={tournament.id}
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
                    {tournament.status === "registration_open"
                      ? "Registration Open"
                      : tournament.status.replace("_", " ")}
                  </p>

                  <h3 className="mt-3 text-2xl font-black uppercase leading-tight tracking-[0.05em]">
                    {tournament.name}
                  </h3>

                </div>

                <CalendarDays className="h-5 w-5 shrink-0 text-scoreboard-amber" />

              </div>

              <div className="mt-5 border-y border-scoreboard-cream/15 py-4">

                <p className="text-sm font-bold">

                  {start.toLocaleDateString([], {
                    month: "short",
                    day: "numeric",
                  })}

                  {" – "}

                  {end.toLocaleDateString([], {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}

                </p>

                {(tournament.city ||
                  tournament.state) && (
                  <p className="mt-2 text-sm text-scoreboard-muted">

                    {[tournament.city, tournament.state]
                      .filter(Boolean)
                      .join(", ")}

                  </p>
                )}

              </div>

              {tournament.description && (
                <p className="mt-5 line-clamp-3 text-sm leading-6 text-scoreboard-muted">
                  {tournament.description}
                </p>
              )}

              <div className="mt-6 flex flex-col gap-3 sm:flex-row">

                <Link
                  to={`/tournaments/${tournament.id}`}
                  className="
                    inline-flex
                    min-h-11
                    flex-1
                    items-center
                    justify-center
                    border
                    border-scoreboard-cream/35
                    px-4
                    text-xs
                    font-black
                    uppercase
                    tracking-[0.10em]
                    text-scoreboard-cream
                    hover:border-scoreboard-amber
                  "
                >
                  Tournament Details
                </Link>

                {registeredTournamentIds.has(tournament.id) ? (
                  <Link
                    to={`/tournaments/${tournament.id}`}
                    className="
                      inline-flex
                      min-h-11
                      flex-1
                      items-center
                      justify-center
                      border
                      border-scoreboard-amber
                      bg-scoreboard-dark
                      px-4
                      text-xs
                      font-black
                      uppercase
                      tracking-[0.10em]
                      text-scoreboard-amber
                      hover:bg-scoreboard-light
                    "
                  >
                    Registered
                    <ShieldCheck className="ml-2 h-4 w-4" />
                  </Link>
                ) : (
                  <Link
                    to={`/tournaments/${tournament.id}/register`}
                    className="
                      inline-flex
                      min-h-11
                      flex-1
                      items-center
                      justify-center
                      bg-scoreboard-amber
                      px-4
                      text-xs
                      font-black
                      uppercase
                      tracking-[0.10em]
                      text-scoreboard-dark
                      hover:bg-scoreboard-cream
                    "
                  >
                    Register Team
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                )}

              </div>

            </article>
          )
        })}

      </div>
    )}

  </div>
</section>

{/* FEATURE BOXES */}
<section className="bg-scoreboard-dark">
  <div className="mx-auto grid max-w-7xl gap-6 px-6 py-10 lg:grid-cols-2">

    {/* MONTEREY BAY BOX */}
    <div className="scoreboard-panel p-4 lg:p-5">
  <div className="h-full border border-scoreboard-cream/35 bg-scoreboard-dark p-6 sm:p-8">

    <div className="flex items-center justify-between border-b border-scoreboard-cream/25 pb-4">
      <p className="scoreboard-label text-scoreboard-amber">
        Monterey Bay League 
      </p>

      <span className="h-3 w-3 bg-scoreboard-red shadow-[0_0_12px_rgba(157,47,42,0.65)]" />
    </div>

    <h2 className="mt-6 text-2xl font-black uppercase leading-tight tracking-[0.06em] sm:text-3xl">
      Santa Cruz Is Baseball
    </h2>

    <p className="scoreboard-label mt-3 text-scoreboard-amber">
      Santa Cruz, California is a fantastic baseball destination.
    </p>

    <div className="mt-8 divide-y divide-scoreboard-cream/20">

      {/* LEAGUE PLAY */}
      <div className="flex gap-4 py-4">
        <CalendarDays className="mt-0.5 h-5 w-5 shrink-0 text-scoreboard-amber" />

        <div>
          <div className="scoreboard-label text-scoreboard-cream">
            League Play
          </div>

          <p className="mt-1 text-sm leading-6 text-scoreboard-muted">
            Year-round baseball throughout the Monterey Bay,
            culminating with league championship games in October.
          </p>
        </div>
      </div>

      {/* TOURNAMENTS */}
      <div className="flex gap-4 py-4">
        <CalendarDays className="mt-0.5 h-5 w-5 shrink-0 text-scoreboard-amber" />

        <div>
          <div className="scoreboard-label text-scoreboard-cream">
            Tournaments
          </div>

          <p className="mt-1 text-sm leading-6 text-scoreboard-muted">
            Discover Monterey Bay tournaments, register teams,
            and manage tournament participation online.
          </p>
        </div>
      </div>

      {/* GAMEON */}
      <div className="flex gap-4 py-4">
        <span className="mt-0.5 flex h-5 min-w-5 items-center justify-center border border-scoreboard-amber text-[9px] font-black text-scoreboard-amber">
          GO
        </span>

        <div>
          <div className="scoreboard-label text-scoreboard-cream">
            Powered By GameOn
          </div>

          <p className="mt-1 text-sm leading-6 text-scoreboard-muted">
            GameOn is the official MBL league scoring and fan app
            for live scores, game updates, stats, and results.
          </p>
        </div>
      </div>

      {/* TEAMS */}
      <div className="flex gap-4 py-4">
        <Users className="mt-0.5 h-5 w-5 shrink-0 text-scoreboard-amber" />

        <div>
          <div className="scoreboard-label text-scoreboard-cream">
            Teams
          </div>

          <p className="mt-1 text-sm leading-6 text-scoreboard-muted">
            Team profiles, rosters, schedules, and organization
            management in one place.
          </p>
        </div>
      </div>

      {/* TRAINING */}
      <div className="flex gap-4 py-4">
        <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-scoreboard-amber" />

        <div>
          <div className="scoreboard-label text-scoreboard-cream">
            Training
          </div>

          <p className="mt-1 text-sm leading-6 text-scoreboard-muted">
            Book trainers, facilities, fields, and pitching
            machines throughout the Monterey Bay.
          </p>
        </div>
      </div>

    </div>
  </div>
</div>

    {/* GAMEON BOX */}
    <div className="scoreboard-panel p-4 lg:p-5">
      <div className="h-full border border-scoreboard-cream/35 bg-scoreboard-dark p-6 sm:p-8">

        <div className="flex items-center justify-between border-b border-scoreboard-cream/25 pb-4">
          <div>
            
            <a className="scoreboard-label text-scoreboard-amber"   href="https://quinnglobal.com"
            target="_blank"
            rel="noopener noreferrer">
              GameOn
            </a>

            <p className="mt-1 text-xs font-bold uppercase tracking-[0.16em] text-scoreboard-muted">
              10U MBL Standings
            </p>
          </div>

          <span className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.14em] text-scoreboard-cream">
            <span className="h-2.5 w-2.5 bg-scoreboard-red" />
            Live
          </span>
        </div>

        <div className="mt-6">

          <div className="grid grid-cols-[1fr_48px_48px_48px] border-b border-scoreboard-cream/20 pb-3">
            <div className="scoreboard-label">Team</div>
            <div className="scoreboard-label text-center">W</div>
            <div className="scoreboard-label text-center">L</div>
            <div className="scoreboard-label text-center">PCT</div>
          </div>

          {[
            ["Angry Berds", "18", "4", ".818"],
            ["Scotts Valley Havoc", "16", "6", ".727"],
            ["Aptos Beach Boys", "14", "7", ".667"],
            ["The Barrels", "12", "9", ".571"],
          ].map(([team, wins, losses, pct], index) => (
            <div
              key={team}
              className="
                grid
                grid-cols-[1fr_48px_48px_48px]
                items-center
                border-b
                border-scoreboard-cream/15
                py-4
              "
            >
              <div className="flex min-w-0 items-center gap-3">
                <span className="scoreboard-number w-5 text-sm text-scoreboard-amber">
                  {index + 1}
                </span>

                <span className="truncate text-sm font-black uppercase tracking-[0.05em] text-scoreboard-cream">
                  {team}
                </span>
              </div>

              <div className="scoreboard-number text-center text-lg">
                {wins}
              </div>

              <div className="scoreboard-number text-center text-lg">
                {losses}
              </div>

              <div className="scoreboard-number text-center text-sm text-scoreboard-muted">
                {pct}
              </div>
            </div>
          ))}

        </div>

        <div className="mt-7 border-t border-scoreboard-cream/25 pt-5">

          <div className="mb-3 flex items-center justify-between">
            <span className="scoreboard-label">
              Latest Final
            </span>

            <span className="scoreboard-label text-scoreboard-amber">
              GameOn
            </span>
          </div>

          <div className="grid grid-cols-[1fr_auto] gap-x-6 gap-y-2">

            <div className="text-sm font-black uppercase tracking-[0.07em]">
              Angry Berds
            </div>

            <div className="scoreboard-number text-2xl text-scoreboard-amber">
              8
            </div>

            <div className="text-sm font-black uppercase tracking-[0.07em] text-scoreboard-muted">
              Scotts Valley
            </div>

            <div className="scoreboard-number text-2xl">
              5
            </div>

          </div>

          <div className="mt-4 text-xs font-bold uppercase tracking-[0.13em] text-scoreboard-muted">
            Final • 6 Innings • Polo Grounds
          </div>

        </div>

        <Link
          to="/scores"
          className="
            mt-7
            flex
            w-full
            items-center
            justify-between
            border
            border-scoreboard-cream/30
            px-4
            py-3
            text-xs
            font-black
            uppercase
            tracking-[0.14em]
            text-scoreboard-cream
            transition-colors
            hover:bg-scoreboard-cream
            hover:text-scoreboard-dark
          "
        >
          View GameOn Scores
          <ArrowRight className="h-4 w-4" />
        </Link>

      </div>
    </div>

  </div>
</section>

      

      <section className="bg-scoreboard-dark">

        <div className="mx-auto max-w-7xl px-6 py-16 sm:py-20">

          <div className="mb-8 flex items-end justify-between border-b border-scoreboard-cream/25 pb-4">

            <div>
              <p className="scoreboard-label">
                Getting Started
              </p>

              <h2 className="mt-2 text-3xl font-black uppercase tracking-[0.08em]">
                Simply for the love of Baseball
              </h2>
            </div>

            <div className="hidden text-right sm:block">
              <div className="scoreboard-label">
                SCBC
              </div>

              <div className="scoreboard-number mt-1 text-xl text-scoreboard-amber">
                01 — 03
              </div>
            </div>

          </div>

          <div className="grid border-l border-t border-scoreboard-cream/25 md:grid-cols-3">

            {[
              [
                "01",
                "Create your club",
                "Set up your club, invite staff.",
              ],
              [
                "02",
                "Build teams",
                "Add age group, classification, coaches, branding, and public team information.",
              ],
              [
                "03",
                "Manage your organization",
                "Find tournaments, manage your rosters, schedule events and practices.",
              ],
            ].map(([n, title, text]) => (

              <article
                key={n}
                className="
                  border-b
                  border-r
                  border-scoreboard-cream/25
                  bg-scoreboard-green
                  p-6
                  transition-colors
                  hover:bg-scoreboard-light
                  sm:p-8
                "
              >

                <div className="scoreboard-number text-4xl text-scoreboard-amber">
                  {n}
                </div>

                <h3 className="mt-8 text-xl font-black uppercase leading-tight tracking-[0.08em]">
                  {title}
                </h3>

                <p className="mt-4 max-w-sm text-sm leading-7 text-scoreboard-muted">
                  {text}
                </p>

              </article>

            ))}

          </div>
        </div>
      </section>

    </main>
  )
}