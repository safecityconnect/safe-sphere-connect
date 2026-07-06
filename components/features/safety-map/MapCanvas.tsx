"use client";

import { useCallback, useEffect, useState } from "react";
import {
  APIProvider,
  APILoadingStatus,
  useApiLoadingStatus,
} from "@vis.gl/react-google-maps";
import type { IndianCity } from "@/lib/sample-data";
import type { LatLng } from "@/lib/map/city-centers";
import type { MapMarker } from "@/lib/map/incident-to-marker";
import { GoogleMapView } from "./GoogleMapView";
import { MapFallback, type MapFallbackReason } from "./MapFallback";

const MAP_LOAD_TIMEOUT_MS = 15_000;

type MapCanvasProps = {
  markers: MapMarker[];
  selectedId?: string | null;
  city: IndianCity;
  centerTarget?: LatLng | null;
  onSelect?: (id: string) => void;
};

function MapLoadWatcher({
  onFailed,
}: {
  onFailed: (reason: MapFallbackReason) => void;
}) {
  const status = useApiLoadingStatus();

  useEffect(() => {
    if (status === APILoadingStatus.FAILED) {
      onFailed("load-failed");
    } else if (status === APILoadingStatus.AUTH_FAILURE) {
      onFailed("auth-failure");
    }
  }, [status, onFailed]);

  return null;
}

function MapWithStatus({
  city,
  markers,
  selectedId,
  centerTarget,
  onSelect,
  onFailed,
}: MapCanvasProps & { onFailed: (reason: MapFallbackReason) => void }) {
  const status = useApiLoadingStatus();

  useEffect(() => {
    if (status !== APILoadingStatus.LOADING && status !== APILoadingStatus.NOT_LOADED) {
      return;
    }

    const timer = window.setTimeout(() => {
      onFailed("timeout");
    }, MAP_LOAD_TIMEOUT_MS);

    return () => window.clearTimeout(timer);
  }, [status, onFailed]);

  if (
    status === APILoadingStatus.FAILED ||
    status === APILoadingStatus.AUTH_FAILURE
  ) {
    return null;
  }

  if (status !== APILoadingStatus.LOADED) {
    return (
      <div className="flex h-56 items-center justify-center bg-slate-100 sm:h-72">
        <div className="flex flex-col items-center gap-2 text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p className="text-xs text-muted">Loading map…</p>
        </div>
      </div>
    );
  }

  return (
    <GoogleMapView
      city={city}
      markers={markers}
      selectedId={selectedId}
      centerTarget={centerTarget}
      onSelect={onSelect}
    />
  );
}

export function MapCanvas({
  markers,
  selectedId,
  city,
  centerTarget,
  onSelect,
}: MapCanvasProps) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  const [failureReason, setFailureReason] = useState<MapFallbackReason | null>(
    !apiKey ? "missing-key" : null
  );
  const [retryKey, setRetryKey] = useState(0);

  const handleFailed = useCallback((reason: MapFallbackReason) => {
    setFailureReason(reason);
  }, []);

  const handleRetry = useCallback(() => {
    if (!navigator.onLine) {
      setFailureReason("network");
      return;
    }
    setFailureReason(null);
    setRetryKey((k) => k + 1);
  }, []);

  useEffect(() => {
    if (!apiKey) return;

    const handleOffline = () => setFailureReason("network");
    const handleOnline = () => {
      if (failureReason === "network") {
        handleRetry();
      }
    };

    window.addEventListener("offline", handleOffline);
    window.addEventListener("online", handleOnline);
    return () => {
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("online", handleOnline);
    };
  }, [apiKey, failureReason, handleRetry]);

  if (failureReason) {
    return (
      <MapFallback
        reason={failureReason}
        city={city}
        markers={markers}
        selectedId={selectedId}
        onSelect={onSelect}
        onRetry={failureReason !== "missing-key" ? handleRetry : undefined}
      />
    );
  }

  return (
    <APIProvider
      key={retryKey}
      apiKey={apiKey!}
      onError={() => handleFailed("load-failed")}
    >
      <MapLoadWatcher onFailed={handleFailed} />
      <MapWithStatus
        city={city}
        markers={markers}
        selectedId={selectedId}
        centerTarget={centerTarget}
        onSelect={onSelect}
        onFailed={handleFailed}
      />
    </APIProvider>
  );
}
