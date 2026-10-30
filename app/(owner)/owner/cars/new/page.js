
"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";

const initialForm = {
  make: "",
  model: "",
  year: "",
  color: "",
  transmission: "automatic",
  seats: "5",
  dailyPrice: "",
  location: "Addis Ababa",
  image: "",
  description: "",
};

export default function AddCarPage() {
  const router = useRouter();
  const [form, setForm] = useState(initialForm);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  function handleChange(event) {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  }

  function handleSubmit(event) {
    event.preventDefault();
    setError("");

    const owner = getCurrentUser();

    if (!owner || owner.role !== "owner") {
      setError("Please sign in with an owner account to add a vehicle.");
      return;
    }

    const year = Number(form.year);
    const seats = Number(form.seats);
    const dailyPrice = Number(form.dailyPrice);
    const currentYear = new Date().getFullYear();

    if (
      !form.make.trim() ||
      !form.model.trim() ||
      !form.year ||
      !form.dailyPrice ||
      !form.location.trim()
    ) {
      setError("Please complete all required fields.");
      return;
    }

    if (!Number.isInteger(year) || year < 1900 || year > currentYear + 1) {
      setError(`Enter a valid model year between 1900 and ${currentYear + 1}.`);
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
        setError("Enter a valid image URL beginning with https:// or http://.");
        return;
      }
    }

    setSaving(true);

    try {
      const storageKey = "sheggar-wheels-cars";
      const storedCars = JSON.parse(localStorage.getItem(storageKey) || "[]");

      if (!Array.isArray(storedCars)) {
        throw new Error("Saved vehicle data is not in the expected format.");
      }

      const newCar = {
        id: `owner-car-${crypto.randomUUID()}`,
        ownerId: owner.id,
        ownerEmail: owner.email || "",
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
        available: true,
        isAvailable: true,
        createdAt: new Date().toISOString(),
      };

      localStorage.setItem(
        storageKey,
        JSON.stringify([...storedCars, newCar])
      );

      router.push("/owner/cars");
      router.refresh();
    } catch {
      setError(
        "We couldn't save this vehicle. Please check your browser storage and try again."
      );
      setSaving(false);
    }
  }

  const inputClass =
    "mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100";

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6 sm:py-12">
      <div className="mx-auto max-w-3xl">
        <Link
          href="/owner/cars"
          className="text-sm font-semibold text-slate-600 transition hover:text-blue-600"
        >
          ← Back to My Cars
        </Link>

        <header className="mt-6">
          <p className="text-sm font-semibold uppercase tracking-wider text-blue-600">
            Owner workspace
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            Add a new car
          </h1>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            Enter your vehicle details to create a rental listing.
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
            <p className="mt-1 text-sm text-slate-500">
              Basic details renters will use to identify your car.
            </p>

            <div className="mt-5 grid gap-5 sm:grid-cols-2">
              <div>
                <label htmlFor="make" className="text-sm font-semibold text-slate-700">
                  Make *
                </label>
                <input
                  id="make"
                  name="make"
                  value={form.make}
                  onChange={handleChange}
                  placeholder="e.g. Toyota"
                  className={inputClass}
                  required
                  maxLength={60}
                />
              </div>

              <div>
                <label htmlFor="model" className="text-sm font-semibold text-slate-700">
                  Model *
                </label>
                <input
                  id="model"
                  name="model"
                  value={form.model}
                  onChange={handleChange}
                  placeholder="e.g. Corolla"
                  className={inputClass}
                  required
                  maxLength={60}
                />
              </div>

              <div>
                <label htmlFor="year" className="text-sm font-semibold text-slate-700">
                  Model year *
                </label>
                <input
                  id="year"
                  name="year"
                  type="number"
                  min="1900"
                  max={new Date().getFullYear() + 1}
                  value={form.year}
                  onChange={handleChange}
                  placeholder="e.g. 2022"
                  className={inputClass}
                  required
                />
              </div>

              <div>
                <label htmlFor="color" className="text-sm font-semibold text-slate-700">
                  Color
                </label>
                <input
                  id="color"
                  name="color"
                  value={form.color}
                  onChange={handleChange}
                  placeholder="e.g. White"
                  className={inputClass}
                  maxLength={40}
                />
              </div>

              <div>
                <label htmlFor="transmission" className="text-sm font-semibold text-slate-700">
                  Transmission
                </label>
                <select
                  id="transmission"
                  name="transmission"
                  value={form.transmission}
                  onChange={handleChange}
                  className={inputClass}
                >
                  <option value="automatic">Automatic</option>
                  <option value="manual">Manual</option>
                </select>
              </div>

              <div>
                <label htmlFor="seats" className="text-sm font-semibold text-slate-700">
                  Number of seats *
                </label>
                <input
                  id="seats"
                  name="seats"
                  type="number"
                  min="1"
                  max="100"
                  step="1"
                  value={form.seats}
                  onChange={handleChange}
                  className={inputClass}
                  required
                />
              </div>
            </div>
          </section>

          <div className="border-t border-slate-100" />

          <section>
            <h2 className="text-lg font-bold text-slate-900">
              Rental details
            </h2>

            <div className="mt-5 grid gap-5 sm:grid-cols-2">
              <div>
                <label htmlFor="dailyPrice" className="text-sm font-semibold text-slate-700">
                  Daily rental price (ETB) *
                </label>
                <input
                  id="dailyPrice"
                  name="dailyPrice"
                  type="number"
                  min="1"
                  step="0.01"
                  value={form.dailyPrice}
                  onChange={handleChange}
                  placeholder="e.g. 2500"
                  className={inputClass}
                  required
                />
              </div>

              <div>
                <label htmlFor="location" className="text-sm font-semibold text-slate-700">
                  Pickup location *
                </label>
                <input
                  id="location"
                  name="location"
                  value={form.location}
                  onChange={handleChange}
                  placeholder="e.g. Bole, Addis Ababa"
                  className={inputClass}
                  required
                  maxLength={120}
                />
              </div>
            </div>
          </section>

          <div className="border-t border-slate-100" />

          <section>
            <h2 className="text-lg font-bold text-slate-900">
              Photo and description
            </h2>

            <div className="mt-5 space-y-5">
              <div>
                <label htmlFor="image" className="text-sm font-semibold text-slate-700">
                  Vehicle image URL
                </label>
                <input
                  id="image"
                  name="image"
                  type="url"
                  value={form.image}
                  onChange={handleChange}
                  placeholder="https://example.com/car.jpg"
                  className={inputClass}
                />
                <p className="mt-2 text-xs leading-5 text-slate-500">
                  Optional. Use a direct image URL. File uploads are not
                  supported by this demo form.
                </p>
              </div>

              <div>
                <label htmlFor="description" className="text-sm font-semibold text-slate-700">
                  Description
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  placeholder="Describe your vehicle and its features..."
                  rows={4}
                  maxLength={1000}
                  className={inputClass}
                />
              </div>
            </div>
          </section>

          {error && (
            <p
              role="alert"
              className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm leading-6 text-red-700"
            >
              {error}
            </p>
          )}

          <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">
            <Link
              href="/owner/cars"
              className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Cancel
            </Link>

            <button
              type="submit"
              disabled={saving}
              className="inline-flex min-h-11 items-center justify-center rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? "Saving vehicle..." : "Save vehicle"}
            </button>
          </div>
        </form>

        <p className="mt-5 text-xs leading-5 text-slate-500">
          Demo notice: listings are saved in this browser&apos;s local storage.
          This does not publish a real rental listing or process a payment.
        </p>
      </div>
    </main>
  );
}
