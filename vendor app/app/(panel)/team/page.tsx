"use client";

import { useState } from "react";

const staff = [
  { id: "1", name: "Dana Lee", role: "Operations Lead" },
  { id: "2", name: "Ravi Patel", role: "Kitchen Manager" },
  { id: "3", name: "Mia Chen", role: "Dispatch Coordinator" },
];

export default function TeamPage() {
  const [permissions, setPermissions] = useState<Record<string, boolean>>({
    orders: true,
    products: true,
    analytics: false,
    admin: false,
  });

  return (
    <div className="space-y-6 p-4 md:p-8">
      <header className="card p-6">
        <h1 className="text-3xl font-bold tracking-tight">Staff & Roles</h1>
        <p className="mt-2 text-slate-500">Team cards with role-based permission toggles.</p>
      </header>

      <section className="grid gap-4 md:grid-cols-3">
        {staff.map((s) => (
          <article key={s.id} className="card p-5">
            <div className="h-12 w-12 rounded-2xl bg-slate-200" />
            <h3 className="mt-3 text-lg font-semibold">{s.name}</h3>
            <p className="text-sm text-slate-500">{s.role}</p>
          </article>
        ))}
      </section>

      <section className="card p-6">
        <h2 className="text-lg font-semibold">Permissions</h2>
        <div className="mt-4 space-y-3">
          {Object.keys(permissions).map((p) => (
            <label key={p} className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3 capitalize">
              <span>{p}</span>
              <button
                onClick={() => setPermissions((prev) => ({ ...prev, [p]: !prev[p] }))}
                className={`h-8 w-14 rounded-full p-1 transition ${permissions[p] ? "bg-slate-900" : "bg-slate-300"}`}
              >
                <span className={`block h-6 w-6 rounded-full bg-white transition ${permissions[p] ? "translate-x-6" : ""}`} />
              </button>
            </label>
          ))}
        </div>
      </section>
    </div>
  );
}
