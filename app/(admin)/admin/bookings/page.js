"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  CalendarDays,
  CarFront,
  CheckCircle2,
  Clock3,
  CreditCard,
  Eye,
  Search,
  XCircle,
} from "lucide-react";
import cars from "@/data/cars.json";
import { getBookings } from "@/lib/bookings";
import { readStoredData, STORAGE_KEYS } from "@/lib/storage";
import { formatCurrency } from "@/lib/format";

const PAGE_SIZE = 8;

const statusStyles = {
  pending: "bg-amber-50 text-amber-700 ring-amber-200",
  confirmed: "bg-blue-50 text-blue-700 ring-blue-200",
  active: "bg-violet-50 text-violet-700 ring-violet-200",
  completed: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  cancelled: "bg-slate-100 text-slate-700 ring-slate-200",
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

function formatDate(value) {
  if (!value) return "—";

  const date = new Date(`${value}T00:00:00`);

  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function getPersonName(user) {
  if (!user) return "Unknown user";
  return user.name || user.fullName || user.email || user.id || "Unknown user";
}

export default function AdminBookingsPage() {
  const [bookings, setBookings] = useState([]);
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    function loadData() {
      setBookings(getBookings());

      const savedUsers = readStoredData(STORAGE_KEYS.users, []);
      setUsers(Array.isArray(savedUsers) ? savedUsers : []);

      setIsLoading(false);
    }

    loadData();

    window.addEventListener("focus", loadData);
    window.addEventListener("storage", loadData);

    return () => {
      window.removeEventListener("focus", loadData);
      window.removeEventListener("storage", loadData);
    };
  }, []);

  const enrichedBookings = useMemo(() => {
    const usersById = new Map(
      users.map((user) => [String(user.id), user])
    );

    const carsById = new Map(
      cars.map((car) => [String(car.id), car])
    );

    try {
      const savedCars = JSON.parse(
        window.localStorage.getItem("sheggar-wheels-cars") || "[]"
      );

      if (Array.isArray(savedCars)) {
        savedCars.forEach((car) => {
          if (car?.id) carsById.set(String(car.id), car);
        });
      }
    } catch {
      // Keep the demo car list if saved data cannot be read.
    }

    return bookings.map((booking) => {
      const car = carsById.get(String(booking.carId));

      const renter =
        usersById.get(String(booking.renterId)) || {
          id: booking.renterId,
          name: booking.contact?.fullName,
          email: booking.contact?.email,
        };

      const owner = usersById.get(String(booking.ownerId));

      return {
        ...booking,
        car,
        carTitle: car
          ? `${car.year || ""} ${car.make || ""} ${car.model || ""}`.trim()
          : `Car ${booking.carId}`,
        renterName: getPersonName(renter),
        renterEmail: renter.email || booking.contact?.email || "",
        ownerName: getPersonName(owner),
        ownerEmail: owner?.email || "",
      };
    });
  }, [bookings, users]);

  const filteredBookings = useMemo(() => {
    const query = search.trim().toLowerCase();

    return enrichedBookings.filter((booking) => {
      const matchesSearch =
        !query ||
        [
          booking.id,
          booking.carTitle,
          booking.car?.location,
          booking.renterName,
          booking.renterEmail,
          booking.ownerName,
          booking.ownerEmail,
        ].some((value) => String(value || "").toLowerCase().includes(query));

      const matchesStatus =
        statusFilter === "all" || booking.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [enrichedBookings, search, statusFilter]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredBookings.length / PAGE_SIZE)
  );

  const currentPage = Math.min(page, totalPages);

  const paginatedBookings = filteredBookings.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  const stats = useMemo(
    () => [
      {
        label: "Total bookings",
        value: bookings.length,
        icon: CalendarDays,
        color: "text-blue-600",
        background: "bg-blue-50",
      },
      {
        label: "Pending",
        value: bookings.filter((item) => item.status === "pending").length,
        icon: Clock3,
        color: "text-amber-600",
        background: "bg-amber-50",
      },
      {
        label: "Confirmed",
        value: bookings.filter((item) => item.status === "confirmed").length,
        icon: CheckCircle2,
        color: "text-emerald-600",
        background: "bg-emerald-50",
      },
      {
        label: "Active rentals",
        value: bookings.filter((item) => item.status === "active").length,
        icon: CarFront,
        color: "text-violet-600",
        background: "bg-violet-50",
      },
      {
        label: "Completed",
        value: bookings.filter((item) => item.status === "completed").length,
        icon: CheckCircle2,
        color: "text-teal-600",
        background: "bg-teal-50",
      },
      {
        label: "Cancelled / rejected",
        value: bookings.filter((item) =>
          ["cancelled", "rejected"].includes(item.status)
        ).length,
        icon: XCircle,
        color: "text-red-600",
        background: "bg-red-50",
      },
    ],
    [bookings]
  );

  function handleSearchChange(value) {
    setSearch(value);
    setPage(1);
  }

  function handleStatusChange(value) {
    setStatusFilter(value);
    setPage(1);
  }

  return (
    <div className="min-w-0 space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-[#0866F5]">
            Platform management
          </p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Bookings
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Monitor rental requests and booking progress across the platform.
          </p>
        </div>

        <span className="inline-flex w-fit items-center rounded-full bg-blue-50 px-3 py-1.5 text-xs font-semibold text-[#0866F5]">
          Demo data
        </span>
      </div>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {stats.map((stat) => {
          const Icon = stat.icon;

          return (
            <div
              key={stat.label}
              className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm text-slate-500">{stat.label}</p>
                  <p className="mt-2 text-2xl font-bold text-slate-900">
                    {isLoading ? "—" : stat.value}
                  </p>
                </div>

                <span
                  className={`flex h-11 w-11 items-center justify-center rounded-xl ${stat.background} ${stat.color}`}
                >
                  <Icon size={21} />
                </span>
              </div>
            </div>
          );
        })}
      </section>

      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 p-4 sm:p-5">
          <div className="flex flex-col gap-3 lg:flex-row">
            <div className="relative flex-1">
              <Search
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="search"
                value={search}
                onChange={(event) => handleSearchChange(event.target.value)}
                placeholder="Search booking, car, renter, or owner..."
                aria-label="Search bookings"
                className="min-h-11 w-full rounded-lg border border-slate-300 bg-white pl-10 pr-3 text-sm text-slate-900 outline-none transition focus:border-[#0866F5] focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(event) => handleStatusChange(event.target.value)}
              aria-label="Filter bookings by status"
              className="min-h-11 rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-700 outline-none focus:border-[#0866F5] focus:ring-2 focus:ring-blue-100"
            >
              <option value="all">All statuses</option>
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="active">Active</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>

          <p className="mt-3 text-sm text-slate-500">
            Showing{" "}
            <span className="font-semibold text-slate-700">
              {filteredBookings.length === 0
                ? 0
                : (currentPage - 1) * PAGE_SIZE + 1}
              {"–"}
              {Math.min(currentPage * PAGE_SIZE, filteredBookings.length)}
            </span>{" "}
            of{" "}
            <span className="font-semibold text-slate-700">
              {filteredBookings.length}
            </span>{" "}
            bookings
          </p>
        </div>

        {isLoading ? (
          <div className="p-10 text-center text-sm text-slate-500">
            Loading bookings…
          </div>
        ) : filteredBookings.length === 0 ? (
          <div className="p-10 text-center">
            <CalendarDays
              size={32}
              className="mx-auto text-slate-300"
            />
            <h2 className="mt-3 font-semibold text-slate-900">
              No bookings found
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Try another search or status filter.
            </p>
          </div>
        ) : (
          <>
            <div className="hidden overflow-x-auto lg:block">
              <table className="w-full min-w-[1050px] text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-5 py-4 font-semibold">Booking</th>
                    <th className="px-5 py-4 font-semibold">Car</th>
                    <th className="px-5 py-4 font-semibold">Renter</th>
                    <th className="px-5 py-4 font-semibold">Owner</th>
                    <th className="px-5 py-4 font-semibold">Rental dates</th>
                    <th className="px-5 py-4 font-semibold">Total</th>
                    <th className="px-5 py-4 font-semibold">Status</th>
                    <th className="px-5 py-4 font-semibold">Payment</th>
                    <th className="px-5 py-4 text-right font-semibold">
                      Details
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {paginatedBookings.map((booking) => (
                    <tr
                      key={booking.id}
                      className="transition hover:bg-slate-50/70"
                    >
                      <td className="px-5 py-4">
                        <p className="font-semibold text-slate-900">
                          {booking.id}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          {formatDate(booking.createdAt)}
                        </p>
                      </td>

                      <td className="px-5 py-4">
                        <p className="font-semibold text-slate-800">
                          {booking.carTitle}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          {booking.car?.location || "Location unavailable"}
                        </p>
                      </td>

                      <td className="px-5 py-4">
                        <p className="font-medium text-slate-800">
                          {booking.renterName}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          {booking.renterEmail || "No email"}
                        </p>
                      </td>

                      <td className="px-5 py-4">
                        <p className="font-medium text-slate-800">
                          {booking.ownerName}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          {booking.ownerEmail || "No email"}
                        </p>
                      </td>

                      <td className="whitespace-nowrap px-5 py-4 text-slate-600">
                        <p>{formatDate(booking.startDate)}</p>
                        <p className="mt-1 text-xs text-slate-500">
                          to {formatDate(booking.endDate)}
                        </p>
                      </td>

                      <td className="whitespace-nowrap px-5 py-4 font-semibold text-slate-900">
                        {formatCurrency(booking.totalPrice)}
                      </td>

                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${
                            statusStyles[booking.status] ||
                            "bg-slate-100 text-slate-700 ring-slate-200"
                          }`}
                        >
                          {statusLabels[booking.status] || booking.status}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        <p className="font-medium text-slate-700">
                          {booking.paymentStatus || "Not recorded"}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          {booking.paymentMethod || "No method"}
                        </p>
                      </td>

                      <td className="px-5 py-4 text-right">
                        <Link
                         href={`/admin/bookings/${encodeURIComponent(booking.id)}`}
                          aria-label={`View booking ${booking.id}`}
                          className="inline-flex min-h-9 items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-[#0866F5] transition hover:border-blue-200 hover:bg-blue-50"
                        >
                          <Eye size={15} />
                          View
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="space-y-4 p-4 lg:hidden">
              {paginatedBookings.map((booking) => (
                <article
                  key={booking.id}
                  className="rounded-xl border border-slate-200 p-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="break-all text-sm font-bold text-slate-900">
                        {booking.id}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        Created {formatDate(booking.createdAt)}
                      </p>
                    </div>

                    <span
                      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${
                        statusStyles[booking.status] ||
                        "bg-slate-100 text-slate-700 ring-slate-200"
                      }`}
                    >
                      {statusLabels[booking.status] || booking.status}
                    </span>
                  </div>

                  <div className="mt-4 flex gap-3">
                    {booking.car?.image ? (
                      <img
                        src={booking.car.image}
                        alt={booking.carTitle}
                        className="h-20 w-24 shrink-0 rounded-lg bg-slate-100 object-cover"
                      />
                    ) : (
                      <div className="flex h-20 w-24 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-400">
                        <CarFront size={25} />
                      </div>
                    )}

                    <div className="min-w-0">
                      <p className="font-semibold text-slate-900">
                        {booking.carTitle}
                      </p>
                      <p className="mt-1 text-sm text-slate-500">
                        {booking.car?.location || "Location unavailable"}
                      </p>
                      <p className="mt-2 font-bold text-[#0866F5]">
                        {formatCurrency(booking.totalPrice)}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-4 border-t border-slate-100 pt-4 text-sm">
                    <div>
                      <p className="text-xs text-slate-500">Renter</p>
                      <p className="mt-1 break-words font-medium text-slate-800">
                        {booking.renterName}
                      </p>
                      <p className="mt-1 break-all text-xs text-slate-500">
                        {booking.renterEmail || "No email"}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-slate-500">Owner</p>
                      <p className="mt-1 break-words font-medium text-slate-800">
                        {booking.ownerName}
                      </p>
                      <p className="mt-1 break-all text-xs text-slate-500">
                        {booking.ownerEmail || "No email"}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-slate-500">Pickup</p>
                      <p className="mt-1 font-medium text-slate-800">
                        {formatDate(booking.startDate)}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-slate-500">Return</p>
                      <p className="mt-1 font-medium text-slate-800">
                        {formatDate(booking.endDate)}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 flex items-center justify-between gap-3 border-t border-slate-100 pt-4">
                    <div className="min-w-0">
                      <p className="text-xs text-slate-500">Payment</p>
                      <p className="mt-1 break-words text-sm font-medium text-slate-700">
                        {booking.paymentStatus || "Not recorded"}
                      </p>
                    </div>

                    <Link
                      href={`/admin/bookings/${encodeURIComponent(booking.id)}`}
                      className="inline-flex min-h-10 shrink-0 items-center gap-2 rounded-lg bg-[#0866F5] px-3 py-2 text-sm font-semibold text-white transition hover:bg-[#0754C7]"
                    >
                      <Eye size={16} />
                      View details
                    </Link>
                  </div>
                </article>
              ))}
            </div>

            <div className="flex flex-col gap-3 border-t border-slate-200 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
              <p className="text-sm text-slate-500">
                Page {currentPage} of {totalPages}
              </p>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setPage((value) => Math.max(1, value - 1))}
                  disabled={currentPage <= 1}
                  className="min-h-10 rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Previous
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setPage((value) => Math.min(totalPages, value + 1))
                  }
                  disabled={currentPage >= totalPages}
                  className="min-h-10 rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            </div>
          </>
        )}
      </section>

      <p className="flex items-start gap-2 text-xs leading-5 text-slate-500">
        <CreditCard size={15} className="mt-0.5 shrink-0" />
        Payment values are demo records only. This page is read-only; booking
        status changes remain part of the renter/owner workflow.
      </p>
    </div>
  );
}