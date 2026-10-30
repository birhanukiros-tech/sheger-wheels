"use client";

import Link from "next/link";
import Image from "next/image";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import carsData from "@/data/cars.json";
import { createCarSlug } from "@/lib/car-slug";

const STORAGE_KEY = "sheggar-wheels-cars";
const CARS_PER_PAGE = 6;

function getCarId(car) {
  return String(car.id ?? "");
}

function getPublicCars() {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    const ownerCars = Array.isArray(stored) ? stored : [];

    const merged = new Map();

    carsData.forEach((car) => merged.set(getCarId(car), car));
    ownerCars.forEach((car) => {
      if (car?.id) merged.set(getCarId(car), car);
    });

    return Array.from(merged.values()).filter(
      (car) => car.available !== false && car.isAvailable !== false,
    );
  } catch {
    return carsData.filter(
      (car) => car.available !== false && car.isAvailable !== false,
    );
  }
}

function getCarHref(car, currentPage = 1) {
  const slug = createCarSlug(car);
  const params = new URLSearchParams();

  if (String(car.id).startsWith("owner-car-")) {
    params.set("carId", car.id);
  }

  if (currentPage > 1) {
    params.set("page", String(currentPage));
  }

  const query = params.toString();

  return query ? `/cars/${slug}?${query}` : `/cars/${slug}`;
}

function getPrice(car) {
  return Number(car.dailyPrice ?? car.pricePerDay ?? 0);
}

