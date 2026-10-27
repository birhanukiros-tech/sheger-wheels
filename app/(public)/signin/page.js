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
    initials: "R",
  },
  {
    role: "owner",
    label: "Car Owner",
    description: "Manage your car listings and booking requests.",
    initials: "O",
  },
];

const demoOwners = [
  {
    id: "owner-001",
    label: "Demo Owner One",
    email: "owner1@sheggarwheels.demo",
  },
  {
    id: "owner-002",
    label: "Demo Owner Two",
    email: "owner2@sheggarwheels.demo",
  },
  {
    id: "owner-003",
    label: "Demo Owner Three",
    email: "owner3@sheggarwheels.demo",
  },
  {
    id: "owner-004",
    label: "Demo Owner Four",
    email: "owner4@sheggarwheels.demo",
  },
  {
    id: "owner-005",
    label: "Demo Owner Five",
    email: "owner5@sheggarwheels.demo",
  },
];

const DEMO_OWNER_PASSWORD = "Owner123";

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

  const [selectedRole, setSelectedRole] = useState();
  const [selectedOwner, setSelectedOwner] = useState();
  const [showPassword, setShowPassword] = useState(false);

  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const [error, setError] = useState("");
  const [isSigningIn, setIsSigningIn] = useState(false);

  const selectedDemoOwner = demoOwners.find(
    (owner) => owner.id === selectedOwner,
  );

  const isDemoOwnerSelected = Boolean(selectedDemoOwner);

  function handleRoleChange(role) {
    setSelectedRole(role);
    setEmail("");
    setUsername("");
    setPassword("");
    setError("");
    setShowPassword(false);
  }

  function handleOwnerChange(ownerId) {
    setSelectedOwner(ownerId);
    setEmail("");
    setPassword("");
    setError("");
    setShowPassword(false);
  }

  function handleSignIn(event) {
    event.preventDefault();

    setError("");
    setIsSigningIn(true);

    const result = isAdminLogin
      ? signInDemoUser("admin-001", username, password)
      : signInUser(email.trim(), password, selectedRole);

    if (!result.success) {
      setError(result.message || "Unable to sign in. Please try again.");
      setIsSigningIn(false);
      return;
    }

    const fallback = isAdminLogin
      ? "/admin"
      : selectedRole === "owner"
        ? "/owner"
        : "/dashboard";

    const destination = getSafeDestination(
      searchParams.get("next"),
      fallback,
    );

    router.replace(destination);
    router.refresh();
  }

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

      <div className="relative w-full max-w-4xl rounded-3xl border border-border bg-white p-6 shadow-xl shadow-slate-200/50 sm:p-10">
        {/* Logo and heading */}
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
              : "Choose your account type and sign in to continue."}
          </p>
        </div>

        {/* Separate administrator login */}
        {isAdminLogin ? (
          <div className="mx-auto max-w-lg rounded-2xl border border-primary bg-blue-50/40 p-5">
            <h2 className="text-lg font-bold text-foreground">
              Administrator demo account
            </h2>
            <p className="mt-1 text-sm text-muted">
              Admin access remains separate from public registration.
            </p>

            <form onSubmit={handleSignIn} className="mt-5 space-y-4">
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
                  Username:{" "}
                  <strong className="text-foreground">
                    {adminCredentials.username}
                  </strong>
                </p>
                <p className="mt-1 text-muted">
                  Password:{" "}
                  <strong className="text-foreground">
                    {adminCredentials.password}
                  </strong>
                </p>
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
                disabled={isSigningIn}
                className="flex min-h-12 w-full items-center justify-center rounded-xl bg-primary px-5 py-3 font-semibold text-white transition hover:bg-primary-hover disabled:opacity-60"
              >
                {isSigningIn ? "Signing in..." : "Sign in as Admin"}
              </button>
            </form>
          </div>
        ) : (
          <>
            {/* Account types: side by side */}
            <h2 className="mb-3 text-sm font-bold text-foreground">
              Choose your account type
            </h2>

            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              {accountTypes.map((account) => {
                const isSelected = selectedRole === account.role;

                return (
                  <button
                    key={account.role}
                    type="button"
                    onClick={() => handleRoleChange(account.role)}
                    aria-pressed={isSelected}
                    className={`flex min-h-28 items-center gap-3 rounded-2xl border p-4 text-left transition sm:p-5 ${
                      isSelected
                        ? "border-primary bg-blue-50/60 shadow-sm ring-1 ring-primary"
                        : "border-border bg-white hover:border-blue-300"
                    }`}
                  >
                    <span
                      className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-lg font-bold ${
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
                      <span className="mt-1 block text-xs leading-5 text-muted sm:text-sm">
                        {account.description}
                      </span>
                    </span>

                    {isSelected && (
                      <span className="hidden text-primary sm:inline" aria-hidden="true">
                        ✓
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Renter form */}
            {selectedRole === "renter" && (
              <div className="mx-auto mt-6 max-w-lg rounded-2xl border border-border bg-white p-5 sm:p-6">
                <h3 className="text-lg font-bold text-foreground">
                  Sign in as Renter
                </h3>
                <p className="mt-1 text-sm text-muted">
                  Enter your registered email and password.
                </p>

                <form onSubmit={handleSignIn} className="mt-5 space-y-4">
                  <div>
                    <label
                      htmlFor="renter-email"
                      className="mb-2 block text-sm font-semibold text-foreground"
                    >
                      Email address
                    </label>
                    <input
                      id="renter-email"
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
                      htmlFor="renter-password"
                      className="mb-2 block text-sm font-semibold text-foreground"
                    >
                      Password
                    </label>
                    <input
                      id="renter-password"
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
                    className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 font-semibold text-white shadow-md shadow-blue-600/20 transition hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isSigningIn ? "Signing in..." : "Sign in as Renter"}
                    {!isSigningIn && <span aria-hidden="true">→</span>}
                  </button>
                </form>
              </div>
            )}

            {/* Owner accounts and login panel */}
            {selectedRole === "owner" && (
              <div className="mt-6 grid grid-cols-1 items-start gap-4 md:grid-cols-2 md:gap-6">
                {/* Owner account list */}
                <div className="rounded-2xl border border-border bg-white p-4 sm:p-5">
                  <h3 className="text-lg font-bold text-foreground">
                    Choose an owner account
                  </h3>
                  <p className="mt-1 mb-4 text-sm leading-5 text-muted">
                    Select an account to view its login form.
                  </p>

                  <div className="space-y-2">
                    {demoOwners.map((owner, index) => {
                      const ownerIsSelected = selectedOwner === owner.id;

                      return (
                        <button
                          key={owner.id}
                          type="button"
                          onClick={() => handleOwnerChange(owner.id)}
                          aria-pressed={ownerIsSelected}
                          className={`flex w-full items-center gap-3 rounded-xl border p-3 text-left transition ${
                            ownerIsSelected
                              ? "border-primary bg-blue-50"
                              : "border-border bg-white hover:border-blue-300"
                          }`}
                        >
                          <span
                            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-sm font-bold ${
                              ownerIsSelected
                                ? "bg-primary text-white"
                                : "bg-slate-100 text-slate-600"
                            }`}
                          >
                            {index + 1}
                          </span>

                          <span className="min-w-0 flex-1">
                            <span className="block text-sm font-semibold text-foreground">
                              {owner.label}
                            </span>
                            <span className="mt-1 block break-all text-xs text-muted">
                              {owner.email}
                            </span>
                          </span>

                          {ownerIsSelected && (
                            <span className="shrink-0 text-primary" aria-hidden="true">
                              ✓
                            </span>
                          )}
                        </button>
                      );
                    })}

                    <button
                      type="button"
                      onClick={() => handleOwnerChange("my-account")}
                      aria-pressed={selectedOwner === "my-account"}
                      className={`flex w-full items-center gap-3 rounded-xl border p-3 text-left transition ${
                        selectedOwner === "my-account"
                          ? "border-primary bg-blue-50"
                          : "border-border bg-white hover:border-blue-300"
                      }`}
                    >
                      <span
                        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
                          selectedOwner === "my-account"
                            ? "bg-primary text-white"
                            : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        <span aria-hidden="true">👤</span>
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-semibold text-foreground">
                          My Account
                        </span>
                        <span className="mt-1 block text-xs text-muted">
                          Use your own credentials
                        </span>
                      </span>
                      {selectedOwner === "my-account" && (
                        <span className="shrink-0 text-primary" aria-hidden="true">
                          ✓
                        </span>
                      )}
                    </button>
                  </div>
                </div>

                {/* Login form: always beside the list on desktop */}
                <div className="rounded-2xl border border-blue-100 bg-blue-50/30 p-4 sm:p-6">
                  {isDemoOwnerSelected ? (
                    <>
                      <h3 className="text-lg font-bold text-foreground">
                        {selectedDemoOwner.label}
                      </h3>
                      <p className="mt-1 text-sm text-muted">
                        Demo account credentials
                      </p>

                      <div className="mt-4 space-y-3 rounded-xl border border-blue-100 bg-white p-4 text-sm">
                        <div>
                          <p className="text-xs font-medium text-muted">Email</p>
                          <p className="mt-1 break-all font-semibold text-foreground">
                            {selectedDemoOwner.email}
                          </p>
                        </div>

                        <div>
                          <p className="text-xs font-medium text-muted">Password</p>
                          <div className="mt-1 flex items-center justify-between gap-3">
                            <p className="font-semibold text-foreground">
                              {showPassword ? DEMO_OWNER_PASSWORD : "••••••••"}
                            </p>
                            <button
                              type="button"
                              onClick={() => setShowPassword((value) => !value)}
                              className="font-semibold text-primary hover:underline"
                            >
                              {showPassword ? "Hide" : "Show"}
                            </button>
                          </div>
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      <h3 className="text-lg font-bold text-foreground">
                        My Owner Account
                      </h3>
                      <p className="mt-1 text-sm text-muted">
                        Enter your own registered credentials.
                      </p>
                    </>
                  )}

                  {selectedOwner && (
                    <form onSubmit={handleSignIn} className="mt-5 space-y-4">
                      <div>
                        <label
                          htmlFor="owner-email"
                          className="mb-2 block text-sm font-semibold text-foreground"
                        >
                          Email address
                        </label>
                        <input
                          id="owner-email"
                          type="email"
                          autoComplete="username"
                          required
                          value={email}
                          onChange={(event) => setEmail(event.target.value)}
                          placeholder={
                            isDemoOwnerSelected
                              ? selectedDemoOwner.email
                              : "you@example.com"
                          }
                          className="min-h-12 w-full rounded-xl border border-border bg-white px-4 py-3 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-blue-100"
                        />
                      </div>

                      <div>
                        <label
                          htmlFor="owner-password"
                          className="mb-2 block text-sm font-semibold text-foreground"
                        >
                          Password
                        </label>
                        <input
                          id="owner-password"
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
                        className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 font-semibold text-white shadow-md shadow-blue-600/20 transition hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {isSigningIn
                          ? "Signing in..."
                          : `Sign in as ${
                              isDemoOwnerSelected
                                ? selectedDemoOwner.label
                                : "Owner"
                            }`}
                        {!isSigningIn && <span aria-hidden="true">→</span>}
                      </button>
                    </form>
                  )}
                </div>
              </div>
            )}
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
            <Link
              href="/signin"
              className="font-bold text-primary hover:underline"
            >
              Back to renter and owner sign in
            </Link>
          </p>
        )}
      </div>
    </section>
  );
}
