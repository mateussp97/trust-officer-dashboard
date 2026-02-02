"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogContent,
} from "@/components/ui/alert-dialog";
import { ConfirmApprovalContent } from "@/components/dialogs/confirm-approval-content";
import { ConfirmDenialContent } from "@/components/dialogs/confirm-denial-content";
import { CheckIcon, XIcon } from "lucide-react";
import { useDashboardStore } from "@/stores/dashboard-store";
import { toast } from "sonner";

interface BatchActionBarProps {
  selectedIds: Set<string>;
  onClearSelection: () => void;
}

export function BatchActionBar({
  selectedIds,
  onClearSelection,
}: BatchActionBarProps) {
  const [confirmAction, setConfirmAction] = useState<
    "approve" | "deny" | null
  >(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const batchApprove = useDashboardStore((s) => s.batchApprove);
  const batchDeny = useDashboardStore((s) => s.batchDeny);

  if (selectedIds.size === 0) return null;

  const count = selectedIds.size;

  async function handleConfirm() {
    setIsProcessing(true);
    try {
      const ids = [...selectedIds];
      if (confirmAction === "approve") {
        const results = await batchApprove(ids);
        toast.success(`Approved ${results.succeeded} of ${count} requests`, {
          description:
            results.failed > 0
              ? `${results.failed} failed — check individual requests for details.`
              : undefined,
        });
      } else if (confirmAction === "deny") {
        const results = await batchDeny(ids);
        toast.success(`Denied ${results.succeeded} of ${count} requests`, {
          description:
            results.failed > 0
              ? `${results.failed} failed — check individual requests for details.`
              : undefined,
        });
      }
      onClearSelection();
    } catch {
      toast.error("Batch operation failed");
    } finally {
      setIsProcessing(false);
      setConfirmAction(null);
    }
  }

  return (
    <>
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 rounded-lg border bg-background/95 backdrop-blur-sm shadow-lg px-4 py-2.5">
        <span className="text-sm font-medium">
          {count} selected
        </span>
        <div className="h-4 w-px bg-border" />
        <Button
          size="sm"
          onClick={() => setConfirmAction("approve")}
          disabled={isProcessing}
        >
          <CheckIcon className="size-3.5" />
          Approve All
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => setConfirmAction("deny")}
          disabled={isProcessing}
          className="text-red-600 hover:text-red-700 hover:bg-red-50"
        >
          <XIcon className="size-3.5" />
          Deny All
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={onClearSelection}
          disabled={isProcessing}
        >
          Cancel
        </Button>
      </div>

      <AlertDialog
        open={confirmAction !== null}
        onOpenChange={(open) => !open && setConfirmAction(null)}
      >
        <AlertDialogContent>
          {confirmAction === "approve" ? (
            <ConfirmApprovalContent
              description={`This will create ${count} DEBIT ledger entries. Each request will be approved at its parsed or overridden amount.`}
              onConfirm={handleConfirm}
              isProcessing={isProcessing}
            />
          ) : (
            <ConfirmDenialContent
              description={`This will deny ${count} requests. No ledger entries will be created.`}
              onConfirm={handleConfirm}
              isProcessing={isProcessing}
            />
          )}
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
