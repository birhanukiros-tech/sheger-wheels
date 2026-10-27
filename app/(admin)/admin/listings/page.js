
"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Search,
  RefreshCw,
  CarFront,
  MapPin,
  Users,
  SlidersHorizontal,
  ExternalLink,
  CheckCircle2,
  CircleOff,
} from "lucide-react";

import carsData from "@/data/cars.json";
import { createCarSlug } from "@/lib/car-slug";

const STORAGE_KEY = "sheggar-wheels-cars";

function getCarPrice(car) {
  return Number(car?.dailyPrice ?? car?.pricePerDay ?? 0);
}

function getCarAvailability(car) {
  if (car.available === false || car.isAvailable === false) {
    return "unavailable";
  }

  if (car.status && car.status.toLowerCase() !== "available") {
    return car.status.toLowerCase();
  }

  return "available";
}

function getCarType(car) {
  return String(car.id ?? "").startsWith("owner-car-")
    ? "owner"
    : car.demo
      ? "demo"
      : "other";
}

function getCarHref(car) {
  const slug = createCarSlug(car);

  if (String(car.id).startsWith("owner-car-")) {
    return `/cars/${slug}?carId=${encodeURIComponent(car.id)}`;
  }

  return `/cars/${slug}`;
}

function getOwnerLabel(car) {
  if (car.ownerEmail) return car.ownerEmail;
  if (car.ownerName) return car.ownerName;
  if (car.ownerId) return car.ownerId;
  return "Not specified";
}

function loadListings() {
  let savedCars = [];

  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);

    if (stored) {
      const parsed = JSON.parse(stored);

      if (Array.isArray(parsed)) {
        savedCars = parsed.filter((car) => car && car.id);
      }
    }
  } catch {
    throw new Error(
      "Saved car data could not be read. Check your browser storage before making changes."
    );
  }

  // Demo data is the starting point. Saved entries override matching IDs.
  const merged = new Map();

  carsData.forEach((car) => {
    if (car?.id) merged.set(String(car.id), car);
  });

  savedCars.forEach((car) => {
    merged.set(String(car.id), car);
  });

  return Array.from(merged.values());
}

