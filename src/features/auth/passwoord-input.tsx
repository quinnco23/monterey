import { useState } from "react"
import { Eye, EyeOff } from "lucide-react"

type PasswordInputProps = {
  value: string
  onChange: (value: string) => void
  label?: string
  showRequirements?: boolean
}

export function PasswordInput({
  value,
  onChange,
  label = "Password",
  showRequirements = true,
}: PasswordInputProps) {
  const [showPassword, setShowPassword] = useState(false)

  const requirements = {
    length: value.length >= 10,
    upper: /[A-Z]/.test(value),
    lower: /[a-z]/.test(value),
    number: /\d/.test(value),
    symbol: /[^A-Za-z0-9]/.test(value),
  }

  return (
    <div>
      <label className="block">
        <span className="scoreboard-label text-scoreboard-cream">
          {label}
        </span>

        <div className="relative mt-2">
          <input
            type={showPassword ? "text" : "password"}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            autoComplete="new-password"
            className="
              w-full
              rounded-none
              border
              border-scoreboard-cream/30
              bg-scoreboard-cream
              px-3
              py-3
              pr-12
              text-base
              text-scoreboard-dark
            "
          />

          <button
            type="button"
            onClick={() =>
              setShowPassword((current) => !current)
            }
            aria-label={
              showPassword
                ? "Hide password"
                : "Show password"
            }
            className="
              absolute
              right-0
              top-0
              flex
              h-full
              w-12
              items-center
              justify-center
              text-scoreboard-dark/60
            "
          >
            {showPassword ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </button>
        </div>
      </label>

      {showRequirements && (
        <div className="mt-3 grid gap-1 text-xs">
          <Requirement
            passed={requirements.length}
            label="10 or more characters"
          />

          <Requirement
            passed={requirements.upper}
            label="Uppercase letter"
          />

          <Requirement
            passed={requirements.lower}
            label="Lowercase letter"
          />

          <Requirement
            passed={requirements.number}
            label="Number"
          />

          <Requirement
            passed={requirements.symbol}
            label="Special character"
          />
        </div>
      )}
    </div>
  )
}

function Requirement({
  passed,
  label,
}: {
  passed: boolean
  label: string
}) {
  return (
    <div
      className={
        passed
          ? "text-scoreboard-amber"
          : "text-scoreboard-muted"
      }
    >
      {passed ? "✓" : "○"} {label}
    </div>
  )
}