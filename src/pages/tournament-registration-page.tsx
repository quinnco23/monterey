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
  name: string
  age_group: string
  registration_fee_cents: number
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

type TeamInsuranceProfile = {
  id: string
  provider: string
  policy_number: string
  effective_date: string | null
  expiration_date: string
  certificate_path: string | null
  status:
    | "pending"
    | "verified"
    | "rejected"
    | "expired"
    | "needs_review"
}

type TournamentReadiness = {
  ready: boolean
  team_active?: boolean
  division_valid?: boolean
  age_group_match?: boolean
  roster_exists?: boolean
  roster_id?: string | null
  roster_status?: string | null
  active_eligible_player_count?: number
  minimum_roster_players?: number
  reasons?: string[]
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
  const [insuranceProvider, setInsuranceProvider] = useState("")
const [insurancePolicyNumber, setInsurancePolicyNumber] = useState("")
const [insuranceExpiration, setInsuranceExpiration] = useState("")

const [insuranceAttested, setInsuranceAttested] = useState(false)
const [termsAccepted, setTermsAccepted] = useState(false)
const [waiverAccepted, setWaiverAccepted] = useState(false)
const [eligibilityAttested, setEligibilityAttested] = useState(false)

const [
  teamInsurance,
  setTeamInsurance,
] = useState<TeamInsuranceProfile | null>(null)

const [
  loadingTeamInsurance,
  setLoadingTeamInsurance,
] = useState(false)

const [
  existingPaymentStatus,
  setExistingPaymentStatus,
] = useState<string | null>(null)


  

  

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
          age_group,
          classification,
          registration_fee_cents
        `)
        .eq("tournament_id", tournamentId)
        .eq("active", true)
        .order("age_group")
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

      console.log(
        "TOURNAMENT ID:",
        tournamentId
      )
      
      console.log(
        "TOURNAMENT RESULT:",
        tournamentResult.data
      )
      
      console.log(
        "DIVISION RESULT:",
        divisionResult.data
      )
      
      console.log(
        "DIVISION ERROR:",
        divisionResult.error
      )

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

  useEffect(() => {
    async function loadTeamInsurance() {
      if (!selectedTeam) {
        setTeamInsurance(null)
  
        setInsuranceProvider("")
        setInsurancePolicyNumber("")
        setInsuranceExpiration("")
  
        return
      }
  
      setLoadingTeamInsurance(true)
  
      const {
        data,
        error,
      } = await supabase
        .from("team_insurance")
        .select(`
          id,
          provider,
          policy_number,
          effective_date,
          expiration_date,
          certificate_path,
          status
        `)
        .eq(
          "team_id",
          selectedTeam.id
        )
        .maybeSingle()
  
      if (error) {
        console.error(
          "TEAM INSURANCE LOOKUP ERROR:",
          error
        )
  
        setTeamInsurance(null)
        setLoadingTeamInsurance(false)
        return
      }
  
      const insurance =
        data as TeamInsuranceProfile | null
  
      setTeamInsurance(insurance)
  
      /*
       * Prefill whenever a team insurance
       * record exists.
       *
       * Verification status is displayed
       * separately below.
       */
      if (insurance) {
        setInsuranceProvider(
          insurance.provider ?? ""
        )
  
        setInsurancePolicyNumber(
          insurance.policy_number ?? ""
        )
  
        setInsuranceExpiration(
          insurance.expiration_date ?? ""
        )
      } else {
        setInsuranceProvider("")
        setInsurancePolicyNumber("")
        setInsuranceExpiration("")
      }
  
      setLoadingTeamInsurance(false)
    }
  
    void loadTeamInsurance()
  }, [selectedTeam])

  const selectedDivision = useMemo(
    () =>
      divisions.find((division) => division.id === divisionId) ?? null,
    [divisions, divisionId]
  )

  const insuranceCoversTournament = useMemo(() => {
    if (
      !teamInsurance ||
      !tournament
    ) {
      return false
    }
  
    const tournamentStart =
      new Date(
        `${tournament.start_date}T12:00:00`
      )
  
    const tournamentEnd =
      new Date(
        `${tournament.end_date}T12:00:00`
      )
  
    const insuranceExpiration =
      new Date(
        `${teamInsurance.expiration_date}T12:00:00`
      )
  
    const expirationCovers =
      insuranceExpiration.getTime() >=
      tournamentEnd.getTime()
  
    if (
      !teamInsurance.effective_date
    ) {
      return expirationCovers
    }
  
    const insuranceEffective =
      new Date(
        `${teamInsurance.effective_date}T12:00:00`
      )
  
    const startsInTime =
      insuranceEffective.getTime() <=
      tournamentStart.getTime()
  
    return (
      startsInTime &&
      expirationCovers
    )
  }, [
    teamInsurance,
    tournament,
  ])

  const insuranceReady =
  teamInsurance?.status ===
    "verified" &&
  insuranceCoversTournament

  useEffect(() => {
    async function loadExistingRegistration() {
      if (
        !tournamentId ||
        !selectedTeam ||
        !selectedDivision
      ) {
        setExistingPaymentStatus(null)
        return
      }
  
      const {
        data,
        error,
      } = await supabase
        .from("tournament_registrations")
        .select(`
          id,
          payment_status
        `)
        .eq(
          "tournament_id",
          tournamentId
        )
        .eq(
          "division_id",
          selectedDivision.id
        )
        .eq(
          "team_id",
          selectedTeam.id
        )
        .maybeSingle()
  
      if (error) {
        console.error(
          "EXISTING REGISTRATION LOOKUP ERROR:",
          error
        )
  
        setExistingPaymentStatus(null)
        return
      }
  
      setExistingPaymentStatus(
        data?.payment_status ?? null
      )
    }
  
    void loadExistingRegistration()
  }, [
    tournamentId,
    selectedTeam,
    selectedDivision,
  ])

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

  console.log(
    "ALL DIVISIONS:",
    divisions
  )
  
  console.log(
    "SELECTED TEAM:",
    selectedTeam
  )
  
  console.log(
    "COMPATIBLE DIVISIONS:",
    compatibleDivisions
  )

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

  function showRegistrationError(
    message: string
  ) {
    setError(message)
  
    setTimeout(() => {
      document
        .getElementById(
          "registration-error"
        )
        ?.scrollIntoView({
          behavior: "smooth",
          block: "center",
        })
    }, 0)
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault()
  
    if (
      !tournamentId ||
      !user ||
      !selectedTeam ||
      !selectedDivision
    ) {
      setError("Select a team and division.")
      return
    }
  
    if (
      !insuranceAttested ||
      !eligibilityAttested ||
      !termsAccepted ||
      !waiverAccepted
    ) {
      setError(
        "Please complete all insurance, eligibility, and agreement confirmations."
      )
      return
    }
    
    /*
     * A verified policy must cover the
     * entire tournament date range.
     */
    if (
      teamInsurance &&
      teamInsurance.status === "verified" &&
      !insuranceCoversTournament
    ) {
      setError(
        "The verified insurance policy does not cover the full tournament dates."
      )
      return
    }
    
    /*
     * Tournament registration readiness.
     *
     * The backend is authoritative here.
     * Do not create a registration or start
     * Stripe Checkout unless the team passes.
     */
    setSaving(true)
    setError("")
    
    const {
      data: readinessData,
      error: readinessError,
    } = await supabase.rpc(
      "validate_tournament_registration_readiness",
      {
        target_team_id: selectedTeam.id,
        target_tournament_id: tournamentId,
        target_division_id: selectedDivision.id,
      }
    )
    
    if (readinessError) {
      console.error(
        "TOURNAMENT READINESS ERROR:",
        readinessError
      )
    
      setSaving(false)
      setError(
        readinessError.message ||
          "Team readiness could not be checked."
      )
      return
    }
    
    const readiness =
      readinessData as TournamentReadiness | null
    
    console.log(
      "TOURNAMENT READINESS:",
      readiness
    )
    
    if (!readiness?.ready) {
      setSaving(false)
    
      const reasons =
        readiness?.reasons ?? []
    
        if (
          reasons.includes(
            "MINIMUM_ROSTER_NOT_MET"
          )
        ) {
          const currentPlayers =
            readiness?.active_eligible_player_count ?? 0
        
          const minimumPlayers =
            readiness?.minimum_roster_players ?? 1
        
            showRegistrationError(
              `This team is not ready for tournament registration. ` +
              `It currently has ${currentPlayers} active, eligible ` +
              `player${currentPlayers === 1 ? "" : "s"} on the roster. ` +
              `At least ${minimumPlayers} ` +
              `player${minimumPlayers === 1 ? "" : "s"} required.`
            )
            
            return
        }
    
        if (
          reasons.includes(
            "NO_REGISTRATION_READY_ROSTER"
          )
        ) {
          showRegistrationError(
            "This team does not have an open, active, or locked roster available for tournament registration."
          )
        
          return
        }
    
      if (
        reasons.includes(
          "TEAM_NOT_ACTIVE"
        )
      ) {
        setError(
          "This team must be active before it can register for a tournament."
        )
        return
      }
    
      if (
        reasons.includes(
          "AGE_GROUP_MISMATCH"
        )
      ) {
        setError(
          "This team's age group does not match the selected tournament division."
        )
        return
      }
    
      if (
        reasons.includes(
          "DIVISION_INACTIVE"
        )
      ) {
        setError(
          "This tournament division is not currently accepting registrations."
        )
        return
      }
    
      if (
        reasons.includes(
          "DIVISION_TOURNAMENT_MISMATCH"
        )
      ) {
        setError(
          "The selected division does not belong to this tournament."
        )
        return
      }
    
      setError(
        "This team does not currently meet the requirements for tournament registration."
      )
    
      return
    }
    
    /*
     * Readiness passed.
     * Continue with registration/payment.
     */
    
    setSaving(true)
    setError("")
    setError("")
  
    /*
     * Look for an existing registration.
     *
     * We reuse unpaid / pending / failed
     * registrations instead of creating duplicates.
     */
    const {
      data: existingRegistration,
      error: lookupError,
    } = await supabase
      .from("tournament_registrations")
      .select(`
        id,
        status,
        payment_status,
        registration_fee_cents,
        stripe_checkout_session_id
      `)
      .eq(
        "tournament_id",
        tournamentId
      )
      .eq(
        "division_id",
        selectedDivision.id
      )
      .eq(
        "team_id",
        selectedTeam.id
      )
      .maybeSingle()
  
    if (lookupError) {
      setSaving(false)
      setError(lookupError.message)
      return
    }
  
    /*
     * Already paid.
     *
     * Never create another Stripe Checkout
     * session for a paid registration.
     */
    if (
      existingRegistration?.payment_status ===
      "paid"
    ) {
      setSaving(false)
  
      navigate(
        `/dashboard/tournaments/${tournamentId}/registration/${existingRegistration.id}/payment-success`,
        {
          replace: true,
        }
      )
  
      return
    }
  
    const now =
      new Date().toISOString()
  
    /*
     * Reuse an existing registration if one
     * exists. Otherwise create a new one.
     */
    let registration:
      | { id: string }
      | null = null
  
    if (existingRegistration?.id) {
      registration = {
        id: existingRegistration.id,
      }
    } else {
      const {
        data: createdRegistration,
        error: registrationError,
      } = await supabase
        .from(
          "tournament_registrations"
        )
        .insert({
          tournament_id:
            tournamentId,
  
          division_id:
            selectedDivision.id,
  
          team_id:
            selectedTeam.id,
  
          organization_id:
            selectedTeam.organization_id,
  
          registered_by_user_id:
            user.id,
  
          status:
            "submitted",
  
          payment_status:
            "unpaid",
  
          registration_fee_cents:
            selectedDivision.registration_fee_cents,
  
          insurance_provider:
            insuranceProvider.trim() ||
            null,
  
          insurance_policy_number:
            insurancePolicyNumber.trim() ||
            null,
  
          insurance_expiration:
            insuranceExpiration ||
            null,
  
          insurance_attested:
            true,
  
          insurance_attested_at:
            now,
  
          eligibility_attested:
            true,
  
          eligibility_attested_at:
            now,
  
          terms_accepted:
            true,
  
          terms_accepted_at:
            now,
  
          waiver_accepted:
            true,
  
          waiver_accepted_at:
            now,
  
          submitted_at:
            now,
  
          paid_at:
            null,
        })
        .select("id")
        .single()
  
      if (
        registrationError ||
        !createdRegistration
      ) {
        setSaving(false)
  
        setError(
          registrationError?.message ??
            "Registration could not be created."
        )
  
        return
      }
  
      registration =
        createdRegistration
    }
  
    /*
     * Start or restart Stripe Checkout.
     *
     * create-tournament-checkout owns the
     * trusted payment-state update.
     */
    const {
      data: checkoutData,
      error: checkoutError,
    } = await supabase.functions.invoke(
      "create-tournament-checkout",
      {
        body: {
          registrationId:
            registration.id,
        },
      }
    )
  
    if (checkoutError) {
      console.error(
        "CHECKOUT ERROR:",
        checkoutError
      )
  
      let checkoutMessage =
        "Registration exists, but checkout could not be started."
  
      try {
        const context =
          (checkoutError as any)?.context
  
        if (context) {
          const responseBody =
            await context.clone().json()
  
          console.error(
            "CHECKOUT RESPONSE BODY:",
            responseBody
          )
  
          if (responseBody?.error) {
            checkoutMessage =
              responseBody.error
          }
        }
      } catch (responseError) {
        console.error(
          "Could not read checkout error response:",
          responseError
        )
      }
  
      setSaving(false)
      setError(checkoutMessage)
  
      return
    }
  
    if (!checkoutData?.url) {
      setSaving(false)
  
      setError(
        "Stripe checkout URL was not returned."
      )
  
      return
    }
  
    setSaving(false)
  
    window.location.href =
      checkoutData.url
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
                Tournament Registration
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
              <div className="mt-6 border border-scoreboard-red/60 bg-scoreboard-dark p-4" id="registration-error">

                <p className="scoreboard-label text-scoreboard-amber">
                  Registration
                </p>

                <p className="mt-2 text-sm leading-6 text-scoreboard-muted">
                  {error}
                </p>

              </div>
            )}

            <div className="mt-8 border-t border-scoreboard-cream/20 pt-6">

            {selectedDivision && (
  <div className="border border-scoreboard-cream/20 bg-scoreboard-dark p-5">

    <p className="scoreboard-label text-scoreboard-amber">
      Registration Fee
    </p>

    <div className="mt-4 flex items-end justify-between gap-4">

      <div>
        <p className="text-sm text-scoreboard-muted">
          {selectedDivision.age_group}{" "}
          {selectedDivision.name}
        </p>
      </div>

      <div className="scoreboard-number text-3xl text-scoreboard-cream">
        $
        {(
          selectedDivision.registration_fee_cents /
          100
        ).toFixed(2)}
      </div>

    </div>

    <p className="mt-4 text-xs uppercase tracking-[0.08em] text-scoreboard-muted">
      Test payment mode — no card will be charged.
    </p>

   


  </div>

  
)}

<div className="border border-scoreboard-cream/20 bg-scoreboard-dark p-5">

<p className="scoreboard-label text-scoreboard-amber">
  Insurance & Eligibility
</p>

{loadingTeamInsurance ? (
  <div className="mt-4 border border-scoreboard-cream/20 bg-scoreboard-dark p-4">
    <p className="text-sm text-scoreboard-muted">
      Checking team insurance...
    </p>
  </div>
) : teamInsurance ? (
  <div className="mt-4 border border-scoreboard-cream/20 bg-scoreboard-dark p-4">

    <p className="scoreboard-label text-scoreboard-amber">
      Team Insurance On File
    </p>

    <p className="mt-2 text-sm font-black uppercase text-scoreboard-cream">
      {teamInsurance.status.replaceAll(
        "_",
        " "
      )}
    </p>

    <p className="mt-2 text-sm text-scoreboard-muted">
      {teamInsurance.provider}
      {" • "}
      Expires{" "}
      {new Date(
        `${teamInsurance.expiration_date}T12:00:00`
      ).toLocaleDateString()}
    </p>

    {teamInsurance.status === "verified" &&
  insuranceCoversTournament && (
    <p className="mt-3 text-xs font-black uppercase tracking-[0.10em] text-scoreboard-amber">
      Verified & Covers Tournament
    </p>
  )}

{teamInsurance.status === "verified" &&
  !insuranceCoversTournament && (
    <div className="mt-3 border border-scoreboard-red/60 p-3">
      <p className="text-xs font-black uppercase tracking-[0.10em] text-scoreboard-red">
        Verified Policy Does Not Cover Tournament Dates
      </p>

      <p className="mt-2 text-xs text-scoreboard-muted">
        This policy expires before the tournament ends or begins after the tournament starts.
      </p>
    </div>
  )}

{teamInsurance.status !== "verified" && (
  <p className="mt-3 text-xs uppercase tracking-[0.08em] text-scoreboard-muted">
    This policy has not yet been verified by the platform.
  </p>
)}

    {teamInsurance.status !== "verified" && (
      <p className="mt-3 text-xs uppercase tracking-[0.08em] text-scoreboard-muted">
        This policy has not yet been verified by the platform.
      </p>
    )}

    

  </div>
) : selectedTeam ? (
  <div className="mt-4 border border-scoreboard-amber/40 bg-scoreboard-dark p-4">

    <p className="scoreboard-label text-scoreboard-amber">
      No Team Insurance On File
    </p>

    <p className="mt-2 text-sm text-scoreboard-muted">
      Enter insurance details below or add insurance from the team dashboard.
    </p>

  </div>
) : null}

<div className="mt-5 grid gap-4 sm:grid-cols-2">

  <label className="block">
    <span className="scoreboard-label text-scoreboard-cream">
      Insurance Provider
    </span>

    <input
      value={insuranceProvider}
      onChange={(e) => setInsuranceProvider(e.target.value)}
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
    <span className="scoreboard-label text-scoreboard-cream">
      Policy Number
    </span>

    <input
      value={insurancePolicyNumber}
      onChange={(e) => setInsurancePolicyNumber(e.target.value)}
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

  <label className="block sm:col-span-2">
    <span className="scoreboard-label text-scoreboard-cream">
      Policy Expiration
    </span>

    <input
      type="date"
      value={insuranceExpiration}
      onChange={(e) => setInsuranceExpiration(e.target.value)}
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

<div className="mt-6 space-y-4">

  <label className="flex items-start gap-3">
    <input
      type="checkbox"
      checked={insuranceAttested}
      onChange={(e) => setInsuranceAttested(e.target.checked)}
      className="mt-1"
    />

    <span className="text-sm text-scoreboard-muted">
      I certify that this team has current insurance coverage for tournament participation.
    </span>
  </label>

  <label className="flex items-start gap-3">
    <input
      type="checkbox"
      checked={eligibilityAttested}
      onChange={(e) => setEligibilityAttested(e.target.checked)}
      className="mt-1"
    />

    <span className="text-sm text-scoreboard-muted">
      I certify that all players meet the eligibility requirements for this division.
    </span>
  </label>

</div>
<div className="mt-5 border border-scoreboard-amber/40 bg-scoreboard-dark p-5">

  <p className="scoreboard-label text-scoreboard-amber">
    Need Insurance?
  </p>

  <h3 className="mt-2 text-lg font-black uppercase tracking-[0.05em]">
    Purchase Coverage
  </h3>

  <p className="mt-3 text-sm leading-6 text-scoreboard-muted">
    If your team does not currently have tournament insurance,
    you can purchase coverage from a third-party provider and
    return here to submit your policy information.
  </p>

  <a
    href="https://YOUR-INSURANCE-PARTNER-LINK"
    target="_blank"
    rel="noopener noreferrer"
    className="
      mt-5
      inline-flex
      w-full
      items-center
      justify-center
      border
      border-scoreboard-amber
      bg-scoreboard-amber
      px-4
      py-3
      text-xs
      font-black
      uppercase
      tracking-[0.12em]
      text-scoreboard-dark
      transition-colors
      hover:bg-scoreboard-cream
    "
  >
    Purchase Team Insurance
  </a>

  <p className="mt-3 text-[10px] uppercase tracking-[0.08em] text-scoreboard-muted">
    Insurance is purchased directly from the provider.
    Return to SCBC after purchase to submit your policy.
  </p>

</div>

</div>

<div className="border border-scoreboard-cream/20 bg-scoreboard-dark p-5">

<p className="scoreboard-label text-scoreboard-amber">
  Agreements
</p>

<div className="mt-5 space-y-4">

  <label className="flex items-start gap-3">
    <input
      type="checkbox"
      checked={termsAccepted}
      onChange={(e) => setTermsAccepted(e.target.checked)}
      className="mt-1"
    />

    <span className="text-sm text-scoreboard-muted">
      I agree to the tournament Terms of Service.
    </span>
  </label>

  <label className="flex items-start gap-3">
    <input
      type="checkbox"
      checked={waiverAccepted}
      onChange={(e) => setWaiverAccepted(e.target.checked)}
      className="mt-1"
    />

    <span className="text-sm text-scoreboard-muted">
      I accept the tournament liability waiver and participation rules.
    </span>
  </label>

</div>

</div>

{existingPaymentStatus && (
  <div className="mb-4 border border-scoreboard-cream/20 bg-scoreboard-dark p-4">
    <p className="scoreboard-label text-scoreboard-amber">
      Registration Status
    </p>

    <p className="mt-2 text-sm text-scoreboard-muted">
      {existingPaymentStatus === "paid"
        ? "This team has already paid for this tournament division."
        : existingPaymentStatus === "pending"
        ? "A payment session already exists. Continue to complete payment."
        : existingPaymentStatus === "failed"
        ? "The previous payment attempt did not complete. You can try again."
        : "This registration still requires payment."}
    </p>
  </div>
)}

{error && (
  <div className="mb-4 border border-scoreboard-red/60 bg-scoreboard-dark p-4">
    <p className="scoreboard-label text-scoreboard-amber">
      Registration Blocked
    </p>

    <p className="mt-2 text-sm leading-6 text-scoreboard-cream">
      {error}
    </p>
  </div>
)}

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
  ? "Processing..."
  : existingPaymentStatus === "paid"
  ? "View Registration"
  : existingPaymentStatus === "pending"
  ? "Continue Payment"
  : existingPaymentStatus === "failed"
  ? "Retry Payment"
  : existingPaymentStatus === "unpaid"
  ? "Continue Payment"
  : "Pay & Register"}
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