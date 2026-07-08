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
  writeBatch,
  type Unsubscribe,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import type {
  AppNotification,
  CreateNotificationInput,
} from "@/lib/types/notification";

const NOTIFICATIONS_COLLECTION = "notifications";

function sortNewestFirst(notifications: AppNotification[]): AppNotification[] {
  return [...notifications].sort((a, b) => {
    const aTime = a.createdAt?.toDate?.().getTime() ?? 0;
    const bTime = b.createdAt?.toDate?.().getTime() ?? 0;
    return bTime - aTime;
  });
}

function toNotification(
  d: import("firebase/firestore").QueryDocumentSnapshot
): AppNotification {
  const data = d.data() as Omit<AppNotification, "id">;
  return { id: d.id, ...data };
}

/**
 * Subscribes to real-time notification updates for a user, ordered newest
 * first. Sorting happens client-side to avoid requiring a composite
 * Firestore index just for this foundational feature.
 */
export function subscribeToUserNotifications(
  userId: string,
  onChange: (notifications: AppNotification[]) => void
): Unsubscribe {
  const q = query(
    collection(db, NOTIFICATIONS_COLLECTION),
    where("userId", "==", userId)
  );

  return onSnapshot(q, (snapshot) => {
    const notifications = snapshot.docs.map(toNotification);
    onChange(sortNewestFirst(notifications));
  });
}

export async function listUserNotifications(
  userId: string
): Promise<AppNotification[]> {
  const q = query(
    collection(db, NOTIFICATIONS_COLLECTION),
    where("userId", "==", userId)
  );
  const snapshot = await getDocs(q);
  return sortNewestFirst(snapshot.docs.map(toNotification));
}

export async function markNotificationAsRead(
  notificationId: string
): Promise<void> {
  await updateDoc(doc(db, NOTIFICATIONS_COLLECTION, notificationId), {
    isRead: true,
  });
}

export async function markAllNotificationsAsRead(
  notificationIds: string[]
): Promise<void> {
  if (notificationIds.length === 0) return;
  const batch = writeBatch(db);
  for (const id of notificationIds) {
    batch.update(doc(db, NOTIFICATIONS_COLLECTION, id), { isRead: true });
  }
  await batch.commit();
}

/**
 * Creates a notification for a user. Not called anywhere automatically yet —
 * this is the entry point Safe Walk, SOS, Family Linking, and Incident
 * updates will call once they're wired up to send notifications.
 */
export function formatNotificationTime(
  timestamp: AppNotification["createdAt"]
): string {
  const date = timestamp?.toDate?.();
  if (!date) return "";

  const diffMs = Date.now() - date.getTime();
  const diffMinutes = Math.floor(diffMs / 60000);

  if (diffMinutes < 1) return "Just now";
  if (diffMinutes < 60) return `${diffMinutes}m ago`;

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h ago`;

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

export async function createNotification(
  input: CreateNotificationInput
): Promise<string> {
  const docRef = await addDoc(collection(db, NOTIFICATIONS_COLLECTION), {
    userId: input.userId,
    title: input.title,
    message: input.message,
    type: input.type,
    actionUrl: input.actionUrl ?? null,
    isRead: false,
    createdAt: serverTimestamp(),
  });
  return docRef.id;
}
