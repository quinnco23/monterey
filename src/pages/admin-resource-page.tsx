import { useEffect, useState } from "react"
import {
  ArrowLeft,
  CalendarDays,
  Clock,
  Plus,
  Save,
  Trash2,
} from "lucide-react"
import { Link, useParams } from "react-router-dom"

import { Button } from "@/components/ui/button"
import { supabase } from "@/lib/supabase"

type BookingResource = {
  id: string
  name: string
  resource_type: string
  description: string | null
  city: string | null
  state: string | null
  hourly_rate: number | null
  active: boolean
  booking_mode: string | null
}

type AvailabilitySlot = {
  id: string
  resource_id: string
  start_time: string
  end_time: string
  status: string
  note: string | null
}

export function AdminResourcePage() {
  const { resourceId } = useParams()

  const [resource, setResource] = useState<BookingResource | null>(null)
  const [slots, setSlots] = useState<AvailabilitySlot[]>([])

  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [city, setCity] = useState("")
  const [state, setState] = useState("")
  const [hourlyRate, setHourlyRate] = useState("")
  const [bookingMode, setBookingMode] = useState("instant")
  const [active, setActive] = useState(true)

  const [newDate, setNewDate] = useState("")
  const [newStartTime, setNewStartTime] = useState("08:00")
  const [newEndTime, setNewEndTime] = useState("10:00")
  const [newStatus, setNewStatus] = useState("available")
  const [newNote, setNewNote] = useState("")

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [addingSlot, setAddingSlot] = useState(false)
  const [error, setError] = useState("")

  const [bulkStartDate, setBulkStartDate] = useState("")
const [bulkEndDate, setBulkEndDate] = useState("")

const [bulkStartTime, setBulkStartTime] = useState("08:00")
const [bulkEndTime, setBulkEndTime] = useState("20:00")

const [slotMinutes, setSlotMinutes] = useState("120")

const [selectedDays, setSelectedDays] = useState<number[]>([
  5,
  6,
])

const [generating, setGenerating] = useState(false)

  async function loadResource() {
    if (!resourceId) {
      setError("Missing resource ID.")
      setLoading(false)
      return
    }

    setLoading(true)
    setError("")

    const [resourceResult, availabilityResult] = await Promise.all([
      supabase
        .from("booking_resources")
        .select(`
          id,
          name,
          resource_type,
          description,
          city,
          state,
          hourly_rate,
          active,
          booking_mode
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
          status,
          note
        `)
        .eq("resource_id", resourceId)
        .order("start_time"),
    ])

    if (resourceResult.error) {
      setError(resourceResult.error.message)
      setLoading(false)
      return
    }

    if (availabilityResult.error) {
      setError(availabilityResult.error.message)
      setLoading(false)
      return
    }

    const data = resourceResult.data

    setResource(data)

    setName(data.name ?? "")
    setDescription(data.description ?? "")
    setCity(data.city ?? "")
    setState(data.state ?? "")
    setHourlyRate(
      data.hourly_rate !== null
        ? String(data.hourly_rate)
        : ""
    )
    setBookingMode(data.booking_mode ?? "instant")
    setActive(data.active)

    setSlots(availabilityResult.data ?? [])
    setLoading(false)
  }

  useEffect(() => {
    void loadResource()
  }, [resourceId])

  async function handleSaveResource(e: React.FormEvent) {
    e.preventDefault()

    if (!resourceId) return

    setSaving(true)
    setError("")

    const { error } = await supabase
      .from("booking_resources")
      .update({
        name: name.trim(),
        description: description.trim() || null,
        city: city.trim() || null,
        state: state.trim() || null,
        hourly_rate: hourlyRate
          ? Number(hourlyRate)
          : null,
        booking_mode: bookingMode,
        active,
        updated_at: new Date().toISOString(),
      })
      .eq("id", resourceId)

    if (error) {
      setError(error.message)
      setSaving(false)
      return
    }

    setSaving(false)
    await loadResource()
  }

  async function handleAddAvailability(e: React.FormEvent) {
    e.preventDefault()

    if (!resourceId) return

    if (!newDate || !newStartTime || !newEndTime) {
      setError("Date, start time, and end time are required.")
      return
    }

    const start = new Date(
      `${newDate}T${newStartTime}:00`
    )

    const end = new Date(
      `${newDate}T${newEndTime}:00`
    )

    if (end <= start) {
      setError("End time must be after start time.")
      return
    }

    setAddingSlot(true)
    setError("")

    const { error } = await supabase
      .from("resource_availability")
      .insert({
        resource_id: resourceId,
        start_time: start.toISOString(),
        end_time: end.toISOString(),
        status: newStatus,
        note: newNote.trim() || null,
      })

    if (error) {
      setError(error.message)
      setAddingSlot(false)
      return
    }

    setNewNote("")
    setAddingSlot(false)

    await loadResource()
  }

  async function handleDeleteSlot(slotId: string) {
    const confirmed = window.confirm(
      "Delete this availability window?"
    )

    if (!confirmed) return

    const { error } = await supabase
      .from("resource_availability")
      .delete()
      .eq("id", slotId)

    if (error) {
      setError(error.message)
      return
    }

    setSlots((current) =>
      current.filter((slot) => slot.id !== slotId)
    )
  }

  function toggleDay(day: number) {
    setSelectedDays((current) =>
      current.includes(day)
        ? current.filter((value) => value !== day)
        : [...current, day]
    )
  }

  async function handleGenerateAvailability(
    e: React.FormEvent
  ) {
    e.preventDefault()
  
    if (!resourceId) return
  
    if (!bulkStartDate || !bulkEndDate) {
      setError("Start date and end date are required.")
      return
    }
  
    if (selectedDays.length === 0) {
      setError("Select at least one day of the week.")
      return
    }
  
    const minutes = Number(slotMinutes)
  
    if (!minutes || minutes <= 0) {
      setError("Slot length must be greater than zero.")
      return
    }
  
    setGenerating(true)
    setError("")
  
    const rangeStart = new Date(
      `${bulkStartDate}T00:00:00`
    )
  
    const rangeEnd = new Date(
      `${bulkEndDate}T00:00:00`
    )
  
    if (rangeEnd < rangeStart) {
      setError("End date must be after start date.")
      setGenerating(false)
      return
    }
  
    const rows: {
      resource_id: string
      start_time: string
      end_time: string
      status: string
    }[] = []
  
    const currentDate = new Date(rangeStart)
  
    while (currentDate <= rangeEnd) {
      if (selectedDays.includes(currentDate.getDay())) {
        const dateString = [
          currentDate.getFullYear(),
          String(currentDate.getMonth() + 1).padStart(2, "0"),
          String(currentDate.getDate()).padStart(2, "0"),
        ].join("-")
  
        const dayStart = new Date(
          `${dateString}T${bulkStartTime}:00`
        )
  
        const dayEnd = new Date(
          `${dateString}T${bulkEndTime}:00`
        )
  
        let slotStart = new Date(dayStart)
  
        while (slotStart < dayEnd) {
          const slotEnd = new Date(
            slotStart.getTime() +
              minutes * 60 * 1000
          )
  
          if (slotEnd > dayEnd) {
            break
          }
  
          rows.push({
            resource_id: resourceId,
            start_time: slotStart.toISOString(),
            end_time: slotEnd.toISOString(),
            status: "available",
          })
  
          slotStart = slotEnd
        }
      }
  
      currentDate.setDate(
        currentDate.getDate() + 1
      )
    }
  
    if (rows.length === 0) {
      setError(
        "No availability slots were generated from those settings."
      )
      setGenerating(false)
      return
    }
  
    const { data: existing, error: existingError } =
      await supabase
        .from("resource_availability")
        .select(`
          start_time,
          end_time
        `)
        .eq("resource_id", resourceId)
        .gte(
          "start_time",
          rangeStart.toISOString()
        )
        .lte(
          "start_time",
          new Date(
            rangeEnd.getTime() +
              24 * 60 * 60 * 1000
          ).toISOString()
        )
  
    if (existingError) {
      setError(existingError.message)
      setGenerating(false)
      return
    }
  
    const existingKeys = new Set(
      (existing ?? []).map(
        (slot) =>
          `${slot.start_time}|${slot.end_time}`
      )
    )
  
    const newRows = rows.filter(
      (row) =>
        !existingKeys.has(
          `${row.start_time}|${row.end_time}`
        )
    )
  
    if (newRows.length === 0) {
      setError(
        "All generated slots already exist."
      )
      setGenerating(false)
      return
    }
  
    const { data: insertedRows, error: insertError } = await supabase
    .from("resource_availability")
    .upsert(newRows, {
      onConflict: "resource_id,start_time,end_time",
      ignoreDuplicates: true,
    })
    .select()

console.log("BULK INSERT:", {
  insertedRows,
  insertError,
  count: newRows.length,
})

if (insertError) {
  setError(insertError.message)
  setGenerating(false)
  return
}

setGenerating(false)

await loadResource()
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-scoreboard-dark px-6 py-12 text-scoreboard-cream">
        <div className="mx-auto max-w-7xl">
          <p className="scoreboard-label">
            Loading Resource...
          </p>
        </div>
      </main>
    )
  }

  if (error && !resource) {
    return (
      <main className="min-h-screen bg-scoreboard-dark px-6 py-12 text-scoreboard-cream">
        <div className="mx-auto max-w-7xl">
          <div className="border border-scoreboard-red/60 bg-scoreboard-green p-6">
            <p className="scoreboard-label text-scoreboard-amber">
              Unable To Load Resource
            </p>

            <p className="mt-3 text-sm text-scoreboard-muted">
              {error}
            </p>
          </div>
        </div>
      </main>
    )
  }

  if (!resource) return null

  return (
    <main className="min-h-screen bg-scoreboard-dark text-scoreboard-cream">

      {/* HEADER */}
      <section className="border-b border-scoreboard-cream/20 bg-scoreboard-green">
        <div className="mx-auto max-w-7xl px-6 py-10">

          <Link
            to="/admin/resources"
            className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.14em] text-scoreboard-muted hover:text-scoreboard-amber"
          >
            <ArrowLeft className="h-4 w-4" />
            Admin Resources
          </Link>

          <p className="scoreboard-label mt-8 text-scoreboard-amber">
            {resource.resource_type.replaceAll("_", " ")}
          </p>

          <h1 className="mt-3 text-4xl font-black uppercase tracking-[0.06em] sm:text-5xl">
            {resource.name}
          </h1>

        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-6 px-6 py-10 lg:grid-cols-[.8fr_1.2fr]">

        {/* RESOURCE SETTINGS */}
        <div className="scoreboard-panel p-4">

          <form
            onSubmit={handleSaveResource}
            className="border border-scoreboard-cream/30 bg-scoreboard-green p-6"
          >

            <p className="scoreboard-label text-scoreboard-amber">
              Resource
            </p>

            <h2 className="mt-2 text-2xl font-black uppercase tracking-[0.07em]">
              Settings
            </h2>

            <div className="mt-6 space-y-5">

              <ResourceInput
                label="Name"
                value={name}
                onChange={setName}
              />

              <label className="block">
                <span className="scoreboard-label text-scoreboard-cream">
                  Description
                </span>

                <textarea
                  value={description}
                  onChange={(e) =>
                    setDescription(e.target.value)
                  }
                  rows={4}
                  className="mt-2 w-full rounded-none border border-scoreboard-cream/30 bg-scoreboard-cream px-3 py-3 text-scoreboard-dark"
                />
              </label>

              <div className="grid gap-4 sm:grid-cols-2">

                <ResourceInput
                  label="City"
                  value={city}
                  onChange={setCity}
                />

                <ResourceInput
                  label="State"
                  value={state}
                  onChange={setState}
                />

              </div>

              <ResourceInput
                label="Hourly Rate"
                value={hourlyRate}
                onChange={setHourlyRate}
                type="number"
              />

              <label className="block">
                <span className="scoreboard-label text-scoreboard-cream">
                  Booking Mode
                </span>

                <select
                  value={bookingMode}
                  onChange={(e) =>
                    setBookingMode(e.target.value)
                  }
                  className="mt-2 w-full rounded-none border border-scoreboard-cream/30 bg-scoreboard-cream px-3 py-3 text-scoreboard-dark"
                >
                  <option value="instant">
                    Instant Booking
                  </option>

                  <option value="request">
                    Request Approval
                  </option>

                  <option value="unavailable">
                    Unavailable
                  </option>
                </select>
              </label>

              <label className="flex items-center gap-3 border border-scoreboard-cream/20 bg-scoreboard-dark p-4">

                <input
                  type="checkbox"
                  checked={active}
                  onChange={(e) =>
                    setActive(e.target.checked)
                  }
                  className="h-4 w-4"
                />

                <div>
                  <p className="text-sm font-black uppercase">
                    Active Resource
                  </p>

                  <p className="mt-1 text-xs text-scoreboard-muted">
                    Show this resource on the public booking site.
                  </p>
                </div>

              </label>

            </div>

            <Button
              type="submit"
              disabled={saving}
              className="mt-7 w-full rounded-none bg-scoreboard-cream font-black uppercase tracking-[0.14em] text-scoreboard-dark hover:bg-scoreboard-amber"
            >
              <Save className="mr-2 h-4 w-4" />

              {saving
                ? "Saving..."
                : "Save Resource"}
            </Button>

          </form>

        </div>
        

        {/* AVAILABILITY */}
        <div className="space-y-6">

