
"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import carsData from "@/data/cars.json";
import { createCarSlug } from "@/lib/car-slug";

const STORAGE_KEY = "sheggar-wheels-cars";

function getCarId(car) {
  return String(car.id ?? "");
}

function getPublicCars() {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    const ownerCars = Array.isArray(stored) ? stored : [];

    // Owner-created versions take precedence over matching demo car IDs.
    const merged = new Map();

    carsData.forEach((car) => merged.set(getCarId(car), car));
    ownerCars.forEach((car) => merged.set(getCarId(car), car));

    return Array.from(merged.values()).filter(
      (car) => car.available !== false && car.isAvailable !== false
    );
  } catch {
    return carsData.filter(
      (car) => car.available !== false && car.isAvailable !== false
    );
  }
}

function getCarHref(car) {
  const slug = createCarSlug(car);

  // Owner-created listings use their stable ID to avoid duplicate slugs.
  if (String(car.id).startsWith("owner-car-")) {
    return `/cars/${slug}?carId=${encodeURIComponent(car.id)}`;
  }

  return `/cars/${slug}`;
}

export default function CarsPage() {
  const [cars, setCars] = useState([]);
  const [search, setSearch] = useState("");
  const [transmission, setTransmission] = useState("all");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");

  const refreshCars = useCallback(() => {
    setCars(getPublicCars());
  }, []);

  useEffect(() => {
    refreshCars();

    // Refresh when the page becomes visible again after owner edits.
    const handleFocus = () => refreshCars();
    const handleStorage = (event) => {
      if (!event.key || event.key === STORAGE_KEY) refreshCars();
    };

    window.addEventListener("focus", handleFocus);
    window.addEventListener("storage", handleStorage);

    return () => {
      window.removeEventListener("focus", handleFocus);
      window.removeEventListener("storage", handleStorage);
    };
  }, [refreshCars]);

  const transmissions = useMemo(
    () => [...new Set(cars.map((car) => car.transmission).filter(Boolean))],
    [cars]
  );

  const filteredCars = useMemo(() => {
    const query = search.trim().toLowerCase();
    const minimum = minPrice === "" ? null : Number(minPrice);
    const maximum = maxPrice === "" ? null : Number(maxPrice);

    return cars.filter((car) => {
      const matchesSearch =
        !query ||
        [
          car.make,
          car.model,
          car.year,
          car.location,
          car.description,
          car.transmission,
          car.color,
        ]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(query));

      const matchesTransmission =
        transmission === "all" || car.transmission === transmission;

      const price = Number(car.dailyPrice ?? car.pricePerDay ?? 0);

      return (
        matchesSearch &&
        matchesTransmission &&
        (minimum === null || price >= minimum) &&
        (maximum === null || price <= maximum)
      );
    });
  }, [cars, search, transmission, minPrice, maxPrice]);

  function clearFilters() {
    setSearch("");
    setTransmission("all");
    setMinPrice("");
    setMaxPrice("");
  }

  return (
    <section className="min-h-screen bg-[#F4F7FB]">
      <div className="mx-auto max-w-[1200px] px-5 py-10 sm:px-8 sm:py-14">
        <div className="max-w-2xl">
          <p className="text-sm font-semibold uppercase tracking-wider text-[#0866F5]">
            Find your next ride
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-[#252A34] sm:text-4xl">
            Browse Cars
          </h1>
          <p className="mt-3 leading-7 text-[#667085]">
            Explore available vehicles and find an option that suits your next
            journey in Addis Ababa.
          </p>
        </div>

        <div className="mt-8 rounded-2xl border border-[#E5EAF1] bg-white p-4 sm:p-5">
          <div>
            <label htmlFor="car-search" className="mb-2 block text-sm font-semibold text-[#252A34]">
              Search cars
            </label>
            <input
              id="car-search"
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search make, model, or location..."
              className="min-h-12 w-full rounded-lg border border-[#E5EAF1] px-4 text-sm text-[#252A34] outline-none transition focus:border-[#0866F5] focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <label htmlFor="transmission" className="mb-2 block text-sm font-semibold text-[#252A34]">
                Transmission
              </label>
              <select
                id="transmission"
                value={transmission}
                onChange={(event) => setTransmission(event.target.value)}
                className="min-h-12 w-full rounded-lg border border-[#E5EAF1] bg-white px-3 text-sm text-[#252A34] outline-none focus:border-[#0866F5] focus:ring-2 focus:ring-blue-100"
              >
                <option value="all">All transmissions</option>
                {transmissions.map((type) => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="min-price" className="mb-2 block text-sm font-semibold text-[#252A34]">
                Minimum price (ETB/day)
              </label>
              <input
                id="min-price"
                type="number"
                min="0"
                value={minPrice}
                onChange={(event) => setMinPrice(event.target.value)}
                placeholder="e.g. 1000"
                className="min-h-12 w-full rounded-lg border border-[#E5EAF1] px-3 text-sm text-[#252A34] outline-none focus:border-[#0866F5] focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <div>
              <label htmlFor="max-price" className="mb-2 block text-sm font-semibold text-[#252A34]">
                Maximum price (ETB/day)
              </label>
              <input
                id="max-price"
                type="number"
                min="0"
                value={maxPrice}
                onChange={(event) => setMaxPrice(event.target.value)}
                placeholder="e.g. 5000"
                className="min-h-12 w-full rounded-lg border border-[#E5EAF1] px-3 text-sm text-[#252A34] outline-none focus:border-[#0866F5] focus:ring-2 focus:ring-blue-100"
              />
            </div>
          </div>

          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-[#667085]" aria-live="polite">
              Showing {filteredCars.length} of {cars.length} available cars
            </p>
            <button
              type="button"
              onClick={clearFilters}
              className="min-h-11 rounded-lg border border-[#E5EAF1] px-5 text-sm font-semibold text-[#252A34] transition-colors hover:border-[#0866F5] hover:text-[#0866F5]"
            >
              Clear all filters
            </button>
          </div>
        </div>

        {filteredCars.length > 0 ? (
          <div className="mt-8 grid items-stretch gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filteredCars.map((car) => {
              const detailsHref = getCarHref(car);
              const price = Number(car.dailyPrice ?? car.pricePerDay ?? 0);
              const name = `${car.year || ""} ${car.make || ""} ${car.model || ""}`.trim();

              return (
                <article
                  key={car.id}
                  className="flex h-full flex-col overflow-hidden rounded-2xl border border-[#E5EAF1] bg-white transition-shadow hover:shadow-lg"
                >
                  <Link
                    href={detailsHref}
                    className="group flex flex-1 flex-col focus-visible:outline-offset-[-3px]"
                    aria-label={`View ${name}`}
                  >
                    <div className="h-52 shrink-0 overflow-hidden bg-[#F4F7FB]">
                      {car.image ? (
                        <img
                          src={car.image}
                          alt={name}
                          loading="lazy"
                          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-sm text-[#667085]">
                          Vehicle image unavailable
                        </div>
                      )}
                    </div>

                    <div className="flex flex-1 flex-col p-5">
                      <p className="text-xs font-medium text-[#667085]">
                        {car.year} · {car.location || "Addis Ababa"}
                      </p>
                      <h2 className="mt-2 min-h-[56px] text-xl font-bold text-[#252A34]">
                        {car.make} {car.model}
                      </h2>
                      <p className="mt-2 line-clamp-2 min-h-12 text-sm leading-6 text-[#667085]">
                        {car.description || "Contact the owner for more details."}
                      </p>

                      <div className="mt-auto pt-4">
                        <div className="flex min-h-8 items-baseline gap-1">
                          <span className="text-xl font-bold text-[#0866F5]">
                            ETB {price.toLocaleString("en-US")}
                          </span>
                          <span className="text-sm text-[#667085]">/ day</span>
                        </div>

                        <div className="mt-4 flex min-h-[62px] flex-wrap content-start gap-2 border-t border-[#E5EAF1] pt-4 text-xs text-[#667085]">
                          {car.seats && (
                            <span className="rounded-md bg-[#F4F7FB] px-2.5 py-1.5">{car.seats} seats</span>
                          )}
                          {car.transmission && (
                            <span className="rounded-md bg-[#F4F7FB] px-2.5 py-1.5 capitalize">{car.transmission}</span>
                          )}
                          {car.color && (
                            <span className="rounded-md bg-[#F4F7FB] px-2.5 py-1.5">{car.color}</span>
                          )}
                        </div>

                        <div className="mt-4 flex min-h-11 items-center justify-center rounded-lg border border-[#0866F5] px-4 py-2 text-sm font-semibold text-[#0866F5] transition-colors group-hover:bg-blue-50">
                          View Details
                        </div>
                      </div>
                    </div>
                  </Link>

                  <div className="px-5 pb-5">
                    <Link
                      href={`/checkout?carId=${encodeURIComponent(car.id)}`}
                      className="flex min-h-11 w-full items-center justify-center rounded-lg bg-[#0866F5] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#0754C7]"
                    >
                      Book Now →
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="mt-8 rounded-2xl border border-dashed border-[#D0D7E2] bg-white px-5 py-14 text-center">
            <h2 className="text-lg font-bold text-[#252A34]">No cars found</h2>
            <p className="mt-2 text-sm leading-6 text-[#667085]">
              Try changing your search or price filters.
            </p>
            <button
              type="button"
              onClick={clearFilters}
              className="mt-5 inline-flex min-h-11 items-center justify-center rounded-lg bg-[#0866F5] px-5 py-2 text-sm font-semibold text-white hover:bg-[#0754C7]"
            >
              Clear all filters
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
