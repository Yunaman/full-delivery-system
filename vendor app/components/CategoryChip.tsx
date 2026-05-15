"use client";

import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";

export type CategoryChipProps = {
  label: string;
  icon: LucideIcon;
  active?: boolean;
  onSelect?: () => void;
};

export function CategoryChip({
  label,
  icon: Icon,
  active = false,
  onSelect,
}: CategoryChipProps) {
  return (
    <motion.button
      type="button"
      whileTap={{ scale: 0.95 }}
      onClick={onSelect}
      className="flex w-[76px] shrink-0 flex-col items-center gap-2 text-center"
    >
      <span
        className={`flex h-[58px] w-[58px] items-center justify-center rounded-full shadow-lg ring-1 ring-black/5 transition-colors ${
          active
            ? "bg-neutral-900 text-white"
            : "bg-white text-neutral-700"
        }`}
      >
        <Icon className="h-6 w-6" strokeWidth={1.75} aria-hidden />
      </span>
      <span
        className={`text-[12px] font-medium leading-none ${
          active ? "text-neutral-900" : "text-neutral-500"
        }`}
      >
        {label}
      </span>
    </motion.button>
  );
}
