"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Banknote,
  CalendarDays,
  CheckCircle2,
  Clock,
  Info,
  TrendingUp,
} from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { getBookingsByOwner } from "@/lib/bookings";
import { formatCurrency, formatDate } from "@/lib/format";

const completedStatuses = ["completed"];

export default function OwnerEarningsPage() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    try {
      const user = getCurrentUser();

      if (!user) {
        setError("Please sign in to view your earnings.");
        return;
      }

      const ownerBookings = getBookingsByOwner(user.id);
      setBookings(Array.isArray(ownerBookings) ? ownerBookings : []);
    } catch {
      setError("We couldn't load your earnings. Please refresh the page.");
    } finally {
      setLoading(false);
    }
  }, []);

  const completedBookings = useMemo(
    () =>
      bookings.filter((booking) =>
        completedStatuses.includes(booking.status)
      ),
    [bookings]
  );

  const pendingBookings = useMemo(
    () =>
      bookings.filter((booking) =>
        ["pending", "confirmed", "active"].includes(booking.status)
      ),
    [bookings]
  );

  const totalEarnings = useMemo(
    () =>
      completedBookings.reduce(
        (total, booking) => total + Number(booking.totalPrice || 0),
        0
      ),
    [completedBookings]
  );

  const pendingAmount = useMemo(
    () =>
      pendingBookings.reduce(
        (total, booking) => total + Number(booking.totalPrice || 0),
        0
      ),
    [pendingBookings]
  );

  return (
    <main className="min-h-screen bg-[#F5F7FB] px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <Link
          href="/owner"
          className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-[#0866F5] transition hover:text-[#0754C7]"
        >
          <ArrowLeft size={17} />
          Back to Owner Dashboard
        </Link>

        <section className="overflow-hidden rounded-3xl bg-gradient-to-r from-[#0754C7] to-[#0866F5] p-6 text-white shadow-sm sm:p-9">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-blue-100">
                OWNER FINANCIAL OVERVIEW
              </p>
              <h1 className="mt-2 text-3xl font-bold sm:text-4xl">
                Earnings
              </h1>
              <p className="mt-3 max-w-xl text-sm leading-6 text-blue-100 sm:text-base">
                Track your completed rentals and review the value of your
                current booking activity.
              </p>
            </div>

            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-white/15">
              <Banknote size={34} />
            </div>
          </div>
        </section>

        <div className="mt-5 flex items-start gap-3 rounded-2xl border border-blue-200 bg-blue-50 p-4 text-sm leading-6 text-blue-900">
          <Info size={20} className="mt-0.5 shrink-0" />
          <p>
            <strong>Demo data:</strong> These figures are calculated from
            locally stored booking records. They are estimates for this
            frontend project, not real payments, a bank balance, or verified
            profit after expenses.
          </p>
        </div>

        {error && (
          <div
            role="alert"
            className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900"
          >
            {error}
            <div className="mt-3">
              <Link
                href="/signin?next=%2Fowner%2Fearnings"
                className="font-semibold underline"
              >
                Sign in
              </Link>
            </div>
          </div>
        )}

        {loading ? (
          <div
            role="status"
            className="mt-6 rounded-2xl border border-[#E5EAF1] bg-white p-8 text-center text-sm text-[#667085]"
          >
            Loading earnings...
          </div>
        ) : (
          <>
            <section className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              <article className="rounded-2xl border border-[#E5EAF1] bg-white p-6 shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                    <TrendingUp size={23} />
                  </div>
                  <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                    Completed
                  </span>
                </div>
                <p className="mt-5 text-sm font-medium text-[#667085]">
                  Total completed rental value
                </p>
                <p className="mt-2 break-words text-2xl font-bold text-[#252A34] sm:text-3xl">
                  {formatCurrency(totalEarnings)}
                </p>
                <p className="mt-2 text-sm text-[#667085]">
                  From {completedBookings.length} completed{" "}
                  {completedBookings.length === 1 ? "booking" : "bookings"}
                </p>
              </article>

              <article className="rounded-2xl border border-[#E5EAF1] bg-white p-6 shadow-sm">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                  <Clock size={23} />
                </div>
                <p className="mt-5 text-sm font-medium text-[#667085]">
                  Current booking value
                </p>
                <p className="mt-2 break-words text-2xl font-bold text-[#252A34] sm:text-3xl">
                  {formatCurrency(pendingAmount)}
                </p>
                <p className="mt-2 text-sm text-[#667085]">
                  Pending, confirmed, or active rentals
                </p>
              </article>

              <article className="rounded-2xl border border-[#E5EAF1] bg-white p-6 shadow-sm">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-[#0866F5]">
                  <CalendarDays size={23} />
                </div>
                <p className="mt-5 text-sm font-medium text-[#667085]">
                  Completed bookings
                </p>
                <p className="mt-2 text-3xl font-bold text-[#252A34]">
                  {completedBookings.length}
                </p>
                <p className="mt-2 text-sm text-[#667085]">
                  Rentals marked as completed
                </p>
              </article>
            </section>

            <section className="mt-8 overflow-hidden rounded-2xl border border-[#E5EAF1] bg-white shadow-sm">
              <div className="border-b border-[#E5EAF1] p-5 sm:p-6">
                <h2 className="text-xl font-bold text-[#252A34]">
                  Completed rental records
                </h2>
                <p className="mt-1 text-sm text-[#667085]">
                  Rental values counted in your completed total.
                </p>
              </div>

              {completedBookings.length === 0 ? (
                <div className="px-6 py-12 text-center">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-blue-50 text-[#0866F5]">
                    <Banknote size={27} />
                  </div>
                  <h3 className="mt-4 text-lg font-semibold text-[#252A34]">
                    No completed rentals yet
                  </h3>
                  <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#667085]">
                    When you mark a rental as completed, its booking value
                    will appear here and contribute to your completed total.
                  </p>
                  <Link
                    href="/owner/bookings"
                    className="mt-5 inline-flex min-h-11 items-center justify-center rounded-lg bg-[#0866F5] px-5 py-2 text-sm font-semibold text-white transition hover:bg-[#0754C7]"
                  >
                    View Bookings
                  </Link>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[620px] text-left text-sm">
                    <thead className="bg-[#F8FAFC] text-xs uppercase tracking-wide text-[#667085]">
                      <tr>
                        <th className="px-6 py-4 font-semibold">Booking</th>
                        <th className="px-6 py-4 font-semibold">Completed</th>
                        <th className="px-6 py-4 font-semibold">Status</th>
                        <th className="px-6 py-4 text-right font-semibold">
                          Rental value
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E5EAF1]">
                      {completedBookings.map((booking) => (
                        <tr
                          key={booking.id}
                          className="transition hover:bg-[#F8FAFC]"
                        >
                          <td className="px-6 py-4">
                            <p className="font-semibold text-[#252A34]">
                              {booking.carName ||
                                booking.carTitle ||
                                "Car rental"}
                            </p>
                            <p className="mt-1 text-xs text-[#667085]">
                              {booking.id}
                            </p>
                          </td>
                          <td className="px-6 py-4 text-[#667085]">
                            {formatDate(
                              booking.updatedAt || booking.endDate
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                              <CheckCircle2 size={14} />
                              Completed
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right font-bold text-[#252A34]">
                            {formatCurrency(
                              Number(booking.totalPrice || 0)
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>

            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="/owner/cars"
                className="inline-flex min-h-11 items-center justify-center rounded-lg border border-[#D0D5DD] bg-white px-5 py-2 text-sm font-semibold text-[#344054] transition hover:bg-[#F8FAFC]"
              >
                Manage Bookings
              </Link>
              <Link
                href="/owner"
                className="inline-flex min-h-11 items-center justify-center rounded-lg border border-[#D0D5DD] bg-white px-5 py-2 text-sm font-semibold text-[#344054] transition hover:bg-[#F8FAFC]"
              >
                Owner Dashboard
              </Link>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
