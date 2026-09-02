import { FormEvent, useState } from "react"
import { ArrowLeft, Mail } from "lucide-react"
import { Link } from "react-router-dom"

import { Button } from "@/components/ui/button"
import { supabase } from "@/lib/supabase"

export function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [sending, setSending] = useState(false)
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    setSending(true)
    setMessage("")
    setError("")

    const { error } = await supabase.auth.resetPasswordForEmail(
      email.trim(),
      {
        redirectTo: `${window.location.origin}/update-password`,
      }
    )

    setSending(false)

    if (error) {
      setError(error.message)
      return
    }

    setMessage(
      "If an account exists for that email, password reset instructions have been sent."
    )
  }

  return (
    <main className="flex min-h-[calc(100vh-73px)] items-center bg-scoreboard-dark px-4 py-12 text-scoreboard-cream sm:px-6">

      <div className="mx-auto w-full max-w-md">

        <Link
          to="/login"
          className="
            mb-5
            inline-flex
            items-center
            gap-2
            text-xs
            font-black
            uppercase
            tracking-[0.12em]
            text-scoreboard-muted
            hover:text-scoreboard-amber
          "
        >
          <ArrowLeft className="h-4 w-4" />
          Back To Sign In
        </Link>

        <div className="scoreboard-panel p-4">

          <form
            onSubmit={handleSubmit}
            className="border border-scoreboard-cream/35 bg-scoreboard-green p-6 sm:p-8"
          >

            <div className="border-b border-scoreboard-cream/25 pb-5">

              <Mail className="h-6 w-6 text-scoreboard-amber" />

              <p className="scoreboard-label mt-5 text-scoreboard-amber">
                Account Recovery
              </p>

              <h1 className="mt-3 text-3xl font-black uppercase leading-tight tracking-[0.05em]">
                Reset Password
              </h1>

              <p className="mt-3 text-sm leading-6 text-scoreboard-muted">
                Enter the email address associated with your account.
                We&apos;ll send you a link to choose a new password.
              </p>

            </div>

            <label className="mt-7 block">

              <span className="scoreboard-label text-scoreboard-cream">
                Email
              </span>

              <input
                type="email"
                value={email}
                onChange={(event) =>
                  setEmail(event.target.value)
                }
                autoComplete="email"
                required
                className="
                  mt-2
                  w-full
                  rounded-none
                  border
                  border-scoreboard-cream/30
                  bg-scoreboard-cream
                  px-3
                  py-3
                  text-base
                  text-scoreboard-dark
                  outline-none
                  transition
                  focus:border-scoreboard-amber
                "
              />

            </label>

            {error && (
              <div className="mt-5 border border-scoreboard-red/60 bg-scoreboard-dark px-4 py-3">
                <p className="text-sm leading-6 text-scoreboard-muted">
                  {error}
                </p>
              </div>
            )}

            {message && (
              <div className="mt-5 border border-scoreboard-amber/50 bg-scoreboard-dark px-4 py-3">
                <p className="text-sm leading-6 text-scoreboard-muted">
                  {message}
                </p>
              </div>
            )}

            <Button
              type="submit"
              disabled={sending}
              className="
                mt-6
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
                hover:text-scoreboard-dark
              "
            >
              {sending
                ? "Sending..."
                : "Send Reset Link"}
            </Button>

          </form>

        </div>

      </div>

    </main>
  )
}