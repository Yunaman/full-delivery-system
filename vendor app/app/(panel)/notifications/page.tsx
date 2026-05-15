"use client";

import { BellRing } from "lucide-react";
import { toast } from "sonner";
import { usePreferences } from "@/components/preferences-provider";

const messages = [
  { id: "n1", title: "Courier delayed", text: "Order VH-9200 delayed by 4 min", time: "1m ago", payout: null },
  { id: "n2", title: "Low stock", text: "Smoky BBQ Burger below threshold", time: "8m ago", payout: null },
  { id: "n3", title: "Payout posted", text: "transferred to your wallet", time: "22m ago", payout: 1240 },
];

export default function NotificationsPage() {
  const { formatMoney, t } = usePreferences();
  return (
    <div className="space-y-6 p-4 md:p-8">
      <header className="card p-6">
        <h1 className="text-3xl font-bold tracking-tight">{t("Notifications", "ማሳወቂያዎች")}</h1>
        <p className="mt-2 text-slate-500">{t("Real-time toast alerts and elegant notification center.", "ቀጥታ የtoast ማሳወቂያዎች እና ውብ የማሳወቂያ ማዕከል።")}</p>
      </header>

      <button
        onClick={() => toast.success(t("Order accepted", "ትዕዛዝ ተቀባይነት አግኝቷል"), { description: t("VH-9201 moved to preparation.", "VH-9201 ወደ ዝግጅት ገብቷል።") })}
        className="rounded-2xl bg-slate-900 px-4 py-2 font-semibold text-white"
      >
        {t("Trigger real-time toast", "ቀጥታ toast አሳይ")}
      </button>

      <section className="space-y-3">
        {messages.map((m) => (
          <article key={m.id} className="card flex items-start gap-4 p-4">
            <div className="rounded-2xl bg-slate-100 p-2">
              <BellRing className="h-5 w-5 text-slate-700" />
            </div>
            <div>
              <p className="font-semibold">{m.title}</p>
              <p className="text-sm text-slate-600">
                {m.payout ? `${formatMoney(m.payout)} ${m.text}` : m.text}
              </p>
              <p className="mt-1 text-xs text-slate-400">{m.time}</p>
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}
