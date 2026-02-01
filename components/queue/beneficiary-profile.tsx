"use client";

import { useMemo } from "react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Badge } from "@/components/ui/badge";
import { useDashboardStore } from "@/stores/dashboard-store";
import { formatCurrency } from "@/lib/format";
import { CATEGORY_COLORS } from "@/lib/constants";
import { ChevronDownIcon, UserIcon } from "lucide-react";

interface BeneficiaryProfileProps {
  beneficiary: string;
  defaultOpen?: boolean;
}

export function BeneficiaryProfile({
  beneficiary,
  defaultOpen,
}: BeneficiaryProfileProps) {
  const requests = useDashboardStore((s) => s.requests);
  const ledger = useDashboardStore((s) => s.ledger);

  const stats = useMemo(() => {
    const beneficiaryRequests = requests.filter(
      (r) => r.beneficiary === beneficiary
    );
    const approved = beneficiaryRequests.filter((r) => r.status === "approved");
    const denied = beneficiaryRequests.filter((r) => r.status === "denied");
    const pending = beneficiaryRequests.filter((r) => r.status === "pending");

    // Total distributions from ledger
    const requestIds = new Set(approved.map((r) => r.id));
    const distributions = ledger.filter(
      (e) =>
        e.type === "DEBIT" &&
        e.related_request_id &&
        requestIds.has(e.related_request_id)
    );
    const totalDistributed = distributions.reduce(
      (sum, e) => sum + e.amount,
      0
    );

    // Current month spending
    const now = new Date();
    const currentMonthDistributions = distributions.filter((e) => {
      const d = new Date(e.date);
      return (
        d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth()
      );
    });
    const currentMonthTotal = currentMonthDistributions.reduce(
      (sum, e) => sum + e.amount,
      0
    );

    // Category breakdown
    const byCategory: Record<string, number> = {};
    for (const req of approved) {
      const cat =
        req.officer_override?.category ?? req.parsed?.category ?? "Other";
      byCategory[cat] =
        (byCategory[cat] ?? 0) + (req.resolution?.approved_amount ?? 0);
    }

    return {
      totalRequests: beneficiaryRequests.length,
      approvedCount: approved.length,
      deniedCount: denied.length,
      pendingCount: pending.length,
      totalDistributed,
      currentMonthTotal,
      byCategory,
    };
  }, [requests, ledger, beneficiary]);

  return (
    <Collapsible defaultOpen={defaultOpen}>
      <CollapsibleTrigger className="flex w-full items-center justify-between rounded-lg border bg-muted/30 p-3 text-left hover:bg-muted/50 transition-colors group">
        <div className="flex items-center gap-2">
          <UserIcon className="size-3.5 text-muted-foreground" />
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Beneficiary Profile
          </span>
        </div>
        <ChevronDownIcon className="size-4 text-muted-foreground transition-transform group-data-[state=open]:rotate-180" />
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="rounded-b-lg border border-t-0 p-3 space-y-3">
          {/* Stats grid */}
          <div className="grid grid-cols-3 gap-3">
            <div className="text-center">
              <p className="text-lg font-semibold font-mono tabular-nums">
                {formatCurrency(stats.totalDistributed)}
              </p>
              <p className="text-xs text-muted-foreground">Total distributed</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-semibold font-mono tabular-nums">
                {formatCurrency(stats.currentMonthTotal)}
              </p>
              <p className="text-xs text-muted-foreground">This month</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-semibold tabular-nums">
                {stats.totalRequests}
              </p>
              <p className="text-xs text-muted-foreground">Total requests</p>
            </div>
          </div>

          {/* Request counts */}
          <div className="flex items-center gap-2 text-xs">
            <Badge
              variant="secondary"
              className="bg-emerald-50 text-emerald-700 border-emerald-200"
            >
              {stats.approvedCount} approved
            </Badge>
            <Badge
              variant="secondary"
              className="bg-red-50 text-red-700 border-red-200"
            >
              {stats.deniedCount} denied
            </Badge>
            {stats.pendingCount > 0 && (
              <Badge variant="secondary">{stats.pendingCount} pending</Badge>
            )}
          </div>

          {/* Category breakdown */}
          {Object.keys(stats.byCategory).length > 0 && (
            <div className="space-y-1.5">
              <p className="text-xs text-muted-foreground">By category</p>
              <div className="flex flex-wrap gap-1.5">
                {Object.entries(stats.byCategory)
                  .sort(([, a], [, b]) => b - a)
                  .map(([cat, amount]) => (
                    <Badge
                      key={cat}
                      variant="outline"
                      className={CATEGORY_COLORS[cat] ?? ""}
                    >
                      {cat}: {formatCurrency(amount)}
                    </Badge>
                  ))}
              </div>
            </div>
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
