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

const VEHICLE_OPTIONS = ["Motorbike", "Car", "Bicycle", "Van"] as const;

export default function VehicleInfoPage() {
  const { logout } = useAuth();
  const token = useAuthStore((s) => s.token);
  const me = useDriverStore((s) => s.me);
  const setMe = useDriverStore((s) => s.setMe);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [vehicleType, setVehicleType] = useState("");

  useEffect(() => {
    if (me?.vehicleType) setVehicleType(me.vehicleType);
  }, [me?.vehicleType]);

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
    const next = vehicleType.trim();
    return Boolean(token) && next.length >= 2 && next !== (me?.vehicleType ?? "");
  }, [me?.vehicleType, token, vehicleType]);

  const onSave = async () => {
    if (!token) return;
    const nextVehicle = vehicleType.trim();
    if (nextVehicle.length < 2) return;
    setSaving(true);
    try {
      const next = await Driver.patchMe(token, { vehicleType: nextVehicle });
      setMe(next);
      toast.success("Vehicle info updated.");
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
          <div className="mt-1 truncate text-xl font-semibold tracking-tight text-white/90">Vehicle info</div>
        </div>
        <Link href="/profile">
          <Button variant="secondary" className="h-11 rounded-2xl px-4">
            Back
          </Button>
        </Link>
      </div>

      <Card className="p-5">
        <label className="block">
          <div className="text-xs font-semibold tracking-[0.12em] text-muted">VEHICLE TYPE</div>
          <select
            value={vehicleType}
            onChange={(e) => setVehicleType(e.target.value)}
            className="mt-2 h-12 w-full rounded-2xl bg-black/20 px-4 text-sm font-semibold text-white/90 outline-none ring-1 ring-white/10"
            disabled={loading || saving}
          >
            <option value="" disabled>
              Select a vehicle
            </option>
            {VEHICLE_OPTIONS.map((v) => (
              <option key={v} value={v}>
                {v}
              </option>
            ))}
            {vehicleType && !VEHICLE_OPTIONS.includes(vehicleType as (typeof VEHICLE_OPTIONS)[number]) ? (
              <option value={vehicleType}>{vehicleType}</option>
            ) : null}
          </select>
        </label>

        <div className="mt-4 text-sm text-muted">
          Keep this accurate. Dispatch and routing may use your vehicle type for assignment.
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

