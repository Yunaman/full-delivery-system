"use client";

import { Pencil, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import api, { DjangoProduct } from "@/lib/django-api";
import toast from "react-hot-toast";

export default function ProductsPage() {
  const [products, setProducts] = useState<DjangoProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ name: '', price: '', description: '' });

  const loadProducts = async () => {
    try {
      const data = await api.getMyProducts();
      setProducts(data);
    } catch (error) {
      console.error("Failed to load products", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const handleSave = async () => {
    try {
      await api.createProduct({
        name: formData.name,
        price: parseFloat(formData.price),
        description: formData.description,
        is_available: true,
      });
      toast.success("Product added to menu");
      setShowModal(false);
      setFormData({ name: '', price: '', description: '' });
      loadProducts();
    } catch (error) {
      toast.error("Failed to create product");
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to remove this item?")) return;
    try {
      await api.deleteProduct(id.toString());
      toast.success("Item removed");
      loadProducts();
    } catch (error) {
      toast.error("Deletion failed");
    }
  };

  if (loading) return <div className="p-12 text-center text-slate-500 italic">Syncing inventory...</div>;

  return (
    <div className="space-y-6 p-4 md:p-8">
      <header className="card p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 border-slate-100">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Products</h1>
          <p className="mt-1 text-slate-500 font-medium">Manage your digital menu and stock</p>
        </div>
        <button onClick={() => setShowModal(true)} className="rounded-2xl bg-slate-900 px-8 py-3.5 text-sm font-black text-white shadow-xl shadow-slate-900/20 active:scale-95 transition-all">
            + New Item
        </button>
      </header>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {products.map((p) => (
          <article key={p.id} className="card p-6 flex flex-col justify-between hover:border-emerald-200 transition-colors shadow-sm">
            <div>
                <div className="flex justify-between items-start">
                    <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest bg-emerald-50 px-2 py-0.5 rounded-md">{p.category || 'Standard'}</span>
                    <div className="flex gap-1">
                        <button className="p-2 rounded-lg text-slate-400 hover:text-slate-900 hover:bg-slate-100"><Pencil className="h-4 w-4" /></button>
                        <button onClick={() => handleDelete(p.id)} className="p-2 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50"><Trash2 className="h-4 w-4" /></button>
                    </div>
                </div>
                <h3 className="text-lg font-bold text-slate-900 mt-3">{p.name}</h3>
                <p className="text-sm text-slate-500 mt-1 line-clamp-2 min-h-[40px]">{p.description}</p>
                <p className="mt-4 font-black text-xl text-slate-900">${p.price}</p>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${p.stock_quantity > 0 ? "bg-emerald-500" : "bg-rose-500"}`} />
                <span className="text-xs font-bold text-slate-600 uppercase">{p.stock_quantity} in stock</span>
              </div>
              <span className="text-xs font-medium text-slate-400">Sold: {p.total_orders || 0}</span>
            </div>
          </article>
        ))}
        {products.length === 0 && (
            <div className="md:col-span-2 lg:col-span-3 card p-20 text-center border-dashed border-2 bg-transparent text-slate-400">
                No products found. Start by adding your first menu item.
            </div>
        )}
      </div>

      {showModal ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-900/80 p-4 backdrop-blur-sm">
          <div className="card w-full max-w-lg p-10 shadow-2xl border-none">
            <h3 className="text-2xl font-black text-slate-900 mb-8">Add New Product</h3>
            <div className="space-y-6">
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Item Name</label>
                <input
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 font-medium focus:ring-2 focus:ring-slate-900 outline-none transition-all"
                  placeholder="e.g. Signature Spicy Ramen"
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                />
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Price ($)</label>
                <input
                  type="number"
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 font-medium focus:ring-2 focus:ring-slate-900 outline-none transition-all"
                  placeholder="0.00"
                  value={formData.price}
                  onChange={e => setFormData({...formData, price: e.target.value})}
                />
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Description</label>
                <textarea
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 font-medium focus:ring-2 focus:ring-slate-900 outline-none transition-all min-h-[120px]"
                  placeholder="Detail the ingredients and flavors..."
                  value={formData.description}
                  onChange={e => setFormData({...formData, description: e.target.value})}
                />
              </div>
            </div>
            <div className="mt-10 flex items-center justify-end gap-4">
              <button onClick={() => setShowModal(false)} className="px-6 py-3 font-bold text-slate-400 hover:text-slate-900 transition-colors">Cancel</button>
              <button onClick={handleSave} className="rounded-2xl bg-slate-900 px-10 py-4 font-black text-white shadow-xl shadow-slate-900/30 hover:bg-black active:scale-[0.98] transition-all">Save Item</button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
