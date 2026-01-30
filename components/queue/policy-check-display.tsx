"use client";

import {
  ShieldAlertIcon,
  ShieldCheckIcon,
  AlertTriangleIcon,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { PolicyFlag } from "@/lib/types";

interface PolicyCheckDisplayProps {
  flags: PolicyFlag[];
  notes: string[];
  compact?: boolean;
}

const FLAG_CONFIG: Record<
  PolicyFlag,
  { label: string; severity: "blocked" | "warning" }
> = {
  prohibited: { label: "Prohibited", severity: "blocked" },
  over_limit: { label: "Over Limit", severity: "warning" },
  requires_review: { label: "Requires Review", severity: "warning" },
  unknown_beneficiary: { label: "Unknown Beneficiary", severity: "warning" },
  exceeds_monthly_cap: { label: "Exceeds Monthly Cap", severity: "warning" },
};

export function PolicyCheckDisplay({
  flags,
  notes,
  compact = false,
}: PolicyCheckDisplayProps) {
  if (flags.length === 0) {
    return (
      <div className="flex items-center gap-1.5 text-emerald-600">
        <ShieldCheckIcon className="size-3.5" />
        <span className="text-xs font-medium">Policy Compliant</span>
      </div>
    );
  }

  const hasBlocked = flags.some(
    (f) => FLAG_CONFIG[f]?.severity === "blocked"
  );

  if (compact) {
    return (
      <div className="flex flex-wrap gap-1">
        {flags.map((flag) => {
          const config = FLAG_CONFIG[flag];
          if (!config) return null;
          return (
            <Badge
              key={flag}
              variant={config.severity === "blocked" ? "destructive" : "outline"}
              className={
                config.severity === "warning"
                  ? "border-amber-200 bg-amber-50 text-amber-700"
                  : undefined
              }
            >
              {config.label}
            </Badge>
          );
        })}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-1.5">
        {hasBlocked ? (
          <ShieldAlertIcon className="size-3.5 text-red-500" />
        ) : (
          <AlertTriangleIcon className="size-3.5 text-amber-500" />
        )}
        <span
          className={`text-xs font-medium ${hasBlocked ? "text-red-600" : "text-amber-600"}`}
        >
          {hasBlocked ? "Policy Violation" : "Requires Attention"}
        </span>
      </div>
      <div className="flex flex-wrap gap-1">
        {flags.map((flag) => {
          const config = FLAG_CONFIG[flag];
          if (!config) return null;
          return (
            <Badge
              key={flag}
              variant={config.severity === "blocked" ? "destructive" : "outline"}
              className={
                config.severity === "warning"
                  ? "border-amber-200 bg-amber-50 text-amber-700"
                  : undefined
              }
            >
              {config.label}
            </Badge>
          );
        })}
      </div>
      {notes.length > 0 && (
        <ul className="space-y-1">
          {notes.map((note, i) => (
            <li key={i} className="text-xs text-muted-foreground">
              {note}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
