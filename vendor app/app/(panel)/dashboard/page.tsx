"use client";

import { motion } from "framer-motion";
import { Plus, Truck } from "lucide-react";
import { useEffect, useState } from "react";
import { usePreferences } from "@/components/preferences-provider";
import api from "@/lib/django-api";

export default function DashboardPage() {
  const { formatMoney, t } = usePreferences();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      try {
        const data = await api.getVendorStats();
        setStats(data);
      } catch (error) {
        console.error("Failed to load vendor stats", error);
      } finally {
        setLoading(false);
      }
    }
    loadStats();
  }, []);

  if (loading) return <div className="p-12 text-center text-slate-500">Loading metrics...</div>;

  const summary = [
    { title: t("Revenue", "ገቢ"), value: stats?.summary?.total_revenue || 0, isMoney: true },
    { title: "Orders Today", value: stats?.summary?.today_orders || 0 },
    { title: "Total Orders", value: stats?.summary?.total_orders || 0 },
    { title: "Rating", value: stats?.summary?.rating || 0, suffix: " ★" },
  ];

  return (
    <div className="space-y-6 p-4 md:p-8">
      <header className="card p-6">
        <h1 className="text-3xl font-bold tracking-tight">{t("Vendor Dashboard", "የሻጭ ዳሽቦርድ")}</h1>
      </header>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {summary.map((card) => (
          <motion.article key={card.title} whileHover={{ y: -2 }} className="card p-5">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">{card.title}</p>
            <p className="mt-2 text-3xl font-bold">
              {card.isMoney ? formatMoney(card.value) : card.value}
              {card.suffix || ""}
            </p>
          </motion.article>
        ))}
      </section>

      <section className="grid gap-4 xl:grid-cols-3">
        <div className="card p-6 xl:col-span-2">
          <h2 className="text-lg font-bold mb-4 text-slate-900">Top Selling Products</h2>
          <div className="space-y-3">
            {stats?.popular_products?.map((p: any) => (
              <div key={p.product__name} className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3 text-sm">
                <p className="font-semibold text-slate-700">{p.product__name}</p>
                <p className="font-bold text-slate-900">{p.total_sold} units sold</p>
              </div>
            ))}
            {(!stats?.popular_products || stats.popular_products.length === 0) && (
                <p className="text-slate-400 italic">No sales data recorded yet.</p>
            )}
          </div>
        </div>
        <div className="card p-6">
          <h2 className="text-lg font-bold mb-4 text-slate-900">Order Status</h2>
          <div className="space-y-3">
            {Object.entries(stats?.order_status_breakdown || {}).map(([status, count]) => (
              <div key={status} className="flex items-center justify-between text-sm">
                <span className="capitalize font-medium text-slate-600">{status.replace('_', ' ')}</span>
                <span className="font-bold text-slate-900">{count as number}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="mobile-safe-bottom fixed bottom-20 right-4 z-20 flex flex-col gap-2 lg:bottom-8 lg:right-6">
        <button className="ios-pill flex items-center gap-2 px-5 py-3 text-sm font-bold text-white bg-slate-900 shadow-xl transition active:scale-95">
          <Plus className="h-4 w-4" /> New Product
        </button>
      </div>
    </div>
  );
}
