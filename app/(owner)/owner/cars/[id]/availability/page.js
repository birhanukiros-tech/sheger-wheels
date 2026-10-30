
"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getBookingsByOwner } from "@/lib/bookings";
import carsData from "@/data/cars.json";
import { formatCurrency, formatDate } from "@/lib/format";

const CARS_STORAGE_KEY = "sheggar-wheels-cars";
const AVAILABILITY_STORAGE_KEY = "sheggar-wheels-availability";

function getCarName(car) {
  return [car.year, car.make, car.model].filter(Boolean).join(" ") || "Vehicle";
}

function getOwnerCars(owner) {
  try {
    const storedCars = JSON.parse(
      localStorage.getItem(CARS_STORAGE_KEY) || "[]"
    );

    const allCars = [...carsData, ...(Array.isArray(storedCars) ? storedCars : [])];
    const uniqueCars = new Map();

    allCars.forEach((car) => {
      uniqueCars.set(String(car.id), car);
    });

    return Array.from(uniqueCars.values()).filter(
      (car) =>
        String(car.ownerId) === String(owner.id) ||
        String(car.ownerEmail || "").toLowerCase() ===
          String(owner.email || "").toLowerCase()
    );
  } catch {
    return [];
  }
}

function readAvailability() {
  try {
    const saved = JSON.parse(
      localStorage.getItem(AVAILABILITY_STORAGE_KEY) || "{}"
    );

    return saved && typeof saved === "object" && !Array.isArray(saved)
      ? saved
      : {};
  } catch {
    return {};
  }
}

function toDateKey(value) {
  if (!value) return "";
  return String(value).slice(0, 10);
}

function getDateRange(startDate, endDate) {
  if (!startDate || !endDate) return [];

  const start = new Date(`${startDate}T00:00:00`);
  const end = new Date(`${endDate}T00:00:00`);

  if (
    Number.isNaN(start.getTime()) ||
    Number.isNaN(end.getTime()) ||
    end < start
  ) {
    return [];
  }

  const dates = [];

  for (
    const current = new Date(start);
    current <= end;
    current.setDate(current.getDate() + 1)
  ) {
    dates.push(
      `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, "0")}-${String(current.getDate()).padStart(2, "0")}`
    );
  }

  return dates;
}

function formatDateKey(dateKey) {
  if (!dateKey) return "Date unavailable";

  return formatDate(`${dateKey}T00:00:00`);
}

