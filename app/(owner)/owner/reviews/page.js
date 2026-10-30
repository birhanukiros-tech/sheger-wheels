"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Star,
  MessageSquareText,
  CarFront,
  Send,
  RefreshCw,
} from "lucide-react";

import cars from "@/data/cars.json";
import { getCurrentUser } from "@/lib/auth";
import {
  STORAGE_KEYS,
  readStoredData,
  writeStoredData,
} from "@/lib/storage";

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

function formatReviewDate(dateString) {
  if (!dateString) return "Date unavailable";

  const date = new Date(dateString);

  if (Number.isNaN(date.getTime())) return "Date unavailable";

  return new Intl.DateTimeFormat("en", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

function RatingStars({ rating }) {
  const numericRating = Number(rating) || 0;

  return (
    <div
      className="flex items-center gap-1"
      aria-label={`${numericRating} out of 5 stars`}
    >
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          size={17}
          className={
            star <= numericRating
              ? "fill-amber-400 text-amber-400"
              : "text-slate-300"
          }
        />
      ))}
      <span className="ml-1 text-sm font-semibold text-slate-700">
        {numericRating}/5
      </span>
    </div>
  );
}

export default function OwnerReviewsPage() {
  const router = useRouter();

  const [user, setUser] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [carMap, setCarMap] = useState({});
  const [replies, setReplies] = useState({});
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState("");
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  const loadReviews = useCallback((ownerId) => {
    const allCars = getAllCars();
    const carsById = {};

    allCars.forEach((car) => {
      carsById[String(car.id)] = car;
    });

    setCarMap(carsById);

    const storedReviews = readStoredData(STORAGE_KEYS.reviews, []);
    const ownerReviews = Array.isArray(storedReviews)
      ? storedReviews.filter(
          (review) => String(review.ownerId) === String(ownerId)
        )
      : [];

    ownerReviews.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() -
        new Date(a.createdAt).getTime()
    );

    setReviews(ownerReviews);

    setReplies((current) => {
      const next = { ...current };

      ownerReviews.forEach((review) => {
        if (!(review.id in next)) {
          next[review.id] = review.ownerReply || "";
        }
      });

      return next;
    });
  }, []);

  useEffect(() => {
    let cancelled = false;
    let currentUser = null;

    function refreshFromStorage() {
      if (!cancelled && currentUser) {
        loadReviews(currentUser.id);
      }
    }

    function initializeReviews() {
      if (cancelled) return;

      currentUser = getCurrentUser();

      if (!currentUser || currentUser.role !== "owner") {
        router.replace("/signin");
        return;
      }

      setUser(currentUser);
      loadReviews(currentUser.id);
      setLoading(false);

      window.addEventListener("focus", refreshFromStorage);
      window.addEventListener("storage", refreshFromStorage);
    }

    Promise.resolve().then(initializeReviews);

    return () => {
      cancelled = true;
      window.removeEventListener("focus", refreshFromStorage);
      window.removeEventListener("storage", refreshFromStorage);
    };
  }, [router, loadReviews]);

  const filteredReviews = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return reviews.filter((review) => {
      const matchesRating =
        filter === "all" || String(review.rating) === filter;

      const car = carMap[String(review.carId)];

      const searchableText = [
        review.comment,
        review.ownerReply,
        review.renterId,
        review.bookingId,
        car?.make,
        car?.model,
        car?.year,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return (
        matchesRating &&
        (!normalizedSearch || searchableText.includes(normalizedSearch))
      );
    });
  }, [reviews, carMap, filter, search]);

  const averageRating = useMemo(() => {
    if (reviews.length === 0) return "—";

    const total = reviews.reduce(
      (sum, review) => sum + (Number(review.rating) || 0),
      0
    );

    return (total / reviews.length).toFixed(1);
  }, [reviews]);

  const repliedCount = reviews.filter(
    (review) => review.ownerReply?.trim()
  ).length;

  function handleSaveReply(review) {
    if (!user) return;

    const reply = (replies[review.id] || "").trim();

    if (!reply) {
      setError("Please write a reply before saving.");
      setNotice("");
      return;
    }

    setSavingId(review.id);
    setError("");
    setNotice("");

    const storedReviews = readStoredData(STORAGE_KEYS.reviews, []);

    if (!Array.isArray(storedReviews)) {
      setError("Unable to read saved reviews.");
      setSavingId("");
      return;
    }

    const reviewIndex = storedReviews.findIndex(
      (item) =>
        String(item.id) === String(review.id) &&
        String(item.ownerId) === String(user.id)
    );

    if (reviewIndex === -1) {
      setError("This review could not be found in saved data.");
      setSavingId("");
      return;
    }

    const updatedReviews = [...storedReviews];

    updatedReviews[reviewIndex] = {
      ...updatedReviews[reviewIndex],
      ownerReply: reply,
      updatedAt: new Date().toISOString(),
    };

    const saved = writeStoredData(
      STORAGE_KEYS.reviews,
      updatedReviews
    );

    if (!saved) {
      setError("Unable to save your reply. Please try again.");
      setSavingId("");
      return;
    }

    loadReviews(user.id);
    setNotice("Your reply has been saved.");
    setSavingId("");
  }

  if (loading || !user) {
    return (
      <main className="mx-auto max-w-7xl px-4 py-16">
        <p className="text-center text-slate-500">
          Loading your reviews…
        </p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Link
              href="/owner"
              className="text-sm font-semibold text-[#0866F5] hover:underline"
            >
              ← Back to dashboard
            </Link>

            <p className="mt-5 text-sm font-semibold uppercase tracking-wider text-[#0866F5]">
              Owner dashboard
            </p>

            <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
              Customer reviews
            </h1>

            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
              See what renters say about your cars and respond to their
              feedback.
            </p>
          </div>

          <button
            type="button"
            onClick={() => loadReviews(user.id)}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            <RefreshCw size={16} />
            Refresh reviews
          </button>
        </div>

        <section
          aria-label="Review summary"
          className="mt-8 grid gap-4 sm:grid-cols-3"
        >
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex size-11 items-center justify-center rounded-xl bg-blue-50 text-[#0866F5]">
                <MessageSquareText size={22} />
              </div>
              <p className="text-sm font-medium text-slate-500">
                Total reviews
              </p>
            </div>
            <p className="mt-4 text-3xl font-bold text-slate-900">
              {reviews.length}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex size-11 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                <Star size={22} className="fill-amber-400" />
              </div>
              <p className="text-sm font-medium text-slate-500">
                Average rating
              </p>
            </div>
            <div className="mt-4 flex items-center gap-2">
              <p className="text-3xl font-bold text-slate-900">
                {averageRating}
              </p>
              {reviews.length > 0 && (
                <span className="text-sm text-slate-500">out of 5</span>
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex size-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                <Send size={22} />
              </div>
              <p className="text-sm font-medium text-slate-500">
                Replies sent
              </p>
            </div>
            <p className="mt-4 text-3xl font-bold text-slate-900">
              {repliedCount}
              <span className="ml-2 text-base font-medium text-slate-400">
                / {reviews.length}
              </span>
            </p>
          </div>
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
                All reviews
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Reviews for cars belonging to your account.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="reviewSearch"
                  className="mb-1 block text-xs font-semibold text-slate-600"
                >
                  Search reviews
                </label>
                <input
                  id="reviewSearch"
                  type="search"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Comment, car, booking ID…"
                  className="min-h-11 w-full rounded-lg border border-slate-300 px-3 text-sm text-slate-900 outline-none focus:border-[#0866F5] focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div>
                <label
                  htmlFor="ratingFilter"
                  className="mb-1 block text-xs font-semibold text-slate-600"
                >
                  Filter by rating
                </label>
                <select
                  id="ratingFilter"
                  value={filter}
                  onChange={(event) => setFilter(event.target.value)}
                  className="min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none focus:border-[#0866F5] focus:ring-2 focus:ring-blue-100"
                >
                  <option value="all">All ratings</option>
                  <option value="5">5 stars</option>
                  <option value="4">4 stars</option>
                  <option value="3">3 stars</option>
                  <option value="2">2 stars</option>
                  <option value="1">1 star</option>
                </select>
              </div>
            </div>
          </div>

          {filteredReviews.length === 0 ? (
            <div className="mt-6 rounded-xl border border-dashed border-slate-300 bg-slate-50 px-5 py-14 text-center">
              <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-white text-slate-400 shadow-sm">
                <Star size={26} />
              </div>
              <h3 className="mt-4 text-lg font-bold text-slate-900">
                {reviews.length === 0
                  ? "No reviews yet"
                  : "No matching reviews"}
              </h3>
              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
                {reviews.length === 0
                  ? "When renters review completed bookings for your cars, their feedback will appear here."
                  : "Try changing the rating filter or search term."}
              </p>
            </div>
          ) : (
            <div className="mt-6 space-y-5">
              {filteredReviews.map((review) => {
                const car = carMap[String(review.carId)];

                return (
                  <article
                    key={review.id}
                    className="rounded-2xl border border-slate-200 p-5 sm:p-6"
                  >
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <RatingStars rating={review.rating} />
                        <p className="mt-3 text-sm leading-6 text-slate-700">
                          {review.comment || "No written comment provided."}
                        </p>
                        <p className="mt-3 text-xs text-slate-500">
                          Posted {formatReviewDate(review.createdAt)}
                        </p>
                      </div>

                      <div className="shrink-0 rounded-xl bg-slate-50 p-3 sm:max-w-64">
                        <div className="flex items-center gap-2">
                          <CarFront
                            size={18}
                            className="shrink-0 text-[#0866F5]"
                          />
                          <p className="text-sm font-semibold text-slate-800">
                            {car
                              ? `${car.year || ""} ${car.make || ""} ${car.model || ""}`.trim()
                              : "Car details unavailable"}
                          </p>
                        </div>
                        <p className="mt-2 break-all text-xs text-slate-500">
                          Booking: {review.bookingId}
                        </p>
                      </div>
                    </div>

                    <div className="mt-5 border-t border-slate-200 pt-5">
                      {review.ownerReply?.trim() && (
                        <div className="mb-4 rounded-xl border border-blue-100 bg-blue-50 p-4">
                          <p className="text-xs font-bold uppercase tracking-wide text-blue-800">
                            Your previous reply
                          </p>
                          <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700">
                            {review.ownerReply}
                          </p>
                        </div>
                      )}

                      <label
                        htmlFor={`reply-${review.id}`}
                        className="mb-2 block text-sm font-semibold text-slate-800"
                      >
                        {review.ownerReply?.trim()
                          ? "Edit your reply"
                          : "Reply to this review"}
                      </label>

                      <textarea
                        id={`reply-${review.id}`}
                        rows={3}
                        maxLength={1000}
                        value={replies[review.id] || ""}
                        onChange={(event) =>
                          setReplies((current) => ({
                            ...current,
                            [review.id]: event.target.value,
                          }))
                        }
                        placeholder="Thank the renter or respond professionally to their feedback…"
                        className="w-full resize-y rounded-xl border border-slate-300 px-4 py-3 text-sm leading-6 text-slate-900 outline-none placeholder:text-slate-400 focus:border-[#0866F5] focus:ring-2 focus:ring-blue-100"
                      />

                      <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <p className="text-xs text-slate-500">
                          {(replies[review.id] || "").length}/1000 characters
                        </p>

                        <button
                          type="button"
                          disabled={
                            savingId === review.id ||
                            !(replies[review.id] || "").trim()
                          }
                          onClick={() => handleSaveReply(review)}
                          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-[#0866F5] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#0754C7] disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <Send size={16} />
                          {savingId === review.id
                            ? "Saving…"
                            : review.ownerReply?.trim()
                              ? "Update reply"
                              : "Save reply"}
                        </button>
                      </div>
                    </div>
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
