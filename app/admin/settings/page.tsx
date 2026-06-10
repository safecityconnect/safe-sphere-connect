import { PageHeader } from "@/components/layout/PageHeader";
import { Card } from "@/components/ui/Card";

export const metadata = { title: "Admin Settings" };

export default function AdminSettingsPage() {
  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader title="Settings" subtitle="Configure admin panel preferences" />
      <Card padding="lg" className="text-center text-muted">
        Admin settings — connect backend to populate data.
      </Card>
    </div>
  );
}
