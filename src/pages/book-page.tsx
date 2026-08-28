import {
    ArrowRight,
    Building2,
    CircleDot,
    Dumbbell,
    MapPin,
    Search,
    UserRound,
  } from "lucide-react"
  import { Link } from "react-router-dom"
  
  import { Button } from "@/components/ui/button"
  
  const bookingCategories = [
    {
      title: "Training",
      eyebrow: "Coaches & Instructors",
      description:
        "Book private hitting, pitching, catching, fielding, and strength sessions.",
      href: "/book/training",
      icon: UserRound,
      action: "Find training",
    },
    {
      title: "Fields",
      eyebrow: "Outdoor Diamonds",
      description:
        "Find baseball fields for practices, scrimmages, team workouts, and events.",
      href: "/book/fields",
      icon: MapPin,
      action: "Find a field",
    },
    {
      title: "Facilities",
      eyebrow: "Indoor & Outdoor",
      description:
        "Reserve batting cages, indoor turf, pitching lanes, gyms, and team spaces.",
      href: "/book/facilities",
      icon: Building2,
      action: "Find a facility",
    },
    {
      title: "Machines",
      eyebrow: "Equipment Time",
      description:
        "Reserve pitching machines, HitTrax-style systems, and training equipment.",
      href: "/book/machines",
      icon: CircleDot,
      action: "Find a machine",
    },
  ]
  
  const featured = [
    {
      title: "Polo Grounds — Field 2",
      type: "Baseball Field",
      location: "Aptos, CA",
      availability: "Saturday • 12 PM – 2 PM",
      href: "/book/fields/polo-grounds-field-2",
    },
    {
      title: "Pitching Lane 1",
      type: "Training Facility",
      location: "Santa Cruz, CA",
      availability: "Today • 5 PM – 6 PM",
      href: "/book/facilities/pitching-lane-1",
    },
    {
      title: "Coach Mike Anderson",
      type: "Pitching Instructor",
      location: "Santa Cruz, CA",
      availability: "Thursday • 6 PM",
      href: "/book/training/mike-anderson",
    },
  ]
  
  export function BookPage() {
    return (
      <main className="min-h-screen bg-scoreboard-dark text-scoreboard-cream">
  
        {/* HERO */}
        <section className="border-b border-scoreboard-cream/20 bg-scoreboard-green">
          <div className="mx-auto max-w-7xl px-6 py-16 lg:py-20">
  
            <p className="scoreboard-label text-scoreboard-amber">
              Reservations
            </p>
  
            <div className="mt-4 grid gap-10 lg:grid-cols-[1.1fr_.9fr] lg:items-end">
  
              <div>
                <h1 className="max-w-4xl text-5xl font-black uppercase leading-[0.95] tracking-[0.05em] sm:text-6xl">
                  Book Baseball
                </h1>
  
                <p className="mt-6 max-w-2xl text-base leading-8 text-scoreboard-muted sm:text-lg">
                  Find a field, reserve a facility, book a trainer, or schedule
                  pitching-machine time from one baseball-first booking system.
                </p>
              </div>
  
              {/* SEARCH BOARD */}
              <div className="border border-scoreboard-cream/25 bg-scoreboard-dark p-5">
  
                <div className="scoreboard-label">
                  Search Availability
                </div>
  
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
  
                  <input
                    type="date"
                    className="
                      rounded-none
                      border
                      border-scoreboard-cream/30
                      bg-scoreboard-cream
                      px-3
                      py-3
                      text-scoreboard-dark
                    "
                  />
  
                  <select
                    className="
                      rounded-none
                      border
                      border-scoreboard-cream/30
                      bg-scoreboard-cream
                      px-3
                      py-3
                      text-scoreboard-dark
                    "
                  >
                    <option>Any time</option>
                    <option>Morning</option>
                    <option>Afternoon</option>
                    <option>Evening</option>
                  </select>
  
                  <select
                    className="
                      rounded-none
                      border
                      border-scoreboard-cream/30
                      bg-scoreboard-cream
                      px-3
                      py-3
                      text-scoreboard-dark
                    "
                  >
                    <option>All booking types</option>
                    <option>Training</option>
                    <option>Fields</option>
                    <option>Facilities</option>
                    <option>Machines</option>
                  </select>
  
                  <select
                    className="
                      rounded-none
                      border
                      border-scoreboard-cream/30
                      bg-scoreboard-cream
                      px-3
                      py-3
                      text-scoreboard-dark
                    "
                  >
                    <option>Santa Cruz County</option>
                    <option>Santa Cruz</option>
                    <option>Aptos</option>
                    <option>Soquel</option>
                    <option>Scotts Valley</option>
                    <option>Watsonville</option>
                  </select>
  
                </div>
  
                <Button
                  className="
                    mt-3
                    w-full
                    rounded-none
                    bg-scoreboard-cream
                    font-black
                    uppercase
                    tracking-[0.14em]
                    text-scoreboard-dark
                    hover:bg-scoreboard-amber
                    hover:text-scoreboard-dark
                  "
                >
                  <Search className="mr-2 h-4 w-4" />
                  Search
                </Button>
  
              </div>
            </div>
          </div>
        </section>
  
        {/* BOOKING CATEGORIES */}
        <section className="mx-auto max-w-7xl px-6 py-12">
  
          <div className="mb-6 flex items-end justify-between border-b border-scoreboard-cream/20 pb-4">
  
            <div>
              <p className="scoreboard-label">
                What Do You Need?
              </p>
  
              <h2 className="mt-2 text-2xl font-black uppercase tracking-[0.08em]">
                Booking Categories
              </h2>
            </div>
  
            <div className="hidden text-right sm:block">
              <div className="scoreboard-label">
                SCBC
              </div>
  
              <div className="scoreboard-number mt-1 text-xl text-scoreboard-amber">
                BOOK
              </div>
            </div>
  
          </div>
  
          <div className="grid border-l border-t border-scoreboard-cream/25 md:grid-cols-2">
  
            {bookingCategories.map((category) => {
              const Icon = category.icon
  
              return (
                <Link
                  key={category.title}
                  to={category.href}
                  className="
                    group
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
  
                  <div className="flex items-start justify-between gap-6">
  
                    <div>
                      <p className="scoreboard-label text-scoreboard-amber">
                        {category.eyebrow}
                      </p>
  
                      <h3 className="mt-3 text-2xl font-black uppercase tracking-[0.08em]">
                        {category.title}
                      </h3>
                    </div>
  
                    <div className="border border-scoreboard-cream/25 p-3">
                      <Icon className="h-6 w-6 text-scoreboard-amber" />
                    </div>
  
                  </div>
  
                  <p className="mt-6 max-w-md text-sm leading-7 text-scoreboard-muted">
                    {category.description}
                  </p>
  
                  <div className="mt-8 inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.14em] text-scoreboard-cream group-hover:text-scoreboard-amber">
                    {category.action}
                    <ArrowRight className="h-4 w-4" />
                  </div>
  
                </Link>
              )
            })}
  
          </div>
        </section>
  
        {/* FEATURED */}
        <section className="border-t border-scoreboard-cream/15 bg-scoreboard-green/40">
  
          <div className="mx-auto max-w-7xl px-6 py-12">
  
            <div className="mb-6 flex items-end justify-between border-b border-scoreboard-cream/20 pb-4">
  
              <div>
                <p className="scoreboard-label">
                  Quick Booking
                </p>
  
                <h2 className="mt-2 text-2xl font-black uppercase tracking-[0.08em]">
                  Featured Availability
                </h2>
              </div>
  
            </div>
  
            <div className="grid gap-px bg-scoreboard-cream/20 lg:grid-cols-3">
  
              {featured.map((item) => (
                <Link
                  key={item.title}
                  to={item.href}
                  className="
                    bg-scoreboard-green
                    p-6
                    transition-colors
                    hover:bg-scoreboard-light
                  "
                >
  
                  <p className="scoreboard-label text-scoreboard-amber">
                    {item.type}
                  </p>
  
                  <h3 className="mt-3 text-xl font-black uppercase tracking-[0.05em]">
                    {item.title}
                  </h3>
  
                  <div className="mt-5 space-y-2 text-sm text-scoreboard-muted">
  
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-scoreboard-amber" />
                      {item.location}
                    </div>
  
                    <div className="flex items-center gap-2">
                      <Dumbbell className="h-4 w-4 text-scoreboard-amber" />
                      {item.availability}
                    </div>
  
                  </div>
  
                  <div className="mt-6 inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.14em] text-scoreboard-cream">
                    View times
                    <ArrowRight className="h-4 w-4" />
                  </div>
  
                </Link>
              ))}
  
            </div>
          </div>
        </section>
  
      </main>
    )
  }