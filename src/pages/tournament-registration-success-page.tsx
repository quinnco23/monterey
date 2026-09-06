import { useEffect, useMemo, useState } from "react"

import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  MapPin,
  Trophy,
} from "lucide-react"

import {
  Link,
  useLocation,
} from "react-router-dom"

import { useAuth } from "@/features/auth/auth-context"
import { supabase } from "@/lib/supabase"

type LocationState = {
  tournamentId?: string
  teamId?: string
  divisionId?: string
}

type OrganizationMembership = {
  organization_id: string
  role: string
  status: string
}

type Team = {
  id: string
  organization_id: string
  name: string
  age_group: string | null
}

type Registration = {
  id: string
  tournament_id: string
  division_id: string
  team_id: string
  status: string
  created_at: string | null

  tournaments: {
    id: string
    name: string
    start_date: string
    end_date: string
    city: string | null
    state: string | null
    status: string
  } | null

  tournament_divisions: {
    id: string
    name: string
    age_group: string | null
  } | null

  teams: {
    id: string
    name: string
    age_group: string | null
  } | null
}

export function TournamentRegistrationSuccessPage() {
  const { user } = useAuth()
  const location = useLocation()

  const state =
    location.state as LocationState | null

  const [registrations, setRegistrations] =
    useState<Registration[]>([])

  const [loading, setLoading] =
    useState(true)

  const [error, setError] =
    useState("")

  useEffect(() => {
    async function loadRegistrations() {
      if (!user) {
        setError("You must be signed in.")
        setLoading(false)
        return
      }

      setLoading(true)
      setError("")

      const {
        data: membershipData,
        error: membershipError,
      } =
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
        setError(membershipError.message)
        setLoading(false)
        return
      }

      const memberships =
        (membershipData ??
          []) as OrganizationMembership[]

      const manageableOrganizationIds =
        memberships
          .filter((membership) =>
            [
              "manager",
              "owner",
              "admin",
            ].includes(
              membership.role
            )
          )
          .map(
            (membership) =>
              membership.organization_id
          )

      if (
        manageableOrganizationIds.length === 0
      ) {
        setRegistrations([])
        setLoading(false)
        return
      }

      const {
        data: teamData,
        error: teamError,
      } =
        await supabase
          .from("teams")
          .select(`
            id,
            organization_id,
            name,
            age_group
          `)
          .in(
            "organization_id",
            manageableOrganizationIds
          )
          .eq("status", "active")

      if (teamError) {
        setError(teamError.message)
        setLoading(false)
        return
      }

      const teams =
        (teamData ?? []) as Team[]

      const teamIds =
        teams.map(
          (team) => team.id
        )

      if (teamIds.length === 0) {
        setRegistrations([])
        setLoading(false)
        return
      }

      const {
        data: registrationData,
        error: registrationError,
      } =
        await supabase
          .from("tournament_teams")
          .select(`
            id,
            tournament_id,
            division_id,
            team_id,
            status,
            created_at,

            tournaments (
              id,
              name,
              start_date,
              end_date,
              city,
              state,
              status
            ),

            tournament_divisions (
              id,
              name,
              age_group
            ),

            teams (
              id,
              name,
              age_group
            )
          `)
          .in("team_id", teamIds)
          .order("created_at", {
            ascending: false,
          })

      if (registrationError) {
        setError(
          registrationError.message
        )
        setLoading(false)
        return
      }

      setRegistrations(
        (registrationData ??
          []) as unknown as Registration[]
      )

      setLoading(false)
    }

    void loadRegistrations()
  }, [user])

  const latestRegistration =
    useMemo(() => {
      if (!state) return null

      return (
        registrations.find(
          (registration) =>
            registration.tournament_id ===
              state.tournamentId &&
            registration.team_id ===
              state.teamId &&
            registration.division_id ===
              state.divisionId
        ) ?? null
      )
    }, [registrations, state])

  function getDateLabel(
    startDate: string,
    endDate: string
  ) {
    const start =
      new Date(
        `${startDate}T12:00:00`
      )

    const end =
      new Date(
        `${endDate}T12:00:00`
      )

    return `${start.toLocaleDateString(
      [],
      {
        month: "short",
        day: "numeric",
      }
    )} – ${end.toLocaleDateString(
      [],
      {
        month: "short",
        day: "numeric",
        year: "numeric",
      }
    )}`
  }

  return (
    <main className="min-h-screen bg-scoreboard-dark text-scoreboard-cream">

      {/* HERO */}

      <section className="border-b border-scoreboard-cream/20 bg-scoreboard-green">

        <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6">

          <div className="flex items-center gap-3">

            <CheckCircle2 className="h-7 w-7 text-scoreboard-amber" />

            <p className="scoreboard-label text-scoreboard-amber">
              Registration Complete
            </p>

          </div>

          <h1 className="mt-4 text-4xl font-black uppercase tracking-[0.06em] sm:text-5xl">
            Team Registered
          </h1>

          <p className="mt-4 max-w-2xl text-sm leading-7 text-scoreboard-muted">
            Your tournament registration
            has been submitted and is
            awaiting approval.
          </p>

        </div>

      </section>

      <section className="mx-auto max-w-5xl px-4 py-10 sm:px-6">

        {/* JUST REGISTERED */}

        {!loading &&
          !error &&
          latestRegistration && (
            <div className="mb-10 border border-scoreboard-amber/50 bg-scoreboard-green p-6 sm:p-8">

              <p className="scoreboard-label text-scoreboard-amber">
                Just Registered
              </p>

              <div className="mt-4 flex items-start justify-between gap-5">

                <div>

                  <h2 className="text-2xl font-black uppercase tracking-[0.05em]">
                    {
                      latestRegistration
                        .tournaments
                        ?.name
                    }
                  </h2>

                  <p className="mt-3 text-sm font-black uppercase tracking-[0.06em] text-scoreboard-cream">
                    {[
                      latestRegistration
                        .teams
                        ?.age_group,
                      latestRegistration
                        .teams
                        ?.name,
                    ]
                      .filter(Boolean)
                      .join(" ")}
                  </p>

                  <p className="mt-2 text-sm text-scoreboard-muted">
                    {[
                      latestRegistration
                        .tournament_divisions
                        ?.age_group,
                      latestRegistration
                        .tournament_divisions
                        ?.name,
                    ]
                      .filter(Boolean)
                      .join(" • ")}
                  </p>

                </div>

                <span className="
                  border
                  border-scoreboard-amber/50
                  px-3
                  py-2
                  text-[10px]
                  font-black
                  uppercase
                  tracking-[0.12em]
                  text-scoreboard-amber
                ">
                  {latestRegistration.status.replaceAll(
                    "_",
                    " "
                  )}
                </span>

              </div>

              {latestRegistration.tournaments && (
                <div className="mt-6 flex flex-wrap gap-x-6 gap-y-3 border-t border-scoreboard-cream/15 pt-5 text-sm text-scoreboard-muted">

                  <div className="flex items-center gap-2">

                    <CalendarDays className="h-4 w-4 text-scoreboard-amber" />

                    {getDateLabel(
                      latestRegistration
                        .tournaments
                        .start_date,
                      latestRegistration
                        .tournaments
                        .end_date
                    )}

                  </div>

                  {(latestRegistration
                    .tournaments.city ||
                    latestRegistration
                      .tournaments.state) && (
                    <div className="flex items-center gap-2">

                      <MapPin className="h-4 w-4 text-scoreboard-amber" />

                      {[
                        latestRegistration
                          .tournaments
                          .city,
                        latestRegistration
                          .tournaments
                          .state,
                      ]
                        .filter(Boolean)
                        .join(", ")}

                    </div>
                  )}

                </div>
              )}

              {latestRegistration.tournaments && (
                <Link
                  to={`/tournaments/${latestRegistration.tournaments.id}`}
                  className="
                    mt-6
                    inline-flex
                    min-h-11
                    items-center
                    gap-3
                    border
                    border-scoreboard-cream/30
                    px-5
                    text-xs
                    font-black
                    uppercase
                    tracking-[0.10em]
                    hover:border-scoreboard-amber
                  "
                >
                  View Tournament

                  <ArrowRight className="h-4 w-4" />
                </Link>
              )}

            </div>
          )}

        {/* REGISTRATION HISTORY */}

        <div className="mb-6 flex items-end justify-between border-b border-scoreboard-cream/20 pb-4">

          <div>

            <p className="scoreboard-label">
              Your Teams
            </p>

            <h2 className="mt-2 text-2xl font-black uppercase tracking-[0.06em]">
              Tournament Registrations
            </h2>

          </div>

          {!loading &&
            !error && (
              <div className="scoreboard-number text-2xl text-scoreboard-amber">
                {registrations.length}
              </div>
            )}

        </div>

        {loading && (
          <div className="border border-scoreboard-cream/20 bg-scoreboard-green p-6">

            <p className="scoreboard-label">
              Loading Registrations...
            </p>

          </div>
        )}

        {error && (
          <div className="border border-scoreboard-red/60 bg-scoreboard-green p-6">

            <p className="scoreboard-label text-scoreboard-amber">
              Unable To Load Registrations
            </p>

            <p className="mt-3 text-sm text-scoreboard-muted">
              {error}
            </p>

          </div>
        )}

        {!loading &&
          !error &&
          registrations.length === 0 && (
            <div className="border border-scoreboard-cream/20 bg-scoreboard-green p-8">

              <Trophy className="h-8 w-8 text-scoreboard-amber" />

              <h3 className="mt-5 text-xl font-black uppercase tracking-[0.06em]">
                No Registrations Yet
              </h3>

              <p className="mt-3 text-sm text-scoreboard-muted">
                Your team tournament
                registrations will appear
                here.
              </p>

              <Link
                to="/tournaments"
                className="
                  mt-6
                  inline-flex
                  items-center
                  gap-2
                  text-xs
                  font-black
                  uppercase
                  tracking-[0.10em]
                  text-scoreboard-amber
                  hover:text-scoreboard-cream
                "
              >
                Browse Tournaments

                <ArrowRight className="h-4 w-4" />
              </Link>

            </div>
          )}

        {!loading &&
          !error &&
          registrations.length > 0 && (
            <div className="space-y-4">

              {registrations.map(
                (registration) => {

                  const tournament =
                    registration.tournaments

                  const team =
                    registration.teams

                  const division =
                    registration.tournament_divisions

                  if (!tournament) {
                    return null
                  }

                  return (
                    <article
                      key={registration.id}
                      className="
                        border
                        border-scoreboard-cream/20
                        bg-scoreboard-green
                        p-6
                      "
                    >

                      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">

                        <div>

                          <p className="scoreboard-label text-scoreboard-amber">
                            Tournament
                          </p>

                          <h3 className="mt-2 text-xl font-black uppercase tracking-[0.05em]">
                            {tournament.name}
                          </h3>

                          {team && (
                            <p className="mt-3 text-sm font-black uppercase tracking-[0.05em]">
                              {[
                                team.age_group,
                                team.name,
                              ]
                                .filter(Boolean)
                                .join(" ")}
                            </p>
                          )}

                          {division && (
                            <p className="mt-1 text-sm text-scoreboard-muted">
                              {[
                                division.age_group,
                                division.name,
                              ]
                                .filter(Boolean)
                                .join(" • ")}
                            </p>
                          )}

                        </div>

                        <span className="
                          self-start
                          border
                          border-scoreboard-cream/25
                          px-3
                          py-2
                          text-[10px]
                          font-black
                          uppercase
                          tracking-[0.12em]
                          text-scoreboard-muted
                        ">
                          {registration.status.replaceAll(
                            "_",
                            " "
                          )}
                        </span>

                      </div>

                      <div className="mt-5 flex flex-wrap gap-x-6 gap-y-3 border-t border-scoreboard-cream/15 pt-5 text-sm text-scoreboard-muted">

                        <div className="flex items-center gap-2">

                          <CalendarDays className="h-4 w-4 text-scoreboard-amber" />

                          {getDateLabel(
                            tournament.start_date,
                            tournament.end_date
                          )}

                        </div>

                        {(tournament.city ||
                          tournament.state) && (
                          <div className="flex items-center gap-2">

                            <MapPin className="h-4 w-4 text-scoreboard-amber" />

                            {[
                              tournament.city,
                              tournament.state,
                            ]
                              .filter(Boolean)
                              .join(", ")}

                          </div>
                        )}

                      </div>

                      <Link
                        to={`/tournaments/${tournament.id}`}
                        className="
                          mt-5
                          flex
                          items-center
                          justify-between
                          border-t
                          border-scoreboard-cream/15
                          pt-4
                          text-xs
                          font-black
                          uppercase
                          tracking-[0.10em]
                          hover:text-scoreboard-amber
                        "
                      >
                        View Tournament

                        <ArrowRight className="h-4 w-4" />
                      </Link>

                    </article>
                  )
                }
              )}

            </div>
          )}

      </section>

    </main>
  )
}