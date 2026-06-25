import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

// Semantic status badge. Colors carry meaning only — no decorative color.
// All variants meet 4.5:1 contrast on their tint (WCAG AA).
const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-xs font-medium",
  {
    variants: {
      variant: {
        neutral: "bg-secondary text-secondary-foreground",
        info: "bg-accent text-accent-foreground",
        success:
          "bg-[oklch(0.95_0.05_150)] text-[oklch(0.42_0.12_150)] dark:bg-[oklch(0.3_0.06_150)] dark:text-[oklch(0.85_0.12_150)]",
        warning:
          "bg-[oklch(0.95_0.06_85)] text-[oklch(0.45_0.12_85)] dark:bg-[oklch(0.32_0.06_85)] dark:text-[oklch(0.85_0.12_85)]",
        danger: "bg-destructive/10 text-destructive",
      },
    },
    defaultVariants: { variant: "neutral" },
  }
);

export function Badge({
  className,
  variant,
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & VariantProps<typeof badgeVariants>) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { badgeVariants };
