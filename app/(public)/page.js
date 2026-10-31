
import Image from "next/image";
import Link from "next/link";
import cars from "@/data/cars.json";
import { createCarSlug } from "@/lib/car-slug";

const heroImage = "/images/hero/hero-car.jpg";

export const metadata = {
  title: "Find Cars for Rent in Addis Ababa",
  description:
    "Explore Sheggar Wheels and discover cars available for rent in Addis Ababa, Ethiopia. Compare demo vehicles, explore prices, and find a ride for your next journey.",

  alternates: {
    canonical: "/",
  },

  openGraph: {
    title: "Find Cars for Rent in Addis Ababa | Sheggar Wheels",
    description:
      "Explore available demo cars, compare prices, and discover your next ride in Addis Ababa.",
    url: "/",
    type: "website",
    images: [
      {
        url: heroImage,
        width: 1200,
        height: 800,
        alt: "Find your next ride with Sheggar Wheels",
      },
    ],
  },

  twitter: {
    card: "summary_large_image",
    title: "Find Cars for Rent in Addis Ababa | Sheggar Wheels",
    description:
      "Explore available demo cars, compare prices, and discover your next ride in Addis Ababa.",
    images: [heroImage],
  },
};

export default function Home() {
  const featuredCars = cars.slice(0, 4);

  return (
    <>
      {/* Hero section */}
      <section className="relative isolate flex min-h-[540px] items-center overflow-hidden bg-[#172033] sm:min-h-[580px] lg:min-h-[620px]">
        <Image
          src={heroImage}
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover object-center"
        />

        {/* Lighter overlay keeps the car image visible */}
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-r from-[#101827]/75 via-[#101827]/45 to-[#101827]/15"
        />
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-t from-[#101827]/25 via-transparent to-transparent"
        />

        <div className="relative z-10 mx-auto w-full max-w-[1200px] px-5 py-14 sm:px-8 sm:py-16 lg:py-20">
          <div className="max-w-2xl">
            <p className="mb-5 inline-flex items-center rounded-full border border-white/30 bg-white/15 px-4 py-2 text-sm font-semibold text-white backdrop-blur-sm">
              Your journey, your way
            </p>

            <h1 className="text-4xl font-bold leading-tight tracking-tight text-white sm:text-5xl lg:text-6xl">
              Find the right car for your{" "}
              <span className="text-[#8DBBFF]">next journey.</span>
            </h1>

            <p className="mt-5 max-w-xl text-base leading-7 text-white/90 sm:text-lg sm:leading-8">
              Discover cars available for rent in Addis Ababa. Compare your
              options and find a ride that fits your plans, comfort, and budget.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/cars"
                className="inline-flex min-h-12 items-center justify-center rounded-lg bg-[#0866F5] px-7 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-950/20 transition-colors hover:bg-[#0754C7] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
              >
                Browse Cars
              </Link>

              <Link
                href="/signup"
                className="inline-flex min-h-12 items-center justify-center rounded-lg border border-white/70 bg-white px-7 py-3 text-sm font-semibold text-[#0866F5] shadow-md transition-colors hover:bg-blue-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
              >
                Get Started
              </Link>
            </div>

            <div className="mt-8 flex flex-wrap items-center gap-x-7 gap-y-3 text-sm text-white">
              <span className="flex items-center gap-2">
                <span
                  aria-hidden="true"
                  className="h-2 w-2 rounded-full bg-green-400"
                />
                Flexible car choices
              </span>

              <span className="flex items-center gap-2">
                <span
                  aria-hidden="true"
                  className="h-2 w-2 rounded-full bg-green-400"
                />
                Simple demo booking
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Featured cars section */}
      <section
        className="bg-[#F4F7FB] py-10 sm:py-12 lg:py-14"
        aria-labelledby="featured-cars-heading"
      >
        <div className="mx-auto max-w-[1200px] px-5 sm:px-8">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wider text-[#0866F5]">
                Explore our collection
              </p>

              <h2
                id="featured-cars-heading"
                className="mt-2 text-3xl font-bold tracking-tight text-[#252A34] sm:text-4xl"
              >
                Featured Cars
              </h2>

              <p className="mt-2 max-w-xl leading-7 text-[#667085]">
                Discover a selection of demo vehicles for different journeys
                and budgets.
              </p>
            </div>

            <Link
              href="/cars"
              className="inline-flex min-h-11 items-center gap-2 self-start text-sm font-semibold text-[#0866F5] transition-colors hover:text-[#0754C7] focus-visible:rounded focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#0866F5] sm:self-auto"
            >
              View all cars
              <span aria-hidden="true">→</span>
            </Link>
          </div>

          <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {featuredCars.map((car) => (
              <article
                key={car.id}
                className="group flex h-full flex-col overflow-hidden rounded-2xl border border-[#E5EAF1] bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-slate-200/70 motion-reduce:transform-none motion-reduce:transition-none"
              >
                <Link
                  href={`/cars/${createCarSlug(car)}`}
                  className="flex flex-1 flex-col focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-3px] focus-visible:outline-[#0866F5]"
                  aria-label={`View ${car.year} ${car.make} ${car.model}`}
                >
                  {/* Car image: dimensions and presentation preserved */}
                  <div className="relative h-48 shrink-0 overflow-hidden bg-[#F4F7FB]">
                    <Image
                      src={car.image}
                      alt={`${car.year} ${car.make} ${car.model}`}
                      width={600}
                      height={400}
                      sizes="(max-width: 639px) 100vw, (max-width: 1023px) 50vw, 25vw"
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105 motion-reduce:transition-none"
                    />
                  </div>

                  {/* Compact information area */}
                  <div className="flex flex-1 flex-col p-3">
                    <p className="text-xs font-medium text-[#667085]">
                      {car.year} <span className="px-1">·</span>{" "}
                      {car.location}
                    </p>

                    <h3 className="mt-1 text-base font-bold text-[#252A34] transition-colors group-hover:text-[#0866F5]">
                      {car.make} {car.model}
                    </h3>

                    <div className="mt-2 flex items-baseline gap-1">
                      <span className="text-lg font-bold text-[#0866F5]">
                        ETB {Number(car.dailyPrice).toLocaleString("en-US")}
                      </span>

                      <span className="text-xs text-[#667085]">/ day</span>
                    </div>

                    <div className="mt-2 flex flex-wrap gap-1.5 border-t border-[#E5EAF1] pt-2 text-xs text-[#667085]">
                      <span className="rounded-md bg-[#F4F7FB] px-2 py-1">
                        {car.seats} seats
                      </span>

                      <span className="rounded-md bg-[#F4F7FB] px-2 py-1">
                        {car.transmission}
                      </span>
                    </div>

                    <div
                      aria-hidden="true"
                      className="mt-3 flex min-h-9 items-center justify-center rounded-lg border border-[#0866F5] px-3 py-2 text-xs font-semibold text-[#0866F5] transition-colors group-hover:bg-[#0866F5] group-hover:text-white"
                    >
                      View Details
                      <span className="ml-2">→</span>
                    </div>
                  </div>
                </Link>
              </article>
            ))}
          </div>

          <p className="mt-5 text-xs leading-5 text-[#667085]">
            Demo listings for project demonstration. Prices and availability
            are illustrative and are not confirmed rental offers.
          </p>
        </div>
      </section>
    </>
  );
}
