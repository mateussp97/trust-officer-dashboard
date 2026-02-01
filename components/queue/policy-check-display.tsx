"use client";

import { ShieldAlertIcon, AlertTriangleIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { PolicyFlag } from "@/lib/types";
import { FLAG_CONFIG } from "@/lib/constants";

interface PolicyCheckDisplayProps {
  flags: PolicyFlag[];
  notes: string[];
  compact?: boolean;
}

export function PolicyCheckDisplay({
  flags,
  notes,
  compact = false,
}: PolicyCheckDisplayProps) {
  // Return nothing when compliant AND no notes
  if (flags.length === 0 && notes.length === 0) {
    return null;
  }

  // If only notes (no flags), show them in a simple info style
  if (flags.length === 0 && notes.length > 0) {
    return (
      <ul className="space-y-1">
        {notes.map((note, i) => (
          <li key={i} className="text-xs text-muted-foreground">
            {note}
          </li>
        ))}
      </ul>
    );
  }

  const hasBlocked = flags.some((f) => FLAG_CONFIG[f]?.severity === "blocked");

  if (compact) {
    return (
      <div className="flex flex-wrap gap-1">
        {flags.map((flag) => {
          const config = FLAG_CONFIG[flag];
          if (!config) return null;
          return (
            <Badge
              key={flag}
              variant={
                config.severity === "blocked" ? "destructive" : "outline"
              }
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
          className={`text-xs font-medium ${
            hasBlocked ? "text-red-600" : "text-amber-600"
          }`}
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
              variant={
                config.severity === "blocked" ? "destructive" : "outline"
              }
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
