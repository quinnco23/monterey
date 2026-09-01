import { useEffect, useMemo, useState } from "react"
import { ArrowLeft, CalendarDays, Clock, MapPin } from "lucide-react"
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom"

import { Button } from "@/components/ui/button"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/features/auth/auth-context"

type BookingResource = {
  id: string
  name: string
  resource_type: string
  city: string | null
  state: string | null
  hourly_rate: number | null
}

type AvailabilitySlot = {
  id: string
  resource_id: string
  start_time: string
  end_time: string
  status: string
}

type Organization = {
  id: string
  name: string
}

type Team = {
  id: string
  name: string
  organization_id: string
  age_group: string
}

export function ReserveResourcePage() {
  const { resourceId } = useParams()
  const [searchParams] = useSearchParams()
  const slotId = searchParams.get("slot")

  const navigate = useNavigate()
  const { user } = useAuth()

  const [resource, setResource] = useState<BookingResource | null>(null)
  const [slot, setSlot] = useState<AvailabilitySlot | null>(null)

  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [teams, setTeams] = useState<Team[]>([])

  const [organizationId, setOrganizationId] = useState("")
  const [teamId, setTeamId] = useState("")
  const [purpose, setPurpose] = useState("Practice")
  const [notes, setNotes] = useState("")

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    async function loadReservationPage() {
      if (!resourceId || !slotId || !user) {
        setError("Missing resource, slot, or user.")
        setLoading(false)
        return
      }

      const [
        resourceResult,
        slotResult,
        membershipResult,
      ] = await Promise.all([
        supabase
          .from("booking_resources")
          .select(`
            id,
            name,
            resource_type,
            city,
            state,
            hourly_rate
          `)
          .eq("id", resourceId)
          .single(),

        supabase
          .from("resource_availability")
          .select(`
            id,
            resource_id,
            start_time,
            end_time,
            status
          `)
          .eq("id", slotId)
          .eq("resource_id", resourceId)
          .single(),

        supabase
          .from("organization_members")
          .select(`
            organization_id,
            organizations (
              id,
              name
            )
          `)
          .eq("user_id", user.id)
          .eq("status", "active"),
      ])

      if (resourceResult.error) {
        setError(resourceResult.error.message)
        setLoading(false)
        return
      }

      if (slotResult.error) {
        setError(slotResult.error.message)
        setLoading(false)
        return
      }

      if (slotResult.data.status !== "available") {
        setError("This time slot is no longer available.")
        setLoading(false)
        return
      }

      if (membershipResult.error) {
        setError(membershipResult.error.message)
        setLoading(false)
        return
      }

      const orgs = (membershipResult.data ?? [])
        .map((row: any) => row.organizations)
        .filter(Boolean) as Organization[]

      setResource(resourceResult.data)
      setSlot(slotResult.data)
      setOrganizations(orgs)

      if (orgs.length > 0) {
        setOrganizationId(orgs[0].id)
      }

      setLoading(false)
    }

    void loadReservationPage()
  }, [resourceId, slotId, user])

  useEffect(() => {
    async function loadTeams() {
      if (!organizationId) {
        setTeams([])
        setTeamId("")
        return
      }

      const { data, error } = await supabase
        .from("teams")
        .select(`
          id,
          name,
          organization_id,
          age_group
        `)
        .eq("organization_id", organizationId)
        .eq("status", "active")
        .order("name")

      if (error) {
        setError(error.message)
        return
      }

      setTeams(data ?? [])

      if (data && data.length > 0) {
        setTeamId(data[0].id)
      } else {
        setTeamId("")
      }
    }

    void loadTeams()
  }, [organizationId])

  const totalAmount = useMemo(() => {
    if (!resource || !slot || resource.hourly_rate === null) return null

    const start = new Date(slot.start_time)
    const end = new Date(slot.end_time)

    const hours =
      (end.getTime() - start.getTime()) / 1000 / 60 / 60

    return Number(resource.hourly_rate) * hours
  }, [resource, slot])

 async function handleSubmit(e: React.FormEvent) {
  e.preventDefault()

  if (!user || !resource || !slot) return

  setSaving(true)
  setError("")

  const { data: reservationId, error: reservationError } =
    await supabase.rpc("create_resource_reservation", {
      p_resource_id: resource.id,
      p_organization_id: organizationId || null,
      p_team_id: teamId || null,
      p_start_time: slot.start_time,
      p_end_time: slot.end_time,
      p_purpose: purpose || null,
      p_notes: notes || null,
      p_total_amount: totalAmount,
    })

  console.log("BOOKING RPC RESULT:", {
    reservationId,
    reservationError,
    resourceId: resource.id,
    start: slot.start_time,
    end: slot.end_time,
  })

  if (reservationError) {
    setError(reservationError.message)
    setSaving(false)
    return
  }

  navigate(`/book/resources/${resource.id}`)
}

  if (loading) {
    return (
      <main className="min-h-screen bg-scoreboard-dark px-6 py-12 text-scoreboard-cream">
        <div className="mx-auto max-w-4xl">
          <p className="scoreboard-label">Loading Reservation...</p>
        </div>
      </main>
    )
  }

  if (error || !resource || !slot) {
    return (
      <main className="min-h-screen bg-scoreboard-dark px-6 py-12 text-scoreboard-cream">
        <div className="mx-auto max-w-4xl">
          <div className="border border-scoreboard-red/60 bg-scoreboard-green p-6">
            <p className="scoreboard-label text-scoreboard-amber">
              Unable To Reserve
            </p>

            <p className="mt-3 text-sm text-scoreboard-muted">
              {error}
            </p>
          </div>
        </div>
      </main>
    )
  }

  const start = new Date(slot.start_time)
  const end = new Date(slot.end_time)

  return (
    <main className="min-h-screen bg-scoreboard-dark text-scoreboard-cream">

      <section className="border-b border-scoreboard-cream/20 bg-scoreboard-green">
        <div className="mx-auto max-w-4xl px-6 py-10">

          <Link
            to={`/book/resources/${resource.id}`}
            className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.14em] text-scoreboard-muted hover:text-scoreboard-amber"
          >
            <ArrowLeft className="h-4 w-4" />
            Back To Availability
          </Link>

          <p className="scoreboard-label mt-8 text-scoreboard-amber">
            Reservation
          </p>

          <h1 className="mt-3 text-4xl font-black uppercase tracking-[0.06em]">
            {resource.name}
          </h1>

          <div className="mt-6 flex flex-wrap gap-x-6 gap-y-3 text-sm text-scoreboard-muted">

            <div className="flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-scoreboard-amber" />

              {start.toLocaleDateString([], {
                weekday: "long",
                month: "long",
                day: "numeric",
              })}
            </div>

            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-scoreboard-amber" />

              {start.toLocaleTimeString([], {
                hour: "numeric",
                minute: "2-digit",
              })}
              {" – "}
              {end.toLocaleTimeString([], {
                hour: "numeric",
                minute: "2-digit",
              })}
            </div>

            {(resource.city || resource.state) && (
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-scoreboard-amber" />

                {[resource.city, resource.state]
                  .filter(Boolean)
                  .join(", ")}
              </div>
            )}

          </div>

        </div>
      </section>

      <section className="mx-auto max-w-4xl px-6 py-10">

        <div className="scoreboard-panel p-4">

          <form
            onSubmit={handleSubmit}
            className="border border-scoreboard-cream/30 bg-scoreboard-green p-6 sm:p-8"
          >

            <div className="grid gap-5 sm:grid-cols-2">

              <label>
                <span className="scoreboard-label text-scoreboard-cream">
                  Organization
                </span>

                <select
                  value={organizationId}
                  onChange={(e) => setOrganizationId(e.target.value)}
                  className="mt-2 w-full rounded-none border border-scoreboard-cream/30 bg-scoreboard-cream px-3 py-3 text-scoreboard-dark"
                >
                  <option value="">Personal Booking</option>

                  {organizations.map((organization) => (
                    <option
                      key={organization.id}
                      value={organization.id}
                    >
                      {organization.name}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                <span className="scoreboard-label text-scoreboard-cream">
                  Team
                </span>

                <select
                  value={teamId}
                  onChange={(e) => setTeamId(e.target.value)}
                  disabled={!organizationId}
                  className="mt-2 w-full rounded-none border border-scoreboard-cream/30 bg-scoreboard-cream px-3 py-3 text-scoreboard-dark disabled:opacity-50"
                >
                  <option value="">No Team</option>

                  {teams.map((team) => (
                    <option key={team.id} value={team.id}>
                      {team.age_group} — {team.name}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                <span className="scoreboard-label text-scoreboard-cream">
                  Purpose
                </span>

                <select
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value)}
                  className="mt-2 w-full rounded-none border border-scoreboard-cream/30 bg-scoreboard-cream px-3 py-3 text-scoreboard-dark"
                >
                  <option>Practice</option>
                  <option>Team Workout</option>
                  <option>Scrimmage</option>
                  <option>Training</option>
                  <option>Private Lesson</option>
                  <option>Other</option>
                </select>
              </label>

              <div>
                <span className="scoreboard-label text-scoreboard-cream">
                  Estimated Total
                </span>

                <div className="scoreboard-number mt-2 border border-scoreboard-cream/30 bg-scoreboard-dark px-3 py-3 text-xl">
                  {totalAmount !== null
                    ? `$${totalAmount.toFixed(2)}`
                    : "TBD"}
                </div>
              </div>

              <label className="sm:col-span-2">
                <span className="scoreboard-label text-scoreboard-cream">
                  Notes
                </span>

                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={4}
                  className="mt-2 w-full rounded-none border border-scoreboard-cream/30 bg-scoreboard-cream px-3 py-3 text-scoreboard-dark"
                  placeholder="Optional reservation notes..."
                />
              </label>

            </div>

            {error && (
              <div className="mt-6 border border-scoreboard-red/60 bg-scoreboard-dark p-4">
                <p className="text-sm text-scoreboard-muted">
                  {error}
                </p>
              </div>
            )}

            <Button
              type="submit"
              disabled={saving}
              className="mt-7 w-full rounded-none bg-scoreboard-cream font-black uppercase tracking-[0.14em] text-scoreboard-dark hover:bg-scoreboard-amber"
            >
              {saving ? "Reserving..." : "Confirm Reservation"}
            </Button>

          </form>

        </div>
      </section>

    </main>
  )
}