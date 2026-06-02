import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";

export function CardSkeleton() {
  return (
    <Card className="p-3">
      <Skeleton className="h-40 w-full rounded-xl" />
      <Skeleton className="mt-3 h-4 w-3/4" />
      <Skeleton className="mt-2 h-3 w-1/2" />
      <div className="mt-2 flex gap-1">
        <Skeleton className="h-4 w-12" />
        <Skeleton className="h-4 w-10" />
      </div>
    </Card>
  );
}
