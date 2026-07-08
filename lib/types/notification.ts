import type { Timestamp } from "firebase/firestore";

/**
 * Notification types. Kept intentionally generic so future features
 * (Safe Walk, SOS, Family Linking, Incident updates) can reuse this
 * same infrastructure without changing the schema.
 */
export type NotificationType =
  | "system"
  | "safe-walk"
  | "sos"
  | "family"
  | "incident";

export type AppNotification = {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: NotificationType;
  createdAt: Timestamp | null;
  isRead: boolean;
  /** Optional in-app route to navigate to when the notification is tapped. */
  actionUrl?: string;
};

/** Shape accepted when creating a notification. `id`/`createdAt`/`isRead` are set by the helper. */
export type CreateNotificationInput = {
  userId: string;
  title: string;
  message: string;
  type: NotificationType;
  actionUrl?: string;
};
