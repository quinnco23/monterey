import { Link, useNavigate } from "react-router-dom"
import { Button, buttonVariants } from "@/components/ui/button"
import { useAuth } from "@/features/auth/auth-context"
import { cn } from "@/lib/utils"

export function SiteHeader() {
  const { user, loading, signOut } = useAuth()
  const navigate = useNavigate()

  async function handleSignOut() {
    await signOut()
    navigate("/")
  }

  return (
    <header className="sticky top-0 z-50 border-b border-scoreboard-cream/20 bg-scoreboard-dark/95 text-scoreboard-cream backdrop-blur">
    <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
      <Link
        to="/"
        className="group flex items-baseline gap-2 uppercase"
      >
        <span className="text-xl font-black tracking-[0.08em]">
          Monterey
        </span>
  
        <span className="text-sm font-bold tracking-[0.18em] text-scoreboard-amber transition-colors group-hover:text-scoreboard-cream">
          Baseball
        </span>
      </Link>
  
      <nav className="hidden items-center gap-8 md:flex">
        {[
          ["Tournaments", "/tournaments"],
          ["Teams", "/teams"],
           ["Book", "/book"],
          ["About", "/about"],
         
        ].map(([label, to]) => (
          <Link
            key={to}
            to={to}
            className="
              text-xs
              font-bold
              uppercase
              tracking-[0.18em]
              text-scoreboard-muted
              transition-colors
              hover:text-scoreboard-amber
            "
          >
            {label}
          </Link>
          
        ))}
       
      </nav>
  
      <div className="flex items-center gap-2">
        {!loading && user ? (
          <>
            <Link
              to="/dashboard"
              className={cn(
                buttonVariants({ variant: "ghost" }),
                `
                  rounded-none
                  px-4
                  text-xs
                  font-bold
                  uppercase
                  tracking-[0.14em]
                  text-scoreboard-cream
                  hover:bg-scoreboard-light
                  hover:text-scoreboard-cream
                `
              )}
            >
              Dashboard
            </Link>
  
            <Button
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
                tracking-[0.14em]
                text-scoreboard-cream
                hover:bg-scoreboard-cream
                hover:text-scoreboard-dark
              "
            >
              Sign out
            </Button>
          </>
        ) : !loading ? (
          <>
            <Link
              to="/login"
              className={cn(
                buttonVariants({ variant: "ghost" }),
                `
                  rounded-none
                  px-4
                  text-xs
                  font-bold
                  uppercase
                  tracking-[0.14em]
                  text-scoreboard-cream
                  hover:bg-scoreboard-light
                  hover:text-scoreboard-cream
                `
              )}
            >
              Sign in
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
                  tracking-[0.14em]
                  text-scoreboard-dark
                  hover:bg-scoreboard-amber
                  hover:text-scoreboard-dark
                `
              )}
            >
              Create account
            </Link>
          </>
        ) : null}
      </div>
    </div>
  </header>
  )
}
