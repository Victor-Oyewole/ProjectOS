import type { HTMLAttributes } from "react";
import { cn } from "../cn";

// Doc 19 Section 1 (Loading state): "Skeleton screens matching the final
// layout's shape (not a generic spinner)." This is the one shape
// primitive -- callers compose several of these (varying width/height) to
// mimic whatever layout is actually loading, e.g. a text line, an avatar
// circle, a card outline.
export function Skeleton({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("animate-pulse rounded-sm bg-border", className)} {...props} />;
}
