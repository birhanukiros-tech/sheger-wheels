import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-[70vh] items-center justify-center bg-slate-50 px-4 py-16">
      <section className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm sm:p-10">
        <p className="text-7xl font-extrabold tracking-tight text-[#0866F5]">
          404
        </p>

        <div className="mx-auto mt-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-3xl">
          🚗
        </div>

        <h1 className="mt-6 text-2xl font-bold tracking-tight text-slate-900">
          We couldn't find that page
        </h1>

        <p className="mt-3 text-sm leading-6 text-slate-600">
          The page may have moved, the link may be incorrect, or the item
          you're looking for may no longer be available.
        </p>

        <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
          <Link
            href="/"
            className="inline-flex min-h-12 items-center justify-center rounded-lg bg-[#0866F5] px-6 py-3 font-semibold text-white transition hover:bg-[#0754C7] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Back to home
          </Link>

          <Link
            href="/cars"
            className="inline-flex min-h-12 items-center justify-center rounded-lg border border-slate-300 bg-white px-6 py-3 font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            Browse cars
          </Link>
        </div>
      </section>
    </main>
  );
}
