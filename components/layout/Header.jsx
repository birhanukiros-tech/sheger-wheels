
import Image from "next/image";
import Link from "next/link";

const navigationLinks = [
  { label: "Home", href: "/" },
  { label: "Browse Cars", href: "/cars" },
];

export default function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-[#E5EAF1] bg-white">
      <div className="mx-auto flex min-h-20 max-w-[1200px] items-center justify-between gap-6 px-5 sm:px-8">
        {/* Brand */}
        <Link
          href="/"
          aria-label="Sheggar Wheels home"
          className="flex shrink-0 items-center gap-3"
        >
          <Image
            src="/images/hero/logo.jpg"
            alt="Sheggar Wheels logo"
            width={48}
            height={48}
            priority
            className="h-12 w-12 rounded-lg object-contain"
          />

          <span className="text-lg font-bold tracking-tight text-[#252A34] sm:text-xl">
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
        <div className="flex shrink-0 items-center gap-3">
          <Link
            href="/signin"
            className="hidden rounded-lg px-3 py-2 text-sm font-semibold text-[#252A34] transition-colors hover:text-[#0866F5] sm:inline-flex"
          >
            Sign in
          </Link>

          <Link
            href="/signup"
            className="inline-flex min-h-11 items-center justify-center rounded-lg bg-[#0866F5] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#0754C7] sm:px-5"
          >
            Get Started
          </Link>
        </div>
      </div>
    </header>
  );
}
