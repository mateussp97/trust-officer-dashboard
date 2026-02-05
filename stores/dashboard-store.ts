import { create } from "zustand";
import type {
  LedgerEntry,
  TrustRequest,
  LedgerSummary,
  RequestsSummary,
  OfficerOverride,
} from "@/lib/types";

interface DashboardState {
  // Data
  ledger: LedgerEntry[];
  requests: TrustRequest[];
  balance: number;
  totalCredits: number;
  totalDebits: number;

  // Loading states
  isLoadingLedger: boolean;
  isLoadingRequests: boolean;
  isParsingRequest: Record<string, boolean>;
  isProcessingRequest: Record<string, boolean>;

  // Actions
  fetchLedger: () => Promise<void>;
  fetchRequests: () => Promise<void>;
  fetchAll: () => Promise<void>;
  parseRequest: (
    requestId: string,
    rawText: string,
    beneficiary: string
  ) => Promise<void>;
  parseAllPending: () => Promise<void>;
  approveRequest: (
    id: string,
    notes: string,
    approvedAmount?: number
  ) => Promise<void>;
  denyRequest: (id: string, notes: string) => Promise<void>;
  updateOverride: (id: string, override: OfficerOverride) => Promise<void>;
  batchApprove: (ids: string[]) => Promise<{ succeeded: number; failed: number }>;
  batchDeny: (ids: string[]) => Promise<{ succeeded: number; failed: number }>;
  resetData: () => Promise<void>;
}

