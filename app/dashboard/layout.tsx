import { BottomNav } from "@/components/layout/BottomNav";
import { DashboardAuthGuard } from "@/components/layout/DashboardAuthGuard";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <DashboardAuthGuard>
      <div className="min-h-full flex-1 bg-background">
        {children}
        <BottomNav />
      </div>
    </DashboardAuthGuard>
  );
}
