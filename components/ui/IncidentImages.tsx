"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

type IncidentImagesProps = {
  urls: string[] | undefined;
  className?: string;
  thumbnailClassName?: string;
};

/**
 * Renders a row of tappable photo thumbnails for an incident, with a
 * full-screen lightbox on click. Renders nothing for incidents without
 * photos, so it's safe to use unconditionally on legacy incidents.
 */
export function IncidentImages({ urls, className, thumbnailClassName }: IncidentImagesProps) {
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);

  if (!urls || urls.length === 0) return null;

  return (
    <>
      <div className={cn("flex gap-2 overflow-x-auto", className)}>
        {urls.map((url, i) => (
          <button
            key={url}
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setLightboxUrl(url);
            }}
            className={cn(
              "h-20 w-20 shrink-0 overflow-hidden rounded-lg border border-border bg-slate-100",
              thumbnailClassName
            )}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={url}
              alt={`Incident photo ${i + 1}`}
              className="h-full w-full object-cover"
              loading="lazy"
            />
          </button>
        ))}
      </div>

      {lightboxUrl && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-black/80 p-4"
          onClick={() => setLightboxUrl(null)}
        >
          <button
            type="button"
            onClick={() => setLightboxUrl(null)}
            aria-label="Close"
            className="absolute right-4 top-4 text-white/80 hover:text-white"
          >
            <X className="h-6 w-6" />
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={lightboxUrl}
            alt="Incident photo enlarged"
            className="max-h-full max-w-full rounded-lg object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </>
  );
}
