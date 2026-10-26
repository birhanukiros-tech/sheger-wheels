"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { formatCurrency } from "@/lib/format";
import carsData from "@/data/cars.json";

function getOwnerCars(owner) {
  try {
    const storedCars = JSON.parse(
      localStorage.getItem("sheggar-wheels-cars") || "[]"
    );

    const allCars = [...carsData, ...storedCars];

    const uniqueCars = allCars.filter(
      (car, index, list) =>
        list.findIndex((item) => String(item.id) === String(car.id)) === index
    );

    return uniqueCars.filter(
      (car) =>
        String(car.ownerId) === String(owner.id) ||
        String(car.ownerEmail || "").toLowerCase() ===
          String(owner.email || "").toLowerCase()
    );
  } catch {
    return [];
  }
}

function getCarName(car) {
  return [car.year, car.make, car.model].filter(Boolean).join(" ") || "Vehicle";
}

function getAvailability(car) {
  if (car.available === false || car.isAvailable === false) {
    return { label: "Unavailable", className: "bg-slate-100 text-slate-600" };
  }

  return { label: "Listed", className: "bg-emerald-50 text-emerald-700" };
}

export default function OwnerCarsPage() {
  const [cars, setCars] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const owner = getCurrentUser();

    if (owner?.role === "owner") {
      setCars(getOwnerCars(owner));
    }

    setLoading(false);
  }, []);

  if (loading) {
    return (
      <main className="flex min-h-[50vh] items-center justify-center px-4">
        <p className="text-sm text-slate-500">Loading your vehicles...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wider text-blue-600">
              Owner workspace
            </p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
              My Cars
            </h1>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              View your vehicle listings and manage their details and
              availability.
            </p>
          </div>

          <Link
            href="/owner/cars/new"
            className="inline-flex min-h-11 items-center justify-center rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
          >
            + Add a car
          </Link>
        </header>

        <section className="mt-7 grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Total vehicles</p>
            <p className="mt-2 text-3xl font-bold text-slate-900">
              {cars.length}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Listed vehicles</p>
            <p className="mt-2 text-3xl font-bold text-emerald-700">
              {cars.filter(
                (car) => car.available !== false && car.isAvailable !== false
              ).length}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Unavailable vehicles</p>
            <p className="mt-2 text-3xl font-bold text-slate-700">
              {cars.filter(
                (car) => car.available === false || car.isAvailable === false
              ).length}
            </p>
          </div>
        </section>

        {cars.length === 0 ? (
          <section className="mt-7 rounded-2xl border border-dashed border-slate-300 bg-white px-5 py-14 text-center">
            <div className="text-5xl" aria-hidden="true">
              🚘
            </div>
            <h2 className="mt-4 text-xl font-bold text-slate-900">
              No vehicles linked to your account yet
            </h2>
            <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-slate-600">
              Once a vehicle is associated with your owner account, it will
              appear here. You can start by creating a new listing.
            </p>
            <Link
              href="/owner/cars/new"
              className="mt-6 inline-flex min-h-11 items-center justify-center rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
            >
              Add your first car
            </Link>
          </section>
        ) : (
          <section className="mt-7 grid grid-cols-1 gap-6 md:grid-cols-2 2xl:grid-cols-3">
            {cars.map((car) => {
              const availability = getAvailability(car);

              return (
                <article
                  key={car.id}
                  className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                >
                  <div className="relative h-56 overflow-hidden bg-slate-100 sm:h-60">
                    {car.image ? (
                      <img
                        src={car.image}
                        alt={getCarName(car)}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-5xl">
                        🚘
                      </div>
                    )}

                    <span
                      className={`absolute right-3 top-3 rounded-full px-3 py-1.5 text-xs font-semibold ${availability.className}`}
                    >
                      {availability.label}
                    </span>
                  </div>

                  <div className="p-5">
                    <h2 className="text-lg font-bold text-slate-900">
                      {getCarName(car)}
                    </h2>

                    <p className="mt-1 text-sm text-slate-500">
                      {car.location || "Location not specified"}
                    </p>

                    <p className="mt-4 text-xl font-bold text-blue-700">
                      {formatCurrency(car.dailyPrice ?? car.pricePerDay ?? 0)}
                      <span className="ml-1 text-sm font-normal text-slate-500">
                        / day
                      </span>
                    </p>

                    <div className="mt-4 flex flex-wrap gap-2 text-xs text-slate-600">
                      {car.transmission && (
                        <span className="rounded-full bg-slate-100 px-3 py-1.5 capitalize">
                          {car.transmission}
                        </span>
                      )}
                      {car.seats && (
                        <span className="rounded-full bg-slate-100 px-3 py-1.5">
                          {car.seats} seats
                        </span>
                      )}
                      {car.color && (
                        <span className="rounded-full bg-slate-100 px-3 py-1.5">
                          {car.color}
                        </span>
                      )}
                    </div>

                    <div className="mt-5 grid grid-cols-2 gap-3">
                      <Link
                        href={`/owner/cars/${encodeURIComponent(car.id)}/edit`}
                        className="inline-flex min-h-10 items-center justify-center rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:border-blue-500 hover:text-blue-700"
                      >
                        Edit details
                      </Link>

                      <Link
                        href={`/owner/cars/${encodeURIComponent(car.id)}/availability`}
                        className="inline-flex min-h-10 items-center justify-center rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
                      >
                        Availability
                      </Link>

                      <Link
                        href={`/owner/cars/${encodeURIComponent(car.id)}/bookings`}
                        className="col-span-2 inline-flex min-h-10 items-center justify-center rounded-lg bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-200"
                      >
                        View bookings →
                      </Link>
                    </div>
                  </div>
                </article>
              );
            })}
          </section>
        )}

        <p className="mt-7 text-xs leading-5 text-slate-500">
          Vehicle listings are read from the demo car data and browser storage.
          Only vehicles linked to the signed-in owner are shown.
        </p>
      </div>
    </main>
  );
}
