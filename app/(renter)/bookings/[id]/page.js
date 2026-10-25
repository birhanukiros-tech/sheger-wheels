"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getBookingById } from "@/lib/bookings";
import { formatCurrency, formatDate } from "@/lib/format";
import cars from "@/data/cars.json";

const statusStyles = {
  pending: "bg-amber-50 text-amber-800 ring-amber-200",
  confirmed: "bg-blue-50 text-blue-800 ring-blue-200",
  active: "bg-emerald-50 text-emerald-800 ring-emerald-200",
  completed: "bg-slate-100 text-slate-700 ring-slate-200",
  cancelled: "bg-red-50 text-red-700 ring-red-200",
  rejected: "bg-red-50 text-red-700 ring-red-200",
};

const statusDescriptions = {
  pending: "Your request has been submitted and is waiting for the owner's response.",
  confirmed: "Your booking has been accepted. Review your rental details before pickup.",
  active: "Your rental is in progress. You can open the tracking page for rental information.",
  completed: "This rental is complete. You can leave a review if you haven't already.",
  cancelled: "This booking has been cancelled.",
  rejected: "The owner has declined this booking request.",
};

export default function BookingDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const bookingId = params.id;

  const [booking, setBooking] = useState(null);
  const [car, setCar] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    const user = getCurrentUser();

    if (!user || user.role !== "renter") {
      router.replace(
        `/signin?next=${encodeURIComponent(`/bookings/${bookingId}`)}`
      );
      return;
    }

    const currentBooking = getBookingById(String(bookingId));

    if (!currentBooking || currentBooking.renterId !== user.id) {
      setAuthChecked(true);
      return;
    }

    setBooking(currentBooking);
    setCar(
      cars.find((item) => String(item.id) === String(currentBooking.carId)) ?? null
    );
    setAuthChecked(true);
  }, [bookingId, router]);

  if (!authChecked) {
    return (
      <main className="mx-auto max-w-5xl px-4 py-16">
        <p className="text-center text-slate-500">Loading booking details…</p>
      </main>
    );
  }

  if (!booking) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-16">
        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center">
          <h1 className="text-2xl font-bold text-slate-900">Booking not found</h1>
          <p className="mt-3 text-slate-600">
            This booking may not exist or may not belong to your account.
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

  const status = booking.status.toLowerCase();

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10 sm:px-6 sm:py-14">
      <div className="mx-auto max-w-5xl">
        <Link
          href="/bookings"
          className="text-sm font-semibold text-[#0866F5] hover:underline"
        >
          ← Back to my bookings
        </Link>

        <div className="mt-5 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wider text-[#0866F5]">
              Rental details
            </p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
              Your booking
            </h1>
            <p className="mt-2 break-all text-sm text-slate-500">
              Booking ID: {booking.id}
            </p>
          </div>

          <span
            className={`inline-flex w-fit rounded-full px-4 py-2 text-sm font-semibold capitalize ring-1 ${
              statusStyles[status] || statusStyles.pending
            }`}
          >
            {status}
          </span>
        </div>

        <section className="mt-8 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="grid md:grid-cols-[0.9fr_1.1fr]">
            <div className="flex min-h-64 items-center justify-center bg-slate-100">
              {car?.image ? (
                <img
                  src={car.image}
                  alt={`${car.year} ${car.make} ${car.model}`}
                  className="h-full max-h-80 w-full object-cover"
                />
              ) : (
                <p className="text-sm text-slate-400">Car image unavailable</p>
              )}
            </div>

            <div className="p-6 sm:p-8">
              <p className="text-sm font-semibold text-[#0866F5]">
                Selected vehicle
              </p>
              <h2 className="mt-2 text-2xl font-bold text-slate-900">
                {car
                  ? `${car.year} ${car.make} ${car.model}`
                  : "Rental vehicle"}
              </h2>

              <p className="mt-3 leading-7 text-slate-600">
                {statusDescriptions[status] || "Review the details of your rental booking."}
              </p>

              <div className="mt-6 grid grid-cols-2 gap-5 border-t border-slate-200 pt-5">
                <div>
                  <p className="text-sm text-slate-500">Pickup date</p>
                  <p className="mt-1 font-semibold text-slate-900">
                    {formatDate(booking.startDate)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Return date</p>
                  <p className="mt-1 font-semibold text-slate-900">
                    {formatDate(booking.endDate)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Duration</p>
                  <p className="mt-1 font-semibold text-slate-900">
                    {booking.totalDays} {booking.totalDays === 1 ? "day" : "days"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Price per day</p>
                  <p className="mt-1 font-semibold text-slate-900">
                    {formatCurrency(booking.dailyPrice)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-slate-200 bg-slate-50 p-6 sm:p-8">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-slate-500">Total rental cost</p>
                <p className="mt-1 text-3xl font-bold text-slate-900">
                  {formatCurrency(booking.totalPrice)}
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                {status === "confirmed" && (
                  <Link
                    href={`/bookings/${encodeURIComponent(booking.id)}/track`}
                    className="inline-flex min-h-11 items-center justify-center rounded-lg bg-[#0866F5] px-5 py-3 text-sm font-semibold text-white hover:bg-[#0754C7]"
                  >
                    Track rental
                  </Link>
                )}

                {status === "active" && (
                  <Link
                    href={`/bookings/${encodeURIComponent(booking.id)}/track`}
                    className="inline-flex min-h-11 items-center justify-center rounded-lg bg-[#0866F5] px-5 py-3 text-sm font-semibold text-white hover:bg-[#0754C7]"
                  >
                    Track rental
                  </Link>
                )}

                {status === "completed" && (
                  <Link
                    href={`/bookings/${encodeURIComponent(booking.id)}/review`}
                    className="inline-flex min-h-11 items-center justify-center rounded-lg bg-[#0866F5] px-5 py-3 text-sm font-semibold text-white hover:bg-[#0754C7]"
                  >
                    Leave a review
                  </Link>
                )}

                <Link
                  href="/bookings"
                  className="inline-flex min-h-11 items-center justify-center rounded-lg border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-100"
                >
                  All bookings
                </Link>
              </div>
            </div>
          </div>
        </section>

        <p className="mt-5 text-sm leading-6 text-slate-500">
          Booking requests begin with pending status. The owner must approve a request before it becomes confirmed.
        </p>
      </div>
    </main>
  );
}