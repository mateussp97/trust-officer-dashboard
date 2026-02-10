import { generateText, Output } from "ai";
import { openai } from "@ai-sdk/openai";
import { ParsedRequestSchema } from "./schemas";
import type { ParsedRequest } from "./types";

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
  const { output } = await generateText({
    model: openai("gpt-5.2"),
    output: Output.object({
      schema: ParsedRequestSchema,
    }),
    messages: [
      { role: "system", content: buildSystemPrompt(knownBeneficiaries) },
      {
        role: "user",
        content: `Beneficiary: ${beneficiary}\n\nRequest:\n${rawText}`,
      },
    ],
    temperature: 0.1,
  });

  if (!output) {
    throw new Error("Failed to generate structured output from AI");
  }

  return output;
}
