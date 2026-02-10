"use client";

import { useEffect, useRef } from "react";
import { useDashboardStore } from "@/stores/dashboard-store";

export function DashboardInitializer() {
  const fetchAll = useDashboardStore((s) => s.fetchAll);
  const parseAllPending = useDashboardStore((s) => s.parseAllPending);
  const requests = useDashboardStore((s) => s.requests);
  const hasAutoParsedRef = useRef(false);

  // Fetch all data on mount
  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  // Auto-parse pending requests after they load (runs once)
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

  return null;
}
