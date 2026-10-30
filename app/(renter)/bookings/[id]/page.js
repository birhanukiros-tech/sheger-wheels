
"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getBookingsByRenter } from "@/lib/bookings";
import { formatCurrency, formatDate } from "@/lib/format";
import cars from "@/data/cars.json";

const statusStyles = {
  pending: "bg-amber-50 text-amber-700 ring-amber-200",
  confirmed: "bg-blue-50 text-blue-700 ring-blue-200",
  active: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  completed: "bg-slate-100 text-slate-700 ring-slate-200",
  cancelled: "bg-red-50 text-red-700 ring-red-200",
  rejected: "bg-red-50 text-red-700 ring-red-200",
};

function getAllCars() {
  try {
    const savedCars = JSON.parse(
      window.localStorage.getItem("sheggar-wheels-cars") || "[]"
    );

    const carMap = new Map();

    cars.forEach((car) => {
      carMap.set(String(car.id), car);
    });

    savedCars.forEach((car) => {
      if (car?.id) {
        carMap.set(String(car.id), car);
      }
    });

    return Array.from(carMap.values());
  } catch {
    return cars;
  }
}

function DetailRow({ label, value }) {
  return (
    <div className="flex flex-col gap-1 border-b border-slate-100 py-4 last:border-b-0 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
      <span className="text-sm text-slate-500">{label}</span>
      <span className="break-words text-sm font-semibold text-slate-800 sm:text-right">
        {value ?? "—"}
      </span>
    </div>
  );
}

