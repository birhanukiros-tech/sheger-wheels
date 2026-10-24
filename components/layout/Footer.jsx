import Image from "next/image";
import Link from "next/link";

const footerLinks = [
  { label: "Home", href: "/" },
  { label: "Browse Cars", href: "/cars" },
  { label: "Sign In", href: "/signin" },
  { label: "Create Account", href: "/signup" },
];

export default function Footer() {
  return (
    <footer className="mt-auto border-t border-[#E5EAF1] bg-[#F4F7FB]">
      <div className="mx-auto flex max-w-[1200px] flex-col gap-6 px-5 py-8 sm:px-8 md:flex-row md:items-center md:justify-between">
        {/* Brand and description */}
        <div className="max-w-md">
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

          <p className="mt-2 text-sm leading-6 text-[#667085]">
            Find a car for your next journey in Addis Ababa.
          </p>
        </div>

        {/* Footer navigation */}
        <nav aria-label="Footer navigation">
          <ul className="flex flex-wrap gap-x-5 gap-y-3">
            {footerLinks.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="text-sm font-medium text-[#252A34] transition-colors hover:text-[#0866F5]"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>

      <div className="border-t border-[#E5EAF1] px-5 py-4 text-center text-xs text-[#667085]">
        © {new Date().getFullYear()} Sheggar Wheels. Demo marketplace project.
      </div>
    </footer>
  );
}
