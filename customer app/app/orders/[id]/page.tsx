"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import api, { Order } from "@/lib/api";
import { cn } from "@/lib/utils";

export default function OrderTrackingPage() {
  const { id } = useParams() as { id: string };
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadOrder() {
      try {
        const res = await api.getOrder(id);
        setOrder(res);
      } catch (error) {
        console.error("Tracking update failed", error);
      } finally {
        setLoading(false);
      }
    }
    loadOrder();
    const interval = setInterval(loadOrder, 8000);
    return () => clearInterval(interval);
  }, [id]);

  if (loading) return <div className="p-12 text-center text-slate-500 italic">Connecting to live tracking...</div>;
  if (!order) return <div className="p-12 text-center font-bold">Order not found.</div>;

  const steps = [
    { key: "pending", label: "Order Received", active: true },
    { key: "confirmed", label: "Vendor Confirmed", active: ["confirmed", "preparing", "ready", "picked_up", "in_transit", "delivered", "completed"].includes(order.status) },
    { key: "preparing", label: "In the Kitchen", active: ["preparing", "ready", "picked_up", "in_transit", "delivered", "completed"].includes(order.status) },
    { key: "ready", label: "Ready for Pickup", active: ["ready", "picked_up", "in_transit", "delivered", "completed"].includes(order.status) },
    { key: "picked_up", label: "Out for Delivery", active: ["picked_up", "in_transit", "delivered", "completed"].includes(order.status) },
    { key: "delivered", label: "Enjoy!", active: ["delivered", "completed"].includes(order.status) },
  ];

  return (
    <div className="mx-auto max-w-2xl px-6 py-12">
      <div className="flex justify-between items-center mb-10">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Track Order</h1>
          <p className="text-slate-500 text-sm font-medium mt-1">Order #{order.order_number.slice(-6)} · {order.vendor_name}</p>
        </div>
        <div className="bg-emerald-600 text-white px-5 py-2 rounded-full font-bold text-xs uppercase tracking-widest shadow-lg shadow-emerald-600/20">
          {order.status_display}
        </div>
      </div>

      <div className="card p-10 mb-10 relative overflow-hidden border-slate-100 shadow-sm">
        <div className="absolute top-0 left-0 w-1 h-full bg-emerald-600/10" />
        <div className="relative space-y-10">
          {steps.map((step, idx) => (
            <div key={step.key} className="flex gap-6 items-center">
              <div className={cn(
                "w-7 h-7 rounded-full border-4 flex items-center justify-center text-[10px] font-bold z-10",
                step.active ? "bg-emerald-600 border-emerald-100 text-white" : "bg-white border-slate-100 text-slate-300"
              )}>
                {step.active ? "✓" : idx + 1}
              </div>
              <span className={cn(
                "font-bold text-base transition-colors",
                step.active ? "text-slate-900" : "text-slate-300"
              )}>
                {step.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="card p-8 border-slate-50 bg-slate-50/30">
        <h2 className="font-bold text-slate-900 text-sm uppercase tracking-widest mb-6">Delivery Details</h2>
        <div className="space-y-4">
            <div className="flex gap-4">
                <span className="text-slate-400">🏠</span>
                <p className="text-sm font-medium text-slate-700">{order.delivery_address}</p>
            </div>
            {order.driver_name && (
                <div className="flex gap-4 items-center pt-4 border-t border-slate-100">
                    <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold text-xs">
                        {order.driver_name.slice(0, 1)}
                    </div>
                    <div>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-tight">Your Courier</p>
                        <p className="text-sm font-bold text-slate-900">{order.driver_name}</p>
                    </div>
                </div>
            )}
        </div>
      </div>
    </div>
  );
}
