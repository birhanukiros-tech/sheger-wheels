
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import cars from "@/data/cars.json";
import { createCarSlug } from "@/lib/car-slug";
import CarDetails from "@/components/cars/CarDetails";

const STORAGE_KEY = "sheggar-wheels-cars";

function getAvailableCars() {
  try {
    const savedCars = JSON.parse(
      window.localStorage.getItem(STORAGE_KEY) || "[]",
    );

    const ownerCars = Array.isArray(savedCars) ? savedCars : [];
    const combinedCars = [...ownerCars, ...cars];
    const uniqueCars = new Map();

    combinedCars.forEach((car) => {
      if (car?.id) {
        if (
          !uniqueCars.has(car.id) ||
          String(car.id).startsWith("owner-car-")
        ) {
          uniqueCars.set(car.id, car);
        }
      }
    });

    return Array.from(uniqueCars.values()).filter(
      (car) => car.available !== false && car.isAvailable !== false,
    );
  } catch {
    return cars.filter(
      (car) => car.available !== false && car.isAvailable !== false,
    );
  }
}

export default function OwnerCarDetails({ slug, requestedCarId }) {
  const [allCars, setAllCars] = useState([]);
  const [carsLoaded, setCarsLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;

    function refreshCars() {
      if (!cancelled) {
        setAllCars(getAvailableCars());
        setCarsLoaded(true);
      }
    }

    const timer = window.setTimeout(() => {
      refreshCars();
      window.addEventListener("focus", refreshCars);
      window.addEventListener("storage", refreshCars);
    }, 0);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
      window.removeEventListener("focus", refreshCars);
      window.removeEventListener("storage", refreshCars);
    };
  }, []);

  const car = allCars.find(
    (item) =>
      String(item.id) === String(requestedCarId) &&
      createCarSlug(item) === slug,
  );

  const otherCars = car
    ? allCars.filter((item) => item.id !== car.id).slice(0, 3)
    : [];

  if (!carsLoaded) {
    return (
      <section className="min-h-screen bg-[#F4F7FB] px-5 py-20">
        <p className="text-center text-[#667085]">
          Loading car details...
        </p>
      </section>
    );
  }

  if (!car) {
    return (
      <section className="min-h-screen bg-[#F4F7FB] px-5 py-20">
        <div className="mx-auto max-w-xl rounded-2xl border border-[#E5EAF1] bg-white p-8 text-center">
          <h1 className="text-xl font-bold text-[#252A34]">
            Car not found
          </h1>

          <p className="mt-3 text-sm leading-6 text-[#667085]">
            This vehicle may have been removed or is no longer available.
          </p>

          <Link
            href="/cars"
            className="mt-6 inline-flex min-h-11 items-center justify-center rounded-lg bg-[#0866F5] px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#0754C7]"
          >
            Back to Browse Cars
          </Link>
        </div>
      </section>
    );
  }

  return <CarDetails car={car} otherCars={otherCars} />;
}
