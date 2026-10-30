
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

  return (
    <section className="min-h-screen bg-[#F4F7FB]">
      <div className="mx-auto max-w-[1200px] px-5 py-8 sm:px-8 sm:py-12">
        <Link
          href="/cars"
          className="inline-flex min-h-11 items-center text-sm font-semibold text-[#0866F5] hover:text-[#0754C7]"
        >
          ← Back to Browse Cars
        </Link>

        <div className="mt-6 overflow-hidden rounded-2xl border border-[#E5EAF1] bg-white">
          <div className="grid lg:grid-cols-2">
            <div className="relative min-h-64 bg-[#F4F7FB] sm:min-h-96">
              <Image
                src={car.image}
                alt={`${car.year} ${car.make} ${car.model}`}
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover"
              />
            </div>

            <div className="flex flex-col p-6 sm:p-8 lg:p-10">
              <p className="text-sm font-semibold uppercase tracking-wider text-[#0866F5]">
                {car.year} · {car.location}
              </p>

              <h1 className="mt-3 text-3xl font-bold tracking-tight text-[#252A34] sm:text-4xl">
                {car.make} {car.model}
              </h1>

              <p className="mt-5 text-2xl font-bold text-[#0866F5]">
                ETB {getCarPrice(car).toLocaleString("en-US")}
                <span className="ml-2 text-sm font-normal text-[#667085]">
                  per day
                </span>
              </p>

              <p className="mt-6 leading-7 text-[#667085]">
                {car.description ||
                  "Contact the owner for more information about this car."}
              </p>

              <div className="mt-7 grid grid-cols-2 gap-3">
                {[
                  ["Year", car.year],
                  ["Location", car.location],
                  ["Seats", car.seats ? `${car.seats} seats` : null],
                  ["Transmission", car.transmission],
                  ["Color", car.color],
                ].map(([label, value]) => (
                  <div
                    key={label}
                    className="rounded-xl border border-[#E5EAF1] bg-[#F4F7FB] p-4"
                  >
                    <p className="text-xs text-[#667085]">{label}</p>
                    <p className="mt-1 font-semibold text-[#252A34]">
                      {value || "Not specified"}
                    </p>
                  </div>
                ))}
              </div>

              <div className="mt-auto pt-8">
                <CarBookingButton car={car} carHref={carHref} />

                <p className="mt-3 text-center text-xs leading-5 text-[#667085]">
                  Demo listing only. Price and availability are not confirmed
                  rental offers.
                </p>
              </div>
            </div>
          </div>
        </div>

        {otherCars.length > 0 && (
          <div className="mt-12">
            <h2 className="text-2xl font-bold text-[#252A34]">
              You may also like
            </h2>

            <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {otherCars.map((otherCar) => (
                <Link
                  key={otherCar.id}
                  href={getCarHref(otherCar)}
                  className="overflow-hidden rounded-2xl border border-[#E5EAF1] bg-white transition-shadow hover:shadow-lg"
                >
                  <div className="relative h-48 bg-[#F4F7FB]">
                    <Image
                      src={otherCar.image}
                      alt={`${otherCar.year} ${otherCar.make} ${otherCar.model}`}
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      className="object-cover transition-transform duration-300 hover:scale-105"
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