{/* BULK AVAILABILITY */}
<div className="scoreboard-panel p-4">
  <form
    onSubmit={handleGenerateAvailability}
    className="border border-scoreboard-cream/30 bg-scoreboard-green p-6"
  >
    <p className="scoreboard-label text-scoreboard-amber">
      Schedule
    </p>

    <h2 className="mt-2 text-2xl font-black uppercase tracking-[0.07em]">
      Bulk Availability
    </h2>

    <p className="mt-3 text-sm leading-6 text-scoreboard-muted">
      Generate recurring reservation windows for this resource.
    </p>

    <div className="mt-6 grid gap-4 sm:grid-cols-2">

      <label>
        <span className="scoreboard-label text-scoreboard-cream">
          Start Date
        </span>

        <input
          type="date"
          value={bulkStartDate}
          onChange={(e) => setBulkStartDate(e.target.value)}
          className="mt-2 w-full rounded-none border border-scoreboard-cream/30 bg-scoreboard-cream px-3 py-3 text-scoreboard-dark"
        />
      </label>

      <label>
        <span className="scoreboard-label text-scoreboard-cream">
          End Date
        </span>

        <input
          type="date"
          value={bulkEndDate}
          onChange={(e) => setBulkEndDate(e.target.value)}
          className="mt-2 w-full rounded-none border border-scoreboard-cream/30 bg-scoreboard-cream px-3 py-3 text-scoreboard-dark"
        />
      </label>

      <label>
        <span className="scoreboard-label text-scoreboard-cream">
          Opening Time
        </span>

        <input
          type="time"
          value={bulkStartTime}
          onChange={(e) => setBulkStartTime(e.target.value)}
          className="mt-2 w-full rounded-none border border-scoreboard-cream/30 bg-scoreboard-cream px-3 py-3 text-scoreboard-dark"
        />
      </label>

      <label>
        <span className="scoreboard-label text-scoreboard-cream">
          Closing Time
        </span>

        <input
          type="time"
          value={bulkEndTime}
          onChange={(e) => setBulkEndTime(e.target.value)}
          className="mt-2 w-full rounded-none border border-scoreboard-cream/30 bg-scoreboard-cream px-3 py-3 text-scoreboard-dark"
        />
      </label>

      <label className="sm:col-span-2">
        <span className="scoreboard-label text-scoreboard-cream">
          Slot Length
        </span>

        <select
          value={slotMinutes}
          onChange={(e) => setSlotMinutes(e.target.value)}
          className="mt-2 w-full rounded-none border border-scoreboard-cream/30 bg-scoreboard-cream px-3 py-3 text-scoreboard-dark"
        >
          <option value="30">30 Minutes</option>
          <option value="60">1 Hour</option>
          <option value="90">90 Minutes</option>
          <option value="120">2 Hours</option>
          <option value="180">3 Hours</option>
        </select>
      </label>

    </div>

    <div className="mt-6">
      <p className="scoreboard-label text-scoreboard-cream">
        Days
      </p>

      <div className="mt-3 grid grid-cols-4 gap-2 sm:grid-cols-7">

        {[
          [0, "Sun"],
          [1, "Mon"],
          [2, "Tue"],
          [3, "Wed"],
          [4, "Thu"],
          [5, "Fri"],
          [6, "Sat"],
        ].map(([day, label]) => {
          const value = Number(day)
          const selected = selectedDays.includes(value)

          return (
            <button
              key={value}
              type="button"
              onClick={() => toggleDay(value)}
              className={
                selected
                  ? `
                    border
                    border-scoreboard-amber
                    bg-scoreboard-amber
                    px-3
                    py-3
                    text-xs
                    font-black
                    uppercase
                    text-scoreboard-dark
                  `
                  : `
                    border
                    border-scoreboard-cream/30
                    px-3
                    py-3
                    text-xs
                    font-black
                    uppercase
                    text-scoreboard-cream
                    hover:border-scoreboard-amber
                  `
              }
            >
              {label}
            </button>
          )
        })}

      </div>
    </div>
    <p className="mb-2 text-xs text-scoreboard-amber">
  generating: {String(generating)}
