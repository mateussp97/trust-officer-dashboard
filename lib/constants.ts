import type { PolicyFlag, RequestStatus } from "./types";

export const CATEGORIES = [
  "Education",
  "Medical",
  "General Support",
  "Investment",
  "Vehicle",
  "Other",
] as const;

export type Category = (typeof CATEGORIES)[number];

export const URGENCY_LEVELS = ["low", "medium", "high", "critical"] as const;

export type Urgency = (typeof URGENCY_LEVELS)[number];

export const CATEGORY_COLORS: Record<string, string> = {
  Education: "border-blue-200 bg-blue-50 text-blue-700",
  Medical: "border-emerald-200 bg-emerald-50 text-emerald-700",
  "General Support": "border-violet-200 bg-violet-50 text-violet-700",
  Investment: "border-red-200 bg-red-50 text-red-700",
  Vehicle: "border-red-200 bg-red-50 text-red-700",
  Other: "border-gray-200 bg-gray-50 text-gray-700",
};

export const URGENCY_COLORS: Record<string, string> = {
  low: "border-gray-200 bg-gray-50 text-gray-600",
  medium: "border-blue-200 bg-blue-50 text-blue-700",
  high: "border-amber-200 bg-amber-50 text-amber-700",
  critical: "border-red-200 bg-red-50 text-red-700",
};

export const URGENCY_ORDER: Record<string, number> = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3,
};

export const STATUS_LABELS: Record<RequestStatus, string> = {
  pending: "Pending",
  approved: "Approved",
  denied: "Denied",
};

export const STATUS_COLORS: Record<RequestStatus, string> = {
  pending: "bg-yellow-500",
  approved: "bg-emerald-500",
  denied: "bg-red-500",
};

export const FLAG_CONFIG: Record<
  PolicyFlag,
  { label: string; severity: "blocked" | "warning" }
> = {
  prohibited: { label: "Prohibited", severity: "blocked" },
  over_limit: { label: "Over Limit", severity: "warning" },
  requires_review: { label: "Requires Review", severity: "warning" },
  unknown_beneficiary: { label: "Unknown Beneficiary", severity: "warning" },
  exceeds_monthly_cap: { label: "Exceeds Monthly Cap", severity: "warning" },
};
