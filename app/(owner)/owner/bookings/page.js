"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";

import { getCurrentUser } from "@/lib/auth";
import {
  getBookingsByOwner,
  updateBookingStatus,
} from "@/lib/bookings";
import { formatCurrency } from "@/lib/format";
import cars from "@/data/cars.json";

const STATUS_LABELS = {
  pending: "Pending",
  confirmed: "Confirmed",
  active: "Active Rental",
  completed: "Completed",
  cancelled: "Cancelled",
  rejected: "Rejected",
};

const STATUS_STYLES = {
  pending: "bg-amber-50 text-amber-700 ring-amber-200",
  confirmed: "bg-blue-50 text-blue-700 ring-blue-200",
  active: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  completed: "bg-slate-100 text-slate-700 ring-slate-200",
  cancelled: "bg-red-50 text-red-700 ring-red-200",
  rejected: "bg-red-50 text-red-700 ring-red-200",
};

function getAvailableActions(status) {
  switch (status) {
    case "pending":
      return [
        { label: "Approve booking", value: "confirmed" },
        { label: "Reject request", value: "rejected" },
      ];

    case "confirmed":
      return [
        { label: "Start rental", value: "active" },
        { label: "Cancel booking", value: "cancelled" },
      ];

    case "active":
      return [{ label: "Mark completed", value: "completed" }];

    default:
      return [];
  }
}

function getCarId(booking) {
  return String(booking.carId ?? booking.car_id ?? "");
}

function getBookingId(booking) {
  return String(booking.id ?? booking.bookingId ?? "");
}

function getBookingStatus(booking) {
  return String(booking.status ?? "pending").toLowerCase();
}

function getBookingCar(booking, allCars) {
  const carId = getCarId(booking);

  return allCars.find((car) => String(car.id) === carId);
}

function getRenterName(booking) {
  return (
    booking.renterName ??
    booking.renter?.name ??
    booking.customerName ??
    booking.userName ??
    "Renter"
  );
}

function getRenterEmail(booking) {
  return (
    booking.renterEmail ??
    booking.renter?.email ??
    booking.customerEmail ??
    booking.userEmail ??
    ""
  );
}

function getStartDate(booking) {
  return (
    booking.startDate ??
    booking.start_date ??
    booking.pickupDate ??
    booking.from ??
    ""
  );
}

function getEndDate(booking) {
  return (
    booking.endDate ??
    booking.end_date ??
    booking.returnDate ??
    booking.to ??
    ""
  );
}

