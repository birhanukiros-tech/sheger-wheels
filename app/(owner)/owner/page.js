"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import {
  getBookingsByOwner,
  updateBookingStatus,
} from "@/lib/bookings";
import { formatCurrency, formatDate } from "@/lib/format";
import { createCarSlug } from "@/lib/car-slug";
import carsData from "@/data/cars.json";

const statusStyles = {
  pending: "bg-amber-50 text-amber-700 ring-amber-200",
  confirmed: "bg-blue-50 text-blue-700 ring-blue-200",
  active: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  completed: "bg-slate-100 text-slate-700 ring-slate-200",
  cancelled: "bg-red-50 text-red-700 ring-red-200",
  rejected: "bg-red-50 text-red-700 ring-red-200",
};

const statusLabels = {
  pending: "Pending",
  confirmed: "Confirmed",
  active: "Active",
  completed: "Completed",
  cancelled: "Cancelled",
  rejected: "Rejected",
};

const statusActions = {
  pending: [
    { value: "confirmed", label: "Approve booking" },
    { value: "rejected", label: "Reject request", destructive: true },
  ],
  confirmed: [
    { value: "active", label: "Start rental" },
    { value: "cancelled", label: "Cancel booking", destructive: true },
  ],
  active: [{ value: "completed", label: "Mark completed" }],
  completed: [],
  cancelled: [],
  rejected: [],
};

function getCar(carId, allCars = []) {
  return allCars.find((car) => String(car.id) === String(carId));
}

function getCarHref(car) {
  if (!car) return "/owner/cars";

  const slug = createCarSlug(car);

  if (String(car.id).startsWith("owner-car-")) {
    return `/cars/${slug}?carId=${encodeURIComponent(car.id)}`;
  }

  return `/cars/${slug}`;
}

function getBookingTime(booking) {
  return new Date(booking.createdAt || booking.startDate || 0).getTime();
}

