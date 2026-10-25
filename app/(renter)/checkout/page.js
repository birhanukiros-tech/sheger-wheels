
"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import cars from "@/data/cars.json";
import { getCurrentUser } from "@/lib/auth";
import { createBooking } from "@/lib/bookings";
import { formatCurrency } from "@/lib/format";

function getLocalDateString() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

const inputClass =
  "min-h-12 w-full rounded-lg border border-slate-300 bg-white px-3 text-slate-900 outline-none transition focus:border-[#0866F5] focus:ring-2 focus:ring-blue-100";

const labelClass = "mb-2 block text-sm font-semibold text-slate-700";

const paymentMethods = [
  {
    value: "demo_card",
    title: "Demo card payment",
    description: "Simulate a card payment. No real card details needed.",
  },
  {
    value: "demo_telebirr",
    title: "Telebirr (Demo)",
    description: "Simulate a Telebirr payment.",
  },
  {
    value: "pay_at_pickup",
    title: "Pay at pickup",
    description: "Record your booking request without simulated payment.",
  },
];

export default function CheckoutPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const carId = searchParams.get("carId");

  const [user, setUser] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [idType, setIdType] = useState("national_id");
  const [idNumber, setIdNumber] = useState("");

  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("demo_card");

  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const car = useMemo(
    () => cars.find((item) => String(item.id) === String(carId)),
    [carId]
  );

  useEffect(() => {
    const currentUser = getCurrentUser();

    if (!currentUser || currentUser.role !== "renter") {
      router.replace(
        `/signin?next=${encodeURIComponent(
          `/checkout?carId=${carId ?? ""}`
        )}`
      );
      return;
    }

    setUser(currentUser);
    setFullName(currentUser.name ?? "");
    setEmail(currentUser.email ?? "");
    setAuthChecked(true);
  }, [carId, router]);

  const rentalDays = useMemo(() => {
    if (!startDate || !endDate) return 0;

    const start = new Date(`${startDate}T00:00:00`);
    const end = new Date(`${endDate}T00:00:00`);

    const difference = Math.round(
      (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)
    );

    return difference > 0 ? difference : 0;
  }, [startDate, endDate]);

  const dailyPrice = Number(car?.dailyPrice ?? 0);
  const totalPrice = dailyPrice * rentalDays;

  function handleSubmit(event) {
    event.preventDefault();
    setError("");

    if (isSubmitting) return;

    if (!user || user.role !== "renter") {
      router.replace(
        `/signin?next=${encodeURIComponent(
          `/checkout?carId=${carId ?? ""}`
        )}`
      );
      return;
    }

    if (!car) {
      setError("We couldn't find this car. Please select another listing.");
      return;
    }

    if (!Number.isFinite(dailyPrice) || dailyPrice <= 0) {
      setError("The rental price for this car is unavailable.");
      return;
    }

    if (!startDate || !endDate || rentalDays < 1) {
      setError("Please select valid pickup and return dates.");
      return;
    }

    if (startDate < getLocalDateString()) {
      setError("The pickup date cannot be in the past.");
      return;
    }

    const cleanName = fullName.trim();
    const cleanEmail = email.trim().toLowerCase();
    const cleanPhone = phone.trim();
    const cleanIdNumber = idNumber.trim();

    if (cleanName.length < 2) {
      setError("Please enter your full name.");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      setError("Please enter a valid email address.");
      return;
    }

    if (cleanPhone.length < 7 || cleanPhone.length > 20) {
      setError("Please enter a valid phone number.");
      return;
    }

    if (cleanIdNumber.length < 3 || cleanIdNumber.length > 50) {
      setError("Please enter a valid ID number.");
      return;
    }

    if (!car.ownerId) {
      setError("The car's owner information is missing. Please try another car.");
      return;
    }

    const now = new Date().toISOString();
    const bookingId = `booking-${crypto.randomUUID()}`;

    const booking = {
      id: bookingId,
      carId: String(car.id),
      renterId: String(user.id),
      ownerId: String(car.ownerId),

      startDate,
      endDate,
      dailyPrice,
      totalDays: rentalDays,
      totalPrice,

      contact: {
        fullName: cleanName,
        email: cleanEmail,
        phone: cleanPhone,
        idType,
        idNumber: cleanIdNumber,
      },

      paymentMethod,
      paymentStatus:
        paymentMethod === "pay_at_pickup" ? "pay_at_pickup" : "demo_paid",
      paymentReference:
        paymentMethod === "pay_at_pickup"
          ? ""
          : `DEMO-${crypto.randomUUID().slice(0, 8).toUpperCase()}`,
      paymentUpdatedAt: now,

      status: "pending",
      createdAt: now,
      updatedAt: now,
    };

    setIsSubmitting(true);

    const result = createBooking(booking);

    if (!result.success) {
      setError(result.error || "Unable to create your booking. Please try again.");
      setIsSubmitting(false);
      return;
    }

    router.push(`/bookings/${encodeURIComponent(bookingId)}`);
  }

  if (!authChecked) {
    return (
      <main className="mx-auto max-w-5xl px-4 py-16">
        <p className="text-center text-slate-500">Checking your account…</p>
      </main>
    );
  }

  if (!car) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-16">
        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center">
          <h1 className="text-2xl font-bold text-slate-900">
            {carId ? "Car not found" : "Choose a car first"}
          </h1>
          <p className="mt-3 text-slate-600">
            {carId
              ? "We couldn't find that car. Please choose another listing."
              : "Select a car from our listings before continuing to checkout."}
          </p>
          <Link
            href="/cars"
            className="mt-6 inline-flex rounded-lg bg-[#0866F5] px-5 py-3 font-semibold text-white hover:bg-[#0754C7]"
          >
            Browse cars
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10 sm:py-14">
      <div className="mx-auto max-w-6xl">
        <Link
          href="/cars"
          className="text-sm font-semibold text-[#0866F5] hover:underline"
        >
          ← Back to cars
        </Link>

        <div className="mt-5">
          <p className="text-sm font-semibold uppercase tracking-wider text-[#0866F5]">
            Secure your rental
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            Checkout
          </h1>
          <p className="mt-2 text-slate-600">
            Hi {user?.name}, enter your details and review your rental.
          </p>
        </div>

        <div className="mt-8 grid gap-8 lg:grid-cols-[1.15fr_0.85fr]">
          <form
            onSubmit={handleSubmit}
            className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8"
          >
            <h2 className="text-xl font-bold text-slate-900">
              Contact information
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              Provide accurate contact details for the car owner.
            </p>

            <div className="mt-6 grid gap-5 sm:grid-cols-2">
              <div>
                <label htmlFor="fullName" className={labelClass}>
                  Full name
                </label>
                <input
                  id="fullName"
                  type="text"
                  autoComplete="name"
                  value={fullName}
                  onChange={(event) => setFullName(event.target.value)}
                  required
                  maxLength={80}
                  className={inputClass}
                  placeholder="Your full name"
                />
              </div>

              <div>
                <label htmlFor="email" className={labelClass}>
                  Email address
                </label>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                  maxLength={254}
                  className={inputClass}
                  placeholder="you@example.com"
                />
              </div>

              <div className="sm:col-span-2">
                <label htmlFor="phone" className={labelClass}>
                  Phone number
                </label>
                <input
                  id="phone"
                  type="tel"
                  autoComplete="tel"
                  value={phone}
                  onChange={(event) => setPhone(event.target.value)}
                  required
                  minLength={7}
                  maxLength={20}
                  className={inputClass}
                  placeholder="+251 9XX XXX XXX"
                />
              </div>
            </div>

            <div className="mt-8 border-t border-slate-200 pt-7">
              <h2 className="text-xl font-bold text-slate-900">
                Identification details
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                Use test details only. This demo stores booking data in your
                browser and does not securely verify identities.
              </p>

              <div className="mt-5 grid gap-5 sm:grid-cols-2">
                <div>
                  <label htmlFor="idType" className={labelClass}>
                    ID type
                  </label>
                  <select
                    id="idType"
                    value={idType}
                    onChange={(event) => setIdType(event.target.value)}
                    required
                    className={inputClass}
                  >
                    <option value="national_id">National ID</option>
                    <option value="passport">Passport</option>
                    <option value="drivers_license">Driver's licence</option>
                    <option value="other">Other ID</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="idNumber" className={labelClass}>
                    ID number
                  </label>
                  <input
                    id="idNumber"
                    type="text"
                    autoComplete="off"
                    value={idNumber}
                    onChange={(event) => setIdNumber(event.target.value)}
                    required
                    minLength={3}
                    maxLength={50}
                    className={inputClass}
                    placeholder="Enter test ID number"
                  />
                </div>
              </div>
            </div>

            <div className="mt-8 border-t border-slate-200 pt-7">
              <h2 className="text-xl font-bold text-slate-900">
                Rental dates
              </h2>

              <div className="mt-5 grid gap-5 sm:grid-cols-2">
                <div>
                  <label htmlFor="startDate" className={labelClass}>
                    Pickup date
                  </label>
                  <input
                    id="startDate"
                    type="date"
                    min={getLocalDateString()}
                    value={startDate}
                    onChange={(event) => {
                      setStartDate(event.target.value);
                      if (endDate && event.target.value >= endDate) {
                        setEndDate("");
                      }
                    }}
                    required
                    className={inputClass}
                  />
                </div>

                <div>
                  <label htmlFor="endDate" className={labelClass}>
                    Return date
                  </label>
                  <input
                    id="endDate"
                    type="date"
                    min={startDate || getLocalDateString()}
                    value={endDate}
                    onChange={(event) => setEndDate(event.target.value)}
                    required
                    className={inputClass}
                  />
                </div>
              </div>
            </div>

            <div className="mt-8 border-t border-slate-200 pt-7">
              <h2 className="text-xl font-bold text-slate-900">
                Payment method
              </h2>
              <p className="mt-2 text-sm text-slate-500">
                Choose a simulated payment option. No real payment is processed.
              </p>

              <div className="mt-5 grid gap-3">
                {paymentMethods.map((method) => (
                  <label
                    key={method.value}
                    className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition ${
                      paymentMethod === method.value
                        ? "border-[#0866F5] bg-blue-50"
                        : "border-slate-200 hover:border-slate-400"
                    }`}
                  >
                    <input
                      type="radio"
                      name="paymentMethod"
                      value={method.value}
                      checked={paymentMethod === method.value}
                      onChange={() => setPaymentMethod(method.value)}
                      className="mt-1 accent-[#0866F5]"
                    />
                    <span>
                      <span className="block font-semibold text-slate-900">
                        {method.title}
                      </span>
                      <span className="mt-1 block text-sm text-slate-500">
                        {method.description}
                      </span>
                    </span>
                  </label>
                ))}
              </div>

              {paymentMethod !== "pay_at_pickup" && (
                <p className="mt-4 rounded-lg bg-amber-50 p-3 text-sm text-amber-800">
                  Demo payment only. No money is charged, and no real payment
                  provider is contacted.
                </p>
              )}
            </div>

            <div className="mt-6 rounded-xl bg-slate-50 p-4">
              <p className="text-sm text-slate-600">Rental duration</p>
              <p className="mt-1 text-lg font-bold text-slate-900">
                {rentalDays} {rentalDays === 1 ? "day" : "days"}
              </p>

              <div className="mt-3 flex items-center justify-between gap-4">
                <span className="text-sm text-slate-600">
                  Estimated total
                </span>
                <span className="text-lg font-bold text-[#0866F5]">
                  {formatCurrency(totalPrice)}
                </span>
              </div>
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
              disabled={isSubmitting}
              className="mt-6 min-h-12 w-full rounded-lg bg-[#0866F5] px-5 py-3 font-semibold text-white transition hover:bg-[#0754C7] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting
                ? "Processing booking…"
                : paymentMethod === "pay_at_pickup"
                  ? "Submit booking request →"
                  : "Simulate payment & book →"}
            </button>

            <p className="mt-3 text-xs leading-5 text-slate-500">
              Your booking remains pending until the owner approves it.
              This demo does not collect payments.
            </p>
          </form>

          <aside className="h-fit overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="relative h-56 bg-slate-100">
              {car.image ? (
                <Image
                  src={car.image}
                  alt={`${car.year} ${car.make} ${car.model}`}
                  fill
                  sizes="(max-width: 1024px) 100vw, 40vw"
                  className="object-cover"
                />
              ) : (
                <div className="flex h-full items-center justify-center text-slate-400">
                  Car image unavailable
                </div>
              )}
            </div>

            <div className="p-6">
              <p className="text-sm font-semibold text-[#0866F5]">
                Your selected car
              </p>
              <h2 className="mt-2 text-2xl font-bold text-slate-900">
                {car.year} {car.make} {car.model}
              </h2>
              <p className="mt-2 text-sm text-slate-500">{car.location}</p>

              <div className="mt-4 flex flex-wrap gap-2 text-sm text-slate-600">
                {car.transmission && (
                  <span className="rounded-full bg-slate-100 px-3 py-1">
                    {car.transmission}
                  </span>
                )}
                {car.fuelType && (
                  <span className="rounded-full bg-slate-100 px-3 py-1">
                    {car.fuelType}
                  </span>
                )}
                {car.seats && (
                  <span className="rounded-full bg-slate-100 px-3 py-1">
                    {car.seats} seats
                  </span>
                )}
              </div>

              <div className="mt-6 border-t border-slate-200 pt-5">
                <div className="flex items-center justify-between gap-4 text-sm text-slate-600">
                  <span>Daily rental price</span>
                  <span className="font-semibold text-slate-900">
                    {formatCurrency(dailyPrice)} / day
                  </span>
                </div>

                <div className="mt-3 flex items-center justify-between gap-4 text-sm text-slate-600">
                  <span>Rental duration</span>
                  <span className="font-semibold text-slate-900">
                    {rentalDays} days
                  </span>
                </div>

                <div className="mt-5 flex items-center justify-between gap-4 border-t border-slate-200 pt-5">
                  <span className="font-bold text-slate-900">
                    Estimated total
                  </span>
                  <span className="text-xl font-bold text-[#0866F5]">
                    {formatCurrency(totalPrice)}
                  </span>
                </div>
              </div>

              <p className="mt-4 text-xs leading-5 text-slate-500">
                This is a frontend demo. Your booking is not confirmed until
                the owner approves it.
              </p>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
