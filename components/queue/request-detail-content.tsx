"use client";

import {
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerClose,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { PolicyCheckDisplay } from "./policy-check-display";
import { ActivityTimeline } from "./activity-timeline";
import { OfficerDecisionFooter } from "./officer-decision-footer";
import { useDashboardStore } from "@/stores/dashboard-store";
import { formatCurrency, formatDateTime } from "@/lib/format";
import { RelativeTime } from "@/components/ui/relative-time";
import type { PolicyFlag } from "@/lib/types";
import { STATUS_COLORS, STATUS_LABELS } from "@/lib/constants";
import {
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
  const request = useDashboardStore((s) =>
    s.requests.find((r) => r.id === requestId)
  );
  const parseRequest = useDashboardStore((s) => s.parseRequest);
  const isParsingRequest = useDashboardStore((s) => s.isParsingRequest);

  if (!request) return null;

  const isParsing = isParsingRequest[request.id];
  const parsed = request.parsed;
  const isPending = request.status === "pending";

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
      {isPending && parsed && <OfficerDecisionFooter request={request} />}
    </>
  );
}
