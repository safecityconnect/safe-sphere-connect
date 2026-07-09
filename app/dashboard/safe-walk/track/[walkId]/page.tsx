import { TrackSafeWalkContent } from "@/components/features/safe-walk/TrackSafeWalkContent";

export const metadata = {
  title: "Live Journey · Safe Walk",
};

export default async function TrackSafeWalkPage({
  params,
}: {
  params: Promise<{ walkId: string }>;
}) {
  const { walkId } = await params;
  return <TrackSafeWalkContent walkId={walkId} />;
}
