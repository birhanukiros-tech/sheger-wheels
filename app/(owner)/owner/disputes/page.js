
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getBookingsByOwner } from "@/lib/bookings";
import { STORAGE_KEYS, readStoredData } from "@/lib/storage";
import { formatCurrency } from "@/lib/format";

const statusStyles = {
  open: "bg-amber-50 text-amber-700 ring-amber-200",
  pending: "bg-amber-50 text-amber-700 ring-amber-200",
  submitted: "bg-blue-50 text-blue-700 ring-blue-200",
  under_review: "bg-violet-50 text-violet-700 ring-violet-200",
  resolved: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  closed: "bg-slate-100 text-slate-700 ring-slate-200",
  rejected: "bg-rose-50 text-rose-700 ring-rose-200",
};

const statusLabels = {
  open: "Open",
  pending: "Pending review",
  submitted: "Submitted",
  under_review: "Under review",
  resolved: "Resolved",
  closed: "Closed",
  rejected: "Rejected",
};

function formatDate(dateString) {
  if (!dateString) return "Date unavailable";

  const date = new Date(dateString);

  if (Number.isNaN(date.getTime())) return "Date unavailable";

  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

function getDisputeBookingId(dispute) {
  return dispute?.bookingId ?? dispute?.booking?.id ?? "";
}

function getDisputeDate(dispute) {
  return (
    dispute?.createdAt ??
    dispute?.submittedAt ??
    dispute?.updatedAt ??
    ""
  );
}

function getDisputeStatus(dispute) {
  return String(dispute?.status ?? "open").toLowerCase();
}

function getDisputeTitle(dispute) {
  return (
    dispute?.title ??
    dispute?.reason ??
    dispute?.subject ??
    "Booking dispute"
  );
}

function getDisputeDescription(dispute) {
  return (
    dispute?.description ??
    dispute?.details ??
    dispute?.message ??
    "No additional description provided."
  );
}

export default function OwnerDisputesPage() {
  const router = useRouter();

  const [user, setUser] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [disputes, setDisputes] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const refreshData = useCallback((ownerId) => {
    if (!ownerId) return;

    const ownerBookings = getBookingsByOwner(String(ownerId));
    const ownerBookingIds = new Set(
      ownerBookings.map((booking) => String(booking.id))
    );

    const storedDisputes = readStoredData(STORAGE_KEYS.disputes, []);

    const validDisputes = Array.isArray(storedDisputes)
      ? storedDisputes.filter((dispute) => {
          if (!dispute || typeof dispute !== "object") return false;

          const bookingId = getDisputeBookingId(dispute);

          return (
            bookingId !== "" &&
            ownerBookingIds.has(String(bookingId))
          );
        })
      : [];

    setBookings(ownerBookings);
    setDisputes(validDisputes);
  }, []);

  useEffect(() => {
    const currentUser = getCurrentUser();

    if (!currentUser || currentUser.role !== "owner") {
      router.replace("/signin");
      return;
    }

    setUser(currentUser);
    refreshData(currentUser.id);
    setAuthChecked(true);
    setLoading(false);

    function refreshFromStorage() {
      refreshData(currentUser.id);
    }

    window.addEventListener("focus", refreshFromStorage);
    window.addEventListener("storage", refreshFromStorage);

    return () => {
      window.removeEventListener("focus", refreshFromStorage);
      window.removeEventListener("storage", refreshFromStorage);
    };
  }, [router, refreshData]);

  const summary = useMemo(() => {
    const isOpen = (dispute) =>
      ["open", "pending", "submitted"].includes(
        getDisputeStatus(dispute)
      );

    return {
      total: disputes.length,
      open: disputes.filter(isOpen).length,
      underReview: disputes.filter(
        (dispute) => getDisputeStatus(dispute) === "under_review"
      ).length,
      resolved: disputes.filter(
        (dispute) =>
          ["resolved", "closed"].includes(getDisputeStatus(dispute))
      ).length,
    };
  }, [disputes]);

  const filteredDisputes = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return [...disputes]
      .filter(
        (dispute) =>
          filter === "all" ||
          getDisputeStatus(dispute) === filter
      )
      .filter((dispute) => {
        if (!normalizedSearch) return true;

        const bookingId = getDisputeBookingId(dispute);
        const booking = bookings.find(
          (item) => String(item.id) === String(bookingId)
        );

        const searchableText = [
          dispute.id,
          bookingId,
          getDisputeTitle(dispute),
          getDisputeDescription(dispute),
          dispute.renterName,
          dispute.reason,
          getDisputeStatus(dispute),
          booking?.contact?.fullName,
          booking?.contact?.email,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        return searchableText.includes(normalizedSearch);
      })
      .sort(
        (a, b) =>
          new Date(getDisputeDate(b)).getTime() -
          new Date(getDisputeDate(a)).getTime()
      );
  }, [disputes, bookings, filter, search]);

  if (!authChecked || loading) {
    return (
      <main className="mx-auto max-w-7xl px-4 py-16">
        <p className="text-center text-slate-500">
          Loading disputes...
        </p>
      </main>
    );
  }

  if (!user) return null;

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
      <div className="mx-auto max-w-7xl">
        <Link
          href="/owner/cars"
          className="text-sm font-semibold text-[#0866F5] hover:underline"
        >
          ← Back to My Cars
        </Link>

        <section className="mt-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <p className="text-sm font-semibold uppercase tracking-wider text-[#0866F5]">
            Owner dashboard
          </p>

          <div className="mt-2 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-slate-900">
                Disputes
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                Review issues reported about your bookings and track
                their progress. Dispute resolution will be managed by
                the administrator.
              </p>
            </div>

            <span className="inline-flex w-fit items-center rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600">
              Read-only
            </span>
          </div>
        </section>

        <section
          aria-label="Dispute summary"
          className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
        >
          {[
            {
              label: "Total disputes",
              value: summary.total,
              color: "text-slate-900",
            },
            {
              label: "Open disputes",
              value: summary.open,
              color: "text-amber-700",
            },
            {
              label: "Under review",
              value: summary.underReview,
              color: "text-violet-700",
            },
            {
              label: "Resolved",
              value: summary.resolved,
              color: "text-emerald-700",
            },
          ].map((item) => (
            <div
              key={item.label}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <p className="text-sm font-medium text-slate-500">
                {item.label}
              </p>
              <p className={`mt-3 text-3xl font-bold ${item.color}`}>
                {item.value}
              </p>
            </div>
          ))}
        </section>

        <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h2 className="text-xl font-bold text-slate-900">
                Your booking disputes
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Only disputes linked to your bookings appear here.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="disputeSearch"
                  className="mb-1 block text-xs font-semibold text-slate-600"
                >
                  Search disputes
                </label>
                <input
                  id="disputeSearch"
                  type="search"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Booking ID, renter, reason..."
                  className="min-h-11 w-full rounded-lg border border-slate-300 px-3 text-sm text-slate-900 outline-none focus:border-[#0866F5] focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div>
                <label
                  htmlFor="disputeFilter"
                  className="mb-1 block text-xs font-semibold text-slate-600"
                >
                  Filter by status
                </label>
                <select
                  id="disputeFilter"
                  value={filter}
                  onChange={(event) => setFilter(event.target.value)}
                  className="min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none focus:border-[#0866F5] focus:ring-2 focus:ring-blue-100"
                >
                  <option value="all">All disputes</option>
                  <option value="open">Open</option>
                  <option value="pending">Pending review</option>
                  <option value="submitted">Submitted</option>
                  <option value="under_review">Under review</option>
                  <option value="resolved">Resolved</option>
                  <option value="closed">Closed</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>
            </div>
          </div>

          {filteredDisputes.length === 0 ? (
            <div className="mt-6 rounded-xl border border-dashed border-slate-300 bg-slate-50 px-5 py-14 text-center">
              <div
                aria-hidden="true"
                className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-blue-50 text-2xl text-[#0866F5]"
              >
                !
              </div>

              <h3 className="mt-4 text-lg font-bold text-slate-900">
                {disputes.length === 0
                  ? "No disputes yet"
                  : "No matching disputes"}
              </h3>

              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
                {disputes.length === 0
                  ? "There are currently no disputes linked to your bookings. When dispute reporting is introduced, eligible records will appear here."
                  : "Try another search term or choose a different status filter."}
              </p>

              {disputes.length === 0 && bookings.length === 0 && (
                <Link
                  href="/owner/bookings"
                  className="mt-5 inline-flex min-h-11 items-center justify-center rounded-lg bg-[#0866F5] px-5 py-2 text-sm font-semibold text-white hover:bg-[#0754C7]"
                >
                  View bookings
                </Link>
              )}
            </div>
          ) : (
            <div className="mt-6 space-y-5">
              {filteredDisputes.map((dispute, index) => {
                const bookingId = getDisputeBookingId(dispute);
                const booking = bookings.find(
                  (item) => String(item.id) === String(bookingId)
                );

                const status = getDisputeStatus(dispute);
                const renterName =
                  dispute.renterName ??
                  booking?.contact?.fullName ??
                  "Renter name not provided";

                return (
                  <article
                    key={dispute.id ?? `${bookingId}-${index}`}
                    className="rounded-2xl border border-slate-200 p-5 sm:p-6"
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <p className="break-all text-xs font-medium text-slate-500">
                          Dispute ID: {dispute.id ?? "Not provided"}
                        </p>

                        <h3 className="mt-2 text-lg font-bold text-slate-900">
                          {getDisputeTitle(dispute)}
                        </h3>

                        <p className="mt-1 text-sm text-slate-600">
                          Renter: {renterName}
                        </p>

                        <p className="mt-1 break-all text-xs text-slate-500">
                          Booking ID: {bookingId}
                        </p>
                      </div>

                      <span
                        className={`inline-flex w-fit shrink-0 items-center rounded-full px-3 py-1.5 text-xs font-semibold ring-1 ring-inset ${
                          statusStyles[status] ??
                          "bg-slate-100 text-slate-700 ring-slate-200"
                        }`}
                      >
                        {statusLabels[status] ?? status.replaceAll("_", " ")}
                      </span>
                    </div>

                    <p className="mt-5 whitespace-pre-wrap break-words text-sm leading-6 text-slate-600">
                      {getDisputeDescription(dispute)}
                    </p>

                    <div className="mt-5 grid gap-4 border-t border-slate-200 pt-5 sm:grid-cols-3">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                          Booking dates
                        </p>
                        <p className="mt-2 text-sm font-semibold text-slate-900">
                          {booking
                            ? `${formatDate(booking.startDate)} – ${formatDate(booking.endDate)}`
                            : "Booking details unavailable"}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                          Booking value
                        </p>
                        <p className="mt-2 text-sm font-semibold text-slate-900">
                          {booking
                            ? formatCurrency(booking.totalPrice)
                            : "Not available"}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                          Reported on
                        </p>
                        <p className="mt-2 text-sm font-semibold text-slate-900">
                          {formatDate(getDisputeDate(dispute))}
                        </p>
                      </div>
                    </div>

                    <p className="mt-5 rounded-lg bg-slate-50 px-4 py-3 text-sm text-slate-600">
                      The administrator will manage the review and final
                      resolution of this dispute.
                    </p>
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
