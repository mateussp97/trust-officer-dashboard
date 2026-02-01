"use client";

import type { ActivityEvent } from "@/lib/types";
import {
  SparklesIcon,
  CheckCircle2Icon,
  XCircleIcon,
  SendIcon,
  PencilIcon,
} from "lucide-react";

interface ActivityTimelineProps {
  events: ActivityEvent[];
}

const ACTION_CONFIG: Record<
  string,
  { icon: typeof SparklesIcon; color: string; label: string }
> = {
  submitted: {
    icon: SendIcon,
    color: "text-blue-500",
    label: "Submitted",
  },
  parsed: {
    icon: SparklesIcon,
    color: "text-violet-500",
    label: "AI Parsed",
  },
  override_updated: {
    icon: PencilIcon,
    color: "text-amber-500",
    label: "Override Updated",
  },
  approved: {
    icon: CheckCircle2Icon,
    color: "text-emerald-500",
    label: "Approved",
  },
  denied: {
    icon: XCircleIcon,
    color: "text-red-500",
    label: "Denied",
  },
};

export function ActivityTimeline({ events }: ActivityTimelineProps) {
  if (events.length === 0) return null;

  return (
    <div className="space-y-1.5">
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
        Activity Log
      </p>
      <div className="relative space-y-0">
        {events.map((event, i) => {
          const config = ACTION_CONFIG[event.action] ?? ACTION_CONFIG.submitted;
          const Icon = config.icon;
          const isLast = i === events.length - 1;

          return (
            <div key={`${event.timestamp}-${i}`} className="flex gap-3 relative">
              {/* Timeline line */}
              {!isLast && (
                <div className="absolute left-[11px] top-6 bottom-0 w-px bg-border" />
              )}
              {/* Icon */}
              <div className="relative z-10 flex-shrink-0 mt-0.5">
                <div className="flex size-[22px] items-center justify-center rounded-full bg-background border">
                  <Icon className={`size-3 ${config.color}`} />
                </div>
              </div>
              {/* Content */}
              <div className="flex-1 pb-3">
                <div className="flex items-baseline gap-2">
                  <span className="text-xs font-medium">{config.label}</span>
                  <span className="text-xs text-muted-foreground">
                    {new Date(event.timestamp).toLocaleString("en-US", {
                      month: "short",
                      day: "numeric",
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {event.actor}
                  {event.detail && ` — ${event.detail}`}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
