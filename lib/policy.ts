import type { ParsedRequest, PolicyFlag } from "./types";

export const TRUST_POLICY = {
  education: {
    label: "Education",
    description: "Fully covered. Includes tuition, materials, academic travel.",
    covered: true,
  },
  medical: {
    label: "Medical",
    description: "Fully covered.",
    covered: true,
  },
  generalSupport: {
    label: "General Support",
    description: "Capped at $5,000/month per beneficiary.",
    monthlyCapPerBeneficiary: 5000,
  },
  largePurchase: {
    label: "Large Purchases",
    description: "Over $20,000 requires high-priority review.",
    reviewThreshold: 20000,
  },
  prohibited: {
    label: "Prohibited",
    description:
      "No speculative investments, luxury vehicles, or luxury goods.",
    categories: ["Investment", "Vehicle"],
    keywords: [
      "speculative",
      "luxury",
      "angel invest",
      "crypto",
      "gambling",
      "tesla",
      "ferrari",
      "lamborghini",
      "porsche",
      "rolex",
      "gucci",
    ],
  },
} as const;

export const KNOWN_BENEFICIARIES = ["Sam Miller", "Katie Miller"];

export interface PolicyCheckResult {
  flags: PolicyFlag[];
  notes: string[];
  severity: "ok" | "warning" | "blocked";
}

export function checkPolicy(
  parsed: ParsedRequest,
  beneficiary: string,
  currentMonthGSSpending: number = 0
): PolicyCheckResult {
  const flags: PolicyFlag[] = [];
  const notes: string[] = [];

  // Check prohibited categories
  if (
    parsed.category === "Investment" ||
    parsed.category === "Vehicle"
  ) {
    flags.push("prohibited");
    notes.push(
      `Prohibited: ${parsed.category === "Investment" ? "Speculative investments" : "Luxury vehicles"} are not allowed under trust policy.`
    );
  }

  // Check large purchase threshold
  if (parsed.amount > TRUST_POLICY.largePurchase.reviewThreshold) {
    flags.push("requires_review");
    notes.push(
      `Amount exceeds $${TRUST_POLICY.largePurchase.reviewThreshold.toLocaleString()} — requires high-priority review.`
    );
  }

  // Check general support monthly cap (cumulative)
  if (parsed.category === "General Support") {
    const cap = TRUST_POLICY.generalSupport.monthlyCapPerBeneficiary;
    const totalWithRequest = currentMonthGSSpending + parsed.amount;
    if (totalWithRequest > cap) {
      const remaining = Math.max(0, cap - currentMonthGSSpending);
      flags.push("exceeds_monthly_cap");
      notes.push(
        `General Support is capped at $${cap.toLocaleString()}/month per beneficiary. ` +
        `Already spent this month: $${currentMonthGSSpending.toLocaleString()}. ` +
        `Remaining: $${remaining.toLocaleString()}. ` +
        `Requested: $${parsed.amount.toLocaleString()}.`
      );
    }
  }

  // Check unknown beneficiary
  if (!KNOWN_BENEFICIARIES.includes(beneficiary)) {
    flags.push("unknown_beneficiary");
    notes.push(
      `Beneficiary "${beneficiary}" is not a known trust beneficiary.`
    );
  }

  // Determine severity
  let severity: PolicyCheckResult["severity"] = "ok";
  if (flags.includes("prohibited")) {
    severity = "blocked";
  } else if (flags.length > 0) {
    severity = "warning";
  }

  return { flags, notes, severity };
}
