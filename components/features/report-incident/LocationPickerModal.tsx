"use client";

import { useState } from "react";
import { APIProvider, Map, Marker } from "@vis.gl/react-google-maps";
import { MapPin, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import type { LatLng } from "@/lib/map/city-centers";

type LocationPickerModalProps = {
  initialCenter: LatLng;
  onConfirm: (coords: LatLng) => void;
  onClose: () => void;
};

export function LocationPickerModal({
  initialCenter,
  onConfirm,
  onClose,
}: LocationPickerModalProps) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  const [picked, setPicked] = useState<LatLng | null>(null);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-4">
      <div className="flex w-full max-w-lg flex-col rounded-t-2xl bg-surface shadow-xl sm:rounded-2xl">
        <div className="flex items-center justify-between border-b border-border p-4">
          <div>
            <p className="font-semibold text-foreground">Select Location on Map</p>
            <p className="text-xs text-muted">Tap anywhere on the map to drop a pin</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="text-muted hover:text-foreground"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="h-72 w-full sm:h-80">
          {apiKey ? (
            <APIProvider apiKey={apiKey}>
              <Map
                defaultCenter={initialCenter}
                defaultZoom={13}
                gestureHandling="greedy"
                disableDefaultUI
                zoomControl
                className="h-full w-full"
                onClick={(e) => {
                  if (e.detail.latLng) setPicked(e.detail.latLng);
                }}
              >
                {picked && <Marker position={picked} />}
              </Map>
            </APIProvider>
          ) : (
            <div className="flex h-full items-center justify-center bg-slate-100 px-6 text-center">
              <p className="text-xs text-muted">
                Map is unavailable right now. Please try again later.
              </p>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 border-t border-border p-4">
          <p className="flex-1 text-xs text-muted">
            {picked ? (
              <>
                <MapPin className="mr-1 inline h-3.5 w-3.5 text-primary" />
                {picked.lat.toFixed(5)}, {picked.lng.toFixed(5)}
              </>
            ) : (
              "No location selected yet"
            )}
          </p>
          <Button variant="ghost" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button
            size="sm"
            disabled={!picked}
            onClick={() => picked && onConfirm(picked)}
          >
            Confirm Location
          </Button>
        </div>
      </div>
    </div>
  );
}
