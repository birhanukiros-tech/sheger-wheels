
"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { registerRenter } from "@/lib/auth";

export default function SignUpPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    const result = registerRenter({ name, email });

    if (!result.success) {
      setError(result.message);
      setIsSubmitting(false);
      return;
    }

    router.replace("/dashboard");
    router.refresh();
  }

  return (
    <section className="relative flex flex-1 items-center justify-center overflow-hidden bg-surface px-4 py-12 sm:px-6 sm:py-16">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-blue-100/60 blur-3xl"
      />

      <div className="relative w-full max-w-xl rounded-3xl border border-border bg-white p-6 shadow-xl shadow-slate-200/50 sm:p-10">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-2xl border border-border bg-white p-2 shadow-sm">
            <Image
              src="/images/hero/logo.jpg"
              alt="Sheggar Wheels logo"
              width={72}
              height={72}
              priority
              className="h-full w-full rounded-xl object-cover"
            />
          </div>

          <p className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-primary">
            Join Sheggar Wheels
          </p>

          <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Create your account.
          </h1>

          <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-muted sm:text-base">
            Create a demo renter account and start exploring
            the car-rental experience.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label
              htmlFor="name"
              className="mb-2 block text-sm font-semibold text-foreground"
            >
              Full name
            </label>

            <input
              id="name"
              name="name"
              type="text"
              autoComplete="name"
              required
              minLength={2}
              maxLength={80}
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Enter your full name"
              className="min-h-12 w-full rounded-xl border border-border bg-white px-4 py-3 text-sm text-foreground outline-none transition placeholder:text-slate-400 focus:border-primary focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <div>
            <label
              htmlFor="email"
              className="mb-2 block text-sm font-semibold text-foreground"
            >
              Email address
            </label>

            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              maxLength={254}
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
              className="min-h-12 w-full rounded-xl border border-border bg-white px-4 py-3 text-sm text-foreground outline-none transition placeholder:text-slate-400 focus:border-primary focus:ring-2 focus:ring-blue-100"
            />
          </div>

          {error && (
            <p
              role="alert"
              className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700"
            >
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 font-semibold text-white shadow-md shadow-blue-600/20 transition hover:bg-primary-hover hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? "Creating account..." : "Create account"}
            {!isSubmitting && <span aria-hidden="true">→</span>}
          </button>
        </form>

        <div className="mt-6 rounded-xl border border-border bg-slate-50 p-4">
          <p className="text-xs leading-5 text-muted">
            <span className="font-semibold text-foreground">
              Demo account.
            </span>{" "}
            This frontend demonstration stores account data in your
            browser. No password or payment details are required.
          </p>
        </div>

        <p className="mt-6 text-center text-sm text-muted">
          Already have an account?{" "}
          <Link
            href="/signin"
            className="font-bold text-primary underline-offset-4 hover:underline"
          >
            Sign in
          </Link>
        </p>
      </div>
    </section>
  );
}
