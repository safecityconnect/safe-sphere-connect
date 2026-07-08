"use client";

import { useRef } from "react";
import { Camera, X } from "lucide-react";
import {
  ACCEPTED_IMAGE_TYPES,
  MAX_IMAGE_SIZE_BYTES,
  MAX_INCIDENT_IMAGES,
} from "@/lib/image-upload";

export type PendingImage = {
  file: File;
  previewUrl: string;
};

type ImageUploadFieldProps = {
  images: PendingImage[];
  onAdd: (files: File[]) => void;
  onRemove: (index: number) => void;
  disabled?: boolean;
  error?: string | null;
};

export function ImageUploadField({ images, onAdd, onRemove, disabled, error }: ImageUploadFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  function handleFileInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (files.length > 0) onAdd(files);
    // Allow re-selecting the same file after removal.
    e.target.value = "";
  }

  const canAddMore = images.length < MAX_INCIDENT_IMAGES;

  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium text-foreground">
        Photos <span className="font-normal text-muted">(optional, up to {MAX_INCIDENT_IMAGES})</span>
      </label>

      <div className="flex flex-wrap gap-3">
        {images.map((img, i) => (
          <div
            key={img.previewUrl}
            className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl border border-border bg-slate-100"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={img.previewUrl} alt={`Selected photo ${i + 1}`} className="h-full w-full object-cover" />
            <button
              type="button"
              onClick={() => onRemove(i)}
              disabled={disabled}
              aria-label="Remove photo"
              className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80 disabled:opacity-50"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ))}

        {canAddMore && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={disabled}
            className="flex h-20 w-20 shrink-0 flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-border text-muted hover:border-primary hover:text-primary disabled:opacity-50"
          >
            <Camera className="h-5 w-5" />
            <span className="text-[11px] font-medium">Add</span>
          </button>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED_IMAGE_TYPES.join(",")}
        multiple
        className="hidden"
        onChange={handleFileInputChange}
        disabled={disabled}
      />

      <p className="text-xs text-muted">
        JPG, PNG, or WEBP. Max {Math.round(MAX_IMAGE_SIZE_BYTES / (1024 * 1024))}MB per photo.
      </p>

      {error && <p className="text-xs text-danger">{error}</p>}
    </div>
  );
}
