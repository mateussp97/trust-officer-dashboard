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
  pendingCount: number;
  pendingExposure: number;

  // Loading states
  isLoadingLedger: boolean;
  isLoadingRequests: boolean;
  isParsingRequest: Record<string, boolean>;

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
}

export const useDashboardStore = create<DashboardState>((set, get) => ({
  // Initial state
  ledger: [],
  requests: [],
  balance: 0,
  totalCredits: 0,
  totalDebits: 0,
  pendingCount: 0,
  pendingExposure: 0,
  isLoadingLedger: false,
  isLoadingRequests: false,
  isParsingRequest: {},

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
      set({
        requests: data.requests,
        pendingCount: data.pendingCount,
        pendingExposure: data.pendingExposure,
      });
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
      throw new Error(error.error || "Failed to approve request");
    }

    // Refetch both to stay in sync
    await get().fetchAll();
  },

  denyRequest: async (id, notes) => {
    const res = await fetch(`/api/requests/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "deny", notes }),
    });

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || "Failed to deny request");
    }

    await get().fetchAll();
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
}));
