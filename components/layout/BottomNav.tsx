"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BOTTOM_NAV_ITEMS } from "@/lib/constants";
import { useLocale } from "@/components/providers/LocaleProvider";
import type { TranslationKeys } from "@/lib/i18n";
import { cn } from "@/lib/utils";

function getNavLabel(
  item: (typeof BOTTOM_NAV_ITEMS)[number],
  t: TranslationKeys
): string {
  if (!item.labelKey) return item.label;
  const key = item.labelKey as keyof TranslationKeys;
  return t[key] ?? item.label;
}

export function BottomNav() {
  const pathname = usePathname();
  const { t } = useLocale();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-surface/95 backdrop-blur-md safe-area-bottom"
      aria-label="Main navigation"
    >
      <div className="mx-auto flex max-w-lg items-end justify-around px-2 pb-2 pt-1">
        {BOTTOM_NAV_ITEMS.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/dashboard" && pathname.startsWith(item.href));
          const Icon = item.icon;
          const label = getNavLabel(item, t);

          if (item.highlight) {
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex flex-col items-center gap-0.5 -mt-4"
              >
                <div
                  className={cn(
                    "flex h-14 w-14 items-center justify-center rounded-full shadow-lg transition-transform active:scale-95",
                    isActive
                      ? "bg-danger ring-4 ring-danger/20"
                      : "bg-danger hover:bg-red-600"
                  )}
                >
                  <Icon className="h-6 w-6 text-white" strokeWidth={2.5} />
                </div>
                <span
                  className={cn(
                    "text-[10px] font-semibold",
                    isActive ? "text-danger" : "text-muted"
                  )}
                >
                  {label}
                </span>
              </Link>
            );
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center gap-0.5 px-3 py-1.5 transition-colors",
                isActive ? "text-primary" : "text-muted hover:text-foreground"
              )}
            >
              <Icon className="h-5 w-5" strokeWidth={isActive ? 2.5 : 2} />
              <span className="text-[10px] font-medium">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
