import {
    useEffect,
    useMemo,
    useState,
  } from "react"
  
  import {
    ArrowLeft,
    CheckCircle2,
    ChevronDown,
    Plus,
    RefreshCw,
    Settings,
    ShieldCheck,
    Trophy,
    Users,
    X,
  } from "lucide-react"
  
  import {
    Link,
    useParams,
  } from "react-router-dom"
  
  import { Button } from "@/components/ui/button"
  import { supabase } from "@/lib/supabase"
  
  type Tournament = {
    id: string
    name: string
    city: string | null
    state: string | null
    start_date: string
    end_date: string
  }
  
  type Division = {
    id: string
    tournament_id: string
    name: string
    age_group: string
    classification: string | null
    active: boolean
  }
  
  type TournamentTeam = {
    id: string
    tournament_id: string
    division_id: string
    team_id: string | null
    display_name: string
    city: string | null
    state: string | null
    status: string
    seed: number | null
    registration_id: string | null
  }
  
  type Pool = {
    id: string
    tournament_id: string
    division_id: string
    name: string
    sort_order: number
    status: string
  }
  
  type PoolAssignment = {
    id: string
    pool_id: string
    tournament_team_id: string
    seed: number | null
  }
  
  export function TournamentAdminPoolsPage() {
    const {
      tournamentId,
    } = useParams()
  
    const [
      tournament,
      setTournament,
    ] =
      useState<Tournament | null>(null)
  
    const [
      divisions,
      setDivisions,
    ] =
      useState<Division[]>([])
  
    const [
      tournamentTeams,
      setTournamentTeams,
    ] =
      useState<TournamentTeam[]>([])
  
    const [
      pools,
      setPools,
    ] =
      useState<Pool[]>([])
  
    const [
      assignments,
      setAssignments,
    ] =
      useState<PoolAssignment[]>([])
  
    const [
      selectedDivisionId,
      setSelectedDivisionId,
    ] =
      useState("")
  
    const [
      newPoolName,
      setNewPoolName,
    ] =
      useState("")
  
    const [
      workingId,
      setWorkingId,
    ] =
      useState<string | null>(null)
  
    const [
      loading,
      setLoading,
    ] =
      useState(true)
  
    const [
      error,
      setError,
    ] =
      useState("")
  
    useEffect(() => {
      void loadPage()
    }, [tournamentId])
  
    async function loadPage() {
      if (!tournamentId) {
        setError(
          "Missing tournament ID."
        )
        setLoading(false)
        return
      }
  
      setLoading(true)
      setError("")
  
      const [
        tournamentResult,
        divisionsResult,
        teamsResult,
        poolsResult,
      ] = await Promise.all([
        supabase
          .from("tournaments")
          .select(`
            id,
            name,
            city,
            state,
            start_date,
            end_date
          `)
          .eq(
            "id",
            tournamentId
          )
          .maybeSingle(),
  
        supabase
          .from(
            "tournament_divisions"
          )
          .select(`
            id,
            tournament_id,
            name,
            age_group,
            classification,
            active
          `)
          .eq(
            "tournament_id",
            tournamentId
          )
          .eq(
            "active",
            true
          )
          .order(
            "age_group"
          ),
  
        supabase
          .from(
            "tournament_teams"
          )
          .select(`
            id,
            tournament_id,
            division_id,
            team_id,
            display_name,
            city,
            state,
            status,
            seed,
            registration_id
          `)
          .eq(
            "tournament_id",
            tournamentId
          )
          .eq(
            "status",
            "approved"
          )
          .order(
            "display_name"
          ),
  
        supabase
          .from(
            "tournament_pools"
          )
          .select(`
            id,
            tournament_id,
            division_id,
            name,
            sort_order,
            status
          `)
          .eq(
            "tournament_id",
            tournamentId
          )
          .order(
            "sort_order"
          )
          .order(
            "name"
          ),
      ])
  
      if (tournamentResult.error) {
        setError(
          tournamentResult.error.message
        )
        setLoading(false)
        return
      }
  
      if (!tournamentResult.data) {
        setError(
          "Tournament not found."
        )
        setLoading(false)
        return
      }
  
      if (divisionsResult.error) {
        setError(
          divisionsResult.error.message
        )
        setLoading(false)
        return
      }
  
      if (teamsResult.error) {
        setError(
          teamsResult.error.message
        )
        setLoading(false)
        return
      }
  
      if (poolsResult.error) {
        setError(
          poolsResult.error.message
        )
        setLoading(false)
        return
      }
  
      const poolRows =
        (poolsResult.data ??
          []) as Pool[]
  
      const poolIds =
        poolRows.map(
          (pool) => pool.id
        )
  
      let assignmentRows:
        PoolAssignment[] = []
  
      if (poolIds.length > 0) {
        const {
          data,
          error:
            assignmentError,
        } = await supabase
          .from(
            "tournament_pool_teams"
          )
          .select(`
            id,
            pool_id,
            tournament_team_id,
            seed
          `)
          .in(
            "pool_id",
            poolIds
          )
  
        if (assignmentError) {
          setError(
            assignmentError.message
          )
          setLoading(false)
          return
        }
  
        assignmentRows =
          (data ??
            []) as PoolAssignment[]
      }
  
      const divisionRows =
        (divisionsResult.data ??
          []) as Division[]
  
      setTournament(
        tournamentResult.data
      )
  
      setDivisions(
        divisionRows
      )
  
      setTournamentTeams(
        (teamsResult.data ??
          []) as TournamentTeam[]
      )
  
      setPools(
        poolRows
      )
  
      setAssignments(
        assignmentRows
      )
  
      setSelectedDivisionId(
        (current) =>
          current &&
          divisionRows.some(
            (division) =>
              division.id ===
              current
          )
            ? current
            : divisionRows[0]?.id ??
              ""
      )
  
      setLoading(false)
    }
  
    async function handleCreatePool() {
      if (
        !tournamentId ||
        !selectedDivisionId
      ) {
        return
      }
  
      const name =
        newPoolName.trim()
  
      if (!name) {
        setError(
          "Pool name is required."
        )
        return
      }
  
      setWorkingId(
        "create-pool"
      )
      setError("")
  
      const divisionPools =
        pools.filter(
          (pool) =>
            pool.division_id ===
            selectedDivisionId
        )
  
      const {
        error: createError,
      } = await supabase.rpc(
        "create_tournament_pool",
        {
          target_tournament_id:
            tournamentId,
  
          target_division_id:
            selectedDivisionId,
  
          pool_name:
            name,
  
          pool_sort_order:
            divisionPools.length,
        }
      )
  
      if (createError) {
        setError(
          createError.message
        )
        setWorkingId(null)
        return
      }
  
      setNewPoolName("")
  
      await loadPage()
  
      setWorkingId(null)
    }
  
    async function handleRenamePool(
      pool: Pool
    ) {
      const nextName =
        window.prompt(
          "Pool name",
          pool.name
        )
  
      if (
        nextName === null ||
        !nextName.trim() ||
        nextName.trim() ===
          pool.name
      ) {
        return
      }
  
      setWorkingId(
        pool.id
      )
      setError("")
  
      const {
        error: updateError,
      } = await supabase.rpc(
        "update_tournament_pool",
        {
          target_pool_id:
            pool.id,
  
          new_name:
            nextName.trim(),
  
          new_status:
            null,
  
          new_sort_order:
            null,
        }
      )
  
      if (updateError) {
        setError(
          updateError.message
        )
        setWorkingId(null)
        return
      }
  
      await loadPage()
  
      setWorkingId(null)
    }
  
    async function handleTogglePoolStatus(
      pool: Pool
    ) {
      const newStatus =
        pool.status === "active"
          ? "inactive"
          : "active"
  
      const confirmed =
        window.confirm(
          `${
            newStatus === "inactive"
              ? "Deactivate"
              : "Reactivate"
          } ${pool.name}?`
        )
  
      if (!confirmed) {
        return
      }
  
      setWorkingId(
        pool.id
      )
      setError("")
  
      const {
        error: updateError,
      } = await supabase.rpc(
        "update_tournament_pool",
        {
          target_pool_id:
            pool.id,
  
          new_name:
            null,
  
          new_status:
            newStatus,
  
          new_sort_order:
            null,
        }
      )
  
      if (updateError) {
        setError(
          updateError.message
        )
        setWorkingId(null)
        return
      }
  
      await loadPage()
  
      setWorkingId(null)
    }
  
    async function handleAssignTeam(
      poolId: string,
      tournamentTeamId: string
    ) {
      setWorkingId(
        tournamentTeamId
      )
      setError("")
  
      const {
        error: assignError,
      } = await supabase.rpc(
        "assign_tournament_team_to_pool",
        {
          target_pool_id:
            poolId,
  
          target_tournament_team_id:
            tournamentTeamId,
        }
      )
  
      if (assignError) {
        setError(
          assignError.message
        )
        setWorkingId(null)
        return
      }
  
      await loadPage()
  
      setWorkingId(null)
    }
  
    async function handleRemoveTeam(
      poolId: string,
      tournamentTeamId: string
    ) {
      setWorkingId(
        tournamentTeamId
      )
      setError("")
  
      const {
        error: removeError,
      } = await supabase.rpc(
        "remove_tournament_team_from_pool",
        {
          target_pool_id:
            poolId,
  
          target_tournament_team_id:
            tournamentTeamId,
        }
      )
  
      if (removeError) {
        setError(
          removeError.message
        )
        setWorkingId(null)
        return
      }
  
      await loadPage()
  
      setWorkingId(null)
    }
  
    async function handleMoveTeam(
      currentPoolId: string,
      targetPoolId: string,
      tournamentTeamId: string
    ) {
      if (
        currentPoolId ===
        targetPoolId
      ) {
        return
      }
  
      setWorkingId(
        tournamentTeamId
      )
      setError("")
  
      const {
        error: removeError,
      } = await supabase.rpc(
        "remove_tournament_team_from_pool",
        {
          target_pool_id:
            currentPoolId,
  
          target_tournament_team_id:
            tournamentTeamId,
        }
      )
  
      if (removeError) {
        setError(
          removeError.message
        )
        setWorkingId(null)
        return
      }
  
      const {
        error: assignError,
      } = await supabase.rpc(
        "assign_tournament_team_to_pool",
        {
          target_pool_id:
            targetPoolId,
  
          target_tournament_team_id:
            tournamentTeamId,
        }
      )
  
      if (assignError) {
        setError(
          assignError.message
        )
  
        // Best-effort restore if the move fails.
        await supabase.rpc(
          "assign_tournament_team_to_pool",
          {
            target_pool_id:
              currentPoolId,
  
            target_tournament_team_id:
              tournamentTeamId,
          }
        )
  
        setWorkingId(null)
        return
      }
  
      await loadPage()
  
      setWorkingId(null)
    }
  
    async function handleSeedChange(
      poolId: string,
      tournamentTeamId: string,
      value: string
    ) {
      const seed =
        value
          ? Number(value)
          : null
  
      if (
        seed !== null &&
        (
          !Number.isInteger(seed) ||
          seed < 1
        )
      ) {
        setError(
          "Pool seed must be a positive whole number."
        )
        return
      }
  
      setWorkingId(
        tournamentTeamId
      )
      setError("")
  
      const {
        error: seedError,
      } = await supabase.rpc(
        "set_tournament_pool_team_seed",
        {
          target_pool_id:
            poolId,
  
          target_tournament_team_id:
            tournamentTeamId,
  
          new_seed:
            seed,
        }
      )
  
      if (seedError) {
        setError(
          seedError.message
        )
        setWorkingId(null)
        return
      }
  
      await loadPage()
  
      setWorkingId(null)
    }
    async function handleGeneratePoolGames(
        poolId: string
      ) {
        const confirmed = window.confirm(
          "Generate round-robin pool-play games for this pool?"
        )
      
        if (!confirmed) {
          return
        }
      
        setWorkingId(`generate-${poolId}`)
        setError("")
      
        const {
          data,
          error: generateError,
        } = await supabase.rpc(
          "generate_pool_play_games",
          {
            target_pool_id: poolId,
          }
        )
      
        if (generateError) {
          setError(generateError.message)
          setWorkingId(null)
          return
        }
      
        console.log(
          "POOL GAMES CREATED:",
          data
        )
      
        await loadPage()
      
        setWorkingId(null)
      }
    const selectedDivision =
      useMemo(
        () =>
          divisions.find(
            (division) =>
              division.id ===
              selectedDivisionId
          ) ?? null,
        [
          divisions,
          selectedDivisionId,
        ]
      )
  
    const selectedPools =
      useMemo(
        () =>
          pools.filter(
            (pool) =>
              pool.division_id ===
              selectedDivisionId
          ),
        [
          pools,
          selectedDivisionId,
        ]
      )
  
    const selectedTeams =
      useMemo(
        () =>
          tournamentTeams.filter(
            (team) =>
              team.division_id ===
              selectedDivisionId
          ),
        [
          tournamentTeams,
          selectedDivisionId,
        ]
      )
  
    const assignedTeamIds =
      useMemo(
        () =>
          new Set(
            assignments
              .filter((assignment) =>
                selectedPools.some(
                  (pool) =>
                    pool.id ===
                    assignment.pool_id
                )
              )
              .map(
                (assignment) =>
                  assignment.tournament_team_id
              )
          ),
        [
          assignments,
          selectedPools,
        ]
      )
  
    const unassignedTeams =
      useMemo(
        () =>
          selectedTeams.filter(
            (team) =>
              !assignedTeamIds.has(
                team.id
              )
          ),
        [
          selectedTeams,
          assignedTeamIds,
        ]
      )
  
    if (loading) {
      return (
        <main className="min-h-screen bg-scoreboard-dark px-6 py-12 text-scoreboard-cream">
          <div className="mx-auto max-w-7xl">
            <p className="scoreboard-label">
              Loading Tournament Pools...
            </p>
          </div>
        </main>
      )
    }
  
    if (
      error &&
      !tournament
    ) {
      return (
        <main className="min-h-screen bg-scoreboard-dark px-6 py-12 text-scoreboard-cream">
  
          <div className="mx-auto max-w-7xl">
  
            <div className="border border-scoreboard-red/60 bg-scoreboard-green p-6">
  
              <p className="scoreboard-label text-scoreboard-amber">
                Unable To Load Tournament Pools
              </p>
  
              <p className="mt-3 text-sm text-scoreboard-muted">
                {error}
              </p>
  
            </div>
  
          </div>
  
        </main>
      )
    }
  
    if (!tournament) {
      return null
    }
  
    return (
      <main className="min-h-screen bg-scoreboard-dark text-scoreboard-cream">
  
        {/* HEADER */}
  
        <section className="border-b border-scoreboard-cream/20 bg-scoreboard-green">
  
          <div className="mx-auto max-w-7xl px-6 py-10">
  
            <Link
              to={`/dashboard/tournaments/${tournament.id}/registrations`}
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
              Tournament Admin
            </Link>
  
            <p className="scoreboard-label mt-8 text-scoreboard-amber">
              Competition
            </p>
  
            <h1 className="mt-3 text-4xl font-black uppercase tracking-[0.05em]">
              Pools
            </h1>
  
            <p className="mt-3 text-sm text-scoreboard-muted">
              {tournament.name}
            </p>
  
          </div>
  
        </section>
  
        {/* SUMMARY */}
  
        <section className="mx-auto max-w-7xl px-6 py-8">
  
          <div className="grid border-l border-t border-scoreboard-cream/25 sm:grid-cols-3">
  
            <SummaryCard
              label="Teams"
              value={
                selectedTeams.length
              }
              icon={Users}
            />
  
            <SummaryCard
              label="Pools"
              value={
                selectedPools.filter(
                  (pool) =>
                    pool.status ===
                    "active"
                ).length
              }
              icon={Trophy}
            />
  
            <SummaryCard
              label="Unassigned"
              value={
                unassignedTeams.length
              }
              icon={ShieldCheck}
            />
  
          </div>
  
        </section>
  
        <section className="mx-auto max-w-7xl px-6 pb-14">
  
          {/* DIVISION SELECT */}
  
          <div className="border border-scoreboard-cream/25 bg-scoreboard-green p-6">
  
            <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
  
              <div className="w-full max-w-md">
  
                <label className="scoreboard-label text-scoreboard-amber">
                  Division
                </label>
  
                <div className="relative mt-2">
  
                  <select
                    value={
                      selectedDivisionId
                    }
                    onChange={(e) =>
                      setSelectedDivisionId(
                        e.target.value
                      )
                    }
                    className="
                      w-full
                      appearance-none
                      rounded-none
                      border
                      border-scoreboard-cream/30
                      bg-scoreboard-cream
                      px-3
                      py-3
                      pr-10
                      text-scoreboard-dark
                    "
                  >
                    {divisions.map(
                      (division) => (
                        <option
                          key={
                            division.id
                          }
                          value={
                            division.id
                          }
                        >
                          {division.age_group}
                          {" • "}
                          {division.name}
                        </option>
                      )
                    )}
                  </select>
  
                  <ChevronDown className="pointer-events-none absolute right-3 top-3.5 h-4 w-4 text-scoreboard-dark" />
  
                </div>
  
              </div>
  
              <div className="flex w-full max-w-lg gap-2">
  
                <input
                  value={
                    newPoolName
                  }
                  onChange={(e) =>
                    setNewPoolName(
                      e.target.value
                    )
                  }
                  placeholder="Pool A"
                  className="
                    min-w-0
                    flex-1
                    rounded-none
                    border
                    border-scoreboard-cream/30
                    bg-scoreboard-cream
                    px-3
                    py-3
                    text-scoreboard-dark
                  "
                />
  
                <Button
                  type="button"
                  disabled={
                    workingId ===
                      "create-pool" ||
                    !selectedDivisionId
                  }
                  onClick={
                    handleCreatePool
                  }
                  className="
                    rounded-none
                    bg-scoreboard-amber
                    font-black
                    uppercase
                    tracking-[0.10em]
                    text-scoreboard-dark
                    hover:bg-scoreboard-cream
                  "
                >
                  <Plus className="mr-2 h-4 w-4" />
  
                  Create Pool
                </Button>

                <Link
  to={`/dashboard/tournaments/${tournament.id}/schedule`}
>
  <Button
    type="button"
    className="
      rounded-none
      bg-scoreboard-amber
      font-black
      uppercase
      tracking-[0.08em]
      text-scoreboard-dark
      hover:bg-scoreboard-cream
    "
  >
    Game Schedule
  </Button>
</Link>
  
              </div>
  
            </div>
  
            {selectedDivision && (
              <p className="mt-4 text-xs uppercase tracking-[0.10em] text-scoreboard-muted">
                Managing{" "}
                {selectedDivision.age_group}
                {" • "}
                {selectedDivision.name}
              </p>
            )}
  
          </div>
  
          {error && (
            <div className="mt-6 border border-scoreboard-red/60 bg-scoreboard-green p-4">
  
              <p className="text-sm text-scoreboard-muted">
                {error}
              </p>
  
            </div>
          )}
  
          {/* POOLS */}
  
          <div className="mt-6 grid gap-6 xl:grid-cols-2">
  
            {selectedPools.length ===
            0 ? (
              <div className="border border-scoreboard-cream/25 bg-scoreboard-green p-8 xl:col-span-2">
  
                <Trophy className="h-8 w-8 text-scoreboard-amber" />
  
                <h2 className="mt-5 text-xl font-black uppercase tracking-[0.06em]">
                  No Pools Yet
                </h2>
  
                <p className="mt-3 text-sm text-scoreboard-muted">
                  Create Pool A to begin organizing this division.
                </p>
  
              </div>
            ) : (
              selectedPools.map(
                (pool) => {
                  const poolAssignments =
                    assignments
                      .filter(
                        (assignment) =>
                          assignment.pool_id ===
                          pool.id
                      )
                      .sort(
                        (a, b) =>
                          (a.seed ??
                            9999) -
                          (b.seed ??
                            9999)
                      )
  
                  return (
                    <div
                      key={pool.id}
                      className={`
                        border
                        bg-scoreboard-green
                        ${
                          pool.status ===
                          "active"
                            ? "border-scoreboard-cream/25"
                            : "border-scoreboard-cream/10 opacity-60"
                        }
                      `}
                    >
  
                      {/* POOL HEADER */}
  
                      <div className="flex items-start justify-between gap-4 border-b border-scoreboard-cream/20 p-5">
  
                        <div>
                          <p className="scoreboard-label text-scoreboard-amber">
                            Pool
                          </p>
  
                          <h2 className="mt-2 text-2xl font-black uppercase tracking-[0.06em]">
                            {pool.name}
                          </h2>
  
                          <p className="mt-2 text-xs uppercase tracking-[0.10em] text-scoreboard-muted">
                            {poolAssignments.length}
                            {" "}
                            team
                            {poolAssignments.length ===
                            1
                              ? ""
                              : "s"}
                            {" • "}
                            {pool.status}
                          </p>
                        </div>
  
                        <div className="flex gap-2">

                        <Button
  type="button"
  disabled={
    pool.status !== "active" ||
    poolAssignments.length < 2 ||
    workingId === `generate-${pool.id}`
  }
  onClick={() =>
    void handleGeneratePoolGames(pool.id)
  }
  className="
    rounded-none
    bg-scoreboard-amber
    px-3
    py-2
    text-xs
    font-black
    uppercase
    tracking-[0.08em]
    text-scoreboard-dark
    hover:bg-scoreboard-cream
  "
>
  {workingId === `generate-${pool.id}`
    ? "Generating..."
    : "Generate Games"}
</Button>
  
                          <button
                            type="button"
                            disabled={
                              workingId ===
                              pool.id
                            }
                            onClick={() =>
                              handleRenamePool(
                                pool
                              )
                            }
                            className="
                              border
                              border-scoreboard-cream/30
                              p-2
                              hover:border-scoreboard-amber
                              hover:text-scoreboard-amber
                            "
                            title="Rename pool"
                          >
                            <Settings className="h-4 w-4" />
                          </button>
  
                          <button
                            type="button"
                            disabled={
                              workingId ===
                              pool.id
                            }
                            onClick={() =>
                              handleTogglePoolStatus(
                                pool
                              )
                            }
                            className="
                              border
                              border-scoreboard-cream/30
                              p-2
                              hover:border-scoreboard-amber
                            "
                            title={
                              pool.status ===
                              "active"
                                ? "Deactivate pool"
                                : "Reactivate pool"
                            }
                          >
                            {pool.status ===
                            "active" ? (
                              <X className="h-4 w-4" />
                            ) : (
                              <RefreshCw className="h-4 w-4" />
                            )}
                          </button>
  
                        </div>
  
                      </div>
  
                      {/* TEAMS */}
  
                      <div>
  
                        {poolAssignments.length ===
                        0 ? (
                          <div className="p-5 text-sm text-scoreboard-muted">
                            No teams assigned.
                          </div>
                        ) : (
                          poolAssignments.map(
                            (assignment) => {
                              const team =
                                tournamentTeams.find(
                                  (
                                    row
                                  ) =>
                                    row.id ===
                                    assignment.tournament_team_id
                                )
  
                              if (!team) {
                                return null
                              }
  
                              return (
                                <div
                                  key={
                                    assignment.id
                                  }
                                  className="border-b border-scoreboard-cream/15 p-5 last:border-b-0"
                                >
  
                                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
  
                                    <div>
  
                                      <div className="flex items-center gap-3">
  
                                        <span className="scoreboard-number text-xl text-scoreboard-amber">
                                          {assignment.seed ??
                                            "—"}
                                        </span>
  
                                        <div>
                                          <p className="font-black uppercase tracking-[0.04em]">
                                            {team.display_name}
                                          </p>
  
                                          {(team.city ||
                                            team.state) && (
                                            <p className="mt-1 text-xs text-scoreboard-muted">
                                              {[
                                                team.city,
                                                team.state,
                                              ]
                                                .filter(
                                                  Boolean
                                                )
                                                .join(
                                                  ", "
                                                )}
                                            </p>
                                          )}
  
                                        </div>
  
                                      </div>
  
                                    </div>
  
                                    <div className="flex flex-wrap gap-2">
  
                                      <select
                                        value=""
                                        disabled={
                                          workingId ===
                                          team.id
                                        }
                                        onChange={(e) => {
                                          const targetPoolId =
                                            e.target.value
  
                                          if (
                                            targetPoolId
                                          ) {
                                            void handleMoveTeam(
                                              pool.id,
                                              targetPoolId,
                                              team.id
                                            )
                                          }
                                        }}
                                        className="
                                          rounded-none
                                          border
                                          border-scoreboard-cream/30
                                          bg-scoreboard-cream
                                          px-2
                                          py-2
                                          text-xs
                                          text-scoreboard-dark
                                        "
                                      >
                                        <option value="">
                                          Move...
                                        </option>
  
                                        {selectedPools
                                          .filter(
                                            (
                                              targetPool
                                            ) =>
                                              targetPool.id !==
                                                pool.id &&
                                              targetPool.status ===
                                                "active"
                                          )
                                          .map(
                                            (
                                              targetPool
                                            ) => (
                                              <option
                                                key={
                                                  targetPool.id
                                                }
                                                value={
                                                  targetPool.id
                                                }
                                              >
                                                {
                                                  targetPool.name
                                                }
                                              </option>
                                            )
                                          )}
  
                                      </select>
  
                                      <input
                                        type="number"
                                        min={1}
                                        defaultValue={
                                          assignment.seed ??
                                          ""
                                        }
                                        placeholder="Seed"
                                        onBlur={(e) =>
                                          void handleSeedChange(
                                            pool.id,
                                            team.id,
                                            e.target.value
                                          )
                                        }
                                        className="
                                          w-20
                                          rounded-none
                                          border
                                          border-scoreboard-cream/30
                                          bg-scoreboard-cream
                                          px-2
                                          py-2
                                          text-xs
                                          text-scoreboard-dark
                                        "
                                      />
  
                                      <button
                                        type="button"
                                        disabled={
                                          workingId ===
                                          team.id
                                        }
                                        onClick={() =>
                                          void handleRemoveTeam(
                                            pool.id,
                                            team.id
                                          )
                                        }
                                        className="
                                          border
                                          border-scoreboard-red/50
                                          px-3
                                          py-2
                                          text-xs
                                          font-black
                                          uppercase
                                          text-scoreboard-red
                                          hover:bg-scoreboard-red/10
                                        "
                                      >
                                        Remove
                                      </button>
  
                                    </div>
  
                                  </div>
  
                                </div>
                              )
                            }
                          )
                        )}
  
                      </div>
  
                    </div>
                  )
                }
              )
            )}
  
          </div>
  
          {/* UNASSIGNED */}
  
          <div className="mt-8 border border-scoreboard-cream/25 bg-scoreboard-green">
  
            <div className="border-b border-scoreboard-cream/20 p-5">
  
              <p className="scoreboard-label text-scoreboard-amber">
                Division Teams
              </p>
  
              <h2 className="mt-2 text-xl font-black uppercase tracking-[0.06em]">
                Unassigned Teams
              </h2>
  
            </div>
  
            {unassignedTeams.length ===
            0 ? (
              <div className="p-6">
  
                <div className="flex items-center gap-3 text-scoreboard-amber">
  
                  <CheckCircle2 className="h-5 w-5" />
  
                  <p className="text-sm font-black uppercase tracking-[0.08em]">
                    All eligible teams are assigned
                  </p>
  
                </div>
  
              </div>
            ) : (
              unassignedTeams.map(
                (team) => (
                  <div
                    key={team.id}
                    className="flex flex-col gap-4 border-b border-scoreboard-cream/15 p-5 last:border-b-0 sm:flex-row sm:items-center sm:justify-between"
                  >
  
                    <div>
  
                      <p className="font-black uppercase tracking-[0.04em]">
                        {team.display_name}
                      </p>
  
                      {(team.city ||
                        team.state) && (
                        <p className="mt-1 text-xs text-scoreboard-muted">
                          {[
                            team.city,
                            team.state,
                          ]
                            .filter(Boolean)
                            .join(", ")}
                        </p>
                      )}
  
                    </div>
  
                    <div>
  
                      {selectedPools.filter(
                        (pool) =>
                          pool.status ===
                          "active"
                      ).length === 0 ? (
                        <p className="text-xs uppercase text-scoreboard-muted">
                          Create an active pool first.
                        </p>
                      ) : (
                        <select
                          defaultValue=""
                          disabled={
                            workingId ===
                            team.id
                          }
                          onChange={(e) => {
                            const poolId =
                              e.target.value
  
                            if (poolId) {
                              void handleAssignTeam(
                                poolId,
                                team.id
                              )
                            }
                          }}
                          className="
                            rounded-none
                            border
                            border-scoreboard-amber
                            bg-scoreboard-amber
                            px-3
                            py-2
                            text-xs
                            font-black
                            uppercase
                            text-scoreboard-dark
                          "
                        >
                          <option value="">
                            Assign To Pool...
                          </option>
  
                          {selectedPools
                            .filter(
                              (pool) =>
                                pool.status ===
                                "active"
                            )
                            .map(
                              (pool) => (
                                <option
                                  key={
                                    pool.id
                                  }
                                  value={
                                    pool.id
                                  }
                                >
                                  {
                                    pool.name
                                  }
                                </option>
                              )
                            )}
  
                        </select>
                      )}
  
                    </div>
  
                  </div>
                )
              )
            )}
  
          </div>
  
        </section>
  
      </main>
    )
  }
  
  function SummaryCard({
    label,
    value,
    icon: Icon,
  }: {
    label: string
    value: number
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
  
        <p className="scoreboard-number mt-4 text-4xl">
          {value}
        </p>
  
      </div>
    )
  }