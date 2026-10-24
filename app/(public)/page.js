
import Image from "next/image";
import Link from "next/link";
import cars from "@/data/cars.json";

export default function Home() {
  const featuredCars = cars.slice(0, 4);

  return (
    <>
      {/* Hero section */}
      <section className="bg-white">
        <div className="mx-auto grid max-w-[1200px] items-center gap-8 px-5 py-8 sm:px-8 sm:py-10 lg:min-h-[560px] lg:grid-cols-2 lg:gap-12 lg:py-12">
          <div className="max-w-xl">
            <p className="mb-4 inline-flex items-center rounded-full bg-blue-50 px-4 py-2 text-sm font-semibold text-[#0866F5]">
              Your journey, your way
            </p>

            <h1 className="text-4xl font-bold leading-tight tracking-tight text-[#252A34] sm:text-5xl lg:text-6xl">
              Find the right car for your{" "}
              <span className="text-[#0866F5]">next journey.</span>
            </h1>

            <p className="mt-5 max-w-lg text-base leading-7 text-[#667085] sm:text-lg sm:leading-8">
              Discover cars available for rent in Addis Ababa. Compare your
              options and find a ride that fits your plans, comfort, and budget.
            </p>

            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/cars"
                className="inline-flex min-h-12 items-center justify-center rounded-lg bg-[#0866F5] px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#0754C7]"
              >
                Browse Cars
              </Link>

              <Link
                href="/signup"
                className="inline-flex min-h-12 items-center justify-center rounded-lg border border-[#E5EAF1] bg-white px-6 py-3 text-sm font-semibold text-[#252A34] transition-colors hover:border-[#0866F5] hover:text-[#0866F5]"
              >
                Get Started
              </Link>
            </div>

            <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-3 text-sm text-[#667085]">
              <span className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-green-500" />
                Flexible car choices
              </span>
              <span className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-green-500" />
                Simple demo booking
              </span>
            </div>
          </div>

          <div className="min-w-0">
            <div className="overflow-hidden rounded-2xl bg-[#F4F7FB] p-2 sm:p-3">
              <Image
                src="/images/hero/hero-car.jpg"
                alt="Car ready for a journey"
                width={1200}
                height={800}
                priority
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="h-[260px] w-full rounded-xl object-cover sm:h-[360px] lg:h-[410px]"
              />
            </div>

            <div className="mt-4 flex items-start gap-3 rounded-xl border border-[#E5EAF1] bg-white p-4 sm:p-5">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-[#0866F5]">
                <svg
                  aria-hidden="true"
                  viewBox="0 0 24 24"
                  fill="none"
                  className="h-6 w-6"
                >
                  <path
                    d="M3 13.5 5 7.5A2 2 0 0 1 6.9 6h10.2A2 2 0 0 1 19 7.5l2 6v4a1 1 0 0 1-1 1h-1a1 1 0 0 1-1-1v-1H6v1a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-4Z"
                    stroke="currentColor"
                    strokeWidth="1.7"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M3.5 13.5h17M7 16.5h.01M17 16.5h.01"
                    stroke="currentColor"
                    strokeWidth="1.7"
                    strokeLinecap="round"
                  />
                </svg>
              </div>

              <div className="min-w-0">
                <p className="text-base font-bold text-[#252A34] sm:text-lg">
                  Your next journey starts here
                </p>
                <p className="mt-1 text-sm leading-6 text-[#667085]">
                  Explore cars in Addis Ababa
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured cars section */}
      <section className="bg-[#F4F7FB] py-14 sm:py-16 lg:py-20">
        <div className="mx-auto max-w-[1200px] px-5 sm:px-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wider text-[#0866F5]">
                Explore our collection
              </p>
              <h2 className="mt-2 text-3xl font-bold tracking-tight text-[#252A34] sm:text-4xl">
                Featured Cars
              </h2>
              <p className="mt-3 max-w-xl leading-7 text-[#667085]">
                Discover a selection of demo vehicles for different journeys
                and budgets.
              </p>
            </div>

            <Link
              href="/cars"
              className="inline-flex min-h-11 items-center gap-2 self-start text-sm font-semibold text-[#0866F5] transition-colors hover:text-[#0754C7] sm:self-auto"
            >
              View all cars
              <span aria-hidden="true">→</span>
            </Link>
          </div>

          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {featuredCars.map((car) => (
              <article
                key={car.id}
                className="overflow-hidden rounded-2xl border border-[#E5EAF1] bg-white transition-shadow hover:shadow-lg"
              >
                <Link
                  href={`/cars/${car.id}`}
                  className="group block focus-visible:outline-offset-[-3px]"
                  aria-label={`View ${car.year} ${car.make} ${car.model}`}
                >
                  <div className="relative overflow-hidden bg-[#F4F7FB]">
                    <Image
                      src={car.image}
                      alt={`${car.year} ${car.make} ${car.model}`}
                      width={600}
                      height={400}
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                      className="h-48 w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  </div>

                  <div className="p-5">
                    <p className="text-xs font-medium text-[#667085]">
                      {car.year} · {car.location}
                    </p>

                    <h3 className="mt-2 text-lg font-bold text-[#252A34]">
                      {car.make} {car.model}
                    </h3>

                    <div className="mt-4 flex items-baseline gap-1">
                      <span className="text-xl font-bold text-[#0866F5]">
                        ETB {Number(car.dailyPrice).toLocaleString("en-US")}
                      </span>
                      <span className="text-sm text-[#667085]">/ day</span>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2 border-t border-[#E5EAF1] pt-4 text-xs text-[#667085]">
                      <span className="rounded-md bg-[#F4F7FB] px-2.5 py-1.5">
                        {car.seats} seats
                      </span>
                      <span className="rounded-md bg-[#F4F7FB] px-2.5 py-1.5">
                        {car.transmission}
                      </span>
                    </div>
                  </div>
                </Link>
              </article>
            ))}
          </div>

          <p className="mt-6 text-xs leading-5 text-[#667085]">
            Demo listings for project demonstration. Prices and availability
            are illustrative and are not confirmed rental offers.
          </p>
        </div>
      </section>
    </>
  );
}
