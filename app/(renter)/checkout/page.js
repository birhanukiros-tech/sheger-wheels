
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import dynamic from "next/dynamic";
import {
  ArrowLeft,
  CalendarDays,
  CarFront,
  CheckCircle2,
  CreditCard,
  MapPin,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import cars from "@/data/cars.json";
import { getCurrentUser } from "@/lib/auth";
import { createBooking } from "@/lib/bookings";
import { formatCurrency } from "@/lib/format";

const BookingLocationMap = dynamic(
  () => import("@/components/maps/BookingLocationMap"),
  {
    ssr: false,
    loading: () => (
      <div className="mt-7 flex h-[340px] items-center justify-center rounded-2xl border border-[#E5EAF1] bg-[#F4F7FB] text-sm text-[#667085]">
        Loading location map...
      </div>
    ),
  }
);

const defaultLocations = {
  pickup: [9.0222, 38.7468],
  dropoff: [9.0355, 38.7524],
};

function getLocalDateString() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

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

function getBlockedDatesForCar(carId) {
  try {
    const savedAvailability = JSON.parse(
      window.localStorage.getItem("sheggar-wheels-availability") || "{}"
    );

    const carAvailability = Array.isArray(savedAvailability)
      ? savedAvailability.find(
          (item) => String(item?.carId ?? item?.id) === String(carId)
        )
      : savedAvailability?.[String(carId)];

    if (Array.isArray(carAvailability)) {
      return carAvailability.map(String);
    }

    if (Array.isArray(carAvailability?.blockedDates)) {
      return carAvailability.blockedDates.map(String);
    }

    if (Array.isArray(carAvailability?.unavailableDates)) {
      return carAvailability.unavailableDates.map(String);
    }

    if (Array.isArray(carAvailability?.dates)) {
      return carAvailability.dates
        .filter((item) => item?.available === false || item?.blocked === true)
        .map((item) => String(item.date));
    }

    return [];
  } catch {
    return [];
  }
}

function getBlockedDateInRange(startDate, endDate, blockedDates) {
  if (!startDate || !endDate) return null;

  const blockedDateSet = new Set(blockedDates);
  const current = new Date(`${startDate}T00:00:00`);
  const end = new Date(`${endDate}T00:00:00`);

  while (current <= end) {
    const year = current.getFullYear();
    const month = String(current.getMonth() + 1).padStart(2, "0");
    const day = String(current.getDate()).padStart(2, "0");
    const dateString = `${year}-${month}-${day}`;

    if (blockedDateSet.has(dateString)) {
      return dateString;
    }

    current.setDate(current.getDate() + 1);
  }

  return null;
}

const inputClass =
  "min-h-12 w-full rounded-xl border border-[#E5EAF1] bg-white px-4 text-sm text-[#252A34] outline-none transition placeholder:text-[#98A2B3] focus:border-[#0866F5] focus:ring-2 focus:ring-blue-100";

const labelClass = "mb-2 block text-sm font-semibold text-[#344054]";

const sectionClass =
  "border-b border-[#E5EAF1] pb-7";

const sectionHeadingClass =
  "text-lg font-bold text-[#252A34]";

const sectionDescriptionClass =
  "mt-1.5 text-sm leading-6 text-[#667085]";

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

  const [allCars, setAllCars] = useState(cars);
  const [carsLoaded, setCarsLoaded] = useState(false);
  const [blockedDates, setBlockedDates] = useState([]);

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [idType, setIdType] = useState("national_id");
  const [idNumber, setIdNumber] = useState("");

  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("demo_card");

  const [locations, setLocations] = useState(defaultLocations);

  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleLocationsChange = useCallback((nextLocations) => {
    setLocations(nextLocations);
  }, []);

  const car = useMemo(
    () => allCars.find((item) => String(item.id) === String(carId)),
    [allCars, carId]
  );

  const isUnavailable =
    car?.available === false || car?.isAvailable === false;

  const blockedDateInRange = useMemo(
    () => getBlockedDateInRange(startDate, endDate, blockedDates),
    [startDate, endDate, blockedDates]
  );

  useEffect(() => {
    let cancelled = false;

    const timeoutId = window.setTimeout(() => {
      const currentUser = getCurrentUser();

      if (!currentUser || currentUser.role !== "renter") {
        router.replace(
          `/signin?next=${encodeURIComponent(
            `/checkout?carId=${carId ?? ""}`
          )}`
        );
        return;
      }

      if (cancelled) return;

      setUser(currentUser);
      setFullName(currentUser.name ?? "");
      setEmail(currentUser.email ?? "");
      setAuthChecked(true);
    }, 0);

    return () => {
      cancelled = true;
      window.clearTimeout(timeoutId);
    };
  }, [carId, router]);

  useEffect(() => {
    let cancelled = false;
    let cleanupListeners = () => {};

    const timeoutId = window.setTimeout(() => {
      if (cancelled) return;

      setAllCars(getAllCars());
      setBlockedDates(getBlockedDatesForCar(carId));
      setCarsLoaded(true);

      function refreshCars() {
        if (cancelled) return;

        setAllCars(getAllCars());
        setBlockedDates(getBlockedDatesForCar(carId));
      }

      function refreshAvailability() {
        if (cancelled) return;

        setAllCars(getAllCars());
        setBlockedDates(getBlockedDatesForCar(carId));
      }

      window.addEventListener("focus", refreshCars);
      window.addEventListener("storage", refreshCars);
      window.addEventListener("availabilityUpdated", refreshAvailability);

      cleanupListeners = () => {
        window.removeEventListener("focus", refreshCars);
        window.removeEventListener("storage", refreshCars);
        window.removeEventListener(
          "availabilityUpdated",
          refreshAvailability
        );
      };
    }, 0);

    return () => {
      cancelled = true;
      window.clearTimeout(timeoutId);
      cleanupListeners();
    };
  }, [carId]);

  const rentalDays = useMemo(() => {
    if (!startDate || !endDate) return 0;

    const start = new Date(`${startDate}T00:00:00`);
    const end = new Date(`${endDate}T00:00:00`);

    const difference = Math.round(
      (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)
    );

    return difference > 0 ? difference : 0;
  }, [startDate, endDate]);

  const dailyPrice = Number(car?.dailyPrice ?? car?.pricePerDay ?? 0);
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

    if (isUnavailable) {
      setError(
        "This car is currently unavailable. Please choose another listing."
      );
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

    const latestBlockedDates = getBlockedDatesForCar(car.id);
    const conflictingDate = getBlockedDateInRange(
      startDate,
      endDate,
      latestBlockedDates
    );

    if (conflictingDate) {
      setError(
        `This car is unavailable on ${conflictingDate}. Please choose different rental dates.`
      );
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
      setError(
        "The car's owner information is missing. Please try another car."
      );
      return;
    }

    if (!globalThis.crypto?.randomUUID) {
      setError(
        "Your browser cannot create a booking ID. Please try another browser."
      );
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

      pickupLocation: {
        latitude: locations.pickup[0],
        longitude: locations.pickup[1],
      },
      dropoffLocation: {
        latitude: locations.dropoff[0],
        longitude: locations.dropoff[1],
      },

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
      setError(
        result.error || "Unable to create your booking. Please try again."
      );
      setIsSubmitting(false);
      return;
    }

    router.push(`/bookings/${encodeURIComponent(bookingId)}`);
  }

  if (!authChecked || !carsLoaded) {
    return (
      <main className="mx-auto max-w-5xl px-4 py-12">
        <p className="text-center text-sm text-[#667085]">
          Checking your account and car...
        </p>
      </main>
    );
  }

  if (!car) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-12">
        <div className="rounded-2xl border border-[#E5EAF1] bg-white p-8 text-center">
          <h1 className="text-2xl font-bold text-[#252A34]">
            {carId ? "Car not found" : "Choose a car first"}
          </h1>

          <p className="mt-3 text-sm leading-6 text-[#667085]">
            {carId
              ? "We couldn't find that car. Please choose another listing."
              : "Select a car from our listings before continuing to checkout."}
          </p>

          <Link
            href="/cars"
            className="mt-6 inline-flex min-h-11 items-center justify-center rounded-lg bg-[#0866F5] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#0754C7]"
          >
            Browse cars
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#F4F7FB] px-4 pb-12 pt-5 sm:pt-7">
      <div className="mx-auto max-w-6xl">
        <Link
          href="/cars"
          className="inline-flex items-center gap-2 text-sm font-semibold text-[#0866F5] transition hover:text-[#0754C7]"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to cars
        </Link>

        <div className="mt-4">
          <p className="text-xs font-bold uppercase tracking-wider text-[#0866F5]">
            Secure your rental
          </p>

          <h1 className="mt-1 text-3xl font-bold tracking-tight text-[#252A34] sm:text-4xl">
            Checkout
          </h1>

          <p className="mt-2 text-sm leading-6 text-[#667085]">
            Hi {user?.name}, complete your details and review your rental.
          </p>
        </div>

        {isUnavailable && (
          <div
            role="status"
            className="mt-5 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
          >
            <CarFront className="mt-0.5 h-5 w-5 shrink-0" />
            <div>
              <p className="font-semibold">This car is currently unavailable.</p>
              <p className="mt-1">
                Please choose another listing to continue.
              </p>
            </div>
          </div>
        )}

        <div className="mt-6 grid items-start gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <form
            onSubmit={handleSubmit}
            className="min-w-0 rounded-2xl border border-[#E5EAF1] bg-white p-5 shadow-sm sm:p-7"
          >
            <div className={sectionClass}>
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-[#0866F5]">
                  <UserRound className="h-5 w-5" />
                </span>
                <div>
                  <h2 className={sectionHeadingClass}>
                    Contact information
                  </h2>
                  <p className="text-xs text-[#667085]">
                    How the car owner can contact you.
                  </p>
                </div>
              </div>

              <div className="mt-5 grid gap-4 sm:grid-cols-2">
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
            </div>

            <div className={`${sectionClass} pt-7`}>
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-[#0866F5]">
                  <ShieldCheck className="h-5 w-5" />
                </span>
                <div>
                  <h2 className={sectionHeadingClass}>
                    Identification details
                  </h2>
                  <p className="text-xs text-[#667085]">
                    Demo identification information.
                  </p>
                </div>
              </div>

              <p className="mt-4 rounded-lg bg-[#F4F7FB] p-3 text-xs leading-5 text-[#667085]">
                Use test details only. This demo stores booking data in your
                browser and does not securely verify identities.
              </p>

              <div className="mt-4 grid gap-4 sm:grid-cols-2">
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
                    <option value="drivers_license">Driver&apos;s licence</option>
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

            <div className={`${sectionClass} pt-7`}>
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-[#0866F5]">
                  <CalendarDays className="h-5 w-5" />
                </span>
                <div>
                  <h2 className={sectionHeadingClass}>Rental dates</h2>
                  <p className="text-xs text-[#667085]">
                    Select your pickup and return dates.
                  </p>
                </div>
              </div>

              <div className="mt-5 grid gap-4 sm:grid-cols-2">
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
                      setError("");
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
                    onChange={(event) => {
                      setEndDate(event.target.value);
                      setError("");
                    }}
                    required
                    className={inputClass}
                  />
                </div>
              </div>

              {blockedDateInRange && (
                <p
                  role="status"
                  className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm leading-5 text-amber-800"
                >
                  This date range includes a date the owner has blocked (
                  {blockedDateInRange}). Please select different dates.
                </p>
              )}
            </div>

            <BookingLocationMap onLocationsChange={handleLocationsChange} />

            <div className="pt-7">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-[#0866F5]">
                  <CreditCard className="h-5 w-5" />
                </span>
                <div>
                  <h2 className={sectionHeadingClass}>Payment method</h2>
                  <p className="text-xs text-[#667085]">
                    Select how you want to record this demo booking.
                  </p>
                </div>
              </div>

              <p className="mt-4 text-xs leading-5 text-[#667085]">
                Choose a simulated payment option. No real payment is processed.
              </p>

              <div className="mt-4 grid gap-3">
                {paymentMethods.map((method) => (
                  <label
                    key={method.value}
                    className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition ${
                      paymentMethod === method.value
                        ? "border-[#0866F5] bg-blue-50"
                        : "border-[#E5EAF1] hover:border-[#98A2B3]"
                    }`}
                  >
                    <input
                      type="radio"
                      name="paymentMethod"
                      value={method.value}
                      checked={paymentMethod === method.value}
                      onChange={() => setPaymentMethod(method.value)}
                      className="mt-1 h-4 w-4 accent-[#0866F5]"
                    />

                    <span className="min-w-0">
                      <span className="block text-sm font-semibold text-[#252A34]">
                        {method.title}
                      </span>
                      <span className="mt-1 block text-xs leading-5 text-[#667085]">
                        {method.description}
                      </span>
                    </span>

                    {paymentMethod === method.value && (
                      <CheckCircle2 className="ml-auto h-5 w-5 shrink-0 text-[#0866F5]" />
                    )}
                  </label>
                ))}
              </div>

              {paymentMethod !== "pay_at_pickup" && (
                <p className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs leading-5 text-amber-800">
                  Demo payment only. No money is charged, and no real payment
                  provider is contacted.
                </p>
              )}
            </div>

            <div className="mt-7 rounded-xl border border-[#E5EAF1] bg-[#F4F7FB] p-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-[#252A34]">
                    Rental duration
                  </p>
                  <p className="mt-1 text-xs text-[#667085]">
                    {rentalDays} {rentalDays === 1 ? "day" : "days"}
                  </p>
                </div>

                <div className="text-right">
                  <p className="text-xs text-[#667085]">Estimated total</p>
                  <p className="mt-1 text-xl font-bold text-[#0866F5]">
                    {formatCurrency(totalPrice)}
                  </p>
                </div>
              </div>
            </div>

            {error && (
              <p
                role="alert"
                className="mt-5 rounded-lg border border-red-200 bg-red-50 p-3 text-sm leading-5 text-red-700"
              >
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={
                isSubmitting || isUnavailable || Boolean(blockedDateInRange)
              }
              className="mt-5 flex min-h-12 w-full items-center justify-center rounded-xl bg-[#0866F5] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#0754C7] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isUnavailable
                ? "Car Currently Unavailable"
                : blockedDateInRange
                  ? "Choose Available Dates"
                  : isSubmitting
                    ? "Processing booking..."
                    : paymentMethod === "pay_at_pickup"
                      ? "Submit booking request →"
                      : "Simulate payment & book →"}
            </button>

            <p className="mt-3 text-center text-xs leading-5 text-[#667085]">
              Your booking remains pending until the owner approves it.
              This demo does not collect payments.
            </p>
          </form>

          <aside className="h-fit overflow-hidden rounded-2xl border border-[#E5EAF1] bg-white shadow-sm lg:sticky lg:top-24">
            <div className="relative h-52 shrink-0 overflow-hidden bg-[#F4F7FB]">
              {car.image ? (
                <Image
                  src={car.image}
                  alt={`${car.year} ${car.make} ${car.model}`}
                  fill
                  sizes="(max-width: 1024px) 100vw, 40vw"
                  className="object-cover object-top"
                />
              ) : (
                <div className="flex h-full items-center justify-center text-sm text-[#98A2B3]">
                  Car image unavailable
                </div>
              )}
            </div>

            <div className="p-5 sm:p-6">
              <p className="text-xs font-medium text-[#667085]">
                {car.year} · {car.location}
              </p>

              <h2 className="mt-2 text-xl font-bold text-[#252A34]">
                {car.make} {car.model}
              </h2>

              <p className="mt-2 text-sm leading-6 text-[#667085]">
                {car.description}
              </p>

              <div className="mt-4 flex min-h-8 flex-wrap gap-2 text-xs text-[#667085]">
                {car.seats && (
                  <span className="rounded-md bg-[#F4F7FB] px-2.5 py-1.5">
                    {car.seats} seats
                  </span>
                )}

                {car.transmission && (
                  <span className="rounded-md bg-[#F4F7FB] px-2.5 py-1.5">
                    {car.transmission}
                  </span>
                )}

                {car.fuelType && (
                  <span className="rounded-md bg-[#F4F7FB] px-2.5 py-1.5">
                    {car.fuelType}
                  </span>
                )}
              </div>

              <div className="mt-5 flex items-baseline gap-1">
                <span className="text-xl font-bold text-[#0866F5]">
                  {formatCurrency(dailyPrice)}
                </span>
                <span className="text-sm text-[#667085]">/ day</span>
              </div>

              {isUnavailable && (
                <p className="mt-4 rounded-lg bg-red-50 p-3 text-xs font-medium text-red-700">
                  This car is currently unavailable.
                </p>
              )}

              <div className="mt-5 border-t border-[#E5EAF1] pt-5">
                <h3 className="text-sm font-bold text-[#252A34]">
                  Booking summary
                </h3>

                <div className="mt-4 flex items-center justify-between gap-4 text-sm">
                  <span className="text-[#667085]">Daily price</span>
                  <span className="font-semibold text-[#252A34]">
                    {formatCurrency(dailyPrice)}
                  </span>
                </div>

                <div className="mt-3 flex items-center justify-between gap-4 text-sm">
                  <span className="text-[#667085]">Rental duration</span>
                  <span className="font-semibold text-[#252A34]">
                    {rentalDays} {rentalDays === 1 ? "day" : "days"}
                  </span>
                </div>

                <div className="mt-4 flex items-center justify-between gap-4 border-t border-[#E5EAF1] pt-4">
                  <span className="text-sm font-bold text-[#252A34]">
                    Estimated total
                  </span>
                  <span className="text-xl font-bold text-[#0866F5]">
                    {formatCurrency(totalPrice)}
                  </span>
                </div>
              </div>

              <div className="mt-5 flex items-start gap-2 rounded-lg bg-[#F4F7FB] p-3">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[#0866F5]" />
                <p className="text-xs leading-5 text-[#667085]">
                  Your selected pickup and drop-off locations will be included
                  in your booking request.
                </p>
              </div>

              <p className="mt-4 text-xs leading-5 text-[#98A2B3]">
                Frontend demo. Your booking is not confirmed until the owner
                approves it.
              </p>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
