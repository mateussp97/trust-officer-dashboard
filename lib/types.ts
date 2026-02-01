export interface LedgerEntry {
  id: string;
  date: string;
  description: string;
  amount: number;
  type: "CREDIT" | "DEBIT";
  related_request_id?: string;
  created_by?: string;
}

export interface ParsedRequest {
  amount: number;
  category:
    | "Education"
    | "Medical"
    | "General Support"
    | "Investment"
    | "Vehicle"
    | "Other";
  urgency: "low" | "medium" | "high" | "critical";
  summary: string;
  policy_notes: string[];
  flags: PolicyFlag[];
}

export type PolicyFlag =
  | "prohibited"
  | "over_limit"
  | "requires_review"
  | "unknown_beneficiary"
  | "exceeds_monthly_cap";

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