export default function AdminListingsPage() {
  const [listings, setListings] = useState([]);
  const [search, setSearch] = useState("");
  const [availabilityFilter, setAvailabilityFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const refreshListings = useCallback(() => {
    setError("");

    try {
      setListings(loadListings());
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Unable to load listings."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshListings();

    function handleStorageChange() {
      refreshListings();
    }

    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("focus", handleStorageChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("focus", handleStorageChange);
    };
  }, [refreshListings]);

  const filteredListings = useMemo(() => {
    const query = search.trim().toLowerCase();

    return listings
      .filter((car) => {
        const searchableText = [
          car.make,
          car.model,
          car.location,
          car.year,
          car.ownerId,
          car.ownerEmail,
          car.ownerName,
          car.id,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        const matchesSearch =
          !query || searchableText.includes(query);

        const availability = getCarAvailability(car);
        const matchesAvailability =
          availabilityFilter === "all" ||
          availability === availabilityFilter;

        const type = getCarType(car);
        const matchesType =
          typeFilter === "all" || type === typeFilter;

        return (
          matchesSearch &&
          matchesAvailability &&
          matchesType
        );
      })
      .sort((a, b) => {
        const aName = `${a.make ?? ""} ${a.model ?? ""}`;
        const bName = `${b.make ?? ""} ${b.model ?? ""}`;

        return aName.localeCompare(bName);
      });
  }, [listings, search, availabilityFilter, typeFilter]);

  const availableCount = listings.filter(
    (car) => getCarAvailability(car) === "available"
  ).length;

  const unavailableCount = listings.length - availableCount;

  function handleAvailabilityToggle(car) {
    const currentAvailability = getCarAvailability(car);

    if (
      currentAvailability !== "available" &&
      currentAvailability !== "unavailable"
    ) {
      setError(
        "This listing has a custom status. Review it before changing availability."
      );
      return;
    }

    const nextAvailable = currentAvailability !== "available";

    setUpdatingId(String(car.id));
    setError("");
    setNotice("");

    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      const parsed = stored ? JSON.parse(stored) : [];

      if (!Array.isArray(parsed)) {
        throw new Error("Saved car data is not in the expected format.");
      }

      const existingIndex = parsed.findIndex(
        (item) => String(item?.id) === String(car.id)
      );

      const updatedCar = {
        ...car,
        available: nextAvailable,
        isAvailable: nextAvailable,
        status: nextAvailable ? "available" : "unavailable",
      };

      // Keep the existing saved record position where possible.
      // For demo cars, save an override using the same ID.
      const nextStoredCars = [...parsed];

      if (existingIndex >= 0) {
        nextStoredCars[existingIndex] = updatedCar;
      } else {
        nextStoredCars.push(updatedCar);
      }

      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(nextStoredCars)
      );

      setListings((current) =>
        current.map((item) =>
          String(item.id) === String(car.id)
            ? updatedCar
            : item
        )
      );

      setNotice(
        `${car.make} ${car.model} is now ${
          nextAvailable ? "available" : "unavailable"
        }.`
      );
    } catch (updateError) {
      setError(
        updateError instanceof Error
          ? updateError.message
          : "Unable to update this listing."
      );
    } finally {
      setUpdatingId("");
    }
  }

  const inputClass =
    "min-h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100";

  return (
    <main className="min-h-screen bg-[#F4F7FB] px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1440px]">
        <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Link
              href="/admin"
              className="text-sm font-semibold text-[#0866F5] hover:text-[#0754C7]"
            >
              ← Back to Admin Dashboard
            </Link>

            <p className="mt-5 text-sm font-semibold uppercase tracking-wider text-[#0866F5]">
              Administration
            </p>

            <h1 className="mt-2 text-3xl font-bold tracking-tight text-[#252A34] sm:text-4xl">
              Listing Management
            </h1>

            <p className="mt-3 max-w-2xl text-sm leading-6 text-[#667085]">
              Review demo and owner-created vehicle listings and manage
              their rental availability.
            </p>
          </div>

          <button
            type="button"
            onClick={refreshListings}
            className="inline-flex min-h-11 items-center justify-center gap-2 self-start rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 sm:self-center"
          >
            <RefreshCw size={16} />
            Refresh listings
          </button>
        </div>

        <div className="mb-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-[#667085]">
                Total listings
              </p>
              <span className="rounded-xl bg-blue-50 p-3 text-[#0866F5]">
                <CarFront size={21} />
              </span>
            </div>
            <p className="mt-4 text-3xl font-bold text-[#252A34]">
              {listings.length}
            </p>
            <p className="mt-1 text-xs text-[#667085]">
              Demo and owner-created cars
            </p>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-[#667085]">
                Available
              </p>
              <span className="rounded-xl bg-emerald-50 p-3 text-emerald-700">
                <CheckCircle2 size={21} />
              </span>
            </div>
            <p className="mt-4 text-3xl font-bold text-[#252A34]">
              {availableCount}
            </p>
            <p className="mt-1 text-xs text-[#667085]">
              Marked as available for rental
            </p>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:col-span-2 xl:col-span-1">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-[#667085]">
                Unavailable
              </p>
              <span className="rounded-xl bg-amber-50 p-3 text-amber-700">
                <CircleOff size={21} />
              </span>
            </div>
            <p className="mt-4 text-3xl font-bold text-[#252A34]">
              {unavailableCount}
            </p>
            <p className="mt-1 text-xs text-[#667085]">
              Not currently available for rental
            </p>
          </section>
        </div>

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 p-5 sm:p-6">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <div>
                <h2 className="text-lg font-bold text-[#252A34]">
                  All vehicle listings
                </h2>
                <p className="mt-1 text-sm text-[#667085]">
                  {filteredListings.length} of {listings.length} listings shown
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 xl:w-[680px] xl:grid-cols-[1.5fr_1fr_1fr]">
                <label className="relative block">
                  <span className="sr-only">Search listings</span>
                  <Search
                    size={17}
                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                  <input
                    type="search"
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Search cars, owners, location..."
                    className={`${inputClass} pl-9`}
                  />
                </label>

                <label className="relative block">
                  <span className="sr-only">Filter by availability</span>
                  <SlidersHorizontal
                    size={16}
                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                  <select
                    value={availabilityFilter}
                    onChange={(event) =>
                      setAvailabilityFilter(event.target.value)
                    }
                    className={`${inputClass} pl-9`}
                  >
                    <option value="all">All availability</option>
                    <option value="available">Available</option>
                    <option value="unavailable">Unavailable</option>
                  </select>
                </label>

                <label className="block">
                  <span className="sr-only">Filter by listing type</span>
                  <select
                    value={typeFilter}
                    onChange={(event) => setTypeFilter(event.target.value)}
                    className={inputClass}
                  >
                    <option value="all">All listing types</option>
                    <option value="demo">Demo listings</option>
                    <option value="owner">Owner-created</option>
                    <option value="other">Other listings</option>
                  </select>
                </label>
              </div>
            </div>
          </div>

          {error && (
            <p
              role="alert"
              className="mx-5 mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm leading-6 text-red-700 sm:mx-6"
            >
              {error}
            </p>
          )}

          {notice && (
            <p
              role="status"
              className="mx-5 mt-5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm leading-6 text-emerald-800 sm:mx-6"
            >
              {notice}
            </p>
          )}

          {loading ? (
            <div className="px-6 py-16 text-center text-sm text-[#667085]">
              Loading vehicle listings...
            </div>
          ) : filteredListings.length === 0 ? (
            <div className="px-6 py-16 text-center">
              <CarFront
                size={34}
                className="mx-auto text-slate-300"
              />
              <h3 className="mt-4 font-bold text-[#252A34]">
                No listings found
              </h3>
              <p className="mt-2 text-sm text-[#667085]">
                Try a different search term or filter.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSearch("");
                  setAvailabilityFilter("all");
                  setTypeFilter("all");
                }}
                className="mt-4 text-sm font-semibold text-[#0866F5] hover:text-[#0754C7]"
              >
                Clear filters
              </button>
            </div>
          ) : (
            <>
              <div className="hidden overflow-x-auto lg:block">
                <table className="w-full min-w-[1050px] text-left">
                  <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                    <tr>
                      <th className="px-6 py-4 font-semibold">Vehicle</th>
                      <th className="px-6 py-4 font-semibold">Owner</th>
                      <th className="px-6 py-4 font-semibold">Location</th>
                      <th className="px-6 py-4 font-semibold">Daily price</th>
                      <th className="px-6 py-4 font-semibold">Availability</th>
                      <th className="px-6 py-4 font-semibold">Type</th>
                      <th className="px-6 py-4 font-semibold">Actions</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100">
                    {filteredListings.map((car) => {
                      const availability = getCarAvailability(car);
                      const type = getCarType(car);
                      const isUpdating = updatingId === String(car.id);

                      return (
                        <tr key={car.id} className="align-middle hover:bg-slate-50/70">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="relative h-16 w-24 shrink-0 overflow-hidden rounded-lg bg-slate-100">
                                {car.image ? (
                                  <Image
                                    src={car.image}
                                    alt={`${car.make} ${car.model}`}
                                    fill
                                    sizes="96px"
                                    className="object-cover"
                                  />
                                ) : (
                                  <CarFront
                                    size={24}
                                    className="absolute inset-0 m-auto text-slate-400"
                                  />
                                )}
                              </div>
                              <div>
                                <p className="font-bold text-[#252A34]">
                                  {car.make} {car.model}
                                </p>
                                <p className="mt-1 text-xs text-[#667085]">
                                  {car.year} · {car.id}
                                </p>
                              </div>
                            </div>
                          </td>

                          <td className="max-w-44 break-words px-6 py-4 text-sm text-slate-600">
                            {getOwnerLabel(car)}
                          </td>

                          <td className="px-6 py-4 text-sm text-slate-600">
                            <span className="inline-flex items-center gap-1.5">
                              <MapPin size={14} />
                              {car.location || "Not specified"}
                            </span>
                          </td>

                          <td className="whitespace-nowrap px-6 py-4 text-sm font-bold text-[#252A34]">
                            ETB {getCarPrice(car).toLocaleString("en-US")}
                            <span className="font-normal text-slate-500"> / day</span>
                          </td>

                          <td className="px-6 py-4">
                            <span
                              className={`inline-flex rounded-full px-3 py-1.5 text-xs font-semibold ${
                                availability === "available"
                                  ? "bg-emerald-50 text-emerald-700"
                                  : availability === "unavailable"
                                    ? "bg-amber-50 text-amber-800"
                                    : "bg-slate-100 text-slate-600"
                              }`}
                            >
                              {availability}
                            </span>
                          </td>

                          <td className="px-6 py-4">
                            <span className="rounded-lg bg-slate-100 px-2.5 py-1.5 text-xs font-medium text-slate-600">
                              {type === "owner"
                                ? "Owner-created"
                                : type === "demo"
                                  ? "Demo"
                                  : "Other"}
                            </span>
                          </td>

                          <td className="px-6 py-4">
                            <div className="flex flex-col items-start gap-2">
                              <Link
                                href={getCarHref(car)}
                                target="_blank"
                                className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#0866F5] hover:text-[#0754C7]"
                              >
                                View details <ExternalLink size={13} />
                              </Link>

                              <button
                                type="button"
                                disabled={isUpdating || !["available", "unavailable"].includes(availability)}
                                onClick={() => handleAvailabilityToggle(car)}
                                className="min-h-9 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                {isUpdating
                                  ? "Saving..."
                                  : availability === "available"
                                    ? "Mark unavailable"
                                    : "Mark available"}
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="grid gap-4 p-4 sm:p-5 lg:hidden">
                {filteredListings.map((car) => {
                  const availability = getCarAvailability(car);
                  const type = getCarType(car);
                  const isUpdating = updatingId === String(car.id);

                  return (
                    <article
                      key={car.id}
                      className="overflow-hidden rounded-xl border border-slate-200 bg-white"
                    >
                      <div className="relative h-48 bg-slate-100">
                        {car.image ? (
                          <Image
                            src={car.image}
                            alt={`${car.make} ${car.model}`}
                            fill
                            sizes="100vw"
                            className="object-cover"
                          />
                        ) : (
                          <CarFront
                            size={36}
                            className="absolute inset-0 m-auto text-slate-400"
                          />
                        )}
                        <span className="absolute left-3 top-3 rounded-full bg-white/95 px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm">
                          {type === "owner"
                            ? "Owner-created"
                            : type === "demo"
                              ? "Demo listing"
                              : "Other listing"}
                        </span>
                      </div>

                      <div className="p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <h3 className="font-bold text-[#252A34]">
                              {car.make} {car.model}
                            </h3>
                            <p className="mt-1 text-xs text-[#667085]">
                              {car.year} · {car.id}
                            </p>
                          </div>

                          <span
                            className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${
                              availability === "available"
                                ? "bg-emerald-50 text-emerald-700"
                                : availability === "unavailable"
                                  ? "bg-amber-50 text-amber-800"
                                  : "bg-slate-100 text-slate-600"
                            }`}
                          >
                            {availability}
                          </span>
                        </div>

                        <p className="mt-3 text-lg font-bold text-[#0866F5]">
                          ETB {getCarPrice(car).toLocaleString("en-US")}
                          <span className="ml-1 text-xs font-normal text-slate-500">
                            / day
                          </span>
                        </p>

                        <div className="mt-4 space-y-2 text-sm text-slate-600">
                          <p className="flex items-start gap-2">
                            <MapPin size={16} className="mt-0.5 shrink-0" />
                            {car.location || "Location not specified"}
                          </p>
                          <p className="flex items-start gap-2">
                            <Users size={16} className="mt-0.5 shrink-0" />
                            {getOwnerLabel(car)}
                          </p>
                        </div>

                        <div className="mt-5 grid grid-cols-2 gap-3 border-t border-slate-100 pt-4">
                          <Link
                            href={getCarHref(car)}
                            target="_blank"
                            className="inline-flex min-h-10 items-center justify-center gap-1 rounded-lg border border-slate-200 px-3 text-xs font-semibold text-[#0866F5] hover:bg-slate-50"
                          >
                            View details <ExternalLink size={13} />
                          </Link>

                          <button
                            type="button"
                            disabled={isUpdating || !["available", "unavailable"].includes(availability)}
                            onClick={() => handleAvailabilityToggle(car)}
                            className="min-h-10 rounded-lg bg-[#0866F5] px-3 text-xs font-semibold text-white transition hover:bg-[#0754C7] disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {isUpdating
                              ? "Saving..."
                              : availability === "available"
                                ? "Make unavailable"
                                : "Make available"}
                          </button>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            </>
          )}

          <div className="flex items-center gap-2 border-t border-slate-100 bg-slate-50 px-5 py-4 text-xs leading-5 text-slate-500 sm:px-6">
            <CarFront size={16} className="shrink-0" />
            <p>
              Demo mode: listing changes are saved in this browser's local
              storage. Availability is not the same as administrative approval.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
