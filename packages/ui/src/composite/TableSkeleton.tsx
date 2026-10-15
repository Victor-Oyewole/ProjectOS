import { Skeleton } from "../primitives/Skeleton";

// Doc 19 Section 1 (Loading state): "Skeleton screens matching the final
// layout's shape." Shared shape for every admin table-style list view
// (Fees, People Setup tabs, Transfers) -- row count/column widths are
// deliberately approximate, not pixel-matched per screen; still a closer
// match to the real layout than a generic spinner, which is the actual
// bar Doc 19 sets ("not a generic spinner").
export function TableSkeleton({ rows = 5, columns = 4 }: { rows?: number; columns?: number }) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-4 border-b border-border pb-2">
        {Array.from({ length: columns }).map((_, i) => (
          <Skeleton key={i} className="h-4 w-20" />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, row) => (
        <div key={row} className="flex gap-4 py-2">
          {Array.from({ length: columns }).map((_, col) => (
            <Skeleton key={col} className="h-4 w-24" />
          ))}
        </div>
      ))}
    </div>
  );
}
