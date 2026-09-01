import {
    Heart,
    MapPin,
    Trophy,
    Users,
  } from "lucide-react"
  
  export function AboutPage() {
    return (
      <main className="min-h-screen bg-scoreboard-dark text-scoreboard-cream">
  
        {/* HERO */}
        <section className="border-b border-scoreboard-cream/20 bg-scoreboard-green">
          <div className="mx-auto max-w-7xl px-6 py-16 sm:py-20">
  
            <p className="scoreboard-label text-scoreboard-amber">
              Moterey Baseball
            </p>
  
            <h1 className="mt-4 max-w-4xl text-5xl font-black uppercase leading-[0.95] tracking-[0.06em] sm:text-6xl lg:text-7xl">
              Baseball
              <br />
              Belongs Here.
            </h1>
  
            <p className="mt-7 max-w-2xl text-base leading-8 text-scoreboard-muted sm:text-lg">
              Celebrating  baseball, community, competition,
              and the places and peole that make the game
              special.
            </p>
  
          </div>
        </section>
  
        {/* INTRO */}
        <section className="mx-auto max-w-7xl px-6 py-12 sm:py-16">
  
          <div className="grid gap-10 lg:grid-cols-[1.4fr_0.6fr]">
  
            <div>
  
              <p className="scoreboard-label text-scoreboard-amber">
                Our Home
              </p>
  
              <h2 className="mt-3 text-3xl font-black uppercase tracking-[0.06em]">
                Baseball in Santa Cruz
              </h2>
  
              <div className="mt-7 max-w-3xl space-y-6 text-base leading-8 text-scoreboard-muted">
  
                <p>
                  Santa Cruz has always been a place where community
                  and the outdoors come together. From summer evenings
                  near the coast to weekends spent at the ballpark,
                  it&apos;s a special place to grow up, compete, and
                  play the game we love.
                </p>
  
                <p>
                  At the heart of that baseball tradition is{" "}
                  <strong className="font-bold text-scoreboard-cream">
                    Harvey West Park
                  </strong>
                  . Generations of local players and families have
                  spent their spring and summer days on these fields —
                  taking batting practice, chasing fly balls, playing
                  Little League games, and creating the memories that
                  make Baseball simply.. magic. 
                </p>
  
              </div>
  
            </div>
  
            {/* LOCATION CARD */}
            <aside className="border border-scoreboard-cream/25 bg-scoreboard-green p-7">
  
              <MapPin className="h-7 w-7 text-scoreboard-amber" />
  
              <p className="scoreboard-label mt-6 text-scoreboard-amber">
                Home Field
              </p>
  
              <h3 className="mt-2 text-2xl font-black uppercase tracking-[0.06em]">
                Harvey West Park
              </h3>
  
              <p className="mt-4 text-sm leading-7 text-scoreboard-muted">
                Santa Cruz, California
              </p>
  
              <div className="mt-7 border-t border-scoreboard-cream/20 pt-6">
  
                <p className="text-sm leading-7 text-scoreboard-muted">
                  A gathering place for players, coaches, families,
                  and generations of Santa Cruz baseball.
                </p>
  
              </div>
  
            </aside>
  
          </div>
  
        </section>
  
        {/* WHY BASEBALL */}
        <section className="border-y border-scoreboard-cream/20 bg-scoreboard-green">
  
          <div className="mx-auto max-w-7xl px-6 py-14">
  
            <p className="scoreboard-label text-scoreboard-amber">
              Why We Play
            </p>
  
            <h2 className="mt-3 max-w-3xl text-3xl font-black uppercase tracking-[0.06em]">
              More Than A Game
            </h2>
  
            <p className="mt-6 max-w-4xl text-base leading-8 text-scoreboard-muted">
              We believe youth baseball is at its best when it brings
              people together. Players learn to compete, become
              teammates, handle adversity, and develop a lifelong
              appreciation for the game. Parents become friends.
              Coaches become mentors. Teams that arrive as opponents
              often leave with respect for one another and stories
              they&apos;ll remember for years.
            </p>
  
            <div className="mt-10 grid gap-px bg-scoreboard-cream/20 md:grid-cols-3">
  
              <div className="bg-scoreboard-dark p-7">
                <Users className="h-6 w-6 text-scoreboard-amber" />
  
                <h3 className="mt-5 text-lg font-black uppercase tracking-[0.08em]">
                  Community
                </h3>
  
                <p className="mt-3 text-sm leading-7 text-scoreboard-muted">
                  Bringing players, coaches, families, and baseball
                  programs together.
                </p>
              </div>
  
              <div className="bg-scoreboard-dark p-7">
                <Trophy className="h-6 w-6 text-scoreboard-amber" />
  
                <h3 className="mt-5 text-lg font-black uppercase tracking-[0.08em]">
                  Competition
                </h3>
  
                <p className="mt-3 text-sm leading-7 text-scoreboard-muted">
                  Creating opportunities to compete, improve, and
                  experience meaningful baseball.
                </p>
              </div>
  
              <div className="bg-scoreboard-dark p-7">
                <Heart className="h-6 w-6 text-scoreboard-amber" />
  
                <h3 className="mt-5 text-lg font-black uppercase tracking-[0.08em]">
                  Love Of The Game
                </h3>
  
                <p className="mt-3 text-sm leading-7 text-scoreboard-muted">
                  Helping the next generation build a connection to
                  baseball that lasts well beyond one season.
                </p>
              </div>
  
            </div>
  
          </div>
  
        </section>
  
        {/* MISSION */}
        <section className="mx-auto max-w-7xl px-6 py-16 sm:py-20">
  
          <div className="max-w-4xl">
  
            <p className="scoreboard-label text-scoreboard-amber">
              What We&apos;re Building
            </p>
  
            <h2 className="mt-3 text-3xl font-black uppercase tracking-[0.06em] sm:text-4xl">
              Great Baseball Weekends
              <br />
              In A Great Baseball Town.
            </h2>
  
            <p className="mt-7 text-base leading-8 text-scoreboard-muted">
              Our goal is to build on that tradition by bringing great
              youth baseball experiences to Santa Cruz — connecting
              local teams with programs from throughout Northern
              California and beyond, while making our community and
              its ballparks a destination for memorable baseball
              weekends.
            </p>
  
            <div className="mt-10 border-l-4 border-scoreboard-amber pl-6">
  
              <p className="text-xl font-black uppercase leading-9 tracking-[0.06em] sm:text-2xl">
                Great fields.
                <br />
                Great competition.
                <br />
                A great baseball town.
              </p>
  
            </div>
  
            <p className="scoreboard-label mt-10 text-scoreboard-amber">
              Welcome to baseball in Santa Cruz.
            </p>
  
          </div>
  
        </section>
  
      </main>
    )
  }