import type { IndianCity } from "@/lib/sample-data";

export type LatLng = { lat: number; lng: number };

export const CITY_CENTERS: Record<IndianCity, LatLng> = {
  Chandigarh: { lat: 30.7333, lng: 76.7794 },
  Mohali: { lat: 30.678, lng: 76.7222 },
  Panchkula: { lat: 30.6942, lng: 76.8606 },
  Delhi: { lat: 28.6139, lng: 77.209 },
  Mumbai: { lat: 19.076, lng: 72.8777 },
  Bengaluru: { lat: 12.9716, lng: 77.5946 },
  Hyderabad: { lat: 17.385, lng: 78.4867 },
};

export const DEFAULT_MAP_ZOOM = 13;

/** Geographic centroid of India, used as a map fallback when no other location is known. */
export const INDIA_CENTER: LatLng = { lat: 20.5937, lng: 78.9629 };

export function getCityCenter(city: IndianCity): LatLng {
  return CITY_CENTERS[city];
}
