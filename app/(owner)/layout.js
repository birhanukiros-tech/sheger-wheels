"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";

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

  useEffect(() => {
    const currentUser = getCurrentUser();

    if (!currentUser) {
      router.replace(
        `/signin?next=${encodeURIComponent(pathname || "/owner")}`
      );
      return;
    }

    if (currentUser.role !== "owner") {
      const destination =
        currentUser.role === "admin"
          ? "/admin"
          : "/dashboard";

      router.replace(destination);
      return;
    }

    setUser(currentUser);
    setAuthChecked(true);
  }, [pathname, router]);

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
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
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

            <div className="text-sm text-slate-600">
              Signed in as{" "}
              <span className="font-semibold text-slate-900">
                {user?.name || "Owner"}
              </span>
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
