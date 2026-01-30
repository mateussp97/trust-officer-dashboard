import { NextResponse } from "next/server";
import { parseRequestWithAI } from "@/lib/openai";
import { updateRequest, getRequestById } from "@/lib/data";
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
    const parsed = await parseRequestWithAI(raw_text, beneficiary);

    // Run policy check and merge flags
    const policyResult = checkPolicy(parsed, beneficiary);
    const mergedFlags = [
      ...new Set([...parsed.flags, ...policyResult.flags]),
    ];
    const mergedNotes = [
      ...new Set([...parsed.policy_notes, ...policyResult.notes]),
    ];

    const finalParsed = {
      ...parsed,
      flags: mergedFlags,
      policy_notes: mergedNotes,
    };

    // If request_id is provided, save the parsed data to the request
    if (request_id) {
      const existing = getRequestById(request_id);
      if (existing) {
        updateRequest(request_id, { parsed: finalParsed });
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
