"use client";

import {
  collection,
  doc,
  addDoc,
  getDocs,
  onSnapshot,
  query,
  serverTimestamp,
  updateDoc,
  where,
  increment,
  type FirestoreError,
  type Unsubscribe,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { getFamilyLinksForChild, getUserName } from "@/lib/family";
import { isGuardianModeSession } from "@/lib/guardian-mode-helpers";
import type {
  GeoPoint,
  SafeWalkDestination,
  SafeWalkDoc,
  SafeWalkEndReason,
  SafeWalkGuardian,
  SafeWalkStatus,
} from "@/lib/types/safe-walk";

const SAFE_WALKS_COLLECTION = "safeWalks";

function toSafeWalk(
  d: import("firebase/firestore").QueryDocumentSnapshot
): SafeWalkDoc {
  return { id: d.id, ...(d.data() as Omit<SafeWalkDoc, "id">) };
}

/**
 * Guardians for a Safe Walk are simply the family members who linked this
 * user as their "child" (see lib/family.ts) — the same people FamilyContent
 * shows as "Linked Guardian(s)". Works for minors and adults alike, since
 * family linking itself isn't restricted by age.
 */
export async function getSafeWalkGuardians(
  walkerId: string
): Promise<SafeWalkGuardian[]> {
  const links = await getFamilyLinksForChild(walkerId);
  const guardians = await Promise.all(
    links.map(async (link) => ({
      uid: link.adultId,
      name: await getUserName(link.adultId),
    }))
  );

  const seen = new Set<string>();
  return guardians.filter((g) => {
    if (seen.has(g.uid)) return false;
    seen.add(g.uid);
    return true;
  });
}

export type CreateSafeWalkInput = {
  walkerId: string;
  walkerName: string;
  origin: GeoPoint;
  destination: SafeWalkDestination;
  routePath: GeoPoint[];
  distanceMeters: number;
  distanceText: string;
  durationSeconds: number;
  durationText: string;
  guardianIds: string[];
};

export async function createSafeWalk(
  input: CreateSafeWalkInput
): Promise<string> {
  const docRef = await addDoc(collection(db, SAFE_WALKS_COLLECTION), {
    sessionType: "safe-walk",
    walkerId: input.walkerId,
    walkerName: input.walkerName,
    status: "active" satisfies SafeWalkStatus,
    origin: input.origin,
    destination: input.destination,
    routePath: input.routePath,
    distanceMeters: input.distanceMeters,
    distanceText: input.distanceText,
    durationSeconds: input.durationSeconds,
    durationText: input.durationText,
    currentLocation: input.origin,
    locationUpdatedAt: serverTimestamp(),
    progressPercent: 0,
    guardianIds: input.guardianIds,
    startedAt: serverTimestamp(),
    endedAt: null,
    endReason: null,
    createdAt: serverTimestamp(),
  });
  return docRef.id;
}

export function subscribeToSafeWalk(
  walkId: string,
  onChange: (walk: SafeWalkDoc | null) => void,
  onError?: (error: FirestoreError) => void
): Unsubscribe {
  return onSnapshot(
    doc(db, SAFE_WALKS_COLLECTION, walkId),
    (snap) => {
      if (!snap.exists()) {
        onChange(null);
        return;
      }
      onChange({ id: snap.id, ...(snap.data() as Omit<SafeWalkDoc, "id">) });
    },
    onError
  );
}

/** Used on mount to resume a walk that's still active (e.g. after a reload). */
export async function getActiveSafeWalkForUser(
  walkerId: string
): Promise<SafeWalkDoc | null> {
  const q = query(
    collection(db, SAFE_WALKS_COLLECTION),
    where("walkerId", "==", walkerId),
    where("status", "==", "active")
  );
  const snap = await getDocs(q);
  const walk = snap.docs.map(toSafeWalk).find((w) => !isGuardianModeSession(w));
  return walk ?? null;
}

/**
 * Live active walks a guardian is allowed to see. Filters by `status`
 * client-side (like lib/notifications.ts does) to avoid requiring a
 * composite Firestore index for this foundational feature.
 */
export function subscribeToGuardianActiveWalks(
  guardianId: string,
  onChange: (walks: SafeWalkDoc[]) => void
): Unsubscribe {
  const q = query(
    collection(db, SAFE_WALKS_COLLECTION),
    where("guardianIds", "array-contains", guardianId)
  );

  return onSnapshot(q, (snapshot) => {
    const walks = snapshot.docs
      .map(toSafeWalk)
      .filter((w) => w.status === "active" && !isGuardianModeSession(w))
      .sort(
        (a, b) =>
          (b.startedAt?.toMillis?.() ?? 0) - (a.startedAt?.toMillis?.() ?? 0)
      );
    onChange(walks);
  });
}

export async function updateSafeWalkLocation(
  walkId: string,
  location: GeoPoint,
  progressPercent: number
): Promise<void> {
  await updateDoc(doc(db, SAFE_WALKS_COLLECTION, walkId), {
    currentLocation: location,
    locationUpdatedAt: serverTimestamp(),
    progressPercent,
  });
}

export async function finishSafeWalk(
  walkId: string,
  status: Extract<SafeWalkStatus, "completed" | "cancelled">,
  endReason: SafeWalkEndReason
): Promise<void> {
  await updateDoc(doc(db, SAFE_WALKS_COLLECTION, walkId), {
    status,
    endReason,
    endedAt: serverTimestamp(),
    ...(status === "completed" ? { progressPercent: 100 } : {}),
  });
}

export async function incrementUserSafeWalkCount(uid: string): Promise<void> {
  await updateDoc(doc(db, "users", uid), {
    "stats.safeWalks": increment(1),
  });
}
