"use client";

import { AnimatePresence, motion } from "framer-motion";
import { MapPin, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { usePreferences } from "@/components/preferences-provider";
import { orderFeed, type OrderStatus } from "@/lib/mock-data";

type FeedOrder = (typeof orderFeed)[number];

const statusSteps: OrderStatus[] = ["incoming", "preparing", "ready", "on_the_way", "delivered"];

export default function OrdersPage() {
  const { formatMoney, t } = usePreferences();
  const [orders, setOrders] = useState(orderFeed);
  const [popup, setPopup] = useState<FeedOrder | null>(null);
  const [selected, setSelected] = useState<FeedOrder | null>(null);

  useEffect(() => {
    const id = setInterval(() => {
      const generated: FeedOrder = {
        id: "VH-" + Math.floor(9300 + Math.random() * 90),
        customer: t("Live Customer", "ቀጥታ ደንበኛ"),
        amount: Number((18 + Math.random() * 30).toFixed(2)),
        status: "incoming",
        eta: `${8 + Math.floor(Math.random() * 12)} min`,
        rider: t("Awaiting assign", "መመደብ በመጠባበቅ ላይ"),
      };
      setOrders((prev) => [generated, ...prev].slice(0, 8));
      setPopup(generated);
    }, 20000);
    return () => clearInterval(id);
  }, [t]);

  const counts = useMemo(
    () => ({
      incoming: orders.filter((o) => o.status === "incoming").length,
      preparing: orders.filter((o) => o.status === "preparing").length,
      delivered: orders.filter((o) => o.status === "delivered").length,
    }),
    [orders]
  );

  return (
    <div className="space-y-6 p-4 md:p-8">
      <header className="card p-6">
        <h1 className="text-3xl font-bold tracking-tight">{t("Order Management", "የትዕዛዝ አስተዳደር")}</h1>
        <p className="mt-2 text-slate-500">{t("Live flow with accept/reject animations and rider tracking map.", "ቀጥታ ፍሰት ከተቀበል/ውድቅ እንቅስቃሴ እና የአቅራቢ ካርታ ጋር።")}</p>
      </header>

      <section className="grid gap-4 md:grid-cols-3">
        <div className="card p-4"><p className="text-sm text-slate-500">Incoming</p><p className="text-3xl font-bold">{counts.incoming}</p></div>
        <div className="card p-4"><p className="text-sm text-slate-500">Preparing</p><p className="text-3xl font-bold">{counts.preparing}</p></div>
        <div className="card p-4"><p className="text-sm text-slate-500">Delivered</p><p className="text-3xl font-bold">{counts.delivered}</p></div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="card p-5">
          <h2 className="text-lg font-semibold">Incoming Queue</h2>
          <div className="mt-4 space-y-3">
            {orders.map((o) => (
              <motion.article key={o.id} layout className="rounded-2xl bg-slate-50 p-3">
                <div className="flex items-center justify-between">
                  <p className="font-semibold">{o.id}</p>
                  <button onClick={() => setSelected(o)} className="text-xs font-semibold text-slate-500">Details</button>
                </div>
                <p className="text-sm text-slate-600">{o.customer} · {formatMoney(o.amount)}</p>
                <div className="mt-3 flex gap-2">
                  <motion.button whileTap={{ scale: 0.95 }} className="rounded-xl bg-emerald-500 px-3 py-1.5 text-xs font-semibold text-white">
                    Accept
                  </motion.button>
                  <motion.button whileTap={{ scale: 0.95 }} className="rounded-xl bg-rose-500 px-3 py-1.5 text-xs font-semibold text-white">
                    Reject
                  </motion.button>
                </div>
              </motion.article>
            ))}
          </div>
        </div>
        <div className="card p-5">
          <h2 className="text-lg font-semibold">Rider Tracking Map</h2>
          <div className="mt-4 rounded-3xl bg-gradient-to-br from-slate-200 to-slate-100 p-5">
            <div className="h-56 rounded-2xl bg-white/70 p-4">
              <div className="flex items-center gap-2 text-slate-700">
                <MapPin className="h-4 w-4" /> Live zones: Downtown, Mission, SoMa
              </div>
              <div className="mt-4 h-40 rounded-xl bg-slate-900/5" />
            </div>
          </div>
        </div>
      </section>

      <AnimatePresence>
        {popup ? (
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 24 }} className="mobile-safe-bottom fixed bottom-2 right-2 z-50 w-[calc(100%-1rem)] max-w-sm rounded-2xl bg-slate-900 p-4 text-white shadow-2xl">
            <button onClick={() => setPopup(null)} className="absolute right-2 top-2"><X className="h-4 w-4" /></button>
            <p className="text-xs uppercase tracking-wide text-slate-300">{t("Live incoming order", "ቀጥታ የገባ ትዕዛዝ")}</p>
            <p className="mt-1 font-semibold">{popup.id} · {formatMoney(popup.amount)}</p>
            <p className="text-sm text-slate-300">{popup.customer}</p>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {selected ? (
          <motion.div className="fixed inset-0 z-50 grid place-items-center bg-slate-900/40 p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} className="card w-full max-w-lg p-6">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold">{t("Order Details", "የትዕዛዝ ዝርዝር")} {selected.id}</h3>
                <button onClick={() => setSelected(null)}><X className="h-5 w-5 text-slate-500" /></button>
              </div>
              <p className="mt-2 text-sm text-slate-600">{selected.customer} · {formatMoney(selected.amount)}</p>
              <div className="mt-4 space-y-3">
                {statusSteps.map((step, idx) => (
                  <div key={step} className="flex items-center gap-3">
                    <span className={`h-3 w-3 rounded-full ${idx <= statusSteps.indexOf(selected.status) ? "bg-slate-900" : "bg-slate-200"}`} />
                    <p className="text-sm capitalize text-slate-700">{step.replaceAll("_", " ")}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
