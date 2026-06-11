"use client";

import { useState, useEffect } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { getFamilyLinksForChild } from "@/lib/family";
import { ROUTES } from "@/lib/constants";
import { AlertTriangle, X, Users } from "lucide-react";
import Link from "next/link";

/**
 * Shows a dismissible warning banner on any page when the current user is a
 * minor without a linked guardian. Drop it into any dashboard page that requires
 * family linking for full functionality.
 */
export function MinorLinkBanner() {
  const [show, setShow] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) return;
      try {
        const snap = await getDoc(doc(db, "users", user.uid));
        if (!snap.exists()) return;
        const data = snap.data();
        if (data.isMinor !== true) return;

        const links = await getFamilyLinksForChild(user.uid);
        if (links.length === 0) setShow(true);
      } catch {
        // fail silently
      }
    });
    return () => unsub();
  }, []);

  if (!show || dismissed) return null;

  return (
    <div className="mb-4 flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3.5">
      <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-amber-800">
          Guardian not linked
        </p>
        <p className="mt-0.5 text-xs text-amber-700">
          Some safety features are limited.{" "}
          <Link
            href={ROUTES.family}
            className="font-semibold underline underline-offset-2"
          >
            Link a guardian
          </Link>{" "}
          to unlock full access.
        </p>
      </div>
      <button
        type="button"
        onClick={() => setDismissed(true)}
        aria-label="Dismiss"
        className="mt-0.5 shrink-0 rounded-lg p-0.5 text-amber-600 transition-colors hover:bg-amber-100"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
