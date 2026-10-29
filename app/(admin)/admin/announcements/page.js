
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Megaphone,
  Plus,
  Search,
  Trash2,
  Eye,
  EyeOff,
  CalendarDays,
  Users,
  X,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";

import { getCurrentUser, hasRole } from "@/lib/auth";
import {
  readStoredData,
  writeStoredData,
} from "@/lib/storage";
import { STORAGE_KEYS } from "@/lib/storage";

const PAGE_SIZE = 8;

const AUDIENCES = [
  { value: "all", label: "Everyone" },
  { value: "renters", label: "Renters" },
  { value: "owners", label: "Owners" },
];

function createAnnouncementId() {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return `announcement-${crypto.randomUUID()}`;
  }

  return `announcement-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 9)}`;
}

function formatDate(value) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function getAudienceLabel(audience) {
  return (
    AUDIENCES.find((item) => item.value === audience)?.label ??
    "Everyone"
  );
}

export default function AdminAnnouncementsPage() {
  const router = useRouter();

  const [authorized, setAuthorized] = useState(false);
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [audienceFilter, setAudienceFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formError, setFormError] = useState("");
  const [notice, setNotice] = useState("");

  const [formData, setFormData] = useState({
    title: "",
    message: "",
    audience: "all",
  });

  useEffect(() => {
    const user = getCurrentUser();

    if (!hasRole(user, ["admin"])) {
      router.replace(
        "/signin?role=admin&next=%2Fadmin%2Fannouncements"
      );
      return;
    }

    setAuthorized(true);

    const saved = readStoredData(STORAGE_KEYS.announcements, []);
    setAnnouncements(Array.isArray(saved) ? saved : []);
    setLoading(false);
  }, [router]);

  function saveAnnouncements(nextAnnouncements) {
    const saved = writeStoredData(
      STORAGE_KEYS.announcements,
      nextAnnouncements
    );

    if (!saved) {
      setNotice("");
      setFormError(
        "Unable to save changes. Check your browser storage settings."
      );
      return false;
    }

    setAnnouncements(nextAnnouncements);
    setFormError("");
    return true;
  }

  function resetForm() {
    setFormData({
      title: "",
      message: "",
      audience: "all",
    });
    setEditingId(null);
    setFormError("");
    setShowForm(false);
  }

  function openCreateForm() {
    setFormData({
      title: "",
      message: "",
      audience: "all",
    });
    setEditingId(null);
    setFormError("");
    setNotice("");
    setShowForm(true);
  }

  function openEditForm(announcement) {
    setFormData({
      title: announcement.title ?? "",
      message: announcement.message ?? "",
      audience: announcement.audience ?? "all",
    });
    setEditingId(announcement.id);
    setFormError("");
    setNotice("");
    setShowForm(true);
  }

  function handleSubmit(event) {
    event.preventDefault();
    setFormError("");
    setNotice("");

    const title = formData.title.trim();
    const message = formData.message.trim();

    if (!title || !message) {
      setFormError("Please enter both a title and a message.");
      return;
    }

    const now = new Date().toISOString();

    if (editingId) {
      const nextAnnouncements = announcements.map((announcement) =>
        announcement.id === editingId
          ? {
              ...announcement,
              title,
              message,
              audience: formData.audience,
              updatedAt: now,
            }
          : announcement
      );

      if (saveAnnouncements(nextAnnouncements)) {
        resetForm();
        setNotice("Announcement updated successfully.");
      }

      return;
    }

    const newAnnouncement = {
      id: createAnnouncementId(),
      title,
      message,
      audience: formData.audience,
      isPublished: false,
      createdAt: now,
      updatedAt: now,
    };

    if (saveAnnouncements([newAnnouncement, ...announcements])) {
      resetForm();
      setCurrentPage(1);
      setNotice("Announcement created as a draft.");
    }
  }

  function togglePublished(announcement) {
    setNotice("");
    setFormError("");

    const nextAnnouncements = announcements.map((item) =>
      item.id === announcement.id
        ? {
            ...item,
            isPublished: !item.isPublished,
            updatedAt: new Date().toISOString(),
          }
        : item
    );

    if (saveAnnouncements(nextAnnouncements)) {
      setNotice(
        announcement.isPublished
          ? "Announcement moved to drafts."
          : "Announcement published successfully."
      );
    }
  }

  function deleteAnnouncement(announcement) {
    const confirmed = window.confirm(
      `Delete "${announcement.title}"? This action cannot be undone.`
    );

    if (!confirmed) return;

    setNotice("");
    setFormError("");

    const nextAnnouncements = announcements.filter(
      (item) => item.id !== announcement.id
    );

    if (saveAnnouncements(nextAnnouncements)) {
      setNotice("Announcement deleted.");
    }
  }

  const normalizedSearch = search.trim().toLowerCase();

  const filteredAnnouncements = announcements.filter((announcement) => {
    const matchesSearch =
      !normalizedSearch ||
      String(announcement.title ?? "")
        .toLowerCase()
        .includes(normalizedSearch) ||
      String(announcement.message ?? "")
        .toLowerCase()
        .includes(normalizedSearch);

    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "published" && announcement.isPublished) ||
      (statusFilter === "draft" && !announcement.isPublished);

    const matchesAudience =
      audienceFilter === "all" ||
      (announcement.audience ?? "all") === audienceFilter;

    return matchesSearch && matchesStatus && matchesAudience;
  });

  const totalPages = Math.max(
    1,
    Math.ceil(filteredAnnouncements.length / PAGE_SIZE)
  );

  const safePage = Math.min(currentPage, totalPages);

  const visibleAnnouncements = filteredAnnouncements.slice(
    (safePage - 1) * PAGE_SIZE,
    safePage * PAGE_SIZE
  );

  const publishedCount = announcements.filter(
    (item) => item.isPublished
  ).length;

  const draftCount = announcements.length - publishedCount;

  if (!authorized || loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#F5F7FB] px-4">
        <p className="text-sm text-[#667085]">
          Checking administrator access...
        </p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#F5F7FB] px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 text-[#0866F5]">
                <Megaphone size={24} />
              </div>

              <div>
                <h1 className="text-2xl font-bold text-[#252A34] sm:text-3xl">
                  Announcements
                </h1>
                <p className="mt-1 text-sm text-[#667085]">
                  Create and manage platform announcements.
                </p>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={openCreateForm}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-[#0866F5] px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#0754C7]"
          >
            <Plus size={18} />
            New announcement
          </button>
        </div>

        {notice && (
          <div
            role="status"
            className="mb-5 flex items-start gap-2 rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-800"
          >
            <CheckCircle2 size={18} className="mt-0.5 shrink-0" />
            <span>{notice}</span>
          </div>
        )}

        {formError && !showForm && (
          <div
            role="alert"
            className="mb-5 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700"
          >
            <AlertCircle size={18} className="mt-0.5 shrink-0" />
            <span>{formError}</span>
          </div>
        )}

        <section className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-[#E5EAF1] bg-white p-5">
            <p className="text-sm text-[#667085]">Total announcements</p>
            <p className="mt-2 text-3xl font-bold text-[#252A34]">
              {announcements.length}
            </p>
          </div>

          <div className="rounded-xl border border-[#E5EAF1] bg-white p-5">
            <p className="text-sm text-[#667085]">Published</p>
            <p className="mt-2 text-3xl font-bold text-green-600">
              {publishedCount}
            </p>
          </div>

          <div className="rounded-xl border border-[#E5EAF1] bg-white p-5">
            <p className="text-sm text-[#667085]">Drafts</p>
            <p className="mt-2 text-3xl font-bold text-amber-600">
              {draftCount}
            </p>
          </div>
        </section>

        {showForm && (
          <section className="mb-6 rounded-xl border border-[#E5EAF1] bg-white p-5 sm:p-6">
            <div className="mb-5 flex items-center justify-between gap-3">
              <h2 className="text-lg font-bold text-[#252A34]">
                {editingId ? "Edit announcement" : "Create announcement"}
              </h2>

              <button
                type="button"
                onClick={resetForm}
                aria-label="Close announcement form"
                className="rounded-lg p-2 text-[#667085] transition-colors hover:bg-gray-100 hover:text-[#252A34]"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label
                  htmlFor="announcement-title"
                  className="mb-2 block text-sm font-semibold text-[#344054]"
                >
                  Title
                </label>
                <input
                  id="announcement-title"
                  type="text"
                  maxLength={120}
                  required
                  value={formData.title}
                  onChange={(event) =>
                    setFormData((previous) => ({
                      ...previous,
                      title: event.target.value,
                    }))
                  }
                  placeholder="Enter announcement title"
                  className="min-h-11 w-full rounded-lg border border-[#D0D5DD] px-3 py-2 text-sm text-[#252A34] outline-none focus:border-[#0866F5] focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div>
                <label
                  htmlFor="announcement-message"
                  className="mb-2 block text-sm font-semibold text-[#344054]"
                >
                  Message
                </label>
                <textarea
                  id="announcement-message"
                  rows={5}
                  maxLength={2000}
                  required
                  value={formData.message}
                  onChange={(event) =>
                    setFormData((previous) => ({
                      ...previous,
                      message: event.target.value,
                    }))
                  }
                  placeholder="Write the announcement message..."
                  className="w-full rounded-lg border border-[#D0D5DD] px-3 py-3 text-sm text-[#252A34] outline-none focus:border-[#0866F5] focus:ring-2 focus:ring-blue-100"
                />
                <p className="mt-1 text-right text-xs text-[#667085]">
                  {formData.message.length}/2000
                </p>
              </div>

              <div>
                <label
                  htmlFor="announcement-audience"
                  className="mb-2 block text-sm font-semibold text-[#344054]"
                >
                  Audience
                </label>
                <select
                  id="announcement-audience"
                  value={formData.audience}
                  onChange={(event) =>
                    setFormData((previous) => ({
                      ...previous,
                      audience: event.target.value,
                    }))
                  }
                  className="min-h-11 w-full rounded-lg border border-[#D0D5DD] bg-white px-3 py-2 text-sm text-[#252A34] outline-none focus:border-[#0866F5] focus:ring-2 focus:ring-blue-100 sm:max-w-sm"
                >
                  {AUDIENCES.map((audience) => (
                    <option key={audience.value} value={audience.value}>
                      {audience.label}
                    </option>
                  ))}
                </select>
              </div>

              {formError && (
                <div
                  role="alert"
                  className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700"
                >
                  <AlertCircle size={18} className="mt-0.5 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <div className="flex flex-col-reverse gap-3 border-t border-[#E5EAF1] pt-5 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={resetForm}
                  className="min-h-11 rounded-lg border border-[#D0D5DD] px-5 py-2 text-sm font-semibold text-[#344054] hover:bg-gray-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="min-h-11 rounded-lg bg-[#0866F5] px-5 py-2 text-sm font-semibold text-white hover:bg-[#0754C7]"
                >
                  {editingId ? "Save changes" : "Save as draft"}
                </button>
              </div>
            </form>
          </section>
        )}

        <section className="overflow-hidden rounded-xl border border-[#E5EAF1] bg-white">
          <div className="border-b border-[#E5EAF1] p-4 sm:p-5">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              <div className="relative">
                <Search
                  size={18}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-[#98A2B3]"
                />
                <input
                  type="search"
                  value={search}
                  onChange={(event) => {
                    setSearch(event.target.value);
                    setCurrentPage(1);
                  }}
                  placeholder="Search announcements..."
                  aria-label="Search announcements"
                  className="min-h-11 w-full rounded-lg border border-[#D0D5DD] py-2 pl-10 pr-3 text-sm outline-none focus:border-[#0866F5] focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <select
                value={statusFilter}
                onChange={(event) => {
                  setStatusFilter(event.target.value);
                  setCurrentPage(1);
                }}
                aria-label="Filter by publication status"
                className="min-h-11 rounded-lg border border-[#D0D5DD] bg-white px-3 py-2 text-sm outline-none focus:border-[#0866F5]"
              >
                <option value="all">All statuses</option>
                <option value="published">Published</option>
                <option value="draft">Drafts</option>
              </select>

              <select
                value={audienceFilter}
                onChange={(event) => {
                  setAudienceFilter(event.target.value);
                  setCurrentPage(1);
                }}
                aria-label="Filter by audience"
                className="min-h-11 rounded-lg border border-[#D0D5DD] bg-white px-3 py-2 text-sm outline-none focus:border-[#0866F5]"
              >
                <option value="all">All audiences</option>
                <option value="renters">Renters</option>
                <option value="owners">Owners</option>
              </select>
            </div>
          </div>

          {filteredAnnouncements.length === 0 ? (
            <div className="px-5 py-14 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#F4F7FB] text-[#667085]">
                <Megaphone size={26} />
              </div>
              <h2 className="mt-4 text-lg font-semibold text-[#252A34]">
                {announcements.length === 0
                  ? "No announcements yet"
                  : "No matching announcements"}
              </h2>
              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#667085]">
                {announcements.length === 0
                  ? "Create an announcement to share important updates with the Sheggar Wheels community."
                  : "Try changing your search or filters to find an announcement."}
              </p>

              {announcements.length === 0 && (
                <button
                  type="button"
                  onClick={openCreateForm}
                  className="mt-5 inline-flex min-h-10 items-center gap-2 rounded-lg bg-[#0866F5] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0754C7]"
                >
                  <Plus size={17} />
                  Create announcement
                </button>
              )}
            </div>
          ) : (
            <>
              <div className="hidden overflow-x-auto md:block">
                <table className="w-full min-w-[850px] text-left text-sm">
                  <thead className="bg-[#F9FAFB] text-xs uppercase tracking-wide text-[#667085]">
                    <tr>
                      <th className="px-5 py-4 font-semibold">Announcement</th>
                      <th className="px-5 py-4 font-semibold">Audience</th>
                      <th className="px-5 py-4 font-semibold">Created</th>
                      <th className="px-5 py-4 font-semibold">Status</th>
                      <th className="px-5 py-4 text-right font-semibold">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E5EAF1]">
                    {visibleAnnouncements.map((announcement) => (
                      <tr key={announcement.id} className="align-top">
                        <td className="max-w-md px-5 py-4">
                          <p className="font-semibold text-[#252A34]">
                            {announcement.title}
                          </p>
                          <p className="mt-1 line-clamp-2 text-xs leading-5 text-[#667085]">
                            {announcement.message}
                          </p>
                        </td>
                        <td className="px-5 py-4 text-[#475467]">
                          {getAudienceLabel(announcement.audience)}
                        </td>
                        <td className="whitespace-nowrap px-5 py-4 text-[#667085]">
                          {formatDate(announcement.createdAt)}
                        </td>
                        <td className="px-5 py-4">
                          <span
                            className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                              announcement.isPublished
                                ? "bg-green-50 text-green-700"
                                : "bg-amber-50 text-amber-700"
                            }`}
                          >
                            {announcement.isPublished
                              ? "Published"
                              : "Draft"}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => openEditForm(announcement)}
                              className="rounded-lg border border-[#D0D5DD] px-3 py-2 text-xs font-semibold text-[#344054] hover:bg-gray-50"
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => togglePublished(announcement)}
                              title={
                                announcement.isPublished
                                  ? "Move to drafts"
                                  : "Publish announcement"
                              }
                              aria-label={
                                announcement.isPublished
                                  ? "Move to drafts"
                                  : "Publish announcement"
                              }
                              className="rounded-lg border border-[#D0D5DD] p-2 text-[#475467] hover:bg-gray-50"
                            >
                              {announcement.isPublished ? (
                                <EyeOff size={16} />
                              ) : (
                                <Eye size={16} />
                              )}
                            </button>
                            <button
                              type="button"
                              onClick={() => deleteAnnouncement(announcement)}
                              aria-label={`Delete ${announcement.title}`}
                              className="rounded-lg border border-red-200 p-2 text-red-600 hover:bg-red-50"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="divide-y divide-[#E5EAF1] md:hidden">
                {visibleAnnouncements.map((announcement) => (
                  <article key={announcement.id} className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h3 className="break-words font-semibold text-[#252A34]">
                          {announcement.title}
                        </h3>
                        <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-[#667085]">
                          {announcement.message}
                        </p>
                      </div>
                      <span
                        className={`shrink-0 rounded-full px-2 py-1 text-xs font-semibold ${
                          announcement.isPublished
                            ? "bg-green-50 text-green-700"
                            : "bg-amber-50 text-amber-700"
                        }`}
                      >
                        {announcement.isPublished ? "Published" : "Draft"}
                      </span>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-xs text-[#667085]">
                      <span className="inline-flex items-center gap-1.5">
                        <Users size={14} />
                        {getAudienceLabel(announcement.audience)}
                      </span>
                      <span className="inline-flex items-center gap-1.5">
                        <CalendarDays size={14} />
                        {formatDate(announcement.createdAt)}
                      </span>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2 border-t border-[#E5EAF1] pt-3">
                      <button
                        type="button"
                        onClick={() => openEditForm(announcement)}
                        className="min-h-10 rounded-lg border border-[#D0D5DD] px-3 py-2 text-xs font-semibold text-[#344054] hover:bg-gray-50"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => togglePublished(announcement)}
                        className="inline-flex min-h-10 items-center gap-1.5 rounded-lg border border-[#D0D5DD] px-3 py-2 text-xs font-semibold text-[#344054] hover:bg-gray-50"
                      >
                        {announcement.isPublished ? (
                          <>
                            <EyeOff size={15} />
                            Move to drafts
                          </>
                        ) : (
                          <>
                            <Eye size={15} />
                            Publish
                          </>
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteAnnouncement(announcement)}
                        className="inline-flex min-h-10 items-center gap-1.5 rounded-lg border border-red-200 px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50"
                      >
                        <Trash2 size={15} />
                        Delete
                      </button>
                    </div>
                  </article>
                ))}
              </div>

              <div className="flex flex-col gap-3 border-t border-[#E5EAF1] px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
                <p className="text-sm text-[#667085]">
                  Showing{" "}
                  {filteredAnnouncements.length === 0
                    ? 0
                    : (safePage - 1) * PAGE_SIZE + 1}
                  {"–"}
                  {Math.min(safePage * PAGE_SIZE, filteredAnnouncements.length)}{" "}
                  of {filteredAnnouncements.length}
                </p>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={safePage <= 1}
                    onClick={() =>
                      setCurrentPage((page) => Math.max(1, page - 1))
                    }
                    className="min-h-10 rounded-lg border border-[#D0D5DD] px-3 py-2 text-sm font-medium text-[#344054] disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Previous
                  </button>
                  <span className="px-2 text-sm text-[#667085]">
                    Page {safePage} of {totalPages}
                  </span>
                  <button
                    type="button"
                    disabled={safePage >= totalPages}
                    onClick={() =>
                      setCurrentPage((page) =>
                        Math.min(totalPages, page + 1)
                      )
                    }
                    className="min-h-10 rounded-lg border border-[#D0D5DD] px-3 py-2 text-sm font-medium text-[#344054] disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Next
                  </button>
                </div>
              </div>
            </>
          )}
        </section>

        <p className="mt-5 text-xs leading-5 text-[#667085]">
          Announcements are stored in this browser for demo purposes. Publishing
          changes their status; displaying them to renters and owners requires
          the relevant announcement views to read this shared storage.
        </p>
      </div>
    </main>
  );
}
