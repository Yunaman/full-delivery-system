"use client";

import Script from "next/script";
import { useEffect, useMemo, useRef, useState } from "react";
import Card from "@/components/ui/Card";
import DriverMarker from "@/components/map/DriverMarker";
import RouteLine from "@/components/map/RouteLine";
import type { LatLng } from "@/lib/types";
import { useDriverStore } from "@/store/driverStore";
import { useOrderStore } from "@/store/orderStore";

const ADDIS: LatLng = { lat: 9.03, lng: 38.74 };

function boundsFor(points: LatLng[]) {
  const b = new google.maps.LatLngBounds();
  for (const p of points) b.extend(p);
  return b;
}

export default function MapView() {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  const mapEl = useRef<HTMLDivElement | null>(null);
  const [ready, setReady] = useState(false);
  const [map, setMap] = useState<google.maps.Map | null>(null);

  const driverLoc = useDriverStore((s) => s.location);
  const activeOrder = useOrderStore((s) => s.activeOrder);
  const pickup = activeOrder?.pickupLocation ?? null;
  const dropoff = activeOrder?.dropoffLocation ?? null;

  const focusPoints = useMemo(() => {
    const pts: LatLng[] = [driverLoc];
    if (pickup) pts.push(pickup);
    if (dropoff) pts.push(dropoff);
    return pts;
  }, [driverLoc, dropoff, pickup]);

  useEffect(() => {
    if (!ready) return;
    if (!mapEl.current) return;
    const m = new google.maps.Map(mapEl.current, {
      center: driverLoc ?? ADDIS,
      zoom: 13,
      disableDefaultUI: true,
      clickableIcons: false,
      gestureHandling: "greedy",
      styles: [
        { elementType: "geometry", stylers: [{ color: "#0b0b0f" }] },
        { elementType: "labels.text.stroke", stylers: [{ color: "#0b0b0f" }] },
        { elementType: "labels.text.fill", stylers: [{ color: "#9ca3af" }] },
        { featureType: "poi", stylers: [{ visibility: "off" }] },
        { featureType: "transit", stylers: [{ visibility: "off" }] },
        { featureType: "road", elementType: "geometry", stylers: [{ color: "#1f2937" }] },
        { featureType: "water", elementType: "geometry", stylers: [{ color: "#111827" }] },
      ],
    });
    setMap(m);
    return () => setMap(null);
  }, [driverLoc, ready]);

  useEffect(() => {
    if (!map) return;
    if (focusPoints.length === 1) {
      map.panTo(focusPoints[0]);
      return;
    }
    map.fitBounds(boundsFor(focusPoints), 56);
  }, [focusPoints, map]);

  if (!apiKey) {
    return (
      <Card className="p-0">
        <div className="flex items-center justify-between gap-4 p-4">
          <div>
            <div className="text-sm font-semibold">Map disabled</div>
            <div className="mt-1 text-xs text-muted">
              Set <span className="font-semibold">NEXT_PUBLIC_GOOGLE_MAPS_API_KEY</span> to enable Google Maps.
            </div>
          </div>
          <div className="rounded-2xl bg-white/10 px-3 py-2 text-xs text-muted">
            {driverLoc.lat.toFixed(4)}, {driverLoc.lng.toFixed(4)}
          </div>
        </div>
        <div className="relative h-[60dvh] w-full overflow-hidden rounded-b-3xl bg-white/5">
          <div className="absolute inset-0 grid place-items-center px-6 text-center">
            <div>
              <div className="text-sm font-semibold">Map preview</div>
              <div className="mt-1 text-xs text-muted">
                Add an API key to render the full map, route line, and markers.
              </div>
            </div>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-0">
      <Script
        src={`https://maps.googleapis.com/maps/api/js?key=${apiKey}&v=weekly`}
        strategy="afterInteractive"
        onLoad={() => setReady(true)}
      />
      <div className="h-[68dvh] w-full overflow-hidden rounded-3xl">
        <div ref={mapEl} className="h-full w-full" />
      </div>
      <DriverMarker map={map} position={driverLoc} />
      {pickup && dropoff ? <RouteLine map={map} from={pickup} to={dropoff} /> : null}
    </Card>
  );
}
