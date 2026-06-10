import Link from "next/link";
import { ChevronRight } from "lucide-react";
import type { DashboardCardItem } from "@/lib/constants";
import { cn } from "@/lib/utils";

const colorStyles: Record<DashboardCardItem["color"], string> = {
  blue: "bg-blue-50 text-blue-600",
  teal: "bg-teal-50 text-teal-600",
  red: "bg-red-50 text-red-600",
  green: "bg-emerald-50 text-emerald-600",
  purple: "bg-purple-50 text-purple-600",
  slate: "bg-slate-100 text-slate-600",
};

type DashboardCardProps = {
  item: DashboardCardItem;
};

export function DashboardCard({ item }: DashboardCardProps) {
  const Icon = item.icon;

  return (
    <Link
      href={item.href}
      className="group flex items-center gap-4 rounded-2xl border border-border bg-surface p-4 shadow-sm transition-all hover:border-primary/30 hover:shadow-md active:scale-[0.98]"
    >
      <div
        className={cn(
          "flex h-12 w-12 shrink-0 items-center justify-center rounded-xl",
          colorStyles[item.color]
        )}
      >
        <Icon className="h-6 w-6" />
      </div>
      <div className="min-w-0 flex-1">
        <h3 className="font-semibold text-foreground">{item.title}</h3>
        <p className="mt-0.5 text-sm text-muted line-clamp-2">{item.description}</p>
      </div>
      <ChevronRight className="h-5 w-5 shrink-0 text-muted transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
    </Link>
  );
}
