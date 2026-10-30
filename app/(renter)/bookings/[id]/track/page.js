
"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getBookingById } from "@/lib/bookings";
import { formatCurrency, formatDate } from "@/lib/format";
import cars from "@/data/cars.json";

const stages = [
  {
    status: "pending",
    title: "Request submitted",
    description: "Your rental request has been recorded.",
  },
  {
    status: "confirmed",
    title: "Booking confirmed",
    description: "The owner has approved your rental.",
  },
  {
    status: "active",
    title: "Rental in progress",
    description: "Your rental period is underway.",
  },
  {
    status: "completed",
    title: "Rental completed",
    description: "Your rental period has finished.",
  },
];

const statusStyles = {
  pending: "bg-amber-50 text-amber-800 ring-amber-200",
  confirmed: "bg-blue-50 text-blue-800 ring-blue-200",
  active: "bg-emerald-50 text-emerald-800 ring-emerald-200",
  completed: "bg-slate-100 text-slate-700 ring-slate-200",
  cancelled: "bg-red-50 text-red-700 ring-red-200",
  rejected: "bg-red-50 text-red-700 ring-red-200",
};

export default function TrackBookingPage() {
  const { id } = useParams();
  const router = useRouter();

  const [booking, setBooking] = useState(null);
  const [car, setCar] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const initializeTracking = () => {
      if (cancelled) return;

      const user = getCurrentUser();

      if (!user || user.role !== "renter") {
        router.replace(
          `/signin?next=${encodeURIComponent(`/bookings/${id}/track`)}`
        );
        return;
      }

      const currentBooking = getBookingById(String(id));

      if (!currentBooking || currentBooking.renterId !== user.id) {
        if (!cancelled) {
          setAuthChecked(true);
        }
        return;
      }

      const currentCar =
        cars.find(
          (item) => String(item.id) === String(currentBooking.carId)
        ) ?? null;

      if (cancelled) return;

      setBooking(currentBooking);
      setCar(currentCar);
      setAuthChecked(true);
    };

    Promise.resolve().then(initializeTracking);

    return () => {
      cancelled = true;
    };
  }, [id, router]);

  if (!authChecked) {
    return (
      <main className="mx-auto max-w-5xl px-4 py-16">
        <p className="text-center text-slate-500">
          Loading rental tracking…
        </p>
      </main>
    );
  }

  if (!booking) {
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

  const status = booking.status.toLowerCase();
  const currentStage = stages.findIndex(
    (stage) => stage.status === status
  );
  const isStopped = status === "cancelled" || status === "rejected";

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10 sm:px-6 sm:py-14">
      <div className="mx-auto max-w-5xl">
        <Link
          href={`/bookings/${encodeURIComponent(booking.id)}`}
          className="text-sm font-semibold text-[#0866F5] hover:underline"
        >
          ← Back to booking details
        </Link>

        <div className="mt-5">
          <p className="text-sm font-semibold uppercase tracking-wider text-[#0866F5]">
            Rental progress
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            Track your rental
          </h1>
          <p className="mt-2 text-slate-600">
            Follow the progress of your booking request and rental.
          </p>
        </div>

        <section className="mt-8 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-5 p-6 sm:flex-row sm:items-center sm:p-8">
            <div className="relative flex h-36 w-full shrink-0 items-center justify-center overflow-hidden rounded-xl bg-slate-100 sm:w-48">
              {car?.image ? (
                <Image
                  src={car.image}
                  alt={`${car.year} ${car.make} ${car.model}`}
                  fill
                  sizes="(max-width: 640px) 100vw, 192px"
                  className="object-cover"
                  unoptimized
                />
              ) : (
                <span className="text-sm text-slate-400">
                  Car image unavailable
                </span>
              )}
            </div>

            <div className="min-w-0 flex-1">
              <p className="text-sm text-slate-500">
                Your selected vehicle
              </p>
              <h2 className="mt-1 text-2xl font-bold text-slate-900">
                {car
                  ? `${car.year} ${car.make} ${car.model}`
                  : "Rental vehicle"}
              </h2>
              <p className="mt-2 break-all text-xs text-slate-400">
                Booking ID: {booking.id}
              </p>
              <span
                className={`mt-3 inline-flex rounded-full px-3 py-1 text-sm font-semibold capitalize ring-1 ${
                  statusStyles[status] || statusStyles.pending
                }`}
              >
                {status}
              </span>
            </div>

            <div className="sm:text-right">
              <p className="text-sm text-slate-500">Total rental cost</p>
              <p className="mt-1 text-2xl font-bold text-slate-900">
                {formatCurrency(booking.totalPrice)}
              </p>
            </div>
          </div>

          <div className="border-t border-slate-200 p-6 sm:p-8">
            <h3 className="text-lg font-bold text-slate-900">
              Booking timeline
            </h3>

            {isStopped ? (
              <div className="mt-5 rounded-xl border border-red-200 bg-red-50 p-5">
                <h4 className="font-bold capitalize text-red-800">
                  Booking {status}
                </h4>
                <p className="mt-1 text-sm leading-6 text-red-700">
                  {status === "cancelled"
                    ? "This booking has been cancelled and will not progress further."
                    : "The owner declined this booking request. Contact the owner or choose another car."}
                </p>
              </div>
            ) : (
              <ol className="mt-6 space-y-6">
                {stages.map((stage, index) => {
                  const isReached = currentStage >= index;
                  const isCurrent = currentStage === index;

                  return (
                    <li key={stage.status} className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <span
                          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                            isReached
                              ? "bg-[#0866F5] text-white"
                              : "border-2 border-slate-200 bg-white text-slate-400"
                          }`}
                        >
                          {isReached ? "✓" : index + 1}
                        </span>
                        {index < stages.length - 1 && (
                          <span
                            className={`mt-2 min-h-8 w-0.5 flex-1 ${
                              currentStage > index
                                ? "bg-[#0866F5]"
                                : "bg-slate-200"
                            }`}
                          />
                        )}
                      </div>

                      <div className="pb-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <h4
                            className={`font-bold ${
                              isReached
                                ? "text-slate-900"
                                : "text-slate-400"
                            }`}
                          >
                            {stage.title}
                          </h4>
                          {isCurrent && (
                            <span className="rounded-full bg-blue-50 px-2 py-1 text-xs font-semibold text-[#0866F5]">
                              Current stage
                            </span>
                          )}
                        </div>
                        <p className="mt-1 text-sm leading-6 text-slate-500">
                          {stage.description}
                        </p>
                      </div>
                    </li>
                  );
                })}
              </ol>
            )}

            <div className="mt-8 grid gap-4 rounded-xl bg-slate-50 p-5 sm:grid-cols-3">
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
                <p className="text-sm text-slate-500">Rental duration</p>
                <p className="mt-1 font-semibold text-slate-900">
                  {booking.totalDays}{" "}
                  {booking.totalDays === 1 ? "day" : "days"}
                </p>
              </div>
            </div>
          </div>
        </section>

        <p className="mt-5 text-sm leading-6 text-slate-500">
          This is a frontend demo. The timeline reflects the booking status
          saved in your browser; it does not provide live GPS tracking.
        </p>
      </div>
    </main>
  );
}
