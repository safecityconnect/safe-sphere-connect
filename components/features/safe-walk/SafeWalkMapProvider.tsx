"use client";

import { APIProvider } from "@vis.gl/react-google-maps";

/**
 * Thin wrapper around the same `@vis.gl/react-google-maps` provider used
 * elsewhere in the app (see MapCanvas / LocationPickerModal). Falls back to
 * rendering children without a provider when no API key is configured —
 * descendants that rely on `useMapsLibrary` already handle a missing
 * context by returning `null`.
 */
export function SafeWalkMapProvider({ children }: { children: React.ReactNode }) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  if (!apiKey) {
    return <>{children}</>;
  }

  return <APIProvider apiKey={apiKey}>{children}</APIProvider>;
}
