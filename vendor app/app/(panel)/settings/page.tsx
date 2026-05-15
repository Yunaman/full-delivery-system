"use client";

import { useState } from "react";

export default function SettingsPage() {
  const [toggles, setToggles] = useState({
    autoAccept: true,
    smartDispatch: true,
    holidayMode: false,
  });

  return (
    <div className="space-y-6 p-4 md:p-8">
      <header className="card p-6">
        <h1 className="text-3xl font-bold tracking-tight">Store Settings</h1>
        <p className="mt-2 text-slate-500">Logo uploader, hours scheduler, delivery map and animated toggles.</p>
      </header>

      <section className="grid gap-4 lg:grid-cols-2">
        <article className="card p-5">
          <h2 className="font-semibold">Logo Uploader</h2>
          <div className="mt-3 flex h-40 items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50">
            Drop logo here
          </div>
        </article>
        <article className="card p-5">
          <h2 className="font-semibold">Working Hours Scheduler</h2>
          <div className="mt-3 space-y-2">
            {["Mon-Fri", "Saturday", "Sunday"].map((d) => (
              <div key={d} className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2 text-sm">
                <span>{d}</span>
                <span>09:00 - 22:00</span>
              </div>
            ))}
          </div>
        </article>
      </section>

      <article className="card p-5">
        <h2 className="font-semibold">Delivery Zone Map</h2>
        <div className="mt-3 h-48 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200" />
      </article>

      <article className="card p-5">
        <h2 className="font-semibold">Automation Toggles</h2>
        <div className="mt-4 space-y-3">
          {Object.entries(toggles).map(([key, value]) => (
            <label key={key} className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3 capitalize">
              <span>{key}</span>
              <button
                onClick={() => setToggles((prev) => ({ ...prev, [key]: !prev[key as keyof typeof prev] }))}
                className={`h-8 w-14 rounded-full p-1 transition ${value ? "bg-slate-900" : "bg-slate-300"}`}
              >
                <span className={`block h-6 w-6 rounded-full bg-white transition ${value ? "translate-x-6" : ""}`} />
              </button>
            </label>
          ))}
        </div>
      </article>
    </div>
  );
}
