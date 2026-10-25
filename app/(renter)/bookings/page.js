"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { getBookingsByRenter } from "@/lib/bookings";
import { formatCurrency, formatDate } from "@/lib/format";
import cars from "@/data/cars.json";

const filters = ["All", "Pending", "Confirmed", "Active", "Completed", "Cancelled"];

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
    const currentUser = getCurrentUser();

    if (!currentUser || currentUser.role !== "renter") {
      window.location.replace(
        `/signin?next=${encodeURIComponent("/bookings")}`
      );
      return;
    }

    setUser(currentUser);
    setBookings(getBookingsByRenter(currentUser.id));
    setAuthChecked(true);
  }, []);

  const filteredBookings = useMemo(() => {
    if (activeFilter === "All") return bookings;

    return bookings.filter(
      (booking) => booking.status.toLowerCase() === activeFilter.toLowerCase()
    );
  }, [bookings, activeFilter]);

  const counts = useMemo(() => {
    return {
      total: bookings.length,
      pending: bookings.filter((booking) => booking.status === "pending").length,
      confirmed: bookings.filter(
        (booking) => booking.status === "confirmed"
      ).length,
      completed: bookings.filter(
        (booking) => booking.status === "completed"
      ).length,
    };
  }, [bookings]);

  if (!authChecked) {
    return (
      <main className="mx-auto max-w-7xl px-4 py-16">
        <p className="text-center text-slate-500">Loading your bookings…</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wider text-[#0866F5]">
              Renter dashboard
            </p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
              My bookings
            </h1>
            <p className="mt-2 text-slate-600">
              Welcome back, {user?.name}. Manage your rental requests in one place.
            </p>
          </div>

          <Link
            href="/cars"
            className="inline-flex min-h-11 items-center justify-center rounded-lg bg-[#0866F5] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#0754C7]"
          >
            + Book a car
          </Link>
        </div>

        <section className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[
            { label: "Total bookings", value: counts.total, symbol: "▤" },
            { label: "Awaiting response", value: counts.pending, symbol: "◷" },
            { label: "Confirmed", value: counts.confirmed, symbol: "✓" },
            { label: "Completed", value: counts.completed, symbol: "◆" },
          ].map((item) => (
            <div
              key={item.label}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-slate-500">{item.label}</p>
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-lg font-bold text-[#0866F5]">
                  {item.symbol}
                </span>
              </div>
              <p className="mt-4 text-3xl font-bold text-slate-900">{item.value}</p>
            </div>
          ))}
        </section>

        <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-bold text-slate-900">Your rental history</h2>
              <p className="mt-1 text-sm text-slate-500">
                Review the status and details of each booking.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setBookings(getBookingsByRenter(user.id))}
              className="self-start rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 sm:self-auto"
            >
              ↻ Refresh
            </button>
          </div>

          <div className="mt-6 flex gap-2 overflow-x-auto pb-2">
            {filters.map((filter) => (
              <button
                key={filter}
                type="button"
                onClick={() => setActiveFilter(filter)}
                className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition ${
                  activeFilter === filter
                    ? "bg-[#0866F5] text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {filter}
              </button>
            ))}
          </div>

          {filteredBookings.length === 0 ? (
            <div className="mt-6 rounded-xl border border-dashed border-slate-300 px-5 py-14 text-center">
              <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-2xl text-[#0866F5]">
                ▤
              </span>
              <h3 className="mt-4 text-lg font-bold text-slate-900">
                {bookings.length === 0
                  ? "No bookings yet"
                  : `No ${activeFilter.toLowerCase()} bookings`}
              </h3>
              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
                {bookings.length === 0
                  ? "Find a car that suits your plans and submit your first rental request."
                  : "Try another filter to see your other rental requests."}
              </p>
              {bookings.length === 0 && (
                <Link
                  href="/cars"
                  className="mt-5 inline-flex rounded-lg bg-[#0866F5] px-5 py-3 text-sm font-semibold text-white hover:bg-[#0754C7]"
                >
                  Browse available cars
                </Link>
              )}
            </div>
          ) : (
            <div className="mt-6 space-y-4">
              {filteredBookings.map((booking) => {
                const car = getCar(booking.carId);
                const status = booking.status.toLowerCase();

                return (
                  <article
                    key={booking.id}
                    className="grid gap-5 rounded-xl border border-slate-200 p-4 transition hover:border-blue-200 sm:p-5 lg:grid-cols-[180px_1fr_auto]"
                  >
                    <div className="flex h-36 items-center justify-center overflow-hidden rounded-lg bg-slate-100 sm:h-32">
                      {car?.image ? (
                        <img
                          src={car.image}
                          alt={car ? `${car.year} ${car.make} ${car.model}` : "Rental car"}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <span className="text-sm text-slate-400">Car image unavailable</span>
                      )}
                    </div>

                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-3">
                        <h3 className="text-lg font-bold text-slate-900">
                          {car
                            ? `${car.year} ${car.make} ${car.model}`
                            : "Rental car"}
                        </h3>
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ring-1 ${
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
                          <p className="text-slate-500">Pickup date</p>
                          <p className="mt-1 font-semibold text-slate-800">
                            {formatDate(booking.startDate)}
                          </p>
                        </div>
                        <div>
                          <p className="text-slate-500">Return date</p>
                          <p className="mt-1 font-semibold text-slate-800">
                            {formatDate(booking.endDate)}
                          </p>
                        </div>
                        <div>
                          <p className="text-slate-500">Duration</p>
                          <p className="mt-1 font-semibold text-slate-800">
                            {booking.totalDays} {booking.totalDays === 1 ? "day" : "days"}
                          </p>
                        </div>
                        <div>
                          <p className="text-slate-500">Total price</p>
                          <p className="mt-1 font-bold text-slate-900">
                            {formatCurrency(booking.totalPrice)}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center lg:justify-end">
                      <Link
                        href={`/bookings/${encodeURIComponent(booking.id)}`}
                        className="inline-flex min-h-11 w-full items-center justify-center rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-[#0866F5] hover:text-[#0866F5] sm:w-auto"
                      >
                        View details →
                      </Link>
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