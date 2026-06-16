import { cn } from "@/lib/utils";

type Tone =
  | "nurture"
  | "priority"
  | "engage"
  | "running"
  | "paused"
  | "completed"
  | "approved"
  | "draft"
  | "recommended"
  | "fullControl"
  | "ai"
  | "manual"
  | "personalisation"
  | "info"
  | "neutral";

const styles: Record<Tone, string> = {
  nurture: "bg-nurture-bg text-nurture-fg",
  priority: "bg-primary-subtle text-primary border border-primary-border",
  engage: "bg-info-bg text-info",
  running: "bg-success-bg text-success",
  paused: "bg-warning-bg text-warning",
  completed: "bg-info-bg text-info",
  approved: "bg-success-bg text-success",
  draft: "bg-surface-muted text-muted border border-border",
  recommended: "bg-primary-subtle text-primary border border-primary-border",
  fullControl: "bg-surface-muted text-muted border border-border",
  ai: "bg-primary-subtle text-primary",
  manual: "bg-surface-muted text-muted border border-border",
  personalisation: "bg-accent-subtle text-accent",
  info: "bg-info-bg text-info",
  neutral: "bg-surface-muted text-muted border border-border",
};

/** Routing, status, build-type, and meta pills (spec §8.4 `Badge`). */
export function Badge({
  tone = "neutral",
  children,
  dot,
  className,
  uppercase,
}: {
  tone?: Tone;
  children: React.ReactNode;
  dot?: boolean;
  className?: string;
  uppercase?: boolean;
}) {
  const dotColor: Partial<Record<Tone, string>> = {
    running: "bg-success",
    paused: "bg-warning",
    completed: "bg-info",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium whitespace-nowrap",
        uppercase && "uppercase tracking-wide text-[0.6875rem]",
        styles[tone],
        className,
      )}
    >
      {dot && <span className={cn("h-1.5 w-1.5 rounded-full", dotColor[tone] ?? "bg-current")} />}
      {children}
    </span>
  );
}

/** Map a routing label (NURTURE / PRIORITY / ENGAGE) to a Badge tone. */
export function routingTone(badge: string): Tone {
  const b = badge.toUpperCase();
  if (b.startsWith("PRIORITY")) return "priority";
  if (b.startsWith("ENGAGE")) return "engage";
  return "nurture";
}
