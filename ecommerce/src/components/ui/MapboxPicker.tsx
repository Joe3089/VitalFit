"use client";

import { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { BranchInfo } from "@vitalfit/sdk";

export type MapboxPickerProps = {
  branches: BranchInfo[];
  isLoading?: boolean;
  selectedBranch?: BranchInfo | null;
};

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN as string;

const BRAND_COLOR = "#fb923c";

export default function MapboxPicker({
  branches,
  isLoading,
  selectedBranch,
}: MapboxPickerProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markers = useRef<mapboxgl.Marker[]>([]);

  useEffect(() => {
    if (!mapContainer.current || isLoading) {
      return;
    }

    if (map.current && (map.current as any)._loaded) {
      return;
    }

    const newMap = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/streets-v12",
      center: [-66.9036, 10.4806],
      zoom: 6,
      attributionControl: false,
    });

    map.current = newMap;

    newMap.addControl(
      new mapboxgl.NavigationControl({ showCompass: false }),
      "bottom-right",
    );
    newMap.addControl(
      new mapboxgl.AttributionControl({ compact: true }),
      "bottom-left",
    );

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, [isLoading]);

  useEffect(() => {
    if (!map.current || isLoading) {
      return;
    }

    markers.current.forEach((m) => m.remove());
    markers.current = [];

    const bounds = new mapboxgl.LngLatBounds();

    branches.forEach((branch) => {
      if (!branch.latitude || !branch.longitude) {
        return;
      }

      const popupContent = `
        <div>
          <h3 style="margin: 0 0 4px 0; color: #111827; font-weight: 800; font-size: 14px; text-transform: uppercase;">
            ${branch.name}
          </h3>
          <p style="margin: 0 0 4px 0; color: #4b5563; font-size: 13px; line-height: 1.4;">
            ${branch.address}
          </p>
          <p style="margin: 0; color: #fb923c; font-weight: 600; font-size: 13px;">
            ${branch.phone || ""}
          </p>
        </div>
      `;

      const popup = new mapboxgl.Popup({
        offset: 35,
        closeButton: false,
      }).setHTML(popupContent);

      const marker = new mapboxgl.Marker({
        color: BRAND_COLOR,
        scale: 1.1,
      })
        .setLngLat([branch.longitude, branch.latitude])
        .setPopup(popup)
        .addTo(map.current!);

      if (selectedBranch?.branch_id === branch.branch_id) {
        popup.addTo(map.current!);
      }

      markers.current.push(marker);
      bounds.extend([branch.longitude, branch.latitude]);
    });

    if (selectedBranch && selectedBranch.latitude && selectedBranch.longitude) {
      map.current.flyTo({
        center: [selectedBranch.longitude, selectedBranch.latitude],
        zoom: 15,
        essential: true,
        padding: { top: 50, bottom: 50, left: 50, right: 50 },
      });
    } else if (branches.length > 0) {
      map.current.fitBounds(bounds, { padding: 80, maxZoom: 14 });
    }
  }, [branches, selectedBranch, isLoading]);

  return (
    <div
      ref={mapContainer}
      className="w-full h-full rounded-none md:rounded-3xl outline-none"
    />
  );
}
