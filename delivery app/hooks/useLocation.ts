"use client";

import { useEffect } from "react";
import { create } from "zustand";
import type { LatLng } from "@/lib/types";
import { useDriverStore } from "@/store/driverStore";

export type GpsPermissionState = "granted" | "prompt" | "denied" | "unknown";
export type GpsStatus = "idle" | "active" | "denied" | "timeout" | "unavailable" | "error" | "fallback";

export type GpsMeta = {
  status: GpsStatus;
  permission: GpsPermissionState;
  message: string | null;
  lastFixAt: number | null;
  accuracyM: number | null;
  speedMps: number | null;
  headingDeg: number | null;
  isFallback: boolean;
};

type GpsStore = {
  meta: GpsMeta;
  setMeta: (partial: Partial<GpsMeta>) => void;
};

const DEFAULT_META: GpsMeta = {
  status: "idle",
  permission: "unknown",
  message: null,
  lastFixAt: null,
  accuracyM: null,
  speedMps: null,
  headingDeg: null,
  isFallback: false,
};

const useGpsStore = create<GpsStore>((set) => ({
  meta: DEFAULT_META,
  setMeta: (partial) => set((s) => ({ meta: { ...s.meta, ...partial } })),
}));

export function useGpsMeta() {
  return useGpsStore((s) => s.meta);
}

const FALLBACK_COORDS: LatLng = { lat: 9.03, lng: 38.74 };
const THROTTLE_MS = 350;
const MIN_MOVE_FOR_HEADING_M = 2;

let activeWatchId: number | null = null;
let activeUsers = 0;
let throttleTimer: number | null = null;
let lastEmittedAt = 0;
let lastFix: { pos: LatLng; at: number } | null = null;
let pendingFix:
  | {
      pos: LatLng;
      at: number;
      accuracyM: number | null;
      speedMps: number | null;
      headingDeg: number | null;
    }
  | null = null;
let permCleanup: (() => void) | null = null;

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

