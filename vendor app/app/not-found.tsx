import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center gap-4 px-6 text-center">
      <p className="text-[12px] font-semibold uppercase tracking-[0.24em] text-neutral-400">
        VendorHub
      </p>
      <h1 className="text-[26px] font-semibold text-neutral-900">
        Ticket not found
      </h1>
      <p className="max-w-sm text-[14px] text-neutral-500">
        We couldn&apos;t load that order. Return to the queue and pick the right
        reference.
      </p>
      <Link
        href="/orders"
        className="mt-2 rounded-full bg-neutral-900 px-8 py-3 text-[14px] font-semibold text-white shadow-lg transition-transform active:scale-95"
      >
        Open queue
      </Link>
    </div>
  );
}
