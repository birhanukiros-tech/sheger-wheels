
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Search,
  Users,
  ShieldCheck,
  UserRound,
  UserCog,
  RefreshCw,
  ArrowLeft,
  ArrowRight,
  Mail,
  CalendarDays,
  UserCheck,
  UserX,
} from "lucide-react";

import {
  readStoredData,
  writeStoredData,
  STORAGE_KEYS,
} from "@/lib/storage";
import { initializeDemoUsers } from "@/lib/auth";

const PAGE_SIZE = 8;

const roleOptions = [
  { value: "all", label: "All roles" },
  { value: "renter", label: "Renter" },
  { value: "owner", label: "Owner" },
  { value: "admin", label: "Admin" },
];

function getStatus(user) {
  return user.isActive === false ? "inactive" : "active";
}

function formatDate(value) {
  if (!value) return "Not recorded";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "Not recorded";

  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function getRoleLabel(role) {
  return role ? role.charAt(0).toUpperCase() + role.slice(1) : "Unknown";
}

function getInitials(name) {
  return (name || "User")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(true);

  const loadUsers = useCallback(() => {
    setLoading(true);

    try {
      const storedUsers = readStoredData(STORAGE_KEYS.users, null);
      const availableUsers = Array.isArray(storedUsers)
        ? storedUsers
        : initializeDemoUsers();

      setUsers(Array.isArray(availableUsers) ? availableUsers : []);
      setNotice("");
    } catch {
      setUsers([]);
      setNotice("Unable to load users. Please refresh the page.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      loadUsers();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [loadUsers]);

  const filteredUsers = useMemo(() => {
    const query = search.trim().toLowerCase();

    return users
      .filter((user) => {
        const matchesSearch =
          !query ||
          [user.name, user.email, user.id]
            .filter(Boolean)
            .some((value) => String(value).toLowerCase().includes(query));

        const matchesRole =
          roleFilter === "all" || user.role === roleFilter;

        const matchesStatus =
          statusFilter === "all" || getStatus(user) === statusFilter;

        return matchesSearch && matchesRole && matchesStatus;
      })
      .sort((a, b) =>
        String(a.name || "").localeCompare(String(b.name || "")),
      );
  }, [users, search, roleFilter, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const startIndex = (currentPage - 1) * PAGE_SIZE;
  const visibleUsers = filteredUsers.slice(
    startIndex,
    startIndex + PAGE_SIZE,
  );

  const activeCount = users.filter(
    (user) => getStatus(user) === "active",
  ).length;

  const inactiveCount = users.length - activeCount;
  const adminCount = users.filter((user) => user.role === "admin").length;

  function updateFilter(setter, value) {
    setter(value);
    setPage(1);
    setNotice("");
  }

  function toggleUserStatus(user) {
    if (user.role === "admin") {
      setNotice("Administrator accounts cannot be deactivated here.");
      return;
    }

    const nextStatus = getStatus(user) === "active" ? false : true;

    const updatedUsers = users.map((item) =>
      item.id === user.id ? { ...item, isActive: nextStatus } : item,
    );

    if (!writeStoredData(STORAGE_KEYS.users, updatedUsers)) {
      setNotice("Could not save this change. Please try again.");
      return;
    }

    setUsers(updatedUsers);
    setNotice(
      `${user.name || user.email} is now ${
        nextStatus ? "active" : "inactive"
      }.`,
    );
  }

  return (
    <main className="min-h-screen bg-[#F4F7FB] px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <Link
          href="/admin"
          className="mb-5 inline-flex items-center gap-2 text-sm font-semibold text-[#0866F5] transition hover:text-[#0754C7]"
        >
          <ArrowLeft size={16} />
          Back to dashboard
        </Link>

        <div className="mb-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wider text-[#0866F5]">
              Administration
            </p>
            <h1 className="mt-1 text-3xl font-bold tracking-tight text-[#252A34]">
              User Management
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[#667085]">
              Review registered accounts, check roles, and manage account
              availability.
            </p>
          </div>

          <button
            type="button"
            onClick={loadUsers}
            className="inline-flex min-h-11 items-center justify-center gap-2 self-start rounded-lg border border-[#D8E0EB] bg-white px-4 text-sm font-semibold text-[#344054] transition hover:bg-[#F8FAFC] sm:self-auto"
          >
            <RefreshCw size={16} />
            Refresh users
          </button>
        </div>

        <div className="mb-7 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Total users"
            value={users.length}
            icon={Users}
            description="All stored accounts"
          />
          <StatCard
            label="Active accounts"
            value={activeCount}
            icon={UserCheck}
            description="Available by default"
          />
          <StatCard
            label="Inactive accounts"
            value={inactiveCount}
            icon={UserX}
            description="Restricted by admin status"
          />
          <StatCard
            label="Administrators"
            value={adminCount}
            icon={ShieldCheck}
            description="Admin-role accounts"
          />
        </div>

        {notice && (
          <div
            role="status"
            className="mb-5 rounded-lg border border-[#BBD5FF] bg-[#EFF6FF] px-4 py-3 text-sm text-[#1849A9]"
          >
            {notice}
          </div>
        )}

        <section className="overflow-hidden rounded-2xl border border-[#E5EAF1] bg-white shadow-sm">
          <div className="border-b border-[#E5EAF1] p-4 sm:p-5">
            <div className="flex flex-col gap-3 lg:flex-row">
              <label className="relative min-w-0 flex-1">
                <span className="sr-only">Search users</span>
                <Search
                  size={18}
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#98A2B3]"
                />
                <input
                  type="search"
                  value={search}
                  onChange={(event) =>
                    updateFilter(setSearch, event.target.value)
                  }
                  placeholder="Search by name, email, or user ID..."
                  className="h-11 w-full rounded-lg border border-[#D8E0EB] bg-white pl-10 pr-3 text-sm text-[#252A34] outline-none transition placeholder:text-[#98A2B3] focus:border-[#0866F5] focus:ring-2 focus:ring-blue-100"
                />
              </label>

              <label className="min-w-0 lg:w-44">
                <span className="sr-only">Filter by role</span>
                <select
                  value={roleFilter}
                  onChange={(event) =>
                    updateFilter(setRoleFilter, event.target.value)
                  }
                  className="h-11 w-full rounded-lg border border-[#D8E0EB] bg-white px-3 text-sm text-[#344054] outline-none focus:border-[#0866F5] focus:ring-2 focus:ring-blue-100"
                >
                  {roleOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="min-w-0 lg:w-44">
                <span className="sr-only">Filter by account status</span>
                <select
                  value={statusFilter}
                  onChange={(event) =>
                    updateFilter(setStatusFilter, event.target.value)
                  }
                  className="h-11 w-full rounded-lg border border-[#D8E0EB] bg-white px-3 text-sm text-[#344054] outline-none focus:border-[#0866F5] focus:ring-2 focus:ring-blue-100"
                >
                  <option value="all">All statuses</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </label>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 sm:px-5">
            <p className="text-sm text-[#667085]">
              Showing{" "}
              <span className="font-semibold text-[#252A34]">
                {filteredUsers.length === 0 ? 0 : startIndex + 1}–
                {Math.min(startIndex + PAGE_SIZE, filteredUsers.length)}
              </span>{" "}
              of{" "}
              <span className="font-semibold text-[#252A34]">
                {filteredUsers.length}
              </span>{" "}
              users
            </p>
            <span className="inline-flex items-center gap-1.5 text-xs text-[#667085]">
              <span className="h-2 w-2 rounded-full bg-[#0866F5]" />
              Demo data
            </span>
          </div>

          {loading ? (
            <div className="px-6 py-16 text-center text-sm text-[#667085]">
              Loading users...
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="px-6 py-16 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#F4F7FB] text-[#667085]">
                <UserRound size={22} />
              </div>
              <h2 className="mt-4 font-semibold text-[#252A34]">
                No users found
              </h2>
              <p className="mt-1 text-sm text-[#667085]">
                Try another search term or change your filters.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSearch("");
                  setRoleFilter("all");
                  setStatusFilter("all");
                  setPage(1);
                }}
                className="mt-4 text-sm font-semibold text-[#0866F5] hover:underline"
              >
                Clear filters
              </button>
            </div>
          ) : (
            <>
              <div className="hidden overflow-x-auto md:block">
                <table className="w-full min-w-[850px] border-collapse text-left">
                  <thead>
                    <tr className="border-y border-[#E5EAF1] bg-[#F8FAFC] text-xs uppercase tracking-wide text-[#667085]">
                      <th className="px-5 py-3 font-semibold">User</th>
                      <th className="px-5 py-3 font-semibold">Role</th>
                      <th className="px-5 py-3 font-semibold">Status</th>
                      <th className="px-5 py-3 font-semibold">Registered</th>
                      <th className="px-5 py-3 text-right font-semibold">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E5EAF1]">
                    {visibleUsers.map((user) => (
                      <tr
                        key={user.id}
                        className="transition hover:bg-[#F8FAFC]"
                      >
                        <td className="px-5 py-4">
                          <div className="flex min-w-0 items-center gap-3">
                            <Avatar user={user} />
                            <div className="min-w-0">
                              <p className="truncate text-sm font-semibold text-[#252A34]">
                                {user.name || "Unnamed user"}
                              </p>
                              <p className="mt-1 flex items-center gap-1.5 truncate text-xs text-[#667085]">
                                <Mail size={12} />
                                {user.email || "No email recorded"}
                              </p>
                              <p className="mt-1 truncate text-[11px] text-[#98A2B3]">
                                ID: {user.id}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <RoleBadge role={user.role} />
                        </td>
                        <td className="px-5 py-4">
                          <StatusBadge status={getStatus(user)} />
                        </td>
                        <td className="px-5 py-4 text-sm text-[#667085]">
                          {formatDate(user.createdAt)}
                        </td>
                        <td className="px-5 py-4 text-right">
                          <StatusButton
                            user={user}
                            onClick={() => toggleUserStatus(user)}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="grid gap-3 p-4 md:hidden">
                {visibleUsers.map((user) => (
                  <article
                    key={user.id}
                    className="rounded-xl border border-[#E5EAF1] p-4"
                  >
                    <div className="flex items-start gap-3">
                      <Avatar user={user} />
                      <div className="min-w-0 flex-1">
                        <h2 className="break-words text-sm font-bold text-[#252A34]">
                          {user.name || "Unnamed user"}
                        </h2>
                        <p className="mt-1 break-all text-xs text-[#667085]">
                          {user.email || "No email recorded"}
                        </p>
                        <p className="mt-1 break-all text-[11px] text-[#98A2B3]">
                          ID: {user.id}
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 flex flex-wrap items-center gap-2">
                      <RoleBadge role={user.role} />
                      <StatusBadge status={getStatus(user)} />
                    </div>

                    <p className="mt-3 flex items-center gap-2 text-xs text-[#667085]">
                      <CalendarDays size={14} />
                      Registered: {formatDate(user.createdAt)}
                    </p>

                    <div className="mt-4 border-t border-[#E5EAF1] pt-3">
                      <StatusButton
                        user={user}
                        onClick={() => toggleUserStatus(user)}
                        fullWidth
                      />
                    </div>
                  </article>
                ))}
              </div>
            </>
          )}

          {!loading && filteredUsers.length > 0 && (
            <div className="flex flex-col gap-3 border-t border-[#E5EAF1] px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
              <p className="text-xs text-[#667085]">
                Page {currentPage} of {totalPages}
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={currentPage === 1}
                  onClick={() => setPage((current) => Math.max(1, current - 1))}
                  className="inline-flex min-h-10 flex-1 items-center justify-center gap-2 rounded-lg border border-[#D8E0EB] px-3 text-sm font-semibold text-[#344054] transition hover:bg-[#F8FAFC] disabled:cursor-not-allowed disabled:opacity-40 sm:flex-none"
                >
                  <ArrowLeft size={15} />
                  Previous
                </button>
                <button
                  type="button"
                  disabled={currentPage >= totalPages}
                  onClick={() =>
                    setPage((current) => Math.min(totalPages, current + 1))
                  }
                  className="inline-flex min-h-10 flex-1 items-center justify-center gap-2 rounded-lg border border-[#D8E0EB] px-3 text-sm font-semibold text-[#344054] transition hover:bg-[#F8FAFC] disabled:cursor-not-allowed disabled:opacity-40 sm:flex-none"
                >
                  Next
                  <ArrowRight size={15} />
                </button>
              </div>
            </div>
          )}
        </section>

        <p className="mt-4 text-xs leading-5 text-[#667085]">
          Account status changes are stored in this browser’s demo data.
          Administrator accounts are protected from deactivation on this page.
        </p>
      </div>
    </main>
  );
}

function StatCard({ label, value, icon: Icon, description }) {
  return (
    <article className="rounded-2xl border border-[#E5EAF1] bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-[#667085]">{label}</p>
          <p className="mt-2 text-3xl font-bold tabular-nums text-[#252A34]">
            {value}
          </p>
        </div>
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#EFF6FF] text-[#0866F5]">
          <Icon size={21} />
        </div>
      </div>
      <p className="mt-3 text-xs text-[#98A2B3]">{description}</p>
    </article>
  );
}

function Avatar({ user }) {
  return (
    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#E8F1FF] text-xs font-bold text-[#0866F5]">
      {getInitials(user.name)}
    </div>
  );
}

function RoleBadge({ role }) {
  const styles = {
    renter: "bg-[#EFF6FF] text-[#1849A9]",
    owner: "bg-[#F3E8FF] text-[#6B21A8]",
    admin: "bg-[#FFF4E5] text-[#9A4D00]",
  };

  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
        styles[role] || "bg-[#F2F4F7] text-[#475467]"
      }`}
    >
      {getRoleLabel(role)}
    </span>
  );
}

function StatusBadge({ status }) {
  const active = status === "active";

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${
        active
          ? "bg-[#ECFDF3] text-[#027A48]"
          : "bg-[#FEF3F2] text-[#B42318]"
      }`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${
          active ? "bg-[#12B76A]" : "bg-[#F04438]"
        }`}
      />
      {active ? "Active" : "Inactive"}
    </span>
  );
}

function StatusButton({ user, onClick, fullWidth = false }) {
  const isAdmin = user.role === "admin";
  const isActive = getStatus(user) === "active";

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={isAdmin}
      title={isAdmin ? "Administrator accounts are protected" : undefined}
      className={`inline-flex min-h-9 items-center justify-center gap-2 rounded-lg border px-3 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-40 ${
        fullWidth ? "w-full" : ""
      } ${
        isActive
          ? "border-[#FECACA] text-[#B42318] hover:bg-[#FEF3F2]"
          : "border-[#A7F3D0] text-[#027A48] hover:bg-[#ECFDF3]"
      }`}
    >
      {isActive ? <UserX size={14} /> : <UserCheck size={14} />}
      {isAdmin ? "Protected" : isActive ? "Deactivate" : "Activate"}
    </button>
  );
}
