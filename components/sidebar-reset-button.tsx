"use client";

import { RotateCcwIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useDashboardStore } from "@/stores/dashboard-store";
import { toast } from "sonner";

export function SidebarResetButton() {
  const resetData = useDashboardStore((s) => s.resetData);
  const parseAllPending = useDashboardStore((s) => s.parseAllPending);

  return (
    <div className="px-2 py-1">
      <Button
        variant="ghost"
        size="sm"
        className="w-full justify-start gap-2 text-muted-foreground"
        onClick={async () => {
          try {
            await resetData();
            await parseAllPending();
            toast.success("Data reset to seed state");
          } catch {
            toast.error("Failed to reset data");
          }
        }}
      >
        <RotateCcwIcon className="size-3.5" />
        Reset Demo Data
      </Button>
    </div>
  );
}
