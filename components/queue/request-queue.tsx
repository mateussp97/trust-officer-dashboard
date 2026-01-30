"use client";

import { useState, useEffect, useRef } from "react";
import {
  SparklesIcon,
  Loader2Icon,
  InboxIcon,
  EyeIcon,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { PolicyCheckDisplay } from "./policy-check-display";
import { RequestDetailDialog } from "./request-detail-dialog";
import { useDashboardStore } from "@/stores/dashboard-store";
import { formatCurrency, formatRelativeTime } from "@/lib/format";
import type { TrustRequest, RequestStatus, PolicyFlag } from "@/lib/types";

const CATEGORY_COLORS: Record<string, string> = {
  Education: "border-blue-200 bg-blue-50 text-blue-700",
  Medical: "border-emerald-200 bg-emerald-50 text-emerald-700",
  "General Support": "border-violet-200 bg-violet-50 text-violet-700",
  Investment: "border-red-200 bg-red-50 text-red-700",
  Vehicle: "border-red-200 bg-red-50 text-red-700",
  Other: "border-gray-200 bg-gray-50 text-gray-700",
};

const STATUS_LABELS: Record<RequestStatus, string> = {
  pending: "Pending",
  approved: "Approved",
  denied: "Denied",
};

export function RequestQueue() {
  const requests = useDashboardStore((s) => s.requests);
  const isLoadingRequests = useDashboardStore((s) => s.isLoadingRequests);
  const isParsingRequest = useDashboardStore((s) => s.isParsingRequest);
  const parseAllPending = useDashboardStore((s) => s.parseAllPending);

  const [selectedRequest, setSelectedRequest] = useState<TrustRequest | null>(
    null
  );
  const [dialogOpen, setDialogOpen] = useState(false);
  const [filter, setFilter] = useState<"all" | RequestStatus>("all");
  const hasAutoParsedRef = useRef(false);

  // Auto-parse pending requests once when they first load
  useEffect(() => {
    if (hasAutoParsedRef.current) return;
    const unparsedPending = requests.filter(
      (r) => r.status === "pending" && !r.parsed
    );
    if (unparsedPending.length > 0) {
      hasAutoParsedRef.current = true;
      parseAllPending();
    }
  }, [requests, parseAllPending]);

  const filtered =
    filter === "all" ? requests : requests.filter((r) => r.status === filter);

  const counts = {
    all: requests.length,
    pending: requests.filter((r) => r.status === "pending").length,
    approved: requests.filter((r) => r.status === "approved").length,
    denied: requests.filter((r) => r.status === "denied").length,
  };

  function handleOpenDetail(request: TrustRequest) {
    setSelectedRequest(request);
    setDialogOpen(true);
  }

  // Keep selectedRequest in sync with store
  const currentSelected = selectedRequest
    ? requests.find((r) => r.id === selectedRequest.id) ?? null
    : null;

  if (isLoadingRequests) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-24 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  return (
    <>
      <Tabs
        value={filter}
        onValueChange={(v) => setFilter(v as typeof filter)}
      >
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="all">All ({counts.all})</TabsTrigger>
            <TabsTrigger value="pending">Pending ({counts.pending})</TabsTrigger>
            <TabsTrigger value="approved">
              Approved ({counts.approved})
            </TabsTrigger>
            <TabsTrigger value="denied">Denied ({counts.denied})</TabsTrigger>
          </TabsList>
        </div>

        {(["all", "pending", "approved", "denied"] as const).map((tab) => (
          <TabsContent key={tab} value={tab}>
            {filtered.length === 0 ? (
              <div className="rounded-lg border p-8 text-center">
                <InboxIcon className="mx-auto size-8 text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">
                  No {tab === "all" ? "" : tab} requests.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {filtered.map((request) => (
                  <RequestRow
                    key={request.id}
                    request={request}
                    isParsing={!!isParsingRequest[request.id]}
                    onOpenDetail={handleOpenDetail}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>

      <RequestDetailDialog
        request={currentSelected}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />
    </>
  );
}

function RequestRow({
  request,
  isParsing,
  onOpenDetail,
}: {
  request: TrustRequest;
  isParsing: boolean;
  onOpenDetail: (request: TrustRequest) => void;
}) {
  const parsed = request.parsed;

  return (
    <Card
      className="cursor-pointer transition-colors hover:bg-muted/30"
      onClick={() => onOpenDetail(request)}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          {/* Left: main info */}
          <div className="flex-1 space-y-1.5 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-medium text-sm">{request.beneficiary}</span>
              <Badge
                variant={
                  request.status === "approved"
                    ? "default"
                    : request.status === "denied"
                      ? "destructive"
                      : "secondary"
                }
                className={
                  request.status === "approved"
                    ? "bg-emerald-600"
                    : undefined
                }
              >
                {STATUS_LABELS[request.status]}
              </Badge>
              {parsed?.category && (
                <Badge
                  variant="outline"
                  className={CATEGORY_COLORS[parsed.category] ?? ""}
                >
                  {parsed.category}
                </Badge>
              )}
            </div>

            <p className="text-sm text-muted-foreground truncate max-w-lg">
              {parsed?.summary ?? request.raw_text}
            </p>

            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span className="font-mono">
                {formatRelativeTime(request.submitted_at)}
              </span>
              {parsed && (
                <PolicyCheckDisplay
                  flags={(parsed.flags ?? []) as PolicyFlag[]}
                  notes={[]}
                  compact
                />
              )}
            </div>
          </div>

          {/* Right: amount + actions */}
          <div className="flex flex-col items-end gap-2 shrink-0">
            {isParsing ? (
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <Loader2Icon className="size-3.5 animate-spin" />
                <SparklesIcon className="size-3.5" />
              </div>
            ) : parsed ? (
              <span className="text-lg font-semibold font-mono tabular-nums">
                {formatCurrency(parsed.amount)}
              </span>
            ) : (
              <span className="text-xs text-muted-foreground">—</span>
            )}
            <Button
              variant="ghost"
              size="xs"
              onClick={(e) => {
                e.stopPropagation();
                onOpenDetail(request);
              }}
            >
              <EyeIcon className="size-3.5" />
              Review
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
