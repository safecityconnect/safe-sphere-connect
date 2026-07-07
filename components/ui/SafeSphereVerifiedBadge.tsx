"use client";

import { useState } from "react";

export function SafeSphereVerifiedBadge() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setOpen(true);
        }}
        className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700 transition-colors hover:bg-blue-100"
        aria-label="SafeSphere Verified — tap to learn more"
      >
        🛡️ SafeSphere Verified
      </button>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="ssv-modal-title"
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center"
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h2
              id="ssv-modal-title"
              className="mb-3 text-base font-semibold text-foreground"
            >
              🛡️ SafeSphere Verified
            </h2>
            <p className="text-sm leading-relaxed text-muted">
              Reports with this badge have been reviewed and published by the
              SafeSphere team using trusted and reliable information.
            </p>
            <p className="mt-3 text-sm leading-relaxed text-muted">
              This helps provide a dependable foundation for the community
              while SafeSphere continues to grow through user contributions.
            </p>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="mt-5 w-full rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary/90"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
}
