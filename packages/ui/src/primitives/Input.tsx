import { forwardRef, type InputHTMLAttributes } from "react";
import { cn } from "../cn";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  invalid?: boolean;
}

// Doc 18 Section 2 (Form Inputs). Bare, label-less primitive -- see
// `Field` (composite) for the label + error-text wrapper every form in
// this app actually needs; this exists on its own for the rare case of an
// unlabeled input (e.g. inline table-cell editing).
export const Input = forwardRef<HTMLInputElement, InputProps>(({ invalid, className, ...props }, ref) => {
  return (
    <input
      ref={ref}
      aria-invalid={invalid || undefined}
      className={cn(
        "min-h-[44px] w-full rounded-sm border bg-surface px-3 py-2 text-base text-ink",
        "focus:outline-none focus:ring-2 focus:ring-primary",
        invalid ? "border-danger" : "border-border",
        className,
      )}
      {...props}
    />
  );
});
Input.displayName = "Input";