export default function OwnerCarAvailabilityPage() {
  const params = useParams();
  const router = useRouter();
  const carId = Array.isArray(params.id) ? params.id[0] : params.id;

  const [owner, setOwner] = useState(null);
  const [car, setCar] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [blockedDates, setBlockedDates] = useState([]);
  const [selectedDate, setSelectedDate] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    Promise.resolve().then(() => {
      if (cancelled) return;

      const currentUser = getCurrentUser();

      if (!currentUser || currentUser.role !== "owner") {
        router.replace(
          `/signin?next=${encodeURIComponent(`/owner/cars/${carId}/availability`)}`
        );
        return;
      }

      setOwner(currentUser);

      const ownerCars = getOwnerCars(currentUser);
      const selectedCar = ownerCars.find(
        (item) => String(item.id) === String(carId)
      );

      if (!selectedCar) {
        setError("We couldn't find this vehicle in your owner listings.");
        setLoading(false);
        return;
      }

      setCar(selectedCar);

      const availability = readAvailability();
      const dates = Array.isArray(availability[String(carId)])
        ? availability[String(carId)]
        : [];

      setBlockedDates(
        [...new Set(dates.map(toDateKey).filter(Boolean))].sort()
      );

      const ownerBookings = getBookingsByOwner(currentUser.id) || [];

      setBookings(
        ownerBookings.filter(
          (booking) => String(booking.carId) === String(carId)
        )
      );

      setLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [carId, router]);

  const protectedDates = useMemo(() => {
    const dates = new Set();

    bookings.forEach((booking) => {
      const status = String(booking.status || "").toLowerCase();

      if (["confirmed", "active"].includes(status)) {
        getDateRange(booking.startDate, booking.endDate).forEach((date) =>
          dates.add(date)
        );
      }
    });

    return dates;
  }, [bookings]);

  const upcomingBookings = useMemo(
    () =>
      bookings
        .filter((booking) =>
          ["confirmed", "active"].includes(
            String(booking.status || "").toLowerCase()
          )
        )
        .sort((a, b) =>
          String(a.startDate || "").localeCompare(String(b.startDate || ""))
        ),
    [bookings]
  );

  function saveBlockedDates(nextDates) {
    setSaving(true);
    setError("");
    setMessage("");

    try {
      const currentAvailability = readAvailability();

      currentAvailability[String(carId)] = nextDates;

      localStorage.setItem(
        AVAILABILITY_STORAGE_KEY,
        JSON.stringify(currentAvailability)
      );

      setBlockedDates(nextDates);
      setMessage("Availability saved successfully.");
    } catch {
      setError("We couldn't save availability. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  function handleBlockDate(event) {
    event.preventDefault();
    setError("");
    setMessage("");

    if (!selectedDate) {
      setError("Please select a date first.");
      return;
    }

    if (selectedDate < toDateKey(new Date().toISOString())) {
      setError("You can't block a date in the past.");
      return;
    }

    if (protectedDates.has(selectedDate)) {
      setError(
        "This date belongs to a confirmed or active booking and cannot be changed."
      );
      return;
    }

    if (blockedDates.includes(selectedDate)) {
      setError("This date is already marked unavailable.");
      return;
    }

    saveBlockedDates([...blockedDates, selectedDate].sort());
    setSelectedDate("");
  }

  function handleMakeAvailable(date) {
    setError("");
    setMessage("");

    if (protectedDates.has(date)) {
      setError(
        "This date belongs to a confirmed or active booking and cannot be changed."
      );
      return;
    }

    saveBlockedDates(blockedDates.filter((item) => item !== date));
  }

  if (loading) {
    return (
      <main className="flex min-h-[50vh] items-center justify-center px-4">
        <p className="text-sm text-slate-500">
          Loading vehicle availability...
        </p>
      </main>
    );
  }

  if (!car) {
    return (
      <main className="min-h-[60vh] bg-slate-50 px-4 py-12">
        <div className="mx-auto max-w-xl rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <h1 className="text-2xl font-bold text-slate-900">
            Vehicle unavailable
          </h1>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            {error || "This vehicle could not be found."}
          </p>
          <Link
            href="/owner/cars"
            className="mt-6 inline-flex min-h-11 items-center justify-center rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700"
          >
            Back to My Cars
          </Link>
        </div>
      </main>
    );
  }

  const today = toDateKey(new Date().toISOString());

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6 sm:py-12">
      <div className="mx-auto max-w-5xl">
        <Link
          href="/owner/cars"
          className="text-sm font-semibold text-slate-600 transition hover:text-blue-600"
        >
          ← Back to My Cars
        </Link>

        <header className="mt-6">
          <p className="text-sm font-semibold uppercase tracking-wider text-blue-600">
            Owner workspace
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            Vehicle availability
          </h1>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Manage unavailable dates for {getCarName(car)}.
          </p>
        </header>

        <section className="mt-7 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm sm:flex">
          <div className="relative h-56 bg-slate-100 sm:h-auto sm:min-h-64 sm:w-2/5">
            {car.image ? (
              <Image
                src={car.image}
                alt={getCarName(car)}
                fill
                sizes="(max-width: 640px) 100vw, 40vw"
                unoptimized
                className="object-cover"
              />
            ) : (
              <div className="flex h-full items-center justify-center text-5xl">
                🚘
              </div>
            )}
          </div>

          <div className="flex-1 p-5 sm:p-7">
            <h2 className="text-xl font-bold text-slate-900">
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

            <div className="mt-5 grid grid-cols-2 gap-3">
              <div className="rounded-xl bg-slate-50 p-4">
                <p className="text-sm text-slate-500">Unavailable dates</p>
                <p className="mt-1 text-2xl font-bold text-slate-900">
                  {blockedDates.length}
                </p>
              </div>
              <div className="rounded-xl bg-slate-50 p-4">
                <p className="text-sm text-slate-500">Protected booking dates</p>
                <p className="mt-1 text-2xl font-bold text-blue-700">
                  {protectedDates.size}
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-7 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
          <h2 className="text-lg font-bold text-slate-900">
            Mark a date unavailable
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Choose a date when you cannot rent out this vehicle. Confirmed and
            active booking dates are protected.
          </p>

          <form
            onSubmit={handleBlockDate}
            className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-end"
          >
            <div className="flex-1">
              <label
                htmlFor="unavailableDate"
                className="text-sm font-semibold text-slate-700"
              >
                Unavailable date
              </label>
              <input
                id="unavailableDate"
                type="date"
                min={today}
                value={selectedDate}
                onChange={(event) => {
                  setSelectedDate(event.target.value);
                  setError("");
                  setMessage("");
                }}
                className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                required
              />
            </div>

            <button
              type="submit"
              disabled={saving}
              className="inline-flex min-h-11 items-center justify-center rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? "Saving..." : "Block date"}
            </button>
          </form>

          {error && (
            <p
              role="alert"
              className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
            >
              {error}
            </p>
          )}

          {message && (
            <p
              role="status"
              className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700"
            >
              {message}
            </p>
          )}
        </section>

        <section className="mt-7 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
          <h2 className="text-lg font-bold text-slate-900">
            Unavailable dates
          </h2>

          {blockedDates.length === 0 ? (
            <p className="mt-4 rounded-xl bg-slate-50 p-5 text-sm leading-6 text-slate-600">
              No dates have been blocked. Your vehicle has no manually blocked
              dates in this demo.
            </p>
          ) : (
            <ul className="mt-4 divide-y divide-slate-100">
              {blockedDates.map((date) => {
                const isProtected = protectedDates.has(date);

                return (
                  <li
                    key={date}
                    className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div>
                      <p className="font-semibold text-slate-900">
                        {formatDateKey(date)}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">{date}</p>
                      {isProtected && (
                        <p className="mt-1 text-xs font-medium text-amber-700">
                          This date overlaps a confirmed or active booking.
                        </p>
                      )}
                    </div>

                    <button
                      type="button"
                      disabled={saving || isProtected}
                      onClick={() => handleMakeAvailable(date)}
                      className="inline-flex min-h-10 items-center justify-center rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-blue-500 hover:text-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Make available
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <section className="mt-7 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
          <h2 className="text-lg font-bold text-slate-900">
            Confirmed and active bookings
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            These bookings protect their rental dates from availability changes.
          </p>

          {upcomingBookings.length === 0 ? (
            <p className="mt-4 rounded-xl bg-slate-50 p-5 text-sm leading-6 text-slate-600">
              There are no confirmed or active bookings for this vehicle yet.
            </p>
          ) : (
            <div className="mt-4 divide-y divide-slate-100">
              {upcomingBookings.map((booking) => (
                <div
                  key={booking.id}
                  className="py-4 sm:flex sm:items-center sm:justify-between sm:gap-5"
                >
                  <div>
                    <p className="font-semibold text-slate-900">
                      {formatDate(booking.startDate)} –{" "}
                      {formatDate(booking.endDate)}
                    </p>
                    <p className="mt-1 break-all text-xs text-slate-500">
                      Booking ID: {booking.id}
                    </p>
                  </div>
                  <span className="mt-2 inline-flex w-fit rounded-full bg-blue-50 px-3 py-1.5 text-xs font-semibold capitalize text-blue-700 sm:mt-0">
                    {booking.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>

        <p className="mt-7 text-xs leading-5 text-slate-500">
          Availability is saved in this browser for this demo. Dates protected
          by confirmed or active bookings cannot be changed here.
        </p>
      </div>
    </main>
  );
}
