"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
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
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { PolicyCheckDisplay } from "./policy-check-display";
import { useDashboardStore } from "@/stores/dashboard-store";
import { formatCurrency, formatDateTime } from "@/lib/format";
import { RelativeTime } from "@/components/ui/relative-time";
import type { TrustRequest } from "@/lib/types";
import {
  CheckIcon,
  XIcon,
  SparklesIcon,
  UserIcon,
  CalendarIcon,
  DollarSignIcon,
  TagIcon,
  AlertTriangleIcon,
  Loader2Icon,
} from "lucide-react";
import { toast } from "sonner";

interface RequestDetailDialogProps {
  request: TrustRequest | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const CATEGORY_COLORS: Record<string, string> = {
  Education: "border-blue-200 bg-blue-50 text-blue-700",
  Medical: "border-emerald-200 bg-emerald-50 text-emerald-700",
  "General Support": "border-violet-200 bg-violet-50 text-violet-700",
  Investment: "border-red-200 bg-red-50 text-red-700",
  Vehicle: "border-red-200 bg-red-50 text-red-700",
  Other: "border-gray-200 bg-gray-50 text-gray-700",
};

const URGENCY_COLORS: Record<string, string> = {
  low: "border-gray-200 bg-gray-50 text-gray-600",
  medium: "border-blue-200 bg-blue-50 text-blue-700",
  high: "border-amber-200 bg-amber-50 text-amber-700",
  critical: "border-red-200 bg-red-50 text-red-700",
};

export function RequestDetailDialog({
  request,
  open,
  onOpenChange,
}: RequestDetailDialogProps) {
  const [notes, setNotes] = useState("");
  const [overrideAmount, setOverrideAmount] = useState("");
  const [isApproving, setIsApproving] = useState(false);
  const [isDenying, setIsDenying] = useState(false);
  const [confirmApprove, setConfirmApprove] = useState(false);

  const approveRequest = useDashboardStore((s) => s.approveRequest);
  const denyRequest = useDashboardStore((s) => s.denyRequest);
  const parseRequest = useDashboardStore((s) => s.parseRequest);
  const isParsingRequest = useDashboardStore((s) => s.isParsingRequest);

  if (!request) return null;

  const isParsing = isParsingRequest[request.id];
  const parsed = request.parsed;
  const isPending = request.status === "pending";
  const hasProhibited = parsed?.flags.includes("prohibited");

  const effectiveAmount =
    overrideAmount !== ""
      ? Number(overrideAmount)
      : parsed?.amount ?? 0;

  async function handleApprove() {
    if (!request) return;
    setIsApproving(true);
    try {
      const amount = overrideAmount !== "" ? Number(overrideAmount) : undefined;
      await approveRequest(request.id, notes, amount);
      toast.success("Request approved", {
        description: `${formatCurrency(effectiveAmount)} distribution approved for ${request.beneficiary}.`,
      });
      onOpenChange(false);
      setNotes("");
      setOverrideAmount("");
    } catch (error) {
      toast.error("Failed to approve", {
        description: error instanceof Error ? error.message : "Unknown error",
      });
    } finally {
      setIsApproving(false);
      setConfirmApprove(false);
    }
  }

  async function handleDeny() {
    if (!request) return;
    setIsDenying(true);
    try {
      await denyRequest(request.id, notes);
      toast.success("Request denied", {
        description: `Request from ${request.beneficiary} has been denied.`,
      });
      onOpenChange(false);
      setNotes("");
      setOverrideAmount("");
    } catch (error) {
      toast.error("Failed to deny", {
        description: error instanceof Error ? error.message : "Unknown error",
      });
    } finally {
      setIsDenying(false);
    }
  }

  async function handleReparse() {
    if (!request) return;
    await parseRequest(request.id, request.raw_text, request.beneficiary);
    toast.info("Request re-parsed with AI");
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <DialogTitle>Review Request</DialogTitle>
              <Badge
                variant={
                  request.status === "approved"
                    ? "default"
                    : request.status === "denied"
                      ? "destructive"
                      : "outline"
                }
                className={
                  request.status === "approved"
                    ? "bg-emerald-600"
                    : undefined
                }
              >
                {request.status}
              </Badge>
            </div>
            <DialogDescription>
              {request.beneficiary} &middot; <RelativeTime date={request.submitted_at} />
            </DialogDescription>
          </DialogHeader>

          {/* Raw text */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Original Request
            </label>
            <div className="rounded-md border bg-muted/50 p-3 text-sm leading-relaxed">
              &ldquo;{request.raw_text}&rdquo;
            </div>
          </div>

          <Separator />

          {/* AI Parsed section */}
          <div className="rounded-lg border bg-muted/30 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <SparklesIcon className="size-3.5 text-muted-foreground" />
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  AI Analysis
                </span>
              </div>
              {isPending && (
                <Button
                  variant="ghost"
                  size="xs"
                  onClick={handleReparse}
                  disabled={isParsing}
                >
                  {isParsing ? (
                    <Loader2Icon className="size-3 animate-spin" />
                  ) : (
                    "Re-parse"
                  )}
                </Button>
              )}
            </div>

            {isParsing ? (
              <div className="space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-4 w-2/3" />
              </div>
            ) : parsed ? (
              <div className="grid gap-3">
                {/* Summary */}
                <p className="text-sm text-foreground">{parsed.summary}</p>

                {/* Key fields */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="flex items-center gap-1.5 text-sm">
                    <DollarSignIcon className="size-3.5 text-muted-foreground" />
                    <span className="text-muted-foreground">Amount:</span>
                    <span className="font-mono font-medium tabular-nums">
                      {formatCurrency(parsed.amount)}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-sm">
                    <TagIcon className="size-3.5 text-muted-foreground" />
                    <span className="text-muted-foreground">Category:</span>
                    <Badge
                      variant="outline"
                      className={CATEGORY_COLORS[parsed.category] ?? ""}
                    >
                      {parsed.category}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-1.5 text-sm">
                    <AlertTriangleIcon className="size-3.5 text-muted-foreground" />
                    <span className="text-muted-foreground">Urgency:</span>
                    <Badge
                      variant="outline"
                      className={URGENCY_COLORS[parsed.urgency] ?? ""}
                    >
                      {parsed.urgency}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-1.5 text-sm">
                    <UserIcon className="size-3.5 text-muted-foreground" />
                    <span className="text-muted-foreground">Beneficiary:</span>
                    <span className="font-medium">{request.beneficiary}</span>
                  </div>
                </div>

                {/* Policy check */}
                <PolicyCheckDisplay
                  flags={(parsed.flags ?? []) as import("@/lib/types").PolicyFlag[]}
                  notes={parsed.policy_notes ?? []}
                />
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">
                Not yet parsed. AI analysis will run automatically.
              </p>
            )}
          </div>

          {/* Resolution details for processed requests */}
          {request.resolution && (
            <>
              <Separator />
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Resolution
                </label>
                <div className="grid gap-1.5 text-sm">
                  <div className="flex items-center gap-1.5">
                    <CalendarIcon className="size-3.5 text-muted-foreground" />
                    <span className="text-muted-foreground">Decided:</span>
                    <span>{formatDateTime(request.resolution.decided_at)}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <UserIcon className="size-3.5 text-muted-foreground" />
                    <span className="text-muted-foreground">By:</span>
                    <span>{request.resolution.decided_by}</span>
                  </div>
                  {request.resolution.approved_amount != null && (
                    <div className="flex items-center gap-1.5">
                      <DollarSignIcon className="size-3.5 text-muted-foreground" />
                      <span className="text-muted-foreground">Amount:</span>
                      <span className="font-mono font-medium tabular-nums">
                        {formatCurrency(request.resolution.approved_amount)}
                      </span>
                      {parsed &&
                        request.resolution.approved_amount !== parsed.amount && (
                          <span className="text-xs text-amber-600">
                            (adjusted from {formatCurrency(parsed.amount)})
                          </span>
                        )}
                    </div>
                  )}
                  {request.resolution.notes && (
                    <div className="mt-1">
                      <span className="text-muted-foreground">Notes:</span>
                      <p className="mt-0.5 text-sm">{request.resolution.notes}</p>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          {/* Action section — only for pending requests */}
          {isPending && parsed && (
            <>
              <Separator />
              <div className="rounded-lg border-2 border-primary/20 bg-background p-4 space-y-3">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Officer Decision
                </label>

                {/* Override amount */}
                <div className="space-y-1.5">
                  <label className="text-xs text-muted-foreground">
                    Override Amount
                  </label>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">$</span>
                    <Input
                      type="number"
                      placeholder="Override amount..."
                      value={overrideAmount}
                      onChange={(e) => setOverrideAmount(e.target.value)}
                      className="font-mono"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Leave blank to approve for {formatCurrency(parsed.amount)}
                  </p>
                </div>

                {/* Notes */}
                <div className="space-y-1.5">
                  <label className="text-xs text-muted-foreground">
                    Decision Notes
                  </label>
                  <Textarea
                    placeholder="Rationale for approval or denial..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={2}
                  />
                </div>
              </div>

              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={handleDeny}
                  disabled={isDenying || isApproving}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  {isDenying ? (
                    <Loader2Icon className="size-4 animate-spin" />
                  ) : (
                    <XIcon className="size-4" />
                  )}
                  Deny
                </Button>
                <Button
                  onClick={() => setConfirmApprove(true)}
                  disabled={
                    isDenying ||
                    isApproving ||
                    effectiveAmount <= 0 ||
                    !!hasProhibited
                  }
                >
                  <CheckIcon className="size-4" />
                  Approve{" "}
                  {effectiveAmount > 0 && formatCurrency(effectiveAmount)}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Confirmation dialog for approve */}
      <AlertDialog open={confirmApprove} onOpenChange={setConfirmApprove}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Approval</AlertDialogTitle>
            <AlertDialogDescription>
              This will create a {formatCurrency(effectiveAmount)} DEBIT
              transaction for {request.beneficiary}. This action creates a
              permanent ledger entry.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleApprove} disabled={isApproving}>
              {isApproving ? (
                <Loader2Icon className="size-4 animate-spin" />
              ) : (
                "Confirm Approval"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
