import {
    ChangeEvent,
    FormEvent,
    useEffect,
    useState,
  } from "react"
  
  import {
    CheckCircle2,
    FileText,
    ShieldCheck,
    Upload,
  } from "lucide-react"
  
  import {
    Link,
    useParams,
  } from "react-router-dom"
  
  import { Button } from "@/components/ui/button"
  import { supabase } from "@/lib/supabase"
  
  type Team = {
    id: string
    organization_id: string
    name: string
    age_group: string | null
    city: string | null
    state: string | null
  }
  
  type TeamInsurance = {
    id: string
    team_id: string
  
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
  
    notes: string | null
  
    verified_at: string | null
  
    created_at: string
    updated_at: string
  }
  
  export function TeamInsurancePage() {
    const {
      organizationId,
      teamId,
    } = useParams()
  
    const [
      team,
      setTeam,
    ] = useState<Team | null>(null)
  
    const [
      insurance,
      setInsurance,
    ] = useState<TeamInsurance | null>(
      null
    )
  
    const [
      provider,
      setProvider,
    ] = useState("")
  
    const [
      policyNumber,
      setPolicyNumber,
    ] = useState("")
  
    const [
      effectiveDate,
      setEffectiveDate,
    ] = useState("")
  
    const [
      expirationDate,
      setExpirationDate,
    ] = useState("")
  
    const [
      notes,
      setNotes,
    ] = useState("")
  
    const [
      certificatePath,
      setCertificatePath,
    ] = useState<string | null>(null)
  
    const [
      certificateFile,
      setCertificateFile,
    ] = useState<File | null>(null)
  
    const [
      loading,
      setLoading,
    ] = useState(true)
  
    const [
      saving,
      setSaving,
    ] = useState(false)
  
    const [
      uploading,
      setUploading,
    ] = useState(false)
  
    const [
      error,
      setError,
    ] = useState("")
  
    const [
      success,
      setSuccess,
    ] = useState("")
  
    useEffect(() => {
      void loadPage()
    }, [
      teamId,
      organizationId,
    ])
  
    async function loadPage() {
      if (
        !teamId ||
        !organizationId
      ) {
        setError(
          "Team could not be identified."
        )
  
        setLoading(false)
        return
      }
  
      setLoading(true)
      setError("")
      setSuccess("")
  
      const [
        teamResult,
        insuranceResult,
      ] = await Promise.all([
        supabase
        .from("teams")
        .select(`
          id,
          organization_id,
          name,
          age_group,
          city,
          state
        `)
        .eq("id", teamId)
        .single(),
  
        supabase
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
            verified_at,
            created_at,
            updated_at
          `)
          .eq(
            "team_id",
            teamId
          )
          .maybeSingle(),
      ])
  
      if (
        teamResult.error ||
        !teamResult.data
      ) {
        console.error(
          "TEAM INSURANCE TEAM LOAD ERROR:",
          {
            organizationId,
            teamId,
            error: teamResult.error,
            data: teamResult.data,
          }
        )
      
        setError(
          teamResult.error?.message ??
            "Team could not be loaded."
        )
      
        setLoading(false)
        return
      }
  
      if (insuranceResult.error) {
        setError(
          insuranceResult.error.message
        )
  
        setLoading(false)
        return
      }
  
      const loadedTeam =
        teamResult.data as Team
  
      const loadedInsurance =
        insuranceResult.data as
          | TeamInsurance
          | null
  
      setTeam(
        loadedTeam
      )
  
      setInsurance(
        loadedInsurance
      )
  
      if (loadedInsurance) {
        setProvider(
          loadedInsurance.provider ?? ""
        )
  
        setPolicyNumber(
          loadedInsurance.policy_number ??
            ""
        )
  
        setEffectiveDate(
          loadedInsurance.effective_date ??
            ""
        )
  
        setExpirationDate(
          loadedInsurance.expiration_date ??
            ""
        )
  
        setNotes(
          loadedInsurance.notes ?? ""
        )
  
        setCertificatePath(
          loadedInsurance.certificate_path
        )
      }
  
      setLoading(false)
    }
  
    function handleFileChange(
      event: ChangeEvent<HTMLInputElement>
    ) {
      const file =
        event.target.files?.[0] ??
        null
  
      setCertificateFile(
        file
      )
  
      setSuccess("")
      setError("")
    }
  
    async function uploadCertificate() {
      if (
        !teamId ||
        !certificateFile
      ) {
        return certificatePath
      }
  
      setUploading(true)
      setError("")
  
      try {
        const originalName =
          certificateFile.name
  
        const extension =
          originalName.includes(".")
            ? originalName
                .split(".")
                .pop()
                ?.toLowerCase()
            : null
  
        const safeExtension =
          extension || "pdf"
  
        const objectName =
          `${crypto.randomUUID()}-certificate.${safeExtension}`
  
        /*
         * IMPORTANT:
         * First folder segment MUST be teamId.
         *
         * Storage RLS checks this.
         */
        const objectPath =
          `${teamId}/${objectName}`
  
        const {
          error: uploadError,
        } = await supabase.storage
          .from("team-insurance")
          .upload(
            objectPath,
            certificateFile,
            {
              upsert: false,
              contentType:
                certificateFile.type ||
                undefined,
            }
          )
  
        if (uploadError) {
          throw uploadError
        }
  
        setCertificatePath(
          objectPath
        )
  
        return objectPath
      } finally {
        setUploading(false)
      }
    }
  
    async function handleSubmit(
      event: FormEvent<HTMLFormElement>
    ) {
      event.preventDefault()
  
      if (!teamId) {
        setError(
          "Team could not be identified."
        )
        return
      }
  
      if (!provider.trim()) {
        setError(
          "Insurance provider is required."
        )
        return
      }
  
      if (!policyNumber.trim()) {
        setError(
          "Policy number is required."
        )
        return
      }
  
      if (!expirationDate) {
        setError(
          "Expiration date is required."
        )
        return
      }
  
      setSaving(true)
      setError("")
      setSuccess("")
  
      try {
        let nextCertificatePath =
          certificatePath
  
        /*
         * Upload a new certificate first
         * if the user selected one.
         */
        if (certificateFile) {
          nextCertificatePath =
            await uploadCertificate()
        }
  
        const {
          data,
          error: saveError,
        } = await supabase.rpc(
          "save_team_insurance",
          {
            target_team_id:
              teamId,
  
            new_provider:
              provider.trim(),
  
            new_policy_number:
              policyNumber.trim(),
  
            new_effective_date:
              effectiveDate ||
              null,
  
            new_expiration_date:
              expirationDate,
  
            new_certificate_path:
              nextCertificatePath,
  
            new_notes:
              notes.trim() ||
              null,
          }
        )
  
        if (saveError) {
          throw saveError
        }
  
        const savedInsurance =
          data as TeamInsurance
  
        setInsurance(
          savedInsurance
        )
  
        setCertificatePath(
          savedInsurance.certificate_path
        )
  
        setCertificateFile(
          null
        )
  
        setSuccess(
          "Insurance information saved and submitted for review."
        )
      } catch (saveError) {
        console.error(
          "TEAM INSURANCE SAVE ERROR:",
          saveError
        )
  
        setError(
          saveError instanceof Error
            ? saveError.message
            : "Insurance could not be saved."
        )
      } finally {
        setSaving(false)
      }
    }
  
    async function openCertificate() {
      if (!certificatePath) {
        return
      }
  
      setError("")
  
      const {
        data,
        error: signedUrlError,
      } = await supabase.storage
        .from("team-insurance")
        .createSignedUrl(
          certificatePath,
          60
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
  
    if (loading) {
      return (
        <main className="min-h-screen bg-scoreboard-dark px-4 py-12 text-scoreboard-cream">
          <div className="mx-auto max-w-4xl">
            <p className="scoreboard-label">
              Loading Insurance...
            </p>
          </div>
        </main>
      )
    }
  
    if (!team) {
      return (
        <main className="min-h-screen bg-scoreboard-dark px-4 py-12 text-scoreboard-cream">
          <div className="mx-auto max-w-4xl">
            <p className="scoreboard-label text-scoreboard-amber">
              Team Not Found
            </p>
          </div>
        </main>
      )
    }
  
    return (
      <main className="min-h-screen bg-scoreboard-dark text-scoreboard-cream">
  
        <section className="border-b border-scoreboard-cream/20 bg-scoreboard-green">
  
          <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
  
            <Link
              to={`/dashboard/organizations/${organizationId}/teams/${teamId}`}
              className="
                text-xs
                font-black
                uppercase
                tracking-[0.10em]
                text-scoreboard-muted
                hover:text-scoreboard-amber
              "
            >
              ← Team Dashboard
            </Link>
  
            <p className="scoreboard-label mt-8 text-scoreboard-amber">
              Team Insurance
            </p>
  
            <h1 className="mt-3 text-3xl font-black uppercase tracking-[0.05em]">
              {team.name}
            </h1>
  
            <p className="mt-3 text-sm text-scoreboard-muted">
              {[
                team.age_group,
                [team.city, team.state]
                  .filter(Boolean)
                  .join(", "),
              ]
                .filter(Boolean)
                .join(" • ")}
            </p>
  
          </div>
  
        </section>
  
        <section className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
  
          {insurance && (
            <div className="mb-6 border border-scoreboard-cream/20 bg-scoreboard-green p-5">
  
              <div className="flex items-start gap-3">
  
                <ShieldCheck className="mt-1 h-6 w-6 shrink-0 text-scoreboard-amber" />
  
                <div>
  
                  <p className="scoreboard-label text-scoreboard-amber">
                    Insurance Status
                  </p>
  
                  <h2 className="mt-2 text-xl font-black uppercase tracking-[0.05em]">
                    {insurance.status.replaceAll(
                      "_",
                      " "
                    )}
                  </h2>
  
                  {insurance.status ===
                    "verified" && (
                    <p className="mt-2 text-sm text-scoreboard-muted">
                      Insurance has been verified by the tournament platform.
                    </p>
                  )}
  
                  {insurance.status ===
                    "pending" && (
                    <p className="mt-2 text-sm text-scoreboard-muted">
                      Insurance is waiting for platform review.
                    </p>
                  )}
  
                  {insurance.status ===
                    "needs_review" && (
                    <p className="mt-2 text-sm text-scoreboard-muted">
                      Additional information may be required.
                    </p>
                  )}
  
                  {insurance.status ===
                    "rejected" && (
                    <p className="mt-2 text-sm text-scoreboard-muted">
                      This insurance record was not approved.
                    </p>
                  )}
  
                </div>
  
              </div>
  
            </div>
          )}
  
          <form
            onSubmit={handleSubmit}
            className="border border-scoreboard-cream/25 bg-scoreboard-green p-6"
          >
  
            <div className="border-b border-scoreboard-cream/20 pb-5">
  
              <p className="scoreboard-label text-scoreboard-amber">
                Policy Information
              </p>
  
              <h2 className="mt-2 text-2xl font-black uppercase tracking-[0.05em]">
                Insurance Coverage
              </h2>
  
              <p className="mt-3 text-sm leading-6 text-scoreboard-muted">
                Enter your current team insurance policy and upload proof of coverage.
              </p>
  
            </div>
  
            <div className="mt-6 grid gap-5 sm:grid-cols-2">
  
              <label className="block">
  
                <span className="scoreboard-label">
                  Provider
                </span>
  
                <input
                  value={provider}
                  onChange={(event) =>
                    setProvider(
                      event.target.value
                    )
                  }
                  placeholder="Insurance provider"
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
  
              <label className="block">
  
                <span className="scoreboard-label">
                  Policy Number
                </span>
  
                <input
                  value={policyNumber}
                  onChange={(event) =>
                    setPolicyNumber(
                      event.target.value
                    )
                  }
                  placeholder="Policy number"
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
  
              <label className="block">
  
                <span className="scoreboard-label">
                  Effective Date
                </span>
  
                <input
                  type="date"
                  value={effectiveDate}
                  onChange={(event) =>
                    setEffectiveDate(
                      event.target.value
                    )
                  }
                  className="
                    mt-2
                    w-full
                    border
                    border-scoreboard-cream/30
                    bg-scoreboard-cream
                    px-3
                    py-3
                    text-scoreboard-dark
                    [color-scheme:light]
                  "
                />
  
              </label>
  
              <label className="block">
  
                <span className="scoreboard-label">
                  Expiration Date
                </span>
  
                <input
                  type="date"
                  value={expirationDate}
                  onChange={(event) =>
                    setExpirationDate(
                      event.target.value
                    )
                  }
                  required
                  className="
                    mt-2
                    w-full
                    border
                    border-scoreboard-cream/30
                    bg-scoreboard-cream
                    px-3
                    py-3
                    text-scoreboard-dark
                    [color-scheme:light]
                  "
                />
  
              </label>
  
            </div>
  
            <div className="mt-6 border border-scoreboard-cream/20 bg-scoreboard-dark p-5">
  
              <div className="flex items-center gap-3">
  
                <Upload className="h-5 w-5 text-scoreboard-amber" />
  
                <p className="scoreboard-label text-scoreboard-amber">
                  Certificate Of Insurance
                </p>
  
              </div>
  
              <input
                type="file"
                accept="
                  application/pdf,
                  image/jpeg,
                  image/png
                "
                onChange={
                  handleFileChange
                }
                className="
                  mt-5
                  block
                  w-full
                  text-sm
                  text-scoreboard-muted
                "
              />
  
              {certificateFile && (
                <p className="mt-3 text-sm text-scoreboard-muted">
                  Selected:{" "}
                  {certificateFile.name}
                </p>
              )}
  
              {certificatePath && (
                <div className="mt-4 flex items-center justify-between gap-4 border-t border-scoreboard-cream/15 pt-4">
  
                  <div className="flex items-center gap-2">
  
                    <FileText className="h-4 w-4 text-scoreboard-amber" />
  
                    <span className="text-sm text-scoreboard-muted">
                      Certificate on file
                    </span>
  
                  </div>
  
                  <button
                    type="button"
                    onClick={() =>
                      void openCertificate()
                    }
                    className="
                      text-xs
                      font-black
                      uppercase
                      tracking-[0.08em]
                      text-scoreboard-amber
                      hover:text-scoreboard-cream
                    "
                  >
                    View
                  </button>
  
                </div>
              )}
  
            </div>
  
            <label className="mt-6 block">
  
              <span className="scoreboard-label">
                Notes
              </span>
  
              <textarea
                value={notes}
                onChange={(event) =>
                  setNotes(
                    event.target.value
                  )
                }
                rows={4}
                placeholder="Optional insurance notes..."
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
  
            {error && (
              <div className="mt-6 border border-scoreboard-red/60 bg-scoreboard-dark p-4">
                <p className="text-sm text-scoreboard-muted">
                  {error}
                </p>
              </div>
            )}
  
            {success && (
              <div className="mt-6 border border-scoreboard-amber/40 bg-scoreboard-dark p-4">
  
                <div className="flex items-center gap-3">
  
                  <CheckCircle2 className="h-5 w-5 text-scoreboard-amber" />
  
                  <p className="text-sm text-scoreboard-muted">
                    {success}
                  </p>
  
                </div>
  
              </div>
            )}
  
            <Button
              type="submit"
              disabled={
                saving ||
                uploading
              }
              className="
                mt-7
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
              {uploading
                ? "Uploading Certificate..."
                : saving
                ? "Saving Insurance..."
                : insurance
                ? "Update Insurance"
                : "Submit Insurance"}
            </Button>
  
          </form>
  
        </section>
  
      </main>
    )
  }