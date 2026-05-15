"use client";

import { motion } from "framer-motion";
import { Activity, Plus, Truck, Zap } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { usePreferences } from "@/components/preferences-provider";
import { RevenueChart } from "@/components/revenue-chart";
import { activityFeed, orderFeed, revenueSeries, topProducts } from "@/lib/mock-data";

function Counter({ value, prefix = "" }: { value: number; prefix?: string }) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    let i = 0;
    const id = setInterval(() => {
      i += Math.ceil(value / 24);
      setCount(Math.min(value, i));
      if (i >= value) clearInterval(id);
    }, 35);
    return () => clearInterval(id);
  }, [value]);
  return <span>{prefix}{count.toLocaleString()}</span>;
}

export default function DashboardPage() {
  const { formatMoney, t } = usePreferences();
  useEffect(() => {
    const id = setInterval(() => {
      toast(t("New order incoming", "አዲስ ትዕዛዝ ገብቷል"), {
        description: t("Order ", "ትዕዛዝ ") + "VH-92" + Math.floor(Math.random() * 100),
      });
    }, 14000);
    return () => clearInterval(id);
  }, [t]);

  return (
    <div className="space-y-6 p-4 md:p-8">
      <header className="card p-6">
        <p className="text-sm text-slate-500">{t("Good afternoon, Pablo", "እንደምን አመሻችሁ ፓብሎ")}</p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight">{t("Vendor Dashboard", "የሻጭ ዳሽቦርድ")}</h1>
      </header>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          { title: t("Revenue", "ገቢ"), value: 32840, prefix: "" },
          { title: "Pending Orders", value: 43 },
          { title: "Deliveries Live", value: 12 },
          { title: "Conversion", value: 93, suffix: "%" },
        ].map((card) => (
          <motion.article key={card.title} whileHover={{ y: -3 }} className="card p-5">
            <p className="text-sm text-slate-500">{card.title}</p>
            <p className="mt-2 text-3xl font-bold">
              {card.title === t("Revenue", "ገቢ") ? formatMoney(card.value) : <Counter value={card.value} prefix={card.prefix} />}
              {"suffix" in card ? card.suffix : ""}
            </p>
          </motion.article>
        ))}
      </section>

      <section className="grid gap-4 xl:grid-cols-3">
        <div className="card p-5 xl:col-span-2">
          <h2 className="text-lg font-semibold">Sales Graph</h2>
          <p className="text-sm text-slate-500">Revenue trend this week</p>
          <RevenueChart data={revenueSeries} />
        </div>
        <div className="card p-5">
          <h2 className="text-lg font-semibold">Live Pending Orders</h2>
          <div className="mt-4 space-y-3">
            {orderFeed.map((order) => (
              <div key={order.id} className="rounded-2xl bg-slate-50 p-3">
                <div className="flex items-center justify-between text-sm">
                  <p className="font-semibold">{order.id}</p>
                  <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-700">{order.status}</span>
                </div>
                <p className="mt-1 text-sm text-slate-600">{order.customer} · {formatMoney(order.amount)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <div className="card p-5">
          <h2 className="text-lg font-semibold">Top Products</h2>
          <div className="mt-4 space-y-3">
            {topProducts.map((p) => (
              <div key={p.id} className="flex items-center justify-between rounded-2xl bg-slate-50 p-3 text-sm">
                <div>
                  <p className="font-semibold">{p.name}</p>
                  <p className="text-slate-500">{p.category}</p>
                </div>
                <p className="font-semibold">{p.sold} sold</p>
              </div>
            ))}
          </div>
        </div>
        <div className="card p-5">
          <h2 className="text-lg font-semibold">Recent Activity</h2>
          <div className="mt-4 space-y-4">
            {activityFeed.map((a) => (
              <div key={a.id} className="relative pl-6">
                <span className="absolute left-0 top-1.5 h-2.5 w-2.5 rounded-full bg-slate-900" />
                <p className="text-xs text-slate-400">{a.time}</p>
                <p className="text-sm text-slate-700">{a.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="mobile-safe-bottom fixed bottom-20 right-4 z-20 flex flex-col gap-2 lg:bottom-8 lg:right-6">
        {[
          { icon: Plus, label: "New Product" },
          { icon: Activity, label: "New Campaign" },
          { icon: Truck, label: "Dispatch" },
          { icon: Zap, label: "Quick Boost" },
        ].map((action) => (
          <button key={action.label} className="ios-pill flex items-center gap-2 px-4 py-2 text-sm font-semibold text-slate-900 transition active:scale-95 dark:text-slate-100">
            <action.icon className="h-4 w-4" />
            {action.label}
          </button>
        ))}
      </div>
    </div>
  );
}
