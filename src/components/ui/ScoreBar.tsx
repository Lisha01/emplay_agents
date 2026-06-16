import type { LucideIcon } from "@/components/ui/icons";

/** A single labeled axis of the scorecard; null value renders as "—" (spec §8.4). */
export function ScoreBar({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: number | null;
  icon?: LucideIcon;
}) {
  return (
    <div className="flex items-center gap-3 py-1.5">
      <div className="flex w-32 shrink-0 items-center gap-2 text-[13px] text-text">
        {Icon && <Icon className="h-3.5 w-3.5 text-muted" />}
        <span>{label}</span>
      </div>
      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-muted">
        {value !== null && (
          <div
            className="h-full rounded-full bg-primary transition-[width] duration-500"
            style={{ width: `${Math.min(100, value)}%` }}
          />
        )}
      </div>
      <span className="w-6 shrink-0 text-right text-[13px] font-semibold tabular-nums text-strong">
        {value === null ? <span className="text-muted">—</span> : value}
      </span>
    </div>
  );
}