function StatCard({
  label,
  value,
  detail,
  icon,
  color,
  onClick,
  href,
}) {
  const content = (
    <>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-slate-500">{label}</p>
          <p className="mt-3 text-3xl font-bold tracking-tight text-slate-900">
            {value}
          </p>
        </div>

        <span
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-xl ${color}`}
          aria-hidden="true"
        >
          {icon}
        </span>
      </div>

      <p className="mt-2 text-sm leading-5 text-slate-500">{detail}</p>

      <p className="mt-4 flex items-center gap-1 text-sm font-semibold text-blue-600">
        View details <span aria-hidden="true">→</span>
      </p>
    </>
  );

  const className =
    "group block w-full rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600";

  if (href) {
    return (
      <Link href={href} className={className}>
        {content}
      </Link>
    );
  }

  return (
    <button type="button" onClick={onClick} className={className}>
      {content}
    </button>
  );
}

function BookingStatus({ status }) {
  const normalizedStatus = String(status || "pending").toLowerCase();

  return (
    <span
      className={`inline-flex rounded-full px-3 py-1.5 text-xs font-semibold capitalize ring-1 ring-inset ${
        statusStyles[normalizedStatus] || statusStyles.pending
      }`}
    >
      {statusLabels[normalizedStatus] || normalizedStatus}
    </span>
  );
}

function BookingCard({
  booking,
  car,
  updatingId,
  confirmation,
  onRequestAction,
  onConfirmAction,
  onCancelAction,
}) {
  const status = String(booking.status || "pending").toLowerCase();
  const actions = statusActions[status] || [];
  const bookingId = String(booking.id);
  const isUpdating = updatingId === bookingId;
  const isConfirming = confirmation?.bookingId === bookingId;
  const selectedAction = actions.find(
    (action) => action.value === confirmation?.nextStatus
  );

  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
      <div className="flex flex-col gap-4 sm:flex-row">
        <Link
          href={getCarHref(car)}
          className="relative block h-48 w-full shrink-0 overflow-hidden rounded-xl bg-slate-100 sm:h-32 sm:w-44"
          aria-label={`View ${car ? `${car.year} ${car.make} ${car.model}` : "vehicle details"}`}
        >
          {car?.image ? (
            <Image
              src={car.image}
              alt={`${car.year || ""} ${car.make || ""} ${car.model || ""}`.trim()}
              fill
              sizes="(max-width: 640px) 100vw, 176px"
              className="object-cover transition-transform duration-300 hover:scale-105"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-4xl">
              🚘
            </div>
          )}
        </Link>

        <div className="min-w-0 flex-1">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <Link
                href={getCarHref(car)}
                className="font-bold text-slate-900 underline-offset-4 hover:text-blue-600 hover:underline"
              >
                {car
                  ? `${car.year} ${car.make} ${car.model}`
                  : `Booking #${booking.id}`}
              </Link>

              <p className="mt-2 text-sm text-slate-500">
                {formatDate(booking.startDate)} – {formatDate(booking.endDate)}
              </p>

              <p className="mt-1 text-sm text-slate-500">
                Booking reference: {booking.id}
              </p>
            </div>

            <div className="flex shrink-0 flex-col items-start gap-2 sm:items-end">
              <BookingStatus status={status} />
              <p className="text-lg font-bold text-slate-900">
                {formatCurrency(booking.totalPrice)}
              </p>
            </div>
          </div>

          {actions.length > 0 && !isConfirming && (
            <div className="mt-4 flex flex-wrap gap-2">
              {actions.map((action) => (
                <button
                  key={action.value}
                  type="button"
                  disabled={isUpdating}
                  onClick={() => onRequestAction(booking, action)}
                  className={`inline-flex min-h-10 items-center justify-center rounded-lg border px-3 py-2 text-sm font-semibold transition disabled:cursor-wait disabled:opacity-60 ${
                    action.destructive
                      ? "border-red-200 text-red-700 hover:bg-red-50"
                      : "border-blue-200 text-blue-700 hover:bg-blue-50"
                  }`}
                >
                  {action.label}
                </button>
              ))}
            </div>
          )}

          {isConfirming && selectedAction && (
            <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4">
              <p className="text-sm font-semibold text-slate-900">
                {selectedAction.label}?
              </p>
              <p className="mt-1 text-sm leading-5 text-slate-600">
                Confirm this change for this booking. The current status will
                update only if the change saves successfully.
              </p>

              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={isUpdating}
                  onClick={() => onConfirmAction(booking, selectedAction)}
                  className="inline-flex min-h-10 items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-60"
                >
                  {isUpdating ? "Saving..." : "Confirm"}
                </button>

                <button
                  type="button"
                  disabled={isUpdating}
                  onClick={onCancelAction}
                  className="inline-flex min-h-10 items-center justify-center rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
                >
                  Keep current status
                </button>
              </div>
            </div>
          )}

          {actions.length === 0 && (
            <p className="mt-3 text-xs text-slate-400">
              No further actions available.
            </p>
          )}
        </div>
      </div>
    </article>
  );
}

