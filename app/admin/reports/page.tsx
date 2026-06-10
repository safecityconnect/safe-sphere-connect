import { PageHeader } from "@/components/layout/PageHeader";
import { Card } from "@/components/ui/Card";

export const metadata = { title: "Civic Reports" };

export default function AdminReportsPage() {
  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader title="Civic Reports" subtitle="Review and assign Fix My City submissions" />
      <Card padding="lg" className="text-center text-muted">
        Civic reports management — connect backend to populate data.
      </Card>
    </div>
  );
}
