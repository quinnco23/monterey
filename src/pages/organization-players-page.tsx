import { useEffect, useState } from "react"
import { Link, useParams } from "react-router-dom"
import { supabase } from "@/lib/supabase"

type Player = {
  id: string
  organization_id: string
  first_name: string
  last_name: string
  birth_date: string | null
  graduation_year: number | null
  city: string | null
  state: string | null
  active?: boolean
}

export default function OrganizationPlayersPage() {
  const { organizationId } = useParams()

  const [players, setPlayers] = useState<Player[]>([])
  const [organizationName, setOrganizationName] = useState("")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!organizationId) return

    async function loadPage() {
      setLoading(true)

      try {
        const [
          { data: organization, error: organizationError },
          { data: playerData, error: playerError },
        ] = await Promise.all([
          supabase
            .from("organizations")
            .select("id, name")
            .eq("id", organizationId)
            .single(),

          supabase
            .from("players")
            .select(`
              id,
              organization_id,
              first_name,
              last_name,
              birth_date,
              graduation_year,
              city,
              state
            `)
            .eq("organization_id", organizationId)
            .order("last_name")
            .order("first_name"),
        ])

        if (organizationError) throw organizationError
        if (playerError) throw playerError

        setOrganizationName(organization?.name ?? "")
        setPlayers(playerData ?? [])
      } catch (error) {
        console.error("Could not load player pool:", error)
      } finally {
        setLoading(false)
      }
    }

    loadPage()
  }, [organizationId])

  if (loading) {
    return (
      <div className="p-6 text-scoreboard-cream">
        Loading player pool...
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-4 md:p-6">

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="scoreboard-label">
            {organizationName}
          </div>

          <h1 className="text-3xl font-bold text-scoreboard-cream">
            Player Pool
          </h1>

          <p className="mt-1 text-scoreboard-muted">
            {players.length}{" "}
            {players.length === 1 ? "player" : "players"}
          </p>
        </div>

        <Link
          to={`/dashboard/organizations/${organizationId}/players/new`}
          className="
            bg-scoreboard-amber
            px-4 py-3
            text-center
            font-bold
            text-scoreboard-dark
          "
        >
          + Add Player
        </Link>
      </div>

      {/* Player list */}
      {players.length === 0 ? (
        <div
          className="
            border
            border-scoreboard-cream/20
            bg-scoreboard-green
            p-8
            text-center
          "
        >
          <div className="scoreboard-label">
            Organization Roster
          </div>

          <h2 className="mt-2 text-xl font-bold text-scoreboard-cream">
            No players yet
          </h2>

          <p className="mt-2 text-scoreboard-muted">
            Add players to create your organization player pool.
          </p>

          <Link
            to={`/dashboard/organizations/${organizationId}/players/new`}
            className="
              mt-5
              inline-block
              bg-scoreboard-amber
              px-5 py-3
              font-bold
              text-scoreboard-dark
            "
          >
            Add First Player
          </Link>
        </div>
      ) : (
        <div className="space-y-2">
          {players.map((player) => (
            <div
              key={player.id}
              className="
                grid
                grid-cols-[1fr_auto]
                items-center
                gap-4
                border
                border-scoreboard-cream/20
                bg-scoreboard-green
                p-4
              "
            >
              <div>
                <div className="font-bold text-scoreboard-cream">
                  {player.first_name} {player.last_name}
                </div>

                <div className="mt-1 text-sm text-scoreboard-muted">
                  {player.birth_date
                    ? `DOB: ${formatBirthDate(player.birth_date)}`
                    : "DOB not entered"}

                  {player.graduation_year
                    ? ` • Class of ${player.graduation_year}`
                    : ""}
                </div>
              </div>

              <Link
                to={`/dashboard/organizations/${organizationId}/players/${player.id}`}
                className="scoreboard-label"
              >
                View →
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function formatBirthDate(date: string) {
  return new Date(`${date}T00:00:00`).toLocaleDateString(
    "en-US",
    {
      month: "short",
      day: "numeric",
      year: "numeric",
    }
  )
}