import { FormEvent, useEffect, useMemo, useState } from "react"
import {
  ArrowLeft,
  CalendarDays,
  MapPin,
  Trophy,
} from "lucide-react"
import { Link, useNavigate, useParams } from "react-router-dom"

import { Button } from "@/components/ui/button"
import { useAuth } from "@/features/auth/auth-context"
import { supabase } from "@/lib/supabase"

type Tournament = {
  id: string
  name: string
  city: string | null
  state: string | null
  start_date: string
  end_date: string
  status: string
}

type Division = {
  id: string
  tournament_id: string
  name: string
  age_group: string | null
}

type Team = {
  id: string
  organization_id: string
  name: string
  age_group: string | null
  classification: string | null
  city: string | null
  state: string | null
  status: string
}

type OrganizationMembership = {
  organization_id: string
  role: string
  status: string
}

export function TournamentRegistrationPage() {
  const { tournamentId } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()

  const [tournament, setTournament] = useState<Tournament | null>(null)
  const [divisions, setDivisions] = useState<Division[]>([])
  const [teams, setTeams] = useState<Team[]>([])

  const [teamId, setTeamId] = useState("")
  const [divisionId, setDivisionId] = useState("")
  const [notes, setNotes] = useState("")

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    async function loadPage() {
      if (!tournamentId || !user) {
        setError("Missing tournament or user.")
        setLoading(false)
        return
      }

      setLoading(true)
      setError("")

      const [
        tournamentResult,
        divisionResult,
        membershipResult,
      ] = await Promise.all([
        supabase
          .from("tournaments")
          .select(`
            id,
            name,
            city,
            state,
            start_date,
            end_date,
            status
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
          .from("organization_members")
          .select(`
            organization_id,
            role,
            status
          `)
          .eq("user_id", user.id)
          .eq("status", "active"),
      ])

      if (tournamentResult.error) {
        setError(tournamentResult.error.message)
        setLoading(false)
        return
      }

      if (divisionResult.error) {
        setError(divisionResult.error.message)
        setLoading(false)
        return
      }

      if (membershipResult.error) {
        setError(membershipResult.error.message)
        setLoading(false)
        return
      }

      const memberships =
        (membershipResult.data ?? []) as OrganizationMembership[]

      const manageableOrganizationIds = memberships
        .filter((membership) =>
          ["manager", "owner", "admin"].includes(membership.role)
        )
        .map((membership) => membership.organization_id)

      if (manageableOrganizationIds.length === 0) {
        setError(
          "You must manage an organization before registering a team."
        )

        setTournament(
          tournamentResult.data as Tournament
        )

        setDivisions(
          (divisionResult.data ?? []) as Division[]
        )

        setLoading(false)
        return
      }

      const { data: teamData, error: teamError } =
        await supabase
          .from("teams")
          .select(`
            id,
            organization_id,
            name,
            age_group,
            classification,
            city,
            state,
            status
          `)
          .in(
            "organization_id",
            manageableOrganizationIds
          )
          .eq("status", "active")
          .order("age_group")
          .order("name")

      if (teamError) {
        setError(teamError.message)
        setLoading(false)
        return
      }

      setTournament(
        tournamentResult.data as Tournament
      )

      setDivisions(
        (divisionResult.data ?? []) as Division[]
      )

      setTeams(
        (teamData ?? []) as Team[]
      )

      if (teamData && teamData.length === 1) {
        setTeamId(teamData[0].id)
      }

      setLoading(false)
    }

    void loadPage()
  }, [tournamentId, user])

  const selectedTeam = useMemo(
    () =>
      teams.find((team) => team.id === teamId) ?? null,
    [teams, teamId]
  )

  const compatibleDivisions = useMemo(() => {
    if (!selectedTeam?.age_group) {
      return divisions
    }

    const matching = divisions.filter(
      (division) =>
        division.age_group === selectedTeam.age_group
    )

    return matching.length > 0
      ? matching
      : divisions
  }, [divisions, selectedTeam])

  useEffect(() => {
    if (!teamId) {
      setDivisionId("")
      return
    }

    if (compatibleDivisions.length === 1) {
      setDivisionId(compatibleDivisions[0].id)
      return
    }

    if (
      divisionId &&
      !compatibleDivisions.some(
        (division) => division.id === divisionId
      )
    ) {
      setDivisionId("")
    }
  }, [
    teamId,
    compatibleDivisions,
    divisionId,
  ])

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault()

    if (!tournamentId || !user) {
      setError("Missing tournament or user.")
      return
    }

    if (!selectedTeam) {
      setError("Select a team.")
      return
    }

    if (!divisionId) {
      setError("Select a tournament division.")
      return
    }

    setSaving(true)
    setError("")

    const { data: existingRegistration, error: lookupError } =
      await supabase
        .from("tournament_teams")
        .select(`
          id,
          status
        `)
        .eq("tournament_id", tournamentId)
        .eq("division_id", divisionId)
        .eq("team_id", selectedTeam.id)
        .maybeSingle()

    if (lookupError) {
      setSaving(false)
      setError(lookupError.message)
      return
    }

    if (existingRegistration) {
      setSaving(false)
      setError(
        "This team is already registered for that tournament division."
      )
      return
    }

    const { error: insertError } =
      await supabase
        .from("tournament_teams")
        .insert({
          tournament_id: tournamentId,
          division_id: divisionId,
          team_id: selectedTeam.id,

          display_name: selectedTeam.name,

          city:
            selectedTeam.city ?? null,

          state:
            selectedTeam.state ?? null,

          status: "pending",

          notes:
            notes.trim() || null,
        })

    setSaving(false)

    if (insertError) {
      setError(insertError.message)
      return
    }

    navigate(
  "/dashboard/registrations/success",
  {
    replace: true,
    state: {
      tournamentId,
      teamId: selectedTeam.id,
      divisionId,
    },
  }
)
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-scoreboard-dark px-4 py-12 text-scoreboard-cream sm:px-6">
        <div className="mx-auto max-w-4xl">
          <p className="scoreboard-label">
            Loading Registration...
          </p>
        </div>
      </main>
    )
  }

  if (!tournament) {
    return (
      <main className="min-h-screen bg-scoreboard-dark px-4 py-12 text-scoreboard-cream sm:px-6">
        <div className="mx-auto max-w-4xl">
          <p className="scoreboard-label text-scoreboard-amber">
            Tournament Not Found
          </p>
        </div>
      </main>
    )
  }

  const startDate = new Date(
    `${tournament.start_date}T12:00:00`
  )

  const endDate = new Date(
    `${tournament.end_date}T12:00:00`
  )

  return (
    <main className="min-h-screen bg-scoreboard-dark text-scoreboard-cream">

      <section className="border-b border-scoreboard-cream/20 bg-scoreboard-green">

        <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">

          <Link
            to={`/tournaments/${tournament.id}`}
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
            Tournament
          </Link>

          <p className="scoreboard-label mt-8 text-scoreboard-amber">
            Tournament Registration
          </p>

          <h1 className="mt-3 text-3xl font-black uppercase leading-tight tracking-[0.05em] sm:text-4xl">
            {tournament.name}
          </h1>

          <div className="mt-5 flex flex-wrap gap-x-6 gap-y-3 text-sm text-scoreboard-muted">

            <div className="flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-scoreboard-amber" />

              {startDate.toLocaleDateString([], {
                month: "short",
                day: "numeric",
              })}

              {" – "}

              {endDate.toLocaleDateString([], {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </div>

            {(tournament.city || tournament.state) && (
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-scoreboard-amber" />

                {[tournament.city, tournament.state]
                  .filter(Boolean)
                  .join(", ")}
              </div>
            )}

          </div>

        </div>

      </section>

      <section className="mx-auto max-w-4xl px-4 py-10 sm:px-6">

        <form
          onSubmit={handleSubmit}
          className="scoreboard-panel p-4"
        >
          <div className="border border-scoreboard-cream/35 bg-scoreboard-green p-6 sm:p-8">

            <div className="border-b border-scoreboard-cream/20 pb-5">

              <p className="scoreboard-label text-scoreboard-amber">
                Register Team
              </p>

              <h2 className="mt-2 text-2xl font-black uppercase tracking-[0.05em]">
                Team Entry
              </h2>

              <p className="mt-3 text-sm leading-6 text-scoreboard-muted">
                Select one of your organization teams and the
                tournament division you want to enter.
              </p>

            </div>

            <div className="mt-7 space-y-6">

              <label className="block">

                <span className="scoreboard-label text-scoreboard-cream">
                  Team
                </span>

                <select
                  value={teamId}
                  onChange={(event) =>
                    setTeamId(event.target.value)
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
                  "
                >
                  <option value="">
                    Select Team
                  </option>

                  {teams.map((team) => (
                    <option
                      key={team.id}
                      value={team.id}
                    >
                      {[
                        team.age_group,
                        team.name,
                      ]
                        .filter(Boolean)
                        .join(" ")}
                    </option>
                  ))}

                </select>

              </label>

              <label className="block">

                <span className="scoreboard-label text-scoreboard-cream">
                  Division
                </span>

                <select
                  value={divisionId}
                  onChange={(event) =>
                    setDivisionId(event.target.value)
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
                  "
                >
                  <option value="">
                    Select Division
                  </option>

                  {compatibleDivisions.map(
                    (division) => (
                      <option
                        key={division.id}
                        value={division.id}
                      >
                        {[
                          division.age_group,
                          division.name,
                        ]
                          .filter(Boolean)
                          .join(" • ")}
                      </option>
                    )
                  )}

                </select>

              </label>

              {selectedTeam && (
                <div className="border border-scoreboard-cream/20 bg-scoreboard-dark p-5">

                  <div className="flex items-start gap-3">

                    <Trophy className="mt-1 h-5 w-5 shrink-0 text-scoreboard-amber" />

                    <div>

                      <p className="scoreboard-label text-scoreboard-amber">
                        Team Entry
                      </p>

                      <h3 className="mt-2 text-lg font-black uppercase tracking-[0.05em]">
                        {selectedTeam.name}
                      </h3>

                      <p className="mt-2 text-sm text-scoreboard-muted">
                        {[
                          selectedTeam.age_group,
                          selectedTeam.classification,
                          [selectedTeam.city, selectedTeam.state]
                            .filter(Boolean)
                            .join(", "),
                        ]
                          .filter(Boolean)
                          .join(" • ")}
                      </p>

                    </div>

                  </div>

                </div>
              )}

              <label className="block">

                <span className="scoreboard-label text-scoreboard-cream">
                  Notes
                </span>

                <textarea
                  value={notes}
                  onChange={(event) =>
                    setNotes(event.target.value)
                  }
                  rows={4}
                  placeholder="Optional registration notes..."
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

            </div>

            {error && (
              <div className="mt-6 border border-scoreboard-red/60 bg-scoreboard-dark p-4">

                <p className="scoreboard-label text-scoreboard-amber">
                  Registration
                </p>

                <p className="mt-2 text-sm leading-6 text-scoreboard-muted">
                  {error}
                </p>

              </div>
            )}

            <div className="mt-8 border-t border-scoreboard-cream/20 pt-6">

              <Button
                type="submit"
                disabled={
                  saving ||
                  teams.length === 0
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
                "
              >
                {saving
                  ? "Submitting Registration..."
                  : "Submit Registration"}
              </Button>

              <p className="mt-4 text-center text-[10px] font-bold uppercase tracking-[0.10em] text-scoreboard-muted">
                Registration will be submitted for approval
              </p>

            </div>

          </div>
        </form>

      </section>

    </main>
  )
}