
import Link from "next/link";

const dashboardLinks = [
  {
    title: "Browse cars",
    description: "Find a car for your next journey.",
    href: "/cars",
    action: "Explore cars",
  },
  {
    title: "My bookings",
    description: "View and manage your rental bookings.",
    href: "/bookings",
    action: "View bookings",
  },
];

export default function RenterDashboardPage() {
  return (
    <section className="min-h-[70vh] bg-surface px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8">
          <p className="text-sm font-semibold uppercase tracking-wider text-primary">
            Renter dashboard
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Welcome to Sheggar Wheels
          </h1>
          <p className="mt-3 max-w-2xl text-base leading-7 text-muted">
            Manage your rental journey from one place. Explore available cars
            or check your bookings whenever you need to.
          </p>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          {dashboardLinks.map((item) => (
            <article
              key={item.href}
              className="rounded-2xl border border-border bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md sm:p-8"
            >
              <h2 className="text-xl font-bold text-foreground">
                {item.title}
              </h2>
              <p className="mt-3 leading-6 text-muted">
                {item.description}
              </p>
              <Link
                href={item.href}
                className="mt-6 inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-white transition hover:bg-primary-hover"
              >
                {item.action}
                <span aria-hidden="true">→</span>
              </Link>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