export default function CarsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [cars, setCars] = useState([]);

  // The URL is the source of truth for filters and pagination.
  const search = searchParams.get("search") || "";
  const transmission = searchParams.get("transmission") || "all";
  const fuelType = searchParams.get("fuel") || "all";
  const seats = searchParams.get("seats") || "all";
  const minPrice = searchParams.get("minPrice") || "";
  const maxPrice = searchParams.get("maxPrice") || "";
  const sort = searchParams.get("sort") || "newest";

  const requestedPage = Number(searchParams.get("page") || 1);
  const page =
    Number.isInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1;

  const refreshCars = useCallback(() => {
    setCars(getPublicCars());
  }, []);

  // Load cars and refresh when owner listings change.
  useEffect(() => {
    let timeoutId;

    const handleFocus = () => refreshCars();

    const handleStorage = (event) => {
      if (!event.key || event.key === STORAGE_KEY) {
        refreshCars();
      }
    };

    timeoutId = window.setTimeout(() => {
      refreshCars();
      window.addEventListener("focus", handleFocus);
      window.addEventListener("storage", handleStorage);
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
      window.removeEventListener("focus", handleFocus);
      window.removeEventListener("storage", handleStorage);
    };
  }, [refreshCars]);

  // Update the URL whenever a filter or page changes.
  const updateURL = useCallback(
    (updates) => {
      const params = new URLSearchParams(searchParams.toString());

      Object.entries(updates).forEach(([key, value]) => {
        if (
          value === "" ||
          value === "all" ||
          (key === "page" && value === 1) ||
          (key === "sort" && value === "newest")
        ) {
          params.delete(key);
        } else {
          params.set(key, String(value));
        }
      });

      const query = params.toString();
      router.replace(query ? `/cars?${query}` : "/cars", {
        scroll: false,
      });
    },
    [router, searchParams],
  );

  const transmissions = useMemo(
    () => [...new Set(cars.map((car) => car.transmission).filter(Boolean))],
    [cars],
  );

  const fuelTypes = useMemo(
    () => [...new Set(cars.map((car) => car.fuelType).filter(Boolean))],
    [cars],
  );

  const seatOptions = useMemo(
    () =>
      [
        ...new Set(
          cars.map((car) => Number(car.seats)).filter(Number.isFinite),
        ),
      ].sort((a, b) => a - b),
    [cars],
  );

  const filteredCars = useMemo(() => {
    const query = search.trim().toLowerCase();
    const minimum = minPrice === "" ? null : Number(minPrice);
    const maximum = maxPrice === "" ? null : Number(maxPrice);

    const results = cars.filter((car) => {
      const matchesSearch =
        !query ||
        [
          car.make,
          car.model,
          car.year,
          car.location,
          car.description,
          car.transmission,
          car.fuelType,
          car.color,
        ]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(query));

      const matchesTransmission =
        transmission === "all" || car.transmission === transmission;

      const matchesFuel = fuelType === "all" || car.fuelType === fuelType;

      const matchesSeats =
        seats === "all" || Number(car.seats) === Number(seats);

      const price = getPrice(car);

      const matchesMinimum =
        minimum === null || (Number.isFinite(minimum) && price >= minimum);

      const matchesMaximum =
        maximum === null || (Number.isFinite(maximum) && price <= maximum);

      return (
        matchesSearch &&
        matchesTransmission &&
        matchesFuel &&
        matchesSeats &&
        matchesMinimum &&
        matchesMaximum
      );
    });

    return results.sort((a, b) => {
      switch (sort) {
        case "price-low":
          return getPrice(a) - getPrice(b);

        case "price-high":
          return getPrice(b) - getPrice(a);

        case "year-new":
          return Number(b.year || 0) - Number(a.year || 0);

        case "year-old":
          return Number(a.year || 0) - Number(b.year || 0);

        case "newest":
        default:
          return 0;
      }
    });
  }, [cars, search, transmission, fuelType, seats, minPrice, maxPrice, sort]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredCars.length / CARS_PER_PAGE),
  );

  const currentPage = Math.min(page, totalPages);

  const paginatedCars = useMemo(() => {
    const startIndex = (currentPage - 1) * CARS_PER_PAGE;

    return filteredCars.slice(startIndex, startIndex + CARS_PER_PAGE);
  }, [filteredCars, currentPage]);

  const firstResult =
    filteredCars.length === 0 ? 0 : (currentPage - 1) * CARS_PER_PAGE + 1;

  const lastResult = Math.min(currentPage * CARS_PER_PAGE, filteredCars.length);

  function handleFilterChange(key, value) {
    updateURL({
      [key]: value,
      page: 1,
    });
  }

  function handlePageChange(nextPage) {
    const safePage = Math.max(1, Math.min(nextPage, totalPages));

    updateURL({ page: safePage });

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  function clearFilters() {
    router.replace("/cars", { scroll: false });
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

        {/* Search and filters */}
        <div className="mt-8 rounded-2xl border border-[#E5EAF1] bg-white p-4 sm:p-5">
          <div>
            <label
              htmlFor="car-search"
              className="mb-2 block text-sm font-semibold text-[#252A34]"
            >
              Search cars
            </label>

            <input
              id="car-search"
              type="search"
              value={search}
              onChange={(event) =>
                handleFilterChange("search", event.target.value)
              }
              placeholder="Search make, model, or location..."
              className="min-h-12 w-full rounded-lg border border-[#E5EAF1] px-4 text-sm text-[#252A34] outline-none transition focus:border-[#0866F5] focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <label
                htmlFor="transmission"
                className="mb-2 block text-sm font-semibold text-[#252A34]"
              >
                Transmission
              </label>

              <select
                id="transmission"
                value={transmission}
                onChange={(event) =>
                  handleFilterChange("transmission", event.target.value)
                }
                className="min-h-12 w-full rounded-lg border border-[#E5EAF1] bg-white px-3 text-sm text-[#252A34] outline-none focus:border-[#0866F5] focus:ring-2 focus:ring-blue-100"
              >
                <option value="all">All transmissions</option>

                {transmissions.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="fuel"
                className="mb-2 block text-sm font-semibold text-[#252A34]"
              >
                Fuel type
              </label>

              <select
                id="fuel"
                value={fuelType}
                onChange={(event) =>
                  handleFilterChange("fuel", event.target.value)
                }
                className="min-h-12 w-full rounded-lg border border-[#E5EAF1] bg-white px-3 text-sm text-[#252A34] outline-none focus:border-[#0866F5] focus:ring-2 focus:ring-blue-100"
              >
                <option value="all">All fuel types</option>

                {fuelTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="seats"
                className="mb-2 block text-sm font-semibold text-[#252A34]"
              >
                Number of seats
              </label>

              <select
                id="seats"
                value={seats}
                onChange={(event) =>
                  handleFilterChange("seats", event.target.value)
                }
                className="min-h-12 w-full rounded-lg border border-[#E5EAF1] bg-white px-3 text-sm text-[#252A34] outline-none focus:border-[#0866F5] focus:ring-2 focus:ring-blue-100"
              >
                <option value="all">All seat counts</option>

                {seatOptions.map((count) => (
                  <option key={count} value={count}>
                    {count} seats
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="min-price"
                className="mb-2 block text-sm font-semibold text-[#252A34]"
              >
                Minimum price (ETB/day)
              </label>

              <input
                id="min-price"
                type="number"
                min="0"
                value={minPrice}
                onChange={(event) =>
                  handleFilterChange("minPrice", event.target.value)
                }
                placeholder="e.g. 1000"
                className="min-h-12 w-full rounded-lg border border-[#E5EAF1] px-3 text-sm text-[#252A34] outline-none focus:border-[#0866F5] focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <div>
              <label
                htmlFor="max-price"
                className="mb-2 block text-sm font-semibold text-[#252A34]"
              >
                Maximum price (ETB/day)
              </label>

              <input
                id="max-price"
                type="number"
                min="0"
                value={maxPrice}
                onChange={(event) =>
                  handleFilterChange("maxPrice", event.target.value)
                }
                placeholder="e.g. 5000"
                className="min-h-12 w-full rounded-lg border border-[#E5EAF1] px-3 text-sm text-[#252A34] outline-none focus:border-[#0866F5] focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <div>
              <label
                htmlFor="sort"
                className="mb-2 block text-sm font-semibold text-[#252A34]"
              >
                Sort by
              </label>

              <select
                id="sort"
                value={sort}
                onChange={(event) =>
                  handleFilterChange("sort", event.target.value)
                }
                className="min-h-12 w-full rounded-lg border border-[#E5EAF1] bg-white px-3 text-sm text-[#252A34] outline-none focus:border-[#0866F5] focus:ring-2 focus:ring-blue-100"
              >
                <option value="newest">Default order</option>
                <option value="price-low">Price: Low to high</option>
                <option value="price-high">Price: High to low</option>
                <option value="year-new">Year: Newest first</option>
                <option value="year-old">Year: Oldest first</option>
              </select>
            </div>
          </div>

          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-[#667085]" aria-live="polite">
              Showing {firstResult}–{lastResult} of {filteredCars.length}{" "}
              matching cars ({cars.length} available)
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

        {/* Car listings */}
        {paginatedCars.length > 0 ? (
          <div className="mt-8 grid items-stretch gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {paginatedCars.map((car) => {
              const detailsHref = getCarHref(car, currentPage);
              const price = getPrice(car);

              const name =
                `${car.year || ""} ${car.make || ""} ${car.model || ""}`.trim();

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
                    <div className="relative h-52 shrink-0 overflow-hidden bg-[#F4F7FB]">
                      {car.image ? (
                        <Image
                          src={car.image}
                          alt={name}
                          fill
                          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                          className="object-cover transition-transform duration-300 group-hover:scale-105"
                          unoptimized
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
                        {car.description ||
                          "Contact the owner for more details."}
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
                            <span className="rounded-md bg-[#F4F7FB] px-2.5 py-1.5">
                              {car.seats} seats
                            </span>
                          )}

                          {car.transmission && (
                            <span className="rounded-md bg-[#F4F7FB] px-2.5 py-1.5 capitalize">
                              {car.transmission}
                            </span>
                          )}

                          {car.color && (
                            <span className="rounded-md bg-[#F4F7FB] px-2.5 py-1.5">
                              {car.color}
                            </span>
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
              Try changing your search or filters.
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

        {/* Pagination */}
        {filteredCars.length > 0 && (
          <nav
            aria-label="Car listing pages"
            className="mt-10 flex flex-wrap items-center justify-center gap-2"
          >
            <button
              type="button"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="min-h-10 rounded-lg border border-[#E5EAF1] bg-white px-4 text-sm font-semibold text-[#252A34] transition hover:border-[#0866F5] hover:text-[#0866F5] disabled:cursor-not-allowed disabled:opacity-40"
            >
              Previous
            </button>

            {Array.from({ length: totalPages }, (_, index) => index + 1).map(
              (pageNumber) => (
                <button
                  key={pageNumber}
                  type="button"
                  onClick={() => handlePageChange(pageNumber)}
                  aria-current={currentPage === pageNumber ? "page" : undefined}
                  className={`min-h-10 min-w-10 rounded-lg border px-3 text-sm font-semibold transition ${
                    currentPage === pageNumber
                      ? "border-[#0866F5] bg-[#0866F5] text-white"
                      : "border-[#E5EAF1] bg-white text-[#252A34] hover:border-[#0866F5] hover:text-[#0866F5]"
                  }`}
                >
                  {pageNumber}
                </button>
              ),
            )}

            <button
              type="button"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="min-h-10 rounded-lg border border-[#E5EAF1] bg-white px-4 text-sm font-semibold text-[#252A34] transition hover:border-[#0866F5] hover:text-[#0866F5] disabled:cursor-not-allowed disabled:opacity-40"
            >
              Next
            </button>
          </nav>
        )}
      </div>
    </section>
  );
}
