import {
  FormEvent,
  useEffect,
  useMemo,
  useState,
} from "react"

import {
  ArrowLeft,
  CalendarDays,
  MapPin,
  Trophy,
} from "lucide-react"

import {
  Link,
  useNavigate,
  useParams,
} from "react-router-dom"

import { Button } from "@/components/ui/button"
import { useAuth } from "@/features/auth/auth-context"
import { supabase } from "@/lib/supabase"


// =========================================
// TYPES
// =========================================

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
  classification: string | null
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

  registration_open?: boolean
  tournament_status?: string | null

  organization_active?: boolean
  team_active?: boolean
  division_valid?: boolean
  age_group_match?: boolean
  classification_match?: boolean

  roster_exists?: boolean
  roster_id?: string | null
  roster_status?: string | null

  active_eligible_player_count?: number
  minimum_roster_players?: number

  reasons?: string[]
}

type TournamentRosterPreviewPlayer = {
  rosterPlayerId: string
  playerId: string

  firstName: string
  lastName: string

  jerseyNumber: string | null
  primaryPosition: string | null
  secondaryPosition: string | null

  graduationYear: number | null
}


// =========================================
// PAGE
// =========================================

export function TournamentRegistrationPage() {
  const { tournamentId } = useParams()

  const navigate =
    useNavigate()

  const { user } =
    useAuth()


  // =========================================
  // PAGE DATA
  // =========================================

  const [
    tournament,
    setTournament,
  ] = useState<Tournament | null>(
    null
  )

  const [
    divisions,
    setDivisions,
  ] = useState<Division[]>([])

  const [
    teams,
    setTeams,
  ] = useState<Team[]>([])


  // =========================================
  // REGISTRATION FORM
  // =========================================

  const [
    teamId,
    setTeamId,
  ] = useState("")

  const [
    divisionId,
    setDivisionId,
  ] = useState("")

  const [
    notes,
    setNotes,
  ] = useState("")


  // =========================================
  // PAGE STATE
  // =========================================

  const [
    loading,
    setLoading,
  ] = useState(true)

  const [
    saving,
    setSaving,
  ] = useState(false)

  const [
    error,
    setError,
  ] = useState("")


  // =========================================
  // INSURANCE
  // =========================================

  const [
    insuranceProvider,
    setInsuranceProvider,
  ] = useState("")

  const [
    insurancePolicyNumber,
    setInsurancePolicyNumber,
  ] = useState("")

  const [
    insuranceExpiration,
    setInsuranceExpiration,
  ] = useState("")

  const [
    insuranceAttested,
    setInsuranceAttested,
  ] = useState(false)

  const [
    eligibilityAttested,
    setEligibilityAttested,
  ] = useState(false)

  const [
    termsAccepted,
    setTermsAccepted,
  ] = useState(false)

  const [
    waiverAccepted,
    setWaiverAccepted,
  ] = useState(false)

  const [
    teamInsurance,
    setTeamInsurance,
  ] =
    useState<TeamInsuranceProfile | null>(
      null
    )

  const [
    loadingTeamInsurance,
    setLoadingTeamInsurance,
  ] = useState(false)


  // =========================================
  // EXISTING REGISTRATION
  // =========================================

  const [
    existingPaymentStatus,
    setExistingPaymentStatus,
  ] =
    useState<string | null>(
      null
    )


  // =========================================
  // TOURNAMENT ROSTER
  // =========================================

  const [
    registrationReadiness,
    setRegistrationReadiness,
  ] =
    useState<TournamentReadiness | null>(
      null
    )

  const [
    tournamentRosterPreview,
    setTournamentRosterPreview,
  ] = useState<
    TournamentRosterPreviewPlayer[]
  >([])

  const [
    loadingTournamentRoster,
    setLoadingTournamentRoster,
  ] = useState(false)

  const [
    tournamentRosterConfirmed,
    setTournamentRosterConfirmed,
  ] = useState(false)

  const [
    tournamentRosterError,
    setTournamentRosterError,
  ] = useState("")


  // =========================================
  // LOAD TOURNAMENT / DIVISIONS / TEAMS
  // =========================================

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
  
      if (membershipResult.error) {
        setError(
          membershipResult.error.message
        )
        setLoading(false)
        return
      }
  
      const memberships =
        (membershipResult.data ??
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
  
      setTournament(
        tournamentResult.data as Tournament
      )
  
      setDivisions(
        (divisionResult.data ??
          []) as Division[]
      )
  
      if (
        manageableOrganizationIds.length ===
        0
      ) {
        setError(
          "You must manage an organization before registering a team."
        )
  
        setLoading(false)
        return
      }
  
      const {
        data: teamData,
        error: teamError,
      } = await supabase
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
  
      const loadedTeams =
        (teamData ?? []) as Team[]
  
      setTeams(loadedTeams)
  
      if (loadedTeams.length === 1) {
        setTeamId(
          loadedTeams[0].id
        )
      }
  
      setLoading(false)
    }
  
    void loadPage()
  }, [tournamentId, user])


  // =========================================
  // SELECTED TEAM
  // =========================================

  const selectedTeam =
    useMemo(
      () =>
        teams.find(
          (team) =>
            team.id ===
            teamId
        ) ?? null,

      [
        teams,
        teamId,
      ]
    )


  // =========================================
  // COMPATIBLE DIVISIONS
  // =========================================

  const compatibleDivisions =
    useMemo(() => {
      if (
        !selectedTeam?.age_group
      ) {
        return divisions
      }


      const matching =
        divisions.filter(
          (division) =>
            division.age_group ===
            selectedTeam.age_group
        )


      return matching.length > 0
        ? matching
        : divisions
    }, [
      divisions,
      selectedTeam,
    ])


  // =========================================
  // AUTO SELECT / RESET DIVISION
  // =========================================

  useEffect(() => {
    if (!teamId) {
      setDivisionId("")

      return
    }


    if (
      compatibleDivisions.length ===
      1
    ) {
      setDivisionId(
        compatibleDivisions[0].id
      )

      return
    }


    if (
      divisionId &&
      !compatibleDivisions.some(
        (division) =>
          division.id ===
          divisionId
      )
    ) {
      setDivisionId("")
    }
  }, [
    teamId,
    divisionId,
    compatibleDivisions,
  ])


  // =========================================
  // SELECTED DIVISION
  // =========================================

  const selectedDivision =
    useMemo(
      () =>
        divisions.find(
          (division) =>
            division.id ===
            divisionId
        ) ?? null,

      [
        divisions,
        divisionId,
      ]
    )


  // =========================================
  // LOAD TEAM INSURANCE
  // =========================================

  useEffect(() => {
    async function loadTeamInsurance() {
      if (!selectedTeam) {
        setTeamInsurance(null)

        setInsuranceProvider("")
        setInsurancePolicyNumber("")
        setInsuranceExpiration("")

        return
      }


      setLoadingTeamInsurance(
        true
      )


      const {
        data,
        error:
          insuranceLookupError,
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


      if (
        insuranceLookupError
      ) {
        console.error(
          "TEAM INSURANCE LOOKUP ERROR:",
          insuranceLookupError
        )

        setTeamInsurance(null)

        setLoadingTeamInsurance(
          false
        )

        return
      }


      const insurance =
        data as
          | TeamInsuranceProfile
          | null


      setTeamInsurance(
        insurance
      )


      if (insurance) {
        setInsuranceProvider(
          insurance.provider ??
            ""
        )

        setInsurancePolicyNumber(
          insurance.policy_number ??
            ""
        )

        setInsuranceExpiration(
          insurance.expiration_date ??
            ""
        )
      } else {
        setInsuranceProvider("")
        setInsurancePolicyNumber("")
        setInsuranceExpiration("")
      }


      setLoadingTeamInsurance(
        false
      )
    }


    void loadTeamInsurance()
  }, [
    selectedTeam,
  ])


  // =========================================
  // INSURANCE DATE COVERAGE
  // =========================================

  const insuranceCoversTournament =
    useMemo(() => {
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

      const policyExpiration =
        new Date(
          `${teamInsurance.expiration_date}T12:00:00`
        )


      if (
        policyExpiration.getTime() <
        tournamentEnd.getTime()
      ) {
        return false
      }


      if (
        !teamInsurance.effective_date
      ) {
        return true
      }


      const policyEffective =
        new Date(
          `${teamInsurance.effective_date}T12:00:00`
        )


      return (
        policyEffective.getTime() <=
        tournamentStart.getTime()
      )
    }, [
      teamInsurance,
      tournament,
    ])


  // =========================================
  // LOAD TOURNAMENT ROSTER PREVIEW
  // =========================================

  useEffect(() => {
    async function loadTournamentRosterPreview() {
      setTournamentRosterConfirmed(
        false
      )

      setTournamentRosterPreview(
        []
      )

      setRegistrationReadiness(
        null
      )

      setTournamentRosterError(
        ""
      )


      if (
        !tournamentId ||
        !selectedTeam ||
        !selectedDivision
      ) {
        return
      }


      setLoadingTournamentRoster(
        true
      )


      try {
        // -----------------------------------------
        // BACKEND READINESS
        // -----------------------------------------

        const {
          data: readinessData,
          error: readinessError,
        } = await supabase.rpc(
          "validate_tournament_registration_readiness",
          {
            target_team_id:
              selectedTeam.id,

            target_tournament_id:
              tournamentId,

            target_division_id:
              selectedDivision.id,
          }
        )


        if (readinessError) {
          throw readinessError
        }


        const readiness =
          readinessData as
            | TournamentReadiness
            | null


        setRegistrationReadiness(
          readiness
        )


        if (
          !readiness ||
          !readiness.ready ||
          !readiness.roster_id
        ) {
          const reasons =
            readiness?.reasons ??
            []

          if (
            reasons.includes(
              "TOURNAMENT_REGISTRATION_NOT_OPEN"
            )
          ) {
            setTournamentRosterError(
              "Tournament registration is not currently open."
            )

            return
          }


          if (
            reasons.includes(
              "MINIMUM_ROSTER_NOT_MET"
            )
          ) {
            setTournamentRosterError(
              `The team does not meet the minimum roster requirement.`
            )

            return
          }


          setTournamentRosterError(
            "This team does not currently have a tournament-ready roster."
          )

          return
        }


        const rosterId =
          readiness.roster_id


        // -----------------------------------------
        // LOAD ACTIVE + ELIGIBLE ROSTER PLAYERS
        // -----------------------------------------

        const {
          data:
            rosterPlayerRows,

          error:
            rosterPlayersError,
        } = await supabase
          .from(
            "roster_players"
          )
          .select(`
            id,
            player_id,
            jersey_number,
            primary_position,
            secondary_position
          `)
          .eq(
            "roster_id",
            rosterId
          )
          .eq(
            "roster_status",
            "active"
          )
          .eq(
            "eligibility_status",
            "eligible"
          )


        if (
          rosterPlayersError
        ) {
          throw rosterPlayersError
        }


        const rosterRows =
          rosterPlayerRows ??
          []


        const playerIds =
          rosterRows.map(
            (player) =>
              player.player_id
          )


        if (
          playerIds.length === 0
        ) {
          setTournamentRosterError(
            "No active, eligible players were found on this roster."
          )

          return
        }


        // -----------------------------------------
        // LOAD PLAYER DETAILS
        // -----------------------------------------

        const {
          data: playerRows,
          error: playersError,
        } = await supabase
          .from("players")
          .select(`
            id,
            first_name,
            last_name,
            graduation_year
          `)
          .in(
            "id",
            playerIds
          )


        if (playersError) {
          throw playersError
        }


        const preview =
          rosterRows.map(
            (
              rosterPlayer
            ) => {
              const player =
                (
                  playerRows ??
                  []
                ).find(
                  (
                    candidate
                  ) =>
                    candidate.id ===
                    rosterPlayer.player_id
                )


              return {
                rosterPlayerId:
                  rosterPlayer.id,

                playerId:
                  rosterPlayer.player_id,

                firstName:
                  player?.first_name ??
                  "Unknown",

                lastName:
                  player?.last_name ??
                  "Player",

                graduationYear:
                  player?.graduation_year ??
                  null,

                jerseyNumber:
                  rosterPlayer.jersey_number,

                primaryPosition:
                  rosterPlayer.primary_position,

                secondaryPosition:
                  rosterPlayer.secondary_position,
              }
            }
          )


        preview.sort(
          (a, b) => {
            const aNumber =
              Number(
                a.jerseyNumber
              )

            const bNumber =
              Number(
                b.jerseyNumber
              )


            if (
              Number.isFinite(
                aNumber
              ) &&
              Number.isFinite(
                bNumber
              )
            ) {
              return (
                aNumber -
                bNumber
              )
            }


            return (
              a.lastName.localeCompare(
                b.lastName
              )
            )
          }
        )


        setTournamentRosterPreview(
          preview
        )
      } catch (
        previewError: any
      ) {
        console.error(
          "TOURNAMENT ROSTER PREVIEW ERROR:",
          previewError
        )

        setTournamentRosterError(
          previewError?.message ??
            "Tournament roster could not be loaded."
        )
      } finally {
        setLoadingTournamentRoster(
          false
        )
      }
    }


    void loadTournamentRosterPreview()
  }, [
    tournamentId,
    selectedTeam,
    selectedDivision,
  ])


  // =========================================
  // LOAD EXISTING REGISTRATION
  // =========================================

  useEffect(() => {
    async function loadExistingRegistration() {
      if (
        !tournamentId ||
        !selectedTeam ||
        !selectedDivision
      ) {
        setExistingPaymentStatus(
          null
        )

        return
      }


      const {
        data,
        error:
          registrationLookupError,
      } = await supabase
        .from(
          "tournament_registrations"
        )
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


      if (
        registrationLookupError
      ) {
        console.error(
          "EXISTING REGISTRATION LOOKUP ERROR:",
          registrationLookupError
        )

        setExistingPaymentStatus(
          null
        )

        return
      }


      setExistingPaymentStatus(
        data?.payment_status ??
          null
      )
    }


    void loadExistingRegistration()
  }, [
    tournamentId,
    selectedTeam,
    selectedDivision,
  ])


  // =========================================
  // ERROR HELPER
  // =========================================

  function showRegistrationError(
    message: string
  ) {
    setError(
      message
    )

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


  // =========================================
  // SUBMIT
  // =========================================

  async function handleSubmit(
    event:
      FormEvent<HTMLFormElement>
  ) {
    event.preventDefault()


    // -----------------------------------------
    // BASIC FORM REQUIREMENTS
    // -----------------------------------------

    if (
      !tournamentId ||
      !user ||
      !selectedTeam ||
      !selectedDivision
    ) {
      showRegistrationError(
        "Select a team and division."
      )

      return
    }


    // -----------------------------------------
    // ROSTER CONFIRMATION
    // -----------------------------------------

    if (
      !tournamentRosterConfirmed ||
      tournamentRosterPreview.length ===
        0
    ) {
      showRegistrationError(
        "Review and confirm the tournament roster before continuing."
      )

      return
    }


    // -----------------------------------------
    // ACCEPTANCES
    // -----------------------------------------

    if (
      !insuranceAttested ||
      !eligibilityAttested ||
      !termsAccepted ||
      !waiverAccepted
    ) {
      showRegistrationError(
        "Please complete all insurance, eligibility, and agreement confirmations."
      )

      return
    }


    // -----------------------------------------
    // VERIFIED INSURANCE COVERAGE
    // -----------------------------------------

    if (
      teamInsurance &&
      teamInsurance.status ===
        "verified" &&
      !insuranceCoversTournament
    ) {
      showRegistrationError(
        "The verified insurance policy does not cover the full tournament dates."
      )

      return
    }


    setSaving(true)
    setError("")


    try {
      // =========================================
      // RECHECK READINESS
      // =========================================

      const {
        data: readinessData,
        error: readinessError,
      } = await supabase.rpc(
        "validate_tournament_registration_readiness",
        {
          target_team_id:
            selectedTeam.id,

          target_tournament_id:
            tournamentId,

          target_division_id:
            selectedDivision.id,
        }
      )


      if (readinessError) {
        showRegistrationError(
          readinessError.message ||
            "Team readiness could not be checked."
        )

        return
      }


      const readiness =
        readinessData as
          | TournamentReadiness
          | null


      console.log(
        "TOURNAMENT READINESS:",
        readiness
      )


      // =========================================
      // READINESS FAILURE
      // =========================================

      if (
        !readiness ||
        !readiness.ready
      ) {
        const reasons =
          readiness?.reasons ??
          []


        if (
          reasons.includes(
            "TOURNAMENT_REGISTRATION_NOT_OPEN"
          )
        ) {
          showRegistrationError(
            "Tournament registration is not currently open."
          )

          return
        }


        if (
          reasons.includes(
            "ORGANIZATION_NOT_ACTIVE"
          )
        ) {
          showRegistrationError(
            "This team's organization must be active before tournament registration."
          )

          return
        }


        if (
          reasons.includes(
            "TEAM_NOT_ACTIVE"
          )
        ) {
          showRegistrationError(
            "This team must be active before tournament registration."
          )

          return
        }


        if (
          reasons.includes(
            "DIVISION_INACTIVE"
          )
        ) {
          showRegistrationError(
            "This tournament division is not currently accepting registrations."
          )

          return
        }


        if (
          reasons.includes(
            "DIVISION_TOURNAMENT_MISMATCH"
          )
        ) {
          showRegistrationError(
            "The selected division does not belong to this tournament."
          )

          return
        }


        if (
          reasons.includes(
            "AGE_GROUP_MISMATCH"
          )
        ) {
          showRegistrationError(
            "This team's age group does not match the selected tournament division."
          )

          return
        }


        if (
          reasons.includes(
            "CLASSIFICATION_MISMATCH"
          )
        ) {
          showRegistrationError(
            "This team's classification does not match the selected tournament division."
          )

          return
        }


        if (
          reasons.includes(
            "NO_REGISTRATION_READY_ROSTER"
          )
        ) {
          showRegistrationError(
            "This team does not have a tournament-ready roster."
          )

          return
        }


        if (
          reasons.includes(
            "MINIMUM_ROSTER_NOT_MET"
          )
        ) {
          const currentPlayers =
            readiness
              ?.active_eligible_player_count ??
            0

          const minimumPlayers =
            readiness
              ?.minimum_roster_players ??
            1


          showRegistrationError(
            `This team has ${currentPlayers} active, eligible ` +
              `player${currentPlayers === 1 ? "" : "s"}. ` +
              `At least ${minimumPlayers} ` +
              `player${minimumPlayers === 1 ? "" : "s"} are required.`
          )

          return
        }


        showRegistrationError(
          "This team does not currently meet the requirements for tournament registration."
        )

        return
      }


      // =========================================
      // READINESS IS NOW NON-NULL
      // =========================================

      if (
        !readiness.roster_id
      ) {
        showRegistrationError(
          "A tournament-ready roster could not be found."
        )

        return
      }


      const confirmedRosterId =
        readiness.roster_id


      // =========================================
      // PREVIEW MUST MATCH CURRENT ROSTER
      // =========================================

      if (
        !registrationReadiness?.roster_id ||
        confirmedRosterId !==
          registrationReadiness.roster_id
      ) {
        setTournamentRosterConfirmed(
          false
        )

        showRegistrationError(
          "The team's tournament-ready roster changed. Please review and confirm the roster again."
        )

        return
      }


      // =========================================
      // FIND EXISTING REGISTRATION
      // =========================================

      const {
        data:
          existingRegistration,

        error:
          existingRegistrationError,
      } = await supabase
        .from(
          "tournament_registrations"
        )
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


      if (
        existingRegistrationError
      ) {
        showRegistrationError(
          existingRegistrationError
            .message
        )

        return
      }


      // =========================================
      // CREATE OR REUSE REGISTRATION
      // =========================================

      let registrationId:
        string


      if (
        existingRegistration?.id
      ) {
        registrationId =
          existingRegistration.id
      } else {
        const now =
          new Date()
            .toISOString()


        const {
          data:
            createdRegistration,

          error:
            registrationCreateError,
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
              selectedDivision
                .registration_fee_cents,

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
          .select(
            "id"
          )
          .single()


        if (
          registrationCreateError ||
          !createdRegistration
        ) {
          showRegistrationError(
            registrationCreateError
              ?.message ??
              "Registration could not be created."
          )

          return
        }


        registrationId =
          createdRegistration.id
      }


      // =========================================
      // CREATE TOURNAMENT ROSTER SNAPSHOT
      // =========================================

      const {
        data:
          tournamentRosterSubmissionId,

        error:
          rosterSubmissionError,
      } = await supabase.rpc(
        "submit_tournament_roster",
        {
          target_registration_id:
            registrationId,

          target_roster_id:
            confirmedRosterId,
        }
      )


      if (
        rosterSubmissionError
      ) {
        console.error(
          "TOURNAMENT ROSTER SUBMISSION ERROR:",
          rosterSubmissionError
        )


        let message =
          rosterSubmissionError.message ||
          "Tournament roster could not be submitted."


        if (
          message.includes(
            "ROSTER_NOT_LOCKED"
          )
        ) {
          message =
            "Lock the team roster before submitting tournament registration."
        }


        if (
          message.includes(
            "NO_ELIGIBLE_ROSTER_PLAYERS"
          )
        ) {
          message =
            "The roster does not contain any active, eligible players."
        }


        showRegistrationError(
          message
        )

        return
      }


      console.log(
        "TOURNAMENT ROSTER SUBMITTED:",
        tournamentRosterSubmissionId
      )


      // =========================================
      // ALREADY PAID
      //
      // Snapshot happens before this so old
      // registrations can be repaired.
      // =========================================

      if (
        existingRegistration
          ?.payment_status ===
        "paid"
      ) {
        navigate(
          `/dashboard/tournaments/${tournamentId}/registration/${registrationId}/payment-success`,
          {
            replace: true,
          }
        )

        return
      }


      // =========================================
      // STRIPE CHECKOUT
      // =========================================

      const {
        data: checkoutData,
        error: checkoutError,
      } =
        await supabase.functions.invoke(
          "create-tournament-checkout",
          {
            body: {
              registrationId,
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
            (
              checkoutError as any
            )?.context


          if (context) {
            const responseBody =
              await context
                .clone()
                .json()


            console.error(
              "CHECKOUT RESPONSE BODY:",
              responseBody
            )


            if (
              responseBody?.error
            ) {
              checkoutMessage =
                responseBody.error
            }
          }
        } catch (
          responseError
        ) {
          console.error(
            "Could not read checkout error response:",
            responseError
          )
        }


        showRegistrationError(
          checkoutMessage
        )

        return
      }


      if (
        !checkoutData?.url
      ) {
        showRegistrationError(
          "Stripe checkout URL was not returned."
        )

        return
      }


      window.location.href =
        checkoutData.url
    } catch (
      submitError: any
    ) {
      console.error(
        "TOURNAMENT REGISTRATION ERROR:",
        submitError
      )


      showRegistrationError(
        submitError?.message ??
          "Tournament registration could not be completed."
      )
    } finally {
      setSaving(false)
    }
  }


  // =========================================
  // LOADING
  // =========================================

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


  // =========================================
  // NOT FOUND
  // =========================================

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


  const startDate =
    new Date(
      `${tournament.start_date}T12:00:00`
    )

  const endDate =
    new Date(
      `${tournament.end_date}T12:00:00`
    )


  // =========================================
  // RENDER
  // =========================================

  return (
    <main className="min-h-screen bg-scoreboard-dark text-scoreboard-cream">

      {/* HEADER */}

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

              {startDate.toLocaleDateString(
                [],
                {
                  month: "short",
                  day: "numeric",
                }
              )}

              {" – "}

              {endDate.toLocaleDateString(
                [],
                {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                }
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

        </div>

      </section>


      {/* FORM */}

      <section className="mx-auto max-w-4xl px-4 py-10 sm:px-6">

        <form
          onSubmit={
            handleSubmit
          }
          className="scoreboard-panel p-4"
        >

          <div className="border border-scoreboard-cream/35 bg-scoreboard-green p-6 sm:p-8">

            {/* INTRO */}

            <div className="border-b border-scoreboard-cream/20 pb-5">

              <p className="scoreboard-label text-scoreboard-amber">
                Tournament Registration
              </p>

              <h2 className="mt-2 text-2xl font-black uppercase tracking-[0.05em]">
                Team Entry
              </h2>

              <p className="mt-3 text-sm leading-6 text-scoreboard-muted">
                Select one of your organization teams and the tournament division you want to enter.
              </p>

            </div>


            <div className="mt-7 space-y-6">

              {/* TEAM */}

              <label className="block">

                <span className="scoreboard-label text-scoreboard-cream">
                  Team
                </span>

                <select
                  value={
                    teamId
                  }
                  onChange={(
                    event
                  ) =>
                    setTeamId(
                      event.target.value
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
                  "
                >

                  <option value="">
                    Select Team
                  </option>

                  {teams.map(
                    (team) => (
                      <option
                        key={
                          team.id
                        }
                        value={
                          team.id
                        }
                      >
                        {[
                          team.age_group,
                          team.name,
                        ]
                          .filter(
                            Boolean
                          )
                          .join(
                            " "
                          )}
                      </option>
                    )
                  )}

                </select>

              </label>


              {/* DIVISION */}

              <label className="block">

                <span className="scoreboard-label text-scoreboard-cream">
                  Division
                </span>

                <select
                  value={
                    divisionId
                  }
                  onChange={(
                    event
                  ) =>
                    setDivisionId(
                      event.target.value
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
                  "
                >

                  <option value="">
                    Select Division
                  </option>

                  {compatibleDivisions.map(
                    (
                      division
                    ) => (
                      <option
                        key={
                          division.id
                        }
                        value={
                          division.id
                        }
                      >
                        {[
                          division.age_group,
                          division.name,
                        ]
                          .filter(
                            Boolean
                          )
                          .join(
                            " • "
                          )}
                      </option>
                    )
                  )}

                </select>

              </label>


              {/* TEAM SUMMARY */}

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
                          [
                            selectedTeam.city,
                            selectedTeam.state,
                          ]
                            .filter(
                              Boolean
                            )
                            .join(
                              ", "
                            ),
                        ]
                          .filter(
                            Boolean
                          )
                          .join(
                            " • "
                          )}
                      </p>

                    </div>

                  </div>

                </div>
              )}


              {/* TOURNAMENT ROSTER */}

              {selectedTeam &&
                selectedDivision && (
                  <div className="border border-scoreboard-cream/20 bg-scoreboard-dark p-5">

                    <div className="flex items-start justify-between gap-4">

                      <div>

                        <p className="scoreboard-label text-scoreboard-amber">
                          Tournament Roster
                        </p>

                        <h3 className="mt-2 text-lg font-black uppercase tracking-[0.05em]">
                          Confirm Players
                        </h3>

                        <p className="mt-2 text-sm leading-6 text-scoreboard-muted">
                          Active, eligible players from the tournament-ready team roster will be submitted as a locked tournament roster snapshot.
                        </p>

                      </div>


                      {registrationReadiness?.roster_status && (
                        <span
                          className="
                            shrink-0
                            border
                            border-scoreboard-amber/60
                            px-2
                            py-1
                            text-[9px]
                            font-black
                            uppercase
                            tracking-[0.10em]
                            text-scoreboard-amber
                          "
                        >
                          {
                            registrationReadiness.roster_status
                          }
                        </span>
                      )}

                    </div>


                    {loadingTournamentRoster ? (
                      <p className="mt-5 text-sm text-scoreboard-muted">
                        Loading tournament roster...
                      </p>
                    ) : tournamentRosterError ? (
                      <div className="mt-5 border border-scoreboard-red/60 p-4">

                        <p className="text-sm text-scoreboard-muted">
                          {
                            tournamentRosterError
                          }
                        </p>

                      </div>
                    ) : tournamentRosterPreview.length >
                      0 ? (
                      <>

                        <div className="mt-5 border-t border-scoreboard-cream/20">

                          {tournamentRosterPreview.map(
                            (
                              player
                            ) => (
                              <div
                                key={
                                  player.rosterPlayerId
                                }
                                className="
                                  flex
                                  items-center
                                  justify-between
                                  gap-3
                                  border-b
                                  border-scoreboard-cream/15
                                  py-3
                                  last:border-b-0
                                "
                              >

                                <div className="flex min-w-0 items-center gap-3">

                                  <span className="scoreboard-number w-8 shrink-0 text-lg text-scoreboard-amber">
                                    {player.jerseyNumber ||
                                      "--"}
                                  </span>

                                  <div className="min-w-0">

                                    <p className="truncate text-sm font-black uppercase tracking-[0.04em]">
                                      {player.firstName}{" "}
                                      {player.lastName}
                                    </p>

                                    <p className="mt-1 text-[10px] uppercase tracking-[0.08em] text-scoreboard-muted">
                                      {[
                                        player.graduationYear
                                          ? `Class ${player.graduationYear}`
                                          : null,

                                        player.primaryPosition
                                          ? player.secondaryPosition
                                            ? `${player.primaryPosition} / ${player.secondaryPosition}`
                                            : player.primaryPosition
                                          : "UTIL",
                                      ]
                                        .filter(
                                          Boolean
                                        )
                                        .join(
                                          " • "
                                        )}
                                    </p>

                                  </div>

                                </div>


                                <span className="text-[9px] font-black uppercase tracking-[0.10em] text-scoreboard-amber">
                                  Eligible
                                </span>

                              </div>
                            )
                          )}

                        </div>


                        <p className="mt-5 text-xs uppercase tracking-[0.08em] text-scoreboard-muted">
                          {
                            tournamentRosterPreview.length
                          }{" "}
                          player
                          {tournamentRosterPreview.length ===
                          1
                            ? ""
                            : "s"}{" "}
                          will be submitted.
                        </p>


                        <label className="mt-5 flex items-start gap-3 border-t border-scoreboard-cream/20 pt-5">

                          <input
                            type="checkbox"
                            checked={
                              tournamentRosterConfirmed
                            }
                            onChange={(
                              event
                            ) =>
                              setTournamentRosterConfirmed(
                                event.target.checked
                              )
                            }
                            className="mt-1"
                          />

                          <span className="text-sm leading-6 text-scoreboard-muted">
                            I confirm this is the tournament roster I want to submit for{" "} 
                            <strong className="text-scoreboard-cream">
                              {
                                tournament.name
                              }
                            </strong>
                            and all players meet eligibility requirements for their respective division. 
                          </span>

                        </label>

                      </>
                    ) : null}

                  </div>
                )}


              {/* NOTES */}

              <label className="block">

                <span className="scoreboard-label text-scoreboard-cream">
                  Notes
                </span>

                <textarea
                  value={
                    notes
                  }
                  onChange={(
                    event
                  ) =>
                    setNotes(
                      event.target.value
                    )
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


            {/* PRIMARY ERROR */}

            {error && (
              <div
                id="registration-error"
                className="mt-6 border border-scoreboard-red/60 bg-scoreboard-dark p-4"
              >

                <p className="scoreboard-label text-scoreboard-amber">
                  Registration Blocked
                </p>

                <p className="mt-2 text-sm leading-6 text-scoreboard-cream">
                  {error}
                </p>

              </div>
            )}


            <div className="mt-8 space-y-6 border-t border-scoreboard-cream/20 pt-6">

              {/* FEE */}

              {selectedDivision && (
                <div className="border border-scoreboard-cream/20 bg-scoreboard-dark p-5">

                  <p className="scoreboard-label text-scoreboard-amber">
                    Registration Fee
                  </p>

                  <div className="mt-4 flex items-end justify-between gap-4">

                    <p className="text-sm text-scoreboard-muted">
                      {
                        selectedDivision.age_group
                      }{" "}
                      {
                        selectedDivision.name
                      }
                    </p>

                    <div className="scoreboard-number text-3xl text-scoreboard-cream">
                      $
                      {(
                        selectedDivision.registration_fee_cents /
                        100
                      ).toFixed(
                        2
                      )}
                    </div>

                  </div>

                  <p className="mt-4 text-xs uppercase tracking-[0.08em] text-scoreboard-muted">
                  Secure payment processed by Stripe.
                  </p>

                </div>
              )}


               INSURANCE

              <div className="border border-scoreboard-cream/20 bg-scoreboard-dark p-5">

                {/*<p className="scoreboard-label text-scoreboard-amber">
                  Insurance & Eligibility
                </p>


                {loadingTeamInsurance ? (
                  <div className="mt-4 border border-scoreboard-cream/20 p-4">

                    <p className="text-sm text-scoreboard-muted">
                      Checking team insurance...
                    </p>

                  </div>
                ) : teamInsurance ? (
                  <div className="mt-4 border border-scoreboard-cream/20 p-4">

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


                    {teamInsurance.status ===
                      "verified" &&
                      insuranceCoversTournament && (
                        <p className="mt-3 text-xs font-black uppercase tracking-[0.10em] text-scoreboard-amber">
                          Verified & Covers Tournament
                        </p>
                      )}


                    {teamInsurance.status ===
                      "verified" &&
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


                    {teamInsurance.status !==
                      "verified" && (
                        <p className="mt-3 text-xs uppercase tracking-[0.08em] text-scoreboard-muted">
                          This policy has not yet been verified by the platform.
                        </p>
                      )}

                  </div>
                ) : selectedTeam ? (
                  <div className="mt-4 border border-scoreboard-amber/40 p-4">

                    <p className="scoreboard-label text-scoreboard-amber">
                      No Team Insurance On File
                    </p>

                    <p className="mt-2 text-sm text-scoreboard-muted">
                      Enter insurance details below or add insurance from the team dashboard.
                    </p>

                  </div>
                ) : null} */}


                {/* <div className="mt-5 grid gap-4 sm:grid-cols-2">

                  <label className="block">

                    <span className="scoreboard-label text-scoreboard-cream">
                      Insurance Provider
                    </span>

                    <input
                      value={
                        insuranceProvider
                      }
                      onChange={(
                        event
                      ) =>
                        setInsuranceProvider(
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
                        text-scoreboard-dark
                      "
                    />

                  </label>


                  <label className="block">

                    <span className="scoreboard-label text-scoreboard-cream">
                      Policy Number
                    </span>

                    <input
                      value={
                        insurancePolicyNumber
                      }
                      onChange={(
                        event
                      ) =>
                        setInsurancePolicyNumber(
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
                      value={
                        insuranceExpiration
                      }
                      onChange={(
                        event
                      ) =>
                        setInsuranceExpiration(
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
                        text-scoreboard-dark
                      "
                    />

                  </label>

                </div> */}


                <div className="mt-6 space-y-4">

                  <label className="flex items-start gap-3">

                    <input
                      type="checkbox"
                      checked={
                        insuranceAttested
                      }
                      onChange={(
                        event
                      ) =>
                        setInsuranceAttested(
                          event.target.checked
                        )
                      }
                      className="mt-1"
                    />

                    <span className="text-sm text-scoreboard-muted">
                      I certify that this team has current insurance coverage for tournament participation.
                    </span>

                  </label>


                  <label className="flex items-start gap-3">

                    <input
                      type="checkbox"
                      checked={
                        eligibilityAttested
                      }
                      onChange={(
                        event
                      ) =>
                        setEligibilityAttested(
                          event.target.checked
                        )
                      }
                      className="mt-1"
                    />

                    <span className="text-sm text-scoreboard-muted">
                      I certify that all players meet the eligibility requirements for this division.
                    </span>

                  </label>

                </div>


                <div className="mt-5 border border-scoreboard-amber/40 p-5">

                  <p className="scoreboard-label text-scoreboard-amber">
                    Need Insurance?
                  </p>

                  <h3 className="mt-2 text-lg font-black uppercase tracking-[0.05em]">
                    Purchase Coverage
                  </h3>

                  <p className="mt-3 text-sm leading-6 text-scoreboard-muted">
                    If your team does not currently have tournament insurance, you can purchase coverage from a third-party provider and return here to submit your policy information.
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

                </div>

              </div>


              {/* AGREEMENTS */}

              <div className="border border-scoreboard-cream/20 bg-scoreboard-dark p-5">

                <p className="scoreboard-label text-scoreboard-amber">
                  Agreements
                </p>


                <div className="mt-5 space-y-4">

                  <label className="flex items-start gap-3">

                    <input
                      type="checkbox"
                      checked={
                        termsAccepted
                      }
                      onChange={(
                        event
                      ) =>
                        setTermsAccepted(
                          event.target.checked
                        )
                      }
                      className="mt-1"
                    />

                    <span className="text-sm text-scoreboard-muted">
                      I agree to the tournament Terms of Service.
                    </span>

                  </label>


                  <label className="flex items-start gap-3">

                    <input
                      type="checkbox"
                      checked={
                        waiverAccepted
                      }
                      onChange={(
                        event
                      ) =>
                        setWaiverAccepted(
                          event.target.checked
                        )
                      }
                      className="mt-1"
                    />

                    <span className="text-sm text-scoreboard-muted">
                      I accept the tournament liability waiver and participation rules.
                    </span>

                  </label>

                </div>

              </div>


              {/* EXISTING PAYMENT */}

              {existingPaymentStatus && (
                <div className="border border-scoreboard-cream/20 bg-scoreboard-dark p-4">

                  <p className="scoreboard-label text-scoreboard-amber">
                    Registration Status
                  </p>

                  <p className="mt-2 text-sm text-scoreboard-muted">
                    {existingPaymentStatus ===
                    "paid"
                      ? "This team has already paid for this tournament division."
                      : existingPaymentStatus ===
                          "pending"
                        ? "A payment session already exists. Continue to complete payment."
                        : existingPaymentStatus ===
                            "failed"
                          ? "The previous payment attempt did not complete. You can try again."
                          : "This registration still requires payment."}
                  </p>

                </div>
              )}


              {/* SUBMIT */}

              <Button
                type="submit"
                disabled={
                  saving ||
                  teams.length ===
                    0 ||
                  loadingTournamentRoster
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
                  : existingPaymentStatus ===
                      "paid"
                    ? "View Registration"
                    : existingPaymentStatus ===
                        "pending"
                      ? "Continue Payment"
                      : existingPaymentStatus ===
                          "failed"
                        ? "Retry Payment"
                        : existingPaymentStatus ===
                            "unpaid"
                          ? "Continue Payment"
                          : "Pay & Register"}
              </Button>


              <p className="text-center text-[10px] font-bold uppercase tracking-[0.10em] text-scoreboard-muted">
                Registration will be submitted for approval
              </p>

            </div>

          </div>

        </form>

      </section>

    </main>
  )
}