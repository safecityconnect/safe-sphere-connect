"use client";

import { useAdminGuard } from "@/hooks/useAdminGuard";

export function AdminAuthGuard({ children }: { children: React.ReactNode }) {
  const { loading, isAdmin } = useAdminGuard();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return <>{children}</>;
}