export default function OwnerDashboardPage() {
  const [user, setUser] = useState(null);
  const [cars, setCars] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState("dashboard");
  const [updatingId, setUpdatingId] = useState(null);
  const [confirmation, setConfirmation] = useState(null);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("success");

  const loadDashboard = useCallback(() => {
    const currentUser = getCurrentUser();
    setUser(currentUser);

    if (!currentUser || currentUser.role !== "owner") {
      setCars([]);
      setBookings([]);
      setLoading(false);
      return;
    }

    try {
      const storedCars = JSON.parse(
        localStorage.getItem("sheggar-wheels-cars") || "[]"
      );

      const uniqueCars = new Map();

      // Add seeded cars first, then let saved listings replace matching IDs.
      [...carsData, ...(Array.isArray(storedCars) ? storedCars : [])].forEach(
        (car) => {
          if (car?.id) uniqueCars.set(String(car.id), car);
        }
      );

      const ownerCars = Array.from(uniqueCars.values()).filter(
        (car) =>
          String(car.ownerId) === String(currentUser.id) ||
          String(car.ownerEmail || "").toLowerCase() ===
            String(currentUser.email || "").toLowerCase()
      );

      setCars(ownerCars);
    } catch {
      setCars([]);
    }

    try {
      setBookings(getBookingsByOwner(currentUser.id) || []);
    } catch {
      setBookings([]);
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    loadDashboard();

    const refresh = () => loadDashboard();
    window.addEventListener("focus", refresh);
    window.addEventListener("storage", refresh);

    return () => {
      window.removeEventListener("focus", refresh);
      window.removeEventListener("storage", refresh);
    };
  }, [loadDashboard]);

  const allCars = useMemo(() => {
    const uniqueCars = new Map();

    [...carsData, ...cars].forEach((car) => {
      if (car?.id) uniqueCars.set(String(car.id), car);
    });

    return Array.from(uniqueCars.values());
  }, [cars]);

  const pendingBookings = useMemo(
    () =>
      bookings
        .filter((booking) => booking.status === "pending")
        .sort((a, b) => getBookingTime(b) - getBookingTime(a)),
    [bookings]
  );

  const currentBookings = useMemo(
    () =>
      bookings
        .filter((booking) => ["confirmed", "active"].includes(booking.status))
        .sort((a, b) => getBookingTime(b) - getBookingTime(a)),
    [bookings]
  );

  const recentBookings = useMemo(
    () =>
      [...bookings]
        .sort((a, b) => getBookingTime(b) - getBookingTime(a))
        .slice(0, 5),
    [bookings]
  );

  const completedBookings = bookings.filter(
    (booking) => booking.status === "completed"
  );

  const earnings = completedBookings.reduce(
    (total, booking) => total + Number(booking.totalPrice || 0),
    0
  );

  const handleRequestAction = (booking, action) => {
    setMessage("");
    setConfirmation({
      bookingId: String(booking.id),
      nextStatus: action.value,
    });
  };

  const handleCancelAction = () => {
    if (updatingId) return;
    setConfirmation(null);
  };

  const handleConfirmAction = (booking, action) => {
    if (!action || updatingId) return;

    const currentStatus = String(booking.status || "pending").toLowerCase();
    const allowedActions = statusActions[currentStatus] || [];
    const isAllowed = allowedActions.some(
      (item) => item.value === action.value
    );

    if (!isAllowed) {
      setMessageType("error");
      setMessage("That status change is not allowed.");
      setConfirmation(null);
      return;
    }

    setUpdatingId(String(booking.id));
    setMessage("");

    try {
      const result = updateBookingStatus(booking.id, action.value);

      if (!result?.success) {
        setMessageType("error");
        setMessage(result?.error || "The booking status could not be updated.");
        return;
      }

      setBookings((previous) =>
        previous.map((item) =>
          String(item.id) === String(booking.id)
            ? { ...item, ...result.booking }
            : item
        )
      );

      setConfirmation(null);
      setMessageType("success");
      setMessage(
        `Booking status updated to ${statusLabels[action.value] || action.value}.`
      );
    } catch (error) {
      console.error("Could not update booking status:", error);
      setMessageType("error");
      setMessage("The booking status could not be updated. Please try again.");
    } finally {
      setUpdatingId(null);
    }
  };

  if (loading) {
    return (
      <main className="flex min-h-[50vh] items-center justify-center px-4">
        <p className="text-sm text-slate-500">Loading your dashboard...</p>
      </main>
    );
  }

  if (!user || user.role !== "owner") {
    return (
      <main className="flex min-h-[50vh] items-center justify-center px-4">
        <div className="max-w-md rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm">
          <p className="text-3xl" aria-hidden="true">🔒</p>
          <h1 className="mt-3 text-xl font-bold text-slate-900">
            Owner access required
          </h1>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            Sign in with an owner account to manage your vehicles and bookings.
          </p>
          <Link
            href="/signin"
            className="mt-5 inline-flex min-h-11 items-center justify-center rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
          >
            Sign in
          </Link>
        </div>
      </main>
    );
  }

  const isBookingView = view === "pending" || view === "current";
  const activeBookings =
    view === "pending" ? pendingBookings : currentBookings;

  const viewTitle =
    view === "pending" ? "Pending Requests" : "Current Rentals";

  const viewDescription =
    view === "pending"
      ? "Review every booking request awaiting your decision."
      : "Review confirmed and active rentals and update their status.";

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        {isBookingView ? (
          <>
            <button
              type="button"
              onClick={() => {
                setView("dashboard");
                setConfirmation(null);
                setMessage("");
              }}
              className="mb-5 inline-flex min-h-10 items-center gap-2 rounded-lg px-3 text-sm font-semibold text-blue-700 transition hover:bg-blue-50"
            >
              <span aria-hidden="true">←</span> Back to dashboard
            </button>

            <section className="rounded-3xl bg-gradient-to-r from-blue-700 to-blue-500 p-6 text-white shadow-sm sm:p-9">
              <p className="text-sm font-semibold tracking-wide text-blue-100">
                OWNER WORKSPACE
              </p>
              <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
                {viewTitle}
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-blue-50 sm:text-base">
                {viewDescription}
              </p>
              <p className="mt-4 text-sm font-semibold text-white">
                {activeBookings.length}{" "}
                {activeBookings.length === 1 ? "booking" : "bookings"}
              </p>
            </section>

            {message && (
              <p
                role="status"
                className={`mt-5 rounded-xl border px-4 py-3 text-sm ${
                  messageType === "error"
                    ? "border-red-200 bg-red-50 text-red-800"
                    : "border-emerald-200 bg-emerald-50 text-emerald-800"
                }`}
              >
                {message}
              </p>
            )}

            {activeBookings.length === 0 ? (
              <div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-white px-5 py-14 text-center">
                <p className="text-4xl" aria-hidden="true">🚘</p>
                <h2 className="mt-3 text-lg font-bold text-slate-900">
                  {view === "pending"
                    ? "No pending requests"
                    : "No current rentals"}
                </h2>
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  {view === "pending"
                    ? "New requests awaiting your decision will appear here."
                    : "Confirmed and active rentals will appear here."}
                </p>
              </div>
            ) : (
              <div className="mt-6 space-y-4">
                {activeBookings.map((booking) => (
                  <BookingCard
                    key={booking.id}
                    booking={booking}
                    car={getCar(booking.carId, allCars)}
                    updatingId={updatingId}
                    confirmation={confirmation}
                    onRequestAction={handleRequestAction}
                    onConfirmAction={handleConfirmAction}
                    onCancelAction={handleCancelAction}
                  />
                ))}
              </div>
            )}
          </>
        ) : (
          <>
            <section className="overflow-hidden rounded-3xl bg-gradient-to-r from-blue-700 to-blue-500 p-6 text-white shadow-sm sm:p-9">
              <p className="text-sm font-semibold tracking-wide text-blue-100">
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
                  className="inline-flex min-h-11 items-center justify-center rounded-xl bg-yellow-400 px-5 py-3 text-sm font-semibold text-blue-900 transition hover:bg-yellow-300"
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
                label="My Vehicles"
                value={cars.length}
                detail="Vehicles linked to your account"
                icon="🚘"
                color="bg-blue-50"
                href="/owner/cars"
              />
              <StatCard
                label="Pending Requests"
                value={pendingBookings.length}
                detail="Bookings awaiting a decision"
                icon="⏳"
                color="bg-amber-50"
                onClick={() => {
                  setView("pending");
                  setMessage("");
                }}
              />
              <StatCard
                label="Current Rentals"
                value={currentBookings.length}
                detail="Confirmed or active bookings"
                icon="🔑"
                color="bg-emerald-50"
                onClick={() => {
                  setView("current");
                  setMessage("");
                }}
              />

              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-slate-500">
                      Completed Rental Value
                    </p>
                    <p className="mt-3 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                      {formatCurrency(earnings)}
                    </p>
                  </div>
                  <span
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-violet-50 text-xl"
                    aria-hidden="true"
                  >
                    💰
                  </span>
                </div>
                <p className="mt-2 text-sm leading-5 text-slate-500">
                  Total value of completed bookings
                </p>
              </div>
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
                    className="inline-flex min-h-10 items-center rounded-lg px-2 text-sm font-semibold text-blue-600 transition hover:bg-blue-50 hover:text-blue-700"
                  >
                    Manage cars →
                  </Link>
                </div>

                {message && (
                  <p
                    role="status"
                    className={`mt-4 rounded-lg border px-3 py-2 text-sm ${
                      messageType === "error"
                        ? "border-red-200 bg-red-50 text-red-800"
                        : "border-emerald-200 bg-emerald-50 text-emerald-800"
                    }`}
                  >
                    {message}
                  </p>
                )}

                {recentBookings.length === 0 ? (
                  <div className="mt-5 rounded-xl border border-dashed border-slate-300 px-5 py-10 text-center">
                    <p className="text-3xl" aria-hidden="true">🚘</p>
                    <h3 className="mt-3 font-semibold text-slate-900">
                      No booking requests yet
                    </h3>
                    <p className="mt-2 text-sm leading-6 text-slate-500">
                      When renters book one of your vehicles, their requests
                      will appear here.
                    </p>
                  </div>
                ) : (
                  <div className="mt-4 space-y-3">
                    {recentBookings.map((booking) => (
                      <div
                        key={booking.id}
                        className="flex flex-col gap-3 rounded-xl border border-slate-100 p-4 sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div className="min-w-0">
                          <Link
                            href={getCarHref(getCar(booking.carId, allCars))}
                            className="font-semibold text-slate-900 underline-offset-4 hover:text-blue-600 hover:underline"
                          >
                            {(() => {
                              const car = getCar(booking.carId, allCars);
                              return car
                                ? `${car.year} ${car.make} ${car.model}`
                                : `Booking #${booking.id}`;
                            })()}
                          </Link>
                          <p className="mt-1 text-sm text-slate-500">
                            {formatDate(booking.startDate)} –{" "}
                            {formatDate(booking.endDate)}
                          </p>
                          <p className="mt-1 text-sm font-bold text-slate-900">
                            {formatCurrency(booking.totalPrice)}
                          </p>
                        </div>
                        <BookingStatus status={booking.status} />
                      </div>
                    ))}
                  </div>
                )}

                <div className="mt-5 flex flex-wrap gap-3 border-t border-slate-100 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setView("pending");
                      setMessage("");
                    }}
                    className="text-sm font-semibold text-blue-600 hover:text-blue-700"
                  >
                    View all pending requests ({pendingBookings.length}) →
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setView("current");
                      setMessage("");
                    }}
                    className="text-sm font-semibold text-blue-600 hover:text-blue-700"
                  >
                    View all current rentals ({currentBookings.length}) →
                  </button>
                </div>
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
                      icon: "🚘",
                    },
                    {
                      title: "Add a vehicle",
                      description: "Create a new car listing",
                      href: "/owner/cars/new",
                      icon: "＋",
                    },
                    {
                      title: "Earnings",
                      description: "Review your rental income",
                      href: "/owner/earnings",
                      icon: "💰",
                    },
                    {
                      title: "Reviews",
                      description: "Read renter feedback",
                      href: "/owner/reviews",
                      icon: "⭐",
                    },
                    {
                      title: "Disputes",
                      description: "Review reported issues",
                      href: "/owner/disputes",
                      icon: "🛡️",
                    },
                  ].map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="group flex items-center gap-3 rounded-xl border border-slate-200 p-4 transition hover:border-blue-300 hover:bg-blue-50/50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
                    >
                      <span
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-lg transition group-hover:bg-white"
                        aria-hidden="true"
                      >
                        {item.icon}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block font-semibold text-slate-900">
                          {item.title}
                        </span>
                        <span className="mt-1 block text-sm text-slate-500">
                          {item.description}
                        </span>
                      </span>
                      <span
                        className="text-slate-400 transition group-hover:translate-x-0.5 group-hover:text-blue-600"
                        aria-hidden="true"
                      >
                        →
                      </span>
                    </Link>
                  ))}
                </div>
              </aside>
            </section>

            <p className="mt-6 text-xs leading-5 text-slate-500">
              This dashboard displays demo data stored in your browser.
              Earnings are calculated from completed bookings and are not a
              live payment balance.
            </p>
          </>
        )}
      </div>
    </main>
  );
}
