import Link from "next/link";

export default function CustomerHomePage() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-5xl flex-col justify-center px-6 py-12">
      <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">Customer App</p>
      <h1 className="mt-3 text-4xl font-bold tracking-tight text-slate-950 md:text-6xl">
        Order from local vendors with live delivery updates.
      </h1>
      <p className="mt-4 max-w-2xl text-lg text-slate-600">
        This App Router shell keeps the customer frontend on the same Next.js architecture as vendor and driver while the storefront screens are built out.
      </p>
      <div className="mt-8 flex gap-3">
        <Link className="rounded-md bg-slate-950 px-5 py-3 text-sm font-semibold text-white" href="/">
          Browse vendors
        </Link>
      </div>
    </main>
  );
}
