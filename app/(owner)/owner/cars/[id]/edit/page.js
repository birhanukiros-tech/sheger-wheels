
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import carsData from "@/data/cars.json";

const STORAGE_KEY = "sheggar-wheels-cars";

const emptyForm = {
  make: "",
  model: "",
  year: "",
  color: "",
  transmission: "automatic",
  seats: "5",
  dailyPrice: "",
  location: "",
  image: "",
  description: "",
};

function getCarName(car) {
  return [car.year, car.make, car.model].filter(Boolean).join(" ") || "Vehicle";
}

function readStoredCars() {
  const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  return Array.isArray(stored) ? stored : [];
}

function ownsCar(car, owner) {
  return (
    String(car.ownerId ?? "") === String(owner.id ?? "") ||
    (Boolean(car.ownerEmail) &&
      String(car.ownerEmail).toLowerCase() ===
        String(owner.email || "").toLowerCase())
  );
}

export default function EditCarPage() {
  const params = useParams();
  const router = useRouter();
  const carId = Array.isArray(params.id) ? params.id[0] : params.id;

  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [carName, setCarName] = useState("Vehicle");

  useEffect(() => {
    let cancelled = false;

    Promise.resolve().then(() => {
      if (cancelled) return;

      const owner = getCurrentUser();

      if (!owner || owner.role !== "owner") {
        router.replace(
          `/signin?next=${encodeURIComponent(`/owner/cars/${carId}/edit`)}`
        );
        return;
      }

      try {
        const storedCars = readStoredCars();
        const storedCar = storedCars.find(
          (item) => String(item.id) === String(carId)
        );

        const demoCar = carsData.find(
          (item) => String(item.id) === String(carId)
        );

        // Prefer saved edits, otherwise use the original demo car.
        const car = storedCar || demoCar;

        if (!car || !ownsCar(car, owner)) {
          setError("We couldn't find this vehicle in your owner listings.");
          setLoading(false);
          return;
        }

        setCarName(getCarName(car));
        setForm({
          make: car.make || "",
          model: car.model || "",
          year: String(car.year || ""),
          color: car.color || "",
          transmission: car.transmission || "automatic",
          seats: String(car.seats || 5),
          dailyPrice: String(car.dailyPrice ?? car.pricePerDay ?? ""),
          location: car.location || "",
          image: car.image || "",
          description: car.description || "",
        });
      } catch {
        setError("We couldn't read your saved vehicle details.");
      }

      setLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [carId, router]);

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  function handleSubmit(event) {
    event.preventDefault();
    setError("");

    const owner = getCurrentUser();

    if (!owner || owner.role !== "owner") {
      setError("Please sign in with your owner account.");
      return;
    }

    const year = Number(form.year);
    const seats = Number(form.seats);
    const dailyPrice = Number(form.dailyPrice);
    const currentYear = new Date().getFullYear();

    if (!form.make.trim() || !form.model.trim() || !form.location.trim()) {
      setError("Please complete the make, model, and pickup location.");
      return;
    }

    if (!Number.isInteger(year) || year < 1900 || year > currentYear + 1) {
      setError(`Enter a model year between 1900 and ${currentYear + 1}.`);
      return;
    }

    if (!Number.isInteger(seats) || seats < 1 || seats > 100) {
      setError("Enter a valid number of seats.");
      return;
    }

    if (!Number.isFinite(dailyPrice) || dailyPrice <= 0) {
      setError("The daily rental price must be greater than zero.");
      return;
    }

    if (form.image.trim()) {
      try {
        const imageUrl = new URL(form.image.trim());

        if (!["http:", "https:"].includes(imageUrl.protocol)) {
          throw new Error("Invalid image URL");
        }
      } catch {
        if (!form.image.trim().startsWith("/")) {
          setError("Enter a valid image URL or a local path starting with /.");
          return;
        }
      }
    }

    setSaving(true);

    try {
      const storedCars = readStoredCars();
      const storedIndex = storedCars.findIndex(
        (item) => String(item.id) === String(carId)
      );

      const storedCar =
        storedIndex !== -1 ? storedCars[storedIndex] : null;

      const demoCar = carsData.find(
        (item) => String(item.id) === String(carId)
      );

      // A saved car takes precedence over its original demo version.
      const existingCar = storedCar || demoCar;

      if (!existingCar || !ownsCar(existingCar, owner)) {
        throw new Error("You cannot edit this vehicle");
      }

      const updatedCar = {
        ...existingCar,
        make: form.make.trim(),
        model: form.model.trim(),
        year,
        color: form.color.trim(),
        transmission: form.transmission,
        seats,
        dailyPrice,
        location: form.location.trim(),
        image: form.image.trim(),
        description: form.description.trim(),
        updatedAt: new Date().toISOString(),
      };

      if (storedIndex !== -1) {
        storedCars[storedIndex] = updatedCar;
      } else {
        storedCars.push(updatedCar);
      }

      localStorage.setItem(STORAGE_KEY, JSON.stringify(storedCars));

      router.push("/owner/cars");
      router.refresh();
    } catch {
      setError("We couldn't save your changes. Please try again.");
      setSaving(false);
    }
  }

  const inputClass =
    "mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100";

  if (loading) {
    return (
      <main className="flex min-h-[50vh] items-center justify-center px-4">
        <p className="text-sm text-slate-500">Loading vehicle details...</p>
      </main>
    );
  }

  if (error && !form.make && !form.model) {
    return (
      <main className="min-h-[60vh] bg-slate-50 px-4 py-12">
        <div className="mx-auto max-w-xl rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <h1 className="text-2xl font-bold text-slate-900">
            Vehicle unavailable
          </h1>
          <p className="mt-3 text-sm leading-6 text-slate-600">{error}</p>
          <Link
            href="/owner/cars"
            className="mt-6 inline-flex min-h-11 items-center justify-center rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700"
          >
            Back to My Cars
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6 sm:py-12">
      <div className="mx-auto max-w-3xl">
        <Link
          href="/owner/cars"
          className="text-sm font-semibold text-slate-600 hover:text-blue-600"
        >
          ← Back to My Cars
        </Link>

        <header className="mt-6">
          <p className="text-sm font-semibold uppercase tracking-wider text-blue-600">
            Owner workspace
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            Edit vehicle
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            Update the details for {carName}.
          </p>
        </header>

        <form
          onSubmit={handleSubmit}
          className="mt-8 space-y-7 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8"
        >
          <section>
            <h2 className="text-lg font-bold text-slate-900">
              Vehicle information
            </h2>

            <div className="mt-5 grid gap-5 sm:grid-cols-2">
              <div>
                <label htmlFor="make" className="text-sm font-semibold text-slate-700">Make *</label>
                <input id="make" name="make" value={form.make} onChange={handleChange} className={inputClass} required maxLength={60} />
              </div>

              <div>
                <label htmlFor="model" className="text-sm font-semibold text-slate-700">Model *</label>
                <input id="model" name="model" value={form.model} onChange={handleChange} className={inputClass} required maxLength={60} />
              </div>

              <div>
                <label htmlFor="year" className="text-sm font-semibold text-slate-700">Model year *</label>
                <input id="year" name="year" type="number" min="1900" max={new Date().getFullYear() + 1} value={form.year} onChange={handleChange} className={inputClass} required />
              </div>

              <div>
                <label htmlFor="color" className="text-sm font-semibold text-slate-700">Color</label>
                <input id="color" name="color" value={form.color} onChange={handleChange} className={inputClass} maxLength={40} />
              </div>

              <div>
                <label htmlFor="transmission" className="text-sm font-semibold text-slate-700">Transmission</label>
                <select id="transmission" name="transmission" value={form.transmission} onChange={handleChange} className={inputClass}>
                  <option value="automatic">Automatic</option>
                  <option value="manual">Manual</option>
                </select>
              </div>

              <div>
                <label htmlFor="seats" className="text-sm font-semibold text-slate-700">Seats *</label>
                <input id="seats" name="seats" type="number" min="1" max="100" step="1" value={form.seats} onChange={handleChange} className={inputClass} required />
              </div>
            </div>
          </section>

          <div className="border-t border-slate-100" />

          <section>
            <h2 className="text-lg font-bold text-slate-900">Rental details</h2>
            <div className="mt-5 grid gap-5 sm:grid-cols-2">
              <div>
                <label htmlFor="dailyPrice" className="text-sm font-semibold text-slate-700">Daily price (ETB) *</label>
                <input id="dailyPrice" name="dailyPrice" type="number" min="1" step="0.01" value={form.dailyPrice} onChange={handleChange} className={inputClass} required />
              </div>

              <div>
                <label htmlFor="location" className="text-sm font-semibold text-slate-700">Pickup location *</label>
                <input id="location" name="location" value={form.location} onChange={handleChange} className={inputClass} required maxLength={120} />
              </div>
            </div>
          </section>

          <div className="border-t border-slate-100" />

          <section>
            <h2 className="text-lg font-bold text-slate-900">Photo and description</h2>
            <div className="mt-5 space-y-5">
              <div>
                <label htmlFor="image" className="text-sm font-semibold text-slate-700">Image URL or local path</label>
                <input id="image" name="image" value={form.image} onChange={handleChange} placeholder="/images/cars/car.jpg" className={inputClass} />
              </div>

              <div>
                <label htmlFor="description" className="text-sm font-semibold text-slate-700">Description</label>
                <textarea id="description" name="description" value={form.description} onChange={handleChange} rows={4} maxLength={1000} placeholder="Describe the vehicle..." className={inputClass} />
              </div>
            </div>
          </section>

          {error && (
            <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </p>
          )}

          <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">
            <Link href="/owner/cars" className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50">
              Cancel
            </Link>

            <button type="submit" disabled={saving} className="inline-flex min-h-11 items-center justify-center rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60">
              {saving ? "Saving changes..." : "Save changes"}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
