import { PageContainer } from "@/components/layout/PageContainer";
import { PageHeader } from "@/components/layout/PageHeader";
import { ListSkeleton, Skeleton } from "@/components/ui/Skeleton";
import { ROUTES } from "@/lib/constants";

type PageLoadingProps = {
  title: string;
  subtitle?: string;
  showMap?: boolean;
};

export function PageLoading({ title, subtitle = "Loading...", showMap = false }: PageLoadingProps) {
  return (
    <PageContainer withBottomNav>
      <PageHeader title={title} subtitle={subtitle} backHref={ROUTES.dashboard} />
      {showMap && <Skeleton className="mb-4 h-56 rounded-2xl sm:h-72" />}
      <div className="mb-4 flex gap-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-8 w-20 rounded-full" />
        ))}
      </div>
      <ListSkeleton count={4} />
    </PageContainer>
  );
}
