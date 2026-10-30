"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  Eye,
  Search,
  ShieldCheck,
  ShieldAlert,
} from "lucide-react";

import { getCurrentUser } from "@/lib/auth";
import { readStoredData, STORAGE_KEYS } from "@/lib/storage";

const PAGE_SIZE = 8;

function formatDate(value) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return String(value);

  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatLabel(value) {
  if (!value) return "Unknown";

  return String(value)
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function getDisputeStatus(dispute) {
  return dispute.status || dispute.state || "open";
}

function StatusBadge({ status }) {
  const normalized = String(status).toLowerCase();

  const styles = {
    open: "bg-amber-50 text-amber-700",
    pending: "bg-amber-50 text-amber-700",
    under_review: "bg-blue-50 text-blue-700",
    "under review": "bg-blue-50 text-blue-700",
    resolved: "bg-emerald-50 text-emerald-700",
    closed: "bg-slate-100 text-slate-600",
    rejected: "bg-rose-50 text-rose-700",
  };

  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
        styles[normalized] || "bg-slate-100 text-slate-600"
      }`}
    >
      {formatLabel(status)}
    </span>
  );
}

export default function AdminDisputesPage() {
  const router = useRouter();

  const [disputes, setDisputes] = useState([]);
  const [users, setUsers] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [authorized, setAuthorized] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const timer = window.setTimeout(() => {
      if (cancelled) return;

      const currentUser = getCurrentUser();

      if (!currentUser || currentUser.role !== "admin") {
        router.replace(
          `/signin?role=admin&next=${encodeURIComponent("/admin/disputes")}`
        );
        return;
      }

      setDisputes(readStoredData(STORAGE_KEYS.disputes, []));
      setUsers(readStoredData(STORAGE_KEYS.users, []));
      setBookings(readStoredData(STORAGE_KEYS.bookings, []));
      setAuthorized(true);
      setLoading(false);
    }, 0);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [router]);

  const filteredDisputes = useMemo(() => {
    const query = search.trim().toLowerCase();

    return disputes.filter((dispute) => {
      const status = String(getDisputeStatus(dispute)).toLowerCase();

      const booking = bookings.find(
        (item) => String(item.id) === String(dispute.bookingId)
      );

      const reporter = users.find(
        (user) =>
          String(user.id) === String(dispute.reporterId || dispute.userId)
      );

      const searchText = [
        dispute.id,
        dispute.bookingId,
        dispute.title,
        dispute.subject,
        dispute.reason,
        dispute.description,
        dispute.reporterName,
        dispute.userName,
        reporter?.name,
        reporter?.fullName,
        reporter?.email,
        booking?.id,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const matchesSearch = !query || searchText.includes(query);
      const matchesStatus =
        statusFilter === "all" || status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [disputes, bookings, users, search, statusFilter]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredDisputes.length / PAGE_SIZE)
  );

  // Keep the displayed page valid when filters reduce the results.
  const currentPage = Math.min(page, totalPages);

  const visibleDisputes = filteredDisputes.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  const openCount = disputes.filter((dispute) =>
    ["open", "pending", "under_review", "under review"].includes(
      String(getDisputeStatus(dispute)).toLowerCase()
    )
  ).length;

  const resolvedCount = disputes.filter((dispute) =>
    ["resolved", "closed"].includes(
      String(getDisputeStatus(dispute)).toLowerCase()
    )
  ).length;

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
        <div className="mb-7">
          <p className="text-sm font-semibold text-[#0866F5]">
            Administration
          </p>
          <h1 className="mt-1 text-2xl font-bold text-slate-900 sm:text-3xl">
            Disputes
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            Review and track disputes reported by renters and owners.
          </p>
        </div>

        <div className="mb-6 grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-sm text-slate-500">Total disputes</p>
              <AlertTriangle className="text-[#0866F5]" size={21} />
            </div>
            <p className="mt-3 text-3xl font-bold text-slate-900">
              {disputes.length}
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-sm text-slate-500">Open / under review</p>
              <ShieldAlert className="text-amber-600" size={21} />
            </div>
            <p className="mt-3 text-3xl font-bold text-slate-900">
              {openCount}
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-sm text-slate-500">Resolved / closed</p>
              <ShieldCheck className="text-emerald-600" size={21} />
            </div>
            <p className="mt-3 text-3xl font-bold text-slate-900">
              {resolvedCount}
            </p>
          </div>
        </div>

        <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-3 border-b border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative w-full sm:max-w-md">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                size={18}
              />
              <input
                type="search"
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value);
                  setPage(1);
                }}
                placeholder="Search disputes, bookings, or users…"
                className="min-h-11 w-full rounded-lg border border-slate-200 py-2 pl-10 pr-3 text-sm outline-none focus:border-[#0866F5] focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(event) => {
                setStatusFilter(event.target.value);
                setPage(1);
              }}
              aria-label="Filter disputes by status"
              className="min-h-11 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-[#0866F5]"
            >
              <option value="all">All statuses</option>
              <option value="open">Open</option>
              <option value="pending">Pending</option>
              <option value="under_review">Under review</option>
              <option value="resolved">Resolved</option>
              <option value="closed">Closed</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>

          {disputes.length === 0 ? (
            <div className="px-6 py-16 text-center">
              <AlertTriangle className="mx-auto text-slate-300" size={38} />
              <h2 className="mt-4 text-lg font-semibold text-slate-900">
                No disputes yet
              </h2>
              <p className="mt-2 text-sm text-slate-500">
                Disputes will appear here when they are saved in the demo data.
              </p>
            </div>
          ) : filteredDisputes.length === 0 ? (
            <div className="px-6 py-12 text-center text-sm text-slate-500">
              No disputes match your search or status filter.
            </div>
          ) : (
            <>
              <div className="hidden overflow-x-auto md:block">
                <table className="w-full min-w-[850px] text-left text-sm">
                  <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                    <tr>
                      <th className="px-5 py-4 font-semibold">Dispute</th>
                      <th className="px-5 py-4 font-semibold">Booking</th>
                      <th className="px-5 py-4 font-semibold">Reported by</th>
                      <th className="px-5 py-4 font-semibold">Date</th>
                      <th className="px-5 py-4 font-semibold">Status</th>
                      <th className="px-5 py-4 text-right font-semibold">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {visibleDisputes.map((dispute) => {
                      const reporter = users.find(
                        (user) =>
                          String(user.id) ===
                          String(dispute.reporterId || dispute.userId)
                      );

                      return (
                        <tr key={dispute.id} className="hover:bg-slate-50">
                          <td className="px-5 py-4">
                            <p className="font-semibold text-slate-900">
                              {dispute.title ||
                                dispute.subject ||
                                formatLabel(dispute.reason) ||
                                "Dispute"}
                            </p>
                            <p className="mt-1 max-w-xs truncate text-xs text-slate-500">
                              {dispute.id}
                            </p>
                          </td>
                          <td className="px-5 py-4 text-slate-600">
                            {dispute.bookingId || "—"}
                          </td>
                          <td className="px-5 py-4">
                            <p className="font-medium text-slate-800">
                              {reporter?.name ||
                                reporter?.fullName ||
                                dispute.reporterName ||
                                dispute.userName ||
                                "Not provided"}
                            </p>
                            <p className="mt-1 text-xs text-slate-500">
                              {reporter?.email || dispute.reporterEmail || "—"}
                            </p>
                          </td>
                          <td className="px-5 py-4 text-slate-600">
                            {formatDate(dispute.createdAt || dispute.date)}
                          </td>
                          <td className="px-5 py-4">
                            <StatusBadge status={getDisputeStatus(dispute)} />
                          </td>
                          <td className="px-5 py-4 text-right">
                            <Link
                              href={`/admin/disputes/${encodeURIComponent(
                                dispute.id
                              )}`}
                              className="inline-flex min-h-9 items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-[#0866F5] hover:bg-blue-50"
                            >
                              <Eye size={15} />
                              View
                            </Link>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="divide-y divide-slate-100 md:hidden">
                {visibleDisputes.map((dispute) => {
                  const reporter = users.find(
                    (user) =>
                      String(user.id) ===
                      String(dispute.reporterId || dispute.userId)
                  );

                  return (
                    <article key={dispute.id} className="p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <h2 className="break-words font-semibold text-slate-900">
                            {dispute.title ||
                              dispute.subject ||
                              formatLabel(dispute.reason) ||
                              "Dispute"}
                          </h2>
                          <p className="mt-1 break-all text-xs text-slate-500">
                            {dispute.id}
                          </p>
                        </div>
                        <StatusBadge status={getDisputeStatus(dispute)} />
                      </div>

                      <div className="mt-3 space-y-1 text-sm text-slate-600">
                        <p>
                          <span className="font-medium text-slate-700">
                            Booking:
                          </span>{" "}
                          {dispute.bookingId || "—"}
                        </p>
                        <p>
                          <span className="font-medium text-slate-700">
                            Reported by:
                          </span>{" "}
                          {reporter?.name ||
                            reporter?.fullName ||
                            dispute.reporterName ||
                            dispute.userName ||
                            "Not provided"}
                        </p>
                        <p>
                          <span className="font-medium text-slate-700">
                            Date:
                          </span>{" "}
                          {formatDate(dispute.createdAt || dispute.date)}
                        </p>
                      </div>

                      <Link
                        href={`/admin/disputes/${encodeURIComponent(
                          dispute.id
                        )}`}
                        className="mt-4 inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-lg bg-[#0866F5] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0754C7]"
                      >
                        <Eye size={16} />
                        View details
                      </Link>
                    </article>
                  );
                })}
              </div>

              <div className="flex flex-col gap-3 border-t border-slate-200 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-slate-500">
                  Showing{" "}
                  {Math.min(
                    (currentPage - 1) * PAGE_SIZE + 1,
                    filteredDisputes.length
                  )}{" "}
                  – {Math.min(currentPage * PAGE_SIZE, filteredDisputes.length)}{" "}
                  of {filteredDisputes.length} disputes
                </p>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={currentPage === 1}
                    onClick={() =>
                      setPage((current) => Math.max(1, current - 1))
                    }
                    className="min-h-10 rounded-lg border border-slate-200 px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Previous
                  </button>
                  <span className="min-w-20 text-center text-sm text-slate-600">
                    Page {currentPage} of {totalPages}
                  </span>
                  <button
                    type="button"
                    disabled={currentPage >= totalPages}
                    onClick={() =>
                      setPage((current) =>
                        Math.min(totalPages, current + 1)
                      )
                    }
                    className="min-h-10 rounded-lg border border-slate-200 px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Next
                  </button>
                </div>
              </div>
            </>
          )}
        </section>
      </div>
    </main>
  );
}
