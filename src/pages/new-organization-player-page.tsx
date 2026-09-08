import { useState } from "react"
import {
  Link,
  useNavigate,
  useParams,
} from "react-router-dom"

import { supabase } from "@/lib/supabase"

export default function NewOrganizationPlayerPage() {
  const { organizationId } =
    useParams()

  const navigate =
    useNavigate()

  const [saving, setSaving] =
    useState(false)

  const [form, setForm] =
    useState({
      firstName: "",
      lastName: "",
      birthDate: "",
      graduationYear: "",
      city: "",
      state: "",
    })

  function updateField(
    field: keyof typeof form,
    value: string
  ) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }))
  }

  async function handleSubmit(
    event: React.FormEvent
  ) {
    event.preventDefault()

    if (!organizationId) {
      alert(
        "Organization could not be identified."
      )
      return
    }

    if (!form.firstName.trim()) {
      alert("Enter a first name.")
      return
    }

    if (!form.lastName.trim()) {
      alert("Enter a last name.")
      return
    }

    try {
      setSaving(true)

      const {
        data,
        error,
      } = await supabase
        .from("players")
        .insert({
          organization_id:
            organizationId,

          first_name:
            form.firstName.trim(),

          last_name:
            form.lastName.trim(),

          birth_date:
            form.birthDate || null,

          graduation_year:
            form.graduationYear
              ? Number(
                  form.graduationYear
                )
              : null,

          city:
            form.city.trim() ||
            null,

          state:
            form.state.trim() ||
            null,
        })
        .select()
        .single()

      if (error) {
        throw error
      }

      console.log(
        "PLAYER CREATED:",
        data
      )

      navigate(
        `/dashboard/organizations/${organizationId}/players`
      )
    } catch (error: any) {
      console.error(
        "Could not create player:",
        error
      )

      alert(
        error?.message ||
          "Could not create player."
      )
    } finally {
      setSaving(false)
    }
  }

  return (
    <main
      className="
        mx-auto
        max-w-2xl
        space-y-6
        p-4
        md:p-6
      "
    >
      {/* HEADER */}

      <header>
        <Link
          to={`/dashboard/organizations/${organizationId}/players`}
          className="scoreboard-label"
        >
          ← Player Pool
        </Link>

        <div className="mt-4">
          <div
            className="
              scoreboard-label
              text-scoreboard-amber
            "
          >
            Organization
          </div>

          <h1
            className="
              scoreboard-title
              mt-1
              text-3xl
            "
          >
            Add Player
          </h1>

          <p
            className="
              mt-2
              text-sm
              text-scoreboard-muted
            "
          >
            Add a player to the
            organization pool. Team
            assignments can be made
            afterward.
          </p>
        </div>
      </header>

      {/* FORM */}

      <form
        onSubmit={handleSubmit}
        className="
          space-y-5
          border
          border-scoreboard-cream/20
          bg-scoreboard-green
          p-5
        "
      >
        {/* NAME */}

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="space-y-2">
            <span className="scoreboard-label">
              First Name
            </span>

            <input
              type="text"
              className="scoreboard-input w-full"
              value={form.firstName}
              onChange={(event) =>
                updateField(
                  "firstName",
                  event.target.value
                )
              }
              placeholder="First name"
              autoComplete="off"
            />
          </label>

          <label className="space-y-2">
            <span className="scoreboard-label">
              Last Name
            </span>

            <input
              type="text"
              className="scoreboard-input w-full"
              value={form.lastName}
              onChange={(event) =>
                updateField(
                  "lastName",
                  event.target.value
                )
              }
              placeholder="Last name"
              autoComplete="off"
            />
          </label>
        </div>

        {/* BIRTH DATE */}

        <label className="block space-y-2">
          <span className="scoreboard-label">
            Date of Birth
          </span>

          <input
            type="date"
            className="
              scoreboard-input
              w-full
              [color-scheme:light]
            "
            value={form.birthDate}
            onChange={(event) =>
              updateField(
                "birthDate",
                event.target.value
              )
            }
          />

          <div
            className="
              text-xs
              text-scoreboard-muted
            "
          >
            Used for age-group and
            league-age eligibility.
          </div>
        </label>

        {/* GRAD YEAR */}

        <label className="block space-y-2">
          <span className="scoreboard-label">
            Graduation Year
          </span>

          <input
            type="number"
            min="2026"
            max="2050"
            inputMode="numeric"
            className="scoreboard-input w-full"
            value={form.graduationYear}
            onChange={(event) =>
              updateField(
                "graduationYear",
                event.target.value
              )
            }
            placeholder="2035"
          />
        </label>

        {/* LOCATION */}

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="space-y-2">
            <span className="scoreboard-label">
              City
            </span>

            <input
              type="text"
              className="scoreboard-input w-full"
              value={form.city}
              onChange={(event) =>
                updateField(
                  "city",
                  event.target.value
                )
              }
              placeholder="Santa Cruz"
            />
          </label>

          <label className="space-y-2">
            <span className="scoreboard-label">
              State
            </span>

            <input
              type="text"
              maxLength={2}
              className="scoreboard-input w-full uppercase"
              value={form.state}
              onChange={(event) =>
                updateField(
                  "state",
                  event.target.value.toUpperCase()
                )
              }
              placeholder="CA"
            />
          </label>
        </div>

        {/* ACTIONS */}

        <div
          className="
            grid
            grid-cols-2
            gap-3
            border-t
            border-scoreboard-cream/20
            pt-5
          "
        >
          <button
            type="button"
            className="scoreboard-button"
            disabled={saving}
            onClick={() =>
              navigate(
                `/dashboard/organizations/${organizationId}/players`
              )
            }
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={saving}
            className="
              scoreboard-button
              scoreboard-button-primary
            "
          >
            {saving
              ? "Adding..."
              : "Add Player"}
          </button>
        </div>
      </form>
    </main>
  )
}