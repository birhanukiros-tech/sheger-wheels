
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import cars from "@/data/cars.json";
import { createCarSlug } from "@/lib/car-slug";

function getCarBySlug(slug) {
  return cars.find((car) => createCarSlug(car) === slug);
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const car = getCarBySlug(slug);

  if (!car) {
    return {
      title: "Car Not Found",
    };
  }

  return {
    title: `${car.year} ${car.make} ${car.model}`,
    description: car.description,
  };
}

export default async function CarDetailsPage({ params }) {
  const { slug } = await params;
  const car = getCarBySlug(slug);

  if (!car) {
    notFound();
  }

  const otherCars = cars
    .filter((item) => item.id !== car.id)
    .slice(0, 3);

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
            <div className="min-h-64 bg-[#F4F7FB] sm:min-h-96">
              <Image
                src={car.image}
                alt={`${car.year} ${car.make} ${car.model}`}
                width={900}
                height={650}
                priority
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="h-full max-h-[520px] w-full object-cover"
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
                ETB {Number(car.dailyPrice).toLocaleString("en-US")}
                <span className="ml-2 text-sm font-normal text-[#667085]">
                  per day
                </span>
              </p>

              <p className="mt-6 leading-7 text-[#667085]">
                {car.description}
              </p>

              <div className="mt-7 grid grid-cols-2 gap-3">
                {[
                  ["Year", car.year],
                  ["Location", car.location],
                  ["Seats", `${car.seats} seats`],
                  ["Transmission", car.transmission],
                  ["Color", car.color],
                ].map(([label, value]) => (
                  <div
                    key={label}
                    className="rounded-xl border border-[#E5EAF1] bg-[#F4F7FB] p-4"
                  >
                    <p className="text-xs text-[#667085]">{label}</p>
                    <p className="mt-1 font-semibold text-[#252A34]">
                      {value}
                    </p>
                  </div>
                ))}
              </div>

              <div className="mt-auto pt-8">
                <Link
                  href={`/signin?next=${encodeURIComponent(`/cars/${slug}`)}`}
                  className="flex min-h-12 w-full items-center justify-center rounded-lg bg-[#0866F5] px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#0754C7]"
                >
                  Sign in to continue
                </Link>

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
                  href={`/cars/${createCarSlug(otherCar)}`}
                  className="overflow-hidden rounded-2xl border border-[#E5EAF1] bg-white transition-shadow hover:shadow-lg"
                >
                  <div className="h-48 overflow-hidden bg-[#F4F7FB]">
                    <Image
                      src={otherCar.image}
                      alt={`${otherCar.year} ${otherCar.make} ${otherCar.model}`}
                      width={600}
                      height={400}
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      className="h-full w-full object-cover transition-transform duration-300 hover:scale-105"
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
                      ETB{" "}
                      {Number(otherCar.dailyPrice).toLocaleString("en-US")}
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
