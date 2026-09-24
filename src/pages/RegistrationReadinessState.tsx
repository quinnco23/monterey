type RegistrationReadinessStateProps = {
    state: "ready" | "blocked" | "waitlisted"
    blockers?: string[]
  }
  
  export default function RegistrationReadinessState({
    state,
    blockers = [],
  }: RegistrationReadinessStateProps) {
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
            This registration does not currently meet all approval
            requirements.
          </div>
        )}
      </div>
    )
  }