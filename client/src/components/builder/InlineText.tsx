import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { Pencil, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

// Shared bare input: no heavy ring, transparent, content-first.
// Specify the property + duration + curve (not `transition` shorthand).
const inputCls =
  "w-full min-w-0 bg-transparent outline-none border-b border-primary/40 focus:border-primary pb-0.5 transition-[border-color] duration-200 ease-out";

/**
 * Display value as text. Double-click or pencil → inline input.
 * Enter = save, Esc = revert, Blur = save if changed+non-empty else revert.
 */
export function InlineEdit({
  value,
  onSave,
  placeholder = "Untitled",
  className,
  inputClassName,
  ariaLabel = "Edit",
}: {
  value: string;
  onSave: (v: string) => void;
  placeholder?: string;
  className?: string;
  inputClassName?: string;
  ariaLabel?: string;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) {
      ref.current?.focus();
      ref.current?.select();
    }
  }, [editing]);

  function start() {
    setDraft(value);
    setEditing(true);
  }
  function commit() {
    const v = draft.trim();
    if (v && v !== value) onSave(v);
    setEditing(false);
  }
  function cancel() {
    setDraft(value);
    setEditing(false);
  }
  function onKey(e: KeyboardEvent) {
    if (e.key === "Enter") {
      e.preventDefault();
      commit();
    } else if (e.key === "Escape") {
      e.preventDefault();
      cancel();
    }
  }

  if (editing) {
    return (
      <input
        ref={ref}
        value={draft}
        aria-label={ariaLabel}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={onKey}
        onBlur={commit}
        placeholder={placeholder}
        className={cn(inputCls, className, inputClassName)}
      />
    );
  }

  return (
    <span className={cn("group/inline inline-flex items-center gap-1.5", className)}>
      {/* Notion-style: whole label gets a soft hover highlight to signal "editable". */}
      <span
        onDoubleClick={start}
        className={cn(
          "-mx-1 cursor-text rounded px-1 transition-colors duration-150 ease-out hover:bg-secondary/70",
          !value && "text-muted-foreground"
        )}
        title="Double-click to edit"
      >
        {value || placeholder}
      </span>
      <button
        type="button"
        onClick={start}
        aria-label={ariaLabel}
        className="text-muted-foreground opacity-0 transition-[opacity,transform,color] duration-150 ease-out hover:text-foreground group-hover/inline:opacity-100 focus-visible:opacity-100 active:scale-90"
      >
        <Pencil className="size-3.5" />
      </button>
    </span>
  );
}

/**
 * Trigger button. Click → inline input. Enter/Blur(with content) = create,
 * Esc/Blur(empty) = cancel. Auto-focus on open.
 */
export function InlineCreate({
  label,
  onCreate,
  placeholder,
  className,
  size = "sm",
}: {
  label: string;
  onCreate: (v: string) => void;
  placeholder?: string;
  className?: string;
  size?: "sm" | "xs";
}) {
  const [active, setActive] = useState(false);
  const [draft, setDraft] = useState("");
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (active) ref.current?.focus();
  }, [active]);

  function commit() {
    const v = draft.trim();
    if (v) onCreate(v);
    setDraft("");
    setActive(false);
  }
  function cancel() {
    setDraft("");
    setActive(false);
  }
  function onKey(e: KeyboardEvent) {
    if (e.key === "Enter") {
      e.preventDefault();
      commit();
    } else if (e.key === "Escape") {
      e.preventDefault();
      cancel();
    }
  }

  if (active) {
    return (
      <input
        ref={ref}
        value={draft}
        aria-label={label}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={onKey}
        onBlur={commit}
        placeholder={placeholder ?? label}
        className={cn(
          inputCls,
          size === "xs" ? "text-sm" : "text-[0.95rem]",
          "max-w-xs",
          className
        )}
      />
    );
  }

  return (
    <button
      type="button"
      onClick={() => setActive(true)}
      className={cn(
        "inline-flex items-center gap-1 rounded-md font-medium text-muted-foreground transition-[color,background-color,transform] duration-150 ease-out hover:bg-secondary hover:text-foreground active:scale-[0.97]",
        size === "xs" ? "px-1.5 py-0.5 text-xs" : "px-2 py-1 text-sm",
        className
      )}
    >
      <Plus className={size === "xs" ? "size-3" : "size-3.5"} />
      {label}
    </button>
  );
}
