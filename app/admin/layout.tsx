import Link from "next/link";
import { AlertTriangle, LayoutDashboard, Wrench } from "lucide-react";
import { Logo } from "@/components/layout/Logo";
import { AdminAuthGuard } from "@/components/layout/AdminAuthGuard";
import { ROUTES } from "@/lib/constants";
import { cn } from "@/lib/utils";

const adminNav = [
  { label: "Overview", href: ROUTES.admin, icon: LayoutDashboard },
  { label: "Incidents", href: `${ROUTES.admin}/incidents`, icon: AlertTriangle },
  { label: "Reports", href: `${ROUTES.admin}/reports`, icon: Wrench },
  // Users, Analytics and Settings pages are placeholders; hidden until built.
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AdminAuthGuard>
    <div className="flex min-h-full flex-1">
      <aside className="hidden w-64 shrink-0 border-r border-border bg-surface lg:block">
        <div className="border-b border-border p-5">
          <Logo size="sm" href={ROUTES.dashboard} />
          <p className="mt-2 text-xs font-medium text-muted">Admin Panel</p>
        </div>
        <nav className="p-3">
          {adminNav.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-muted transition-colors hover:bg-primary-light hover:text-primary"
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>

      <div className="flex flex-1 flex-col">
        <header className="border-b border-border bg-surface px-4 py-3 safe-area-top lg:px-6">
          <div className="flex items-center justify-between">
            <Logo size="sm" href={ROUTES.dashboard} className="lg:hidden" />
            <p className="hidden text-sm font-semibold text-foreground lg:block">
              Admin Dashboard
            </p>
            <Link
              href={ROUTES.dashboard}
              className="text-sm font-medium text-primary hover:underline"
            >
              Back to App
            </Link>
          </div>
        </header>

        <main className="flex-1 px-4 py-6 lg:px-8">{children}</main>

        <nav className="flex border-t border-border bg-surface lg:hidden safe-area-bottom">
          {adminNav.slice(0, 4).map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-1 flex-col items-center gap-0.5 py-2 text-muted"
                )}
              >
                <Icon className="h-5 w-5" />
                <span className="text-[10px] font-medium">{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
    </AdminAuthGuard>
  );
}
