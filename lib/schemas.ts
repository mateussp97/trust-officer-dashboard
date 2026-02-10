import { z } from "zod";

export const PolicyFlagSchema = z.enum([
  "prohibited",
  "requires_review",
  "unknown_beneficiary",
  "exceeds_monthly_cap",
]);

export const ParsedRequestSchema = z.object({
  amount: z.number().describe("Dollar amount requested, as a number"),
  category: z
    .enum([
      "Education",
      "Medical",
      "General Support",
      "Investment",
      "Vehicle",
      "Other",
    ])
    .describe("The request category"),
  urgency: z
    .enum(["low", "medium", "high", "critical"])
    .describe("Urgency level based on deadlines and context"),
  summary: z.string().describe("One-sentence summary of the request"),
  policy_notes: z
    .array(z.string())
    .describe("Relevant policy observations"),
  flags: z
    .array(PolicyFlagSchema)
    .describe("Applicable policy flag codes"),
});
