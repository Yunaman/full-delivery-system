"use client";

import { usePreferences } from "@/components/preferences-provider";

export default function AdminPage() {
  const { formatMoney, t } = usePreferences();
  return (
    <div className="space-y-6 p-4 md:p-8">
      <header className="card p-6">
        <h1 className="text-3xl font-bold tracking-tight">{t("Admin Panel", "የአስተዳዳሪ ፓነል")}</h1>
        <p className="mt-2 text-slate-500">{t("Platform analytics and vendor approvals.", "የፕላትፎርም ትንታኔ እና የሻጭ ፍቃድ።")}</p>
      </header>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {[
          { k: "Active Vendors", v: "..." },
          { k: "Pending Orders", v: "..." },
          { k: "Total Revenue", v: "..." },
        ].map((item) => (
          <article key={item.k} className="card p-5">
            <p className="text-sm text-slate-500 font-bold uppercase tracking-wider">{item.k}</p>
            <p className="mt-2 text-2xl font-black">{item.v}</p>
          </article>
        ))}
      </section>

      <section className="card p-8 border-dashed border-2 bg-transparent text-center text-slate-400">
        Admin aggregated metrics loading from central controller...
      </section>
    </div>
  );
}
