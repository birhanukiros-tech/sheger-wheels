
import Link from "next/link";
import {
  CarFront,
  Users,
  CalendarCheck,
  MessageSquareWarning,
  ChartNoAxesCombined,
  Megaphone,
  ArrowRight,
} from "lucide-react";

import AdminDashboardShell from "@/components/admin/AdminDashboardShell";

const managementSections = [
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

export default function AdminDashboardPage() {
  return (
    <AdminDashboardShell>
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

        <section aria-labelledby="management-heading">
          <div className="mb-5">
            <h2
              id="management-heading"
              className="text-lg font-bold text-slate-900"
            >
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
                      <Icon size={22} aria-hidden="true" />
                    </div>

                    <ArrowRight
                      size={19}
                      aria-hidden="true"
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
                    <ArrowRight size={15} aria-hidden="true" />
                  </p>
                </Link>
              );
            })}
          </div>
        </section>
      </main>
    </AdminDashboardShell>
  );
}
