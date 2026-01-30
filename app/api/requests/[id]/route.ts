import { NextResponse } from "next/server";
import { getRequestById, updateRequest, addLedgerEntry, getBalance } from "@/lib/data";
import type { LedgerEntry, RequestResolution } from "@/lib/types";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: Request, context: RouteContext) {
  const { id } = await context.params;
  const body = await request.json();
  const { action, notes, approved_amount, officer_override } = body;

  const existing = getRequestById(id);
  if (!existing) {
    return NextResponse.json({ error: "Request not found" }, { status: 404 });
  }

  // Update officer override if provided
  if (officer_override) {
    updateRequest(id, { officer_override });
    if (!action) {
      const updated = getRequestById(id);
      return NextResponse.json(updated);
    }
  }

  if (action === "approve") {
    if (existing.status !== "pending") {
      return NextResponse.json(
        { error: "Request already processed" },
        { status: 400 }
      );
    }

    const amount =
      approved_amount ??
      existing.officer_override?.amount ??
      existing.parsed?.amount ??
      0;

    if (amount <= 0) {
      return NextResponse.json(
        { error: "Cannot approve with zero or negative amount" },
        { status: 400 }
      );
    }

    const currentBalance = getBalance();
    if (amount > currentBalance) {
      return NextResponse.json(
        {
          error: `Insufficient balance. Available: $${currentBalance.toLocaleString()}, Requested: $${amount.toLocaleString()}`,
        },
        { status: 400 }
      );
    }

    // Create ledger DEBIT entry
    const ledgerEntryId = `txn_${Date.now()}`;
    const ledgerEntry: LedgerEntry = {
      id: ledgerEntryId,
      date: new Date().toISOString(),
      description: `Beneficiary Distribution — ${existing.beneficiary} (${existing.parsed?.category ?? "General"})`,
      amount,
      type: "DEBIT",
      related_request_id: id,
      created_by: "Margaret Chen",
    };

    addLedgerEntry(ledgerEntry);

    // Update request status
    const resolution: RequestResolution = {
      action: "approved",
      decided_by: "Margaret Chen",
      decided_at: new Date().toISOString(),
      notes: notes || "",
      approved_amount: amount,
      ledger_entry_id: ledgerEntryId,
    };

    const updated = updateRequest(id, { status: "approved", resolution });

    return NextResponse.json({ request: updated, ledgerEntry });
  }

  if (action === "deny") {
    if (existing.status !== "pending") {
      return NextResponse.json(
        { error: "Request already processed" },
        { status: 400 }
      );
    }

    const resolution: RequestResolution = {
      action: "denied",
      decided_by: "Margaret Chen",
      decided_at: new Date().toISOString(),
      notes: notes || "",
    };

    const updated = updateRequest(id, { status: "denied", resolution });

    return NextResponse.json({ request: updated });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
