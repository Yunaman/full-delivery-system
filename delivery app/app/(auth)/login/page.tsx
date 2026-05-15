"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import { normalizePhone } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";

export default function LoginPage() {
  const router = useRouter();
  const { startLogin, status } = useAuth();
  const [phone, setPhone] = useState("");
  const [busy, setBusy] = useState(false);

  const normalized = useMemo(() => normalizePhone(phone), [phone]);

  useEffect(() => {
    if (status === "authenticated") router.replace("/home");
  }, [router, status]);

  return (
    <div className="grid min-h-dvh place-items-center px-6 py-10">
      <Card className="w-full max-w-md">
        <div className="flex items-center gap-3">
          <div className="grid size-11 place-items-center rounded-2xl bg-white/10">
            <span className="text-lg font-semibold">DD</span>
          </div>
          <div>
            <div className="text-sm font-semibold">Driver Login</div>
            <div className="text-xs text-muted">Phone + OTP</div>
          </div>
        </div>

        <div className="mt-6">
          <label className="text-xs font-semibold text-white/80">Phone number</label>
          <div className="mt-2 flex items-center gap-2 rounded-2xl bg-white/5 px-3 py-3 ring-1 ring-white/10">
            <span className="text-sm text-white/75">+251</span>
            <input
              inputMode="tel"
              autoComplete="tel"
              placeholder="9XXXXXXXX"
              className="w-full bg-transparent text-sm outline-none placeholder:text-white/35"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>
          <div className="mt-1 text-xs text-muted">
            Normalized: <span className="font-mono text-white/70">{normalized || "—"}</span>
          </div>
        </div>

        <Button
          className="mt-6 w-full"
          loading={busy}
          onClick={async () => {
            setBusy(true);
            await startLogin(phone);
            setBusy(false);
          }}
        >
          Send OTP
        </Button>

        <div className="mt-4 text-xs text-muted">
          By continuing, you agree to safe driving and in-app order handling.
        </div>
      </Card>
    </div>
  );
}
