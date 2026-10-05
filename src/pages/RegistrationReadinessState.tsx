export type ReadinessState =
  | "approved"
  | "ready"
  | "blocked"
  | "waitlisted"
  | "declined"
  | "withdrawn"

type RegistrationReadinessStateProps = {
  state: ReadinessState
  blockers?: string[]
}

export default function RegistrationReadinessState({
  state,
  blockers = [],
}: RegistrationReadinessStateProps) {
  if (state === "approved") {
    return (
      <div className="border border-green-500/40 bg-green-500/10 p-4">
        <div className="flex items-center gap-2">
          <span className="text-lg">✓</span>

          <div>
            <div className="font-black uppercase tracking-wide text-green-400">
              Registration Approved
            </div>

            <div className="mt-1 text-sm text-green-200/70">
              This team has been approved for the tournament.
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (state === "ready") {
    return (
      <div className="border border-green-500/40 bg-green-500/10 p-4">
        <div className="flex items-center gap-2">
          <span className="text-lg">✓</span>

          <div>
            <div className="font-black uppercase tracking-wide text-green-400">
              Ready To Approve
            </div>

            <div className="mt-1 text-sm text-green-200/70">
              All tournament registration requirements are satisfied.
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (state === "waitlisted") {
    return (
      <div className="border border-amber-500/40 bg-amber-500/10 p-4">
        <div className="flex items-center gap-2">
          <span className="text-lg">◷</span>

          <div>
            <div className="font-black uppercase tracking-wide text-amber-400">
              Waitlisted
            </div>

            <div className="mt-1 text-sm text-amber-200/70">
              This team is currently on the tournament waitlist.
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (state === "declined") {
    return (
      <div className="border border-red-500/40 bg-red-500/10 p-4">
        <div className="flex items-center gap-2">
          <span className="text-lg">✕</span>

          <div>
            <div className="font-black uppercase tracking-wide text-red-400">
              Registration Declined
            </div>

            <div className="mt-1 text-sm text-red-200/70">
              This registration has been declined.
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (state === "withdrawn") {
    return (
      <div className="border border-scoreboard-cream/30 bg-scoreboard-dark/30 p-4">
        <div className="flex items-center gap-2">
          <span className="text-lg">—</span>

          <div>
            <div className="font-black uppercase tracking-wide text-scoreboard-muted">
              Registration Withdrawn
            </div>

            <div className="mt-1 text-sm text-scoreboard-muted">
              This team has withdrawn its tournament registration.
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="border border-red-500/40 bg-red-500/10 p-4">
      <div className="font-black uppercase tracking-wide text-red-400">
        Approval Blocked
      </div>

      {blockers.length > 0 ? (
        <ul className="mt-2 space-y-1 text-sm text-red-200/80">
          {blockers.map((blocker) => (
            <li key={blocker}>
              • {blocker}
            </li>
          ))}
        </ul>
      ) : (
        <div className="mt-1 text-sm text-red-200/70">
          This registration does not currently meet all approval requirements.
        </div>
      )}
    </div>
  )
}