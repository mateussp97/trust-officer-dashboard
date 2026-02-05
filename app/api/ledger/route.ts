import { NextResponse } from "next/server";
import { getLedgerSummary, addLedgerEntry } from "@/lib/data";
import type { LedgerEntry } from "@/lib/types";

export async function GET() {
  const summary = getLedgerSummary();
  return NextResponse.json(summary);
}

export async function POST(request: Request) {
  const body = await request.json();

  const { description, amount, type } = body;
  if (typeof description !== "string" || !description.trim()) {
    return NextResponse.json({ error: "description is required" }, { status: 400 });
  }
  if (typeof amount !== "number" || amount <= 0 || !Number.isFinite(amount)) {
    return NextResponse.json({ error: "amount must be a positive number" }, { status: 400 });
  }
  if (type !== "CREDIT" && type !== "DEBIT") {
    return NextResponse.json({ error: "type must be CREDIT or DEBIT" }, { status: 400 });
  }

  const entry: LedgerEntry = {
    id: `txn_${crypto.randomUUID()}`,
    date: new Date().toISOString(),
    description: description.trim(),
    amount,
    type,
  };

  addLedgerEntry(entry);
  return NextResponse.json(entry, { status: 201 });
}
