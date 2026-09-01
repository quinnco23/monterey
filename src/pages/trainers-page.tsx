import { useEffect, useState } from "react"
import {
  ArrowRight,
  Clock,
  MapPin,
  UserRound,
} from "lucide-react"
import { Link } from "react-router-dom"

import { supabase } from "@/lib/supabase"

type TrainerProfile = {
  bio: string | null
  specialties: string[] | null
  experience_years: number | null
  minimum_age: number | null
  maximum_age: number | null
  photo_url: string | null
}

type TrainerResource = {
  id: string
  name: string
  resource_type: string
  description: string | null
  city: string | null
  state: string | null
  hourly_rate: number | null
  booking_mode: string | null
  active: boolean

  trainer_profiles: TrainerProfile[] | null
}

export function TrainersPage() {
  const [trainers, setTrainers] = useState<TrainerResource[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    async function loadTrainers() {
      setLoading(true)
      setError("")

      const { data, error } = await supabase
        .from("booking_resources")
        .select(`
          id,
          name,
          resource_type,
          description,
          city,
          state,
          hourly_rate,
          booking_mode,
          active,

          trainer_profiles (
            bio,
            specialties,
            experience_years,
            minimum_age,
            maximum_age,
            photo_url
          )
        `)
        .eq("resource_type", "trainer")
        .eq("active", true)
        .order("name")

      if (error) {
        setError(error.message)
        setLoading(false)
        return
      }

      setTrainers((data ?? []) as unknown as TrainerResource[])
      setLoading(false)
    }

    void loadTrainers()
  }, [])

  return (
    <main className="min-h-screen bg-scoreboard-dark text-scoreboard-cream">

      {/* HEADER */}
      <section className="border-b border-scoreboard-cream/20 bg-scoreboard-green">
        <div className="mx-auto max-w-7xl px-6 py-14">

          <p className="scoreboard-label text-scoreboard-amber">
            Player Development
          </p>

          <h1 className="mt-3 text-4xl font-black uppercase tracking-[0.08em] sm:text-5xl">
            Book Training
          </h1>

          <p className="mt-4 max-w-2xl text-scoreboard-muted">
            Find baseball instructors for hitting, pitching,
            fielding, catching, and private player development.
          </p>

        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-10">

        {/* FILTER BAR */}
        <div className="mb-8 grid gap-3 border border-scoreboard-cream/25 bg-scoreboard-green p-4 md:grid-cols-4">

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
            <option>All Specialties</option>
            <option>Pitching</option>
            <option>Hitting</option>
            <option>Fielding</option>
            <option>Catching</option>
            <option>Infield</option>
            <option>Outfield</option>
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
            <option>All Areas</option>
            <option>Santa Cruz</option>
            <option>Aptos</option>
            <option>Soquel</option>
            <option>Scotts Valley</option>
            <option>Watsonville</option>
          </select>

          <button
            type="button"
            className="
              rounded-none
              bg-scoreboard-cream
              px-4
              py-3
              text-xs
              font-black
              uppercase
              tracking-[0.12em]
              text-scoreboard-dark
              hover:bg-scoreboard-amber
            "
          >
            Find Training
          </button>

        </div>

        {/* SECTION HEADER */}
        <div className="mb-5 flex items-end justify-between border-b border-scoreboard-cream/20 pb-4">

          <div>
            <p className="scoreboard-label">
              Coaches & Instructors
            </p>

            <h2 className="mt-1 text-2xl font-black uppercase tracking-[0.08em]">
              Available Trainers
            </h2>
          </div>

          {!loading && !error && (
            <span className="scoreboard-number text-scoreboard-amber">
              {trainers.length} Trainers
            </span>
          )}

        </div>

        {/* LOADING */}
        {loading && (
          <div className="border border-scoreboard-cream/20 bg-scoreboard-green p-6">
            <p className="scoreboard-label">
              Loading Trainers...
            </p>
          </div>
        )}

        {/* ERROR */}
        {error && (
          <div className="border border-scoreboard-red/60 bg-scoreboard-green p-6">

            <p className="scoreboard-label text-scoreboard-amber">
              Unable To Load Trainers
            </p>

            <p className="mt-3 text-sm text-scoreboard-muted">
              {error}
            </p>

          </div>
        )}

        {/* EMPTY */}
        {!loading && !error && trainers.length === 0 && (
          <div className="border border-scoreboard-cream/20 bg-scoreboard-green p-8">

            <UserRound className="h-8 w-8 text-scoreboard-amber" />

            <h3 className="mt-5 text-xl font-black uppercase tracking-[0.06em]">
              No Trainers Available
            </h3>

            <p className="mt-3 text-sm text-scoreboard-muted">
              Trainer profiles will appear here when active instructors
              are added to the booking platform.
            </p>

          </div>
        )}

        {/* TRAINER CARDS */}
        {!loading && !error && trainers.length > 0 && (
          <div className="grid gap-px bg-scoreboard-cream/20 md:grid-cols-2 lg:grid-cols-3">

            {trainers.map((trainer) => {
              const profile = trainer.trainer_profiles?.[0] ?? null

              return (
                <article
                  key={trainer.id}
                  className="
                    flex
                    flex-col
                    bg-scoreboard-green
                    p-6
                    transition-colors
                    hover:bg-scoreboard-light
                  "
                >

                  <div className="flex items-start justify-between gap-4">

                    <div>

                      <p className="scoreboard-label text-scoreboard-amber">
                        Trainer
                      </p>

                      <h3 className="mt-2 text-2xl font-black uppercase tracking-[0.05em]">
                        {trainer.name}
                      </h3>

                    </div>

                    <UserRound className="h-6 w-6 text-scoreboard-amber" />

                  </div>

                  {/* SPECIALTIES */}
                  {profile?.specialties &&
                    profile.specialties.length > 0 && (
                      <div className="mt-4 flex flex-wrap gap-2">

                        {profile.specialties.map((specialty) => (
                          <span
                            key={specialty}
                            className="
                              border
                              border-scoreboard-cream/25
                              px-2
                              py-1
                              text-[10px]
                              font-black
                              uppercase
                              tracking-[0.12em]
                              text-scoreboard-muted
                            "
                          >
                            {specialty}
                          </span>
                        ))}

                      </div>
                    )}

                  {/* BIO */}
                  {(profile?.bio || trainer.description) && (
                    <p className="mt-5 text-sm leading-7 text-scoreboard-muted">
                      {profile?.bio ?? trainer.description}
                    </p>
                  )}

                  {/* DETAILS */}
                  <div className="mt-6 space-y-3 border-t border-scoreboard-cream/15 pt-5 text-sm text-scoreboard-muted">

                    {(trainer.city || trainer.state) && (
                      <div className="flex items-center gap-3">

                        <MapPin className="h-4 w-4 text-scoreboard-amber" />

                        {[trainer.city, trainer.state]
                          .filter(Boolean)
                          .join(", ")}

                      </div>
                    )}

                    {profile?.experience_years !== null &&
                      profile?.experience_years !== undefined && (
                        <div className="flex items-center gap-3">

                          <Clock className="h-4 w-4 text-scoreboard-amber" />

                          {profile.experience_years} Years Experience

                        </div>
                      )}

                    {(profile?.minimum_age !== null ||
                      profile?.maximum_age !== null) && (
                        <div className="text-sm">

                          Ages{" "}

                          {profile?.minimum_age ?? "Any"}

                          {" – "}

                          {profile?.maximum_age ?? "Any"}

                        </div>
                      )}

                    {trainer.hourly_rate !== null && (
                      <div className="scoreboard-number pt-2 text-xl text-scoreboard-cream">
                        ${Number(trainer.hourly_rate).toFixed(2)} / HR
                      </div>
                    )}

                  </div>

                  {/* BOOKING MODE */}
                  <div className="mt-5">

                    <span
                      className={
                        trainer.booking_mode === "instant"
                          ? `
                            bg-scoreboard-amber
                            px-2
                            py-1
                            text-[10px]
                            font-black
                            uppercase
                            tracking-[0.12em]
                            text-scoreboard-dark
                          `
                          : `
                            border
                            border-scoreboard-cream/30
                            px-2
                            py-1
                            text-[10px]
                            font-black
                            uppercase
                            tracking-[0.12em]
                            text-scoreboard-muted
                          `
                      }
                    >
                      {trainer.booking_mode === "instant"
                        ? "Book Online"
                        : trainer.booking_mode === "request"
                          ? "Request Session"
                          : "Unavailable"}
                    </span>

                  </div>

                  {/* CTA */}
                  <Link
                    to={`/book/resources/${trainer.id}`}
                    className="
                      group
                      mt-auto
                      flex
                      items-center
                      justify-between
                      border-t
                      border-scoreboard-cream/20
                      pt-5
                      mt-7
                    "
                  >

                    <span className="text-xs font-black uppercase tracking-[0.14em]">
                      View Availability
                    </span>

                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />

                  </Link>

                </article>
              )
            })}

          </div>
        )}

      </section>

    </main>
  )
}