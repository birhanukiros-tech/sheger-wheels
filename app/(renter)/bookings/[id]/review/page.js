"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import { MessageSquareText, Star } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { getBookingById } from "@/lib/bookings";
import { formatDate } from "@/lib/format";
import {
  STORAGE_KEYS,
  readStoredData,
  writeStoredData,
} from "@/lib/storage";
import cars from "@/data/cars.json";

const ratingLabels = {
  1: "Poor",
  2: "Fair",
  3: "Good",
  4: "Very good",
  5: "Excellent",
};

function getAllCars() {
  const storedCars = readStoredData("sheggar-wheels-cars", []);
  const allCars = Array.isArray(cars) ? [...cars] : [];

  if (Array.isArray(storedCars)) {
    storedCars.forEach((storedCar) => {
      const index = allCars.findIndex(
        (car) => String(car.id) === String(storedCar.id)
      );

      if (index === -1) {
        allCars.push(storedCar);
      } else {
        allCars[index] = { ...allCars[index], ...storedCar };
      }
    });
  }

  return allCars;
}

export default function ReviewBookingPage() {
  const { id } = useParams();
  const router = useRouter();

  const [user, setUser] = useState(null);
  const [booking, setBooking] = useState(null);
  const [car, setCar] = useState(null);
  const [existingReview, setExistingReview] = useState(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    let timeoutId;
    let cancelled = false;

    const initializeReview = () => {
      if (cancelled) return;

      const currentUser = getCurrentUser();

      if (!currentUser || currentUser.role !== "renter") {
        router.replace(
          `/signin?next=${encodeURIComponent(`/bookings/${id}/review`)}`
        );
        return;
      }

      const currentBooking = getBookingById(String(id));

      if (
        !currentBooking ||
        String(currentBooking.renterId) !== String(currentUser.id)
      ) {
        setAuthChecked(true);
        return;
      }

      const allCars = getAllCars();
      const matchedCar =
        allCars.find(
          (item) => String(item.id) === String(currentBooking.carId)
        ) ?? null;

      const reviews = readStoredData(STORAGE_KEYS.reviews, []);
      const savedReview = Array.isArray(reviews)
        ? reviews.find(
            (review) =>
              String(review.bookingId) === String(currentBooking.id) &&
              String(review.renterId) === String(currentUser.id)
          ) ?? null
        : null;

      setUser(currentUser);
      setBooking(currentBooking);
      setCar(matchedCar);
      setExistingReview(savedReview);
      setAuthChecked(true);
    };

    timeoutId = window.setTimeout(initializeReview, 0);

    return () => {
      cancelled = true;
      window.clearTimeout(timeoutId);
    };
  }, [id, router]);

  function handleSubmit(event) {
    event.preventDefault();
    setError("");

    if (!user || !booking) {
      setError("We couldn't verify your booking. Please try again.");
      return;
    }

    if (booking.status !== "completed") {
      setError("You can review a rental after it has been completed.");
      return;
    }

    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      setError("Please choose a rating from 1 to 5 stars.");
      return;
    }

    const cleanComment = comment.trim();

    if (cleanComment.length < 10) {
      setError("Please write at least 10 characters about your experience.");
      return;
    }

    if (cleanComment.length > 1000) {
      setError("Your review must be 1,000 characters or fewer.");
      return;
    }

    const existingReviews = readStoredData(STORAGE_KEYS.reviews, []);

    if (!Array.isArray(existingReviews)) {
      setError("Unable to load reviews. Please refresh and try again.");
      return;
    }

    const alreadyReviewed = existingReviews.some(
      (review) =>
        String(review.bookingId) === String(booking.id) &&
        String(review.renterId) === String(user.id)
    );

    if (alreadyReviewed) {
      const savedReview =
        existingReviews.find(
          (review) =>
            String(review.bookingId) === String(booking.id) &&
            String(review.renterId) === String(user.id)
        ) ?? null;

      setExistingReview(savedReview);
      setError("You've already submitted a review for this booking.");
      return;
    }

    const now = new Date().toISOString();

    const newReview = {
      id: `review-${crypto.randomUUID()}`,
      bookingId: booking.id,
      carId: booking.carId,
      renterId: user.id,
      renterName: user.name,
      ownerId: booking.ownerId,
      rating,
      comment: cleanComment,
      createdAt: now,
      updatedAt: now,
    };

    const saved = writeStoredData(STORAGE_KEYS.reviews, [
      ...existingReviews,
      newReview,
    ]);

    if (!saved) {
      setError("Unable to save your review. Please try again.");
      return;
    }

    setExistingReview(newReview);
    setSuccess(true);
  }

  if (!authChecked) {
    return (
      <main className="mx-auto max-w-4xl px-4 py-16">
        <p className="text-center text-slate-500">
          Loading review form…
        </p>
      </main>
    );
  }

  if (!booking || !user) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-16">
        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center">
          <h1 className="text-2xl font-bold text-slate-900">
            Booking not found
          </h1>
          <p className="mt-3 text-slate-600">
            We couldn&apos;t find this booking under your account.
          </p>
          <Link
            href="/bookings"
            className="mt-6 inline-flex rounded-lg bg-[#0866F5] px-5 py-3 font-semibold text-white hover:bg-[#0754C7]"
          >
            Back to my bookings
          </Link>
        </div>
      </main>
    );
  }

  if (booking.status !== "completed") {
    return (
      <main className="mx-auto max-w-3xl px-4 py-16">
        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50 text-2xl text-amber-700">
            ★
          </span>
          <h1 className="mt-4 text-2xl font-bold text-slate-900">
            Review after your rental
          </h1>
          <p className="mt-3 leading-6 text-slate-600">
            You can submit a review once this booking is marked as completed.
          </p>
          <Link
            href={`/bookings/${encodeURIComponent(booking.id)}`}
            className="mt-6 inline-flex rounded-lg bg-[#0866F5] px-5 py-3 font-semibold text-white hover:bg-[#0754C7]"
          >
            View booking
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10 sm:px-6 sm:py-14">
      <div className="mx-auto max-w-4xl">
        <Link
          href={`/bookings/${encodeURIComponent(booking.id)}`}
          className="text-sm font-semibold text-[#0866F5] hover:underline"
        >
          ← Back to booking
        </Link>

        <div className="mt-5">
          <p className="text-sm font-semibold uppercase tracking-wider text-[#0866F5]">
            Share your experience
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            Review your rental
          </h1>
          <p className="mt-2 text-slate-600">
            Your honest feedback helps improve the Sheggar Wheels community.
          </p>
        </div>

        <section className="mt-8 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-5 p-6 sm:flex-row sm:items-center sm:p-8">
            <div className="relative h-36 w-full overflow-hidden rounded-xl bg-slate-100 sm:w-48 sm:shrink-0">
              {car?.image ? (
                <Image
                  src={car.image}
                  alt={`${car.year ?? ""} ${car.make ?? ""} ${car.model ?? "Rental car"}`.trim()}
                  fill
                  sizes="(max-width: 640px) 100vw, 192px"
                  className="object-cover"
                  unoptimized
                />
              ) : (
                <div className="flex h-full items-center justify-center">
                  <span className="text-sm text-slate-400">
                    Car image unavailable
                  </span>
                </div>
              )}
            </div>

            <div>
              <p className="text-sm text-slate-500">Completed rental</p>
              <h2 className="mt-1 text-xl font-bold text-slate-900">
                {car
                  ? `${car.year ?? ""} ${car.make ?? ""} ${car.model ?? ""}`.trim()
                  : "Rental vehicle"}
              </h2>
              <p className="mt-2 text-sm text-slate-600">
                {formatDate(booking.startDate)} – {formatDate(booking.endDate)}
              </p>
            </div>
          </div>

          {existingReview && (
            <div className="border-t border-slate-200 bg-slate-50 p-6 sm:p-8">
              <div className="flex items-center gap-2">
                <Star className="h-5 w-5 fill-amber-400 text-amber-400" />
                <h2 className="text-lg font-bold text-slate-900">
                  Your submitted review
                </h2>
              </div>

              <div className="mt-3 flex items-center gap-1 text-amber-500">
                {Array.from({ length: 5 }, (_, index) => (
                  <Star
                    key={index}
                    className={`h-4 w-4 ${
                      index < existingReview.rating
                        ? "fill-amber-400 text-amber-400"
                        : "text-slate-300"
                    }`}
                  />
                ))}
                <span className="ml-2 text-sm font-medium text-slate-600">
                  {ratingLabels[existingReview.rating] ?? "Rated"}
                </span>
              </div>

              <p className="mt-3 whitespace-pre-wrap leading-6 text-slate-700">
                {existingReview.comment}
              </p>

              {existingReview.ownerReply?.trim() ? (
                <div className="mt-5 rounded-xl border border-blue-200 bg-white p-4">
                  <div className="flex items-center gap-2 text-[#0866F5]">
                    <MessageSquareText className="h-5 w-5" />
                    <h3 className="font-bold">Reply from the car owner</h3>
                  </div>
                  <p className="mt-2 whitespace-pre-wrap leading-6 text-slate-700">
                    {existingReview.ownerReply}
                  </p>
                  {existingReview.updatedAt && (
                    <p className="mt-2 text-xs text-slate-500">
                      Last updated: {formatDate(existingReview.updatedAt)}
                    </p>
                  )}
                </div>
              ) : (
                <p className="mt-4 rounded-lg border border-slate-200 bg-white p-3 text-sm text-slate-600">
                  The owner hasn&apos;t replied to your review yet. You can
                  return here later to check for a response.
                </p>
              )}
            </div>
          )}

          {!existingReview && (
            <form
              onSubmit={handleSubmit}
              className="border-t border-slate-200 p-6 sm:p-8"
            >
              <fieldset>
                <legend className="text-base font-bold text-slate-900">
                  How was your experience?
                </legend>
                <p className="mt-1 text-sm text-slate-500">
                  Choose a rating from 1 to 5 stars.
                </p>

                <div className="mt-4 flex flex-wrap items-center gap-2">
                  {[1, 2, 3, 4, 5].map((value) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setRating(value)}
                      aria-label={`${value} star${value > 1 ? "s" : ""}: ${ratingLabels[value]}`}
                      aria-pressed={rating === value}
                      className={`rounded-lg border px-3 py-2 text-2xl transition ${
                        value <= rating
                          ? "border-amber-300 bg-amber-50 text-amber-500"
                          : "border-slate-200 bg-white text-slate-300 hover:bg-slate-50"
                      }`}
                    >
                      ★
                    </button>
                  ))}
                  <span className="ml-1 text-sm font-semibold text-slate-700">
                    {ratingLabels[rating]}
                  </span>
                </div>
              </fieldset>

              <div className="mt-7">
                <label
                  htmlFor="comment"
                  className="block text-sm font-semibold text-slate-700"
                >
                  Your review
                </label>
                <textarea
                  id="comment"
                  value={comment}
                  onChange={(event) => setComment(event.target.value)}
                  minLength={10}
                  maxLength={1000}
                  rows={5}
                  required
                  placeholder="What did you like about the car and rental experience?"
                  className="mt-2 w-full rounded-lg border border-slate-300 px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#0866F5] focus:ring-2 focus:ring-blue-100"
                />
                <p className="mt-2 text-right text-xs text-slate-500">
                  {comment.length}/1000 characters
                </p>
              </div>

              {error && (
                <p
                  role="alert"
                  className="mt-5 rounded-lg bg-red-50 p-3 text-sm text-red-700"
                >
                  {error}
                </p>
              )}

              <button
                type="submit"
                className="mt-5 min-h-12 w-full rounded-lg bg-[#0866F5] px-5 py-3 font-semibold text-white transition hover:bg-[#0754C7]"
              >
                Submit review →
              </button>
              <p className="mt-3 text-xs leading-5 text-slate-500">
                Your review is saved in this browser for this frontend demo.
              </p>
            </form>
          )}
        </section>

        {success && (
          <div
            role="status"
            className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 p-5"
          >
            <h2 className="font-bold text-emerald-900">
              Thank you for your review!
            </h2>
            <p className="mt-1 text-sm leading-6 text-emerald-800">
              Your feedback has been saved. The owner can now read and reply
              to your review.
            </p>
            <p className="mt-3 text-sm text-emerald-800">
              Return to this page later to see the owner&apos;s reply.
            </p>
            <Link
              href="/bookings"
              className="mt-4 inline-flex min-h-10 items-center rounded-lg bg-[#0866F5] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0754C7]"
            >
              My bookings
            </Link>
          </div>
        )}
      </div>
    </main>
  );
}
