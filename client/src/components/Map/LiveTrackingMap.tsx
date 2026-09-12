import { useEffect, useRef } from "react";
import * as maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

interface LiveTrackingMapProps {
  restaurantCoords: [number, number]; // [lat, lng]
  driverCoords: [number, number] | null; // [lat, lng]
  styleUrl?: string;
  attribution?: string;
}

export function LiveTrackingMap({
  restaurantCoords,
  driverCoords,
  styleUrl = "https://tiles.openfreemap.org/styles/positron",
  attribution = "© OpenStreetMap, © OpenFreeMap",
}: LiveTrackingMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const restaurantMarker = useRef<maplibregl.Marker | null>(null);
  const driverMarker = useRef<maplibregl.Marker | null>(null);

  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    try {
      map.current = new maplibregl.Map({
        container: mapContainer.current,
        style: styleUrl,
        center: [restaurantCoords[1], restaurantCoords[0]], // [lng, lat]
        zoom: 13,
        attributionControl: false,
      });

      // Add navigation controls
      map.current.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");

      // Custom Restaurant Marker
      const restEl = document.createElement("div");
      restEl.className = "restaurant-pin";
      restEl.innerHTML = `
        <div style="background: #161016; border: 2px solid #d6a85e; border-radius: 9999px; padding: 6px; box-shadow: 0 4px 12px rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center;">
          <span style="font-size: 14px;">👑</span>
        </div>
      `;
      restaurantMarker.current = new maplibregl.Marker({ element: restEl })
        .setLngLat([restaurantCoords[1], restaurantCoords[0]])
        .addTo(map.current);
    } catch (e) {
      console.warn("[MapLibre] Failed to initialize WebGL map:", e);
    }

    return () => {
      map.current?.remove();
      map.current = null;
    };
  }, [styleUrl, restaurantCoords]);

  // Update or create Driver Marker when coordinates change
  useEffect(() => {
    if (!map.current) return;

    if (driverCoords) {
      const [lat, lng] = driverCoords;

      if (!driverMarker.current) {
        const driverEl = document.createElement("div");
        driverEl.className = "driver-pin";
        driverEl.innerHTML = `
          <div style="background: #10b981; border: 2px solid white; border-radius: 9999px; padding: 6px; box-shadow: 0 4px 12px rgba(16,185,129,0.5); display: flex; align-items: center; justify-content: center; animation: pulse 2s infinite;">
            <span style="font-size: 14px;">🛵</span>
          </div>
        `;
        driverMarker.current = new maplibregl.Marker({ element: driverEl })
          .setLngLat([lng, lat])
          .addTo(map.current);
      } else {
        driverMarker.current.setLngLat([lng, lat]);
      }

      // Smoothly fit bounds around restaurant and driver
      const bounds = new maplibregl.LngLatBounds()
        .extend([restaurantCoords[1], restaurantCoords[0]])
        .extend([lng, lat]);

      map.current.fitBounds(bounds, { padding: 60, maxZoom: 15, duration: 1000 });
    }
  }, [driverCoords, restaurantCoords]);

  return (
    <div className="relative h-full w-full overflow-hidden rounded-[2rem] border border-white/10 bg-[#1e151e]">
      <div ref={mapContainer} className="h-full w-full" />
      <div className="absolute bottom-2 right-3 z-10 rounded bg-black/60 px-2 py-0.5 text-[9px] text-white/50 backdrop-blur-sm">
        {attribution}
      </div>
    </div>
  );
}
