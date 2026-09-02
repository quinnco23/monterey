import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { Menu, X } from "lucide-react"

import { Button, buttonVariants } from "@/components/ui/button"
import { useAuth } from "@/features/auth/auth-context"
import { cn } from "@/lib/utils"

export function SiteHeader() {
  const { user, loading, signOut } = useAuth()
  const navigate = useNavigate()
  const GAMEON_URL = "https://quinnglobal.com/fan"

  const [mobileOpen, setMobileOpen] = useState(false)

  const navItems = [
    ["Tournaments", "/tournaments"],
    ["Teams", "/teams"],
    ["Book", "/book"],
    ["About", "/about"],
  ]

  async function handleSignOut() {
    setMobileOpen(false)
    await signOut()
    navigate("/")
  }

  function closeMobileMenu() {
    setMobileOpen(false)
  }

  return (
    <header className="sticky top-0 z-50 border-b border-scoreboard-cream/20 bg-scoreboard-dark/95 text-scoreboard-cream backdrop-blur">

      <div className="mx-auto max-w-7xl px-4 sm:px-6">

        {/* MAIN HEADER ROW */}
        <div className="flex min-h-16 items-center justify-between gap-3">

          {/* BRAND */}
          <Link
            to="/"
            onClick={closeMobileMenu}
            className="
              group
              flex
              min-w-0
              shrink
              items-baseline
              gap-1.5
              uppercase
              sm:gap-2
            "
          >
            <span
              className="
                truncate
                text-base
                font-black
                tracking-[0.05em]
                sm:text-xl
                sm:tracking-[0.08em]
              "
            >
              Monterey
            </span>

            <span
              className="
                hidden
                text-xs
                font-bold
                tracking-[0.12em]
                text-scoreboard-amber
                transition-colors
                group-hover:text-scoreboard-cream
                sm:inline
                sm:text-sm
                sm:tracking-[0.18em]
              "
            >
              Baseball
            </span>
          </Link>

          {/* DESKTOP NAV */}
          <nav className="hidden items-center gap-6 lg:flex">

            {navItems.map(([label, to]) => (
              <Link
                key={to}
                to={to}
                className="
                  text-xs
                  font-bold
                  uppercase
                  tracking-[0.14em]
                  text-scoreboard-muted
                  transition-colors
                  hover:text-scoreboard-amber
                "
              >
                {label}
              </Link>
            ))}

<a
  href={GAMEON_URL}
  target="_blank"
  rel="noopener noreferrer"
  className="
    hidden
    items-center
    gap-2
    border
    border-scoreboard-amber
    bg-scoreboard-amber
    px-4
    py-1
    text-xs
    font-black
    uppercase
    tracking-[0.12em]
    text-scoreboard-dark
    transition-colors
    hover:bg-scoreboard-cream
    lg:inline-flex
  "
>
  <span className="text-[10px] tracking-[0.18em]">
    GameOn
  </span>
</a>

          </nav>

          {/* DESKTOP AUTH */}
          <div className="hidden items-center gap-2 lg:flex">

            {!loading && user ? (
              <>
                <Link
                  to="/dashboard"
                  className={cn(
                    buttonVariants({
                      variant: "ghost",
                    }),
                    `
                      rounded-none
                      px-4
                      text-xs
                      font-bold
                      uppercase
                      tracking-[0.12em]
                      text-scoreboard-cream
                      hover:bg-scoreboard-light
                      hover:text-scoreboard-cream
                    `
                  )}
                >
                  Dashboard
                </Link>

                <Button
                  type="button"
                  variant="outline"
                  onClick={handleSignOut}
                  className="
                    rounded-none
                    border-scoreboard-cream/40
                    bg-transparent
                    px-4
                    text-xs
                    font-bold
                    uppercase
                    tracking-[0.12em]
                    text-scoreboard-cream
                    hover:bg-scoreboard-cream
                    hover:text-scoreboard-dark
                  "
                >
                  Sign Out
                </Button>
              </>
            ) : !loading ? (
              <>

              
                <Link
                  to="/login"
                  className={cn(
                    buttonVariants({
                      variant: "ghost",
                    }),
                    `
                      rounded-none
                      px-4
                      text-xs
                      font-bold
                      uppercase
                      tracking-[0.12em]
                      text-scoreboard-cream
                      hover:bg-scoreboard-light
                      hover:text-scoreboard-cream
                    `
                  )}
                >
                  Sign In
                </Link>

                <Link
                  to="/register"
                  className={cn(
                    buttonVariants(),
                    `
                      rounded-none
                      border
                      border-scoreboard-cream
                      bg-scoreboard-cream
                      px-4
                      text-xs
                      font-bold
                      uppercase
                      tracking-[0.12em]
                      text-scoreboard-dark
                      hover:bg-scoreboard-amber
                      hover:text-scoreboard-dark
                    `
                  )}
                >
                  Create Account
                </Link>
              </>
            ) : null}

          </div>

          {/* MOBILE MENU BUTTON */}
          <button
            type="button"
            onClick={() =>
              setMobileOpen((current) => !current)
            }
            aria-label="Toggle navigation"
            aria-expanded={mobileOpen}
            className="
              inline-flex
              h-11
              w-11
              shrink-0
              items-center
              justify-center
              border
              border-scoreboard-cream/30
              text-scoreboard-cream
              transition-colors
              hover:border-scoreboard-amber
              hover:text-scoreboard-amber
              lg:hidden
            "
          >
            {mobileOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </button>

        </div>

        {/* MOBILE MENU */}
        {mobileOpen && (
          <div className="border-t border-scoreboard-cream/20 pb-4 lg:hidden">

            <nav className="py-2">

              {navItems.map(([label, to]) => (
                <Link
                  key={to}
                  to={to}
                  onClick={closeMobileMenu}
                  className="
                    block
                    border-b
                    border-scoreboard-cream/10
                    py-4
                    text-sm
                    font-black
                    uppercase
                    tracking-[0.10em]
                    text-scoreboard-cream
                    transition-colors
                    last:border-b-0
                    hover:text-scoreboard-amber
                  "
                >
                  {label}
                </Link>
              ))}

            </nav>

            {/* MOBILE AUTH */}
            {!loading && (
              <div className="mt-3 grid gap-2 border-t border-scoreboard-cream/20 pt-4">

                {user ? (
                  <>
                    <Link
                      to="/dashboard"
                      onClick={closeMobileMenu}
                      className={cn(
                        buttonVariants({
                          variant: "outline",
                        }),
                        `
                          w-full
                          rounded-none
                          border-scoreboard-cream/40
                          bg-transparent
                          text-xs
                          font-black
                          uppercase
                          tracking-[0.10em]
                          text-scoreboard-cream
                          hover:bg-scoreboard-light
                          hover:text-scoreboard-cream
                        `
                      )}
                    >
                      Dashboard
                    </Link>

                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleSignOut}
                      className="
                        w-full
                        rounded-none
                        border-scoreboard-cream/40
                        bg-transparent
                        text-xs
                        font-black
                        uppercase
                        tracking-[0.10em]
                        text-scoreboard-cream
                        hover:bg-scoreboard-cream
                        hover:text-scoreboard-dark
                      "
                    >
                      Sign Out
                    </Button>
                  </>
                ) : (
                  <>
                    <Link
                      to="/login"
                      onClick={closeMobileMenu}
                      className={cn(
                        buttonVariants({
                          variant: "outline",
                        }),
                        `
                          w-full
                          rounded-none
                          border-scoreboard-cream/40
                          bg-transparent
                          text-xs
                          font-black
                          uppercase
                          tracking-[0.10em]
                          text-scoreboard-cream
                          hover:bg-scoreboard-light
                          hover:text-scoreboard-cream
                        `
                      )}
                    >
                      Sign In
                    </Link>

                    <Link
                      to="/register"
                      onClick={closeMobileMenu}
                      className={cn(
                        buttonVariants(),
                        `
                          w-full
                          rounded-none
                          border
                          border-scoreboard-cream
                          bg-scoreboard-cream
                          text-xs
                          font-black
                          uppercase
                          tracking-[0.10em]
                          text-scoreboard-dark
                          hover:bg-scoreboard-amber
                          hover:text-scoreboard-dark
                        `
                      )}
                    >
                      Create Account
                    </Link>
                  </>
                )}

              </div>
            )}

          </div>
        )}

      </div>

    </header>
  )
}