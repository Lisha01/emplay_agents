import type { LucideIcon } from "@/components/ui/icons";
import { cn } from "@/lib/utils";

type Tone = "default" | "success" | "info" | "primary" | "warning";

const NUM: Record<Tone, string> = {
  default: "text-strong",
  success: "text-success",
  info: "text-info",
  primary: "text-primary",
  warning: "text-warning",
};

/** Label + big number tile; rendered in a row of 5 (spec §8.4 `StatTile`). */
export function StatTile({
  label,
  value,
  icon: Icon,
  accent,
  tone,
}: {
  label: string;
  value: number | string;
  icon?: LucideIcon;
  accent?: boolean;
  tone?: Tone;
}) {
  const t: Tone = tone ?? (accent ? "primary" : "default");
  return (
    <div className="flex flex-col gap-1 rounded-xl border border-border-subtle bg-surface px-4 py-3">
      <div className="flex items-center gap-1.5">
        {Icon && <Icon className={cn("h-3.5 w-3.5", t === "default" ? "text-muted" : NUM[t])} />}
        <span className="eyebrow">{label}</span>
      </div>
      <span className={cn("text-2xl font-semibold tabular-nums", NUM[t])}>{value}</span>
    </div>
  );
}
