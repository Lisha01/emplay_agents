import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "outline" | "ghost" | "ghostPrimary" | "subtle" | "danger";
type Size = "sm" | "md";

const variants: Record<Variant, string> = {
  primary: "bg-primary text-primary-fg hover:bg-primary-hover shadow-sm",
  secondary: "bg-surface text-strong border border-border hover:bg-surface-muted",
  outline: "bg-surface text-primary border border-primary hover:bg-primary-subtle",
  ghost: "text-text hover:bg-surface-muted",
  ghostPrimary: "text-primary hover:bg-primary-subtle",
  subtle: "bg-primary-subtle text-primary hover:bg-primary-border/60",
  danger: "text-danger hover:bg-danger-bg",
};

const sizes: Record<Size, string> = {
  sm: "h-8 px-3 text-[13px] gap-1.5",
  md: "h-10 px-4 text-sm gap-2",
};

export function Button({
  variant = "secondary",
  size = "md",
  className,
  children,
  ...props
}: {
  variant?: Variant;
  size?: Size;
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center rounded-lg font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50",
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}
