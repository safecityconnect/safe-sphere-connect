"use client";

import { BellOff, CheckCheck } from "lucide-react";
import { NotificationItem } from "@/components/features/notifications/NotificationItem";
import { Skeleton } from "@/components/ui/Skeleton";
import type { AppNotification } from "@/lib/types/notification";

type NotificationPanelProps = {
  notifications: AppNotification[];
  isLoading: boolean;
  unreadCount: number;
  onSelectNotification: (notification: AppNotification) => void;
  onMarkAllRead: () => void;
};

export function NotificationPanel({
  notifications,
  isLoading,
  unreadCount,
  onSelectNotification,
  onMarkAllRead,
}: NotificationPanelProps) {
  return (
    <div className="flex max-h-[26rem] w-80 flex-col overflow-hidden rounded-2xl border border-border bg-surface shadow-xl">
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <h3 className="text-sm font-semibold text-foreground">Notifications</h3>
        {unreadCount > 0 && (
          <button
            type="button"
            onClick={onMarkAllRead}
            className="flex items-center gap-1 text-xs font-medium text-primary hover:text-primary-dark"
          >
            <CheckCheck className="h-3.5 w-3.5" />
            Mark all read
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="flex flex-col gap-3 p-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-start gap-3">
                <Skeleton className="h-9 w-9 shrink-0 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-3.5 w-3/4" />
                  <Skeleton className="h-3 w-full" />
                </div>
              </div>
            ))}
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center px-6 py-10 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-light text-primary">
              <BellOff className="h-6 w-6" />
            </div>
            <p className="mt-3 text-sm font-semibold text-foreground">
              No notifications yet
            </p>
            <p className="mt-1 text-xs text-muted">
              We&apos;ll let you know when there&apos;s something new.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {notifications.map((notification) => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                onSelect={onSelectNotification}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
