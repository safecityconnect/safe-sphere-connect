import { PageHeader } from "@/components/layout/PageHeader";
import { Card } from "@/components/ui/Card";

export const metadata = { title: "Users" };

export default function AdminUsersPage() {
  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader title="Users" subtitle="Manage citizen accounts and roles" />
      <Card padding="lg" className="text-center text-muted">
        User management — connect backend to populate data.
      </Card>
    </div>
  );
}
