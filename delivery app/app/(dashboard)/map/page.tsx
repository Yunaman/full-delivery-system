"use client";

import Script from "next/script";
import { useEffect, useMemo, useRef, useState } from "react";
import DriverMarker from "@/components/map/DriverMarker";
import RouteLine from "@/components/map/RouteLine";
import { useLocation } from "@/hooks/useLocation";
import { cn } from "@/lib/utils";
import type { LatLng } from "@/lib/types";
import * as Driver from "@/services/driver";
import { useAuthStore } from "@/store/authStore";
import { useOrderStore } from "@/store/orderStore";

const ADDIS: LatLng = { lat: 9.03, lng: 38.74 };

function getDarkMapStyle(): google.maps.MapTypeStyle[] {
  return [
    { elementType: "geometry", stylers: [{ color: "#0b0b0f" }] },
    { elementType: "labels.text.stroke", stylers: [{ color: "#0b0b0f" }] },
    { elementType: "labels.text.fill", stylers: [{ color: "#9ca3af" }] },
    { featureType: "poi", stylers: [{ visibility: "off" }] },
    { featureType: "transit", stylers: [{ visibility: "off" }] },
    { featureType: "road", elementType: "geometry", stylers: [{ color: "#1f2937" }] },
    { featureType: "road", elementType: "geometry.stroke", stylers: [{ color: "#111827" }] },
    { featureType: "water", elementType: "geometry", stylers: [{ color: "#111827" }] },
  ];
}

