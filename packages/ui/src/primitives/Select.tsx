import { forwardRef, type SelectHTMLAttributes } from "react";
import { cn } from "../cn";

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  invalid?: boolean;
}

// Doc 18 Section 2 (Form Inputs) applies to every form input, not just
// `<input>` -- but every raw `<select>` across the app predates this
// primitive and has no focus-visible ring at all (a real keyboard-nav
// accessibility gap, not just a DRY concern). Same shape as `Input`.
export const Select = forwardRef<HTMLSelectElement, SelectProps>(({ invalid, className, ...props }, ref) => {
  return (
    <select
      ref={ref}
      aria-invalid={invalid || undefined}
      className={cn(
        "min-h-[44px] w-full rounded-sm border bg-surface px-3 py-2 text-base text-ink transition-shadow duration-fast ease-standard",
        "focus:outline-none focus:ring-2 focus:ring-primary",
        invalid ? "border-danger" : "border-border",
        className,
      )}
      {...props}
    />
  );
});
Select.displayName = "Select";
