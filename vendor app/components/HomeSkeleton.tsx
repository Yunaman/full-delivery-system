"use client";

import { motion } from "framer-motion";

function Pulse({ className }: { className: string }) {
  return (
    <motion.div
      aria-hidden
      className={`rounded-[28px] bg-neutral-200/80 ${className}`}
      animate={{ opacity: [0.55, 1, 0.55] }}
      transition={{ duration: 1.35, repeat: Infinity, ease: "easeInOut" }}
    />
  );
}

export function HomeSkeleton() {
  return (
    <div className="space-y-6 px-4 pb-28 pt-3">
      <Pulse className="h-[124px] w-full" />
      <div className="grid grid-cols-3 gap-3">
        <Pulse className="h-[96px] w-full" />
        <Pulse className="h-[96px] w-full" />
        <Pulse className="h-[96px] w-full" />
      </div>
      <Pulse className="h-[176px] w-full" />
      <div className="flex gap-3 overflow-hidden">
        {Array.from({ length: 5 }).map((_, index) => (
          <Pulse key={index} className="h-[92px] w-[76px] shrink-0 rounded-full" />
        ))}
      </div>
      <div className="space-y-3">
        <Pulse className="h-[148px] w-full" />
        <Pulse className="h-[148px] w-full" />
      </div>
      <div className="flex gap-3 overflow-hidden">
        {Array.from({ length: 7 }).map((_, index) => (
          <Pulse key={index} className="h-[92px] w-[76px] shrink-0 rounded-full" />
        ))}
      </div>
      <div className="grid grid-cols-2 gap-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Pulse key={index} className="h-[260px] w-full" />
        ))}
      </div>
    </div>
  );
}
