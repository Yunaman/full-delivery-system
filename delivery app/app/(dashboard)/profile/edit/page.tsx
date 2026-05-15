"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import { ApiError } from "@/services/http";
import * as Driver from "@/services/driver";
import { useAuth } from "@/hooks/useAuth";
import { useAuthStore } from "@/store/authStore";
import { useDriverStore } from "@/store/driverStore";

export default function EditProfilePage() {
  const { logout } = useAuth();
  const token = useAuthStore((s) => s.token);
  const me = useDriverStore((s) => s.me);
  const setMe = useDriverStore((s) => s.setMe);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [fullName, setFullName] = useState("");

  useEffect(() => {
    if (me?.fullName) setFullName(me.fullName);
  }, [me?.fullName]);

  useEffect(() => {
    if (!token) return;
    if (me) return;
    let cancelled = false;

    const run = async () => {
      setLoading(true);
      try {
        const next = await Driver.getMe(token);
        if (cancelled) return;
        setMe(next);
      } catch (e) {
        if (e instanceof ApiError && e.status === 401) {
          logout();
          return;
        }
        toast.error(e instanceof Error ? e.message : "Failed to load profile.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void run();
    return () => {
      cancelled = true;
    };
  }, [logout, me, setMe, token]);

  const canSave = useMemo(() => {
    const next = fullName.trim();
    return Boolean(token) && next.length >= 2 && next !== (me?.fullName ?? "");
  }, [fullName, me?.fullName, token]);

  const onSave = async () => {
    if (!token) return;
    const nextName = fullName.trim();
    if (nextName.length < 2) return;
    setSaving(true);
    try {
      const next = await Driver.patchMe(token, { fullName: nextName });
      setMe(next);
      toast.success("Profile updated.");
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) {
        logout();
        return;
      }
      toast.error(e instanceof Error ? e.message : "Failed to save changes.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="text-xs font-semibold tracking-[0.18em] text-muted">PROFILE</div>
          <div className="mt-1 truncate text-xl font-semibold tracking-tight text-white/90">Edit profile</div>
        </div>
        <Link href="/profile">
          <Button variant="secondary" className="h-11 rounded-2xl px-4">
            Back
          </Button>
        </Link>
      </div>

      <Card className="p-5">
        <label className="block">
          <div className="text-xs font-semibold tracking-[0.12em] text-muted">FULL NAME</div>
          <input
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder={loading ? "Loading..." : "Your name"}
            className="mt-2 h-12 w-full rounded-2xl bg-black/20 px-4 text-sm font-semibold text-white/90 outline-none ring-1 ring-white/10 placeholder:text-white/35"
            disabled={loading || saving}
            autoComplete="name"
          />
        </label>

        <div className="mt-4 grid gap-2 text-sm text-muted">
          <div className="flex items-center justify-between gap-3">
            <span>Driver ID</span>
            <span className="font-semibold text-white/80">{me?.id ?? "-"}</span>
          </div>
          <div className="flex items-center justify-between gap-3">
            <span>Phone</span>
            <span className="font-semibold text-white/80">{me?.phone ?? "-"}</span>
          </div>
        </div>

        <div className="mt-5">
          <Button size="lg" className="h-14 w-full rounded-3xl text-base" disabled={!canSave || saving} onClick={onSave}>
            {saving ? "Saving..." : "Save changes"}
          </Button>
        </div>
      </Card>
    </div>
  );
}