</p>

<p className="mb-2 text-xs text-scoreboard-amber">
  generating: {String(generating)}
</p>

<button
  type="submit"
  disabled={generating}
  className="
    mt-7
    w-full
    bg-scoreboard-cream
    px-4
    py-3
    font-black
    uppercase
    tracking-[0.14em]
    text-scoreboard-dark
  "
>
  {generating
    ? "Generating..."
    : "Generate Availability"}
</button>
  </form>
</div>
          

          {/* ADD SLOT */}
          <div className="scoreboard-panel p-4">

            <form
              onSubmit={handleAddAvailability}
              className="border border-scoreboard-cream/30 bg-scoreboard-green p-6"
            >

              <p className="scoreboard-label text-scoreboard-amber">
                Schedule
              </p>

              

              <h2 className="mt-2 text-2xl font-black uppercase tracking-[0.07em]">
                Add Availability
              </h2>

              <div className="mt-6 grid gap-4 sm:grid-cols-2">

                <label>
                  <span className="scoreboard-label text-scoreboard-cream">
                    Date
                  </span>

                  <input
                    type="date"
                    value={newDate}
                    onChange={(e) =>
                      setNewDate(e.target.value)
                    }
                    className="mt-2 w-full rounded-none border border-scoreboard-cream/30 bg-scoreboard-cream px-3 py-3 text-scoreboard-dark"
                  />
                </label>

                <label>
                  <span className="scoreboard-label text-scoreboard-cream">
                    Status
                  </span>

                  <select
                    value={newStatus}
                    onChange={(e) =>
                      setNewStatus(e.target.value)
                    }
                    className="mt-2 w-full rounded-none border border-scoreboard-cream/30 bg-scoreboard-cream px-3 py-3 text-scoreboard-dark"
                  >
                    <option value="available">
                      Available
                    </option>

                    <option value="blocked">
                      Blocked
                    </option>

                    <option value="tournament_hold">
                      Tournament Hold
                    </option>

                    <option value="private_hold">
                      Private Hold
                    </option>

                    <option value="maintenance">
                      Maintenance
                    </option>
                  </select>
                </label>

                <label>
                  <span className="scoreboard-label text-scoreboard-cream">
                    Start Time
                  </span>

                  <input
                    type="time"
                    value={newStartTime}
                    onChange={(e) =>
                      setNewStartTime(e.target.value)
                    }
                    className="mt-2 w-full rounded-none border border-scoreboard-cream/30 bg-scoreboard-cream px-3 py-3 text-scoreboard-dark"
                  />
                </label>

                <label>
                  <span className="scoreboard-label text-scoreboard-cream">
                    End Time
                  </span>

                  <input
                    type="time"
                    value={newEndTime}
                    onChange={(e) =>
                      setNewEndTime(e.target.value)
                    }
                    className="mt-2 w-full rounded-none border border-scoreboard-cream/30 bg-scoreboard-cream px-3 py-3 text-scoreboard-dark"
                  />
                </label>

                <label className="sm:col-span-2">
                  <span className="scoreboard-label text-scoreboard-cream">
                    Note
                  </span>

                  <input
                    value={newNote}
                    onChange={(e) =>
                      setNewNote(e.target.value)
                    }
                    placeholder="Optional note..."
                    className="mt-2 w-full rounded-none border border-scoreboard-cream/30 bg-scoreboard-cream px-3 py-3 text-scoreboard-dark"
                  />
                </label>

              </div>

              <Button
                type="submit"
                disabled={addingSlot}
                className="mt-6 w-full rounded-none bg-scoreboard-cream font-black uppercase tracking-[0.14em] text-scoreboard-dark hover:bg-scoreboard-amber"
              >
                <Plus className="mr-2 h-4 w-4" />

                {addingSlot
                  ? "Adding..."
                  : "Add Availability"}
              </Button>

            </form>

          </div>

          {/* CURRENT SLOTS */}
          <div className="scoreboard-panel p-4">

            <div className="border border-scoreboard-cream/30 bg-scoreboard-green p-6">

              <div className="flex items-end justify-between border-b border-scoreboard-cream/20 pb-4">

                <div>
                  <p className="scoreboard-label text-scoreboard-amber">
                    Current
                  </p>

                  <h2 className="mt-2 text-2xl font-black uppercase tracking-[0.07em]">
                    Availability
                  </h2>
                </div>

                <div className="scoreboard-number text-2xl">
                  {slots.length}
                </div>

              </div>

              {slots.length === 0 ? (
                <p className="py-8 text-center text-sm text-scoreboard-muted">
                  No availability windows have been added.
                </p>
              ) : (
                <div>

                  {slots.map((slot) => {
                    const start = new Date(slot.start_time)
                    const end = new Date(slot.end_time)

                    return (
                      <div
                        key={slot.id}
                        className="grid gap-4 border-b border-scoreboard-cream/15 py-4 sm:grid-cols-[1fr_auto] sm:items-center"
                      >

                        <div>

                          <div className="flex flex-wrap items-center gap-3">

                            <span
                              className={
                                slot.status === "available"
                                  ? "h-2.5 w-2.5 bg-scoreboard-amber"
                                  : "h-2.5 w-2.5 bg-scoreboard-red"
                              }
                            />

                            <span className="text-sm font-black uppercase tracking-[0.12em]">
                              {slot.status.replaceAll("_", " ")}
                            </span>

                          </div>

                          <div className="mt-3 flex flex-wrap gap-4 text-sm text-scoreboard-muted">

                            <div className="flex items-center gap-2">
                              <CalendarDays className="h-4 w-4 text-scoreboard-amber" />

                              {start.toLocaleDateString([], {
                                weekday: "short",
                                month: "short",
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

                          </div>

                          {slot.note && (
                            <p className="mt-2 text-xs text-scoreboard-muted">
                              {slot.note}
                            </p>
                          )}

                        </div>

                        <button
                          type="button"
                          onClick={() =>
                            void handleDeleteSlot(slot.id)
                          }
                          className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.12em] text-scoreboard-muted hover:text-scoreboard-red"
                        >
                          <Trash2 className="h-4 w-4" />
                          Delete
                        </button>

                      </div>
                    )
                  })}

                </div>
              )}

            </div>

          </div>

        </div>

      </section>

      {error && (
        <div className="mx-auto max-w-7xl px-6 pb-10">
          <div className="border border-scoreboard-red/60 bg-scoreboard-green p-4">
            <p className="text-sm text-scoreboard-muted">
              {error}
            </p>
          </div>
        </div>
      )}

    </main>
  )
}

function ResourceInput({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string
  value: string
  onChange: (value: string) => void
  type?: string
}) {
  return (
    <label className="block">

      <span className="scoreboard-label text-scoreboard-cream">
        {label}
      </span>

      <input
        type={type}
        value={value}
        onChange={(e) =>
          onChange(e.target.value)
        }
        className="mt-2 w-full rounded-none border border-scoreboard-cream/30 bg-scoreboard-cream px-3 py-3 text-scoreboard-dark"
      />

    </label>
  )
}