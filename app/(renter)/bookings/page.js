
"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { getBookingsByRenter } from "@/lib/bookings";
import { formatCurrency, formatDate } from "@/lib/format";
import cars from "@/data/cars.json";

const filters = [
  "All",
  "Pending",
  "Confirmed",
  "Active",
  "Completed",
  "Cancelled",
];

const statusStyles = {
  pending: "bg-amber-50 text-amber-700 ring-amber-200",
  confirmed: "bg-blue-50 text-blue-700 ring-blue-200",
  active: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  completed: "bg-slate-100 text-slate-700 ring-slate-200",
  cancelled: "bg-red-50 text-red-700 ring-red-200",
  rejected: "bg-red-50 text-red-700 ring-red-200",
};

function getCar(carId) {
  return cars.find((car) => String(car.id) === String(carId));
}

export default function BookingsPage() {
  const [user, setUser] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [activeFilter, setActiveFilter] = useState("All");
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const initializeBookings = () => {
      if (cancelled) return;

      const currentUser = getCurrentUser();

      if (!currentUser || currentUser.role !== "renter") {
        window.location.replace(
          `/signin?next=${encodeURIComponent("/bookings")}`
        );
        return;
      }

      const renterBookings = getBookingsByRenter(currentUser.id) || [];

      if (cancelled) return;

      setUser(currentUser);
      setBookings(renterBookings);
      setAuthChecked(true);
    };

    Promise.resolve().then(initializeBookings);

    return () => {
      cancelled = true;
    };
  }, []);

  const filteredBookings = useMemo(() => {
    if (activeFilter === "All") return bookings;

    return bookings.filter(
      (booking) =>
        booking.status?.toLowerCase() === activeFilter.toLowerCase()
    );
  }, [bookings, activeFilter]);

  const counts = useMemo(
    () => ({
      total: bookings.length,
      pending: bookings.filter((booking) => booking.status === "pending")
        .length,
      confirmed: bookings.filter(
        (booking) => booking.status === "confirmed"
      ).length,
      completed: bookings.filter(
        (booking) => booking.status === "completed"
      ).length,
    }),
    [bookings]
  );

  if (!authChecked) {
    return (
      <main className="mx-auto max-w-6xl px-4 py-16">
        <p className="text-center text-slate-500">
          Loading your bookings…
        </p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10 sm:px-6 sm:py-14">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wider text-[#0866F5]">
              Renter dashboard
            </p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
              My bookings
            </h1>
            <p className="mt-2 text-slate-600">
              Welcome{user?.name ? `, ${user.name}` : ""}. Manage your rentals
              and follow their progress.
            </p>
          </div>

          <Link
            href="/cars"
            className="inline-flex min-h-11 items-center justify-center rounded-lg bg-[#0866F5] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#0754C7]"
          >
            Browse cars →
          </Link>
        </div>

        <section className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Total bookings</p>
            <p className="mt-2 text-3xl font-bold text-slate-900">
              {counts.total}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Awaiting response</p>
            <p className="mt-2 text-3xl font-bold text-amber-600">
              {counts.pending}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Confirmed</p>
            <p className="mt-2 text-3xl font-bold text-blue-600">
              {counts.confirmed}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Completed</p>
            <p className="mt-2 text-3xl font-bold text-emerald-600">
              {counts.completed}
            </p>
          </div>
        </section>

        <section className="mt-8">
          <div className="flex flex-wrap gap-2">
            {filters.map((filter) => {
              const selected = activeFilter === filter;

              return (
                <button
                  key={filter}
                  type="button"
                  onClick={() => setActiveFilter(filter)}
                  aria-pressed={selected}
                  className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                    selected
                      ? "bg-[#0866F5] text-white"
                      : "border border-slate-200 bg-white text-slate-600 hover:border-blue-300 hover:text-[#0866F5]"
                  }`}
                >
                  {filter}
                  {filter === "All" && ` (${counts.total})`}
                  {filter === "Pending" && ` (${counts.pending})`}
                  {filter === "Confirmed" && ` (${counts.confirmed})`}
                  {filter === "Completed" && ` (${counts.completed})`}
                </button>
              );
            })}
          </div>

          {filteredBookings.length === 0 ? (
            <div className="mt-6 rounded-2xl border border-slate-200 bg-white px-6 py-14 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-2xl">
                🚗
              </div>
              <h2 className="mt-4 text-xl font-bold text-slate-900">
                {bookings.length === 0
                  ? "No bookings yet"
                  : `No ${activeFilter.toLowerCase()} bookings`}
              </h2>
              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
                {bookings.length === 0
                  ? "Browse available cars and make your first rental booking."
                  : "Try another filter to see your other bookings."}
              </p>
              {bookings.length === 0 && (
                <Link
                  href="/cars"
                  className="mt-5 inline-flex min-h-11 items-center justify-center rounded-lg bg-[#0866F5] px-5 py-3 text-sm font-semibold text-white hover:bg-[#0754C7]"
                >
                  Browse cars →
                </Link>
              )}
            </div>
          ) : (
            <div className="mt-5 space-y-4">
              {filteredBookings.map((booking) => {
                const car = getCar(booking.carId);
                const status = booking.status?.toLowerCase() || "pending";
                const canTrack = ["confirmed", "active"].includes(status);
                const canReview = status === "completed";
                const bookingUrl = `/bookings/${encodeURIComponent(booking.id)}`;

                return (
                  <article
                    key={booking.id}
                    className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:shadow-md"
                  >
                    <div className="grid gap-5 p-5 sm:p-6 lg:grid-cols-[180px_1fr_auto] lg:items-center">
                      <div className="relative h-36 overflow-hidden rounded-xl bg-slate-100 sm:h-40 lg:h-32">
                        {car?.image ? (
                          <Image
                            src={car.image}
                            alt={`${car.year} ${car.make} ${car.model}`}
                            fill
                            sizes="(max-width: 640px) 100vw, 180px"
                            className="object-cover"
                            unoptimized
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center text-sm text-slate-400">
                            Car image unavailable
                          </div>
                        )}
                      </div>

                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-3">
                          <h2 className="text-lg font-bold text-slate-900">
                            {car
                              ? `${car.year} ${car.make} ${car.model}`
                              : "Rental vehicle"}
                          </h2>

                          <span
                            className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold capitalize ring-1 ${
                              statusStyles[status] || statusStyles.pending
                            }`}
                          >
                            {status}
                          </span>
                        </div>

                        <p className="mt-1 break-all text-xs text-slate-400">
                          Booking ID: {booking.id}
                        </p>

                        <div className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
                          <div>
                            <p className="text-slate-500">Pickup</p>
                            <p className="mt-1 font-medium text-slate-800">
                              {formatDate(booking.startDate)}
                            </p>
                          </div>
                          <div>
                            <p className="text-slate-500">Return</p>
                            <p className="mt-1 font-medium text-slate-800">
                              {formatDate(booking.endDate)}
                            </p>
                          </div>
                        </div>

                        <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm">
                          <p className="text-slate-500">
                            Duration:{" "}
                            <span className="font-semibold text-slate-800">
                              {booking.totalDays}{" "}
                              {booking.totalDays === 1 ? "day" : "days"}
                            </span>
                          </p>
                          <p className="text-slate-500">
                            Total:{" "}
                            <span className="font-semibold text-slate-900">
                              {formatCurrency(booking.totalPrice)}
                            </span>
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 lg:max-w-56 lg:justify-end">
                        <Link
                          href={bookingUrl}
                          className="inline-flex min-h-11 w-full items-center justify-center rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-[#0866F5] hover:text-[#0866F5] sm:w-auto"
                        >
                          View details →
                        </Link>

                        {canTrack && (
                          <Link
                            href={`${bookingUrl}/track`}
                            className="inline-flex min-h-11 w-full items-center justify-center rounded-lg bg-[#0866F5] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#0754C7] sm:w-auto"
                          >
                            Track booking →
                          </Link>
                        )}

                        {canReview && (
                          <Link
                            href={`${bookingUrl}/review`}
                            className="inline-flex min-h-11 w-full items-center justify-center rounded-lg border border-emerald-300 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-800 transition hover:bg-emerald-100 sm:w-auto"
                          >
                            Write review →
                          </Link>
                        )}
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
