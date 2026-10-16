import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cn } from "../cn";

export type ButtonVariant = "primary" | "secondary" | "destructive";

// Doc 18 Section 2 (Button). "Destructive... requires confirmation dialog
// before action fires" is a per-usage concern, not something this
// presentational primitive enforces itself -- every destructive action in
// this codebase already uses an explicit open/confirm/cancel UI state
// (see e.g. teacher assignment retraction, transfer deny), not a native
// `window.confirm`, so that stays a caller-level pattern.
const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary: "bg-primary text-white hover:bg-primary-dark",
  secondary: "bg-surface text-primary border border-primary hover:bg-primary-light",
  destructive: "bg-surface text-danger border border-danger hover:bg-danger/10",
};

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "primary", className, disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled}
        className={cn(
          "inline-flex min-h-[44px] items-center justify-center gap-2 rounded-sm px-5 py-3 text-sm font-medium transition-colors duration-fast ease-standard",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
          disabled
            ? "cursor-not-allowed border border-border bg-border text-ink-disabled hover:bg-border"
            : VARIANT_CLASSES[variant],
          className,
        )}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";
