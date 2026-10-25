"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { getBookingsByOwner } from "@/lib/bookings";
import { formatCurrency, formatDate } from "@/lib/format";
import carsData from "@/data/cars.json";

const statusStyles = {
  pending: "bg-amber-50 text-amber-700",
  confirmed: "bg-blue-50 text-blue-700",
  active: "bg-emerald-50 text-emerald-700",
  completed: "bg-slate-100 text-slate-700",
  cancelled: "bg-red-50 text-red-700",
  rejected: "bg-red-50 text-red-700",
};

function getCar(carId) {
  return carsData.find((car) => String(car.id) === String(carId));
}

function StatCard({ label, value, detail }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm font-medium text-slate-500">{label}</p>
      <p className="mt-3 text-3xl font-bold tracking-tight text-slate-900">
        {value}
      </p>
      <p className="mt-2 text-sm text-slate-500">{detail}</p>
    </div>
  );
}

export default function OwnerDashboardPage() {
  const [user, setUser] = useState(null);
  const [cars, setCars] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const currentUser = getCurrentUser();
    setUser(currentUser);

    if (!currentUser || currentUser.role !== "owner") {
      setLoading(false);
      return;
    }

    // Load cars associated with this owner when ownership data is available.
    try {
      const storedCars = JSON.parse(
        localStorage.getItem("sheggar-wheels-cars") || "[]"
      );

      const allCars = [...carsData, ...storedCars];
      const uniqueCars = allCars.filter(
        (car, index, list) =>
          list.findIndex((item) => String(item.id) === String(car.id)) ===
          index
      );

      const ownerCars = uniqueCars.filter(
        (car) =>
          String(car.ownerId) === String(currentUser.id) ||
          String(car.ownerEmail || "").toLowerCase() ===
            String(currentUser.email || "").toLowerCase()
      );

      setCars(ownerCars);
    } catch {
      setCars([]);
    }

    setBookings(getBookingsByOwner(currentUser.id) || []);
    setLoading(false);
  }, []);

  if (loading) {
    return (
      <main className="flex min-h-[50vh] items-center justify-center px-4">
        <p className="text-sm text-slate-500">Loading your dashboard...</p>
      </main>
    );
  }

  const pendingCount = bookings.filter(
    (booking) => booking.status === "pending"
  ).length;

  const activeCount = bookings.filter((booking) =>
    ["confirmed", "active"].includes(booking.status)
  ).length;

  const completedBookings = bookings.filter(
    (booking) => booking.status === "completed"
  );

  const earnings = completedBookings.reduce(
    (total, booking) => total + Number(booking.totalPrice || 0),
    0
  );

  const recentBookings = [...bookings]
    .sort(
      (a, b) =>
        new Date(b.createdAt || 0).getTime() -
        new Date(a.createdAt || 0).getTime()
    )
    .slice(0, 5);

  return (
    <main className="min-h-screen px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <section className="overflow-hidden rounded-3xl bg-gradient-to-r from-blue-700 to-blue-500 p-6 text-white shadow-sm sm:p-9">
          <p className="text-sm font-semibold text-blue-100">
            OWNER WORKSPACE
          </p>
          <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
            Welcome{user?.name ? `, ${user.name}` : " back"}
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-blue-50 sm:text-base">
            Manage your vehicles, review rental requests, and keep track of
            your rental activity from one place.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/owner/cars/new"
              className="inline-flex min-h-11 items-center justify-center rounded-xl bg-yellow-500 px-5 py-3 text-sm font-semibold text-blue-700 transition hover:bg-blue-50"
            >
              + Add a car
            </Link>
            <Link
              href="/owner/cars"
              className="inline-flex min-h-11 items-center justify-center rounded-xl border border-white/40 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              Manage my cars
            </Link>
          </div>
        </section>

        <section
          aria-label="Owner statistics"
          className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
        >
          <StatCard
            label="My vehicles"
            value={cars.length}
            detail="Vehicles linked to your account"
          />
          <StatCard
            label="Pending requests"
            value={pendingCount}
            detail="Bookings awaiting a decision"
          />
          <StatCard
            label="Current rentals"
            value={activeCount}
            detail="Confirmed or active bookings"
          />
          <StatCard
            label="Completed rental value"
            value={formatCurrency(earnings)}
            detail="Total value of completed bookings"
          />
        </section>

        <section className="mt-8 grid gap-6 lg:grid-cols-[1.5fr_1fr]">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  Recent booking requests
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  The latest activity for your vehicles.
                </p>
              </div>
              <Link
                href="/owner/cars"
                className="text-sm font-semibold text-blue-600 hover:text-blue-700"
              >
                Manage cars →
              </Link>
            </div>

            {recentBookings.length === 0 ? (
              <div className="mt-6 rounded-xl border border-dashed border-slate-300 px-5 py-10 text-center">
                <p className="text-3xl" aria-hidden="true">🚘</p>
                <h3 className="mt-3 font-semibold text-slate-900">
                  No booking requests yet
                </h3>
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  When renters book one of your vehicles, their requests will
                  appear here.
                </p>
              </div>
            ) : (
              <div className="mt-5 divide-y divide-slate-100">
                {recentBookings.map((booking) => {
                  const car = getCar(booking.carId);
                  const status = String(booking.status || "pending").toLowerCase();

                  return (
                    <div
                      key={booking.id}
                      className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div>
                        <p className="font-semibold text-slate-900">
                          {car
                            ? `${car.year} ${car.make} ${car.model}`
                            : `Booking #${booking.id}`}
                        </p>
                        <p className="mt-1 text-sm text-slate-500">
                          {formatDate(booking.startDate)} –{" "}
                          {formatDate(booking.endDate)}
                        </p>
                        <p className="mt-1 text-sm font-medium text-slate-700">
                          {formatCurrency(booking.totalPrice)}
                        </p>
                      </div>
                      <span
                        className={`inline-flex w-fit rounded-full px-3 py-1.5 text-xs font-semibold capitalize ${
                          statusStyles[status] || statusStyles.pending
                        }`}
                      >
                        {status}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <aside className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <h2 className="text-lg font-bold text-slate-900">
              Owner quick links
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Shortcuts to common tasks.
            </p>

            <div className="mt-5 space-y-3">
              {[
                {
                  title: "My cars",
                  description: "View and update your listings",
                  href: "/owner/cars",
                },
                {
                  title: "Add a vehicle",
                  description: "Create a new car listing",
                  href: "/owner/cars/new",
                },
                {
                  title: "Earnings",
                  description: "Review your rental income",
                  href: "/owner/earnings",
                },
                {
                  title: "Reviews",
                  description: "Read renter feedback",
                  href: "/owner/reviews",
                },
                {
                  title: "Disputes",
                  description: "Review reported issues",
                  href: "/owner/disputes",
                },
              ].map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="block rounded-xl border border-slate-200 p-4 transition hover:border-blue-300 hover:bg-blue-50/50"
                >
                  <span className="font-semibold text-slate-900">
                    {item.title} →
                  </span>
                  <span className="mt-1 block text-sm text-slate-500">
                    {item.description}
                  </span>
                </Link>
              ))}
            </div>
          </aside>
        </section>

        <p className="mt-6 text-xs leading-5 text-slate-500">
          This dashboard displays demo data stored in your browser. Earnings
          are calculated from completed bookings and are not a live payment
          balance.
        </p>
      </div>
    </main>
  );
}
