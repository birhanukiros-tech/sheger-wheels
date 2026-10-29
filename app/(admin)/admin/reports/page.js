"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowDownToLine,
  BarChart3,
  CalendarDays,
  CarFront,
  CircleDollarSign,
  Users,
} from "lucide-react";

import { getCurrentUser } from "@/lib/auth";
import { readStoredData, STORAGE_KEYS } from "@/lib/storage";
import carsData from "@/data/cars.json";

const PAGE_SIZE = 8;

function formatCurrency(value) {
  return `ETB ${Number(value || 0).toLocaleString("en-US")}`;
}

function formatLabel(value) {
  return String(value || "unknown")
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function getBookingStatus(booking) {
  return String(booking.status || "unknown").toLowerCase();
}

function getBookingTotal(booking) {
  return Number(
    booking.totalPrice ?? booking.totalAmount ?? booking.total ?? 0
  );
}

function escapeCsv(value) {
  const text = String(value ?? "");
  return `"${text.replace(/"/g, '""')}"`;
}

function downloadCsv(filename, headers, rows) {
  const content = [
    headers.map(escapeCsv).join(","),
    ...rows.map((row) => row.map(escapeCsv).join(",")),
  ].join("\r\n");

  const blob = new Blob(["\uFEFF", content], {
    type: "text/csv;charset=utf-8;",
  });

  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");

  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

function StatCard({ title, value, description, icon: Icon }) {
  return (
    <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-medium text-slate-500">{title}</p>
        <Icon size={21} className="shrink-0 text-[#0866F5]" />
      </div>
      <p className="mt-3 break-words text-2xl font-bold text-slate-900">
        {value}
      </p>
      <p className="mt-2 text-xs text-slate-500">{description}</p>
    </article>
  );
}

export default function AdminReportsPage() {
  const router = useRouter();

  const [bookings, setBookings] = useState([]);
  const [users, setUsers] = useState([]);
  const [cars, setCars] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [disputes, setDisputes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const [bookingPage, setBookingPage] = useState(1);

  useEffect(() => {
    const currentUser = getCurrentUser();

    if (!currentUser || currentUser.role !== "admin") {
      router.replace(
        `/signin?role=admin&next=${encodeURIComponent("/admin/reports")}`
      );
      return;
    }

    const savedCars = readStoredData("sheggar-wheels-cars", []);

    setBookings(readStoredData(STORAGE_KEYS.bookings, []));
    setUsers(readStoredData(STORAGE_KEYS.users, []));
    setCars([
      ...(Array.isArray(carsData) ? carsData : []),
      ...(Array.isArray(savedCars) ? savedCars : []),
    ]);
    setReviews(readStoredData(STORAGE_KEYS.reviews, []));
    setDisputes(readStoredData(STORAGE_KEYS.disputes, []));
    setAuthorized(true);
    setLoading(false);
  }, [router]);

  const summary = useMemo(() => {
    const statuses = bookings.reduce((result, booking) => {
      const status = getBookingStatus(booking);
      result[status] = (result[status] || 0) + 1;
      return result;
    }, {});

    const confirmedRevenue = bookings
      .filter((booking) =>
        ["confirmed", "active", "completed"].includes(
          getBookingStatus(booking)
        )
      )
      .reduce((total, booking) => total + getBookingTotal(booking), 0);

    return {
      totalBookings: bookings.length,
      confirmedBookings: statuses.confirmed || 0,
      pendingBookings: statuses.pending || 0,
      completedBookings: statuses.completed || 0,
      cancelledBookings:
        (statuses.cancelled || 0) + (statuses.rejected || 0),
      activeBookings: statuses.active || 0,
      statuses,
      confirmedRevenue,
    };
  }, [bookings]);

  const bookingsByMonth = useMemo(() => {
    const monthly = {};

    bookings.forEach((booking) => {
      const dateValue =
        booking.createdAt || booking.created_at || booking.startDate;

      if (!dateValue) return;

      const date = new Date(dateValue);

      if (Number.isNaN(date.getTime())) return;

      const key = `${date.getFullYear()}-${String(
        date.getMonth() + 1
      ).padStart(2, "0")}`;

      monthly[key] = (monthly[key] || 0) + 1;
    });

    return Object.entries(monthly)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-6);
  }, [bookings]);

  const maxMonthlyBookings = Math.max(
    1,
    ...bookingsByMonth.map(([, count]) => count)
  );

  const bookingPages = Math.max(1, Math.ceil(bookings.length / PAGE_SIZE));

  const visibleBookings = useMemo(() => {
    const start = (bookingPage - 1) * PAGE_SIZE;
    return [...bookings]
      .sort((a, b) =>
        String(b.createdAt || "").localeCompare(String(a.createdAt || ""))
      )
      .slice(start, start + PAGE_SIZE);
  }, [bookings, bookingPage]);

  useEffect(() => {
    setBookingPage((current) => Math.min(current, bookingPages));
  }, [bookingPages]);

  function exportBookings() {
    downloadCsv(
      "sheggar-wheels-bookings.csv",
      [
        "Booking ID",
        "Car ID",
        "Renter ID",
        "Owner ID",
        "Pickup Date",
        "Return Date",
        "Status",
        "Total Amount ETB",
        "Created At",
      ],
      bookings.map((booking) => [
        booking.id,
        booking.carId,
        booking.renterId || booking.userId,
        booking.ownerId,
        booking.startDate || booking.pickupDate,
        booking.endDate || booking.returnDate,
        booking.status,
        getBookingTotal(booking),
        booking.createdAt,
      ])
    );
  }

  function exportUsers() {
    downloadCsv(
      "sheggar-wheels-users.csv",
      ["User ID", "Name", "Email", "Role", "Status", "Created At"],
      users.map((user) => [
        user.id,
        user.name || user.fullName,
        user.email,
        user.role,
        user.isActive === false ? "Inactive" : "Active",
        user.createdAt,
      ])
    );
  }

  function exportCars() {
    downloadCsv(
      "sheggar-wheels-cars.csv",
      ["Car ID", "Make", "Model", "Year", "Location", "Daily Price"],
      cars.map((car) => [
        car.id,
        car.make,
        car.model || car.name,
        car.year,
        car.location,
        car.dailyPrice ?? car.pricePerDay,
      ])
    );
  }

  function exportDisputes() {
    downloadCsv(
      "sheggar-wheels-disputes.csv",
      ["Dispute ID", "Booking ID", "Reason", "Status", "Created At"],
      disputes.map((dispute) => [
        dispute.id,
        dispute.bookingId,
        dispute.reason || dispute.title || dispute.subject,
        dispute.status || dispute.state,
        dispute.createdAt || dispute.date,
      ])
    );
  }

  if (loading || !authorized) {
    return (
      <main className="min-h-screen bg-[#F4F7FB] p-6">
        <div className="mx-auto max-w-7xl rounded-xl bg-white p-8 text-slate-600 shadow-sm">
          Checking administrator access…
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#F4F7FB] px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-[#0866F5]">
              Administration
            </p>
            <h1 className="mt-1 text-2xl font-bold text-slate-900 sm:text-3xl">
              Reports & Analytics
            </h1>
            <p className="mt-2 text-sm text-slate-600">
              A summary of the data currently saved in this demo.
            </p>
          </div>
          <span className="w-fit rounded-full bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-700">
            Demo data
          </span>
        </div>

        <section className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            title="Total bookings"
            value={summary.totalBookings}
            description="All saved bookings"
            icon={CalendarDays}
          />
          <StatCard
            title="Confirmed revenue"
            value={formatCurrency(summary.confirmedRevenue)}
            description="Confirmed, active, and completed booking totals"
            icon={CircleDollarSign}
          />
          <StatCard
            title="Registered users"
            value={users.length}
            description="All saved user accounts"
            icon={Users}
          />
          <StatCard
            title="Listed vehicles"
            value={cars.length}
            description="Seeded and owner-created listings"
            icon={CarFront}
          />
        </section>

        <section className="mb-8 grid gap-6 xl:grid-cols-2">
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="mb-5 flex items-center gap-3">
              <BarChart3 className="text-[#0866F5]" size={22} />
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  Booking status breakdown
                </h2>
                <p className="text-sm text-slate-500">
                  Current saved booking statuses
                </p>
              </div>
            </div>

            {bookings.length === 0 ? (
              <p className="rounded-lg bg-slate-50 p-5 text-sm text-slate-500">
                No booking data is available yet.
              </p>
            ) : (
              <div className="space-y-4">
                {Object.entries(summary.statuses)
                  .sort((a, b) => b[1] - a[1])
                  .map(([status, count]) => (
                    <div key={status}>
                      <div className="mb-1.5 flex justify-between gap-3 text-sm">
                        <span className="font-medium text-slate-700">
                          {formatLabel(status)}
                        </span>
                        <span className="text-slate-500">
                          {count} (
                          {Math.round((count / bookings.length) * 100)}%)
                        </span>
                      </div>
                      <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
                        <div
                          className="h-full rounded-full bg-[#0866F5]"
                          style={{
                            width: `${(count / bookings.length) * 100}%`,
                          }}
                        />
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="mb-5 flex items-center gap-3">
              <CalendarDays className="text-[#0866F5]" size={22} />
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  Monthly bookings
                </h2>
                <p className="text-sm text-slate-500">
                  Based on saved booking creation dates
                </p>
              </div>
            </div>

            {bookingsByMonth.length === 0 ? (
              <p className="rounded-lg bg-slate-50 p-5 text-sm text-slate-500">
                No valid booking dates are available for this chart.
              </p>
            ) : (
              <div className="space-y-4">
                {bookingsByMonth.map(([month, count]) => (
                  <div key={month}>
                    <div className="mb-1.5 flex justify-between gap-3 text-sm">
                      <span className="font-medium text-slate-700">
                        {new Date(`${month}-01T12:00:00`).toLocaleDateString(
                          "en-US",
                          { month: "short", year: "numeric" }
                        )}
                      </span>
                      <span className="text-slate-500">{count}</span>
                    </div>
                    <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full bg-[#0866F5]"
                        style={{
                          width: `${(count / maxMonthlyBookings) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        <section className="mb-8 rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <h2 className="text-lg font-bold text-slate-900">
            Booking summary
          </h2>

          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {[
              ["Pending", summary.pendingBookings],
              ["Confirmed", summary.confirmedBookings],
              ["Active", summary.activeBookings],
              ["Completed", summary.completedBookings],
              ["Cancelled / rejected", summary.cancelledBookings],
            ].map(([label, count]) => (
              <div key={label} className="rounded-lg bg-slate-50 p-4">
                <p className="text-sm text-slate-500">{label}</p>
                <p className="mt-1 text-xl font-bold text-slate-900">
                  {count}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="mb-8 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-3 border-b border-slate-200 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Recent bookings
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Read-only records from local storage
              </p>
            </div>
            <button
              type="button"
              onClick={exportBookings}
              disabled={bookings.length === 0}
              className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-[#0866F5] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0754C7] disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ArrowDownToLine size={16} />
              Export bookings CSV
            </button>
          </div>

          {bookings.length === 0 ? (
            <p className="p-6 text-sm text-slate-500">No bookings to display.</p>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[720px] text-left text-sm">
                  <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                    <tr>
                      <th className="px-5 py-3 font-semibold">Booking ID</th>
                      <th className="px-5 py-3 font-semibold">Created</th>
                      <th className="px-5 py-3 font-semibold">Status</th>
                      <th className="px-5 py-3 font-semibold">Total</th>
                      <th className="px-5 py-3 text-right font-semibold">
                        Details
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {visibleBookings.map((booking) => (
                      <tr key={booking.id} className="hover:bg-slate-50">
                        <td className="px-5 py-4 font-medium text-slate-800">
                          <span className="block max-w-[220px] truncate">
                            {booking.id}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-slate-600">
                          {booking.createdAt
                            ? new Date(booking.createdAt).toLocaleDateString(
                                "en-GB"
                              )
                            : "—"}
                        </td>
                        <td className="px-5 py-4">
                          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                            {formatLabel(booking.status)}
                          </span>
                        </td>
                        <td className="px-5 py-4 font-semibold text-slate-800">
                          {formatCurrency(getBookingTotal(booking))}
                        </td>
                        <td className="px-5 py-4 text-right">
                          <Link
                            href={`/admin/bookings/${encodeURIComponent(
                              booking.id
                            )}`}
                            className="font-semibold text-[#0866F5] hover:underline"
                          >
                            View
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex flex-col gap-3 border-t border-slate-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-slate-500">
                  Showing{" "}
                  {Math.min((bookingPage - 1) * PAGE_SIZE + 1, bookings.length)}{" "}
                  – {Math.min(bookingPage * PAGE_SIZE, bookings.length)} of{" "}
                  {bookings.length} bookings
                </p>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={bookingPage === 1}
                    onClick={() => setBookingPage((current) => current - 1)}
                    className="min-h-10 rounded-lg border border-slate-200 px-4 text-sm font-semibold text-slate-700 disabled:opacity-40"
                  >
                    Previous
                  </button>
                  <span className="text-sm text-slate-600">
                    Page {bookingPage} of {bookingPages}
                  </span>
                  <button
                    type="button"
                    disabled={bookingPage >= bookingPages}
                    onClick={() => setBookingPage((current) => current + 1)}
                    className="min-h-10 rounded-lg border border-slate-200 px-4 text-sm font-semibold text-slate-700 disabled:opacity-40"
                  >
                    Next
                  </button>
                </div>
              </div>
            </>
          )}
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <h2 className="text-lg font-bold text-slate-900">Export reports</h2>
          <p className="mt-1 text-sm text-slate-500">
            Download the currently saved records as CSV files.
          </p>

          <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {[
              {
                label: "Export users",
                count: users.length,
                action: exportUsers,
              },
              {
                label: "Export vehicles",
                count: cars.length,
                action: exportCars,
              },
              {
                label: "Export disputes",
                count: disputes.length,
                action: exportDisputes,
              },
              {
                label: "Export reviews",
                count: reviews.length,
                action: () =>
                  downloadCsv(
                    "sheggar-wheels-reviews.csv",
                    [
                      "Review ID",
                      "Booking ID",
                      "Reviewer ID",
                      "Rating",
                      "Comment",
                      "Created At",
                    ],
                    reviews.map((review) => [
                      review.id,
                      review.bookingId,
                      review.reviewerId || review.userId,
                      review.rating,
                      review.comment || review.text,
                      review.createdAt,
                    ])
                  ),
              },
            ].map((item) => (
              <div
                key={item.label}
                className="flex flex-col justify-between gap-4 rounded-xl border border-slate-200 p-4"
              >
                <div>
                  <p className="font-semibold text-slate-800">{item.label}</p>
                  <p className="mt-1 text-sm text-slate-500">
                    {item.count} records
                  </p>
                </div>
                <button
                  type="button"
                  onClick={item.action}
                  disabled={item.count === 0}
                  className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-[#0866F5] hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ArrowDownToLine size={16} />
                  Download CSV
                </button>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
