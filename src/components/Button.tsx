import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

type Variant = "primary" | "secondary" | "ghost" | "danger" | "success";
type Size = "sm" | "md" | "lg";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
  active?: boolean;
  loading?: boolean;
};

const VARIANT_STYLES: Record<Variant, string> = {
  primary:
    "bg-accent text-white hover:bg-accent-hover focus-visible:ring-accent disabled:bg-accent/40",
  secondary:
    "bg-bg-subtle text-slate-100 hover:bg-border-strong focus-visible:ring-border-strong disabled:bg-bg-subtle/60",
  ghost:
    "bg-transparent text-slate-300 hover:bg-bg-subtle focus-visible:ring-border-strong",
  danger:
    "bg-err text-white hover:bg-err/90 focus-visible:ring-err disabled:bg-err/40",
  success:
    "bg-ok text-white hover:bg-ok/90 focus-visible:ring-ok disabled:bg-ok/40",
};

const SIZE_STYLES: Record<Size, string> = {
  sm: "h-8 px-3 text-xs",
  md: "h-10 px-4 text-sm",
  lg: "h-12 px-5 text-base",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  function Button(
    {
      className,
      variant = "secondary",
      size = "md",
      active = false,
      loading = false,
      disabled,
      children,
      ...rest
    },
    ref,
  ) {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        aria-pressed={active || undefined}
        className={cn(
          "inline-flex select-none items-center justify-center gap-2 rounded-md font-medium transition-colors",
          "focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-bg-panel",
          "disabled:cursor-not-allowed",
          VARIANT_STYLES[variant],
          SIZE_STYLES[size],
          active && "ring-2 ring-accent ring-offset-2 ring-offset-bg-panel",
          className,
        )}
        {...rest}
      >
        {loading && (
          <span
            aria-hidden
            className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent"
          />
        )}
        {children}
      </button>
    );
  },
);