export default function MapPage() {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  const token = useAuthStore((s) => s.token);
  const activeOrder = useOrderStore((s) => s.activeOrder);
  const pickup = activeOrder?.pickupLocation ?? null;
  const dropoff = activeOrder?.dropoffLocation ?? null;

  const mapEl = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);

  const [scriptReady, setScriptReady] = useState(false);
  const [isTracking, setIsTracking] = useState(false);
  const [autoFollow, setAutoFollow] = useState(true);
  const prevTrackingRef = useRef(false);
  const { location, gps } = useLocation({ enabled: isTracking });
  const latestPosRef = useRef<LatLng>(location);
  const lastLoggedFixRef = useRef<number | null>(null);

  const status = useMemo(() => {
    if (!apiKey) return { on: false, label: "Map key missing", detail: null as string | null };
    if (!isTracking) return { on: false, label: "Tracking OFF", detail: null as string | null };
    if (gps.status !== "active" || gps.isFallback) return { on: false, label: "Locating...", detail: null as string | null };
    const detail = gps.accuracyM != null ? `±${Math.round(gps.accuracyM)}m` : null;
    return { on: true, label: "Tracking ON", detail };
  }, [apiKey, gps.accuracyM, gps.isFallback, gps.status, isTracking]);

  const gpsMessage = useMemo(() => {
    if (!isTracking) return null;
    if (gps.message) return gps.message;
    if (gps.status !== "active") return "Waiting for location...";
    return null;
  }, [gps.message, gps.status, isTracking]);

  // Init map once after script loads.
  useEffect(() => {
    if (!apiKey) return;
    if (!scriptReady) return;
    if (!mapEl.current) return;
    if (!("google" in window)) return;
    if (mapRef.current) return;

    const map = new google.maps.Map(mapEl.current, {
      center: ADDIS,
      zoom: 15,
      disableDefaultUI: true,
      clickableIcons: false,
      gestureHandling: "greedy",
      styles: getDarkMapStyle(),
    });

    map.addListener("dragstart", () => setAutoFollow(false));
    mapRef.current = map;
    setMap(map);
    return () => {
      mapRef.current = null;
      setMap(null);
    };
  }, [apiKey, scriptReady]);

  useEffect(() => {
    latestPosRef.current = location;
  }, [location]);

  useEffect(() => {
    if (isTracking && !prevTrackingRef.current) console.log("Tracking started");
    if (!isTracking && prevTrackingRef.current) console.log("Tracking stopped");
    prevTrackingRef.current = isTracking;
  }, [isTracking]);

  useEffect(() => {
    if (!isTracking) return;
    if (!gps.lastFixAt) return;
    if (gps.lastFixAt === lastLoggedFixRef.current) return;
    lastLoggedFixRef.current = gps.lastFixAt;
    console.log("Location updated", location);
  }, [gps.lastFixAt, isTracking, location]);

  useEffect(() => {
    if (!isTracking) return;
    if (!autoFollow) return;
    if (gps.status !== "active" || gps.isFallback) return;
    mapRef.current?.panTo(location);
  }, [autoFollow, gps.isFallback, gps.status, isTracking, location]);

  // Send location updates to backend while tracking (throttled).
  useEffect(() => {
    if (!isTracking) return;
    if (!token) return;
    if (gps.status !== "active" || gps.isFallback) return;

    const send = async () => {
      const pos = latestPosRef.current;
      try {
        await Driver.postLocation(token, pos);
      } catch {
        // non-blocking
      }
    };

    void send();
    const id = window.setInterval(() => void send(), 5_000);
    return () => window.clearInterval(id);
  }, [gps.isFallback, gps.status, isTracking, token]);

  const handleToggleTracking = () => {
    setIsTracking((v) => {
      const next = !v;
      if (next) setAutoFollow(true);
      return next;
    });
  };

  const handleRecenter = () => {
    const map = mapRef.current;
    if (!map) return;
    setAutoFollow(true);
    map.panTo(location);
    map.setZoom(16);
  };

  return (
    <div className="-mx-4">
      {apiKey ? (
        <Script
          src={`https://maps.googleapis.com/maps/api/js?key=${apiKey}&v=weekly`}
          strategy="afterInteractive"
          onLoad={() => setScriptReady(true)}
        />
      ) : null}

      <div className="relative h-[calc(100dvh-168px)] w-full overflow-hidden md:rounded-3xl">
        <div
          ref={mapEl}
          className={cn(
            "absolute inset-0 bg-[#0b0b0f]",
            apiKey ? "opacity-100" : "bg-gradient-to-b from-white/5 to-white/0",
          )}
        />

        {isTracking ? <DriverMarker map={map} position={location} heading={gps.headingDeg} /> : null}
        {pickup && dropoff ? <RouteLine map={map} from={pickup} to={dropoff} /> : null}

        <div className="absolute inset-0 pointer-events-none">
          {/* Status */}
          <div className="absolute left-3 top-3 z-10 flex max-w-[min(360px,calc(100vw-24px))] flex-col gap-2">
            <div className="glass flex items-center gap-2 rounded-2xl px-3 py-2 text-xs text-white/90 shadow-glow ring-1 ring-white/10">
              <span className={cn("size-2 rounded-full", status.on ? "bg-emerald-400" : "bg-red-400")} aria-hidden="true" />
              <span className="font-semibold">{status.label}</span>
              {status.detail ? <span className="text-muted">{status.detail}</span> : null}
            </div>
            {gpsMessage ? (
              <div className="glass rounded-2xl px-3 py-2 text-xs text-muted ring-1 ring-white/10">{gpsMessage}</div>
            ) : null}
          </div>

          {/* Recenter */}
          <div className="absolute right-3 top-3 z-10 pointer-events-auto">
            <button
              type="button"
              onClick={handleRecenter}
              disabled={!isTracking || gps.status !== "active" || gps.isFallback}
              className={cn(
                "glass grid size-12 place-items-center rounded-2xl shadow-glow ring-1 ring-white/10",
                "text-white/90 active:scale-[0.99] disabled:opacity-45",
              )}
              aria-label="Recenter"
              title="Recenter"
            >
              <svg viewBox="0 0 24 24" fill="none" className="size-5" aria-hidden="true">
                <path d="M12 3v3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                <path d="M12 18v3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                <path d="M3 12h3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                <path d="M18 12h3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                <path d="M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8Z" stroke="currentColor" strokeWidth="1.8" />
              </svg>
            </button>
          </div>

          {/* Start/Stop */}
          <div className="absolute inset-x-0 bottom-6 z-10 grid place-items-center pointer-events-auto px-3 md:bottom-5">
            <button
              type="button"
              onClick={handleToggleTracking}
              className={cn(
                "h-12 min-w-[220px] rounded-2xl px-6 text-sm font-semibold",
                "ring-1 ring-white/10 shadow-glow",
                isTracking ? "bg-white text-black" : "bg-emerald-400 text-black",
                "active:scale-[0.99]",
              )}
            >
              {isTracking ? "Stop Tracking" : "Start Tracking"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
