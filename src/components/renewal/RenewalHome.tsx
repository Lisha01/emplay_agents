"use client";

import { ArrowRight, Clock } from "@/components/ui/icons";
import { useRenewalStore } from "@/lib/renewalStore";
import { renewalTaskRows } from "@/lib/renewalData";
import { Button } from "@/components/ui/Button";
import { RenewalTasksHome } from "./RenewalTasksHome";
import { RenewalCommandBar } from "./RenewalCommandBar";
import { RenewalWorkspace } from "./workspace/RenewalWorkspace";

/** Feature flag for the new five-stage Account Workspace (Brief→Plan→Recommendation→
 *  Build→Approval). Keep the old stub reachable until the new flow reaches parity. */
const RENEWAL_WORKSPACE_V2 = true;

/**
 * Root of the Renewal Manager persona (rendered by the persona check in app/page.tsx).
 * Routes between the Renewal Home ("My Renewal Tasks") and a focused Account Workspace
 * via the renewal store's `activeAccountId` — no extra route needed, mirroring how the
 * demand-gen plan rail wakes within the shell.
 */
export function RenewalHome() {
  const activeAccountId = useRenewalStore((s) => s.activeAccountId);
  if (activeAccountId) return RENEWAL_WORKSPACE_V2 ? <RenewalWorkspace /> : <AccountWorkspacePlaceholder />;
  return <RenewalTasksHome />;
}

// Temporary — the full Account Workspace (Screen 2) is built in the next step.
function AccountWorkspacePlaceholder() {
  const activeId = useRenewalStore((s) => s.activeAccountId);
  const customer = useRenewalStore(
    (s) => s.accounts.find((a) => a.id === activeId)?.customer,
  ) ?? renewalTaskRows.find((r) => r.id === activeId)?.customer;
  const close = useRenewalStore((s) => s.closeAccount);
  return (
    <div className="flex h-full flex-col">
      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto max-w-2xl px-6 py-10">
          <Button variant="ghost" size="sm" onClick={close}>
            <ArrowRight className="h-3.5 w-3.5 rotate-180" /> Back to my tasks
          </Button>
          <div className="mt-6 flex flex-col items-center rounded-2xl border border-dashed border-border bg-surface px-6 py-16 text-center">
            <span className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-surface-muted text-muted">
              <Clock className="h-5 w-5" />
            </span>
            <h2 className="text-base font-semibold text-strong">{customer} — Account Workspace</h2>
            <p className="mt-1 max-w-md text-sm text-muted">The focused decision page (Summary · Risk · Performance · Economics · Usage) is built in the next step.</p>
          </div>
        </div>
      </div>
      <RenewalCommandBar />
    </div>
  );
}
