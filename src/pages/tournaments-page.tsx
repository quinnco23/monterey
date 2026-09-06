import { useEffect, useState } from "react"

import {
  ArrowRight,
  CalendarDays,
  MapPin,
  Trophy,
  Users,
} from "lucide-react"

import { Link } from "react-router-dom"



import { supabase } from "@/lib/supabase"
import { useAuth } from "@/features/auth/auth-context"

type TournamentListing = {
  id: string

  source:
    | "tournament"
    | "organization_event"

  name: string

  description: string | null

  startDate: string
  endDate: string | null

  location: string | null

  status: string

  organizationId?: string
  organizationName?: string

  teamId?: string
  teamName?: string

  registerable: boolean
}

export function TournamentsPage() {
  const { user } = useAuth()
  const [tournaments, setTournaments] =
    useState<TournamentListing[]>([])
    

  const [loading, setLoading] =
    useState(true)

  const [error, setError] =
    useState("")

  useEffect(() => {
  async function loadTournaments() {
    setLoading(true)
    setError("")

    const today =
      new Date()
        .toISOString()
        .slice(0, 10)

    const now =
      new Date().toISOString()

    // PUBLIC / REGISTERABLE TOURNAMENTS
    const tournamentQuery =
      supabase
        .from("tournaments")
        .select(`
          id,
          name,
          description,
          city,
          state,
          start_date,
          end_date,
          status
        `)
        .eq(
          "status",
          "registration_open"
        )
        .gte(
          "end_date",
          today
        )
        .order(
          "start_date",
          {
            ascending: true,
          }
        )

    // ORGANIZATION SCHEDULE TOURNAMENTS
    // Only load these when signed in.
    const organizationTournamentQuery =
      user
        ? supabase
            .from("organization_events")
            .select(`
              id,
              organization_id,
              team_id,
              title,
              description,
              start_time,
              end_time,
              location_name,
              status,

              organizations (
                id,
                name
              ),

              teams (
                id,
                name,
                age_group
              )
            `)
            .eq(
              "event_type",
              "tournament"
            )
            .eq(
              "status",
              "scheduled"
            )
            .or(
              `end_time.gte.${now},and(end_time.is.null,start_time.gte.${now})`
            )
            .order(
              "start_time",
              {
                ascending: true,
              }
            )
        : Promise.resolve({
            data: [],
            error: null,
          })

    const [
      tournamentResult,
      organizationTournamentResult,
    ] =
      await Promise.all([
        tournamentQuery,
        organizationTournamentQuery,
      ])

    if (tournamentResult.error) {
      setError(
        tournamentResult.error.message
      )
      setLoading(false)
      return
    }

    if (
      organizationTournamentResult.error
    ) {
      setError(
        organizationTournamentResult
          .error.message
      )
      setLoading(false)
      return
    }

    const platformListings:
      TournamentListing[] =
      (
        tournamentResult.data ?? []
      ).map(
        (tournament) => ({
          id:
            tournament.id,

          source:
            "tournament",

          name:
            tournament.name,

          description:
            tournament.description ??
            null,

          startDate:
            tournament.start_date,

          endDate:
            tournament.end_date,

          location:
            [
              tournament.city,
              tournament.state,
            ]
              .filter(Boolean)
              .join(", ") || null,

          status:
            tournament.status,

          registerable:
            true,
        })
      )

    const organizationListings:
      TournamentListing[] =
      (
        organizationTournamentResult
          .data ?? []
      ).map((event: any) => ({
        id:
          event.id,

        source:
          "organization_event",

        name:
          event.title,

        description:
          event.description ?? null,

        startDate:
          event.start_time,

        endDate:
          event.end_time,

        location:
          event.location_name ?? null,

        status:
          event.status,

        organizationId:
          event.organization_id,

        organizationName:
          event.organizations?.name,

        teamId:
          event.team_id ?? undefined,

        teamName:
          event.teams
            ? [
                event.teams.age_group,
                event.teams.name,
              ]
                .filter(Boolean)
                .join(" ")
            : undefined,

        registerable:
          false,
      }))

    const combined = [
      ...platformListings,
      ...organizationListings,
    ].sort(
      (a, b) =>
        new Date(
          a.startDate
        ).getTime() -
        new Date(
          b.startDate
        ).getTime()
    )

    setTournaments(combined)
    setLoading(false)
  }

  void loadTournaments()
}, [user])

  return (
    <main className="min-h-screen bg-scoreboard-dark text-scoreboard-cream">

      {/* HERO */}

      <section className="border-b border-scoreboard-cream/20 bg-scoreboard-green">

        <div className="mx-auto max-w-7xl px-6 py-14">

          <p className="scoreboard-label text-scoreboard-amber">
            Travel Baseball
          </p>

          <h1 className="mt-3 text-4xl font-black uppercase tracking-[0.08em] sm:text-5xl">
            Tournaments
          </h1>

          <p className="mt-4 max-w-2xl text-scoreboard-muted">
            Upcoming tournaments,
            divisions, schedules,
            teams, and registration.
          </p>

        </div>

      </section>

      <section className="mx-auto max-w-7xl px-6 py-10">

        {/* SECTION HEADER */}

        <div className="mb-6 flex items-end justify-between border-b border-scoreboard-cream/20 pb-4">

          <div>

            <p className="scoreboard-label">
              Upcoming Events
            </p>

            <h2 className="mt-2 text-2xl font-black uppercase tracking-[0.08em]">
              Tournament Schedule
            </h2>

          </div>

          {!loading && !error && (
            <div className="scoreboard-number text-2xl text-scoreboard-amber">
              {tournaments.length}
            </div>
          )}

        </div>

        {/* LOADING */}

        {loading && (
          <div className="border border-scoreboard-cream/20 bg-scoreboard-green p-6">

            <p className="scoreboard-label">
              Loading Tournaments...
            </p>

          </div>
        )}

        {/* ERROR */}

        {error && (
          <div className="border border-scoreboard-red/60 bg-scoreboard-green p-6">

            <p className="scoreboard-label text-scoreboard-amber">
              Unable To Load
              Tournaments
            </p>

            <p className="mt-3 text-sm text-scoreboard-muted">
              {error}
            </p>

          </div>
        )}

        {/* EMPTY */}

        {!loading &&
          !error &&
          tournaments.length === 0 && (
            <div className="border border-scoreboard-cream/20 bg-scoreboard-green p-8">

              <Trophy className="h-8 w-8 text-scoreboard-amber" />

              <h3 className="mt-5 text-xl font-black uppercase tracking-[0.06em]">
                No Tournaments
                Scheduled
              </h3>

              <p className="mt-3 text-sm text-scoreboard-muted">
                Upcoming tournaments
                will appear here.
              </p>

            </div>
          )}

        {/* TOURNAMENT CARDS */}

        {!loading &&
          !error &&
          tournaments.length > 0 && (
            <div className="grid gap-5 lg:grid-cols-2">

              {tournaments.map(
                (tournament) => {

                  const start =
                    new Date(
                      tournament
                        .startDate
                    )

                  const end =
                    tournament.endDate
                      ? new Date(
                          tournament
                            .endDate
                        )
                      : null

                  const dateLabel =
                    end
                      ? `${start.toLocaleDateString(
                          [],
                          {
                            month:
                              "short",
                            day:
                              "numeric",
                          }
                        )} – ${end.toLocaleDateString(
                          [],
                          {
                            month:
                              "short",
                            day:
                              "numeric",
                            year:
                              "numeric",
                          }
                        )}`
                      : start.toLocaleDateString(
                          [],
                          {
                            month:
                              "short",
                            day:
                              "numeric",
                            year:
                              "numeric",
                          }
                        )

                  return (
                    <article
                      key={`${tournament.source}-${tournament.id}`}
                      className="
                        border
                        border-scoreboard-cream/25
                        bg-scoreboard-green
                        p-6
                        transition-colors
                        hover:border-scoreboard-amber/60
                        hover:bg-scoreboard-light
                        sm:p-8
                      "
                    >

                      <div className="flex items-start justify-between gap-5">

                        <div>

                          {/* <div className="flex flex-wrap items-center gap-3">

                            <p className="scoreboard-label text-scoreboard-amber">
                              Tournament
                            </p>

                            <span
                              className="
                                border
                                border-scoreboard-cream/25
                                px-2
                                py-1
                                text-[10px]
                                font-black
                                uppercase
                                tracking-[0.12em]
                                text-scoreboard-muted
                              "
                            >
                              {tournament
                                .registerable
                                ? tournament.status ===
                                  "open"
                                  ? "Registration Open"
                                  : tournament.status.replaceAll(
                                      "_",
                                      " "
                                    )
                                : "Organization Schedule"}
                            </span>

                          </div> */}

                          <h3 className="mt-4 text-2xl font-black uppercase leading-tight tracking-[0.05em] sm:text-3xl">
                            {tournament.name}
                          </h3>

                        </div>

                        <Trophy className="h-6 w-6 shrink-0 text-scoreboard-amber" />

                      </div>

                      {tournament.description && (
                        <p className="mt-5 max-w-xl text-sm leading-7 text-scoreboard-muted">
                          {
                            tournament.description
                          }
                        </p>
                      )}

                      <div className="mt-6 grid gap-3 border-t border-scoreboard-cream/20 pt-5 text-sm text-scoreboard-muted sm:grid-cols-2">

                        <div className="flex items-center gap-3">

                          <CalendarDays className="h-4 w-4 text-scoreboard-amber" />

                          {dateLabel}

                        </div>

                        {tournament.location && (
                          <div className="flex items-center gap-3">

                            <MapPin className="h-4 w-4 text-scoreboard-amber" />

                            {
                              tournament.location
                            }

                          </div>
                        )}

                        {tournament.teamName && (
                          <div className="flex items-center gap-3">

                            <Users className="h-4 w-4 text-scoreboard-amber" />

                            {
                              tournament.teamName
                            }

                          </div>
                        )}

                        {tournament.organizationName && (
                          <div className="text-xs font-black uppercase tracking-[0.08em] text-scoreboard-muted">

                            Scheduled by{" "}
                            {
                              tournament.organizationName
                            }

                          </div>
                        )}

                      </div>

                      <div className="mt-7 flex flex-col gap-3 border-t border-scoreboard-cream/20 pt-5 sm:flex-row">

                        {tournament.registerable ? (
                          <>
                            <Link
                              to={`/tournaments/${tournament.id}`}
                              className="
                                inline-flex
                                min-h-11
                                flex-1
                                items-center
                                justify-center
                                border
                                border-scoreboard-cream/30
                                px-4
                                text-xs
                                font-black
                                uppercase
                                tracking-[0.12em]
                                hover:border-scoreboard-amber
                              "
                            >
                              Tournament Details
                            </Link>

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
                                tracking-[0.12em]
                                text-scoreboard-dark
                                hover:bg-scoreboard-cream
                              "
                            >
                              Register Team

                              <ArrowRight className="ml-2 h-4 w-4" />
                            </Link>
                          </>
                        ) : tournament.organizationId ? (
                          <Link
                            to={`/organizations/${tournament.organizationId}/schedule`}
                            className="
                              flex
                              min-h-11
                              w-full
                              items-center
                              justify-between
                              border
                              border-scoreboard-cream/30
                              px-4
                              text-xs
                              font-black
                              uppercase
                              tracking-[0.12em]
                              hover:border-scoreboard-amber
                            "
                          >
                            View Organization
                            Schedule

                            <ArrowRight className="h-4 w-4" />
                          </Link>
                        ) : null}

                      </div>

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