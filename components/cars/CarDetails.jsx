
import Image from "next/image";
import Link from "next/link";
import { createCarSlug } from "@/lib/car-slug";
import CarBookingButton from "@/components/cars/CarBookingButton";

function getCarPrice(car) {
  return Number(car?.dailyPrice ?? car?.pricePerDay ?? 0);
}

function getCarHref(car) {
  const slug = createCarSlug(car);

  if (String(car.id).startsWith("owner-car-")) {
    return `/cars/${slug}?carId=${encodeURIComponent(car.id)}`;
  }

  return `/cars/${slug}`;
}

export default function CarDetails({ car, otherCars }) {
  const carHref = getCarHref(car);

  const specifications = [
    ["Year", car.year],
    ["Location", car.location],
    ["Seats", car.seats ? `${car.seats} seats` : null],
    ["Transmission", car.transmission],
    ["Color", car.color],
  ];

  return (
    <section className="min-h-screen bg-[#F4F7FB]">
      <div className="mx-auto max-w-[1280px] px-5 py-8 sm:px-8 sm:py-10">
        <Link
          href="/cars"
          className="inline-flex min-h-11 items-center text-sm font-semibold text-[#0866F5] transition-colors hover:text-[#0754C7]"
        >
          ← Back to Browse Cars
        </Link>

        <div className="mt-6 grid items-start gap-6 lg:grid-cols-12 lg:gap-8">
          {/* Main car information */}
          <div className="min-w-0 space-y-6 lg:col-span-8">
            {/* Main image */}
            <div className="relative h-64 overflow-hidden rounded-2xl border border-[#E5EAF1] bg-white sm:h-[420px]">
              <Image
                src={car.image}
                alt={`${car.year} ${car.make} ${car.model}`}
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 66vw"
                className="object-cover"
              />
            </div>

            {/* Car overview */}
            <div className="rounded-2xl border border-[#E5EAF1] bg-white p-6 sm:p-8">
              <p className="text-sm font-semibold uppercase tracking-wider text-[#0866F5]">
                {car.year} · {car.location}
              </p>

              <h1 className="mt-3 text-3xl font-bold tracking-tight text-[#252A34] sm:text-4xl">
                {car.make} {car.model}
              </h1>

              <div className="mt-6 border-t border-[#E5EAF1] pt-6">
                <h2 className="text-lg font-bold text-[#252A34]">
                  About this car
                </h2>

                <p className="mt-3 leading-7 text-[#667085]">
                  {car.description ||
                    "Contact the owner for more information about this car."}
                </p>
              </div>
            </div>

            {/* Specifications */}
            <div className="rounded-2xl border border-[#E5EAF1] bg-white p-6 sm:p-8">
              <h2 className="text-lg font-bold text-[#252A34]">
                Car Specifications
              </h2>

              <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
                {specifications.map(([label, value]) => (
                  <div
                    key={label}
                    className="rounded-xl border border-[#E5EAF1] bg-[#F4F7FB] p-4"
                  >
                    <p className="text-xs font-medium text-[#667085]">
                      {label}
                    </p>
                    <p className="mt-2 font-semibold text-[#252A34]">
                      {value || "Not specified"}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Booking panel */}
          <aside className="lg:sticky lg:top-24 lg:col-span-4">
            <div className="rounded-2xl border border-[#E5EAF1] bg-white p-6 shadow-sm sm:p-7">
              <p className="text-sm font-medium text-[#667085]">
                Rental price
              </p>

              <div className="mt-2 flex flex-wrap items-baseline gap-2">
                <span className="text-3xl font-bold text-[#0866F5]">
                  ETB {getCarPrice(car).toLocaleString("en-US")}
                </span>
                <span className="text-sm text-[#667085]">/ day</span>
              </div>

              <div className="my-6 border-t border-[#E5EAF1]" />

              <div className="space-y-3 text-sm">
                <div className="flex justify-between gap-4">
                  <span className="text-[#667085]">Vehicle</span>
                  <span className="text-right font-semibold text-[#252A34]">
                    {car.make} {car.model}
                  </span>
                </div>

                <div className="flex justify-between gap-4">
                  <span className="text-[#667085]">Year</span>
                  <span className="font-semibold text-[#252A34]">
                    {car.year}
                  </span>
                </div>

                <div className="flex justify-between gap-4">
                  <span className="text-[#667085]">Location</span>
                  <span className="text-right font-semibold text-[#252A34]">
                    {car.location}
                  </span>
                </div>
              </div>

              <div className="mt-7">
                <CarBookingButton car={car} carHref={carHref} />
              </div>

              <p className="mt-4 text-center text-xs leading-5 text-[#667085]">
                Demo listing only. Price and availability are not confirmed
                rental offers.
              </p>
            </div>
          </aside>
        </div>

        {/* Similar cars */}
        {otherCars.length > 0 && (
          <div className="mt-14">
            <h2 className="text-2xl font-bold text-[#252A34]">
              You may also like
            </h2>

            <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {otherCars.map((otherCar) => (
                <Link
                  key={otherCar.id}
                  href={getCarHref(otherCar)}
                  className="group overflow-hidden rounded-2xl border border-[#E5EAF1] bg-white transition-shadow hover:shadow-lg"
                >
                  <div className="relative h-48 bg-[#F4F7FB]">
                    <Image
                      src={otherCar.image}
                      alt={`${otherCar.year} ${otherCar.make} ${otherCar.model}`}
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      className="object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  </div>

                  <div className="p-5">
                    <p className="text-xs text-[#667085]">
                      {otherCar.year} · {otherCar.location}
                    </p>

                    <h3 className="mt-2 text-lg font-bold text-[#252A34]">
                      {otherCar.make} {otherCar.model}
                    </h3>

                    <p className="mt-3 font-bold text-[#0866F5]">
                      ETB {getCarPrice(otherCar).toLocaleString("en-US")}
                      <span className="ml-1 text-sm font-normal text-[#667085]">
                        / day
                      </span>
                    </p>

                    <p className="mt-4 text-sm font-semibold text-[#0866F5]">
                      View Details →
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
