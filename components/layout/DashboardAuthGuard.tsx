"use client";

import { useAuthGuard } from "@/hooks/useAuthGuard";

export function DashboardAuthGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuthGuard();

  if (loading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return <>{children}</>;
}
