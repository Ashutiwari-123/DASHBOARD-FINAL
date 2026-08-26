"use client";

export default function ErrorPage({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="grid min-h-screen place-items-center bg-slate-950 px-6 text-slate-100">
      <div className="text-center">
        <h1 className="text-2xl font-semibold">Something went wrong</h1>
        <p className="mt-2 text-slate-400">
          The dashboard could not be loaded.
        </p>
        <button
          className="mt-6 rounded-lg bg-emerald-500 px-4 py-2 font-medium text-slate-950"
          onClick={reset}
        >
          Try again
        </button>
      </div>
    </main>
  );
}
