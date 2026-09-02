import { FormEvent, useState } from "react"
import { CheckCircle2, KeyRound } from "lucide-react"
import { Link, useNavigate } from "react-router-dom"

import { Button } from "@/components/ui/button"
import { PasswordInput } from "@/features/auth/passwoord-input"
import { isStrongPassword } from "@/features/auth/password-utils"
import { supabase } from "@/lib/supabase"

export function UpdatePasswordPage() {
  const navigate = useNavigate()

  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")

  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState("")

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault()

    setError("")

    if (!isStrongPassword(password)) {
      setError(
        "Password must be at least 10 characters and include an uppercase letter, lowercase letter, number, and special character."
      )
      return
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.")
      return
    }

    setSaving(true)

    const { error } = await supabase.auth.updateUser({
      password,
    })

    setSaving(false)

    if (error) {
      setError(error.message)
      return
    }

    setSuccess(true)
  }

  if (success) {
    return (
      <main className="flex min-h-[calc(100vh-73px)] items-center bg-scoreboard-dark px-4 py-12 text-scoreboard-cream sm:px-6">

        <div className="mx-auto w-full max-w-md">

          <div className="scoreboard-panel p-4">

            <div className="border border-scoreboard-cream/35 bg-scoreboard-green p-6 sm:p-8">

              <CheckCircle2 className="h-8 w-8 text-scoreboard-amber" />

              <p className="scoreboard-label mt-5 text-scoreboard-amber">
                Password Updated
              </p>

              <h1 className="mt-3 text-3xl font-black uppercase leading-tight tracking-[0.05em]">
                You&apos;re All Set
              </h1>

              <p className="mt-4 text-sm leading-7 text-scoreboard-muted">
                Your password has been updated successfully.
                You can now continue to your account.
              </p>

              <Button
                type="button"
                onClick={() =>
                  navigate("/dashboard", {
                    replace: true,
                  })
                }
                className="
                  mt-7
                  w-full
                  rounded-none
                  border
                  border-scoreboard-cream
                  bg-scoreboard-cream
                  py-5
                  font-black
                  uppercase
                  tracking-[0.12em]
                  text-scoreboard-dark
                  hover:bg-scoreboard-amber
                "
              >
                Continue To Dashboard
              </Button>

            </div>

          </div>

        </div>

      </main>
    )
  }

  return (
    <main className="flex min-h-[calc(100vh-73px)] items-center bg-scoreboard-dark px-4 py-12 text-scoreboard-cream sm:px-6">

      <div className="mx-auto w-full max-w-md">

        <div className="scoreboard-panel p-4">

          <form
            onSubmit={handleSubmit}
            className="border border-scoreboard-cream/35 bg-scoreboard-green p-6 sm:p-8"
          >

            <div className="border-b border-scoreboard-cream/25 pb-5">

              <KeyRound className="h-7 w-7 text-scoreboard-amber" />

              <p className="scoreboard-label mt-5 text-scoreboard-amber">
                Account Security
              </p>

              <h1 className="mt-3 text-3xl font-black uppercase leading-tight tracking-[0.05em]">
                Choose New Password
              </h1>

              <p className="mt-3 text-sm leading-6 text-scoreboard-muted">
                Enter a new password for your account.
              </p>

            </div>

            <div className="mt-7 space-y-6">

              <PasswordInput
                value={password}
                onChange={setPassword}
                label="New Password"
                showRequirements
              />

              <PasswordInput
                value={confirmPassword}
                onChange={setConfirmPassword}
                label="Confirm Password"
                showRequirements={false}
              />

            </div>

            {error && (
              <div className="mt-5 border border-scoreboard-red/60 bg-scoreboard-dark px-4 py-3">
                <p className="text-sm leading-6 text-scoreboard-muted">
                  {error}
                </p>
              </div>
            )}

            <Button
              type="submit"
              disabled={saving}
              className="
                mt-7
                w-full
                rounded-none
                border
                border-scoreboard-cream
                bg-scoreboard-cream
                py-5
                font-black
                uppercase
                tracking-[0.12em]
                text-scoreboard-dark
                hover:bg-scoreboard-amber
                disabled:opacity-50
              "
            >
              {saving
                ? "Updating..."
                : "Update Password"}
            </Button>

            <div className="mt-6 border-t border-scoreboard-cream/20 pt-5 text-center">

              <Link
                to="/login"
                className="
                  text-xs
                  font-black
                  uppercase
                  tracking-[0.10em]
                  text-scoreboard-amber
                  hover:text-scoreboard-cream
                "
              >
                Back To Sign In
              </Link>

            </div>

          </form>

        </div>

      </div>

    </main>
  )
}