function formatDate(value) {
  if (!value) return "Not specified";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return String(value);

  return date.toLocaleDateString("en-ET", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function getBookingPrice(booking) {
  return (
    booking.totalPrice ??
    booking.totalAmount ??
    booking.total ??
    booking.price ??
    booking.amount ??
    0
  );
}

function getCarTitle(car) {
  if (!car) return "Vehicle details unavailable";

  return [car.year, car.make, car.model].filter(Boolean).join(" ");
}

function getActionTitle(status) {
  const titles = {
    confirmed: "Approve booking?",
    rejected: "Reject booking request?",
    active: "Start this rental?",
    cancelled: "Cancel booking?",
    completed: "Complete this rental?",
  };

  return titles[status] ?? "Update booking?";
}

function getActionDescription(status) {
  const descriptions = {
    confirmed: "This will confirm the renter’s booking request.",
    rejected: "This will reject the renter’s booking request.",
    active: "This will mark the rental as active.",
    cancelled: "This will cancel the confirmed booking.",
    completed: "This will mark the rental as completed.",
  };

  return descriptions[status] ?? "Confirm that you want to update this booking.";
}

function getActionButtonLabel(status) {
  const labels = {
    confirmed: "Confirm Approval",
    rejected: "Confirm Rejection",
    active: "Start Rental",
    cancelled: "Confirm Cancellation",
    completed: "Mark Completed",
  };

  return labels[status] ?? "Confirm";
}

function getActionButtonStyle(status) {
  if (["rejected", "cancelled"].includes(status)) {
    return "bg-red-600 hover:bg-red-700 focus-visible:ring-red-500";
  }

  return "bg-[#0866F5] hover:bg-[#0754C7] focus-visible:ring-[#0866F5]";
}

export default function OwnerBookingsPage() {
  const [user, setUser] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [pendingAction, setPendingAction] = useState(null);

  const allCars = useMemo(() => {
    let storedCars = [];

    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("sheggar-wheels-cars");
        storedCars = saved ? JSON.parse(saved) : [];
      } catch {
        storedCars = [];
      }
    }

    const combined = [
      ...(Array.isArray(cars) ? cars : []),
      ...(Array.isArray(storedCars) ? storedCars : []),
    ];

    return combined.filter(
      (car, index, list) =>
        index === list.findIndex((item) => String(item.id) === String(car.id))
    );
  }, []);

  const refreshData = useCallback((ownerId) => {
    if (!ownerId) {
      setBookings([]);
      setLoading(false);
      return;
    }

    try {
      const result = getBookingsByOwner(String(ownerId));
      setBookings(Array.isArray(result) ? result : []);
    } catch {
      setBookings([]);
      setError("Unable to load your bookings. Please refresh the page.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    Promise.resolve().then(() => {
      if (cancelled) return;

      const currentUser = getCurrentUser();

      if (!currentUser) {
        setLoading(false);
        return;
      }

      setUser(currentUser);
      refreshData(currentUser.id);
    });

    return () => {
      cancelled = true;
    };
  }, [refreshData]);

  const visibleBookings = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return bookings.filter((booking) => {
      const car = getBookingCar(booking, allCars);
      const status = getBookingStatus(booking);

      const matchesStatus =
        statusFilter === "all" || status === statusFilter;

      const searchableText = [
        getBookingId(booking),
        getCarTitle(car),
        getRenterName(booking),
        getRenterEmail(booking),
        status,
      ]
        .join(" ")
        .toLowerCase();

      const matchesSearch =
        !normalizedSearch || searchableText.includes(normalizedSearch);

      return matchesStatus && matchesSearch;
    });
  }, [bookings, allCars, search, statusFilter]);

  const summary = useMemo(() => {
    const count = (status) =>
      bookings.filter((booking) => getBookingStatus(booking) === status).length;

    return {
      total: bookings.length,
      pending: count("pending"),
      confirmed: count("confirmed"),
      active: count("active"),
      completed: count("completed"),
    };
  }, [bookings]);

  function requestStatusChange(booking, nextStatus) {
    const allowedActions = getAvailableActions(getBookingStatus(booking));

    if (!allowedActions.some((action) => action.value === nextStatus)) {
      setError("That status change is not allowed.");
      setNotice("");
      return;
    }

    setError("");
    setNotice("");
    setPendingAction({ booking, nextStatus });
  }

  function confirmStatusChange() {
    if (!pendingAction || !user || updatingId) return;

    const { booking, nextStatus } = pendingAction;
    const bookingId = getBookingId(booking);

    setUpdatingId(bookingId);
    setError("");
    setNotice("");
    setPendingAction(null);

    try {
      const result = updateBookingStatus(bookingId, nextStatus);

      if (!result?.success) {
        setError(result?.error || "Unable to update this booking.");
        setUpdatingId("");
        return;
      }

      refreshData(user.id);
      setNotice(
        `Booking status updated to ${
          STATUS_LABELS[nextStatus]?.toLowerCase() ?? nextStatus
        }.`
      );
    } catch {
      setError("Something went wrong while updating the booking.");
    } finally {
      setUpdatingId("");
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[#F7F9FC] px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="animate-pulse rounded-2xl border border-slate-200 bg-white p-8">
            <div className="h-7 w-56 rounded bg-slate-200" />
            <div className="mt-4 h-4 w-80 max-w-full rounded bg-slate-100" />
            <div className="mt-8 h-32 rounded-xl bg-slate-100" />
          </div>
        </div>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#F7F9FC] px-4 py-12">
        <section className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <h1 className="text-2xl font-bold text-slate-900">
            Sign in to view bookings
          </h1>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            Sign in to manage booking requests for your vehicles.
          </p>
          <Link
            href="/signin?next=%2Fowner%2Fbookings"
            className="mt-6 inline-flex min-h-11 items-center justify-center rounded-lg bg-[#0866F5] px-5 py-3 text-sm font-semibold text-white hover:bg-[#0754C7]"
          >
            Sign in
          </Link>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#F7F9FC] px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-[#0866F5]">
              Owner dashboard
            </p>
            <h1 className="mt-1 text-3xl font-bold tracking-tight text-[#252A34]">
              All Bookings
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
              Review requests and manage rentals for all your listed vehicles.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/owner/cars"
              className="inline-flex min-h-11 items-center justify-center rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
            >
              My Cars
            </Link>
            <Link
              href="/owner/earnings"
              className="inline-flex min-h-11 items-center justify-center rounded-lg bg-[#0866F5] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#0754C7]"
            >
              View Earnings
            </Link>
          </div>
        </div>

        {error && (
          <div
            role="alert"
            className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          >
            {error}
          </div>
        )}

        {notice && (
          <div
            role="status"
            className="mb-5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700"
          >
            {notice}
          </div>
        )}

        <section className="mb-7 grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-5">
          {[
            { label: "Total bookings", value: summary.total },
            { label: "Pending requests", value: summary.pending },
            { label: "Confirmed", value: summary.confirmed },
            { label: "Active rentals", value: summary.active },
            { label: "Completed", value: summary.completed },
          ].map((item) => (
            <div
              key={item.label}
              className="rounded-xl border border-[#E5EAF1] bg-white p-5 shadow-sm"
            >
              <p className="text-sm text-slate-500">{item.label}</p>
              <p className="mt-2 text-3xl font-bold text-[#252A34]">
                {item.value}
              </p>
            </div>
          ))}
        </section>

        <section className="rounded-2xl border border-[#E5EAF1] bg-white p-4 shadow-sm sm:p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-lg font-bold text-[#252A34]">
                Booking requests and rentals
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                {visibleBookings.length}{" "}
                {visibleBookings.length === 1 ? "booking" : "bookings"} found
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block">
                <span className="sr-only">Search bookings</span>
                <input
                  type="search"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search car, renter, booking ID..."
                  className="min-h-11 w-full rounded-lg border border-slate-300 px-3 text-sm text-slate-900 outline-none transition focus:border-[#0866F5] focus:ring-2 focus:ring-blue-100"
                />
              </label>

              <label className="block">
                <span className="sr-only">Filter by status</span>
                <select
                  value={statusFilter}
                  onChange={(event) => setStatusFilter(event.target.value)}
                  className="min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-[#0866F5] focus:ring-2 focus:ring-blue-100"
                >
                  <option value="all">All statuses</option>
                  <option value="pending">Pending</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="active">Active Rental</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                  <option value="rejected">Rejected</option>
                </select>
              </label>
            </div>
          </div>

          {visibleBookings.length === 0 ? (
            <div className="mt-6 rounded-xl border border-dashed border-slate-300 px-5 py-14 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-xl">
                <span aria-hidden="true">▤</span>
              </div>
              <h3 className="mt-4 text-lg font-semibold text-slate-900">
                No bookings found
              </h3>
              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
                {bookings.length === 0
                  ? "Booking requests for your vehicles will appear here."
                  : "Try changing your search or status filter."}
              </p>
              {(search || statusFilter !== "all") && (
                <button
                  type="button"
                  onClick={() => {
                    setSearch("");
                    setStatusFilter("all");
                  }}
                  className="mt-4 text-sm font-semibold text-[#0866F5] hover:underline"
                >
                  Clear filters
                </button>
              )}
            </div>
          ) : (
            <div className="mt-6 space-y-4">
              {visibleBookings.map((booking) => {
                const car = getBookingCar(booking, allCars);
                const status = getBookingStatus(booking);
                const bookingId = getBookingId(booking);
                const actions = getAvailableActions(status);
                const carTitle = getCarTitle(car);
                const imageSrc = car?.image || car?.images?.[0] || "";
                const isUpdating = updatingId === bookingId;

                return (
                  <article
                    key={bookingId}
                    className="overflow-hidden rounded-xl border border-[#E5EAF1] bg-white transition-shadow hover:shadow-sm"
                  >
                    <div className="grid gap-0 md:grid-cols-[220px_minmax(0,1fr)]">
                      <div className="relative min-h-48 bg-[#F4F7FB] md:min-h-full">
                        {imageSrc ? (
                          <Image
                            src={imageSrc}
                            alt={carTitle}
                            fill
                            sizes="(max-width: 768px) 100vw, 220px"
                            className="object-cover"
                          />
                        ) : (
                          <div className="flex h-full min-h-48 items-center justify-center text-sm text-slate-400">
                            Vehicle image unavailable
                          </div>
                        )}
                      </div>

                      <div className="min-w-0 p-5 sm:p-6">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                          <div className="min-w-0">
                            <p className="break-all text-xs text-slate-500">
                              Booking ID: {bookingId || "Not available"}
                            </p>
                            <h3 className="mt-1 text-xl font-bold text-[#252A34]">
                              {carTitle}
                            </h3>
                            {car?.location && (
                              <p className="mt-1 text-sm text-slate-500">
                                {car.location}
                              </p>
                            )}
                          </div>

                          <span
                            className={`inline-flex w-fit shrink-0 items-center rounded-full px-3 py-1 text-xs font-semibold ring-1 ring-inset ${
                              STATUS_STYLES[status] ??
                              "bg-slate-100 text-slate-700 ring-slate-200"
                            }`}
                          >
                            {STATUS_LABELS[status] ?? status}
                          </span>
                        </div>

                        <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                          <div>
                            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                              Renter
                            </p>
                            <p className="mt-1 break-words text-sm font-semibold text-slate-900">
                              {getRenterName(booking)}
                            </p>
                            {getRenterEmail(booking) && (
                              <p className="mt-1 break-all text-sm text-slate-500">
                                {getRenterEmail(booking)}
                              </p>
                            )}
                          </div>

                          <div>
                            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                              Rental period
                            </p>
                            <p className="mt-1 text-sm font-semibold text-slate-900">
                              {formatDate(getStartDate(booking))}
                            </p>
                            <p className="mt-1 text-sm text-slate-500">
                              to {formatDate(getEndDate(booking))}
                            </p>
                          </div>

                          <div>
                            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                              Booking total
                            </p>
                            <p className="mt-1 text-lg font-bold text-[#0866F5]">
                              {formatCurrency(getBookingPrice(booking))}
                            </p>
                            {booking.paymentStatus && (
                              <p className="mt-1 text-xs text-slate-500">
                                Payment: {booking.paymentStatus}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="mt-5 flex flex-col gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
                          <Link
                            href={`/owner/cars/${getCarId(booking)}/bookings`}
                            className="inline-flex min-h-10 items-center text-sm font-semibold text-[#0866F5] hover:underline"
                          >
                            View vehicle bookings →
                          </Link>

                          {actions.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                              {actions.map((action) => {
                                const isDangerous = [
                                  "rejected",
                                  "cancelled",
                                ].includes(action.value);

                                return (
                                  <button
                                    key={action.value}
                                    type="button"
                                    disabled={isUpdating}
                                    onClick={() =>
                                      requestStatusChange(booking, action.value)
                                    }
                                    className={`inline-flex min-h-10 items-center justify-center rounded-lg border px-3 py-2 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
                                      isDangerous
                                        ? "border-red-200 bg-white text-red-600 hover:bg-red-50"
                                        : "border-[#0866F5] bg-white text-[#0866F5] hover:bg-blue-50"
                                    }`}
                                  >
                                    {isUpdating ? "Updating..." : action.label}
                                  </button>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </div>

      {pendingAction && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setPendingAction(null);
            }
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="booking-confirmation-title"
            aria-describedby="booking-confirmation-description"
            className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl sm:p-7"
          >
            <div
              className={`flex h-12 w-12 items-center justify-center rounded-full text-xl font-bold ${
                ["rejected", "cancelled"].includes(
                  pendingAction.nextStatus
                )
                  ? "bg-red-50 text-red-600"
                  : "bg-blue-50 text-[#0866F5]"
              }`}
            >
              {["rejected", "cancelled"].includes(
                pendingAction.nextStatus
              )
                ? "!"
                : "✓"}
            </div>

            <h2
              id="booking-confirmation-title"
              className="mt-5 text-xl font-bold text-slate-900"
            >
              {getActionTitle(pendingAction.nextStatus)}
            </h2>

            <p
              id="booking-confirmation-description"
              className="mt-2 text-sm leading-6 text-slate-600"
            >
              {getActionDescription(pendingAction.nextStatus)}
            </p>

            <div className="mt-4 rounded-lg bg-slate-50 p-3">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                Booking
              </p>
              <p className="mt-1 break-all text-sm font-semibold text-slate-900">
                {getBookingId(pendingAction.booking)}
              </p>
              <p className="mt-1 text-sm text-slate-600">
                {getCarTitle(
                  getBookingCar(pendingAction.booking, allCars)
                )}
              </p>
            </div>

            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setPendingAction(null)}
                className="min-h-11 rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
              >
                Keep Current Status
              </button>

              <button
                type="button"
                onClick={confirmStatusChange}
                disabled={Boolean(updatingId)}
                className={`min-h-11 rounded-lg px-4 py-2 text-sm font-semibold text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${getActionButtonStyle(
                  pendingAction.nextStatus
                )}`}
              >
                {getActionButtonLabel(pendingAction.nextStatus)}
              </button>
            </div>
          </section>
        </div>
      )}
    </main>
  );
}
