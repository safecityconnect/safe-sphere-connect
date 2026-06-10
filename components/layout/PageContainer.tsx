import { cn } from "@/lib/utils";

type PageContainerProps = {
  children: React.ReactNode;
  className?: string;
  withBottomNav?: boolean;
};

export function PageContainer({
  children,
  className,
  withBottomNav = false,
}: PageContainerProps) {
  return (
    <div
      className={cn(
        "mx-auto w-full max-w-lg px-4 py-6 safe-area-top",
        withBottomNav && "pb-24",
        className
      )}
    >
      {children}
    </div>
  );
}
