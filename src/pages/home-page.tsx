import {
  ArrowRight,
  CalendarDays,
  ShieldCheck,
  Users,
} from "lucide-react"

import { Link } from "react-router-dom"

import { Button } from "@/components/ui/button"

export function HomePage() {
  return (
<main className="min-h-screen bg-scoreboard-dark text-scoreboard-cream">

{/* TOURNAMENT HERO */}
<section className="bg-scoreboard-dark">
  <div className="mx-auto max-w-7xl px-6 pt-10">

    <div className="border border-scoreboard-cream/25 bg-scoreboard-green">
      <div className="px-6 py-16 sm:px-10 sm:py-20 lg:px-14 lg:py-24">

        <div className="flex items-center justify-between border-b border-scoreboard-cream/20 pb-5">

          <p className="scoreboard-label text-scoreboard-amber">
            Santa Cruz Invitational
          </p>

          <div className="hidden items-center gap-2 sm:flex">
            <span className="h-2.5 w-2.5 bg-scoreboard-red" />

            <span className="text-xs font-black uppercase tracking-[0.14em] text-scoreboard-muted">
              Registration Open
            </span>
          </div>

        </div>

        <div className="pt-10">

          <h1 className="text-5xl font-black uppercase leading-[0.95] tracking-[0.03em] sm:text-6xl lg:text-7xl">
            SC Invitational
            <br />
            July 17–19
            <br />

            <span className="text-scoreboard-amber">
              Beat the Heat
            </span>
          </h1>

          <p className="mt-7 max-w-3xl text-base leading-8 text-scoreboard-muted sm:text-lg">
            Summer baseball on the Monterey Bay. The dates are set, the preperations are being made
    its time to  and spend the weekend playing baseball
             on the California coast.
          </p>

          <div className="mt-9 flex flex-wrap gap-3">

            <Link to="/register">
              <Button
                size="lg"
                className="
                  rounded-none
                  border
                  border-scoreboard-cream
                  bg-scoreboard-cream
                  px-6
                  font-bold
                  uppercase
                  tracking-[0.12em]
                  text-scoreboard-dark
                  hover:bg-scoreboard-amber
                  hover:text-scoreboard-dark
                "
              >
                Register Team

                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>

            <Link to="/tournaments">
              <Button
                size="lg"
                variant="outline"
                className="
                  rounded-none
                  border-scoreboard-cream/55
                  bg-transparent
                  px-6
                  font-bold
                  uppercase
                  tracking-[0.12em]
                  text-scoreboard-cream
                  hover:bg-scoreboard-light
                  hover:text-scoreboard-cream
                "
              >
                Tournament Details
              </Button>
            </Link>

          </div>

        </div>

      </div>
    </div>

  </div>
</section>

{/* FEATURE BOXES */}
<section className="bg-scoreboard-dark">
  <div className="mx-auto grid max-w-7xl gap-6 px-6 py-10 lg:grid-cols-2">

    {/* MONTEREY BAY BOX */}
    <div className="scoreboard-panel p-4 lg:p-5">
      <div className="h-full border border-scoreboard-cream/35 bg-scoreboard-dark p-6 sm:p-8">

        <div className="flex items-center justify-between border-b border-scoreboard-cream/25 pb-4">
          <p className="scoreboard-label text-scoreboard-amber">
            Monterey Bay Tournaments
          </p>

          <span className="h-3 w-3 bg-scoreboard-red shadow-[0_0_12px_rgba(157,47,42,0.65)]" />
        </div>

        <h2 className="mt-6 text-2xl font-black uppercase leading-tight tracking-[0.06em] sm:text-3xl">
          Santa Cruz Is Baseball
        </h2>

        <p className="scoreboard-label mt-3 text-scoreboard-amber">
          Santa Cruz, California is a premier summer travel-ball destination.
        </p>

        <div className="mt-8 divide-y divide-scoreboard-cream/20">

          <div className="flex gap-4 py-4">
            <CalendarDays className="mt-0.5 h-5 w-5 shrink-0 text-scoreboard-amber" />

            <div>
              <div className="scoreboard-label text-scoreboard-cream">
                Tournaments
              </div>

              <p className="mt-1 text-sm leading-6 text-scoreboard-muted">
                Event discovery and online registration
              </p>
            </div>
          </div>

          <div className="flex gap-4 py-4">
            <Users className="mt-0.5 h-5 w-5 shrink-0 text-scoreboard-amber" />

            <div>
              <div className="scoreboard-label text-scoreboard-cream">
                Teams
              </div>

              <p className="mt-1 text-sm leading-6 text-scoreboard-muted">
                Team profiles, rosters, and organization management
              </p>
            </div>
          </div>

          <div className="flex gap-4 py-4">
            <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-scoreboard-amber" />

            <div>
              <div className="scoreboard-label text-scoreboard-cream">
                Training
              </div>

              <p className="mt-1 text-sm leading-6 text-scoreboard-muted">
                Book trainers, facilities, fields, and pitching machines
              </p>
            </div>
          </div>

        </div>
      </div>
    </div>

    {/* GAMEON BOX */}
    <div className="scoreboard-panel p-4 lg:p-5">
      <div className="h-full border border-scoreboard-cream/35 bg-scoreboard-dark p-6 sm:p-8">

        <div className="flex items-center justify-between border-b border-scoreboard-cream/25 pb-4">
          <div>
            
            <a className="scoreboard-label text-scoreboard-amber"   href="https://quinnglobal.com"
            target="_blank"
            rel="noopener noreferrer">
              GameOn
            </a>

            <p className="mt-1 text-xs font-bold uppercase tracking-[0.16em] text-scoreboard-muted">
              10U Monterey League Standings
            </p>
          </div>

          <span className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.14em] text-scoreboard-cream">
            <span className="h-2.5 w-2.5 bg-scoreboard-red" />
            Live
          </span>
        </div>

        <div className="mt-6">

          <div className="grid grid-cols-[1fr_48px_48px_48px] border-b border-scoreboard-cream/20 pb-3">
            <div className="scoreboard-label">Team</div>
            <div className="scoreboard-label text-center">W</div>
            <div className="scoreboard-label text-center">L</div>
            <div className="scoreboard-label text-center">PCT</div>
          </div>

          {[
            ["Angry Berds", "18", "4", ".818"],
            ["Scotts Valley Havoc", "16", "6", ".727"],
            ["Aptos Beach Boys", "14", "7", ".667"],
            ["The Barrels", "12", "9", ".571"],
          ].map(([team, wins, losses, pct], index) => (
            <div
              key={team}
              className="
                grid
                grid-cols-[1fr_48px_48px_48px]
                items-center
                border-b
                border-scoreboard-cream/15
                py-4
              "
            >
              <div className="flex min-w-0 items-center gap-3">
                <span className="scoreboard-number w-5 text-sm text-scoreboard-amber">
                  {index + 1}
                </span>

                <span className="truncate text-sm font-black uppercase tracking-[0.05em] text-scoreboard-cream">
                  {team}
                </span>
              </div>

              <div className="scoreboard-number text-center text-lg">
                {wins}
              </div>

              <div className="scoreboard-number text-center text-lg">
                {losses}
              </div>

              <div className="scoreboard-number text-center text-sm text-scoreboard-muted">
                {pct}
              </div>
            </div>
          ))}

        </div>

        <div className="mt-7 border-t border-scoreboard-cream/25 pt-5">

          <div className="mb-3 flex items-center justify-between">
            <span className="scoreboard-label">
              Latest Final
            </span>

            <span className="scoreboard-label text-scoreboard-amber">
              GameOn
            </span>
          </div>

          <div className="grid grid-cols-[1fr_auto] gap-x-6 gap-y-2">

            <div className="text-sm font-black uppercase tracking-[0.07em]">
              Angry Berds
            </div>

            <div className="scoreboard-number text-2xl text-scoreboard-amber">
              8
            </div>

            <div className="text-sm font-black uppercase tracking-[0.07em] text-scoreboard-muted">
              Scotts Valley
            </div>

            <div className="scoreboard-number text-2xl">
              5
            </div>

          </div>

          <div className="mt-4 text-xs font-bold uppercase tracking-[0.13em] text-scoreboard-muted">
            Final • 6 Innings • Polo Grounds
          </div>

        </div>

        <Link
          to="/scores"
          className="
            mt-7
            flex
            w-full
            items-center
            justify-between
            border
            border-scoreboard-cream/30
            px-4
            py-3
            text-xs
            font-black
            uppercase
            tracking-[0.14em]
            text-scoreboard-cream
            transition-colors
            hover:bg-scoreboard-cream
            hover:text-scoreboard-dark
          "
        >
          View GameOn Scores
          <ArrowRight className="h-4 w-4" />
        </Link>

      </div>
    </div>

  </div>
</section>

      

      <section className="bg-scoreboard-dark">

        <div className="mx-auto max-w-7xl px-6 py-16 sm:py-20">

          <div className="mb-8 flex items-end justify-between border-b border-scoreboard-cream/25 pb-4">

            <div>
              <p className="scoreboard-label">
                Getting Started
              </p>

              <h2 className="mt-2 text-3xl font-black uppercase tracking-[0.08em]">
                How It Works
              </h2>
            </div>

            <div className="hidden text-right sm:block">
              <div className="scoreboard-label">
                SCBC
              </div>

              <div className="scoreboard-number mt-1 text-xl text-scoreboard-amber">
                01 — 03
              </div>
            </div>

          </div>

          <div className="grid border-l border-t border-scoreboard-cream/25 md:grid-cols-3">

            {[
              [
                "01",
                "Create your organization",
                "Set up your club, league, or tournament company and invite staff.",
              ],
              [
                "02",
                "Build team profiles",
                "Add age group, classification, coaches, branding, and public team information.",
              ],
              [
                "03",
                "Register for events",
                "Find tournaments and complete registration from a single team dashboard.",
              ],
            ].map(([n, title, text]) => (

              <article
                key={n}
                className="
                  border-b
                  border-r
                  border-scoreboard-cream/25
                  bg-scoreboard-green
                  p-6
                  transition-colors
                  hover:bg-scoreboard-light
                  sm:p-8
                "
              >

                <div className="scoreboard-number text-4xl text-scoreboard-amber">
                  {n}
                </div>

                <h3 className="mt-8 text-xl font-black uppercase leading-tight tracking-[0.08em]">
                  {title}
                </h3>

                <p className="mt-4 max-w-sm text-sm leading-7 text-scoreboard-muted">
                  {text}
                </p>

              </article>

            ))}

          </div>
        </div>
      </section>

    </main>
  )
}