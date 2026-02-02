"use client";

import { useState, useMemo, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { ConfirmApprovalContent } from "@/components/dialogs/confirm-approval-content";
import { ConfirmDenialContent } from "@/components/dialogs/confirm-denial-content";
import { useDialogStore } from "@/stores/dialog-store";
import { useDrawerStore } from "@/stores/drawer-store";
import { useDashboardStore } from "@/stores/dashboard-store";
import { formatCurrency } from "@/lib/format";
import type { TrustRequest } from "@/lib/types";
import { CATEGORIES, URGENCY_LEVELS } from "@/lib/constants";
import { CheckIcon, XIcon, Loader2Icon } from "lucide-react";
import { toast } from "sonner";

interface OfficerDecisionFooterProps {
  request: TrustRequest;
}

export function OfficerDecisionFooter({ request }: OfficerDecisionFooterProps) {
  const [notes, setNotes] = useState("");
  const [overrideAmount, setOverrideAmount] = useState("");
  const [overrideCategory, setOverrideCategory] = useState("");
  const [overrideUrgency, setOverrideUrgency] = useState("");
  const [isApproving, setIsApproving] = useState(false);
  const [isDenying, setIsDenying] = useState(false);

  const closeDrawer = useDrawerStore((s) => s.closeDrawer);
  const openDialog = useDialogStore((s) => s.openDialog);
  const closeDialog = useDialogStore((s) => s.closeDialog);

  const approveRequest = useDashboardStore((s) => s.approveRequest);
  const denyRequest = useDashboardStore((s) => s.denyRequest);
  const updateOverride = useDashboardStore((s) => s.updateOverride);
  const isProcessing = useDashboardStore(
    (s) => !!s.isProcessingRequest[request.id]
  );
  const balance = useDashboardStore((s) => s.balance);

  const parsed = request.parsed;
  const hasProhibited = parsed?.flags.includes("prohibited");

  const effectiveAmount =
    overrideAmount !== "" ? Number(overrideAmount) : parsed?.amount ?? 0;

  const overrideAmountError = useMemo(() => {
    if (overrideAmount === "") return null;
    const num = Number(overrideAmount);
    if (isNaN(num) || !isFinite(num)) return "Please enter a valid number.";
    if (num <= 0) return "Amount must be positive.";
    if (num > balance)
      return `Exceeds available balance (${formatCurrency(balance)}).`;
    return null;
  }, [overrideAmount, balance]);

  const sendOverrides = useCallback(async () => {
    const override: Record<string, unknown> = {};
    if (overrideAmount !== "") override.amount = Number(overrideAmount);
    if (overrideCategory) override.category = overrideCategory;
    if (overrideUrgency) override.urgency = overrideUrgency;
    if (Object.keys(override).length > 0) {
      await updateOverride(request.id, override);
    }
  }, [overrideAmount, overrideCategory, overrideUrgency, updateOverride, request.id]);

  function resetForm() {
    setNotes("");
    setOverrideAmount("");
    setOverrideCategory("");
    setOverrideUrgency("");
  }

  async function handleApprove() {
    setIsApproving(true);
    try {
      await sendOverrides();
      const amount = overrideAmount !== "" ? Number(overrideAmount) : undefined;
      await approveRequest(request.id, notes, amount);
      toast.success("Request approved", {
        description: `${formatCurrency(
          effectiveAmount
        )} distribution approved for ${request.beneficiary}.`,
      });
      closeDrawer();
      resetForm();
    } catch (error) {
      toast.error("Failed to approve", {
        description: error instanceof Error ? error.message : "Unknown error",
      });
    } finally {
      setIsApproving(false);
      closeDialog();
    }
  }

  async function handleDeny() {
    setIsDenying(true);
    try {
      await sendOverrides();
      await denyRequest(request.id, notes);
      toast.success("Request denied", {
        description: `Request from ${request.beneficiary} has been denied.`,
      });
      closeDrawer();
      resetForm();
    } catch (error) {
      toast.error("Failed to deny", {
        description: error instanceof Error ? error.message : "Unknown error",
      });
    } finally {
      setIsDenying(false);
      closeDialog();
    }
  }

  if (!parsed) return null;

  return (
    <div className="border-t px-6 py-4 shrink-0 bg-background space-y-3">
      <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
        Officer Decision
      </label>

      {/* Override fields row */}
      <div className="grid grid-cols-[1fr_auto_auto] gap-3 items-end">
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">Amount</label>
          <div className="flex items-center gap-1.5">
            <span className="text-sm text-muted-foreground">$</span>
            <Input
              type="number"
              min="0"
              step="0.01"
              placeholder={String(parsed.amount)}
              value={overrideAmount}
              onChange={(e) => setOverrideAmount(e.target.value)}
              className="font-mono h-8 text-sm"
            />
          </div>
        </div>
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">Category</label>
          <Select
            value={overrideCategory}
            onValueChange={setOverrideCategory}
          >
            <SelectTrigger className="h-8 text-sm w-[140px]">
              <SelectValue placeholder={parsed.category} />
            </SelectTrigger>
            <SelectContent>
              {CATEGORIES.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">Urgency</label>
          <Select
            value={overrideUrgency}
            onValueChange={setOverrideUrgency}
          >
            <SelectTrigger className="h-8 text-sm w-[110px]">
              <SelectValue placeholder={parsed.urgency} />
            </SelectTrigger>
            <SelectContent>
              {URGENCY_LEVELS.map((u) => (
                <SelectItem key={u} value={u}>
                  {u}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {overrideAmountError && (
        <p className="text-xs text-red-600" aria-live="assertive">
          {overrideAmountError}
        </p>
      )}

      {/* Notes */}
      <Textarea
        placeholder="Decision notes — rationale for approval or denial..."
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        rows={2}
        className="text-sm"
      />

      {/* Action buttons */}
      <div className="flex items-center justify-end gap-2 pt-1">
        <Button
          variant="outline"
          size="sm"
          onClick={() =>
            openDialog({
              content: (
                <ConfirmDenialContent
                  description={`This will deny the request from ${request.beneficiary}${parsed ? ` for ${formatCurrency(parsed.amount)}` : ""}.${!notes ? " Consider adding a note explaining the reason." : ""}`}
                  onConfirm={handleDeny}
                />
              ),
            })
          }
          disabled={isDenying || isApproving || isProcessing}
          className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20"
        >
          {isDenying ? (
            <Loader2Icon className="size-3.5 animate-spin" />
          ) : (
            <XIcon className="size-3.5" />
          )}
          Deny
        </Button>
        <Button
          size="sm"
          onClick={() =>
            openDialog({
              content: (
                <ConfirmApprovalContent
                  description={`This will create a ${formatCurrency(effectiveAmount)} DEBIT transaction for ${request.beneficiary}. This action creates a permanent ledger entry.`}
                  onConfirm={handleApprove}
                />
              ),
            })
          }
          disabled={
            isDenying ||
            isApproving ||
            isProcessing ||
            effectiveAmount <= 0 ||
            !!hasProhibited ||
            !!overrideAmountError
          }
        >
          <CheckIcon className="size-3.5" />
          Approve {effectiveAmount > 0 && formatCurrency(effectiveAmount)}
        </Button>
      </div>
    </div>
  );
}
