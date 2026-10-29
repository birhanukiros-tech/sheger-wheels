"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  CalendarDays,
  CarFront,
  CircleDollarSign,
  Clock,
  Mail,
  MapPin,
  UserRound,
} from "lucide-react";

import { getCurrentUser } from "@/lib/auth";
import { getBookingById } from "@/lib/bookings";
import { readStoredData, STORAGE_KEYS } from "@/lib/storage";
import carsData from "@/data/cars.json";

function formatCurrency(value) {
  return `ETB ${Number(value || 0).toLocaleString("en-US")}`;
}

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

export default function AdminBookingDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const bookingId = decodeURIComponent(String(params.id || ""));

  const [booking, setBooking] = useState(null);
  const [car, setCar] = useState(null);
  const [renter, setRenter] = useState(null);
  const [owner, setOwner] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    const currentUser = getCurrentUser();

    if (!currentUser || currentUser.role !== "admin") {
      router.replace(
        `/signin?role=admin&next=${encodeURIComponent(
          `/admin/bookings/${bookingId}`
        )}`
      );
      return;
    }

    const savedBooking = getBookingById(bookingId);

    if (!savedBooking) {
      setNotFound(true);
      setLoading(false);
      return;
    }

    const users = readStoredData(STORAGE_KEYS.users, []);
    const savedCars = readStoredData("sheggar-wheels-cars", []);

    const allCars = [
      ...(Array.isArray(carsData) ? carsData : []),
      ...(Array.isArray(savedCars) ? savedCars : []),
    ];

    const selectedCar = allCars.find(
      (item) =>
        String(item.id) === String(savedBooking.carId) ||
        String(item.slug) === String(savedBooking.carId)
    );

    const selectedRenter = users.find(
      (user) =>
        String(user.id) === String(savedBooking.renterId) ||
        String(user.id) === String(savedBooking.userId)
    );

    const selectedOwner = users.find(
      (user) => String(user.id) === String(savedBooking.ownerId)
    );

    setBooking(savedBooking);
    setCar(selectedCar || null);
    setRenter(selectedRenter || null);
    setOwner(selectedOwner || null);
    setLoading(false);
  }, [bookingId, router]);

  if (loading) {
    return (
      <main className="min-h-screen bg-[#F4F7FB] p-6">
        <div className="mx-auto max-w-5xl rounded-xl bg-white p-8 text-slate-600 shadow-sm">
          Loading booking details…
        </div>
      </main>
    );
  }

  if (notFound) {
    return (
      <main className="min-h-screen bg-[#F4F7FB] p-6">
        <div className="mx-auto max-w-3xl rounded-xl bg-white p-8 shadow-sm">
          <h1 className="text-xl font-bold text-slate-900">
            Booking not found
          </h1>
          <p className="mt-2 text-slate-600">
            This booking may have been removed or its ID may be invalid.
          </p>
          <Link
            href="/admin/bookings"
            className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-lg bg-[#0866F5] px-4 py-2 font-semibold text-white hover:bg-[#0754C7]"
          >
            <ArrowLeft size={17} />
            Back to bookings
          </Link>
        </div>
      </main>
    );
  }

  const startDate = booking.startDate || booking.pickupDate || booking.from;
  const endDate = booking.endDate || booking.returnDate || booking.to;

  const renterName =
    renter?.name ||
    renter?.fullName ||
    booking.contact?.fullName ||
    booking.renterName ||
    "Not provided";

  const renterEmail =
    renter?.email ||
    booking.contact?.email ||
    booking.renterEmail ||
    "Not provided";

  const ownerName =
    owner?.name ||
    owner?.fullName ||
    booking.ownerName ||
    "Not provided";

  const vehicleName = car
    ? `${car.year || ""} ${car.make || ""} ${car.model || car.name || ""}`
        .trim()
        .replace(/\s+/g, " ")
    : booking.carName || booking.vehicleName || "Vehicle details unavailable";

  const totalAmount =
    booking.totalPrice ?? booking.totalAmount ?? booking.total ?? 0;

  const paymentStatus =
    booking.paymentStatus || booking.payment?.status || "Not provided";

  const paymentMethod =
    booking.paymentMethod || booking.payment?.method || "Not provided";

  return (
    <main className="min-h-screen bg-[#F4F7FB] px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <Link
          href="/admin/bookings"
          className="mb-6 inline-flex min-h-10 items-center gap-2 rounded-lg text-sm font-semibold text-[#0866F5] hover:text-[#0754C7]"
        >
          <ArrowLeft size={17} />
          Back to all bookings
        </Link>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8">
          <div className="flex flex-col justify-between gap-4 border-b border-slate-100 pb-6 sm:flex-row sm:items-start">
            <div>
              <p className="text-sm font-medium text-slate-500">
                Booking reference
              </p>
              <h1 className="mt-1 break-all text-2xl font-bold text-slate-900">
                {booking.id}
              </h1>
              <p className="mt-2 text-sm text-slate-500">
                Read-only booking details for administrators
              </p>
            </div>

            <span className="inline-flex w-fit rounded-full bg-blue-50 px-3 py-1.5 text-sm font-semibold text-[#0866F5]">
              {formatLabel(booking.status)}
            </span>
          </div>

          <div className="mt-6 grid gap-5 md:grid-cols-2">
            <section className="rounded-xl border border-slate-200 p-5">
              <div className="mb-3 flex items-center gap-2">
                <CarFront className="text-[#0866F5]" size={21} />
                <h2 className="text-lg font-bold text-slate-900">Vehicle</h2>
              </div>
              <Detail label="Vehicle" value={vehicleName} />
              <Detail
                label="Vehicle ID"
                value={booking.carId || car?.id}
              />
              <Detail
                label="Location"
                value={car?.location || booking.location}
              />
              <Detail
                label="Daily price"
                value={formatCurrency(
                  booking.dailyPrice ?? car?.dailyPrice ?? car?.pricePerDay
                )}
              />
            </section>

            <section className="rounded-xl border border-slate-200 p-5">
              <div className="mb-3 flex items-center gap-2">
                <CalendarDays className="text-[#0866F5]" size={21} />
                <h2 className="text-lg font-bold text-slate-900">Schedule</h2>
              </div>
              <Detail label="Pickup date" value={formatDate(startDate)} />
              <Detail label="Return date" value={formatDate(endDate)} />
              <Detail
                label="Booking created"
                value={formatDate(booking.createdAt)}
              />
              <Detail
                label="Last updated"
                value={formatDate(booking.updatedAt)}
              />
            </section>

            <section className="rounded-xl border border-slate-200 p-5">
              <div className="mb-3 flex items-center gap-2">
                <UserRound className="text-[#0866F5]" size={21} />
                <h2 className="text-lg font-bold text-slate-900">Renter</h2>
              </div>
              <Detail label="Name" value={renterName} />
              <Detail label="Email" value={renterEmail} />
              <Detail
                label="Renter ID"
                value={booking.renterId || booking.userId || renter?.id}
              />
              {renterEmail !== "Not provided" && (
                <a
                  href={`mailto:${renterEmail}`}
                  className="mt-4 inline-flex min-h-10 items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-[#0866F5] hover:bg-blue-50"
                >
                  <Mail size={16} />
                  Email renter
                </a>
              )}
            </section>

            <section className="rounded-xl border border-slate-200 p-5">
              <div className="mb-3 flex items-center gap-2">
                <MapPin className="text-[#0866F5]" size={21} />
                <h2 className="text-lg font-bold text-slate-900">Owner</h2>
              </div>
              <Detail label="Name" value={ownerName} />
              <Detail
                label="Email"
                value={owner?.email || booking.ownerEmail}
              />
              <Detail label="Owner ID" value={booking.ownerId || owner?.id} />
            </section>

            <section className="rounded-xl border border-slate-200 p-5 md:col-span-2">
              <div className="mb-3 flex items-center gap-2">
                <CircleDollarSign className="text-[#0866F5]" size={21} />
                <h2 className="text-lg font-bold text-slate-900">
                  Payment summary
                </h2>
              </div>

              <div className="grid gap-x-8 sm:grid-cols-2">
                <Detail label="Total amount" value={formatCurrency(totalAmount)} />
                <Detail label="Payment method" value={formatLabel(paymentMethod)} />
                <Detail label="Payment status" value={formatLabel(paymentStatus)} />
                <Detail
                  label="Payment reference"
                  value={booking.paymentReference || booking.payment?.reference}
                />
              </div>

              <div className="mt-4 flex items-center gap-2 rounded-lg bg-slate-50 p-3 text-sm text-slate-600">
                <Clock size={17} />
                This page is read-only. Booking status and payment data are not
                changed here.
              </div>
            </section>
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/admin/bookings"
              className="inline-flex min-h-11 items-center justify-center rounded-lg bg-[#0866F5] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#0754C7]"
            >
              Back to bookings
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
