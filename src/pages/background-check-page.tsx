import { FormEvent, useEffect, useState } from "react"
import { ArrowLeft, ShieldCheck } from "lucide-react"
import { Link, useNavigate, useParams } from "react-router-dom"

import { Button } from "@/components/ui/button"
import { supabase } from "@/lib/supabase"

type BackgroundCheckStatus =
  | "not_required"
  | "not_started"
  | "invited"
  | "in_progress"
  | "clear"
  | "review_required"
  | "expired"
  | "cancelled"

type BackgroundCheck = {
  id: string
  provider: string
  provider_reference_id: string | null
  status: BackgroundCheckStatus
  requested_at: string | null
  completed_at: string | null
  expires_at: string | null
  consent_confirmed_at: string | null
}

function toDateInput(value: string | null) {
  return value ? value.slice(0, 10) : ""
}

export function BackgroundCheckPage() {
  const { organizationId, memberId } = useParams()
  const navigate = useNavigate()

  const [checkId, setCheckId] = useState<string | null>(null)

  const [provider, setProvider] = useState("manual")
  const [providerReferenceId, setProviderReferenceId] = useState("")

  const [status, setStatus] =
    useState<BackgroundCheckStatus>("not_started")

  const [requestedAt, setRequestedAt] = useState("")
  const [completedAt, setCompletedAt] = useState("")
  const [expiresAt, setExpiresAt] = useState("")
  const [consentConfirmedAt, setConsentConfirmedAt] = useState("")

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    async function loadPage() {
      if (!organizationId || !memberId) {
        setError("Missing organization or member.")
        setLoading(false)
        return
      }

      setLoading(true)
      setError("")

      const { data, error } = await supabase
        .from("background_checks")
        .select(`
          id,
          provider,
          provider_reference_id,
          status,
          requested_at,
          completed_at,
          expires_at,
          consent_confirmed_at
        `)
        .eq("organization_id", organizationId)
        .eq("organization_member_id", memberId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle()

      if (error) {
        setError(error.message)
        setLoading(false)
        return
      }

      if (data) {
        const check = data as BackgroundCheck

        setCheckId(check.id)
        setProvider(check.provider ?? "manual")
        setProviderReferenceId(check.provider_reference_id ?? "")
        setStatus(check.status)

        setRequestedAt(toDateInput(check.requested_at))
        setCompletedAt(toDateInput(check.completed_at))
        setExpiresAt(toDateInput(check.expires_at))
        setConsentConfirmedAt(toDateInput(check.consent_confirmed_at))
      }

      setLoading(false)
    }

    void loadPage()
  }, [organizationId, memberId])

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault()

    if (!organizationId || !memberId) {
      setError("Missing organization or member.")
      return
    }

    setSaving(true)
    setError("")

    const payload = {
      organization_id: organizationId,
      organization_member_id: memberId,

      provider: provider.trim() || "manual",

      provider_reference_id:
        providerReferenceId.trim() || null,

      status,

      requested_at:
        requestedAt
          ? new Date(`${requestedAt}T12:00:00`).toISOString()
          : null,

      completed_at:
        completedAt
          ? new Date(`${completedAt}T12:00:00`).toISOString()
          : null,

      expires_at:
        expiresAt
          ? new Date(`${expiresAt}T12:00:00`).toISOString()
          : null,

      consent_confirmed_at:
        consentConfirmedAt
          ? new Date(`${consentConfirmedAt}T12:00:00`).toISOString()
          : null,

      updated_at: new Date().toISOString(),
    }

    if (checkId) {
      const { error } = await supabase
        .from("background_checks")
        .update(payload)
        .eq("id", checkId)

      if (error) {
        setSaving(false)
        setError(error.message)
        return
      }
    } else {
      const { error } = await supabase
        .from("background_checks")
        .insert(payload)

      if (error) {
        setSaving(false)
        setError(error.message)
        return
      }
    }

    setSaving(false)

    navigate(
      `/dashboard/organizations/${organizationId}`,
      { replace: true }
    )
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-scoreboard-dark px-6 py-12 text-scoreboard-cream">
        <p className="scoreboard-label">
          Loading Background Check...
        </p>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-scoreboard-dark text-scoreboard-cream">

      <section className="border-b border-scoreboard-cream/20 bg-scoreboard-green">
        <div className="mx-auto max-w-3xl px-6 py-10">

          <Link
            to={`/dashboard/organizations/${organizationId}`}
            className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.12em] text-scoreboard-muted hover:text-scoreboard-amber"
          >
            <ArrowLeft className="h-4 w-4" />
            Organization
          </Link>

          <div className="mt-8 flex items-center gap-3">
            <ShieldCheck className="h-7 w-7 text-scoreboard-amber" />

            <p className="scoreboard-label text-scoreboard-amber">
              Staff Compliance
            </p>
          </div>

          <h1 className="mt-3 text-3xl font-black uppercase tracking-[0.06em]">
            Background Check
          </h1>

        </div>
      </section>

      <section className="mx-auto max-w-3xl px-6 py-10">

        <form
          onSubmit={handleSubmit}
          className="scoreboard-panel p-4"
        >
          <div className="space-y-6 border border-scoreboard-cream/30 bg-scoreboard-green p-6">

            <label className="block">
              <span className="scoreboard-label">
                Provider
              </span>

              <input
                value={provider}
                onChange={(e) => setProvider(e.target.value)}
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
              <span className="scoreboard-label">
                Provider Reference
              </span>

              <input
                value={providerReferenceId}
                onChange={(e) =>
                  setProviderReferenceId(e.target.value)
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
              <span className="scoreboard-label">
                Status
              </span>

              <select
                value={status}
                onChange={(e) =>
                  setStatus(
                    e.target.value as BackgroundCheckStatus
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
              >
                <option value="not_required">Not Required</option>
                <option value="not_started">Not Started</option>
                <option value="invited">Invited</option>
                <option value="in_progress">In Progress</option>
                <option value="clear">Clear</option>
                <option value="review_required">Review Required</option>
                <option value="expired">Expired</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </label>

            <div className="grid gap-4 sm:grid-cols-2">

              <label className="block">
                <span className="scoreboard-label">
                  Requested
                </span>

                <input
                  type="date"
                  value={requestedAt}
                  onChange={(e) =>
                    setRequestedAt(e.target.value)
                  }
                  className="mt-2 w-full bg-scoreboard-cream px-3 py-3 text-scoreboard-dark"
                />
              </label>

              <label className="block">
                <span className="scoreboard-label">
                  Completed
                </span>

                <input
                  type="date"
                  value={completedAt}
                  onChange={(e) =>
                    setCompletedAt(e.target.value)
                  }
                  className="mt-2 w-full bg-scoreboard-cream px-3 py-3 text-scoreboard-dark"
                />
              </label>

              <label className="block">
                <span className="scoreboard-label">
                  Expires
                </span>

                <input
                  type="date"
                  value={expiresAt}
                  onChange={(e) =>
                    setExpiresAt(e.target.value)
                  }
                  className="mt-2 w-full bg-scoreboard-cream px-3 py-3 text-scoreboard-dark"
                />
              </label>

              <label className="block">
                <span className="scoreboard-label">
                  Consent Confirmed
                </span>

                <input
                  type="date"
                  value={consentConfirmedAt}
                  onChange={(e) =>
                    setConsentConfirmedAt(e.target.value)
                  }
                  className="mt-2 w-full bg-scoreboard-cream px-3 py-3 text-scoreboard-dark"
                />
              </label>

            </div>

            <div className="border border-scoreboard-amber/30 bg-scoreboard-dark p-4">
              <p className="text-xs leading-6 text-scoreboard-muted">
                Store only the screening provider, reference number,
                dates, and operational status here. Sensitive screening
                information should remain with the screening provider.
              </p>
            </div>

            {error && (
              <div className="border border-scoreboard-red/60 bg-scoreboard-dark p-4">
                <p className="text-sm text-scoreboard-muted">
                  {error}
                </p>
              </div>
            )}

            <Button
              disabled={saving}
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
                ? "Saving..."
                : "Save Background Check"}
            </Button>

          </div>
        </form>

      </section>

    </main>
  )
}