"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  UserRound,
  Mail,
  ShieldCheck,
  CalendarDays,
  CircleCheck,
  CircleX,
  LoaderCircle,
  AlertCircle,
} from "lucide-react";

import { getCurrentUser } from "@/lib/auth";
import { STORAGE_KEYS, readStoredData } from "@/lib/storage";

function formatDate(value) {
  if (!value) return "Not available";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "Not available";

  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function getDisplayName(user) {
  if (!user) return "Unknown user";

  return (
    user.name ||
    user.fullName ||
    [user.firstName, user.lastName].filter(Boolean).join(" ") ||
    user.username ||
    "Unnamed user"
  );
}

function getAccountStatus(user) {
  return user?.isActive === false ? "Inactive" : "Active";
}

function DetailItem({ icon: Icon, label, value }) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-[#E5EAF1] bg-white p-4">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#F0F5FF] text-[#0866F5]">
        <Icon size={19} />
      </div>

      <div className="min-w-0">
        <p className="text-sm text-[#667085]">{label}</p>
        <p className="mt-1 break-words font-semibold text-[#252A34]">
          {value || "Not available"}
        </p>
      </div>
    </div>
  );
}

export default function AdminUserDetailsPage() {
  const params = useParams();
  const router = useRouter();

  const userId = Array.isArray(params.id) ? params.id[0] : params.id;

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [accessDenied, setAccessDenied] = useState(false);

  useEffect(() => {
    let timeoutId;

    const currentUser = getCurrentUser();

    if (!currentUser || currentUser.role !== "admin") {
      timeoutId = window.setTimeout(() => {
        setAccessDenied(true);
      }, 0);

      router.replace(
        `/signin?role=admin&next=${encodeURIComponent(
          `/admin/users/${userId}`
        )}`
      );

      return () => window.clearTimeout(timeoutId);
    }

    const users = readStoredData(STORAGE_KEYS.users, []);

    if (!Array.isArray(users)) {
      timeoutId = window.setTimeout(() => {
        setUser(null);
        setLoading(false);
      }, 0);

      return () => window.clearTimeout(timeoutId);
    }

    const selectedUser = users.find(
      (item) => String(item.id) === String(userId)
    );

    timeoutId = window.setTimeout(() => {
      setUser(selectedUser || null);
      setLoading(false);
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [router, userId]);

  if (loading || accessDenied) {
    return (
      <main className="flex min-h-[60vh] items-center justify-center bg-[#F4F7FB] px-4">
        <div className="flex items-center gap-3 text-sm text-[#667085]">
          <LoaderCircle className="animate-spin" size={20} />
          {accessDenied
            ? "Checking administrator access..."
            : "Loading user details..."}
        </div>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="min-h-[60vh] bg-[#F4F7FB] px-4 py-12">
        <div className="mx-auto max-w-3xl rounded-2xl border border-[#E5EAF1] bg-white p-8 text-center shadow-sm">
          <AlertCircle className="mx-auto text-[#667085]" size={40} />

          <h1 className="mt-4 text-2xl font-bold text-[#252A34]">
            User Not Found
          </h1>

          <p className="mt-2 text-sm text-[#667085]">
            This user may no longer exist in the stored demo data.
          </p>

          <Link
            href="/admin/users"
            className="mt-6 inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-[#0866F5] px-5 py-2 font-semibold text-white transition-colors hover:bg-[#0754C7]"
          >
            <ArrowLeft size={18} />
            Back to Users
          </Link>
        </div>
      </main>
    );
  }

  const active = getAccountStatus(user) === "Active";

  return (
    <main className="min-h-screen bg-[#F4F7FB] px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <Link
          href="/admin/users"
          className="inline-flex min-h-10 items-center gap-2 text-sm font-semibold text-[#0866F5] transition-colors hover:text-[#0754C7]"
        >
          <ArrowLeft size={18} />
          Back to Users
        </Link>

        <section className="mt-6 overflow-hidden rounded-2xl border border-[#E5EAF1] bg-white shadow-sm">
          <div className="bg-[#0866F5] px-6 py-8 text-white sm:px-8">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-4">
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-white/15">
                  <UserRound size={32} />
                </div>

                <div className="min-w-0">
                  <p className="text-sm text-blue-100">User Details</p>

                  <h1 className="mt-1 break-words text-2xl font-bold sm:text-3xl">
                    {getDisplayName(user)}
                  </h1>

                  <p className="mt-1 break-all text-sm text-blue-100">
                    {user.email || "No email available"}
                  </p>
                </div>
              </div>

              <span
                className={`inline-flex w-fit items-center gap-2 rounded-full px-3 py-2 text-sm font-semibold ${
                  active
                    ? "bg-green-100 text-green-800"
                    : "bg-red-100 text-red-800"
                }`}
              >
                {active ? <CircleCheck size={17} /> : <CircleX size={17} />}
                {getAccountStatus(user)}
              </span>
            </div>
          </div>

          <div className="p-6 sm:p-8">
            <h2 className="text-lg font-bold text-[#252A34]">
              Account Information
            </h2>

            <p className="mt-1 text-sm text-[#667085]">
              Information available in the current demo account.
            </p>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <DetailItem
                icon={UserRound}
                label="Full Name"
                value={getDisplayName(user)}
              />

              <DetailItem
                icon={Mail}
                label="Email Address"
                value={user.email}
              />

              <DetailItem
                icon={ShieldCheck}
                label="Account Role"
                value={
                  user.role
                    ? user.role.charAt(0).toUpperCase() + user.role.slice(1)
                    : "Not available"
                }
              />

              <DetailItem
                icon={CircleCheck}
                label="Account Status"
                value={getAccountStatus(user)}
              />

              <DetailItem
                icon={UserRound}
                label="User ID"
                value={user.id}
              />

              <DetailItem
                icon={CalendarDays}
                label="Account Created"
                value={formatDate(
                  user.createdAt || user.created_at || user.joinedAt
                )}
              />
            </div>

            <div className="mt-8 rounded-xl border border-blue-100 bg-blue-50 p-4">
              <p className="text-sm leading-6 text-blue-900">
                This page displays account information only. To change account
                activation status, return to the Admin Users page and use its
                existing controls.
              </p>
            </div>

            <div className="mt-6">
              <Link
                href="/admin/users"
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-[#D0D5DD] bg-white px-5 py-2 text-sm font-semibold text-[#344054] transition-colors hover:bg-[#F9FAFB]"
              >
                <ArrowLeft size={18} />
                Return to User Management
              </Link>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
