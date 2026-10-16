import { AlertTriangle, Wrench } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { PageHeader } from "@/components/layout/PageHeader";
import { AdminAreaHealthCard } from "@/components/features/admin/AdminAreaHealthCard";
import { ROUTES } from "@/lib/constants";

export const metadata = {
  title: "Admin Dashboard",
};

export default function AdminDashboardPage() {
  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        title="Admin Dashboard"
        subtitle="Monitor and manage city safety operations across India"
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card padding="md">
          <h2 className="mb-1 font-semibold text-foreground">Review queues</h2>
          <p className="mb-4 text-sm text-muted">
            Approve or reject community submissions before they appear publicly.
          </p>
          <div className="flex flex-col gap-2">
            <Button variant="outline" href={`${ROUTES.admin}/incidents`}>
              <AlertTriangle className="h-4 w-4" />
              Incident reports
            </Button>
            <Button variant="outline" href={`${ROUTES.admin}/reports`}>
              <Wrench className="h-4 w-4" />
              Civic reports (Fix My City)
            </Button>
          </div>
        </Card>

        <AdminAreaHealthCard />
      </div>
    </div>
  );
}
