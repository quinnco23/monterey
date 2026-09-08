import { FormEvent, useEffect, useMemo, useState } from "react"
import {
  ArrowLeft,
  CalendarDays,
  MapPin,
  Trophy,
} from "lucide-react"
import { Link, useNavigate, useParams } from "react-router-dom"

import { Button } from "@/components/ui/button"
import { supabase } from "@/lib/supabase"

type Tournament = {
  id: string
  name: string
  start_date: string
  end_date: string
}

type Division = {
  id: string
  tournament_id: string
  name: string
  age_group: string
}

type TournamentTeam = {
  id: string
  tournament_id: string
  division_id: string | null
  team_id: string | null
  display_name: string
  status: string
}

type FieldResource = {
  id: string
  name: string
  city: string | null
  state: string | null
  resource_type: string
  active: boolean
}

export function TournamentScheduleGamePage() {
  const { tournamentId } = useParams()
  const navigate = useNavigate()

  const [tournament, setTournament] =
    useState<Tournament | null>(null)

  const [divisions, setDivisions] =
    useState<Division[]>([])

  const [teams, setTeams] =
    useState<TournamentTeam[]>([])

  const [fields, setFields] =
    useState<FieldResource[]>([])

  const [divisionId, setDivisionId] =
    useState("")

  const [awayTournamentTeamId, setAwayTournamentTeamId] =
    useState("")

  const [homeTournamentTeamId, setHomeTournamentTeamId] =
    useState("")

  const [fieldResourceId, setFieldResourceId] =
    useState("")

  const [gameDate, setGameDate] =
    useState("")

  const [gameTime, setGameTime] =
    useState("")

  const [gameNumber, setGameNumber] =
    useState("")

  const [roundName, setRoundName] =
    useState("Pool Play")

  const [status, setStatus] =
    useState("scheduled")

  const [loading, setLoading] =
    useState(true)

  const [saving, setSaving] =
    useState(false)

  const [error, setError] =
    useState("")

  useEffect(() => {
    async function loadPage() {
      if (!tournamentId) {
        setError("Missing tournament ID.")
        setLoading(false)
        return
      }

      setLoading(true)
      setError("")

      const [
        tournamentResult,
        divisionResult,
        teamResult,
        fieldResult,
      ] = await Promise.all([
        supabase
          .from("tournaments")
          .select(`
            id,
            name,
            start_date,
            end_date
          `)
          .eq("id", tournamentId)
          .single(),

        supabase
          .from("tournament_divisions")
          .select(`
            id,
            tournament_id,
            name,
            age_group
          `)
          .eq("tournament_id", tournamentId)
          .order("age_group"),

        supabase
          .from("tournament_teams")
          .select(`
            id,
            tournament_id,
            division_id,
            team_id,
            display_name,
            status
          `)
          .eq("tournament_id", tournamentId)
          .in("status", [
            "pending",
            "approved",
            "waitlist",
          ])
          .order("display_name"),

        supabase
          .from("booking_resources")
          .select(`
            id,
            name,
            city,
            state,
            resource_type,
            active
          `)
          .eq("active", true)
          .eq("resource_type", "field")
          .order("name"),
      ])

      if (tournamentResult.error) {
        setError(
          tournamentResult.error.message
        )
        setLoading(false)
        return
      }

      if (divisionResult.error) {
        setError(
          divisionResult.error.message
        )
        setLoading(false)
        return
      }

      if (teamResult.error) {
        setError(
          teamResult.error.message
        )
        setLoading(false)
        return
      }

      if (fieldResult.error) {
        setError(
          fieldResult.error.message
        )
        setLoading(false)
        return
      }

      const loadedTournament =
        tournamentResult.data as Tournament

      setTournament(loadedTournament)

      setDivisions(
        (divisionResult.data ?? []) as Division[]
      )

      setTeams(
        (teamResult.data ?? []) as TournamentTeam[]
      )

      setFields(
        (fieldResult.data ?? []) as FieldResource[]
      )

      if (
        divisionResult.data &&
        divisionResult.data.length > 0
      ) {
        setDivisionId(
          divisionResult.data[0].id
        )
      }

      setGameDate(
        loadedTournament.start_date
      )

      setLoading(false)
    }

    void loadPage()
  }, [tournamentId])

  const selectedDivision =
    useMemo(
      () =>
        divisions.find(
          (division) =>
            division.id === divisionId
        ) ?? null,
      [
        divisions,
        divisionId,
      ]
    )

  const divisionTeams =
    useMemo(
      () =>
        teams.filter(
          (team) =>
            team.division_id ===
            divisionId
        ),
      [
        teams,
        divisionId,
      ]
    )

  const awayTeam =
    useMemo(
      () =>
        divisionTeams.find(
          (team) =>
            team.id ===
            awayTournamentTeamId
        ) ?? null,
      [
        divisionTeams,
        awayTournamentTeamId,
      ]
    )

  const homeTeam =
    useMemo(
      () =>
        divisionTeams.find(
          (team) =>
            team.id ===
            homeTournamentTeamId
        ) ?? null,
      [
        divisionTeams,
        homeTournamentTeamId,
      ]
    )

  useEffect(() => {
    setAwayTournamentTeamId("")
    setHomeTournamentTeamId("")
  }, [divisionId])

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault()

    if (
      !tournamentId ||
      !tournament
    ) {
      setError(
        "Missing tournament."
      )
      return
    }

    if (!divisionId) {
      setError(
        "Select a division."
      )
      return
    }

    if (
      !awayTournamentTeamId ||
      !homeTournamentTeamId
    ) {
      setError(
        "Select both teams."
      )
      return
    }

    if (
      awayTournamentTeamId ===
      homeTournamentTeamId
    ) {
      setError(
        "A team cannot play itself."
      )
      return
    }

    if (
      !gameDate ||
      !gameTime
    ) {
      setError(
        "Date and time are required."
      )
      return
    }

    if (
      gameDate <
        tournament.start_date ||
      gameDate >
        tournament.end_date
    ) {
      setError(
        "Game date must fall within the tournament dates."
      )
      return
    }

    const scheduledStart =
      new Date(
        `${gameDate}T${gameTime}:00`
      )

    if (
      Number.isNaN(
        scheduledStart.getTime()
      )
    ) {
      setError(
        "Invalid game date or time."
      )
      return
    }

    setSaving(true)
    setError("")

    // Basic duplicate/conflict check.
    const {
      data: conflictData,
      error: conflictError,
    } =
      await supabase
        .from("tournament_games")
        .select(`
          id,
          home_tournament_team_id,
          away_tournament_team_id,
          field_resource_id,
          scheduled_start,
          status
        `)
        .eq(
          "tournament_id",
          tournamentId
        )
        .eq(
          "scheduled_start",
          scheduledStart.toISOString()
        )
        .neq(
          "status",
          "cancelled"
        )

    if (conflictError) {
      setSaving(false)
      setError(
        conflictError.message
      )
      return
    }

    const hasTeamConflict =
      (conflictData ?? []).some(
        (game) =>
          game.home_tournament_team_id ===
            homeTournamentTeamId ||
          game.home_tournament_team_id ===
            awayTournamentTeamId ||
          game.away_tournament_team_id ===
            homeTournamentTeamId ||
          game.away_tournament_team_id ===
            awayTournamentTeamId
      )

    if (hasTeamConflict) {
      setSaving(false)
      setError(
        "One of these teams already has a game scheduled at that time."
      )
      return
    }

    const hasFieldConflict =
      Boolean(fieldResourceId) &&
      (conflictData ?? []).some(
        (game) =>
          game.field_resource_id ===
          fieldResourceId
      )

    if (hasFieldConflict) {
      setSaving(false)
      setError(
        "That field already has a game scheduled at this time."
      )
      return
    }

    const parsedGameNumber =
      gameNumber.trim()
        ? Number(gameNumber)
        : null

    if (
      parsedGameNumber !== null &&
      (
        !Number.isInteger(
          parsedGameNumber
        ) ||
        parsedGameNumber < 1
      )
    ) {
      setSaving(false)
      setError(
        "Game number must be a positive whole number."
      )
      return
    }

    const {
      error: insertError,
    } =
      await supabase
        .from("tournament_games")
        .insert({
          tournament_id:
            tournamentId,

          division_id:
            divisionId,

          home_tournament_team_id:
            homeTournamentTeamId,

          away_tournament_team_id:
            awayTournamentTeamId,

          field_resource_id:
            fieldResourceId || null,

          scheduled_start:
            scheduledStart.toISOString(),

          game_number:
            parsedGameNumber,

          round_name:
            roundName.trim() ||
            null,

          status,
        })

    if (insertError) {
      setSaving(false)
      setError(
        insertError.message
      )
      return
    }

    setSaving(false)

    navigate(
      `/dashboard/tournaments/${tournamentId}/schedule`,
      {
        replace: true,
      }
    )
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-scoreboard-dark px-6 py-12 text-scoreboard-cream">
        <p className="scoreboard-label">
          Loading Schedule Game...
        </p>
      </main>
    )
  }

  if (
    error &&
    !tournament
  ) {
    return (
      <main className="min-h-screen bg-scoreboard-dark px-6 py-12 text-scoreboard-cream">
        <div className="mx-auto max-w-3xl">

          <div className="border border-scoreboard-red/60 bg-scoreboard-green p-6">

            <p className="scoreboard-label text-scoreboard-amber">
              Unable To Load Tournament
            </p>

            <p className="mt-3 text-sm text-scoreboard-muted">
              {error}
            </p>

          </div>

        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-scoreboard-dark text-scoreboard-cream">

      {/* HEADER */}
      <section className="border-b border-scoreboard-cream/20 bg-scoreboard-green">

        <div className="mx-auto max-w-3xl px-6 py-10">

          <Link
            to={`/dashboard/tournaments/${tournamentId}/schedule`}
            className="
              inline-flex
              items-center
              gap-2
              text-xs
              font-black
              uppercase
              tracking-[0.12em]
              text-scoreboard-muted
              hover:text-scoreboard-amber
            "
          >
            <ArrowLeft className="h-4 w-4" />
            Tournament Schedule
          </Link>

          <div className="mt-8">

            <p className="scoreboard-label text-scoreboard-amber">
              Tournament Operations
            </p>

            <h1 className="mt-3 text-3xl font-black uppercase tracking-[0.06em] sm:text-4xl">
              Schedule Game
            </h1>

            {tournament && (

              <p className="mt-4 text-sm text-scoreboard-muted">
                {tournament.name}
              </p>

            )}

          </div>

        </div>

      </section>

      <section className="mx-auto max-w-3xl px-6 py-10">

        <form
          onSubmit={
            handleSubmit
          }
          className="scoreboard-panel p-4"
        >

          <div className="space-y-6 border border-scoreboard-cream/30 bg-scoreboard-green p-6">

            {/* DIVISION */}
            <label className="block">

              <span className="scoreboard-label text-scoreboard-amber">
                Division
              </span>

              <select
                value={divisionId}
                onChange={(event) =>
                  setDivisionId(
                    event.target.value
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
                  text-base
                  text-scoreboard-dark
                "
              >

                <option value="">
                  Select Division
                </option>

                {divisions.map(
                  (division) => (

                    <option
                      key={division.id}
                      value={division.id}
                    >
                      {division.age_group}
                      {" — "}
                      {division.name}
                    </option>

                  )
                )}

              </select>

            </label>

            {/* TEAMS */}
            <div className="grid gap-5 sm:grid-cols-2">

              <label className="block">

                <span className="scoreboard-label">
                  Away Team
                </span>

                <select
                  value={
                    awayTournamentTeamId
                  }
                  onChange={(event) =>
                    setAwayTournamentTeamId(
                      event.target.value
                    )
                  }
                  disabled={
                    !divisionId
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
                    disabled:opacity-50
                  "
                >

                  <option value="">
                    Select Away Team
                  </option>

                  {divisionTeams.map(
                    (team) => (

                      <option
                        key={team.id}
                        value={team.id}
                        disabled={
                          team.id ===
                          homeTournamentTeamId
                        }
                      >
                        {team.display_name}
                      </option>

                    )
                  )}

                </select>

              </label>

              <label className="block">

                <span className="scoreboard-label">
                  Home Team
                </span>

                <select
                  value={
                    homeTournamentTeamId
                  }
                  onChange={(event) =>
                    setHomeTournamentTeamId(
                      event.target.value
                    )
                  }
                  disabled={
                    !divisionId
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
                    disabled:opacity-50
                  "
                >

                  <option value="">
                    Select Home Team
                  </option>

                  {divisionTeams.map(
                    (team) => (

                      <option
                        key={team.id}
                        value={team.id}
                        disabled={
                          team.id ===
                          awayTournamentTeamId
                        }
                      >
                        {team.display_name}
                      </option>

                    )
                  )}

                </select>

              </label>

            </div>

            {selectedDivision &&
              divisionTeams.length ===
                0 && (

                <div className="border border-scoreboard-amber/30 bg-scoreboard-dark p-4">

                  <p className="text-sm text-scoreboard-muted">
                    No registered teams are currently assigned to this division.
                  </p>

                </div>

              )}

            {/* DATE / TIME */}
            <div className="grid gap-5 sm:grid-cols-2">

              <label className="block">

                <span className="scoreboard-label">
                  Game Date
                </span>

                <div className="mt-2">

                  <input
                    type="date"
                    min={
                      tournament?.start_date
                    }
                    max={
                      tournament?.end_date
                    }
                    value={gameDate}
                    onChange={(event) =>
                      setGameDate(
                        event.target.value
                      )
                    }
                    className="
                      w-full
                      rounded-none
                      border
                      border-scoreboard-cream/30
                      bg-scoreboard-cream
                      px-3
                      py-3
                      text-base
                      text-scoreboard-dark
                      [color-scheme:light]
                    "
                  />

                </div>

              </label>

              <label className="block">

                <span className="scoreboard-label">
                  Start Time
                </span>

                <div className="mt-2">

                  <input
                    type="time"
                    value={gameTime}
                    onChange={(event) =>
                      setGameTime(
                        event.target.value
                      )
                    }
                    className="
                      w-full
                      rounded-none
                      border
                      border-scoreboard-cream/30
                      bg-scoreboard-cream
                      px-3
                      py-3
                      text-base
                      text-scoreboard-dark
                      [color-scheme:light]
                    "
                  />

                </div>

              </label>

            </div>

            {/* FIELD */}
            <label className="block">

              <span className="scoreboard-label">
                Field
              </span>

              <select
                value={
                  fieldResourceId
                }
                onChange={(event) =>
                  setFieldResourceId(
                    event.target.value
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
                  text-base
                  text-scoreboard-dark
                "
              >

                <option value="">
                  Field TBD
                </option>

                {fields.map(
                  (field) => (

                    <option
                      key={field.id}
                      value={field.id}
                    >
                      {field.name}
                      {(field.city ||
                        field.state) &&
                        ` — ${[
                          field.city,
                          field.state,
                        ]
                          .filter(Boolean)
                          .join(", ")}`
                      }
                    </option>

                  )
                )}

              </select>

            </label>

            {/* GAME DETAILS */}
            <div className="grid gap-5 sm:grid-cols-2">

              <label className="block">

                <span className="scoreboard-label">
                  Game Number
                </span>

                <input
                  type="number"
                  min="1"
                  step="1"
                  value={gameNumber}
                  onChange={(event) =>
                    setGameNumber(
                      event.target.value
                    )
                  }
                  placeholder="1"
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
                  "
                />

              </label>

              <label className="block">

                <span className="scoreboard-label">
                  Round
                </span>

                <select
                  value={roundName}
                  onChange={(event) =>
                    setRoundName(
                      event.target.value
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
                    text-base
                    text-scoreboard-dark
                  "
                >
                  <option value="Pool Play">
                    Pool Play
                  </option>

                  <option value="Quarterfinal">
                    Quarterfinal
                  </option>

                  <option value="Semifinal">
                    Semifinal
                  </option>

                  <option value="Championship">
                    Championship
                  </option>

                  <option value="Consolation">
                    Consolation
                  </option>
                </select>

              </label>

            </div>

            {/* STATUS */}
            <label className="block">

              <span className="scoreboard-label">
                Status
              </span>

              <select
                value={status}
                onChange={(event) =>
                  setStatus(
                    event.target.value
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
                  text-base
                  text-scoreboard-dark
                "
              >
                <option value="scheduled">
                  Scheduled
                </option>

                <option value="delayed">
                  Delayed
                </option>

                <option value="postponed">
                  Postponed
                </option>
              </select>

            </label>

            {/* PREVIEW */}
            {(awayTeam ||
              homeTeam) && (

              <div className="border border-scoreboard-cream/20 bg-scoreboard-dark p-5">

                <p className="scoreboard-label text-scoreboard-amber">
                  Game Preview
                </p>

                <div className="mt-5 grid gap-3 sm:grid-cols-[1fr_auto_1fr] sm:items-center">

                  <div>

                    <p className="scoreboard-label">
                      Away
                    </p>

                    <p className="mt-2 font-black uppercase">
                      {awayTeam
                        ?.display_name ??
                        "TBD"}
                    </p>

                  </div>

                  <div className="scoreboard-number text-center text-scoreboard-muted">
                    VS
                  </div>

                  <div className="sm:text-right">

                    <p className="scoreboard-label">
                      Home
                    </p>

                    <p className="mt-2 font-black uppercase">
                      {homeTeam
                        ?.display_name ??
                        "TBD"}
                    </p>

                  </div>

                </div>

                <div className="mt-5 flex flex-wrap gap-4 border-t border-scoreboard-cream/20 pt-4 text-xs text-scoreboard-muted">

                  {gameDate && (
                    <span className="flex items-center gap-2">

                      <CalendarDays className="h-4 w-4 text-scoreboard-amber" />

                      {new Date(
                        `${gameDate}T12:00:00`
                      ).toLocaleDateString(
                        [],
                        {
                          month:
                            "short",
                          day:
                            "numeric",
                        }
                      )}

                    </span>
                  )}

                  {fieldResourceId && (
                    <span className="flex items-center gap-2">

                      <MapPin className="h-4 w-4 text-scoreboard-amber" />

                      {
                        fields.find(
                          (field) =>
                            field.id ===
                            fieldResourceId
                        )?.name
                      }

                    </span>
                  )}

                  <span className="flex items-center gap-2">

                    <Trophy className="h-4 w-4 text-scoreboard-amber" />

                    {roundName}

                  </span>

                </div>

              </div>

            )}

            {error && (

              <div className="border border-scoreboard-red/60 bg-scoreboard-dark p-4">

                <p className="text-sm text-scoreboard-muted">
                  {error}
                </p>

              </div>

            )}

            <Button
              type="submit"
              disabled={
                saving ||
                !divisionId ||
                !awayTournamentTeamId ||
                !homeTournamentTeamId ||
                !gameDate ||
                !gameTime
              }
              className="
                w-full
                rounded-none
                bg-scoreboard-cream
                py-5
                font-black
                uppercase
                tracking-[0.12em]
                text-scoreboard-dark
                hover:bg-scoreboard-amber
                disabled:opacity-50
              "
            >
              {saving
                ? "Scheduling..."
                : "Schedule Game"}
            </Button>

          </div>

        </form>

      </section>

    </main>
  )
}
