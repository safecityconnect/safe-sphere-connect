"use client";

import {
  AlertTriangle,
  Bell,
  Footprints,
  ShieldCheck,
  Users,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatNotificationTime } from "@/lib/notifications";
import type { AppNotification, NotificationType } from "@/lib/types/notification";

const TYPE_ICON: Record<NotificationType, LucideIcon> = {
  system: Bell,
  "safe-walk": Footprints,
  "guardian-mode": ShieldCheck,
  family: Users,
  incident: AlertTriangle,
};

const TYPE_STYLES: Record<NotificationType, string> = {
  system: "bg-slate-100 text-slate-600",
  "safe-walk": "bg-accent-light text-emerald-700",
  "guardian-mode": "bg-primary-light text-primary-dark",
  family: "bg-primary-light text-primary-dark",
  incident: "bg-amber-100 text-amber-700",
};

type NotificationItemProps = {
  notification: AppNotification;
  onSelect: (notification: AppNotification) => void;
};

export function NotificationItem({ notification, onSelect }: NotificationItemProps) {
  const Icon = TYPE_ICON[notification.type] ?? Bell;

  return (
    <button
      type="button"
      onClick={() => onSelect(notification)}
      className={cn(
        "flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-primary-light/40",
        !notification.isRead && "bg-primary-light/20"
      )}
    >
      <div
        className={cn(
          "flex h-9 w-9 shrink-0 items-center justify-center rounded-full",
          TYPE_STYLES[notification.type] ?? TYPE_STYLES.system
        )}
      >
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <p
            className={cn(
              "text-sm text-foreground",
              !notification.isRead && "font-semibold"
            )}
          >
            {notification.title}
          </p>
          {!notification.isRead && (
            <span
              className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary"
              aria-label="Unread"
            />
          )}
        </div>
        <p className="mt-0.5 line-clamp-2 text-xs text-muted">{notification.message}</p>
        <p className="mt-1 text-[11px] text-muted">
          {formatNotificationTime(notification.createdAt)}
        </p>
      </div>
    </button>
  );
}
