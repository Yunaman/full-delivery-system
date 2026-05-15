"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import api, { Vendor, Product } from "@/lib/api";
import { useCartStore } from "@/lib/cartStore";
import toast from "react-hot-toast";

export default function CartPage() {
  const router = useRouter();
  const { items, vendorId, removeItem, clearCart } = useCartStore();
  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [products, setProducts] = useState<Record<string, Product>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadCartData() {
      if (!vendorId || items.length === 0) {
        setLoading(false);
        return;
      }

      try {
        const vRes = await api.getVendor(vendorId);
        setVendor(vRes);

        const pPromises = items.map(i => api.getProduct(i.product_id));
        const pResults = await Promise.all(pPromises);
        const pMap: Record<string, Product> = {};
        pResults.forEach(p => { pMap[p.id] = p; });
        setProducts(pMap);
      } catch (error) {
        console.error("Failed to load cart details", error);
      } finally {
        setLoading(false);
      }
    }
    loadCartData();
  }, [vendorId, items]);

  const subtotal = items.reduce((acc, item) => {
    const p = products[item.product_id];
    return acc + (p ? p.current_price * item.quantity : 0);
  }, 0);

  const deliveryFee = vendor?.delivery_fee || 0;
  const total = subtotal + deliveryFee;

  const handleCheckout = async () => {
    if (!vendorId) return;
    try {
      const order = await api.createOrder({
        vendor_id: vendorId,
        items: items,
        delivery_address: "Selected Delivery Address",
        payment_method: "cash",
      });
      clearCart();
      toast.success("Order placed successfully!");
      router.push(`/orders/${order.id}`);
    } catch (error) {
      toast.error("Checkout failed. Please try again.");
    }
  };

  if (loading) return <div className="p-12 text-center text-slate-500">Reviewing your items...</div>;
  if (items.length === 0) {
    return (
      <div className="p-20 text-center">
        <h1 className="text-3xl font-bold mb-4 text-slate-900">Your cart is empty</h1>
        <button onClick={() => router.push("/vendors")} className="px-8 py-3 bg-emerald-700 text-white rounded-2xl font-bold">
          Start Shopping
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      <h1 className="text-3xl font-bold mb-8">Your Order</h1>

      <div className="card p-6 mb-8 border-slate-100">
        <h2 className="font-bold text-slate-900 mb-4 italic">Ordering from {vendor?.shop_name}</h2>
        <div className="divide-y divide-slate-100">
          {items.map((item) => {
            const product = products[item.product_id];
            return (
              <div key={item.product_id} className="py-4 flex justify-between items-center">
                <div>
                  <p className="font-bold text-slate-800">{product?.name || "Loading..."}</p>
                  <p className="text-xs text-slate-500 font-medium">Quantity: {item.quantity}</p>
                </div>
                <div className="flex items-center gap-6">
                  <p className="font-bold text-slate-900">${((product?.current_price || 0) * item.quantity).toFixed(2)}</p>
                  <button onClick={() => removeItem(item.product_id)} className="text-rose-500 text-[10px] font-bold uppercase tracking-tight hover:underline">Remove</button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="card p-8 border-emerald-100 bg-emerald-50/20">
        <div className="space-y-3 text-sm">
          <div className="flex justify-between text-slate-600">
            <span>Subtotal</span>
            <span>${subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-slate-600">
            <span>Delivery Fee</span>
            <span>${deliveryFee.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-xl font-bold text-slate-900 pt-4 border-t border-slate-200">
            <span>Total</span>
            <span>${total.toFixed(2)}</span>
          </div>
        </div>

        <button
          onClick={handleCheckout}
          className="w-full mt-10 bg-emerald-700 text-white font-bold py-5 rounded-2xl shadow-xl shadow-emerald-700/20 hover:bg-emerald-800 transition-all active:scale-[0.98]"
        >
          Confirm and Pay on Delivery
        </button>
      </div>
    </div>
  );
}
