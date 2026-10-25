
"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { getCurrentUser, signOutDemoUser } from "@/lib/auth";

const navigationLinks = [
  { label: "Home", href: "/" },
  { label: "Browse Cars", href: "/cars" },
];

const roleLabels = {
  renter: "Renter",
  owner: "Owner",
  admin: "Admin",
};

export default function Header() {
  const [user, setUser] = useState(null);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    setUser(getCurrentUser());
  }, [pathname]);

  function handleSignOut() {
    signOutDemoUser();
    setUser(null);
    router.push("/");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-50 border-b border-[#E5EAF1] bg-white">
      <div className="mx-auto flex min-h-20 max-w-[1200px] items-center justify-between gap-4 px-5 sm:gap-6 sm:px-8">
        {/* Brand */}
        <Link
          href="/"
          aria-label="Sheggar Wheels home"
          className="flex shrink-0 items-center gap-2 sm:gap-3"
        >
          <Image
            src="/images/hero/logo.jpg"
            alt="Sheggar Wheels logo"
            width={48}
            height={48}
            priority
            className="h-10 w-10 rounded-lg object-contain sm:h-12 sm:w-12"
          />

          <span className="text-base font-bold tracking-tight text-[#252A34] sm:text-xl">
            Sheggar <span className="text-[#0866F5]">Wheels</span>
          </span>
        </Link>

        {/* Main navigation */}
        <nav
          aria-label="Main navigation"
          className="hidden items-center gap-8 md:flex"
        >
          {navigationLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-[#252A34] transition-colors hover:text-[#0866F5]"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Authentication actions */}
        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          {user ? (
            <>
              <div className="hidden text-right sm:block">
                <p className="max-w-40 truncate text-sm font-semibold text-[#252A34]">
                  Welcome, {user.name}
                </p>
                <p className="text-xs text-[#667085]">
                  {roleLabels[user.role] ?? "User"} account
                </p>
              </div>

              <button
                type="button"
                onClick={handleSignOut}
                className="inline-flex min-h-10 items-center justify-center rounded-lg border border-[#E5EAF1] px-3 py-2 text-sm font-semibold text-[#252A34] transition-colors hover:border-[#0866F5] hover:text-[#0866F5] sm:px-4"
              >
                Sign Out
              </button>
            </>
          ) : (
            <>
              <Link
                href="/signin"
                className="rounded-lg px-2 py-2 text-sm font-semibold text-[#252A34] transition-colors hover:text-[#0866F5] sm:px-3"
              >
                Sign In
              </Link>

              <Link
                href="/signup"
                className="inline-flex min-h-10 items-center justify-center rounded-lg bg-[#0866F5] px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#0754C7] sm:px-5"
              >
                Get Started
              </Link>
            </>
          )}
        </div>
      </div>

      {user && (
        <div className="border-t border-[#E5EAF1] px-5 py-2 sm:hidden">
          <p className="truncate text-sm font-semibold text-[#252A34]">
            Welcome, {user.name}
            <span className="font-normal text-[#667085]">
              {" "}· {roleLabels[user.role] ?? "User"}
            </span>
          </p>
        </div>
      )}
    </header>
  );
}
