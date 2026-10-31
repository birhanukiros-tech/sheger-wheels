
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { getCurrentUser } from "@/lib/auth";
import { getBookingsByRenter } from "@/lib/bookings";
import carsData from "@/data/cars.json";

const currencyFormatter = new Intl.NumberFormat("en-ET", {
  style: "currency",
  currency: "ETB",
  maximumFractionDigits: 0,
});

const dateFormatter = new Intl.DateTimeFormat("en-ET", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

function formatDate(value) {
  if (!value) return "Date not set";

  const date = new Date(`${value.slice(0, 10)}T00:00:00`);

  return Number.isNaN(date.getTime())
    ? "Date not set"
    : dateFormatter.format(date);
}

function getToday() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

function getCar(carId) {
  return carsData.find((car) => car.id === carId);
}

function getCarName(carId) {
  const car = getCar(carId);
  return car ? `${car.make} ${car.model} ${car.year}` : "Rental car";
}

function getStatusStyle(status) {
  switch (status) {
    case "confirmed":
      return "bg-blue-50 text-blue-700";
    case "active":
      return "bg-emerald-50 text-emerald-700";
    case "completed":
      return "bg-slate-100 text-slate-700";
    case "cancelled":
    case "rejected":
      return "bg-red-50 text-red-700";
    default:
      return "bg-amber-50 text-amber-700";
  }
}

function StatCard({ title, value, description, symbol }) {
  return (
    <article className="rounded-2xl border border-border bg-white p-5 shadow-sm sm:p-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-muted">{title}</p>
          <p className="mt-3 text-3xl font-bold tracking-tight text-foreground">
            {value}
          </p>
        </div>
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-2xl text-primary">
          {symbol}
        </div>
      </div>
      <p className="mt-3 text-xs leading-5 text-muted">{description}</p>
    </article>
  );
}

export default function RenterDashboardPage() {
  const router = useRouter();

  const [user, setUser] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [today, setToday] = useState("");
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const initializeDashboard = () => {
      const currentUser = getCurrentUser();

      if (cancelled) return;

      if (!currentUser) {
        router.replace("/signin?next=/dashboard");
        return;
      }

      if (currentUser.role !== "renter") {
        router.replace(
          currentUser.role === "owner"
            ? "/owner"
            : currentUser.role === "admin"
              ? "/admin"
              : "/"
        );
        return;
      }

      setUser(currentUser);
      setToday(getToday());
      setBookings(getBookingsByRenter(currentUser.id));
      setAuthChecked(true);
    };

    Promise.resolve().then(initializeDashboard);

    return () => {
      cancelled = true;
    };
  }, [router]);

  const validBookings = Array.isArray(bookings) ? bookings : [];

  const upcomingBookings = validBookings
    .filter(
      (booking) =>
        ["pending", "confirmed", "active"].includes(booking.status) &&
        booking.endDate >= today
    )
    .sort((a, b) => a.startDate.localeCompare(b.startDate))
    .slice(0, 3);

  const recentBookings = [...validBookings]
    .sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""))
    .slice(0, 4);

  const activeCount = validBookings.filter(
    (booking) => booking.status === "active"
  ).length;

  const completedCount = validBookings.filter(
    (booking) => booking.status === "completed"
  ).length;

  const pendingCount = validBookings.filter(
    (booking) => booking.status === "pending"
  ).length;

  if (!authChecked) {
    return (
      <main className="flex min-h-[60vh] items-center justify-center bg-surface px-4">
        <p className="text-sm font-medium text-muted">
          Checking renter access...
        </p>
      </main>
    );
  }

  return (
    <section className="min-h-[70vh] bg-surface px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wider text-primary">
              Renter Dashboard
            </p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              {user?.name ? `Welcome, ${user.name}` : "Welcome to Sheggar Wheels"}
            </h1>
            <p className="mt-3 max-w-2xl text-base leading-7 text-muted">
              Manage your rentals, keep track of your bookings, and find your
              next ride in Addis Ababa.
            </p>
          </div>

          <Link
            href="/cars"
            className="inline-flex min-h-12 shrink-0 items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-white transition hover:bg-primary-hover"
          >
            <span aria-hidden="true">⌕</span> Find a car
          </Link>
        </div>

        <div className="mb-10 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            title="Total bookings"
            value={validBookings.length}
            description="All your saved rental bookings"
            symbol="▤"
          />
          <StatCard
            title="Upcoming rentals"
            value={upcomingBookings.length}
            description="Pending, confirmed, or active rentals"
            symbol="▦"
          />
          <StatCard
            title="Active rentals"
            value={activeCount}
            description="Rentals currently marked active"
            symbol="🚗"
          />
          <StatCard
            title="Completed rentals"
            value={completedCount}
            description="Rentals marked as completed"
            symbol="✓"
          />
        </div>

        <div className="grid items-start gap-8 lg:grid-cols-[1.4fr_1fr]">
          <div className="space-y-8">
            <section>
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-xl font-bold text-foreground">
                    Upcoming rentals
                  </h2>
                  <p className="mt-1 text-sm text-muted">
                    Your next rental journeys
                  </p>
                </div>
                <Link
                  href="/bookings"
                  className="inline-flex shrink-0 items-center gap-1 text-sm font-semibold text-primary hover:underline"
                >
                  All bookings <span aria-hidden="true">→</span>
                </Link>
              </div>

              {upcomingBookings.length > 0 ? (
                <div className="space-y-4">
                  {upcomingBookings.map((booking) => {
                    const car = getCar(booking.carId);

                    return (
                      <article
                        key={booking.id}
                        className="overflow-hidden rounded-2xl border border-border bg-white shadow-sm"
                      >
                        <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center">
                          {car?.image ? (
                            <div className="relative h-32 w-full shrink-0 overflow-hidden rounded-xl bg-slate-100 sm:h-24 sm:w-32">
                              <Image
                                src={car.image}
                                alt={getCarName(booking.carId)}
                                fill
                                sizes="(max-width: 640px) 100vw, 128px"
                                className="object-cover"
                                unoptimized
                              />
                            </div>
                          ) : (
                            <div className="flex h-24 w-full items-center justify-center rounded-xl bg-blue-50 text-3xl text-primary sm:w-32">
                              🚗
                            </div>
                          )}

                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <h3 className="font-bold text-foreground">
                                {getCarName(booking.carId)}
                              </h3>
                              <span
                                className={`rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${getStatusStyle(booking.status)}`}
                              >
                                {booking.status}
                              </span>
                            </div>
                            <p className="mt-2 text-sm text-muted">
                              {formatDate(booking.startDate)} –{" "}
                              {formatDate(booking.endDate)}
                            </p>
                            <p className="mt-2 text-sm font-semibold text-foreground">
                              {currencyFormatter.format(booking.totalPrice ?? 0)}
                            </p>
                          </div>

                          <Link
                            href={`/bookings/${booking.id}`}
                            className="inline-flex min-h-10 shrink-0 items-center justify-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-semibold text-foreground transition hover:border-primary hover:text-primary"
                          >
                            Details →
                          </Link>
                        </div>
                      </article>
                    );
                  })}
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-border bg-white px-6 py-10 text-center">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-2xl text-primary">
                    ▦
                  </div>
                  <h3 className="mt-4 font-bold text-foreground">
                    No upcoming rentals
                  </h3>
                  <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-muted">
                    Once you make a booking, your upcoming rental details will
                    appear here.
                  </p>
                  <Link
                    href="/cars"
                    className="mt-5 inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-white transition hover:bg-primary-hover"
                  >
                    Browse available cars →
                  </Link>
                </div>
              )}
            </section>

            <section>
              <div className="mb-4">
                <h2 className="text-xl font-bold text-foreground">
                  Recent activity
                </h2>
                <p className="mt-1 text-sm text-muted">
                  Your latest booking history
                </p>
              </div>

              <div className="overflow-hidden rounded-2xl border border-border bg-white">
                {recentBookings.length > 0 ? (
                  recentBookings.map((booking, index) => (
                    <div
                      key={booking.id}
                      className={`flex items-center gap-3 p-4 sm:p-5 ${index > 0 ? "border-t border-border" : ""}`}
                    >
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-50 text-lg text-muted">
                        ◷
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-foreground">
                          {getCarName(booking.carId)}
                        </p>
                        <p className="mt-1 text-xs text-muted">
                          Booked{" "}
                          {formatDate((booking.createdAt || "").slice(0, 10))}
                        </p>
                      </div>
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${getStatusStyle(booking.status)}`}
                      >
                        {booking.status}
                      </span>
                      <Link
                        href={`/bookings/${booking.id}`}
                        aria-label={`View booking for ${getCarName(booking.carId)}`}
                        className="rounded-lg p-2 text-muted transition hover:bg-blue-50 hover:text-primary"
                      >
                        →
                      </Link>
                    </div>
                  ))
                ) : (
                  <div className="px-6 py-8 text-center">
                    <p className="font-semibold text-foreground">
                      No booking activity yet
                    </p>
                    <p className="mt-2 text-sm text-muted">
                      Your booking history will appear here.
                    </p>
                  </div>
                )}

                {validBookings.length > 4 && (
                  <div className="border-t border-border p-4 text-center">
                    <Link
                      href="/bookings"
                      className="text-sm font-semibold text-primary hover:underline"
                    >
                      View all booking history
                    </Link>
                  </div>
                )}
              </div>
            </section>
          </div>

          <aside className="space-y-6">
            <section className="rounded-2xl border border-border bg-white p-6 shadow-sm">
              <h2 className="text-lg font-bold text-foreground">
                Quick actions
              </h2>
              <p className="mt-1 text-sm text-muted">
                Get where you need to go
              </p>

              <div className="mt-5 space-y-3">
                <Link
                  href="/cars"
                  className="flex items-center gap-3 rounded-xl border border-border p-4 transition hover:border-primary hover:bg-blue-50/50"
                >
                  <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-xl text-primary">
                    🚗
                  </span>
                  <span className="flex-1">
                    <span className="block text-sm font-semibold text-foreground">
                      Browse cars
                    </span>
                    <span className="mt-1 block text-xs text-muted">
                      Find your next ride
                    </span>
                  </span>
                  <span className="text-muted">→</span>
                </Link>

                <Link
                  href="/bookings"
                  className="flex items-center gap-3 rounded-xl border border-border p-4 transition hover:border-primary hover:bg-blue-50/50"
                >
                  <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-xl text-primary">
                    ▦
                  </span>
                  <span className="flex-1">
                    <span className="block text-sm font-semibold text-foreground">
                      Manage bookings
                    </span>
                    <span className="mt-1 block text-xs text-muted">
                      View rental details
                    </span>
                  </span>
                  <span className="text-muted">→</span>
                </Link>
              </div>
            </section>

            <section className="rounded-2xl border border-border bg-white p-6 shadow-sm">
              <h2 className="text-lg font-bold text-foreground">
                Booking overview
              </h2>
              <div className="mt-5 space-y-4">
                <div className="flex items-center justify-between gap-3">
                  <span className="flex items-center gap-2 text-sm text-muted">
                    <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
                    Awaiting confirmation
                  </span>
                  <span className="font-bold text-foreground">
                    {pendingCount}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="flex items-center gap-2 text-sm text-muted">
                    <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                    Active rentals
                  </span>
                  <span className="font-bold text-foreground">
                    {activeCount}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="flex items-center gap-2 text-sm text-muted">
                    <span className="h-2.5 w-2.5 rounded-full bg-slate-400" />
                    Completed rentals
                  </span>
                  <span className="font-bold text-foreground">
                    {completedCount}
                  </span>
                </div>
              </div>
              <Link
                href="/bookings"
                className="mt-6 flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-border px-4 py-3 text-sm font-semibold text-foreground transition hover:border-primary hover:text-primary"
              >
                View all bookings →
              </Link>
            </section>

            <div className="rounded-2xl bg-slate-900 p-6 text-white">
              <div className="text-2xl" aria-hidden="true">
                📍
              </div>
              <h2 className="mt-4 text-lg font-bold">
                Ready for your next journey?
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-300">
                Explore available cars and choose the one that suits your plans.
              </p>
              <Link
                href="/cars"
                className="mt-5 inline-flex items-center gap-2 font-semibold text-white transition hover:text-blue-300"
              >
                Find your car →
              </Link>
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
}
