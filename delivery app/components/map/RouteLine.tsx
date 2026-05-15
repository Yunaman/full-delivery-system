"use client";

import { useEffect, useRef } from "react";
import type { LatLng } from "@/lib/types";

export default function RouteLine({
  map,
  from,
  to,
}: {
  map: google.maps.Map | null;
  from: LatLng;
  to: LatLng;
}) {
  const polyRef = useRef<google.maps.Polyline | null>(null);

  useEffect(() => {
    if (!map || !("google" in window)) return;
    const path = [from, to];
    if (!polyRef.current) {
      polyRef.current = new google.maps.Polyline({
        map,
        path,
        strokeColor: "#60a5fa",
        strokeOpacity: 0.9,
        strokeWeight: 4,
      });
    } else {
      polyRef.current.setPath(path);
    }
    return () => {
      polyRef.current?.setMap(null);
      polyRef.current = null;
    };
  }, [from, map, to]);

  return null;
}

