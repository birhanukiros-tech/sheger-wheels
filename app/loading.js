
export default function Loading() {
  return (
    <main className="flex min-h-[60vh] items-center justify-center bg-slate-50 px-4 py-16">
      <div
        className="flex flex-col items-center text-center"
        role="status"
        aria-live="polite"
      >
        <div className="relative flex h-16 w-16 items-center justify-center">
          <div className="absolute inset-0 animate-spin rounded-full border-4 border-blue-100 border-t-[#0866F5]" />
          <span className="text-2xl" aria-hidden="true">
            🚗
          </span>
        </div>

        <h2 className="mt-6 text-xl font-bold text-slate-900">
          Getting things ready
        </h2>

        <p className="mt-2 max-w-sm text-sm leading-6 text-slate-600">
          Please wait while we prepare your Sheggar Wheels experience.
        </p>
      </div>
    </main>
  );
}
