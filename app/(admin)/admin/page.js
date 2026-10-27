"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  LayoutDashboard,
  CarFront,
  Users,
  CalendarCheck,
  MessageSquareWarning,
  ChartNoAxesCombined,
  Megaphone,
  ArrowRight,
  Menu,
  X,
  LogOut,
} from "lucide-react";

import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { signOutDemoUser } from "@/lib/auth";

const adminSections = [
  {
    title: "Dashboard",
    href: "/admin",
    icon: LayoutDashboard,
  },
  {
    title: "Listings",
    description: "Review and manage vehicle listings.",
    href: "/admin/listings",
    icon: CarFront,
  },
  {
    title: "Users",
    description: "View and manage platform users.",
    href: "/admin/users",
    icon: Users,
  },
  {
    title: "Bookings",
    description: "Review rental bookings and their status.",
    href: "/admin/bookings",
    icon: CalendarCheck,
  },
  {
    title: "Disputes",
    description: "Review reported issues and disputes.",
    href: "/admin/disputes",
    icon: MessageSquareWarning,
  },
  {
    title: "Reports",
    description: "Review platform activity and reports.",
    href: "/admin/reports",
    icon: ChartNoAxesCombined,
  },
  {
    title: "Announcements",
    description: "Manage messages shown to platform users.",
    href: "/admin/announcements",
    icon: Megaphone,
  },
];

function AdminSidebar({ onClose, onLogout }) {
  return (
    <aside className="flex h-full flex-col bg-blue-950 text-slate-200">
      <div className="border-b border-white/10 px-5 py-6">
        <Link
          href="/admin"
          onClick={onClose}
          className="flex items-center gap-3"
        >
          <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-xl bg-white">
            <Image
              src="/images/hero/logo.jpg"
              alt="Sheggar Wheels logo"
              fill
              sizes="44px"
              className="object-cover"
              priority
            />
          </div>

          <div>
            <p className="text-base font-bold text-white">
              Sheggar Wheels
            </p>
            <p className="mt-0.5 text-xs text-blue-200">
              Admin Panel
            </p>
          </div>
        </Link>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-5">
        <p className="mb-3 px-3 text-[11px] font-semibold uppercase tracking-widest text-blue-300">
          Workspace
        </p>

        {adminSections.map((section) => {
          const Icon = section.icon;
          const active = section.href === "/admin";

          return (
            <Link
              key={section.href}
              href={section.href}
              onClick={onClose}
              aria-current={active ? "page" : undefined}
              className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition ${
                active
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-950/30"
                  : "text-blue-100 hover:bg-blue-900 hover:text-white"
              }`}
            >
              <Icon size={19} />
              <span>{section.title}</span>

              {active && (
                <span className="ml-auto h-1.5 w-1.5 rounded-full bg-white" />
              )}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-white/10 p-4">
        <button
          type="button"
          onClick={onLogout}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-blue-100 transition hover:bg-red-600 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
        >
          <LogOut size={19} />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}

export default function AdminDashboardPage() {
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const managementSections = adminSections.filter(
    (section) => section.href !== "/admin",
  );

  function handleLogout() {
    signOutDemoUser();
    router.replace("/");
    router.refresh();
  }

  return (
    <div className="flex min-h-screen flex-col bg-blue-50">
      <Header />

      {/* Dashboard and sidebar area */}
      <div className="relative flex flex-1 items-stretch">
        {/* Desktop sidebar: bounded by the dashboard area, not the viewport */}
        <div className="absolute bottom-0 left-0 top-0 z-30 hidden w-64 lg:block">
          <div className="sticky top-20 h-[calc(100vh-5rem)]">
            <AdminSidebar onLogout={handleLogout} />
          </div>
        </div>

        {/* Mobile sidebar */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <button
              type="button"
              aria-label="Close navigation"
              className="absolute inset-0 bg-slate-950/60"
              onClick={() => setMobileMenuOpen(false)}
            />

            <div className="relative h-full w-72 max-w-[85vw] shadow-2xl">
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                aria-label="Close menu"
                className="absolute right-3 top-4 z-10 rounded-lg p-2 text-white hover:bg-blue-900"
              >
                <X size={20} />
              </button>

              <AdminSidebar
                onClose={() => setMobileMenuOpen(false)}
                onLogout={handleLogout}
              />
            </div>
          </div>
        )}

        {/* Main dashboard */}
        <div className="flex min-w-0 flex-1 flex-col lg:ml-64">
          <header className="flex min-h-[72px] items-center justify-between border-b border-blue-100 bg-white/95 px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setMobileMenuOpen(true)}
                aria-label="Open navigation menu"
                className="rounded-lg border border-blue-100 p-2 text-blue-900 hover:bg-blue-50 lg:hidden"
              >
                <Menu size={20} />
              </button>

              <div>
                <p className="text-xs font-medium text-slate-500">
                  Workspace / Admin
                </p>
                <h1 className="text-lg font-bold text-slate-900">
                  Dashboard Overview
                </h1>
              </div>
            </div>

            <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-800">
              Demo data
            </span>
          </header>

          <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-5 sm:px-6 lg:px-8">
            <section className="mb-5 rounded-2xl bg-gradient-to-r from-blue-800 to-blue-600 p-5 text-white shadow-sm sm:p-6">
              <p className="text-sm font-medium text-blue-100">
                SHEGGAR WHEELS ADMINISTRATION
              </p>

              <h2 className="mt-3 text-2xl font-bold sm:text-3xl">
                Welcome to your dashboard
              </h2>

              <p className="mt-3 max-w-2xl text-sm leading-6 text-blue-100">
                Manage vehicle listings, platform users, rental bookings,
                disputes, reports, and announcements from one central place.
              </p>

              <div className="mt-5 inline-flex items-center gap-2 rounded-full border border-blue-300/50 bg-blue-950/20 px-3 py-1.5 text-xs font-medium">
                <span className="h-2 w-2 rounded-full bg-emerald-300" />
                Demo environment active
              </div>
            </section>

            <section>
              <div className="mb-5">
                <h2 className="text-lg font-bold text-slate-900">
                  Management sections
                </h2>
                <p className="mt-1 text-sm text-slate-600">
                  Choose an area to manage the platform.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {managementSections.map((section) => {
                  const Icon = section.icon;

                  return (
                    <Link
                      key={section.href}
                      href={section.href}
                      className="group rounded-2xl border border-blue-100 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-100 text-blue-700 transition group-hover:bg-blue-600 group-hover:text-white">
                          <Icon size={22} />
                        </div>

                        <ArrowRight
                          size={19}
                          className="text-slate-400 transition group-hover:translate-x-1 group-hover:text-blue-600"
                        />
                      </div>

                      <h3 className="mt-5 text-lg font-bold text-slate-900">
                        {section.title}
                      </h3>

                      <p className="mt-2 text-sm leading-6 text-slate-600">
                        {section.description}
                      </p>

                      <p className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-blue-700">
                        Open section
                        <ArrowRight size={15} />
                      </p>
                    </Link>
                  );
                })}
              </div>
            </section>
          </main>
        </div>
      </div>

      {/* Shared footer stays after the dashboard content */}
      <Footer />
    </div>
  );
}
