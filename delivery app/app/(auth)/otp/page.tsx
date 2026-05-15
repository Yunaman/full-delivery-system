"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import { useAuth } from "@/hooks/useAuth";

export default function OtpPage() {
  const router = useRouter();
  const { pendingPhone, submitOtp, status } = useAuth();
  const [otp, setOtp] = useState("");
  const [busy, setBusy] = useState(false);

  const canSubmit = useMemo(() => otp.replace(/\D/g, "").length === 6, [otp]);

  useEffect(() => {
    if (status === "authenticated") router.replace("/home");
    if (!pendingPhone && status !== "authenticated") router.replace("/login");
  }, [pendingPhone, router, status]);

  return (
    <div className="grid min-h-dvh place-items-center px-6 py-10">
      <Card className="w-full max-w-md">
        <div className="text-sm font-semibold">OTP Verification</div>
        <div className="mt-1 text-xs text-muted">
          Enter the 6-digit code sent to{" "}
          <span className="font-semibold text-white/85">{pendingPhone ?? "—"}</span>
        </div>

        <div className="mt-6">
          <label className="text-xs font-semibold text-white/80">OTP</label>
          <input
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            placeholder="123456"
            className="mt-2 w-full rounded-2xl bg-white/5 px-4 py-3 text-center text-lg font-semibold tracking-[0.25em] outline-none ring-1 ring-white/10 placeholder:text-white/25"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
          />
        </div>

        <div className="mt-6 grid grid-cols-2 gap-2">
          <Button
            variant="secondary"
            onClick={() => router.replace("/login")}
            disabled={busy}
          >
            Back
          </Button>
          <Button
            loading={busy}
            disabled={!canSubmit}
            onClick={async () => {
              setBusy(true);
              await submitOtp(otp);
              setBusy(false);
            }}
          >
            Verify
          </Button>
        </div>
      </Card>
    </div>
  );
}

