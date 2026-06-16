import type { LucideIcon } from "@/components/ui/icons";

/** Empty state that invites the next action in the product's voice (spec §8.6). */
export function EmptyState({
  icon: Icon,
  title,
  body,
  action,
}: {
  icon: LucideIcon;
  title: string;
  body?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border bg-surface/50 px-6 py-12 text-center">
      <div className="flex h-11 w-11 items-center justify-center rounded-full bg-surface-muted">
        <Icon className="h-5 w-5 text-muted" />
      </div>
      <div className="space-y-1">
        <p className="text-sm font-semibold text-strong">{title}</p>
        {body && <p className="max-w-sm text-[13px] text-muted">{body}</p>}
      </div>
      {action}
    </div>
  );
}