export const useDashboardStore = create<DashboardState>((set, get) => ({
  // Initial state
  ledger: [],
  requests: [],
  balance: 0,
  totalCredits: 0,
  totalDebits: 0,
  isLoadingLedger: false,
  isLoadingRequests: false,
  isParsingRequest: {},
  isProcessingRequest: {},

  fetchLedger: async () => {
    set({ isLoadingLedger: true });
    try {
      const res = await fetch("/api/ledger");
      const data: LedgerSummary = await res.json();
      set({
        ledger: data.entries,
        balance: data.balance,
        totalCredits: data.totalCredits,
        totalDebits: data.totalDebits,
      });
    } finally {
      set({ isLoadingLedger: false });
    }
  },

  fetchRequests: async () => {
    set({ isLoadingRequests: true });
    try {
      const res = await fetch("/api/requests");
      const data: RequestsSummary = await res.json();
      set({ requests: data.requests });
    } finally {
      set({ isLoadingRequests: false });
    }
  },

  fetchAll: async () => {
    await Promise.all([get().fetchLedger(), get().fetchRequests()]);
  },

  parseRequest: async (requestId, rawText, beneficiary) => {
    set((state) => ({
      isParsingRequest: { ...state.isParsingRequest, [requestId]: true },
    }));
    try {
      const res = await fetch("/api/parse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          request_id: requestId,
          raw_text: rawText,
          beneficiary,
        }),
      });
      if (!res.ok) throw new Error("Parse failed");
      const parsed = await res.json();

      // Update the request in local state
      set((state) => ({
        requests: state.requests.map((r) =>
          r.id === requestId ? { ...r, parsed } : r
        ),
      }));
    } finally {
      set((state) => ({
        isParsingRequest: { ...state.isParsingRequest, [requestId]: false },
      }));
    }
  },

  parseAllPending: async () => {
    const { requests, parseRequest } = get();
    const pending = requests.filter((r) => r.status === "pending" && !r.parsed);
    await Promise.allSettled(
      pending.map((r) => parseRequest(r.id, r.raw_text, r.beneficiary))
    );
  },

  approveRequest: async (id, notes, approvedAmount) => {
    if (get().isProcessingRequest[id]) return;
    set((s) => ({ isProcessingRequest: { ...s.isProcessingRequest, [id]: true } }));

    // Snapshot for rollback
    const prevState = {
      requests: get().requests,
      balance: get().balance,
      totalDebits: get().totalDebits,
    };

    const request = get().requests.find((r) => r.id === id);
    const amount =
      approvedAmount ??
      request?.officer_override?.amount ??
      request?.parsed?.amount ??
      0;

    // Optimistic update (pendingCount/pendingExposure auto-derive from requests)
    set((s) => ({
      requests: s.requests.map((r) =>
        r.id === id ? { ...r, status: "approved" as const } : r
      ),
      balance: s.balance - amount,
      totalDebits: s.totalDebits + amount,
    }));

    try {
      const res = await fetch(`/api/requests/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "approve",
          notes,
          approved_amount: approvedAmount,
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        set(prevState);
        throw new Error(error.error || "Failed to approve request");
      }

      // Reconcile with server response instead of full refetch
      const data = await res.json();
      set((s) => ({
        requests: s.requests.map((r) => (r.id === id ? data.request : r)),
        ledger: data.ledgerEntry ? [...s.ledger, data.ledgerEntry] : s.ledger,
      }));
    } catch (error) {
      // Ensure rollback on network errors too
      if (get().requests.find((r) => r.id === id)?.status === "approved") {
        set(prevState);
      }
      throw error;
    } finally {
      set((s) => ({ isProcessingRequest: { ...s.isProcessingRequest, [id]: false } }));
    }
  },

  denyRequest: async (id, notes) => {
    if (get().isProcessingRequest[id]) return;
    set((s) => ({ isProcessingRequest: { ...s.isProcessingRequest, [id]: true } }));

    // Snapshot for rollback
    const prevState = {
      requests: get().requests,
    };

    // Optimistic update (pendingCount/pendingExposure auto-derive from requests)
    set((s) => ({
      requests: s.requests.map((r) =>
        r.id === id ? { ...r, status: "denied" as const } : r
      ),
    }));

    try {
      const res = await fetch(`/api/requests/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "deny", notes }),
      });

      if (!res.ok) {
        const error = await res.json();
        set(prevState);
        throw new Error(error.error || "Failed to deny request");
      }

      // Reconcile with server response instead of full refetch
      const data = await res.json();
      set((s) => ({
        requests: s.requests.map((r) => (r.id === id ? data.request : r)),
      }));
    } catch (error) {
      if (get().requests.find((r) => r.id === id)?.status === "denied") {
        set(prevState);
      }
      throw error;
    } finally {
      set((s) => ({ isProcessingRequest: { ...s.isProcessingRequest, [id]: false } }));
    }
  },

  batchApprove: async (ids) => {
    // Process sequentially to avoid race conditions with monthly cap checks
    let succeeded = 0;
    let failed = 0;
    for (const id of ids) {
      try {
        await get().approveRequest(id, "Batch approved", undefined);
        succeeded++;
      } catch {
        failed++;
      }
    }
    return { succeeded, failed };
  },

  batchDeny: async (ids) => {
    const results = await Promise.allSettled(
      ids.map((id) => get().denyRequest(id, "Batch denied"))
    );
    const succeeded = results.filter((r) => r.status === "fulfilled").length;
    return { succeeded, failed: ids.length - succeeded };
  },

  updateOverride: async (id, override) => {
    const res = await fetch(`/api/requests/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ officer_override: override }),
    });

    if (!res.ok) throw new Error("Failed to update override");

    const data = await res.json();
    set((state) => ({
      requests: state.requests.map((r) => (r.id === id ? data : r)),
    }));
  },

  resetData: async () => {
    const res = await fetch("/api/reset", { method: "POST" });
    if (!res.ok) throw new Error("Failed to reset data");
    await get().fetchAll();
  },
}));

// Derived selectors - computed from requests array
export const selectPendingCount = (state: DashboardState) =>
  state.requests.filter((r) => r.status === "pending").length;

export const selectPendingExposure = (state: DashboardState) =>
  state.requests
    .filter((r) => r.status === "pending" && !r.parsed?.flags?.includes("prohibited"))
    .reduce((sum, r) => sum + (r.parsed?.amount ?? 0), 0);
