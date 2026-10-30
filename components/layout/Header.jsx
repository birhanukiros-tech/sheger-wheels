"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { getCurrentUser, signOutDemoUser } from "@/lib/auth";

const navigation = [
  { label: "Home", href: "/" },
  { label: "Browse Cars", href: "/cars" },
  { label: "Checkout", href: "/checkout" },
];

const dashboardRoutes = {
  renter: "/dashboard",
  owner: "/owner",
  admin: "/admin",
};

function roleLabel(role) {
  if (role === "renter") return "Renter";
  if (role === "owner") return "Owner";
  if (role === "admin") return "Admin";
  return "";
}

export default function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState(null);

  useEffect(() => {
    let cancelled = false;

    const updateUser = () => {
      if (cancelled) return;
      setUser(getCurrentUser());
    };

    Promise.resolve().then(updateUser);

    return () => {
      cancelled = true;
    };
  }, [pathname]);

  function handleSignOut() {
    signOutDemoUser();
    setUser(null);
    router.replace("/");
    router.refresh();
  }

  const adminHref =
    user?.role === "admin" ? "/admin" : "/admin/signin";

  const navigationItems = [
    ...navigation,
    { label: "Admin", href: adminHref },
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 shadow-sm backdrop-blur">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
        <Link href="/" className="flex shrink-0 items-center gap-3">
          <Image
            src="/images/hero/logo.jpg"
            alt="Sheggar Wheels"
            width={42}
            height={42}
            className="h-10 w-10 rounded-lg object-cover"
            priority
          />
          <span className="text-lg font-extrabold tracking-tight text-slate-900 sm:text-xl">
            Sheggar <span className="text-[#0866F5]">Wheels</span>
          </span>
        </Link>

        <nav
          aria-label="Main navigation"
          className="order-3 flex w-full flex-wrap items-center gap-x-5 gap-y-3 text-sm font-semibold sm:order-none sm:w-auto"
        >
          {navigationItems.map((item) => {
            const active =
              item.href === "/"
                ? pathname === "/"
                : pathname === item.href ||
                  pathname.startsWith(`${item.href}/`);

            return (
              <Link
                key={item.label}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`transition-colors hover:text-[#0866F5] ${
                  active ? "text-[#0866F5]" : "text-slate-600"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-3">
          {user ? (
            <>
              <div className="hidden text-right sm:block">
                <p className="max-w-36 truncate text-sm font-semibold text-slate-900">
                  {user.name}
                </p>
                <p className="text-xs text-slate-500">
                  {roleLabel(user.role)} account
                </p>
              </div>

              <Link
                href={dashboardRoutes[user.role] || "/"}
                className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:border-[#0866F5] hover:text-[#0866F5]"
              >
                Dashboard
              </Link>

              <button
                type="button"
                onClick={handleSignOut}
                className="rounded-lg bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-200"
              >
                Sign Out
              </button>
            </>
          ) : (
            <>
              <Link
                href="/signin"
                className="text-sm font-semibold text-slate-700 transition hover:text-[#0866F5]"
              >
                Sign In
              </Link>

              <Link
                href="/signup"
                className="rounded-lg bg-[#0866F5] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#0754C7]"
              >
                Get Started
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
