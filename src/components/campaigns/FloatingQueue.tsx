"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronUp, Layers, X } from "@/components/ui/icons";
import { useStore } from "@/lib/store";

/** Floating personalisation-queue affordance — accent moment (spec §6.4, Image 3). */
export function FloatingQueue({ ready }: { ready: number }) {
  const [open, setOpen] = useState(false);
  const setStep = useStore((s) => s.setStep);
  const setAutoRun = useStore((s) => s.setAutoRun);
  const router = useRouter();
  const review = () => {
    setOpen(false);
    setAutoRun(false);
    setStep(3);
    router.push("/workbook");
  };

  return (
    <div className="absolute bottom-24 right-5 z-10">
      {open ? (
        <div className="w-64 rounded-xl border border-border bg-surface p-3 shadow-lg">
          <div className="mb-2 flex items-center gap-2">
            <Layers className="h-4 w-4 text-accent" />
            <span className="text-sm font-semibold text-strong">Personalisation Queue</span>
            <button onClick={() => setOpen(false)} className="ml-auto text-muted hover:text-strong" aria-label="Close">
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
          <p className="mb-2 text-[13px] text-muted">{ready} accounts ready to launch.</p>
          <button
            onClick={review}
            className="w-full rounded-lg bg-primary px-3 py-2 text-[13px] font-medium text-primary-fg hover:bg-primary-hover"
          >
            Review in Workbook
          </button>
        </div>
      ) : (
        <button
          onClick={() => setOpen(true)}
          className="flex items-center gap-2 rounded-full bg-accent px-4 py-2.5 text-sm font-medium text-white shadow-lg hover:opacity-95"
        >
          <Layers className="h-4 w-4" />
          {ready} accounts ready
          <ChevronUp className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
