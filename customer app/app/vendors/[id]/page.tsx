"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import api, { Vendor, Product } from "@/lib/api";

export default function VendorDetailPage() {
  const { id } = useParams() as { id: string };
  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [vRes, pRes] = await Promise.all([
          api.getVendor(id),
          api.getProducts({ vendor: id })
        ]);
        setVendor(vRes);
        setProducts(pRes.results || []);
      } catch (error) {
        console.error("Failed to load store details", error);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [id]);

  if (loading) return <div className="p-8 text-center text-slate-500">Loading menu...</div>;
  if (!vendor) return <div className="p-8 text-center">Store not found.</div>;

  return (
    <div className="mx-auto max-w-5xl px-6 py-8">
      <div className="card p-8 mb-8 bg-emerald-700 text-white rounded-3xl">
        <h1 className="text-4xl font-bold">{vendor.shop_name}</h1>
        <p className="opacity-80 mt-2">{vendor.description}</p>
        <div className="mt-6 flex gap-4 text-sm font-medium">
          <span>⭐ {vendor.rating?.toFixed(1) || "N/A"}</span>
          <span>•</span>
          <span>{vendor.vendor_type}</span>
          <span>•</span>
          <span>{vendor.preparation_time} min</span>
        </div>
      </div>

      <div className="grid gap-12 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <h2 className="text-2xl font-bold mb-6">Menu</h2>
          <div className="grid gap-6">
            {products.map((product) => (
              <div key={product.id} className="card p-5 flex gap-4 hover:border-emerald-200 transition-colors">
                <div className="flex-1">
                  <h3 className="font-bold text-lg">{product.name}</h3>
                  <p className="text-slate-500 text-sm mt-1 line-clamp-2">{product.description}</p>
                  <p className="font-bold mt-4 text-emerald-700">${product.current_price?.toFixed(2) || "0.00"}</p>
                </div>
                {product.image_url && (
                  <img src={product.image_url} alt={product.name} className="w-24 h-24 rounded-2xl object-cover shrink-0 bg-slate-50" />
                )}
              </div>
            ))}
            {products.length === 0 && (
              <p className="text-slate-500 italic">No products available at this store yet.</p>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="card p-6 sticky top-8">
            <h2 className="font-bold text-xl mb-4">Store Info</h2>
            <div className="space-y-4 text-sm">
              <div>
                <p className="text-slate-500 font-bold uppercase text-[10px] tracking-wider">Address</p>
                <p className="mt-1 font-medium">{vendor.address}, {vendor.city}</p>
              </div>
              <div>
                <p className="text-slate-500 font-bold uppercase text-[10px] tracking-wider">Delivery Fee</p>
                <p className="mt-1 font-medium">${vendor.delivery_fee?.toFixed(2) || "0.00"}</p>
              </div>
              <div className={vendor.is_open_now ? "text-emerald-600" : "text-rose-600"}>
                <p className="font-bold uppercase text-[10px] tracking-wider">Status</p>
                <p className="mt-1 font-bold">{vendor.is_open_now ? "Open Now" : "Closed"}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
