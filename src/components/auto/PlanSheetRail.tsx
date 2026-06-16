import { FileText, Sparkles } from "@/components/ui/icons";

/**
 * The Sheets rail before the run starts: the only sheet is the Plan itself
 * (during Clarify it's being drafted; during Plan it's ready to approve).
 */
export function PlanSheetRail() {
  return (
    <div className="flex flex-col gap-1 p-3">
      <p className="eyebrow px-2 pb-1 pt-1">Sheets · 1</p>
      <div aria-current="step" className="flex items-center gap-3 rounded-lg bg-primary-subtle px-2.5 py-2">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary-subtle text-primary">
          <FileText className="h-3.5 w-3.5" />
        </span>
        <span className="flex min-w-0 flex-1 items-center gap-1.5 text-sm font-medium text-primary">
          <Sparkles className="h-3.5 w-3.5 shrink-0 opacity-70" />
          <span className="truncate">Plan</span>
        </span>
      </div>
    </div>
  );
}
