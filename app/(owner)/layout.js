"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { getCurrentUser, signOutDemoUser } from "@/lib/auth";

const ownerLinks = [
  { label: "Dashboard", href: "/owner" },
  { label: "My Cars", href: "/owner/cars" },
  { label: "Earnings", href: "/owner/earnings" },
  { label: "Reviews", href: "/owner/reviews" },
  { label: "Disputes", href: "/owner/disputes" },
];

export default function OwnerLayout({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  useEffect(() => {
    let timeoutId;

    const currentUser = getCurrentUser();

    if (!currentUser) {
      router.replace(
        `/signin?next=${encodeURIComponent(pathname || "/owner")}`
      );
      return;
    }

    if (currentUser.role !== "owner") {
      router.replace(
        currentUser.role === "admin" ? "/admin" : "/dashboard"
      );
      return;
    }

    timeoutId = window.setTimeout(() => {
      setUser(currentUser);
      setAuthChecked(true);
    }, 0);

    return () => {
      if (timeoutId) {
        window.clearTimeout(timeoutId);
      }
    };
  }, [pathname, router]);

  function handleSignOut() {
    setSigningOut(true);

    const signedOut = signOutDemoUser();

    if (signedOut) {
      router.replace("/");
      router.refresh();
      return;
    }

    setSigningOut(false);
    window.alert("Unable to sign out. Please try again.");
  }

  if (!authChecked) {
    return (
      <main className="flex min-h-[60vh] items-center justify-center bg-slate-50 px-4">
        <p className="text-sm font-medium text-slate-600">
          Checking owner access...
        </p>
      </main>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-5 sm:px-6 lg:px-8">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <Link
                href="/owner"
                className="text-xl font-bold tracking-tight text-slate-900"
              >
                Sheggar Wheels
                <span className="ml-2 text-sm font-semibold text-blue-600">
                  Owner
                </span>
              </Link>
              <p className="mt-1 text-sm text-slate-500">
                Manage your vehicles and rental business.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <span className="text-sm text-slate-600">
                Signed in as{" "}
                <span className="font-semibold text-slate-900">
                  {user?.name || "Owner"}
                </span>
              </span>

              <Link
                href="/"
                className="inline-flex min-h-10 items-center justify-center rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:border-blue-500 hover:text-blue-700"
              >
                View public site
              </Link>

              <button
                type="button"
                onClick={handleSignOut}
                disabled={signingOut}
                className="inline-flex min-h-10 items-center justify-center rounded-lg bg-slate-900 px-3 py-2 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {signingOut ? "Signing out..." : "Sign out"}
              </button>
            </div>
          </div>

          <nav
            aria-label="Owner navigation"
            className="flex gap-2 overflow-x-auto pb-1"
          >
            {ownerLinks.map((link) => {
              const isActive =
                pathname === link.href ||
                (link.href !== "/owner" &&
                  pathname.startsWith(`${link.href}/`));

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`shrink-0 rounded-lg px-4 py-2 text-sm font-semibold transition ${
                    isActive
                      ? "bg-blue-600 text-white"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>
        </div>
      </header>

      <div>{children}</div>
    </div>
  );
}
