import { CalendarDays, Clock, MapPin } from "lucide-react"
import { Button,  } from "@/components/ui/button"
import { Link } from "react-router-dom"

const fields = [
  {
    id: "anna-jean-cummings-1",
    venue: "Anna Jean Cummings County Park",
    field: "Field 1",
    city: "Soquel",
    type: "Youth Baseball / Softball",
    reservable: true,
  },
  {
    id: "anna-jean-cummings-2",
    venue: "Anna Jean Cummings County Park",
    field: "Field 2",
    city: "Soquel",
    type: "Youth Baseball / Softball",
    reservable: true,
  },
  {
    id: "brommer",
    venue: "Brommer Street County Park",
    field: "Baseball / Softball Field",
    city: "Live Oak",
    type: "Youth Baseball / Softball",
    reservable: true,
  },
  {
    id: "highlands-1",
    venue: "Highlands County Park",
    field: "Field 1",
    city: "Ben Lomond",
    type: "Baseball / Softball",
    reservable: true,
  },
  {
    id: "highlands-2",
    venue: "Highlands County Park",
    field: "Field 2",
    city: "Ben Lomond",
    type: "Baseball / Softball",
    reservable: true,
  },
  {
    id: "michael-gray",
    venue: "Michael Gray Field County Park",
    field: "Baseball / Softball Field",
    city: "Felton",
    type: "Middle School / Youth Baseball",
    reservable: true,
  },
  {
    id: "pinto-lake",
    venue: "Pinto Lake County Park",
    field: "Baseball Field",
    city: "Watsonville",
    type: "Youth Baseball",
    reservable: true,
  },
  {
    id: "polo-1",
    venue: "Polo Grounds County Park",
    field: "Field 1",
    city: "Aptos",
    type: "Youth Baseball",
    reservable: true,
  },
  {
    id: "polo-2",
    venue: "Polo Grounds County Park",
    field: "Field 2",
    city: "Aptos",
    type: "Youth Baseball",
    reservable: true,
  },
  {
    id: "polo-3",
    venue: "Polo Grounds County Park",
    field: "Field 3",
    city: "Aptos",
    type: "Youth Baseball",
    reservable: true,
  },
  {
    id: "ramsay",
    venue: "Ramsay Park",
    field: "Baseball / Softball Field",
    city: "Watsonville",
    type: "Baseball / Softball",
    reservable: true,
  },
  {
    id: "siltanen",
    venue: "Siltanen Park",
    field: "Majors Field",
    city: "Scotts Valley",
    type: "Baseball",
    reservable: true,
  },
  {
    id: "delaveaga-1",
    venue: "DeLaveaga Park",
    field: "Field 1",
    city: "Santa Cruz",
    type: "Softball / Baseball",
    reservable: false,
  },
  {
    id: "delaveaga-2",
    venue: "DeLaveaga Park",
    field: "Field 2",
    city: "Santa Cruz",
    type: "Softball / Baseball",
    reservable: false,
  },
  {
    id: "harvey-west-5",
    venue: "Harvey West Park",
    field: "Field 5",
    city: "Santa Cruz",
    type: "Softball / Baseball",
    reservable: false,
  },
  {
    id: "harvey-west-6",
    venue: "Harvey West Park",
    field: "Field 6",
    city: "Santa Cruz",
    type: "Softball / Baseball",
    reservable: false,
  },
]

export function FieldReservationsPage() {
  return (
    <main className="min-h-screen bg-scoreboard-dark text-scoreboard-cream">
      <section className="border-b border-scoreboard-cream/20 bg-scoreboard-green">
        <div className="mx-auto max-w-7xl px-6 py-14">
          <p className="scoreboard-label text-scoreboard-amber">
            Santa Cruz County
          </p>

          <h1 className="mt-3 text-4xl font-black uppercase tracking-[0.08em] sm:text-5xl">
            Field Reservations
          </h1>

          <p className="mt-4 max-w-2xl text-scoreboard-muted">
            Find an available baseball field, select a date and time,
            and submit a reservation request.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-10">
        <div className="mb-8 grid gap-3 border border-scoreboard-cream/25 bg-scoreboard-green p-4 md:grid-cols-4">
          <input
            type="date"
            className="rounded-none border border-scoreboard-cream/30 bg-scoreboard-cream px-3 py-3 text-scoreboard-dark"
          />

          <select className="rounded-none border border-scoreboard-cream/30 bg-scoreboard-cream px-3 py-3 text-scoreboard-dark">
            <option>All Areas</option>
            <option>Santa Cruz</option>
            <option>Aptos</option>
            <option>Soquel</option>
            <option>Live Oak</option>
            <option>Scotts Valley</option>
            <option>Ben Lomond</option>
            <option>Felton</option>
            <option>Watsonville</option>
          </select>

          <select className="rounded-none border border-scoreboard-cream/30 bg-scoreboard-cream px-3 py-3 text-scoreboard-dark">
            <option>All Field Types</option>
            <option>Youth Baseball</option>
            <option>Baseball / Softball</option>
            <option>Middle School Baseball</option>
          </select>

          <Button className="rounded-none bg-scoreboard-cream font-bold uppercase tracking-[0.12em] text-scoreboard-dark hover:bg-scoreboard-amber">
            Check Availability
          </Button>
        </div>

        <div className="mb-5 flex items-end justify-between border-b border-scoreboard-cream/20 pb-4">
          <div>
            <p className="scoreboard-label">Available Diamonds</p>
            <h2 className="mt-1 text-2xl font-black uppercase tracking-[0.08em]">
              Santa Cruz County
            </h2>
          </div>

          <span className="scoreboard-number text-scoreboard-amber">
            {fields.length} Fields
          </span>
        </div>

        <div className="grid gap-px bg-scoreboard-cream/20 md:grid-cols-2 lg:grid-cols-3">
          {fields.map((field) => (
            <article
              key={field.id}
              className="bg-scoreboard-green p-6 transition-colors hover:bg-scoreboard-light"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="scoreboard-label text-scoreboard-amber">
                    {field.city}
                  </p>

                  <h3 className="mt-2 text-xl font-black uppercase tracking-[0.05em]">
                    {field.venue}
                  </h3>

                  <p className="mt-1 text-sm text-scoreboard-muted">
                    {field.field}
                  </p>
                </div>

                <span
                  className={
                    field.reservable
                      ? "bg-scoreboard-amber px-2 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-scoreboard-dark"
                      : "border border-scoreboard-cream/30 px-2 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-scoreboard-muted"
                  }
                >
                  {field.reservable ? "Reservable" : "Request"}
                </span>
              </div>

              <div className="mt-6 space-y-3 border-t border-scoreboard-cream/15 pt-5 text-sm text-scoreboard-muted">
                <div className="flex items-center gap-3">
                  <MapPin className="h-4 w-4 text-scoreboard-amber" />
                  {field.city}, CA
                </div>

                <div className="flex items-center gap-3">
                  <CalendarDays className="h-4 w-4 text-scoreboard-amber" />
                  {field.type}
                </div>

                <div className="flex items-center gap-3">
                  <Clock className="h-4 w-4 text-scoreboard-amber" />
                  Mock availability: 8 AM – 8 PM
                </div>
              </div>

              <Link to={`/fields/${field.id}`}>
  <Button
    className="mt-6 w-full rounded-none border border-scoreboard-cream bg-transparent font-bold uppercase tracking-[0.14em] text-scoreboard-cream hover:bg-scoreboard-cream hover:text-scoreboard-dark"
  >
    View Times
  </Button>
</Link>
            </article>
          ))}
        </div>
      </section>
    </main>
  )
}