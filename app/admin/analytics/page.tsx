import { PageHeader } from "@/components/layout/PageHeader";
import { Card } from "@/components/ui/Card";

export const metadata = { title: "Analytics" };

export default function AdminAnalyticsPage() {
  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader title="Analytics" subtitle="City safety trends and insights" />
      <Card padding="lg" className="text-center text-muted">
        Analytics dashboard — connect backend to populate data.
      </Card>
    </div>
  );
}
