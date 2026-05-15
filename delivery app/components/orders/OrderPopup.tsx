"use client";

import { AnimatePresence, motion } from "framer-motion";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import { useOrderStore } from "@/store/orderStore";

export default function OrderPopup() {
  const incoming = useOrderStore((s) => s.incomingQueue[0] ?? null);

  return (
    <AnimatePresence>
      {incoming ? (
        <motion.div
          className="fixed inset-x-0 top-4 z-40 mx-auto w-[min(680px,calc(100vw-24px))] px-3 md:top-6"
          initial={{ y: -18, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -18, opacity: 0 }}
          transition={{ type: "spring", stiffness: 560, damping: 36 }}
        >
          <OrderPopupInner key={incoming.id} orderId={incoming.id} />
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

function OrderPopupInner({ orderId }: { orderId: string }) {
  const order = useOrderStore((s) => s.incomingQueue.find((o) => o.id === orderId) ?? null);
  const acceptIncoming = useOrderStore((s) => s.acceptIncoming);
  const rejectIncoming = useOrderStore((s) => s.rejectIncoming);

  if (!order) return null;

  return (
    <Card className="relative overflow-hidden p-4">
      <motion.div
        className="pointer-events-none absolute inset-0"
        animate={{ opacity: 0.35 }}
        style={{
          background:
            "radial-gradient(600px 140px at 20% 0%, rgba(244,63,94,0.22), transparent 60%), radial-gradient(500px 120px at 80% 0%, rgba(251,191,36,0.20), transparent 55%)",
        }}
      />
      <div className="relative">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-xs font-semibold text-white/80">INCOMING ORDER</div>
            <div className="mt-1 text-base font-semibold">{order.restaurantName}</div>
            <div className="mt-0.5 text-xs text-muted">
              {order.distanceKm} km • {order.earningsBirr} birr
            </div>
          </div>
          <div className="rounded-2xl bg-white/10 px-3 py-2 text-right">
            <div className="text-xs text-muted">Earnings</div>
            <div className="text-sm font-semibold">{order.earningsBirr} birr</div>
          </div>
        </div>

        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          <Button variant="primary" onClick={() => void acceptIncoming(order.id)}>
            Accept
          </Button>
          <Button variant="secondary" onClick={() => void rejectIncoming(order.id)}>
            Reject
          </Button>
        </div>
      </div>
    </Card>
  );
}
