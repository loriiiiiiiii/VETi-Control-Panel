import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

type CardProps = {
  title: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
};

export function Card({
  title,
  description,
  actions,
  children,
  className,
  bodyClassName,
}: CardProps) {
  return (
    <section
      className={cn(
        "flex flex-col rounded-xl border border-border bg-bg-panel shadow-lg shadow-black/30",
        className,
      )}
    >
      <header className="flex items-start justify-between gap-4 border-b border-border px-5 py-4">
        <div className="min-w-0">
          <h2 className="truncate text-base font-semibold tracking-tight text-slate-100">
            {title}
          </h2>
          {description && (
            <p className="mt-0.5 truncate text-xs text-slate-400">
              {description}
            </p>
          )}
        </div>
        {actions && <div className="shrink-0">{actions}</div>}
      </header>
      <div className={cn("flex-1 px-5 py-4", bodyClassName)}>{children}</div>
    </section>
  );
}
