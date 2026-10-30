
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
  Menu,
  X,
  LogOut,
} from "lucide-react";

import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { signOutDemoUser } from "@/lib/auth";

const adminSections = [
  { title: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { title: "Listings", href: "/admin/listings", icon: CarFront },
  { title: "Users", href: "/admin/users", icon: Users },
  { title: "Bookings", href: "/admin/bookings", icon: CalendarCheck },
  { title: "Disputes", href: "/admin/disputes", icon: MessageSquareWarning },
  { title: "Reports", href: "/admin/reports", icon: ChartNoAxesCombined },
  { title: "Announcements", href: "/admin/announcements", icon: Megaphone },
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
            <p className="text-base font-bold text-white">Sheggar Wheels</p>
            <p className="mt-0.5 text-xs text-blue-200">Admin Panel</p>
          </div>
        </Link>
      </div>

      <nav aria-label="Admin navigation" className="flex-1 space-y-1 overflow-y-auto px-3 py-5">
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
              <Icon size={19} aria-hidden="true" />
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
          <LogOut size={19} aria-hidden="true" />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}

export default function AdminDashboardShell({ children }) {
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  function handleLogout() {
    signOutDemoUser();
    router.replace("/");
    router.refresh();
  }

  return (
    <div className="flex min-h-screen flex-col bg-blue-50">
      <Header />

      <div className="relative flex flex-1 items-stretch">
        <div className="absolute bottom-0 left-0 top-0 z-30 hidden w-64 lg:block">
          <div className="sticky top-20 h-[calc(100vh-5rem)]">
            <AdminSidebar onLogout={handleLogout} />
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <button
              type="button"
              aria-label="Close navigation"
              className="absolute inset-0 bg-slate-950/60"
              onClick={() => setMobileMenuOpen(false)}
            />

            <div
              id="admin-mobile-navigation"
              className="relative h-full w-72 max-w-[85vw] shadow-2xl"
            >
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                aria-label="Close menu"
                className="absolute right-3 top-4 z-10 rounded-lg p-2 text-white hover:bg-blue-900"
              >
                <X size={20} aria-hidden="true" />
              </button>

              <AdminSidebar
                onClose={() => setMobileMenuOpen(false)}
                onLogout={handleLogout}
              />
            </div>
          </div>
        )}

        <div className="flex min-w-0 flex-1 flex-col lg:ml-64">
          <header className="flex min-h-[72px] items-center justify-between border-b border-blue-100 bg-white/95 px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setMobileMenuOpen(true)}
                aria-label="Open navigation menu"
                aria-expanded={mobileMenuOpen}
                aria-controls="admin-mobile-navigation"
                className="rounded-lg border border-blue-100 p-2 text-blue-900 hover:bg-blue-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 lg:hidden"
              >
                <Menu size={20} aria-hidden="true" />
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

          {children}
        </div>
      </div>

      <Footer />
    </div>
  );
}
