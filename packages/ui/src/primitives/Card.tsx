import type { HTMLAttributes } from "react";
import { cn } from "../cn";

// Doc 18 Section 2 (Card). Hover elevation is desktop-only ("no hover
// state on touch") -- handled by `hover:` itself doing nothing meaningful
// on touch devices (no persistent hover state to trigger), so no extra
// media-query guard is needed here.
export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-md border border-border bg-surface p-4 shadow-sm transition-shadow duration-fast ease-standard hover:shadow-md",
        className,
      )}
      {...props}
    />
  );
}
