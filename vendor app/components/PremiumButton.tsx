"use client";

import { motion } from "framer-motion";
import type { MouseEventHandler, ReactNode } from "react";

export type PremiumButtonProps = {
  children: ReactNode;
  variant?: "primary" | "secondary" | "ghost";
  className?: string;
  type?: "button" | "submit";
  disabled?: boolean;
  onClick?: MouseEventHandler<HTMLButtonElement>;
};

const base =
  "inline-flex min-h-[52px] w-full items-center justify-center rounded-[28px] text-[15px] font-semibold tracking-tight transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-900 disabled:pointer-events-none disabled:opacity-40";

const variants: Record<NonNullable<PremiumButtonProps["variant"]>, string> = {
  primary:
    "bg-[#ff5a3d] text-white shadow-lg shadow-orange-500/25 hover:bg-[#ff4b2d]",
  secondary:
    "bg-neutral-900 text-white shadow-lg hover:bg-neutral-800",
  ghost:
    "bg-white text-neutral-900 ring-1 ring-neutral-200 hover:bg-neutral-50",
};

export function PremiumButton({
  children,
  variant = "primary",
  className = "",
  type = "button",
  disabled,
  onClick,
}: PremiumButtonProps) {
  return (
    <motion.button
      type={type}
      disabled={disabled}
      onClick={onClick}
      whileTap={{ scale: 0.96 }}
      transition={{ type: "spring", stiffness: 420, damping: 28 }}
      className={`${base} ${variants[variant]} ${className}`}
    >
      {children}
    </motion.button>
  );
}