export default function BookingDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const bookingId = Array.isArray(params.id) ? params.id[0] : params.id;

  const [booking, setBooking] = useState(null);
  const [user, setUser] = useState(null);
  const [allCars, setAllCars] = useState(cars);
  const [authChecked, setAuthChecked] = useState(false);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const loadCars = () => {
      if (!cancelled) {
        setAllCars(getAllCars());
      }
    };

    Promise.resolve().then(loadCars);

    window.addEventListener("focus", loadCars);
    window.addEventListener("storage", loadCars);

    return () => {
      cancelled = true;
      window.removeEventListener("focus", loadCars);
      window.removeEventListener("storage", loadCars);
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    const initializeBooking = () => {
      if (cancelled) return;

      const currentUser = getCurrentUser();

      if (!currentUser || currentUser.role !== "renter") {
        router.replace(
          `/signin?next=${encodeURIComponent(`/bookings/${bookingId}`)}`
        );
        return;
      }

      const renterBookings = getBookingsByRenter(currentUser.id) || [];
      const currentBooking = renterBookings.find(
        (item) => String(item.id) === String(bookingId)
      );

      if (cancelled) return;

      setUser(currentUser);

      if (!currentBooking) {
        setNotFound(true);
      } else {
        setBooking(currentBooking);
      }

      setAuthChecked(true);
    };

    Promise.resolve().then(initializeBooking);

    return () => {
      cancelled = true;
    };
  }, [bookingId, router]);

  if (!authChecked) {
    return (
      <main className="min-h-[60vh] px-4 py-16">
        <p className="text-center text-slate-500">
          Loading booking details…
        </p>
      </main>
    );
  }

  if (notFound || !booking) {
    return (
      <main className="min-h-[60vh] bg-slate-50 px-4 py-16">
        <div className="mx-auto max-w-xl rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <div className="text-4xl" aria-hidden="true">
            🚗
          </div>
          <h1 className="mt-4 text-2xl font-bold text-slate-900">
            Booking not found
          </h1>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            We couldn’t find this booking in your rental history. Check the
            booking link or return to your bookings.
          </p>
          <Link
            href="/bookings"
            className="mt-6 inline-flex min-h-11 items-center justify-center rounded-lg bg-[#0866F5] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#0754C7]"
          >
            Back to my bookings
          </Link>
        </div>
      </main>
    );
  }

  const car = allCars.find(
    (item) => String(item.id) === String(booking.carId)
  );

  const status = String(booking.status || "pending").toLowerCase();
  const canTrack = ["confirmed", "active"].includes(status);
  const canReview = status === "completed";

  const duration =
    Number(booking.totalDays) ||
    (booking.startDate && booking.endDate
      ? Math.max(
          1,
          Math.ceil(
            (new Date(`${booking.endDate}T00:00:00`) -
              new Date(`${booking.startDate}T00:00:00`)) /
              (1000 * 60 * 60 * 24)
          )
        )
      : null);

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6 sm:py-12">
      <div className="mx-auto max-w-5xl">
        <Link
          href="/bookings"
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 transition hover:text-[#0866F5]"
        >
          <span aria-hidden="true">←</span> Back to my bookings
        </Link>

        <header className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wider text-[#0866F5]">
              Renter dashboard
            </p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
              Booking details
            </h1>
            <p className="mt-2 text-sm text-slate-600">
              Review your rental information and booking status.
            </p>
          </div>

          <span
            className={`inline-flex w-fit items-center rounded-full px-4 py-2 text-sm font-semibold capitalize ring-1 ${
              statusStyles[status] || statusStyles.pending
            }`}
          >
            {status}
          </span>
        </header>

        <div className="mt-8 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
          <div className="space-y-6">
            <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="relative h-56 bg-slate-100 sm:h-72">
                {car?.image ? (
                  <Image
                    src={car.image}
                    alt={`${car.year} ${car.make} ${car.model}`}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 60vw, 700px"
                    className="object-cover"
                    unoptimized
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-5xl">
                    🚗
                  </div>
                )}
              </div>

              <div className="p-5 sm:p-7">
                <p className="text-sm font-medium text-slate-500">
                  Your rental vehicle
                </p>
                <h2 className="mt-2 text-2xl font-bold text-slate-900">
                  {car
                    ? `${car.year} ${car.make} ${car.model}`
                    : "Rental vehicle"}
                </h2>

                {car && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {car.color && (
                      <span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-600">
                        {car.color}
                      </span>
                    )}
                    {car.transmission && (
                      <span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-medium capitalize text-slate-600">
                        {car.transmission}
                      </span>
                    )}
                    {car.seats && (
                      <span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-600">
                        {car.seats} seats
                      </span>
                    )}
                  </div>
                )}

                {car?.location && (
                  <p className="mt-4 text-sm text-slate-600">
                    Pickup location: {car.location}
                  </p>
                )}
              </div>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
              <h2 className="text-lg font-bold text-slate-900">
                Rental schedule
              </h2>

              <div className="mt-3">
                <DetailRow
                  label="Pickup date"
                  value={formatDate(booking.startDate)}
                />
                <DetailRow
                  label="Return date"
                  value={formatDate(booking.endDate)}
                />
                <DetailRow
                  label="Rental duration"
                  value={
                    duration
                      ? `${duration} ${duration === 1 ? "day" : "days"}`
                      : "Not available"
                  }
                />
              </div>
            </section>
          </div>

          <aside className="space-y-6">
            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
              <h2 className="text-lg font-bold text-slate-900">
                Booking summary
              </h2>

              <div className="mt-3">
                <DetailRow label="Booking ID" value={booking.id} />
                <DetailRow
                  label="Booking date"
                  value={formatDate(booking.createdAt)}
                />
                <DetailRow
                  label="Daily rate"
                  value={
                    booking.dailyPrice != null
                      ? formatCurrency(booking.dailyPrice)
                      : car?.dailyPrice != null
                        ? formatCurrency(car.dailyPrice)
                        : "Not available"
                  }
                />
                <DetailRow
                  label="Total rental cost"
                  value={formatCurrency(booking.totalPrice)}
                />
              </div>

              <div className="mt-5 rounded-xl bg-blue-50 p-4">
                <p className="text-sm text-slate-600">Total booking amount</p>
                <p className="mt-1 text-2xl font-bold text-[#0866F5]">
                  {formatCurrency(booking.totalPrice)}
                </p>
                <p className="mt-2 text-xs leading-5 text-slate-500">
                  This summary reflects the booking information saved in this
                  demo.
                </p>
              </div>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
              <h2 className="text-lg font-bold text-slate-900">
                Payment information
              </h2>

              <div className="mt-3">
                <DetailRow
                  label="Payment method"
                  value={
                    booking.paymentMethod
                      ? String(booking.paymentMethod)
                          .replace("demo_", "")
                          .replaceAll("_", " ")
                      : "Not recorded"
                  }
                />
                <DetailRow
                  label="Payment status"
                  value={booking.paymentStatus || "Not recorded"}
                />
                {booking.paymentReference && (
                  <DetailRow
                    label="Payment reference"
                    value={booking.paymentReference}
                  />
                )}
              </div>

              <p className="mt-4 rounded-lg bg-slate-50 p-3 text-xs leading-5 text-slate-500">
                Sheggar Wheels is running as a frontend demo. Payment details
                shown here are saved demo data; no real payment is processed.
              </p>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
              <h2 className="text-lg font-bold text-slate-900">
                Next steps
              </h2>
              <div className="mt-4 space-y-3">
                {canTrack && (
                  <Link
                    href={`/bookings/${encodeURIComponent(booking.id)}/track`}
                    className="flex min-h-11 w-full items-center justify-center rounded-lg bg-[#0866F5] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#0754C7]"
                  >
                    Track booking →
                  </Link>
                )}

                {canReview && (
                  <Link
                    href={`/bookings/${encodeURIComponent(booking.id)}/review`}
                    className="flex min-h-11 w-full items-center justify-center rounded-lg bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700"
                  >
                    Write a review →
                  </Link>
                )}

                <Link
                  href="/bookings"
                  className="flex min-h-11 w-full items-center justify-center rounded-lg border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-[#0866F5] hover:text-[#0866F5]"
                >
                  View all bookings
                </Link>
              </div>
            </section>
          </aside>
        </div>

        <p className="mt-6 text-center text-xs leading-5 text-slate-500">
          Signed in as {user?.name || "Renter"}. Your booking details are
          available only to the renter who owns this booking.
        </p>
      </div>
    </main>
  );
}
