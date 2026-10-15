"use client";

import {
  addDoc,
  collection,
  doc,
  getDocs,
  onSnapshot,
  query,
  serverTimestamp,
  updateDoc,
  where,
  type Timestamp,
  type Unsubscribe,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { safeWalkTrackRoute } from "@/lib/constants";
import { isGuardianModeSession } from "@/lib/guardian-mode-helpers";
import { createNotification } from "@/lib/notifications";
import type { GeoPoint, SafeWalkStatus } from "@/lib/types/safe-walk";

/**
 * Guardian Mode sessions are stored in the existing `safeWalks` collection
 * with `sessionType: "guardian-mode"` and no destination, so the existing
 * Firestore rules apply unchanged: only the walker writes, and only the
 * walker and the listed guardians can read.
 */
const SAFE_WALKS_COLLECTION = "safeWalks";

export type GuardianModeSession = {
  id: string;
  sessionType: "guardian-mode";
  walkerId: string;
  walkerName: string;
  status: SafeWalkStatus;
  currentLocation: GeoPoint | null;
  locationAccuracyMeters: number | null;
  locationUpdatedAt: Timestamp | null;
  guardianIds: string[];
  startedAt: Timestamp | null;
  endedAt: Timestamp | null;
  createdAt: Timestamp | null;
};

function toSession(
  d: import("firebase/firestore").QueryDocumentSnapshot | import("firebase/firestore").DocumentSnapshot
): GuardianModeSession {
  return { id: d.id, ...(d.data() as Omit<GuardianModeSession, "id">) };
}

export async function startGuardianModeSession(input: {
  walkerId: string;
  walkerName: string;
  guardianIds: string[];
  location: GeoPoint;
  accuracyMeters: number | null;
}): Promise<string> {
  const ref = await addDoc(collection(db, SAFE_WALKS_COLLECTION), {
    sessionType: "guardian-mode",
    walkerId: input.walkerId,
    walkerName: input.walkerName,
    status: "active" satisfies SafeWalkStatus,
    currentLocation: input.location,
    locationAccuracyMeters: input.accuracyMeters,
    locationUpdatedAt: serverTimestamp(),
    guardianIds: input.guardianIds,
    startedAt: serverTimestamp(),
    endedAt: null,
    endReason: null,
    createdAt: serverTimestamp(),
  });

  await notifyGuardians(input.guardianIds, ref.id, {
    title: `${input.walkerName} turned on Guardian Mode`,
    message: "They are sharing their live location with you. Tap to view it.",
  });
  return ref.id;
}

export async function updateGuardianModeLocation(
  sessionId: string,
  location: GeoPoint,
  accuracyMeters: number | null
): Promise<void> {
  await updateDoc(doc(db, SAFE_WALKS_COLLECTION, sessionId), {
    currentLocation: location,
    locationAccuracyMeters: accuracyMeters,
    locationUpdatedAt: serverTimestamp(),
  });
}

export async function endGuardianModeSession(session: GuardianModeSession): Promise<void> {
  await updateDoc(doc(db, SAFE_WALKS_COLLECTION, session.id), {
    status: "completed" satisfies SafeWalkStatus,
    endReason: "ended_by_walker",
    endedAt: serverTimestamp(),
  });
  await notifyGuardians(session.guardianIds, session.id, {
    title: `${session.walkerName} turned off Guardian Mode`,
    message: "They have stopped sharing their live location.",
  });
}

/** Resume an active session after a reload. */
export async function getActiveGuardianModeSession(
  walkerId: string
): Promise<GuardianModeSession | null> {
  const snap = await getDocs(
    query(
      collection(db, SAFE_WALKS_COLLECTION),
      where("walkerId", "==", walkerId),
      where("status", "==", "active")
    )
  );
  const found = snap.docs.find((d) => isGuardianModeSession(d.data()));
  return found ? toSession(found) : null;
}

export function subscribeToGuardianModeSession(
  sessionId: string,
  onChange: (session: GuardianModeSession | null) => void
): Unsubscribe {
  return onSnapshot(doc(db, SAFE_WALKS_COLLECTION, sessionId), (snap) => {
    onChange(snap.exists() ? toSession(snap) : null);
  });
}

/** Active Guardian Mode sessions where this user is a guardian. */
export function subscribeToGuardedSessions(
  guardianId: string,
  onChange: (sessions: GuardianModeSession[]) => void
): Unsubscribe {
  const q = query(
    collection(db, SAFE_WALKS_COLLECTION),
    where("guardianIds", "array-contains", guardianId)
  );
  return onSnapshot(q, (snapshot) => {
    onChange(
      snapshot.docs
        .filter((d) => isGuardianModeSession(d.data()) && d.data().status === "active")
        .map(toSession)
    );
  });
}

async function notifyGuardians(
  guardianIds: string[],
  sessionId: string,
  content: { title: string; message: string }
): Promise<void> {
  await Promise.all(
    guardianIds.map((guardianId) =>
      createNotification({
        userId: guardianId,
        title: content.title,
        message: content.message,
        type: "guardian-mode",
        actionUrl: safeWalkTrackRoute(sessionId),
      }).catch(() => {})
    )
  );
}
