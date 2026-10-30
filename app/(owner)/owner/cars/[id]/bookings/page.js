"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import cars from "@/data/cars.json";
import { getCurrentUser } from "@/lib/auth";
import {
  getBookingsByOwner,
  updateBookingStatus,
} from "@/lib/bookings";
import { formatCurrency } from "@/lib/format";

const statusStyles = {
  pending: "bg-amber-50 text-amber-700 ring-amber-200",
  confirmed: "bg-blue-50 text-blue-700 ring-blue-200",
  active: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  completed: "bg-slate-100 text-slate-700 ring-slate-200",
  cancelled: "bg-rose-50 text-rose-700 ring-rose-200",
  rejected: "bg-red-50 text-red-700 ring-red-200",
};

const statusLabels = {
  pending: "Pending approval",
  confirmed: "Confirmed",
  active: "Active rental",
  completed: "Completed",
  cancelled: "Cancelled",
  rejected: "Rejected",
};

function getAllCars() {
  try {
    const savedCars = JSON.parse(
      window.localStorage.getItem("sheggar-wheels-cars") || "[]"
    );

    const carMap = new Map();

    cars.forEach((car) => carMap.set(String(car.id), car));

    savedCars.forEach((car) => {
      if (car?.id) carMap.set(String(car.id), car);
    });

    return Array.from(carMap.values());
  } catch {
    return cars;
  }
}

