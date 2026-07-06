"use client";

import { useEffect } from "react";
import { Map, Marker, useMap } from "@vis.gl/react-google-maps";
import type { IndianCity } from "@/lib/sample-data";
import { DEFAULT_MAP_ZOOM, getCityCenter, type LatLng } from "@/lib/map/city-centers";
import type { MapMarker } from "@/lib/map/incident-to-marker";
import { MARKER_PIN_STYLES } from "@/lib/map/marker-styles";

type GoogleMapViewProps = {
  city: IndianCity;
  markers: MapMarker[];
  selectedId?: string | null;
  centerTarget?: LatLng | null;
  onSelect?: (id: string) => void;
};

function MapCameraController({
  city,
  selectedId,
  markers,
  centerTarget,
}: {
  city: IndianCity;
  selectedId?: string | null;
  markers: MapMarker[];
  centerTarget?: LatLng | null;
}) {
  const map = useMap();

  useEffect(() => {
    if (!map) return;
    const center = getCityCenter(city);
    map.panTo(center);
    map.setZoom(DEFAULT_MAP_ZOOM);
  }, [map, city]);

  useEffect(() => {
    if (!map || !selectedId) return;
    const marker = markers.find((m) => m.id === selectedId);
    if (marker) {
      map.panTo(marker.position);
      map.setZoom(Math.max(map.getZoom() ?? DEFAULT_MAP_ZOOM, 14));
    }
  }, [map, selectedId, markers]);

  useEffect(() => {
    if (!map || !centerTarget) return;
    map.panTo(centerTarget);
    map.setZoom(15);
  }, [map, centerTarget]);

  return null;
}

export function GoogleMapView({
  city,
  markers,
  selectedId,
  centerTarget,
  onSelect,
}: GoogleMapViewProps) {
  const defaultCenter = getCityCenter(city);

  return (
    <Map
      defaultCenter={defaultCenter}
      defaultZoom={DEFAULT_MAP_ZOOM}
      gestureHandling="greedy"
      disableDefaultUI
      zoomControl
      className="h-56 w-full sm:h-72"
      reuseMaps
    >
      <MapCameraController
        city={city}
        selectedId={selectedId}
        markers={markers}
        centerTarget={centerTarget}
      />

      {markers.map((marker) => {
        const style = MARKER_PIN_STYLES[marker.category];
        const isSelected = selectedId === marker.id;

        return (
          <Marker
            key={marker.id}
            position={marker.position}
            onClick={() => onSelect?.(marker.id)}
            zIndex={isSelected ? 10 : 1}
            icon={{
              path: google.maps.SymbolPath.CIRCLE,
              scale: isSelected ? 10 : 8,
              fillColor: style.background,
              fillOpacity: 1,
              strokeColor: style.borderColor,
              strokeWeight: 2,
            }}
          />
        );
      })}
    </Map>
  );
}
