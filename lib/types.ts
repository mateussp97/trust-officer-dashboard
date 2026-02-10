export interface LedgerEntry {
  id: string;
  date: string;
  description: string;
  amount: number;
  type: "CREDIT" | "DEBIT";
  related_request_id?: string;
  created_by?: string;
}

import type { z } from "zod";
import type { ParsedRequestSchema, PolicyFlagSchema } from "./schemas";

export type ParsedRequest = z.output<typeof ParsedRequestSchema>;

export type PolicyFlag = z.output<typeof PolicyFlagSchema>;

export type RequestStatus = "pending" | "approved" | "denied";

export interface OfficerOverride {
  amount?: number;
  category?: string;
  urgency?: string;
  notes?: string;
}

export interface RequestResolution {
  action: "approved" | "denied";
  decided_by: string;
  decided_at: string;
  notes: string;
  approved_amount?: number;
  ledger_entry_id?: string;
}

export interface ActivityEvent {
  timestamp: string;
  action: "submitted" | "parsed" | "override_updated" | "approved" | "denied";
  actor: string;
  detail?: string;
}

export interface TrustRequest {
  id: string;
  beneficiary: string;
  submitted_at: string;
  raw_text: string;
  status: RequestStatus;
  parsed?: ParsedRequest;
  officer_override?: OfficerOverride;
  resolution?: RequestResolution;
  activity_log?: ActivityEvent[];
}

export interface LedgerSummary {
  entries: LedgerEntry[];
  balance: number;
  totalCredits: number;
  totalDebits: number;
}

export interface RequestsSummary {
  requests: TrustRequest[];
  pendingCount: number;
  pendingExposure: number;
}
