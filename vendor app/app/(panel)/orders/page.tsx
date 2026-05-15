"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { usePreferences } from "@/components/preferences-provider";
import api, { DjangoOrder } from "@/lib/django-api";
import toast from "react-hot-toast";

export default function OrdersPage() {
  const { formatMoney, t } = usePreferences();
  const [orders, setOrders] = useState<DjangoOrder[]>([]);
  const [loading, setLoading] = useState(true);

  const loadOrders = async () => {
    try {
      const data = await api.getMyOrders();
      setOrders(data);
    } catch (error) {
      console.error("Failed to load orders", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
    const interval = setInterval(loadOrders, 15000);
    return () => clearInterval(interval);
  }, []);

  const handleUpdateStatus = async (orderId: string, status: string) => {
    try {
      await api.updateOrderStatus(orderId, status);
      toast.success(`Order updated: ${status}`);
      loadOrders();
    } catch (error) {
      toast.error("Status update failed");
    }
  };

  if (loading) return <div className="p-12 text-center text-slate-500">Syncing orders...</div>;

  return (
    <div className="space-y-6 p-4 md:p-8 text-slate-900">
      <header className="card p-6 border-slate-100">
        <h1 className="text-3xl font-bold tracking-tight">{t("Order Management", "የትዕዛዝ አስተዳደር")}</h1>
        <p className="text-slate-500 mt-1">Live order feed connected to Django</p>
      </header>

      <div className="grid gap-6">
        {orders.length === 0 ? (
          <div className="card p-20 text-center text-slate-400 italic">No orders pending.</div>
        ) : (
          orders.map((o) => (
            <motion.article key={o.id} layout className="card p-6 shadow-sm border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:border-emerald-200 transition-colors">
              <div>
                <div className="flex items-center gap-3">
                    <span className="text-lg font-black text-slate-900">#{o.order_number.slice(-6)}</span>
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-[10px] font-bold text-slate-600 uppercase tracking-widest">{o.status}</span>
                </div>
                <div className="mt-2 text-sm">
                    <p className="font-bold text-slate-800">{o.customer_name}</p>
                    <p className="text-slate-500">{o.delivery_address}</p>
                </div>
              </div>

              <div className="flex flex-col md:items-end gap-4">
                <p className="text-xl font-black text-emerald-700">{formatMoney(o.total_price)}</p>
                <div className="flex gap-2">
                  {o.status === 'pending' && (
                    <button
                      onClick={() => handleUpdateStatus(o.id.toString(), 'confirmed')}
                      className="rounded-xl bg-emerald-600 px-6 py-2.5 text-xs font-bold text-white shadow-lg shadow-emerald-600/20 active:scale-95 transition-all"
                    >
                      Accept Order
                    </button>
                  )}
                  {o.status === 'confirmed' && (
                    <button
                      onClick={() => handleUpdateStatus(o.id.toString(), 'preparing')}
                      className="rounded-xl bg-amber-500 px-6 py-2.5 text-xs font-bold text-white shadow-lg shadow-amber-500/20 active:scale-95 transition-all"
                    >
                      Start Kitchen
                    </button>
                  )}
                  {o.status === 'preparing' && (
                    <button
                      onClick={() => handleUpdateStatus(o.id.toString(), 'ready')}
                      className="rounded-xl bg-blue-600 px-6 py-2.5 text-xs font-bold text-white shadow-lg shadow-blue-600/20 active:scale-95 transition-all"
                    >
                      Set Ready
                    </button>
                  )}
                </div>
              </div>
            </motion.article>
          ))
        )}
      </div>
    </div>
  );
}
