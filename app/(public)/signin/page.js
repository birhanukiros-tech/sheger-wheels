
"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  signInUser,
  signInDemoUser,
  DEMO_LOGIN_CREDENTIALS,
} from "@/lib/auth";

const accountTypes = [
  {
    role: "renter",
    label: "Renter",
    description: "Discover cars and manage your bookings.",
    destination: "/dashboard",
    initials: "R",
  },
  {
    role: "owner",
    label: "Car Owner",
    description: "Manage your car listings and booking requests.",
    destination: "/owner",
    initials: "O",
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
  const isAdminLogin = searchParams.get("role") === "admin";

  const [selectedRole, setSelectedRole] = useState("");
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSigningIn, setIsSigningIn] = useState(false);

  function handleRoleChange(role) {
    setSelectedRole(role);
    setEmail("");
    setUsername("");
    setPassword("");
    setError("");
  }

  function handleSignIn(event) {
    event.preventDefault();
    setError("");
    setIsSigningIn(true);

    const result = isAdminLogin
      ? signInDemoUser("admin-001", username, password)
      : signInUser(email, password, selectedRole);

    if (!result.success) {
      setError(result.message);
      setIsSigningIn(false);
      return;
    }

    const fallback = isAdminLogin
      ? "/admin"
      : accountTypes.find((account) => account.role === selectedRole)
          ?.destination ?? "/dashboard";

    const destination = getSafeDestination(
      searchParams.get("next"),
      fallback,
    );

    router.replace(destination);
    router.refresh();
  }

  const activeAccount = accountTypes.find(
    (account) => account.role === selectedRole,
  );

  const adminCredentials = DEMO_LOGIN_CREDENTIALS["admin-001"];

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
            {isAdminLogin ? "Administrator login" : "Find your way forward."}
          </h1>

          <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-muted sm:text-base">
            {isAdminLogin
              ? "Sign in using the existing administrator demo credentials."
              : "Choose your account type and sign in with your email and password."}
          </p>
        </div>

        {isAdminLogin ? (
          <div className="rounded-2xl border border-primary bg-blue-50/40 p-5">
            <div className="mb-5">
              <h2 className="text-lg font-bold text-foreground">
                Administrator demo account
              </h2>
              <p className="mt-1 text-sm text-muted">
                Admin access remains separate from public registration.
              </p>
            </div>

            <form onSubmit={handleSignIn} className="space-y-4">
              <div>
                <label
                  htmlFor="admin-username"
                  className="mb-2 block text-sm font-semibold text-foreground"
                >
                  Username
                </label>
                <input
                  id="admin-username"
                  type="text"
                  autoComplete="username"
                  required
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                  placeholder="Enter admin username"
                  className="min-h-12 w-full rounded-xl border border-border bg-white px-4 py-3 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div>
                <label
                  htmlFor="admin-password"
                  className="mb-2 block text-sm font-semibold text-foreground"
                >
                  Password
                </label>
                <input
                  id="admin-password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Enter admin password"
                  className="min-h-12 w-full rounded-xl border border-border bg-white px-4 py-3 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div className="rounded-xl border border-blue-100 bg-white p-4 text-sm">
                <p className="font-bold text-foreground">Demo credentials</p>
                <p className="mt-2 text-muted">
                  Username: <strong className="text-foreground">{adminCredentials.username}</strong>
                </p>
                <p className="mt-1 text-muted">
                  Password: <strong className="text-foreground">{adminCredentials.password}</strong>
                </p>
              </div>

              {error && (
                <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={isSigningIn}
                className="flex min-h-12 w-full items-center justify-center rounded-xl bg-primary px-5 py-3 font-semibold text-white transition hover:bg-primary-hover disabled:opacity-60"
              >
                {isSigningIn ? "Signing in..." : "Sign in as Admin"}
              </button>
            </form>
          </div>
        ) : (
          <>
            <h2 className="mb-3 text-sm font-bold text-foreground">
              Choose your account
            </h2>

            <div className="space-y-3">
              {accountTypes.map((account) => {
                const isSelected = selectedRole === account.role;

                return (
                  <div
                    key={account.role}
                    className={`rounded-2xl border transition duration-200 ${
                      isSelected
                        ? "border-primary bg-blue-50/40 shadow-sm ring-1 ring-primary"
                        : "border-border bg-white hover:border-blue-300"
                    }`}
                  >
                    <label className="flex min-h-24 cursor-pointer items-center gap-4 p-4 sm:p-5">
                      <input
                        type="radio"
                        name="accountType"
                        value={account.role}
                        checked={isSelected}
                        onChange={() => handleRoleChange(account.role)}
                        className="sr-only"
                      />

                      <span
                        className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-lg font-bold ${
                          isSelected
                            ? "bg-primary text-white"
                            : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {account.initials}
                      </span>

                      <span className="min-w-0 flex-1">
                        <span className="block font-bold text-foreground">
                          {account.label}
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
                        {isSelected && "✓"}
                      </span>
                    </label>

                    {isSelected && (
                      <div className="border-t border-blue-100 px-4 pb-5 pt-5 sm:px-5">
                        <h3 className="text-lg font-bold text-foreground">
                          Sign in as {account.label}
                        </h3>
                        <p className="mt-1 text-sm text-muted">
                          Enter the email and password used to create your account.
                        </p>

                        <form onSubmit={handleSignIn} className="mt-5 space-y-4">
                          <div>
                            <label
                              htmlFor="email"
                              className="mb-2 block text-sm font-semibold text-foreground"
                            >
                              Email address
                            </label>
                            <input
                              id="email"
                              type="email"
                              autoComplete="email"
                              required
                              value={email}
                              onChange={(event) => setEmail(event.target.value)}
                              placeholder="you@example.com"
                              className="min-h-12 w-full rounded-xl border border-border bg-white px-4 py-3 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-blue-100"
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
                              type="password"
                              autoComplete="current-password"
                              required
                              value={password}
                              onChange={(event) => setPassword(event.target.value)}
                              placeholder="Enter your password"
                              className="min-h-12 w-full rounded-xl border border-border bg-white px-4 py-3 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-blue-100"
                            />
                          </div>

                          {error && (
                            <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                              {error}
                            </p>
                          )}

                          <button
                            type="submit"
                            disabled={isSigningIn}
                            className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 font-semibold text-white shadow-md shadow-blue-600/20 transition hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            {isSigningIn ? "Signing in..." : `Sign in as ${account.label}`}
                            {!isSigningIn && <span aria-hidden="true">→</span>}
                          </button>
                        </form>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}

    
        {!isAdminLogin ? (
          <p className="mt-6 text-center text-sm text-muted">
            New to Sheggar Wheels?{" "}
            <Link
              href="/signup"
              className="font-bold text-primary underline-offset-4 hover:underline"
            >
              Create an account
            </Link>
          </p>
        ) : (
          <p className="mt-6 text-center text-sm text-muted">
            <Link href="/signin" className="font-bold text-primary hover:underline">
              Back to renter and owner sign in
            </Link>
          </p>
        )}
      </div>
    </section>
  );
}
