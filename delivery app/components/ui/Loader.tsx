import { cn } from "@/lib/utils";

export default function Loader({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "size-5 animate-spin rounded-full border-2 border-white/20 border-t-white/80",
        className,
      )}
      aria-label="Loading"
    />
  );
}

