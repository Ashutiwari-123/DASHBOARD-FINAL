import Link from "next/link";

export default function NotFound() {
  return (
    <main className="grid min-h-screen place-items-center bg-slate-950 text-center text-slate-100">
      <div>
        <h1 className="text-3xl font-semibold">Page not found</h1>
        <Link className="mt-4 inline-block text-emerald-400" href="/">
          Return to dashboard
        </Link>
      </div>
    </main>
  );
}
