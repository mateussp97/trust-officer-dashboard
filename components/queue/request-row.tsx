"use client";

import { memo } from "react";
import {
  SparklesIcon,
  Loader2Icon,
  EyeIcon,
  ShieldAlertIcon,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { PolicyCheckDisplay } from "./policy-check-display";
import { RelativeTime } from "@/components/ui/relative-time";
import { formatCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";
import { STATUS_COLORS, STATUS_LABELS } from "@/lib/constants";
import type { TrustRequest, PolicyFlag } from "@/lib/types";

export interface RequestRowProps {
  request: TrustRequest;
  isParsing: boolean;
  onOpenDetail: (request: TrustRequest) => void;
  selectable?: boolean;
  selected?: boolean;
  onToggleSelect?: (id: string) => void;
  focused?: boolean;
}

export const RequestRow = memo(function RequestRow({
  request,
  isParsing,
  onOpenDetail,
  selectable,
  selected,
  onToggleSelect,
  focused,
}: RequestRowProps) {
  const parsed = request.parsed;
  const isProhibited = parsed?.flags?.includes("prohibited");
  const hasWarnings = (parsed?.flags ?? []).length > 0 && !isProhibited;

  return (
    <div
      className={cn(
        "relative rounded-lg border p-3 sm:p-4 cursor-pointer transition-all duration-150",
        "hover:bg-muted/40 hover:shadow-sm",
        // Policy state backgrounds
        isProhibited &&
          "border-l-4 border-l-red-500 bg-linear-to-r from-red-50/60 to-transparent dark:from-red-950/20 dark:to-transparent",
        hasWarnings &&
          "border-l-4 border-l-amber-400 bg-linear-to-r from-amber-50/40 to-transparent dark:from-amber-950/20 dark:to-transparent",
        // Selection & focus states
        selected && "ring-2 ring-primary/50 bg-primary/5",
        focused && "ring-2 ring-primary bg-primary/5"
      )}
      onClick={() => onOpenDetail(request)}
    >
      <div className="flex items-start gap-3 sm:gap-4">
        {/* Checkbox for batch selection */}
        {selectable && (
          <div
            className="flex items-center pt-1"
            onClick={(e) => e.stopPropagation()}
          >
            <Checkbox
              checked={selected}
              onCheckedChange={() => onToggleSelect?.(request.id)}
              aria-label={`Select request from ${request.beneficiary}`}
            />
          </div>
        )}

        {/* Left: main info */}
        <div className="flex-1 min-w-0 space-y-1.5">
          {/* Top row: Name + Status */}
          <div className="flex items-center gap-2">
            <span className="font-semibold text-sm">{request.beneficiary}</span>
            <Badge
              variant="default"
              className={cn(STATUS_COLORS[request.status], "capitalize")}
            >
              {STATUS_LABELS[request.status]}
            </Badge>
          </div>

          {/* Summary — allow 2 lines */}
          <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
            {parsed?.summary ?? request.raw_text}
          </p>

          {/* Prohibited banner */}
          {isProhibited && (
            <div className="flex items-center gap-1.5">
              <ShieldAlertIcon className="size-3 text-red-600 dark:text-red-400 shrink-0" />
              <span className="text-xs font-medium text-red-600 dark:text-red-400">
                Prohibited — cannot approve
              </span>
            </div>
          )}

          {/* Metadata row: time + category (plain text) */}
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <RelativeTime date={request.submitted_at} className="font-mono" />
            {parsed?.category && (
              <>
                <span className="text-muted-foreground/40">&middot;</span>
                <span>{parsed.category}</span>
              </>
            )}
          </div>

          {/* Policy warnings - only shown when issues exist */}
          {parsed && !isProhibited && (parsed.flags?.length ?? 0) > 0 && (
            <PolicyCheckDisplay
              flags={(parsed.flags ?? []) as PolicyFlag[]}
              notes={parsed.policy_notes ?? []}
              compact
            />
          )}
        </div>

        {/* Right: amount + review */}
        <div className="flex flex-col items-end gap-2 shrink-0 pt-0.5">
          {isParsing ? (
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Loader2Icon
                className="size-3.5 animate-spin"
                aria-label="Loading"
              />
              <SparklesIcon className="size-3.5" />
            </div>
          ) : parsed ? (
            <span
              className={cn(
                "text-xl font-semibold font-mono tabular-nums",
                isProhibited && "line-through text-muted-foreground"
              )}
            >
              {formatCurrency(parsed.amount)}
            </span>
          ) : (
            <span className="text-xs text-muted-foreground">—</span>
          )}
          <Button
            variant="ghost"
            size="xs"
            className="text-muted-foreground hover:text-foreground"
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
    </div>
  );
});
