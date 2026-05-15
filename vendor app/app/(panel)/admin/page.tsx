"use client";

import { usePreferences } from "@/components/preferences-provider";
import { RevenueChart } from "@/components/revenue-chart";
import { revenueSeries } from "@/lib/mock-data";

export default function AdminPage() {
  const { formatMoney, t } = usePreferences();
  return (
    <div className="space-y-6 p-4 md:p-8">
      <header className="card p-6">
        <h1 className="text-3xl font-bold tracking-tight">{t("Admin Panel", "የአስተዳዳሪ ፓነል")}</h1>
        <p className="mt-2 text-slate-500">{t("Platform analytics, approvals, coupons, and user controls.", "የፕላትፎርም ትንታኔ፣ ፍቃድ መስጠት፣ ኩፖኖች እና የተጠቃሚ መቆጣጠሪያዎች።")}</p>
      </header>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          { k: "Active Vendors", v: "1,284" },
          { k: "Pending Approvals", v: "43" },
          { k: "Platform Revenue", v: formatMoney(428000) },
          { k: "Coupon Redemptions", v: "12.8k" },
        ].map((item) => (
          <article key={item.k} className="card p-5">
            <p className="text-sm text-slate-500">{item.k}</p>
            <p className="mt-1 text-2xl font-bold">{item.v}</p>
          </article>
        ))}
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <article className="card p-5">
          <h2 className="text-lg font-semibold">Platform Revenue Insights</h2>
          <RevenueChart data={revenueSeries} />
        </article>
        <article className="card p-5">
          <h2 className="text-lg font-semibold">Vendor Approvals Queue</h2>
          <div className="mt-4 space-y-3">
            {["Bistro Atlas", "Tokyo Bite", "Green Pot"].map((v) => (
              <div key={v} className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3">
                <span className="font-medium">{v}</span>
                <div className="space-x-2">
                  <button className="rounded-xl bg-emerald-500 px-3 py-1.5 text-xs font-semibold text-white">Approve</button>
                  <button className="rounded-xl bg-rose-500 px-3 py-1.5 text-xs font-semibold text-white">Reject</button>
                </div>
              </div>
            ))}
          </div>
        </article>
      </section>
    </div>
  );
}
