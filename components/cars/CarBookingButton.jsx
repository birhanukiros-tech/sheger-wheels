
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";

export default function CarBookingButton({ car, carHref }) {
  const router = useRouter();
  const [user, setUser] = useState(undefined);

  const isUnavailable =
    car.available === false || car.isAvailable === false;

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setUser(getCurrentUser());
    }, 0);

    return () => {
      window.clearTimeout(timer);
    };
  }, []);

  function handleBooking() {
    if (isUnavailable) {
      window.alert("This car is currently unavailable.");
      return;
    }

    if (!user) {
      router.push(`/signin?next=${encodeURIComponent(carHref)}`);
      return;
    }

    if (user.role !== "renter") {
      window.alert("Please sign in with a renter account to book a car.");
      return;
    }

    router.push(`/checkout?carId=${encodeURIComponent(car.id)}`);
  }

  return (
    <button
      type="button"
      onClick={handleBooking}
      disabled={user === undefined || isUnavailable}
      className="flex min-h-12 w-full items-center justify-center rounded-lg bg-[#0866F5] px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#0754C7] disabled:cursor-not-allowed disabled:opacity-60"
    >
      {isUnavailable
        ? "Currently Unavailable"
        : user === undefined
          ? "Loading account..."
          : user?.role === "renter"
            ? "Book This Car"
            : user
              ? "Sign in as a Renter to Book"
              : "Sign in to Continue"}
    </button>
  );
}
