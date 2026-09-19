import {
    useEffect,
    useMemo,
    useState,
  } from "react"
  
  import {
    CheckCircle2,
    FileText,
    RefreshCw,
    ShieldAlert,
    ShieldCheck,
    XCircle,
  } from "lucide-react"
  
  import { Button } from "@/components/ui/button"
  import { supabase } from "@/lib/supabase"
  
  type InsuranceStatus =
    | "pending"
    | "verified"
    | "rejected"
    | "expired"
    | "needs_review"
  
  type InsuranceRow = {
    id: string
    team_id: string
  
    provider: string
    policy_number: string
  
    effective_date: string | null
    expiration_date: string
  
    certificate_path: string | null
  
    status: InsuranceStatus
    notes: string | null
  
    verified_by_user_id: string | null
    verified_at: string | null
  
    created_at: string
    updated_at: string
  
    team: {
      id: string
      name: string
      age_group: string | null
      city: string | null
      state: string | null
      organization_id: string
  
      organization: {
        id: string
        name: string
      } | null
    } | null
  }
  
  export function PlatformInsuranceReviewPage() {
    const [
      rows,
      setRows,
    ] = useState<InsuranceRow[]>([])
  
    const [
      loading,
      setLoading,
    ] = useState(true)
  
    const [
      error,
      setError,
    ] = useState("")
  
    const [
      statusFilter,
      setStatusFilter,
    ] = useState("pending")
  
    const [
      reviewingId,
      setReviewingId,
    ] = useState<string | null>(null)
  
    const [
      reviewNotes,
      setReviewNotes,
    ] = useState("")
  
    const [
      saving,
      setSaving,
    ] = useState(false)
  
    useEffect(() => {
      void loadInsurance()
    }, [])
  
    async function loadInsurance() {
      setLoading(true)
      setError("")
  
      const {
        data,
        error: loadError,
      } = await supabase
        .from("team_insurance")
        .select(`
          id,
          team_id,
          provider,
          policy_number,
          effective_date,
          expiration_date,
          certificate_path,
          status,
          notes,
          verified_by_user_id,
          verified_at,
          created_at,
          updated_at,
  
          team:teams (
            id,
            name,
            age_group,
            city,
            state,
            organization_id,
  
            organization:organizations (
              id,
              name
            )
          )
        `)
        .order(
          "created_at",
          {
            ascending: false,
          }
        )
  
      if (loadError) {
        console.error(
          "INSURANCE REVIEW LOAD ERROR:",
          loadError
        )
  
        setError(
          loadError.message
        )
  
        setLoading(false)
        return
      }
  
      setRows(
        (data ?? []) as unknown as InsuranceRow[]
      )
  
      setLoading(false)
    }
  
    const filteredRows = useMemo(
      () => {
        if (
          statusFilter ===
          "all"
        ) {
          return rows
        }
  
        return rows.filter(
          (row) =>
            row.status ===
            statusFilter
        )
      },
      [
        rows,
        statusFilter,
      ]
    )
  
    async function openCertificate(
      row: InsuranceRow
    ) {
      if (
        !row.certificate_path
      ) {
        setError(
          "No insurance certificate is on file."
        )
        return
      }
  
      setError("")
  
      const {
        data,
        error:
          signedUrlError,
      } = await supabase.storage
        .from(
          "team-insurance"
        )
        .createSignedUrl(
          row.certificate_path,
          120
        )
  
      if (
        signedUrlError ||
        !data?.signedUrl
      ) {
        setError(
          signedUrlError?.message ??
            "Certificate could not be opened."
        )
  
        return
      }
  
      window.open(
        data.signedUrl,
        "_blank",
        "noopener,noreferrer"
      )
    }
  
    async function reviewInsurance(
      row: InsuranceRow,
      newStatus:
        | "verified"
        | "needs_review"
        | "rejected"
    ) {
      setSaving(true)
      setError("")
  
      const {
        data,
        error:
          reviewError,
      } = await supabase.rpc(
        "verify_team_insurance",
        {
          target_team_insurance_id:
            row.id,
  
          new_status:
            newStatus,
  
          review_notes:
            reviewNotes.trim() ||
            null,
        }
      )
  
      if (reviewError) {
        console.error(
          "INSURANCE REVIEW ERROR:",
          reviewError
        )
  
        setError(
          reviewError.message
        )
  
        setSaving(false)
        return
      }
  
      const updated =
        Array.isArray(data)
          ? data[0]
          : data
  
      if (updated) {
        setRows(
          (current) =>
            current.map(
              (item) =>
                item.id ===
                row.id
                  ? {
                      ...item,
                      status:
                        updated.status,
                      notes:
                        updated.notes,
                      verified_by_user_id:
                        updated.verified_by_user_id,
                      verified_at:
                        updated.verified_at,
                      updated_at:
                        updated.updated_at,
                    }
                  : item
            )
        )
      }
  
      setReviewingId(
        null
      )
  
      setReviewNotes("")
  
      setSaving(false)
    }
  
    function beginReview(
      row: InsuranceRow
    ) {
      setReviewingId(
        row.id
      )
  
      setReviewNotes(
        row.notes ?? ""
      )
  
      setError("")
    }
  
    if (loading) {
      return (
        <main className="min-h-screen bg-scoreboard-dark px-6 py-12 text-scoreboard-cream">
          <div className="mx-auto max-w-7xl">
            <p className="scoreboard-label">
              Loading Insurance Reviews...
            </p>
          </div>
        </main>
      )
    }
  
    return (
      <main className="min-h-screen bg-scoreboard-dark text-scoreboard-cream">
  
        <section className="border-b border-scoreboard-cream/20 bg-scoreboard-green">
  
          <div className="mx-auto max-w-7xl px-6 py-10">
  
            <p className="scoreboard-label text-scoreboard-amber">
              Platform Administration
            </p>
  
            <div className="mt-3 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
  
              <div>
  
                <h1 className="text-3xl font-black uppercase tracking-[0.05em] sm:text-4xl">
                  Insurance Review
                </h1>
  
                <p className="mt-3 max-w-2xl text-sm leading-6 text-scoreboard-muted">
                  Review team insurance policies and supporting certificates before tournament approval.
                </p>
  
              </div>
  
              <Button
                type="button"
                variant="outline"
                onClick={() =>
                  void loadInsurance()
                }
                className="
                  rounded-none
                  border-scoreboard-cream/40
                  bg-transparent
                  font-black
                  uppercase
                  tracking-[0.10em]
                  text-scoreboard-cream
                "
              >
                <RefreshCw className="mr-2 h-4 w-4" />
  
                Refresh
              </Button>
  
            </div>
  
          </div>
  
        </section>
  
        <section className="mx-auto max-w-7xl px-6 py-8">
  
          <div className="mb-6 flex flex-wrap gap-2">
  
            {[
              "pending",
              "needs_review",
              "verified",
              "rejected",
              "expired",
              "all",
            ].map(
              (status) => (
                <button
                  key={status}
                  type="button"
                  onClick={() =>
                    setStatusFilter(
                      status
                    )
                  }
                  className={`
                    border
                    px-3
                    py-2
                    text-[10px]
                    font-black
                    uppercase
                    tracking-[0.10em]
                    ${
                      statusFilter ===
                      status
                        ? "border-scoreboard-amber bg-scoreboard-amber text-scoreboard-dark"
                        : "border-scoreboard-cream/30 text-scoreboard-cream hover:border-scoreboard-amber hover:text-scoreboard-amber"
                    }
                  `}
                >
                  {status.replaceAll(
                    "_",
                    " "
                  )}
                </button>
              )
            )}
  
          </div>
  
          {error && (
            <div className="mb-6 border border-scoreboard-red/60 bg-scoreboard-green p-4">
              <p className="text-sm text-scoreboard-muted">
                {error}
              </p>
            </div>
          )}
  
          {filteredRows.length ===
          0 ? (
            <div className="border border-scoreboard-cream/25 bg-scoreboard-green p-8 text-center">
  
              <ShieldCheck className="mx-auto h-8 w-8 text-scoreboard-amber" />
  
              <h2 className="mt-4 text-xl font-black uppercase">
                No Insurance Records
              </h2>
  
              <p className="mt-2 text-sm text-scoreboard-muted">
                No records match this review status.
              </p>
  
            </div>
          ) : (
            <div className="space-y-5">
  
              {filteredRows.map(
                (row) => {
                  const expired =
                    new Date(
                      `${row.expiration_date}T12:00:00`
                    ).getTime() <
                    Date.now()
  
                  return (
                    <div
                      key={row.id}
                      className="border border-scoreboard-cream/25 bg-scoreboard-green"
                    >
  
                      <div className="border-b border-scoreboard-cream/20 p-5">
  
                        <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
  
                          <div>
  
                            <p className="scoreboard-label text-scoreboard-amber">
                              {row.team?.organization?.name ??
                                "Organization"}
                            </p>
  
                            <h2 className="mt-2 text-2xl font-black uppercase tracking-[0.05em]">
                              {row.team?.name ??
                                "Team"}
                            </h2>
  
                            <p className="mt-2 text-sm text-scoreboard-muted">
                              {[
                                row.team?.age_group,
                                [
                                  row.team?.city,
                                  row.team?.state,
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
  
                          <InsuranceStatusBadge
                            status={
                              expired
                                ? "expired"
                                : row.status
                            }
                          />
  
                        </div>
  
                      </div>
  
                      <div className="grid gap-0 lg:grid-cols-[1fr_340px]">
  
                        <div className="p-5">
  
                          <dl className="divide-y divide-scoreboard-cream/15">
  
                            <ReviewRow
                              label="Provider"
                              value={
                                row.provider
                              }
                            />
  
                            <ReviewRow
                              label="Policy Number"
                              value={
                                row.policy_number
                              }
                            />
  
                            <ReviewRow
                              label="Effective"
                              value={
                                row.effective_date
                                  ? new Date(
                                      `${row.effective_date}T12:00:00`
                                    ).toLocaleDateString()
                                  : "—"
                              }
                            />
  
                            <ReviewRow
                              label="Expiration"
                              value={
                                new Date(
                                  `${row.expiration_date}T12:00:00`
                                ).toLocaleDateString()
                              }
                            />
  
                            <ReviewRow
                              label="Submitted"
                              value={
                                new Date(
                                  row.created_at
                                ).toLocaleString()
                              }
                            />
  
                            {row.verified_at && (
                              <ReviewRow
                                label="Reviewed"
                                value={
                                  new Date(
                                    row.verified_at
                                  ).toLocaleString()
                                }
                              />
                            )}
  
                          </dl>
  
                          {row.notes && (
                            <div className="mt-5 border border-scoreboard-cream/20 bg-scoreboard-dark p-4">
  
                              <p className="scoreboard-label text-scoreboard-amber">
                                Notes
                              </p>
  
                              <p className="mt-2 text-sm leading-6 text-scoreboard-muted">
                                {row.notes}
                              </p>
  
                            </div>
                          )}
  
                        </div>
  
                        <div className="border-t border-scoreboard-cream/20 p-5 lg:border-l lg:border-t-0">
  
                          <p className="scoreboard-label text-scoreboard-amber">
                            Review
                          </p>
  
                          {row.certificate_path ? (
                            <button
                              type="button"
                              onClick={() =>
                                void openCertificate(
                                  row
                                )
                              }
                              className="
                                mt-4
                                flex
                                w-full
                                items-center
                                justify-center
                                gap-2
                                border
                                border-scoreboard-amber
                                bg-scoreboard-dark
                                px-4
                                py-3
                                text-xs
                                font-black
                                uppercase
                                tracking-[0.10em]
                                text-scoreboard-amber
                                hover:bg-scoreboard-amber
                                hover:text-scoreboard-dark
                              "
                            >
                              <FileText className="h-4 w-4" />
  
                              View Certificate
                            </button>
                          ) : (
                            <div className="mt-4 border border-scoreboard-red/50 bg-scoreboard-dark p-4">
  
                              <p className="text-sm text-scoreboard-muted">
                                No certificate uploaded.
                              </p>
  
                            </div>
                          )}
  
                          {reviewingId ===
                          row.id ? (
                            <div className="mt-5">
  
                              <label className="block">
  
                                <span className="scoreboard-label">
                                  Review Notes
                                </span>
  
                                <textarea
                                  value={
                                    reviewNotes
                                  }
                                  onChange={(
                                    event
                                  ) =>
                                    setReviewNotes(
                                      event.target.value
                                    )
                                  }
                                  rows={4}
                                  className="
                                    mt-2
                                    w-full
                                    border
                                    border-scoreboard-cream/30
                                    bg-scoreboard-cream
                                    px-3
                                    py-3
                                    text-scoreboard-dark
                                  "
                                />
  
                              </label>
  
                              <div className="mt-4 space-y-2">
  
                                <Button
                                  type="button"
                                  disabled={
                                    saving ||
                                    expired
                                  }
                                  onClick={() =>
                                    void reviewInsurance(
                                      row,
                                      "verified"
                                    )
                                  }
                                  className="
                                    w-full
                                    rounded-none
                                    bg-scoreboard-amber
                                    font-black
                                    uppercase
                                    tracking-[0.10em]
                                    text-scoreboard-dark
                                  "
                                >
                                  <CheckCircle2 className="mr-2 h-4 w-4" />
  
                                  Verify
                                </Button>
  
                                <Button
                                  type="button"
                                  disabled={
                                    saving
                                  }
                                  variant="outline"
                                  onClick={() =>
                                    void reviewInsurance(
                                      row,
                                      "needs_review"
                                    )
                                  }
                                  className="
                                    w-full
                                    rounded-none
                                    border-scoreboard-cream/40
                                    bg-transparent
                                    font-black
                                    uppercase
                                    tracking-[0.10em]
                                    text-scoreboard-cream
                                  "
                                >
                                  <ShieldAlert className="mr-2 h-4 w-4" />
  
                                  Needs Review
                                </Button>
  
                                <Button
                                  type="button"
                                  disabled={
                                    saving
                                  }
                                  variant="outline"
                                  onClick={() =>
                                    void reviewInsurance(
                                      row,
                                      "rejected"
                                    )
                                  }
                                  className="
                                    w-full
                                    rounded-none
                                    border-scoreboard-red/60
                                    bg-transparent
                                    font-black
                                    uppercase
                                    tracking-[0.10em]
                                    text-scoreboard-red
                                  "
                                >
                                  <XCircle className="mr-2 h-4 w-4" />
  
                                  Reject
                                </Button>
  
                                <button
                                  type="button"
                                  onClick={() => {
                                    setReviewingId(
                                      null
                                    )
  
                                    setReviewNotes(
                                      ""
                                    )
                                  }}
                                  className="
                                    w-full
                                    py-2
                                    text-[10px]
                                    font-black
                                    uppercase
                                    tracking-[0.10em]
                                    text-scoreboard-muted
                                    hover:text-scoreboard-cream
                                  "
                                >
                                  Cancel
                                </button>
  
                              </div>
  
                            </div>
                          ) : (
                            <Button
                              type="button"
                              onClick={() =>
                                beginReview(
                                  row
                                )
                              }
                              className="
                                mt-4
                                w-full
                                rounded-none
                                bg-scoreboard-cream
                                font-black
                                uppercase
                                tracking-[0.10em]
                                text-scoreboard-dark
                                hover:bg-scoreboard-amber
                              "
                            >
                              Review Insurance
                            </Button>
                          )}
  
                        </div>
  
                      </div>
  
                    </div>
                  )
                }
              )}
  
            </div>
          )}
  
        </section>
  
      </main>
    )
  }
  
  function ReviewRow({
    label,
    value,
  }: {
    label: string
    value: string
  }) {
    return (
      <div className="grid gap-1 py-4 sm:grid-cols-[180px_1fr]">
  
        <dt className="scoreboard-label">
          {label}
        </dt>
  
        <dd className="text-sm font-bold sm:text-right">
          {value || "—"}
        </dd>
  
      </div>
    )
  }
  
  function InsuranceStatusBadge({
    status,
  }: {
    status: InsuranceStatus
  }) {
    const classes =
      status === "verified"
        ? "border-scoreboard-amber text-scoreboard-amber"
        : status === "rejected" ||
            status === "expired"
          ? "border-scoreboard-red/70 text-scoreboard-red"
          : "border-scoreboard-cream/40 text-scoreboard-cream"
  
    return (
      <span
        className={`
          inline-flex
          border
          bg-scoreboard-dark
          px-3
          py-2
          text-[10px]
          font-black
          uppercase
          tracking-[0.12em]
          ${classes}
        `}
      >
        {status.replaceAll(
          "_",
          " "
        )}
      </span>
    )
  }