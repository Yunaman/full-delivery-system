"use client";

import Link from "next/link";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";

export default function SupportPage() {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="text-xs font-semibold tracking-[0.18em] text-muted">SUPPORT</div>
          <div className="mt-1 truncate text-xl font-semibold tracking-tight text-white/90">Help</div>
        </div>
        <Link href="/profile">
          <Button variant="secondary" className="h-11 rounded-2xl px-4">
            Back
          </Button>
        </Link>
      </div>

      <Card className="p-5">
        <div className="text-sm font-semibold text-white/90">Contact</div>
        <div className="mt-1 text-sm text-muted">Reach us if you have an issue with an order, payout, or account.</div>

        <div className="mt-4 grid gap-2">
          <a href="tel:+251900000000" className="block">
            <Button className="h-12 w-full rounded-2xl">Call support</Button>
          </a>
          <a href="mailto:support@example.com" className="block">
            <Button variant="secondary" className="h-12 w-full rounded-2xl">
              Email support
            </Button>
          </a>
        </div>

        <div className="mt-4 text-xs text-muted">
          In production, wire this page to your real support channels and ticketing system.
        </div>
      </Card>
    </div>
  );
}

