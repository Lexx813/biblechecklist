import { forwardRef, type InputHTMLAttributes, type TextareaHTMLAttributes, type ReactNode } from "react";

/* ── Shared field wrapper ──────────────────────────────────────── */

export interface FieldProps {
  /** Label text above the input */
  label?: string;
  /** Helper or error text below the input */
  hint?: string;
  /** Mark as error state */
  error?: boolean;
  /** HTML id to link label → input */
  htmlFor?: string;
  children: ReactNode;
  className?: string;
}

export function Field({ label, hint, error, htmlFor, children, className }: FieldProps) {
  return (
    <div className={`flex flex-col gap-1.5 ${className ?? ""}`}>
      {label && (
        <label
          htmlFor={htmlFor}
          className="text-xs font-bold uppercase tracking-[0.05em] text-[var(--text-muted)]"
        >
          {label}
        </label>
      )}
      {children}
      {hint && (
        <span className={`text-xs ${error ? "text-[#dc2626]" : "text-[var(--text-muted)]"}`}>
          {hint}
        </span>
      )}
    </div>
  );
}

/* ── Input ──────────────────────────────────────────────────────── */

const inputBase =
  "h-12 w-full rounded-[var(--radius-lg)] border-[1.5px] border-[var(--border)] bg-[var(--bg)] px-4 text-[15px] font-medium text-[var(--text-primary)] placeholder:text-[var(--text-muted)] transition-all duration-150 focus:border-[var(--teal)] focus:shadow-[0_0_0_3px_rgba(124,58,237,0.12)] focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed font-[inherit]";

const inputError =
  "border-[#dc2626] focus:border-[#dc2626] focus:shadow-[0_0_0_3px_rgba(220,38,38,0.12)]";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  /** Icon placed inside the input on the left */
  iconLeft?: ReactNode;
  error?: boolean;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ iconLeft, error, className, ...props }, ref) => {
    if (iconLeft) {
      return (
        <div className="relative">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]">
            {iconLeft}
          </span>
          <input
            ref={ref}
            className={`${inputBase} pl-10 ${error ? inputError : ""} ${className ?? ""}`}
            {...props}
          />
        </div>
      );
    }
    return (
      <input
        ref={ref}
        className={`${inputBase} ${error ? inputError : ""} ${className ?? ""}`}
        {...props}
      />
    );
  },
);
Input.displayName = "Input";
export default Input;

/* ── Textarea ──────────────────────────────────────────────────── */

const textareaBase =
  "w-full min-h-[100px] rounded-[var(--radius)] border-[1.5px] border-[var(--border)] bg-[var(--bg)] px-3.5 py-3 text-sm leading-relaxed text-[var(--text-primary)] placeholder:text-[var(--text-muted)] transition-all duration-150 resize-y focus:border-[var(--teal)] focus:shadow-[0_0_0_3px_rgba(124,58,237,0.12)] focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed font-[inherit]";

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ error, className, ...props }, ref) => (
    <textarea
      ref={ref}
      className={`${textareaBase} ${error ? inputError : ""} ${className ?? ""}`}
      {...props}
    />
  ),
);
Textarea.displayName = "Textarea";
