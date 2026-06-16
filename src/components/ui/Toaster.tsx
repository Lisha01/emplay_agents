"use client";

import { CheckCircle2, X } from "@/components/ui/icons";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";

/** Transient confirmations for store actions (spec §8.4 `Toast`). */
export function Toaster() {
  const toasts = useStore((s) => s.toasts);
  const dismiss = useStore((s) => s.dismissToast);

  return (
    <div className="pointer-events-none fixed bottom-6 left-1/2 z-50 flex -translate-x-1/2 flex-col items-center gap-2">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={cn(
            "pointer-events-auto flex items-center gap-2.5 rounded-xl border bg-surface px-4 py-2.5 text-sm shadow-lg",
            t.tone === "success" ? "border-success/30" : "border-border",
          )}
        >
          {t.tone === "success" && <CheckCircle2 className="h-4 w-4 text-success" />}
          <span className="text-strong">{t.message}</span>
          <button onClick={() => dismiss(t.id)} className="text-muted hover:text-strong" aria-label="Dismiss">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
}
