import type { ComponentType, ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Reusable empty state: icon + title + hint + optional action.
 * One pattern for every "no data yet" screen (reuse + clarity).
 */
export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: {
  icon?: ComponentType<{ className?: string }>;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center rounded-xl border border-dashed bg-card/40 px-6 py-12 text-center",
        className
      )}
    >
      {Icon && (
        <span
          aria-hidden
          className="mb-3 grid size-10 place-items-center rounded-full bg-secondary text-muted-foreground"
        >
          <Icon className="size-5" />
        </span>
      )}
      <p className="font-medium">{title}</p>
      {description && <p className="mt-1 max-w-sm text-sm text-muted-foreground">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
