"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  AlertTriangle,
  CalendarDays,
  FileText,
  UserRound,
  ShieldCheck,
} from "lucide-react";

import { getCurrentUser } from "@/lib/auth";
import { readStoredData, STORAGE_KEYS } from "@/lib/storage";

function formatDate(value) {
  if (!value) return "Not provided";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return String(value);

  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatLabel(value) {
  if (!value) return "Not provided";

  return String(value)
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function Detail({ label, value }) {
  return (
    <div className="border-b border-slate-100 py-3 last:border-b-0">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-1 break-words font-medium text-slate-800">
        {value || "Not provided"}
      </p>
    </div>
  );
}

export default function AdminDisputeDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const disputeId = decodeURIComponent(String(params.id || ""));

  const [dispute, setDispute] = useState(null);
  const [reporter, setReporter] = useState(null);
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    let timeoutId;

    const currentUser = getCurrentUser();

    if (!currentUser || currentUser.role !== "admin") {
      router.replace(
        `/signin?role=admin&next=${encodeURIComponent(
          `/admin/disputes/${disputeId}`
        )}`
      );
      return;
    }

    const disputes = readStoredData(STORAGE_KEYS.disputes, []);
    const users = readStoredData(STORAGE_KEYS.users, []);
    const bookings = readStoredData(STORAGE_KEYS.bookings, []);

    const savedDispute = disputes.find(
      (item) => String(item.id) === disputeId
    );

    if (!savedDispute) {
      timeoutId = window.setTimeout(() => {
        setNotFound(true);
        setLoading(false);
      }, 0);

      return () => window.clearTimeout(timeoutId);
    }

    const selectedReporter = users.find(
      (user) =>
        String(user.id) ===
        String(savedDispute.reporterId || savedDispute.userId)
    );

    const selectedBooking = bookings.find(
      (item) => String(item.id) === String(savedDispute.bookingId)
    );

    timeoutId = window.setTimeout(() => {
      setDispute(savedDispute);
      setReporter(selectedReporter || null);
      setBooking(selectedBooking || null);
      setLoading(false);
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [disputeId, router]);

  if (loading) {
    return (
      <main className="min-h-screen bg-[#F4F7FB] p-6">
        <div className="mx-auto max-w-4xl rounded-xl bg-white p-8 text-slate-600 shadow-sm">
          Checking administrator access…
        </div>
      </main>
    );
  }

  if (notFound) {
    return (
      <main className="min-h-screen bg-[#F4F7FB] px-4 py-8 sm:px-6">
        <div className="mx-auto max-w-3xl rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <AlertTriangle className="text-amber-600" size={34} />

          <h1 className="mt-4 text-2xl font-bold text-slate-900">
            Dispute not found
          </h1>

          <p className="mt-2 text-slate-600">
            No saved dispute matches this reference. It may not exist in the
            current demo data.
          </p>

          <Link
            href="/admin/disputes"
            className="mt-6 inline-flex min-h-11 items-center gap-2 rounded-lg bg-[#0866F5] px-4 py-2 font-semibold text-white hover:bg-[#0754C7]"
          >
            <ArrowLeft size={17} />
            Back to disputes
          </Link>
        </div>
      </main>
    );
  }

  const status = dispute.status || dispute.state || "open";

  const reporterName =
    reporter?.name ||
    reporter?.fullName ||
    dispute.reporterName ||
    dispute.userName;

  const reporterEmail =
    reporter?.email || dispute.reporterEmail || dispute.userEmail;

  const title =
    dispute.title || dispute.subject || formatLabel(dispute.reason);

  return (
    <main className="min-h-screen bg-[#F4F7FB] px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl">
        <Link
          href="/admin/disputes"
          className="mb-6 inline-flex min-h-10 items-center gap-2 text-sm font-semibold text-[#0866F5] hover:text-[#0754C7]"
        >
          <ArrowLeft size={17} />
          Back to all disputes
        </Link>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8">
          <div className="flex flex-col justify-between gap-4 border-b border-slate-100 pb-6 sm:flex-row sm:items-start">
            <div>
              <p className="text-sm font-medium text-slate-500">
                Dispute reference
              </p>
              <h1 className="mt-1 break-all text-2xl font-bold text-slate-900">
                {dispute.id}
              </h1>
              <h2 className="mt-3 text-lg font-semibold text-slate-800">
                {title || "Dispute"}
              </h2>
            </div>

            <span className="inline-flex w-fit rounded-full bg-amber-50 px-3 py-1.5 text-sm font-semibold text-amber-700">
              {formatLabel(status)}
            </span>
          </div>

          <div className="mt-6 grid gap-5 md:grid-cols-2">
            <section className="rounded-xl border border-slate-200 p-5">
              <div className="mb-3 flex items-center gap-2">
                <FileText className="text-[#0866F5]" size={21} />
                <h3 className="text-lg font-bold text-slate-900">
                  Dispute information
                </h3>
              </div>

              <Detail label="Dispute ID" value={dispute.id} />
              <Detail label="Reason" value={formatLabel(dispute.reason)} />
              <Detail
                label="Date reported"
                value={formatDate(dispute.createdAt || dispute.date)}
              />
              <Detail
                label="Last updated"
                value={formatDate(dispute.updatedAt)}
              />
              <Detail label="Booking reference" value={dispute.bookingId} />
            </section>

            <section className="rounded-xl border border-slate-200 p-5">
              <div className="mb-3 flex items-center gap-2">
                <UserRound className="text-[#0866F5]" size={21} />
                <h3 className="text-lg font-bold text-slate-900">
                  Reporter
                </h3>
              </div>

              <Detail label="Name" value={reporterName} />
              <Detail label="Email" value={reporterEmail} />
              <Detail
                label="Reporter ID"
                value={dispute.reporterId || dispute.userId}
              />

              {reporterEmail && (
                <a
                  href={`mailto:${reporterEmail}`}
                  className="mt-4 inline-flex min-h-10 items-center rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-[#0866F5] hover:bg-blue-50"
                >
                  Contact reporter
                </a>
              )}
            </section>

            <section className="rounded-xl border border-slate-200 p-5 md:col-span-2">
              <div className="mb-3 flex items-center gap-2">
                <CalendarDays className="text-[#0866F5]" size={21} />
                <h3 className="text-lg font-bold text-slate-900">
                  Related booking
                </h3>
              </div>

              <Detail
                label="Booking ID"
                value={booking?.id || dispute.bookingId}
              />
              <Detail
                label="Booking status"
                value={formatLabel(booking?.status)}
              />
              <Detail
                label="Pickup date"
                value={formatDate(booking?.startDate || booking?.pickupDate)}
              />
              <Detail
                label="Return date"
                value={formatDate(booking?.endDate || booking?.returnDate)}
              />
            </section>

            <section className="rounded-xl border border-slate-200 p-5 md:col-span-2">
              <h3 className="text-lg font-bold text-slate-900">
                Description
              </h3>

              <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-slate-600">
                {dispute.description ||
                  dispute.details ||
                  "No description was provided for this dispute."}
              </p>
            </section>
          </div>

          <div className="mt-6 flex items-start gap-3 rounded-xl bg-blue-50 p-4 text-sm text-blue-800">
            <ShieldCheck className="mt-0.5 shrink-0" size={19} />
            <p>
              This page is read-only. It displays saved dispute information
              without changing its status or other records.
            </p>
          </div>

          <Link
            href="/admin/disputes"
            className="mt-6 inline-flex min-h-11 items-center justify-center rounded-lg bg-[#0866F5] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#0754C7]"
          >
            Back to disputes
          </Link>
        </section>
      </div>
    </main>
  );
}
