import { NextResponse } from "next/server";
import { parseRequestWithAI } from "@/lib/openai";
import {
  updateRequest,
  getRequestById,
  getMonthlyGeneralSupportSpending,
  getKnownBeneficiaries,
} from "@/lib/data";
import { checkPolicy } from "@/lib/policy";

export async function POST(request: Request) {
  const body = await request.json();
  const { request_id, raw_text, beneficiary } = body;

  if (!raw_text) {
    return NextResponse.json(
      { error: "raw_text is required" },
      { status: 400 }
    );
  }

  try {
    const knownBeneficiaries = getKnownBeneficiaries();
    const parsed = await parseRequestWithAI(
      raw_text,
      beneficiary,
      knownBeneficiaries
    );

    // Run policy check with cumulative monthly spending
    const monthlySpending = beneficiary
      ? getMonthlyGeneralSupportSpending(beneficiary)
      : 0;
    const policyResult = checkPolicy(parsed, beneficiary, monthlySpending, raw_text);
    const mergedFlags = [...new Set([...parsed.flags, ...policyResult.flags])];
    const mergedNotes = [
      ...new Set([...parsed.policy_notes, ...policyResult.notes]),
    ];

    const finalParsed = {
      ...parsed,
      flags: mergedFlags,
      policy_notes: mergedNotes,
    };

    // If request_id is provided, save the parsed data and log the event
    if (request_id) {
      const existing = getRequestById(request_id);
      if (existing) {
        const log = [...(existing.activity_log ?? [])];
        log.push({
          timestamp: new Date().toISOString(),
          action: "parsed",
          actor: "AI (GPT-5.2)",
          detail: `Parsed as ${
            finalParsed.category
          }, $${finalParsed.amount.toLocaleString()}`,
        });
        updateRequest(request_id, { parsed: finalParsed, activity_log: log });
      }
    }

    return NextResponse.json(finalParsed);
  } catch (error) {
    console.error("Parse error:", error);
    return NextResponse.json(
      {
        error: "Failed to parse request with AI",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
