import { useId, type InputHTMLAttributes } from "react";
import { Input } from "../primitives/Input";

// Doc 18 Section 2 (Form Inputs): "Label above input, text-sm,
// text-secondary... Error state: danger border + helper text below in
// danger." This is the pattern every form in the app hand-rolled
// individually before Milestone 6 -- graduated to a composite per Doc 21
// Section 3's own rule ("if a new pattern repeats twice, it graduates to
// composite").
export interface FieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

export function Field({ label, error, id, className, ...props }: FieldProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={inputId} className="text-sm text-ink-secondary">
        {label}
      </label>
      <Input id={inputId} invalid={!!error} className={className} {...props} />
      {error ? <p className="text-sm text-danger">{error}</p> : null}
    </div>
  );
}
