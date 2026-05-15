"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import api, { Vendor } from "@/lib/api";

export default function VendorListPage() {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadVendors() {
      try {
        const res = await api.getVendors();
        setVendors(res.results || []);
      } catch (error) {
        console.error("Failed to load vendors", error);
      } finally {
        setLoading(false);
      }
    }
    loadVendors();
  }, []);

  if (loading) return <div className="p-8 text-center">Loading stores...</div>;

  return (
    <div className="mx-auto max-w-5xl px-6 py-12">
      <h1 className="text-3xl font-bold mb-8">Available Stores</h1>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {vendors.map((vendor) => (
          <Link key={vendor.id} href={`/vendors/${vendor.id}`}>
            <div className="group rounded-2xl border border-slate-200 overflow-hidden hover:shadow-lg transition-shadow">
              <div className="h-40 bg-slate-100 relative">
                {vendor.logo_url && (
                  <img src={vendor.logo_url} alt={vendor.shop_name} className="w-full h-full object-cover" />
                )}
                {!vendor.is_open_now && (
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center text-white font-bold text-sm">
                    CLOSED
                  </div>
                )}
              </div>
              <div className="p-4">
                <div className="flex justify-between items-start">
                  <h2 className="font-bold text-lg group-hover:text-emerald-700 transition-colors">{vendor.shop_name}</h2>
                  <div className="flex items-center gap-1 text-sm font-medium">
                    <span>★</span> {vendor.rating?.toFixed(1) || "N/A"}
                  </div>
                </div>
                <p className="text-slate-500 text-sm mt-1">{vendor.vendor_type} • {vendor.preparation_time} min</p>
                <p className="text-emerald-700 text-sm mt-2 font-medium">Delivery: ${vendor.delivery_fee?.toFixed(2) || "0.00"}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