function haversineMeters(a: LatLng, b: LatLng) {
  const R = 6371e3;
  const phi1 = (a.lat * Math.PI) / 180;
  const phi2 = (b.lat * Math.PI) / 180;
  const dPhi = ((b.lat - a.lat) * Math.PI) / 180;
  const dLam = ((b.lng - a.lng) * Math.PI) / 180;
  const s =
    Math.sin(dPhi / 2) * Math.sin(dPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(dLam / 2) * Math.sin(dLam / 2);
  return 2 * R * Math.atan2(Math.sqrt(s), Math.sqrt(1 - s));
}

function bearingDegrees(a: LatLng, b: LatLng) {
  const phi1 = (a.lat * Math.PI) / 180;
  const phi2 = (b.lat * Math.PI) / 180;
  const dLam = ((b.lng - a.lng) * Math.PI) / 180;
  const y = Math.sin(dLam) * Math.cos(phi2);
  const x = Math.cos(phi1) * Math.sin(phi2) - Math.sin(phi1) * Math.cos(phi2) * Math.cos(dLam);
  const brng = (Math.atan2(y, x) * 180) / Math.PI;
  return (brng + 360) % 360;
}

function startPermissionListener() {
  if (!("permissions" in navigator)) return;
  try {
    const anyPerms = navigator.permissions as unknown as {
      query: (d: { name: string }) => Promise<PermissionStatus>;
    };
    void anyPerms.query({ name: "geolocation" }).then((status) => {
      const setMeta = useGpsStore.getState().setMeta;
      const mapState = (s: PermissionState): GpsPermissionState =>
        s === "granted" || s === "denied" || s === "prompt" ? s : "unknown";

      setMeta({ permission: mapState(status.state) });

      const handler = () => setMeta({ permission: mapState(status.state) });
      status.addEventListener?.("change", handler);
      permCleanup = () => status.removeEventListener?.("change", handler);
    });
  } catch {
    // ignore
  }
}

function stopPermissionListener() {
  permCleanup?.();
  permCleanup = null;
}

function emitFix(fix: {
  pos: LatLng;
  at: number;
  accuracyM: number | null;
  speedMps: number | null;
  headingDeg: number | null;
}) {
  const setLocation = useDriverStore.getState().setLocation;
  const setMeta = useGpsStore.getState().setMeta;

  lastEmittedAt = Date.now();
  setLocation(fix.pos);
  setMeta({
    status: "active",
    message: null,
    lastFixAt: fix.at,
    accuracyM: fix.accuracyM,
    speedMps: fix.speedMps,
    headingDeg: fix.headingDeg,
    isFallback: false,
  });
}

function scheduleOrEmitFix(fix: {
  pos: LatLng;
  at: number;
  accuracyM: number | null;
  speedMps: number | null;
  headingDeg: number | null;
}) {
  const now = Date.now();
  const elapsed = now - lastEmittedAt;
  if (elapsed >= THROTTLE_MS) {
    emitFix(fix);
    return;
  }

  pendingFix = fix;
  if (throttleTimer != null) return;
  const wait = clamp(THROTTLE_MS - elapsed, 0, THROTTLE_MS);
  throttleTimer = window.setTimeout(() => {
    throttleTimer = null;
    if (!pendingFix) return;
    const next = pendingFix;
    pendingFix = null;
    emitFix(next);
  }, wait);
}

function setFallback(status: GpsStatus, message: string) {
  const setLocation = useDriverStore.getState().setLocation;
  const current = useDriverStore.getState().location;
  const safeFallback = Number.isFinite(current?.lat) && Number.isFinite(current?.lng) ? current : FALLBACK_COORDS;

  useGpsStore.getState().setMeta({
    status,
    message,
    isFallback: true,
    lastFixAt: null,
    accuracyM: null,
    speedMps: null,
    headingDeg: null,
  });

  setLocation(safeFallback);
}

function startGeolocationWatch() {
  if (activeWatchId != null) return;

  const setMeta = useGpsStore.getState().setMeta;

  if (!("geolocation" in navigator)) {
    setFallback("unavailable", "Location unavailable");
    return;
  }

  startPermissionListener();
  setMeta({ status: "idle", message: null });

  try {
    activeWatchId = navigator.geolocation.watchPosition(
      (pos) => {
        const next: LatLng = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        const at = typeof pos.timestamp === "number" ? pos.timestamp : Date.now();

        const accuracyM = Number.isFinite(pos.coords.accuracy) ? pos.coords.accuracy : null;
        const rawSpeed = Number.isFinite(pos.coords.speed) ? pos.coords.speed : null;
        const rawHeading = Number.isFinite(pos.coords.heading) ? pos.coords.heading : null;

        let headingDeg = rawHeading;
        if (headingDeg == null && lastFix) {
          const movedM = haversineMeters(lastFix.pos, next);
          if (movedM > MIN_MOVE_FOR_HEADING_M) headingDeg = bearingDegrees(lastFix.pos, next);
        }

        let speedMps = rawSpeed;
        if ((speedMps == null || speedMps <= 0) && lastFix) {
          const movedM = haversineMeters(lastFix.pos, next);
          const dtS = Math.max(0, (at - lastFix.at) / 1000);
          if (movedM > 0.5 && dtS > 0.2) speedMps = movedM / dtS;
        }
        if (speedMps != null && speedMps < 0) speedMps = null;

        lastFix = { pos: next, at };
        scheduleOrEmitFix({ pos: next, at, accuracyM, speedMps, headingDeg });
      },
      (err) => {
        if (err.code === 1) setFallback("denied", "Please enable location to use navigation");
        else if (err.code === 3) setFallback("timeout", "Location unavailable");
        else if (err.code === 2) setFallback("unavailable", "Location unavailable");
        else setFallback("error", "Location unavailable");
      },
      { enableHighAccuracy: true, maximumAge: 0, timeout: 5000 },
    );
  } catch {
    setFallback("error", "Location unavailable");
  }
}

function stopGeolocationWatch() {
  if (activeWatchId != null) {
    try {
      navigator.geolocation.clearWatch(activeWatchId);
    } catch {
      // ignore
    }
  }
  activeWatchId = null;

  if (throttleTimer != null) window.clearTimeout(throttleTimer);
  throttleTimer = null;
  pendingFix = null;
  lastFix = null;
  lastEmittedAt = 0;

  stopPermissionListener();
  useGpsStore.getState().setMeta({ status: "idle", message: null, isFallback: false });
}

export function useLocation(p?: { enabled?: boolean }) {
  const enabled = p?.enabled ?? true;
  useEffect(() => {
    if (!enabled) return;
    activeUsers += 1;
    startGeolocationWatch();
    return () => {
      activeUsers = Math.max(0, activeUsers - 1);
      if (activeUsers === 0) stopGeolocationWatch();
    };
  }, [enabled]);

  const location = useDriverStore((s) => s.location);
  const gps = useGpsStore((s) => s.meta);
  return { location, gps };
}
