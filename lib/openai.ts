import OpenAI from "openai";
import type { ParsedRequest } from "./types";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

function buildSystemPrompt(knownBeneficiaries: string[]): string {
  const beneficiaryList =
    knownBeneficiaries.length > 0
      ? knownBeneficiaries.join(", ")
      : "None registered";

  return `You are a trust fund analyst. Parse beneficiary distribution requests and extract structured data.

Trust policy rules:
- Education: Fully covered (tuition, materials, academic travel, professional development)
- Medical: Fully covered (hospital bills, insurance deductibles, treatments)
- General Support: Capped at $5,000/month per beneficiary (rent, living expenses, subscriptions)
- Large Purchases: Over $20,000 requires high-priority review
- Prohibited: No speculative investments (angel investing, crypto, stocks), luxury vehicles (Tesla, Ferrari, etc.), or luxury goods (designer items)

Known beneficiaries: ${beneficiaryList}

Return a JSON object with exactly these fields:
- amount: number (the dollar amount requested, as a number without currency symbols)
- category: string (exactly one of: "Education", "Medical", "General Support", "Investment", "Vehicle", "Other")
- urgency: string (exactly one of: "low", "medium", "high", "critical")
- summary: string (one-sentence plain-English summary of what's being requested)
- policy_notes: string[] (array of relevant policy observations, e.g. "Exceeds $20,000 review threshold", "Prohibited: speculative investment")
- flags: string[] (array of applicable flag codes: "prohibited", "requires_review", "unknown_beneficiary", "exceeds_monthly_cap")

Urgency guidelines:
- critical: Medical emergencies, time-sensitive deadlines (e.g. "due tomorrow")
- high: Upcoming deadlines within a week, large amounts over $20k
- medium: Standard requests with reasonable timelines
- low: No urgency mentioned, future planning`;
}

export async function parseRequestWithAI(
  rawText: string,
  beneficiary: string,
  knownBeneficiaries: string[]
): Promise<ParsedRequest> {
  const response = await client.chat.completions.create({
    model: "gpt-5.2",
    messages: [
      { role: "system", content: buildSystemPrompt(knownBeneficiaries) },
      {
        role: "user",
        content: `Beneficiary: ${beneficiary}\n\nRequest:\n${rawText}`,
      },
    ],
    response_format: { type: "json_object" },
    temperature: 0.1,
  });

  const content = response.choices[0].message.content;
  if (!content) {
    throw new Error("Empty response from OpenAI");
  }

  const parsed = JSON.parse(content) as ParsedRequest;

  const VALID_CATEGORIES = ["Education", "Medical", "General Support", "Investment", "Vehicle", "Other"] as const;
  const VALID_URGENCIES = ["low", "medium", "high", "critical"] as const;

  const category = VALID_CATEGORIES.includes(parsed.category as typeof VALID_CATEGORIES[number])
    ? parsed.category
    : "Other";
  const urgency = VALID_URGENCIES.includes(parsed.urgency as typeof VALID_URGENCIES[number])
    ? parsed.urgency
    : "medium";

  return {
    amount: Number(parsed.amount) || 0,
    category,
    urgency,
    summary: typeof parsed.summary === "string" ? parsed.summary : "",
    policy_notes: Array.isArray(parsed.policy_notes) ? parsed.policy_notes : [],
    flags: Array.isArray(parsed.flags) ? parsed.flags : [],
  };
}
