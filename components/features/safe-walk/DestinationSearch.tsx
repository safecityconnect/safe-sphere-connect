"use client";

import { useEffect, useRef, useState } from "react";
import { useMapsLibrary } from "@vis.gl/react-google-maps";
import { MapPin, Search, X } from "lucide-react";
import type { SafeWalkDestination } from "@/lib/types/safe-walk";

type Prediction = {
  placeId: string;
  description: string;
};

type DestinationSearchProps = {
  onSelect: (destination: SafeWalkDestination) => void;
  disabled?: boolean;
};

const SEARCH_DEBOUNCE_MS = 350;

export function DestinationSearch({ onSelect, disabled }: DestinationSearchProps) {
  const placesLibrary = useMapsLibrary("places");
  const [query, setQuery] = useState("");
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const autocompleteServiceRef = useRef<google.maps.places.AutocompleteService | null>(null);
  const placesServiceRef = useRef<google.maps.places.PlacesService | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!placesLibrary) return;
    autocompleteServiceRef.current = new placesLibrary.AutocompleteService();
    placesServiceRef.current = new placesLibrary.PlacesService(document.createElement("div"));
  }, [placesLibrary]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    const trimmed = query.trim();
    if (!trimmed || !autocompleteServiceRef.current) {
      setPredictions([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    debounceRef.current = setTimeout(() => {
      autocompleteServiceRef.current?.getPlacePredictions(
        { input: trimmed, componentRestrictions: { country: "in" } },
        (results, status) => {
          setIsSearching(false);
          if (status === "OK" && results) {
            setPredictions(
              results.map((r) => ({ placeId: r.place_id, description: r.description }))
            );
          } else {
            setPredictions([]);
          }
        }
      );
    }, SEARCH_DEBOUNCE_MS);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  const handlePick = (prediction: Prediction) => {
    if (!placesServiceRef.current) return;
    placesServiceRef.current.getDetails(
      { placeId: prediction.placeId, fields: ["geometry", "formatted_address", "name"] },
      (place, status) => {
        if (status === "OK" && place?.geometry?.location) {
          onSelect({
            lat: place.geometry.location.lat(),
            lng: place.geometry.location.lng(),
            address: place.formatted_address ?? place.name ?? prediction.description,
          });
          setQuery("");
          setPredictions([]);
        }
      }
    );
  };

  return (
    <div className="relative">
      <div className="flex items-center gap-2 rounded-xl border border-border bg-surface px-3 py-2.5">
        <Search className="h-4 w-4 shrink-0 text-muted" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placesLibrary ? "Search for a destination…" : "Loading search…"}
          disabled={disabled || !placesLibrary}
          className="w-full bg-transparent text-sm text-foreground placeholder:text-muted focus:outline-none disabled:opacity-50"
        />
        {query && (
          <button
            type="button"
            onClick={() => {
              setQuery("");
              setPredictions([]);
            }}
            aria-label="Clear search"
            className="shrink-0 text-muted hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {(predictions.length > 0 || isSearching) && (
        <div className="absolute z-20 mt-1 w-full overflow-hidden rounded-xl border border-border bg-surface shadow-lg">
          {isSearching ? (
            <p className="px-4 py-3 text-xs text-muted">Searching…</p>
          ) : (
            predictions.map((p) => (
              <button
                key={p.placeId}
                type="button"
                onClick={() => handlePick(p)}
                className="flex w-full items-start gap-2 px-4 py-2.5 text-left text-sm text-foreground transition-colors hover:bg-primary-light/40"
              >
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <span className="line-clamp-2">{p.description}</span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
