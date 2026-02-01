"use client";

import { useState, useMemo } from "react";
import {
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerClose,
} from "@/components/ui/drawer";
import {
  AlertDialogAction,
  AlertDialogCancel,
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
import { ActivityTimeline } from "./activity-timeline";
import { useDrawerStore } from "@/stores/drawer-store";
import { useDialogStore } from "@/stores/dialog-store";
import { useDashboardStore } from "@/stores/dashboard-store";
import { formatCurrency, formatDateTime } from "@/lib/format";
import { RelativeTime } from "@/components/ui/relative-time";
import type { PolicyFlag } from "@/lib/types";
import {
  CATEGORIES,
  URGENCY_LEVELS,
  STATUS_COLORS,
  STATUS_LABELS,
} from "@/lib/constants";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import {
  CheckIcon,
  XIcon,
  SparklesIcon,
  UserIcon,
  CalendarIcon,
  DollarSignIcon,
  Loader2Icon,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface RequestDetailContentProps {
  requestId: string;
}

export function RequestDetailContent({ requestId }: RequestDetailContentProps) {
  const [notes, setNotes] = useState("");
  const [overrideAmount, setOverrideAmount] = useState("");
  const [overrideCategory, setOverrideCategory] = useState("");
  const [overrideUrgency, setOverrideUrgency] = useState("");
  const [isApproving, setIsApproving] = useState(false);
  const [isDenying, setIsDenying] = useState(false);

  const closeDrawer = useDrawerStore((s) => s.closeDrawer);
  const openDialog = useDialogStore((s) => s.openDialog);
  const closeDialog = useDialogStore((s) => s.closeDialog);

  // Read from dashboard store — always fresh via optimistic updates
  const request = useDashboardStore((s) =>
    s.requests.find((r) => r.id === requestId)
  );
  const approveRequest = useDashboardStore((s) => s.approveRequest);
  const denyRequest = useDashboardStore((s) => s.denyRequest);
  const updateOverride = useDashboardStore((s) => s.updateOverride);
  const parseRequest = useDashboardStore((s) => s.parseRequest);
  const isParsingRequest = useDashboardStore((s) => s.isParsingRequest);
  const isProcessing = useDashboardStore((s) =>
    request ? !!s.isProcessingRequest[request.id] : false
  );
  const balance = useDashboardStore((s) => s.balance);

  const overrideAmountError = useMemo(() => {
    if (overrideAmount === "") return null;
    const num = Number(overrideAmount);
    if (isNaN(num) || !isFinite(num)) return "Please enter a valid number.";
    if (num <= 0) return "Amount must be positive.";
    if (num > balance)
      return `Exceeds available balance (${formatCurrency(balance)}).`;
    return null;
  }, [overrideAmount, balance]);

  if (!request) return null;

  const isParsing = isParsingRequest[request.id];
  const parsed = request.parsed;
  const isPending = request.status === "pending";
  const hasProhibited = parsed?.flags.includes("prohibited");

  const effectiveAmount =
    overrideAmount !== "" ? Number(overrideAmount) : parsed?.amount ?? 0;

  async function sendOverrides() {
    if (!request) return;
    const override: Record<string, unknown> = {};
    if (overrideAmount !== "") override.amount = Number(overrideAmount);
    if (overrideCategory) override.category = overrideCategory;
    if (overrideUrgency) override.urgency = overrideUrgency;
    if (Object.keys(override).length > 0) {
      await updateOverride(request.id, override);
    }
  }

  function resetForm() {
    setNotes("");
    setOverrideAmount("");
    setOverrideCategory("");
    setOverrideUrgency("");
  }

  async function handleApprove() {
    if (!request) return;
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
    if (!request) return;
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

  async function handleReparse() {
    if (!request) return;
    await parseRequest(request.id, request.raw_text, request.beneficiary);
    toast.info("Request re-parsed with AI");
  }

  return (
    <>
      {/* Fixed Header */}
      <DrawerHeader className="px-6 pt-6 pb-4 border-b shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <DrawerTitle className="text-base">Review Request</DrawerTitle>
            <Badge
              variant="default"
              className={cn(STATUS_COLORS[request.status], "capitalize")}
            >
              {STATUS_LABELS[request.status]}
            </Badge>
          </div>
          <DrawerClose asChild>
            <Button variant="ghost" size="icon" className="size-7">
              <XIcon className="size-4" />
              <span className="sr-only">Close</span>
            </Button>
          </DrawerClose>
        </div>
        <DrawerDescription className="flex items-center gap-1.5">
          <span>{request.beneficiary}</span>
          <span className="text-muted-foreground/40">&middot;</span>
          <RelativeTime date={request.submitted_at} />
          {parsed && (
            <>
              <span className="text-muted-foreground/40">&middot;</span>
              <span className="font-mono font-semibold text-foreground tabular-nums">
                {formatCurrency(parsed.amount)}
              </span>
            </>
          )}
        </DrawerDescription>
      </DrawerHeader>

      {/* Scrollable Body */}
      <div className="flex-1 min-h-0 overflow-y-auto">
        <div className="px-6 py-5 space-y-5">
          {/* Original Request */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Original Request
            </label>
            <div className="rounded-lg border bg-muted/40 p-4 text-sm leading-relaxed">
              &ldquo;{request.raw_text}&rdquo;
            </div>
          </div>

          {/* AI Analysis */}
          <div className="space-y-2">
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
              <div className="rounded-lg border bg-muted/20 p-4 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-4 w-2/3" />
              </div>
            ) : parsed ? (
              <div className="rounded-lg border bg-muted/20 p-4 space-y-4">
                {/* Summary */}
                <p className="text-sm text-foreground leading-relaxed">
                  {parsed.summary}
                </p>

                {/* Key fields - vertical key-value layout */}
                <div className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 text-sm">
                  <span className="text-muted-foreground">Amount</span>
                  <span className="font-mono font-medium tabular-nums">
                    {formatCurrency(parsed.amount)}
                  </span>
                  <span className="text-muted-foreground">Category</span>
                  <span>{parsed.category}</span>
                  <span className="text-muted-foreground">Urgency</span>
                  <span className="capitalize">{parsed.urgency}</span>
                </div>

                {/* Policy check - only show when issues exist */}
                {(parsed.flags?.length > 0 ||
                  parsed.policy_notes?.length > 0) && (
                  <>
                    <Separator />
                    <PolicyCheckDisplay
                      flags={(parsed.flags ?? []) as PolicyFlag[]}
                      notes={parsed.policy_notes ?? []}
                    />
                  </>
                )}
              </div>
            ) : (
              <div className="rounded-lg border bg-muted/20 p-4">
                <p className="text-xs text-muted-foreground">
                  Not yet parsed. AI analysis will run automatically.
                </p>
              </div>
            )}
          </div>

          {/* Activity timeline */}
          {request.activity_log && request.activity_log.length > 0 && (
            <ActivityTimeline events={request.activity_log} />
          )}

          {/* Resolution details for processed requests */}
          {request.resolution && (
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Resolution
              </label>
              <div className="rounded-lg border p-4 space-y-2.5">
                <div className="grid gap-2 text-sm">
                  <div className="flex items-center gap-1.5">
                    <CalendarIcon className="size-3.5 text-muted-foreground shrink-0" />
                    <span className="text-muted-foreground">Decided:</span>
                    <span>{formatDateTime(request.resolution.decided_at)}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <UserIcon className="size-3.5 text-muted-foreground shrink-0" />
                    <span className="text-muted-foreground">By:</span>
                    <span>{request.resolution.decided_by}</span>
                  </div>
                  {request.resolution.approved_amount != null && (
                    <div className="flex items-center gap-1.5">
                      <DollarSignIcon className="size-3.5 text-muted-foreground shrink-0" />
                      <span className="text-muted-foreground">Amount:</span>
                      <span className="font-mono font-medium tabular-nums">
                        {formatCurrency(request.resolution.approved_amount)}
                      </span>
                      {parsed &&
                        request.resolution.approved_amount !==
                          parsed.amount && (
                          <span className="text-xs text-amber-600">
                            (adjusted from {formatCurrency(parsed.amount)})
                          </span>
                        )}
                    </div>
                  )}
                </div>
                {request.resolution.notes && (
                  <div className="pt-1">
                    <span className="text-xs text-muted-foreground">
                      Notes:
                    </span>
                    <p className="mt-1 text-sm leading-relaxed">
                      {request.resolution.notes}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Fixed Footer — Officer Decision (pending only) */}
      {isPending && parsed && (
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
                    <>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Confirm Denial</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will deny the request from {request.beneficiary}
                          {parsed
                            ? ` for ${formatCurrency(parsed.amount)}`
                            : ""}
                          .
                          {!notes &&
                            " Consider adding a note explaining the reason."}
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={handleDeny}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Confirm Denial
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </>
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
                    <>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Confirm Approval</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will create a {formatCurrency(effectiveAmount)}{" "}
                          DEBIT transaction for {request.beneficiary}. This
                          action creates a permanent ledger entry.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleApprove}>
                          Confirm Approval
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </>
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
      )}
    </>
  );
}
