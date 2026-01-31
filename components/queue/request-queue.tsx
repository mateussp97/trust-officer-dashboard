"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import {
  SparklesIcon,
  Loader2Icon,
  InboxIcon,
  EyeIcon,
  SearchIcon,
  ArrowUpDownIcon,
  XIcon,
  CheckCircle2Icon,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { PolicyCheckDisplay } from "./policy-check-display";
import { RequestDetailDialog } from "./request-detail-dialog";
import { RelativeTime } from "@/components/ui/relative-time";
import { useDashboardStore } from "@/stores/dashboard-store";
import { formatCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";
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

const SORT_OPTIONS = [
  { value: "newest", label: "Newest first" },
  { value: "oldest", label: "Oldest first" },
  { value: "amount-desc", label: "Amount: high → low" },
  { value: "amount-asc", label: "Amount: low → high" },
  { value: "urgency", label: "Urgency: critical first" },
  { value: "beneficiary", label: "Beneficiary: A → Z" },
] as const;

type SortOption = (typeof SORT_OPTIONS)[number]["value"];

const URGENCY_ORDER: Record<string, number> = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3,
};

const CATEGORY_OPTIONS = [
  "Education",
  "Medical",
  "General Support",
  "Investment",
  "Vehicle",
  "Other",
];

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

  // Filter state
  const [search, setSearch] = useState("");
  const [beneficiaryFilter, setBeneficiaryFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [policyFilter, setPolicyFilter] = useState("all");
  const [sortBy, setSortBy] = useState<SortOption>("newest");

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

  // Unique beneficiaries for filter dropdown
  const beneficiaries = useMemo(
    () => [...new Set(requests.map((r) => r.beneficiary))].sort(),
    [requests]
  );

  const hasActiveFilters =
    search !== "" ||
    beneficiaryFilter !== "all" ||
    categoryFilter !== "all" ||
    policyFilter !== "all";

  function clearFilters() {
    setSearch("");
    setBeneficiaryFilter("all");
    setCategoryFilter("all");
    setPolicyFilter("all");
  }

  // Filter pipeline: status tab → search → beneficiary → category → policy
  const filtered = useMemo(() => {
    let result =
      filter === "all" ? requests : requests.filter((r) => r.status === filter);

    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (r) =>
          r.beneficiary.toLowerCase().includes(q) ||
          r.raw_text.toLowerCase().includes(q) ||
          r.parsed?.summary?.toLowerCase().includes(q) ||
          r.parsed?.amount?.toString().includes(q)
      );
    }

    if (beneficiaryFilter !== "all") {
      result = result.filter((r) => r.beneficiary === beneficiaryFilter);
    }

    if (categoryFilter !== "all") {
      result = result.filter((r) => r.parsed?.category === categoryFilter);
    }

    if (policyFilter !== "all") {
      result = result.filter((r) => {
        const flags = r.parsed?.flags ?? [];
        if (policyFilter === "compliant") return flags.length === 0;
        if (policyFilter === "blocked") return flags.includes("prohibited");
        if (policyFilter === "warning")
          return flags.length > 0 && !flags.includes("prohibited");
        return true;
      });
    }

    return result;
  }, [
    requests,
    filter,
    search,
    beneficiaryFilter,
    categoryFilter,
    policyFilter,
  ]);

  // Sort
  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      switch (sortBy) {
        case "newest":
          return (
            new Date(b.submitted_at).getTime() -
            new Date(a.submitted_at).getTime()
          );
        case "oldest":
          return (
            new Date(a.submitted_at).getTime() -
            new Date(b.submitted_at).getTime()
          );
        case "amount-desc":
          return (b.parsed?.amount ?? 0) - (a.parsed?.amount ?? 0);
        case "amount-asc":
          return (a.parsed?.amount ?? 0) - (b.parsed?.amount ?? 0);
        case "urgency":
          return (
            (URGENCY_ORDER[a.parsed?.urgency ?? "low"] ?? 3) -
            (URGENCY_ORDER[b.parsed?.urgency ?? "low"] ?? 3)
          );
        case "beneficiary":
          return a.beneficiary.localeCompare(b.beneficiary);
        default:
          return 0;
      }
    });
  }, [filtered, sortBy]);

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

  const emptyMessage = hasActiveFilters
    ? "No requests match your filters."
    : filter === "pending"
    ? "No pending requests — all caught up!"
    : filter === "approved"
    ? "No approved requests yet."
    : filter === "denied"
    ? "No denied requests."
    : "No requests have been submitted yet.";

  return (
    <>
      <Tabs value={filter} onValueChange={(v) => setFilter(v as typeof filter)}>
        <TabsList>
          <TabsTrigger value="all">All ({counts.all})</TabsTrigger>
          <TabsTrigger value="pending">Pending ({counts.pending})</TabsTrigger>
          <TabsTrigger value="approved">
            Approved ({counts.approved})
          </TabsTrigger>
          <TabsTrigger value="denied">Denied ({counts.denied})</TabsTrigger>
        </TabsList>

        {/* Filter & sort bar */}
        <div className="flex items-center gap-2 mt-3 flex-wrap">
          <div className="relative flex-1 min-w-[200px] max-w-xs">
            <SearchIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
            <Input
              placeholder="Search requests..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 h-8 text-sm"
            />
          </div>

          <Select
            value={beneficiaryFilter}
            onValueChange={setBeneficiaryFilter}
          >
            <SelectTrigger className="h-8 w-auto min-w-[130px] text-sm">
              <SelectValue placeholder="Beneficiary" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All beneficiaries</SelectItem>
              {beneficiaries.map((b) => (
                <SelectItem key={b} value={b}>
                  {b}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="h-8 w-auto min-w-[120px] text-sm">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All categories</SelectItem>
              {CATEGORY_OPTIONS.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={policyFilter} onValueChange={setPolicyFilter}>
            <SelectTrigger className="h-8 w-auto min-w-[110px] text-sm">
              <SelectValue placeholder="Policy" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="compliant">Compliant</SelectItem>
              <SelectItem value="warning">Warning</SelectItem>
              <SelectItem value="blocked">Blocked</SelectItem>
            </SelectContent>
          </Select>

          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="h-8 text-xs text-muted-foreground"
            >
              <XIcon className="size-3" />
              Clear
            </Button>
          )}

          <div className="ml-auto">
            <Select
              value={sortBy}
              onValueChange={(v) => setSortBy(v as SortOption)}
            >
              <SelectTrigger className="h-8 w-auto min-w-[160px] text-sm">
                <ArrowUpDownIcon className="size-3 mr-1.5 text-muted-foreground" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SORT_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {(["all", "pending", "approved", "denied"] as const).map((tab) => (
          <TabsContent key={tab} value={tab}>
            {sorted.length === 0 ? (
              <div className="rounded-lg border p-8 text-center">
                {hasActiveFilters ? (
                  <SearchIcon className="mx-auto size-8 text-muted-foreground mb-2" />
                ) : filter === "pending" && counts.pending === 0 ? (
                  <CheckCircle2Icon className="mx-auto size-8 text-emerald-500 mb-2" />
                ) : (
                  <InboxIcon className="mx-auto size-8 text-muted-foreground mb-2" />
                )}
                <p className="text-sm text-muted-foreground">{emptyMessage}</p>
                {hasActiveFilters && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearFilters}
                    className="mt-2 text-xs"
                  >
                    Clear all filters
                  </Button>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                {sorted.map((request) => (
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
  const isProhibited = parsed?.flags?.includes("prohibited");
  const hasWarnings = (parsed?.flags ?? []).length > 0 && !isProhibited;

  return (
    <Card
      className={cn(
        "cursor-pointer transition-all duration-150",
        "hover:bg-muted/40 hover:shadow-sm",
        isProhibited && "border-l-4 border-l-red-500 bg-red-50/30",
        hasWarnings && "border-l-4 border-l-amber-400 bg-amber-50/20"
      )}
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
                  request.status === "approved" ? "bg-emerald-600" : undefined
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

            <p className="text-sm text-muted-foreground truncate">
              {parsed?.summary ?? request.raw_text}
            </p>

            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <RelativeTime date={request.submitted_at} className="font-mono" />
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
