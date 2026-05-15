"use client";

import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { RevenueChart } from "@/components/revenue-chart";
import { heatmapData, revenueSeries } from "@/lib/mock-data";

export default function AnalyticsPage() {
  return (
    <div className="space-y-6 p-4 md:p-8">
      <header className="card p-6">
        <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
        <p className="mt-2 text-slate-500">Revenue trends, heatmaps, and peak-hour visuals.</p>
      </header>

      <section className="grid gap-4 xl:grid-cols-2">
        <div className="card p-5">
          <h2 className="text-lg font-semibold">Revenue Trends</h2>
          <RevenueChart data={revenueSeries} />
        </div>
        <div className="card p-5">
          <h2 className="text-lg font-semibold">Order Volume</h2>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={revenueSeries}>
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="orders" radius={8} fill="#0f172a" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>

      <section className="card p-6">
        <h2 className="text-lg font-semibold">Peak Hour Heatmap</h2>
        <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
          {heatmapData.map((h) => (
            <div key={h.hour} className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs uppercase text-slate-400">{h.hour}:00</p>
              <div className="mt-2 h-2 rounded-full bg-slate-200">
                <div className="h-2 rounded-full bg-slate-900" style={{ width: `${h.traffic}%` }} />
              </div>
              <p className="mt-2 text-sm font-semibold">{h.traffic}% traffic</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
