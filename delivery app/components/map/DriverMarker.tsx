"use client";

import { useEffect, useRef } from "react";
import type { LatLng } from "@/lib/types";

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

function lerpAngleDeg(from: number, to: number, k: number) {
  const delta = ((to - from + 540) % 360) - 180;
  return (from + delta * k + 360) % 360;
}

function prefersReducedMotion() {
  try {
    return window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
  } catch {
    return false;
  }
}

function driverIcon(heading: number): google.maps.Symbol {
  return {
    path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
    scale: 5.2,
    rotation: heading,
    fillColor: "#34d399",
    fillOpacity: 1,
    strokeColor: "rgba(255,255,255,0.9)",
    strokeWeight: 2,
  };
}

export default function DriverMarker({
  map,
  position,
  heading,
}: {
  map: google.maps.Map | null;
  position: LatLng;
  heading?: number | null;
}) {
  const markerRef = useRef<google.maps.Marker | null>(null);
  const posRef = useRef<LatLng>(position);
  const headingRef = useRef<number>(typeof heading === "number" ? heading : 0);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (!map || !("google" in window)) return;
    if (!markerRef.current) {
      markerRef.current = new google.maps.Marker({
        map,
        position: posRef.current,
        title: "You",
        optimized: true,
        icon: driverIcon(headingRef.current),
        zIndex: 40,
      });
    }
    return () => {
      if (rafRef.current) window.cancelAnimationFrame(rafRef.current);
      markerRef.current?.setMap(null);
      markerRef.current = null;
    };
  }, [map]);

  useEffect(() => {
    const marker = markerRef.current;
    if (!map || !marker || !("google" in window)) return;

    const from = posRef.current;
    const to = position;
    const distanceM = haversineMeters(from, to);

    const targetHeading =
      typeof heading === "number"
        ? heading
        : distanceM > 2
          ? bearingDegrees(from, to)
          : headingRef.current;

    if (rafRef.current) window.cancelAnimationFrame(rafRef.current);

    const start = performance.now();
    const duration = prefersReducedMotion() ? 0 : 420;
    const fromHeading = headingRef.current;

    const step = (t: number) => {
      const k = duration === 0 ? 1 : clamp((t - start) / duration, 0, 1);
      const pos: LatLng = { lat: from.lat + (to.lat - from.lat) * k, lng: from.lng + (to.lng - from.lng) * k };
      const h = lerpAngleDeg(fromHeading, targetHeading, k);

      marker.setPosition(pos);
      marker.setIcon(driverIcon(h));

      if (k < 1) {
        rafRef.current = window.requestAnimationFrame(step);
      } else {
        posRef.current = to;
        headingRef.current = h;
      }
    };

    rafRef.current = window.requestAnimationFrame(step);
  }, [heading, map, position]);

  return null;
}
