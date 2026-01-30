import { NextResponse } from "next/server";
import { getLedgerSummary, addLedgerEntry } from "@/lib/data";
import type { LedgerEntry } from "@/lib/types";

export async function GET() {
  const summary = getLedgerSummary();
  return NextResponse.json(summary);
}

export async function POST(request: Request) {
  const body = (await request.json()) as Omit<LedgerEntry, "id" | "date">;

  const entry: LedgerEntry = {
    id: `txn_${Date.now()}`,
    date: new Date().toISOString(),
    ...body,
  };

  addLedgerEntry(entry);
  return NextResponse.json(entry, { status: 201 });
}
