"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { CheckIcon, XIcon, Loader2Icon } from "lucide-react";
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
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmAction === "approve"
                ? `Approve ${count} Requests`
                : `Deny ${count} Requests`}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmAction === "approve"
                ? `This will create ${count} DEBIT ledger entries. Each request will be approved at its parsed or overridden amount.`
                : `This will deny ${count} requests. No ledger entries will be created.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isProcessing}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirm}
              disabled={isProcessing}
              className={
                confirmAction === "deny"
                  ? "bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  : undefined
              }
            >
              {isProcessing ? (
                <Loader2Icon className="size-4 animate-spin" aria-label="Loading" />
              ) : confirmAction === "approve" ? (
                "Confirm Approval"
              ) : (
                "Confirm Denial"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