function formatDate(dateString) {
  if (!dateString) return "Not provided";

  const date = new Date(`${dateString}T00:00:00`);

  if (Number.isNaN(date.getTime())) return dateString;

  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

function formatDateTime(dateString) {
  if (!dateString) return "Date unavailable";

  const date = new Date(dateString);

  if (Number.isNaN(date.getTime())) return "Date unavailable";

  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function getPaymentLabel(booking) {
  if (booking.paymentStatus === "demo_paid") {
    return "Demo payment recorded";
  }

  if (
    booking.paymentStatus === "pay_at_pickup" ||
    booking.paymentMethod === "pay_at_pickup"
  ) {
    return "Pay at pickup";
  }

  return "Payment not recorded";
}

function getAvailableActions(status) {
  switch (status) {
    case "pending":
      return [
        { value: "confirmed", label: "Approve booking" },
        { value: "rejected", label: "Reject request" },
      ];
    case "confirmed":
      return [
        { value: "active", label: "Start rental" },
        { value: "cancelled", label: "Cancel booking" },
      ];
    case "active":
      return [{ value: "completed", label: "Mark completed" }];
    default:
      return [];
  }
}

export default function OwnerCarBookingsPage() {
  const params = useParams();
  const router = useRouter();
  const carId = Array.isArray(params.id) ? params.id[0] : params.id;

  const [user, setUser] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [car, setCar] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState("");
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  const refreshData = useCallback((ownerId, selectedCarId) => {
    if (!ownerId || !selectedCarId) return;

    const allCars = getAllCars();
    const selectedCar = allCars.find(
      (item) => String(item.id) === String(selectedCarId)
    );

    setCar(selectedCar ?? null);

    setBookings(
      getBookingsByOwner(String(ownerId)).filter(
        (booking) => String(booking.carId) === String(selectedCarId)
      )
    );
  }, []);

  useEffect(() => {
    let cancelled = false;
    let refreshFromStorage;

    const timeoutId = window.setTimeout(() => {
      const currentUser = getCurrentUser();

      if (!currentUser || currentUser.role !== "owner") {
        router.replace("/signin");
        return;
      }

      const allCars = getAllCars();
      const selectedCar = allCars.find(
        (item) => String(item.id) === String(carId)
      );

      if (
        !selectedCar ||
        String(selectedCar.ownerId) !== String(currentUser.id)
      ) {
        if (cancelled) return;

        setUser(currentUser);
        setAuthChecked(true);
        setLoading(false);
        setError("This car was not found in your listings.");
        return;
      }

      if (cancelled) return;

      setUser(currentUser);
      refreshData(currentUser.id, carId);
      setAuthChecked(true);
      setLoading(false);

      refreshFromStorage = () => {
        if (!cancelled) {
          refreshData(currentUser.id, carId);
        }
      };

      window.addEventListener("focus", refreshFromStorage);
      window.addEventListener("storage", refreshFromStorage);
    }, 0);

    return () => {
      cancelled = true;
      window.clearTimeout(timeoutId);

      if (refreshFromStorage) {
        window.removeEventListener("focus", refreshFromStorage);
        window.removeEventListener("storage", refreshFromStorage);
      }
    };
  }, [carId, router, refreshData]);

  const summary = useMemo(() => {
    const count = (status) =>
      bookings.filter((booking) => booking.status === status).length;

    return {
      total: bookings.length,
      pending: count("pending"),
      confirmed: count("confirmed"),
      active: count("active"),
      completed: count("completed"),
    };
  }, [bookings]);

  const filteredBookings = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return [...bookings]
      .filter((booking) => filter === "all" || booking.status === filter)
      .filter((booking) => {
        if (!normalizedSearch) return true;

        const searchableText = [
          booking.id,
          booking.contact?.fullName,
          booking.contact?.email,
          booking.contact?.phone,
          booking.status,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        return searchableText.includes(normalizedSearch);
      })
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() -
          new Date(a.createdAt).getTime()
      );
  }, [bookings, filter, search]);

  function handleStatusChange(booking, nextStatus) {
    const allowedActions = getAvailableActions(booking.status);

    if (!allowedActions.some((action) => action.value === nextStatus)) {
      setError("That status change is not allowed.");
      setNotice("");
      return;
    }

    const confirmationMessages = {
      confirmed: "Approve this booking request?",
      rejected: "Reject this booking request?",
      active: "Mark this rental as active?",
      cancelled: "Cancel this confirmed booking?",
      completed: "Mark this rental as completed?",
    };

    if (!window.confirm(confirmationMessages[nextStatus])) return;

    setUpdatingId(booking.id);
    setError("");
    setNotice("");

    const result = updateBookingStatus(booking.id, nextStatus);

    if (!result.success) {
      setError(result.error || "Unable to update this booking.");
      setUpdatingId("");
      return;
    }

    refreshData(user.id, carId);
    setNotice(
      `Booking status updated to ${statusLabels[nextStatus].toLowerCase()}.`
    );
    setUpdatingId("");
  }

  if (!authChecked || loading) {
    return (
      <main className="mx-auto max-w-7xl px-4 py-16">
        <p className="text-center text-slate-500">
          Loading this car&apos;s bookings…
        </p>
      </main>
    );
  }

  if (!user) return null;

  if (!car) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-16">
        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center">
          <h1 className="text-2xl font-bold text-slate-900">
            Car not found
          </h1>
          <p className="mt-3 text-slate-600">
            {error || "This car is not part of your listings."}
          </p>
          <Link
            href="/owner/cars"
            className="mt-6 inline-flex rounded-lg bg-[#0866F5] px-5 py-3 font-semibold text-white hover:bg-[#0754C7]"
          >
            Back to My Cars
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
      <div className="mx-auto max-w-7xl">
        <Link
          href="/owner/cars"
          className="text-sm font-semibold text-[#0866F5] hover:underline"
        >
          ← Back to My Cars
        </Link>

        <section className="mt-5 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="grid sm:grid-cols-[240px_minmax(0,1fr)]">
            <div className="relative min-h-48 bg-slate-100">
              {car.image ? (
                <Image
                  src={car.image}
                  alt={`${car.year ?? ""} ${car.make ?? ""} ${car.model ?? ""}`.trim()}
                  fill
                  sizes="(max-width: 640px) 100vw, 240px"
                  className="object-cover"
                />
              ) : (
                <div className="flex h-full min-h-48 items-center justify-center text-sm text-slate-400">
                  Car image unavailable
                </div>
              )}
            </div>

            <div className="p-5 sm:p-7">
              <p className="text-sm font-semibold uppercase tracking-wider text-[#0866F5]">
                Owner dashboard
              </p>
              <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
                Booking management
              </h1>
              <h2 className="mt-3 text-xl font-semibold text-slate-800">
                {car.year} {car.make} {car.model}
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                {car.location || "Location not available"}
              </p>

              <div className="mt-5 flex flex-wrap gap-3">
                <Link
                  href={`/owner/cars/${encodeURIComponent(carId)}/availability`}
                  className="inline-flex min-h-10 items-center justify-center rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Manage availability
                </Link>
                <Link
                  href={`/owner/cars/${encodeURIComponent(carId)}/edit`}
                  className="inline-flex min-h-10 items-center justify-center rounded-lg bg-[#0866F5] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0754C7]"
                >
                  Edit car details
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section
          aria-label="Booking summary"
          className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-5"
        >
          {[
            { label: "Total bookings", value: summary.total, color: "text-slate-900" },
            { label: "Awaiting approval", value: summary.pending, color: "text-amber-700" },
            { label: "Confirmed", value: summary.confirmed, color: "text-blue-700" },
            { label: "Active rentals", value: summary.active, color: "text-emerald-700" },
            { label: "Completed", value: summary.completed, color: "text-slate-700" },
          ].map((item) => (
            <div
              key={item.label}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <p className="text-sm font-medium text-slate-500">{item.label}</p>
              <p className={`mt-3 text-3xl font-bold ${item.color}`}>
                {item.value}
              </p>
            </div>
          ))}
        </section>

        {notice && (
          <p
            role="status"
            className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800"
          >
            {notice}
          </p>
        )}

        {error && (
          <p
            role="alert"
            className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
          >
            {error}
          </p>
        )}

        <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h2 className="text-xl font-bold text-slate-900">
                Bookings for this car
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Review renter details and update each booking&apos;s status.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="bookingSearch"
                  className="mb-1 block text-xs font-semibold text-slate-600"
                >
                  Search bookings
                </label>
                <input
                  id="bookingSearch"
                  type="search"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Renter, email, booking ID…"
                  className="min-h-11 w-full rounded-lg border border-slate-300 px-3 text-sm text-slate-900 outline-none focus:border-[#0866F5] focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div>
                <label
                  htmlFor="bookingFilter"
                  className="mb-1 block text-xs font-semibold text-slate-600"
                >
                  Filter by status
                </label>
                <select
                  id="bookingFilter"
                  value={filter}
                  onChange={(event) => setFilter(event.target.value)}
                  className="min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none focus:border-[#0866F5] focus:ring-2 focus:ring-blue-100"
                >
                  <option value="all">All bookings</option>
                  <option value="pending">Pending approval</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="active">Active rental</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>
            </div>
          </div>

          {filteredBookings.length === 0 ? (
            <div className="mt-6 rounded-xl border border-dashed border-slate-300 bg-slate-50 px-5 py-14 text-center">
              <h3 className="text-lg font-bold text-slate-900">
                {bookings.length === 0
                  ? "No bookings for this car yet"
                  : "No matching bookings"}
              </h3>
              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
                {bookings.length === 0
                  ? "When a renter requests this car, the booking will appear here."
                  : "Try another status filter or search term."}
              </p>
            </div>
          ) : (
            <div className="mt-6 space-y-5">
              {filteredBookings.map((booking) => {
                const actions = getAvailableActions(booking.status);
                const contact = booking.contact;

                return (
                  <article
                    key={booking.id}
                    className="rounded-2xl border border-slate-200 p-5 sm:p-6"
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <p className="break-all text-xs font-medium text-slate-500">
                          Booking ID: {booking.id}
                        </p>
                        <h3 className="mt-2 text-lg font-bold text-slate-900">
                          {contact?.fullName || "Renter name not provided"}
                        </h3>
                        <p className="mt-1 break-all text-sm text-slate-600">
                          {contact?.email || "Email not provided"}
                        </p>
                        <p className="mt-1 text-sm text-slate-600">
                          {contact?.phone || "Phone not provided"}
                        </p>
                      </div>

                      <span
                        className={`inline-flex w-fit shrink-0 items-center rounded-full px-3 py-1.5 text-xs font-semibold ring-1 ring-inset ${
                          statusStyles[booking.status] ??
                          "bg-slate-100 text-slate-700 ring-slate-200"
                        }`}
                      >
                        {statusLabels[booking.status] ?? booking.status}
                      </span>
                    </div>

                    <div className="mt-5 grid gap-5 border-t border-slate-200 pt-5 sm:grid-cols-2 xl:grid-cols-4">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                          Pickup
                        </p>
                        <p className="mt-2 font-semibold text-slate-900">
                          {formatDate(booking.startDate)}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                          Return
                        </p>
                        <p className="mt-2 font-semibold text-slate-900">
                          {formatDate(booking.endDate)}
                        </p>
                        <p className="mt-1 text-sm text-slate-500">
                          {booking.totalDays}{" "}
                          {booking.totalDays === 1 ? "day" : "days"}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                          Total price
                        </p>
                        <p className="mt-2 text-xl font-bold text-[#0866F5]">
                          {formatCurrency(booking.totalPrice)}
                        </p>
                        <p className="mt-1 text-sm text-slate-500">
                          {formatCurrency(booking.dailyPrice)} / day
                        </p>
                      </div>

                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                          Payment
                        </p>
                        <p className="mt-2 font-semibold text-slate-900">
                          {getPaymentLabel(booking)}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          Requested {formatDateTime(booking.createdAt)}
                        </p>
                      </div>
                    </div>

                    {actions.length > 0 && (
                      <div className="mt-5 flex flex-wrap gap-2 border-t border-slate-200 pt-4">
                        {actions.map((action) => {
                          const isRejectOrCancel = [
                            "rejected",
                            "cancelled",
                          ].includes(action.value);

                          return (
                            <button
                              key={action.value}
                              type="button"
                              disabled={updatingId === booking.id}
                              onClick={() =>
                                handleStatusChange(booking, action.value)
                              }
                              className={`min-h-10 rounded-lg px-4 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${
                                isRejectOrCancel
                                  ? "border border-red-200 bg-white text-red-700 hover:bg-red-50"
                                  : "bg-[#0866F5] text-white hover:bg-[#0754C7]"
                              }`}
                            >
                              {updatingId === booking.id
                                ? "Updating…"
                                : action.label}
                            </button>
                          );
                        })}
                      </div>
                    )}
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
