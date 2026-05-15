"use client";

import { motion } from "framer-motion";
import Image from "next/image";

export type PromoBannerProps = {
  title?: string;
  subtitle?: string;
  badge?: string;
  imageSrc: string;
  imageAlt: string;
};

export function PromoBanner({
  title = "Operational bonus",
  subtitle = "Stack compliant drops before cutoff",
  badge = "Peak",
  imageSrc,
  imageAlt,
}: PromoBannerProps) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      className="relative overflow-hidden rounded-[28px] bg-gradient-to-br from-[#1d4ed8] via-[#2563eb] to-[#0ea5e9] p-5 shadow-lg ring-1 ring-white/25"
    >
      <div className="relative z-10 max-w-[58%] space-y-3">
        <span className="inline-flex items-center rounded-full bg-white/90 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#1d4ed8] shadow-sm">
          {badge}
        </span>
        <div className="space-y-1 text-white">
          <p className="text-[22px] font-semibold leading-[1.15] tracking-tight">
            {title}
          </p>
          <p className="text-[13px] font-medium text-white/88">{subtitle}</p>
        </div>
      </div>
      <div className="pointer-events-none absolute -bottom-4 right-[-12px] h-44 w-44">
        <Image
          src={imageSrc}
          alt={imageAlt}
          width={320}
          height={320}
          className="h-full w-full object-cover drop-shadow-2xl"
          priority
        />
      </div>
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.3),transparent_55%)]" />
    </motion.section>
  );
}
