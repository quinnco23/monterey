import { FormEvent, useState } from "react"
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/features/auth/auth-context"
import { supabase } from "@/lib/supabase"

type AuthPageProps = { mode: "login" | "register" }

type LocationState = { from?: string }

export function AuthPage({ mode }: AuthPageProps) {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, loading: authLoading } = useAuth()
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [message, setMessage] = useState("")
  const [loading, setLoading] = useState(false)

  if (!authLoading && user) return <Navigate to="/dashboard" replace />

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!supabase) {
      setMessage("Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to .env first.")
      return
    }

    setLoading(true)
    setMessage("")

    if (mode === "register") {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { first_name: firstName.trim(), last_name: lastName.trim() },
          emailRedirectTo: `${window.location.origin}/dashboard`,
        },
      })
      setLoading(false)

      if (error) return setMessage(error.message)
      if (data.session) return navigate("/onboarding", { replace: true })
      setMessage("Account created. Check your email to confirm your account, then sign in.")
      return
    }

    const { error } = await supabase.auth.signInWithPassword({ email, password })
    setLoading(false)
    if (error) return setMessage(error.message)

    const from = (location.state as LocationState | null)?.from
    navigate(from || "/dashboard", { replace: true })
  }

  const isLogin = mode === "login"

  return (
    <main className="flex min-h-[calc(100vh-73px)] items-center bg-scoreboard-dark px-6 py-12 text-scoreboard-cream">
  <div className="mx-auto w-full max-w-md">

    <div className="scoreboard-panel p-4">
      <div className="border border-scoreboard-cream/35 bg-scoreboard-green p-6 sm:p-8">

        <div className="border-b border-scoreboard-cream/25 pb-5">
          <p className="scoreboard-label text-scoreboard-amber">
            SCBC Account
          </p>

          <h1 className="mt-3 text-3xl font-black uppercase leading-tight tracking-[0.06em]">
            {isLogin ? "Welcome Back" : "Create Your Account"}
          </h1>

          <p className="mt-3 text-sm leading-6 text-scoreboard-muted">
            {isLogin
              ? "Sign in to manage your teams, organizations, registrations, and bookings."
              : "Create an account to start building your baseball organization."}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-7 space-y-5">

          {!isLogin && (
            <div className="grid gap-4 sm:grid-cols-2">

              <label className="block">
                <span className="scoreboard-label text-scoreboard-cream">
                  First Name
                </span>

                <input
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
                    placeholder:text-scoreboard-dark/40
                    focus:border-scoreboard-amber
                  "
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  required
                />
              </label>

              <label className="block">
                <span className="scoreboard-label text-scoreboard-cream">
                  Last Name
                </span>

                <input
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
                    placeholder:text-scoreboard-dark/40
                    focus:border-scoreboard-amber
                  "
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  required
                />
              </label>

            </div>
          )}

          <label className="block">
            <span className="scoreboard-label text-scoreboard-cream">
              Email
            </span>

            <input
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
                placeholder:text-scoreboard-dark/40
                focus:border-scoreboard-amber
              "
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </label>

          <label className="block">
            <span className="scoreboard-label text-scoreboard-cream">
              Password
            </span>

            <input
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
                placeholder:text-scoreboard-dark/40
                focus:border-scoreboard-amber
              "
              type="password"
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </label>

          <Button
            className="
              w-full
              rounded-none
              border
              border-scoreboard-cream
              bg-scoreboard-cream
              py-5
              font-black
              uppercase
              tracking-[0.14em]
              text-scoreboard-dark
              hover:bg-scoreboard-amber
              hover:text-scoreboard-dark
            "
            disabled={loading}
          >
            {loading
              ? "Working..."
              : isLogin
                ? "Sign In"
                : "Create Account"}
          </Button>

        </form>

        {message && (
          <div className="mt-5 border border-scoreboard-cream/20 bg-scoreboard-dark px-4 py-3">
            <p className="text-sm leading-6 text-scoreboard-muted">
              {message}
            </p>
          </div>
        )}

        <div className="mt-7 border-t border-scoreboard-cream/20 pt-5">
          <p className="text-sm text-scoreboard-muted">
            {isLogin
              ? "Need an account? "
              : "Already have an account? "}

            <Link
              className="
                font-black
                uppercase
                tracking-[0.08em]
                text-scoreboard-amber
                transition-colors
                hover:text-scoreboard-cream
              "
              to={isLogin ? "/register" : "/login"}
            >
              {isLogin ? "Register" : "Sign In"}
            </Link>
          </p>
        </div>

      </div>
    </div>

  </div>
</main>
  )
}
