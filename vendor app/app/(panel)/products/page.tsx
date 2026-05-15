"use client";

import { ImagePlus, Pencil } from "lucide-react";
import { useState } from "react";
import { topProducts } from "@/lib/mock-data";

export default function ProductsPage() {
  const [dragging, setDragging] = useState(false);
  const [showModal, setShowModal] = useState(false);

  return (
    <div className="space-y-6 p-4 md:p-8">
      <header className="card p-6">
        <h1 className="text-3xl font-bold tracking-tight">Product Management</h1>
        <p className="mt-2 text-slate-500">Beautiful cards, add/edit modal, categories, and inventory bars.</p>
      </header>

      <section className="grid gap-4 lg:grid-cols-3">
        <button
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => { e.preventDefault(); setDragging(false); }}
          className={`card flex min-h-48 flex-col items-center justify-center p-6 text-center ${dragging ? "border-slate-900" : ""}`}
        >
          <ImagePlus className="h-10 w-10 text-slate-400" />
          <p className="mt-3 font-semibold">Drag & drop product images</p>
          <p className="text-sm text-slate-500">PNG, JPG up to 10MB</p>
        </button>
        <div className="card p-6 lg:col-span-2">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Categories with icons</h2>
            <button onClick={() => setShowModal(true)} className="rounded-xl bg-slate-900 px-3 py-2 text-sm font-semibold text-white">Add Product</button>
          </div>
          <div className="mt-4 flex flex-wrap gap-2 text-sm">
            {["Pizza", "Burger", "Bowls", "Drinks", "Desserts"].map((c) => (
              <span key={c} className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1">{c}</span>
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {topProducts.map((p) => {
          const progress = Math.max(10, Math.min(100, p.stock));
          return (
            <article key={p.id} className="card p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-slate-500">{p.category}</p>
                  <h3 className="text-lg font-semibold">{p.name}</h3>
                </div>
                <button className="rounded-xl bg-slate-100 p-2"><Pencil className="h-4 w-4" /></button>
              </div>
              <p className="mt-4 text-sm text-slate-500">Inventory</p>
              <div className="mt-2 h-2 rounded-full bg-slate-100">
                <div className="h-2 rounded-full bg-slate-900" style={{ width: `${progress}%` }} />
              </div>
              <p className="mt-2 text-xs text-slate-500">{p.stock} units left</p>
            </article>
          );
        })}
      </section>

      {showModal ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-900/40 p-4">
          <div className="card w-full max-w-lg p-6">
            <h3 className="text-xl font-semibold">Fast Add / Edit Product</h3>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <input className="rounded-xl border border-slate-200 px-3 py-2" placeholder="Product name" />
              <input className="rounded-xl border border-slate-200 px-3 py-2" placeholder="Price" />
              <select className="rounded-xl border border-slate-200 px-3 py-2 sm:col-span-2">
                <option>Category</option>
              </select>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button onClick={() => setShowModal(false)} className="rounded-xl border border-slate-200 px-4 py-2">Cancel</button>
              <button onClick={() => setShowModal(false)} className="rounded-xl bg-slate-900 px-4 py-2 font-semibold text-white">Save</button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
