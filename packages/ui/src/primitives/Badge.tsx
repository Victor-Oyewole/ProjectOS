import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "../cn";

export type BadgeTone = "success" | "warning" | "danger" | "info" | "neutral";

// Doc 18 Section 2 (Status Badge) / Doc 18 Section 4 (accessibility):
// "color-coded... with an icon (not color alone)" -- `icon` is a required
// prop on purpose, not optional, so a caller can't accidentally ship a
// color-only badge. Pass an explicit `null` (rare) only when the label
// text alone is already unambiguous without a semantic tone at all.
const TONE_CLASSES: Record<BadgeTone, string> = {
  success: "bg-success/10 text-success",
  warning: "bg-warning/10 text-warning",
  danger: "bg-danger/10 text-danger",
  info: "bg-info/10 text-info",
  neutral: "bg-border text-ink-secondary",
};

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: BadgeTone;
  icon: ReactNode | null;
}

export function Badge({ tone = "neutral", icon, className, children, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-3 py-1 text-sm font-medium",
        TONE_CLASSES[tone],
        className,
      )}
      {...props}
    >
      {icon}
      {children}
    </span>
  );
}
