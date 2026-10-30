"use client";

export default function Error({ error, reset }) {
  return (
    <main className="flex min-h-[60vh] items-center justify-center bg-slate-50 px-4 py-16">
      <section className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm sm:p-10">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50 text-3xl text-red-600">
          !
        </div>

        <p className="mt-6 text-sm font-semibold uppercase tracking-wider text-[#0866F5]">
          Something went wrong
        </p>

        <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
          We couldn&apos;t load this page
        </h1>

        <p className="mt-3 text-sm leading-6 text-slate-600">
          Something unexpected happened. You can try loading the page again.
          Your booking information may still be available.
        </p>

        <button
          type="button"
          onClick={() => reset()}
          className="mt-7 inline-flex min-h-12 items-center justify-center rounded-lg bg-[#0866F5] px-6 py-3 font-semibold text-white transition hover:bg-[#0754C7] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          Try again
        </button>

        <p className="mt-4 text-xs text-slate-400">
          If the problem continues, return to the previous page and try again.
        </p>
      </section>
    </main>
  );
}