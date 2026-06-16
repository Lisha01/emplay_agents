"use client";

import { useRouter } from "next/navigation";
import { Plus } from "@/components/ui/icons";
import { useStore } from "@/lib/store";
import { personalisationQueueReady } from "@/lib/mockData";
import { StatTiles } from "@/components/campaigns/shared";
import { CampaignsTable } from "@/components/campaigns/CampaignsTable";
import { FloatingQueue } from "@/components/campaigns/FloatingQueue";
import { Button } from "@/components/ui/Button";

/** Campaigns destination: all campaigns across runs, with monitoring (spec §4.3, §6.4). */
export default function CampaignsPage() {
  const campaigns = useStore((s) => s.campaigns);
  const setStep = useStore((s) => s.setStep);
  const setAutoRun = useStore((s) => s.setAutoRun);
  const router = useRouter();

  const openInWorkbook = () => { setAutoRun(false); setStep(5); router.push("/workbook"); };

  return (
    <div className="relative h-full">
      <div className="h-full overflow-y-auto">
        <div className="mx-auto max-w-6xl px-6 py-8">
          <div className="mb-5 flex items-start gap-3">
            <div>
              <h1 className="text-xl font-semibold text-strong">Campaigns</h1>
              <p className="text-sm text-muted">Run, monitor, and manage every outbound sequence across LinkedIn and email.</p>
            </div>
            <Button
              variant="primary"
              className="ml-auto"
              onClick={() => { setAutoRun(false); setStep(4); router.push("/workbook"); }}
            >
              <Plus className="h-4 w-4" /> Create new
            </Button>
          </div>

          <div className="mb-5"><StatTiles campaigns={campaigns} /></div>
          <CampaignsTable campaigns={campaigns} onOpen={openInWorkbook} />
        </div>
      </div>
      <FloatingQueue ready={personalisationQueueReady} />
    </div>
  );
}
