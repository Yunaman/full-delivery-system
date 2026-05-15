"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export default function Toggle({
  checked,
  onChange,
  className,
  labelOn = "ONLINE",
  labelOff = "OFFLINE",
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  className?: string;
  labelOn?: string;
  labelOff?: string;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={cn(
        "glass relative w-full rounded-3xl p-4 text-left shadow-glow transition hover:bg-white/8",
        className,
      )}
      aria-pressed={checked}
    >
      <div className="flex items-center justify-between gap-4">
        <div>
          <div className="text-sm text-muted">Driver status</div>
          <div className="mt-1 text-2xl font-semibold tracking-tight">
            {checked ? labelOn : labelOff}
          </div>
        </div>
        <div className="relative h-12 w-20 rounded-full bg-white/10 p-1">
          <motion.div
            className={cn(
              "h-10 w-10 rounded-full",
              checked ? "bg-emerald-400" : "bg-white/40",
            )}
            animate={{ x: checked ? 28 : 0 }}
            transition={{ type: "spring", stiffness: 560, damping: 34 }}
          />
        </div>
      </div>
      <motion.div
        className={cn(
          "pointer-events-none absolute inset-0 rounded-3xl",
          checked ? "ring-1 ring-emerald-400/50" : "ring-1 ring-white/10",
        )}
        animate={{ opacity: checked ? 1 : 0.9 }}
      />
    </button>
  );
}

