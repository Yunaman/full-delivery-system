import Link from "next/link";

export default function LandingPage() {
  return (
    <div className="bg-[#f6f7fb]">
      <header className="mx-auto flex max-w-7xl items-center justify-between px-6 py-6">
        <h1 className="text-2xl font-bold tracking-tight">VendorHub</h1>
        <div className="flex gap-3">
          <Link
            href="/login"
            className="inline-flex h-10 items-center rounded-full border border-[#1c1d1f] bg-white px-5 text-sm font-bold text-[#1c1d1f] transition hover:bg-[#f7f9fa] active:scale-95"
          >
            Log in
          </Link>
          <Link
            href="/register"
            className="inline-flex h-10 items-center rounded-full bg-[#1c1d1f] px-5 text-sm font-bold text-white transition hover:bg-black active:scale-95"
          >
            Get started
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-7xl space-y-12 px-6 pb-20 pt-8">
        <section className="grid items-center gap-8 lg:grid-cols-2">
          <div>
            <p className="mb-3 inline-block rounded-full bg-white px-4 py-1 text-xs font-semibold uppercase tracking-wide text-slate-600">
              Built for modern food vendors
            </p>
            <h2 className="text-5xl font-bold leading-tight tracking-tight text-slate-900">
              Run your delivery business from one beautiful dashboard.
            </h2>
            <p className="mt-4 max-w-xl text-lg text-slate-600">
              Order flow, product control, analytics, team permissions, and admin insights in a clean premium UX.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/dashboard" className="rounded-full bg-slate-900 px-6 py-3 font-semibold text-white">
                Open Dashboard
              </Link>
              <Link href="/register" className="rounded-full border border-slate-300 px-6 py-3 font-semibold">
                Try for Free
              </Link>
            </div>
          </div>
          <div className="card p-6">
            <div className="grid gap-4 md:grid-cols-2">
              {["Revenue", "Orders", "Payout", "SLA"].map((k) => (
                <div key={k} className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-sm text-slate-500">{k}</p>
                  <p className="mt-1 text-2xl font-bold text-slate-900">ETB 12.4k</p>
                </div>
              ))}
            </div>
            <div className="mt-4 h-32 rounded-2xl bg-gradient-to-r from-slate-900 to-slate-700" />
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          {[
            "Live order pipeline with smooth status transitions",
            "Product management with inventory and category control",
            "Advanced analytics with trends and peak-hour heatmaps",
          ].map((f) => (
            <article key={f} className="card p-6">
              <h3 className="text-lg font-semibold text-slate-900">Feature</h3>
              <p className="mt-2 text-sm text-slate-600">{f}</p>
            </article>
          ))}
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          {["Starter", "Growth", "Enterprise"].map((plan, i) => (
            <article key={plan} className={`card p-6 ${i === 1 ? "border-slate-900" : ""}`}>
              <h3 className="text-xl font-bold">{plan}</h3>
              <p className="mt-2 text-slate-600">Perfect for modern delivery operations.</p>
              <p className="mt-5 text-3xl font-bold">ETB {(i * 29 + 29) * 1000}</p>
              <button className="mt-6 w-full rounded-2xl bg-slate-900 py-2.5 font-semibold text-white">Choose plan</button>
            </article>
          ))}
        </section>
      </main>

      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-8 text-sm text-slate-500">
          <p>© {new Date().getFullYear()} VendorHub. Premium delivery software UI.</p>
          <p>Terms · Privacy · Contact</p>
        </div>
      </footer>
    </div>
  );
}
