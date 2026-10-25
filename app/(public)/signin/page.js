"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  signInDemoUser,
  DEMO_LOGIN_CREDENTIALS,
} from "@/lib/auth";

const demoAccounts = [
  {
    id: "renter-001",
    label: "Renter",
    email: "renter@sheggarwheels.demo",
    description: "Discover cars and manage your bookings.",
    destination: "/dashboard",
    initials: "R",
  },
  {
    id: "owner-001",
    label: "Car Owner",
    email: "owner1@sheggarwheels.demo",
    description: "Manage your car listings and booking requests.",
    destination: "/owner",
    initials: "O",
  },
  {
    id: "admin-001",
    label: "Administrator",
    email: "admin@sheggarwheels.demo",
    description: "Explore the marketplace administration area.",
    destination: "/admin",
    initials: "A",
  },
];

function getSafeDestination(value, fallback) {
  if (
    !value ||
    !value.startsWith("/") ||
    value.startsWith("//") ||
    value.includes("\\")
  ) {
    return fallback;
  }

  if (
    value === "/signin" ||
    value.startsWith("/signin?") ||
    value === "/signup" ||
    value.startsWith("/signup?")
  ) {
    return fallback;
  }

  return value;
}

export default function SignInPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [selectedAccount, setSelectedAccount] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSigningIn, setIsSigningIn] = useState(false);

  const selectedDemoAccount = demoAccounts.find(
    (account) => account.id === selectedAccount,
  );

  const demoCredentials = DEMO_LOGIN_CREDENTIALS[selectedAccount];

  function handleAccountChange(accountId) {
    setSelectedAccount(accountId);
    setUsername("");
    setPassword("");
    setError("");
  }

  function handleSignIn(event) {
    event.preventDefault();
    setError("");
    setIsSigningIn(true);

    const result = signInDemoUser(
      selectedAccount,
      username,
      password,
    );

    if (!result.success) {
      setError(result.message);
      setIsSigningIn(false);
      return;
    }

    const fallback = selectedDemoAccount?.destination ?? "/dashboard";
    const destination = getSafeDestination(
      searchParams.get("next"),
      fallback,
    );

    router.replace(destination);
    router.refresh();
  }

  return (
    <section className="relative flex flex-1 items-center justify-center overflow-hidden bg-surface px-4 py-12 sm:px-6 sm:py-16">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-blue-100/60 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-28 -left-20 h-72 w-72 rounded-full bg-blue-100/50 blur-3xl"
      />

      <div className="relative w-full max-w-xl rounded-3xl border border-border bg-white p-6 shadow-xl shadow-slate-200/50 sm:p-10">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-5 flex h-24 w-24 items-center justify-center rounded-2xl border border-border bg-white p-2 shadow-sm">
            <Image
              src="/images/hero/logo.jpg"
              alt="Sheggar Wheels logo"
              width={88}
              height={88}
              priority
              className="h-full w-full rounded-xl object-cover"
            />
          </div>

          <p className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-primary">
            Welcome to Sheggar Wheels
          </p>

          <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Find your way forward.
          </h1>

          <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-muted sm:text-base">
            Choose your role to open the corresponding demo login form.
          </p>
        </div>

        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="text-sm font-bold text-foreground">
            Choose your account
          </h2>

          <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-primary">
            Demo access
          </span>
        </div>

        <div className="space-y-3">
          {demoAccounts.map((account) => {
            const isSelected = selectedAccount === account.id;
            const credentials = DEMO_LOGIN_CREDENTIALS[account.id];

            return (
              <div
                key={account.id}
                className={`rounded-2xl border transition duration-200 ${
                  isSelected
                    ? "border-primary bg-blue-50/40 shadow-sm ring-1 ring-primary"
                    : "border-border bg-white hover:border-blue-300"
                }`}
              >
                <label className="flex min-h-24 cursor-pointer items-center gap-4 p-4 sm:p-5">
                  <input
                    type="radio"
                    name="demoAccount"
                    value={account.id}
                    checked={isSelected}
                    onChange={() => handleAccountChange(account.id)}
                    className="sr-only"
                  />

                  <span
                    aria-hidden="true"
                    className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-lg font-bold ${
                      isSelected
                        ? "bg-primary text-white"
                        : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {account.initials}
                  </span>

                  <span className="min-w-0 flex-1">
                    <span className="flex flex-wrap items-center gap-2">
                      <span className="font-bold text-foreground">
                        {account.label}
                      </span>

                      {account.id === "renter-001" && (
                        <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-600">
                          Start here
                        </span>
                      )}
                    </span>

                    <span className="mt-1 block break-all text-xs text-muted sm:text-sm">
                      {account.email}
                    </span>

                    <span className="mt-2 block text-sm leading-5 text-muted">
                      {account.description}
                    </span>
                  </span>

                  <span
                    aria-hidden="true"
                    className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${
                      isSelected
                        ? "border-primary bg-primary text-white"
                        : "border-slate-300 bg-white"
                    }`}
                  >
                    {isSelected && (
                      <svg viewBox="0 0 20 20" fill="none" className="h-3.5 w-3.5">
                        <path
                          d="m5 10 3.2 3.2L15 6.5"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    )}
                  </span>
                </label>

                {isSelected && (
                  <div className="border-t border-blue-100 px-4 pb-5 pt-5 sm:px-5">
                    <div className="mb-5">
                      <h3 className="text-lg font-bold text-foreground">
                        Sign in as {account.label}
                      </h3>
                      <p className="mt-1 text-sm text-muted">
                        Enter your credentials to continue.
                      </p>
                    </div>

                    <form onSubmit={handleSignIn} className="space-y-4">
                      <div>
                        <label
                          htmlFor="username"
                          className="mb-2 block text-sm font-semibold text-foreground"
                        >
                          Username
                        </label>
                        <input
                          id="username"
                          name="username"
                          type="text"
                          autoComplete="username"
                          required
                          value={username}
                          onChange={(event) => setUsername(event.target.value)}
                          placeholder="Enter your demo username"
                          className="min-h-12 w-full rounded-xl border border-border bg-white px-4 py-3 text-sm text-foreground outline-none transition placeholder:text-slate-400 focus:border-primary focus:ring-2 focus:ring-blue-100"
                        />
                      </div>

                      <div>
                        <label
                          htmlFor="password"
                          className="mb-2 block text-sm font-semibold text-foreground"
                        >
                          Password
                        </label>
                        <input
                          id="password"
                          name="password"
                          type="password"
                          autoComplete="current-password"
                          required
                          value={password}
                          onChange={(event) => setPassword(event.target.value)}
                          placeholder="Enter your demo password"
                          className="min-h-12 w-full rounded-xl border border-border bg-white px-4 py-3 text-sm text-foreground outline-none transition placeholder:text-slate-400 focus:border-primary focus:ring-2 focus:ring-blue-100"
                        />
                      </div>

                      {credentials && (
                        <div className="rounded-xl border border-blue-100 bg-white p-4">
                          <p className="text-sm font-bold text-foreground">
                            Demo credentials
                          </p>
                          <p className="mt-2 text-sm text-muted">
                            Username:{" "}
                            <span className="font-semibold text-foreground">
                              {credentials.username}
                            </span>
                          </p>
                          <p className="mt-1 text-sm text-muted">
                            Password:{" "}
                            <span className="font-semibold text-foreground">
                              {credentials.password}
                            </span>
                          </p>
                        </div>
                      )}

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
                        disabled={isSigningIn}
                        className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 font-semibold text-white shadow-md shadow-blue-600/20 transition hover:bg-primary-hover hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {isSigningIn ? "Signing in..." : `Sign in as ${account.label}`}
                        {!isSigningIn && (
                          <span aria-hidden="true" className="text-lg">
                            →
                          </span>
                        )}
                      </button>
                    </form>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="mt-6 flex items-start gap-3 rounded-xl border border-border bg-slate-50 p-4">
          <span aria-hidden="true" className="mt-0.5 text-primary">
            <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
              <path
                d="M12 3 19 6v5c0 4.5-3 7.5-7 10-4-2.5-7-5.5-7-10V6l7-3Z"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinejoin="round"
              />
              <path
                d="m9 12 2 2 4-4"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>

          <p className="text-xs leading-5 text-muted">
            <span className="font-semibold text-foreground">
              Demo environment.
            </span>{" "}
            These credentials are for exploring the project only. This
            frontend demo does not provide secure production authentication.
          </p>
        </div>

        <p className="mt-6 text-center text-sm text-muted">
          New to Sheggar Wheels?{" "}
          <Link
            href="/signup"
            className="font-bold text-primary underline-offset-4 hover:underline"
          >
            Create an account
          </Link>
        </p>
      </div>
    </section>
  );
}
