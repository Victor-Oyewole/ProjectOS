import { Skeleton } from "../primitives/Skeleton";

// Same rationale as TableSkeleton -- shared shape for card-grid dashboard
// views (Family child cards, Teacher class cards).
export function CardGridSkeleton({ cards = 3 }: { cards?: number }) {
  return (
    <div className="flex flex-col gap-4">
      {Array.from({ length: cards }).map((_, i) => (
        <div key={i} className="flex flex-col gap-3 rounded-md border border-border bg-surface p-4">
          <Skeleton className="h-5 w-1/3" />
          <Skeleton className="h-4 w-2/3" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      ))}
    </div>
  );
}
