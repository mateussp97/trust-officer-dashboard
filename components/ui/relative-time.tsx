"use client";

import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";
import { formatRelativeTime, formatDateTime } from "@/lib/format";

interface RelativeTimeProps {
  date: string;
  className?: string;
}

export function RelativeTime({ date, className }: RelativeTimeProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <time dateTime={date} className={className}>
          {formatRelativeTime(date)}
        </time>
      </TooltipTrigger>
      <TooltipContent>{formatDateTime(date)}</TooltipContent>
    </Tooltip>
  );
}
