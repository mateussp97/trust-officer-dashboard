"use client";

import { useState, useMemo, useCallback } from "react";
import {
  InboxIcon,
  SearchIcon,
  CheckCircle2Icon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { RequestDetailContent } from "./request-detail-content";
import { RequestRow } from "./request-row";
import { RequestQueueFilters, type SortOption } from "./request-queue-filters";
import { BatchActionBar } from "./batch-action-bar";
import { KeyboardShortcutHelp } from "@/components/keyboard-shortcut-help";
import { useKeyboardShortcuts } from "@/hooks/use-keyboard-shortcuts";
import { useDashboardStore } from "@/stores/dashboard-store";
import { useDrawerStore } from "@/stores/drawer-store";
import type { TrustRequest, RequestStatus } from "@/lib/types";
import { URGENCY_ORDER } from "@/lib/constants";

export function RequestQueue() {
  const requests = useDashboardStore((s) => s.requests);
  const isLoadingRequests = useDashboardStore((s) => s.isLoadingRequests);
  const isParsingRequest = useDashboardStore((s) => s.isParsingRequest);

  const openDrawer = useDrawerStore((s) => s.openDrawer);
  const closeDrawer = useDrawerStore((s) => s.closeDrawer);

  const [filter, setFilter] = useState<"all" | RequestStatus>("all");

  // Selection & keyboard state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const [showShortcutHelp, setShowShortcutHelp] = useState(false);

  // Filter state
  const [search, setSearch] = useState("");
  const [beneficiaryFilter, setBeneficiaryFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [policyFilter, setPolicyFilter] = useState("all");
  const [sortBy, setSortBy] = useState<SortOption>("newest");

  // Auto-parse is now handled in the dashboard layout

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

  const isPendingTab = filter === "pending";

  const toggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const clearSelection = useCallback(() => setSelectedIds(new Set()), []);

  // Keyboard shortcuts — the hook stores shortcuts in a ref internally,
  // so no memoization needed here.
  useKeyboardShortcuts([
    {
      key: "j",
      handler: () => setFocusedIndex((i) => Math.min(i + 1, sorted.length - 1)),
    },
    {
      key: "k",
      handler: () => setFocusedIndex((i) => Math.max(i - 1, 0)),
    },
    {
      key: "Enter",
      handler: () => {
        if (focusedIndex >= 0 && focusedIndex < sorted.length) {
          handleOpenDetail(sorted[focusedIndex]);
        }
      },
    },
    {
      key: "x",
      handler: () => {
        if (isPendingTab && focusedIndex >= 0 && focusedIndex < sorted.length) {
          toggleSelect(sorted[focusedIndex].id);
        }
      },
    },
    {
      key: "Escape",
      handler: () => {
        if (useDrawerStore.getState().isOpen) closeDrawer();
        else if (selectedIds.size > 0) clearSelection();
        else setFocusedIndex(-1);
      },
    },
    { key: "?", handler: () => setShowShortcutHelp(true) },
  ]);

  const counts = useMemo(() => {
    const c = { all: requests.length, pending: 0, approved: 0, denied: 0 };
    for (const r of requests) {
      if (r.status === "pending") c.pending++;
      else if (r.status === "approved") c.approved++;
      else if (r.status === "denied") c.denied++;
    }
    return c;
  }, [requests]);

  const handleOpenDetail = useCallback(
    (request: TrustRequest) => {
      openDrawer({
        content: <RequestDetailContent requestId={request.id} />,
      });
    },
    [openDrawer]
  );

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

        <RequestQueueFilters
          search={search}
          onSearchChange={setSearch}
          beneficiaryFilter={beneficiaryFilter}
          onBeneficiaryFilterChange={setBeneficiaryFilter}
          categoryFilter={categoryFilter}
          onCategoryFilterChange={setCategoryFilter}
          policyFilter={policyFilter}
          onPolicyFilterChange={setPolicyFilter}
          sortBy={sortBy}
          onSortChange={setSortBy}
          beneficiaries={beneficiaries}
          hasActiveFilters={hasActiveFilters}
          onClearFilters={clearFilters}
        />

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
              <div className="space-y-2" aria-live="polite">
                {sorted.map((request, index) => (
                  <RequestRow
                    key={request.id}
                    request={request}
                    isParsing={!!isParsingRequest[request.id]}
                    onOpenDetail={handleOpenDetail}
                    selectable={isPendingTab}
                    selected={selectedIds.has(request.id)}
                    onToggleSelect={toggleSelect}
                    focused={index === focusedIndex}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>

      {isPendingTab && (
        <BatchActionBar
          selectedIds={selectedIds}
          onClearSelection={clearSelection}
        />
      )}

      <KeyboardShortcutHelp
        open={showShortcutHelp}
        onOpenChange={setShowShortcutHelp}
      />
    </>
  );
}
