import { useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

interface HoldToConfirmProps {
  onConfirm: () => void;
  children: ReactNode;
  /** Hold duration in ms. */
  duration?: number;
  className?: string;
  "aria-label"?: string;
}

/**
 * Press-and-hold to fire a destructive action. A colored overlay fills via
 * clip-path while held (slow, deliberate); release before full = snap back (fast).
 * Asymmetric timing: slow to decide, fast to respond.
 */
export function HoldToConfirm({
  onConfirm,
  children,
  duration = 1000,
  className,
  ...rest
}: HoldToConfirmProps) {
  const [holding, setHolding] = useState(false);
  const timer = useRef<number | null>(null);

  function start() {
    if (holding) return; // multi-touch / double-fire guard
    setHolding(true);
    timer.current = window.setTimeout(() => {
      setHolding(false);
      timer.current = null;
      onConfirm();
    }, duration);
  }

  function cancel() {
    if (timer.current !== null) {
      clearTimeout(timer.current);
      timer.current = null;
    }
    setHolding(false);
  }

  return (
    <button
      type="button"
      onPointerDown={(e) => {
        e.currentTarget.setPointerCapture(e.pointerId);
        start();
      }}
      onPointerUp={cancel}
      onPointerLeave={cancel}
      onPointerCancel={cancel}
      className={cn(
        "relative inline-flex h-7 shrink-0 select-none items-center overflow-hidden rounded-[min(var(--radius-md),12px)] border border-border bg-background px-2.5 text-[0.8rem] font-medium text-destructive transition-transform duration-150 ease-out",
        "hover:bg-destructive/5 active:scale-[0.97]",
        className
      )}
      {...rest}
    >
      {/* Fill overlay. Held: clip opens over `duration` linear. Released: snaps closed 200ms ease-out. */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-destructive/15"
        style={{
          clipPath: holding ? "inset(0 0 0 0)" : "inset(0 100% 0 0)",
          transition: holding
            ? `clip-path ${duration}ms linear`
            : "clip-path 200ms var(--ease-out)",
        }}
      />
      <span className="relative">{children}</span>
    </button>
  );
}
