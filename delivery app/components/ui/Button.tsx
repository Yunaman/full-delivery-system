"use client";

import { forwardRef } from "react";
import { cn } from "@/lib/utils";
import Loader from "@/components/ui/Loader";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
};

const styles: Record<Variant, string> = {
  primary: "bg-white text-black hover:bg-white/90",
  secondary: "bg-white/10 text-white hover:bg-white/15",
  ghost: "bg-transparent text-white hover:bg-white/10",
  danger: "bg-rose-500 text-white hover:bg-rose-500/90",
};

const sizes: Record<Size, string> = {
  sm: "h-9 rounded-xl px-3 text-sm",
  md: "h-11 rounded-2xl px-4 text-sm",
  lg: "h-12 rounded-2xl px-5 text-base",
};

const Button = forwardRef<HTMLButtonElement, Props>(function Button(
  { className, variant = "primary", size = "md", loading, disabled, children, ...props },
  ref,
) {
  const isDisabled = disabled || loading;
  return (
    <button
      ref={ref}
      className={cn(
        "inline-flex items-center justify-center gap-2 font-semibold transition will-change-transform active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60",
        styles[variant],
        sizes[size],
        className,
      )}
      disabled={isDisabled}
      {...props}
    >
      {loading ? <Loader className="size-4 border-white/30 border-t-white/90" /> : null}
      {children}
    </button>
  );
});

export default Button;

