import { PageHeader } from "@/components/layout/PageHeader";
import { Card } from "@/components/ui/Card";

export const metadata = { title: "Incidents" };

export default function AdminIncidentsPage() {
  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader title="Incidents" subtitle="Manage and respond to safety incidents" />
      <Card padding="lg" className="text-center text-muted">
        Incident management interface — connect backend to populate data.
      </Card>
    </div>
  );
}
