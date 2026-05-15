"use client";

import { useEffect, useState } from "react";
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { RevenueChart } from "@/components/revenue-chart";
import api from "@/lib/django-api";

export default function AnalyticsPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadAnalytics() {
      try {
        const res = await api.getRevenueAnalytics();
        setData(res);
      } catch (error) {
        console.error("Failed to load analytics", error);
      } finally {
        setLoading(false);
      }
    }
    loadAnalytics();
  }, []);

  if (loading) return <div className="p-12 text-center text-slate-500 italic">Syncing business insights...</div>;

  const chartData = data?.daily_breakdown?.map((d: any) => ({
    day: d.date,
    revenue: d.revenue,
    orders: d.orders
  })) || [];

  return (
    <div className="space-y-6 p-4 md:p-8">
      <header className="card p-6 border-slate-100">
        <h1 className="text-3xl font-black tracking-tight text-slate-900">Analytics</h1>
        <p className="mt-1 text-slate-500 font-medium">Real-time revenue trends and order volume</p>
      </header>

      <section className="grid gap-6 xl:grid-cols-2">
        <div className="card p-8 shadow-sm">
          <h2 className="text-sm font-black uppercase tracking-widest text-slate-400 mb-6">Revenue Trend</h2>
          <RevenueChart data={chartData} />
        </div>
        <div className="card p-8 shadow-sm">
          <h2 className="text-sm font-black uppercase tracking-widest text-slate-400 mb-6">Daily Orders</h2>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <XAxis dataKey="day" hide />
                <YAxis hide />
                <Tooltip
                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)' }}
                />
                <Bar dataKey="orders" radius={8} fill="#10b981" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="card p-6 bg-slate-900 text-white border-none">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total Revenue</p>
              <p className="text-2xl font-black mt-2">${data?.summary?.total_revenue?.toFixed(2) || "0.00"}</p>
          </div>
          <div className="card p-6 border-slate-100">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Order Count</p>
              <p className="text-2xl font-black mt-2 text-slate-900">{data?.summary?.total_orders || 0}</p>
          </div>
          <div className="card p-6 border-slate-100">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Average Value</p>
              <p className="text-2xl font-black mt-2 text-slate-900">${data?.summary?.avg_order_value?.toFixed(2) || "0.00"}</p>
          </div>
      </div>
    </div>
  );
}
