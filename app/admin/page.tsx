import {
  AlertTriangle,
  CheckCircle,
  TrendingUp,
  Users,
  Wrench,
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { PageHeader } from "@/components/layout/PageHeader";

const stats = [
  { label: "Active Users", value: "24,891", change: "+12.4%", icon: Users, color: "text-blue-600 bg-blue-50" },
  { label: "Open Incidents", value: "63", change: "-8%", icon: AlertTriangle, color: "text-red-600 bg-red-50" },
  { label: "Civic Reports", value: "284", change: "+31%", icon: Wrench, color: "text-teal-600 bg-teal-50" },
  { label: "Resolved Today", value: "42", change: "+9%", icon: CheckCircle, color: "text-emerald-600 bg-emerald-50" },
];

const recentActivity = [
  { action: "New Guardian Mode alert — 112 dialed", user: "Priya S., Sector 22 Chandigarh", time: "2 min ago", type: "danger" as const },
  { action: "Pothole report submitted", user: "Rahul V., Mohali", time: "15 min ago", type: "info" as const },
  { action: "Women helpline referral", user: "SHE Team, Panchkula", time: "28 min ago", type: "info" as const },
  { action: "Incident resolved", user: "Inspector Mehta, Delhi", time: "45 min ago", type: "success" as const },
  { action: "New user registered", user: "Ananya K., Bengaluru", time: "1 hr ago", type: "default" as const },
];

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

      <div className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label} padding="md">
              <div className="flex items-start justify-between">
                <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${stat.color}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <span className="flex items-center gap-1 text-xs font-medium text-accent">
                  <TrendingUp className="h-3 w-3" />
                  {stat.change}
                </span>
              </div>
              <p className="mt-4 text-2xl font-bold text-foreground">{stat.value}</p>
              <p className="text-sm text-muted">{stat.label}</p>
            </Card>
          );
        })}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card padding="md">
          <h2 className="mb-4 font-semibold text-foreground">Recent Activity</h2>
          <div className="flex flex-col gap-3">
            {recentActivity.map((activity, index) => (
              <div
                key={index}
                className="flex items-center justify-between border-b border-border pb-3 last:border-0 last:pb-0"
              >
                <div>
                  <p className="text-sm font-medium text-foreground">{activity.action}</p>
                  <p className="text-xs text-muted">{activity.user}</p>
                </div>
                <div className="text-right">
                  <Badge variant={activity.type}>{activity.type === "danger" ? "Urgent" : activity.type === "success" ? "Done" : "New"}</Badge>
                  <p className="mt-1 text-xs text-muted">{activity.time}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card padding="md">
          <h2 className="mb-4 font-semibold text-foreground">Area Health Overview — Sector 22, Chandigarh</h2>
          <div className="flex flex-col items-center py-6">
            <p className="text-5xl font-bold text-primary">78</p>
            <p className="mt-1 text-sm text-muted">Area Health Score</p>
            <Badge variant="success" className="mt-3">Good Standing</Badge>
          </div>
          <div className="mt-4 space-y-3 border-t border-border pt-4">
            {[
              { label: "112 Response Rate", value: "94%" },
              { label: "Report Resolution", value: "81%" },
              { label: "Citizen Satisfaction", value: "87%" },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between text-sm">
                <span className="text-muted">{item.label}</span>
                <span className="font-semibold text-foreground">{item.value}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
