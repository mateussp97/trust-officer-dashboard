import { NextResponse } from "next/server";
import { getRequestById, updateRequest, addLedgerEntry, getBalance, getMonthlyGeneralSupportSpending } from "@/lib/data";
import { TRUST_POLICY } from "@/lib/policy";
import type { LedgerEntry, RequestResolution, ActivityEvent } from "@/lib/types";

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
    const currentAmount = existing.officer_override?.amount ?? existing.parsed?.amount;
    const currentCategory = existing.officer_override?.category ?? existing.parsed?.category;
    const currentUrgency = existing.officer_override?.urgency ?? existing.parsed?.urgency;

    const overrideDetails: string[] = [];
    if (officer_override.amount != null && officer_override.amount !== currentAmount)
      overrideDetails.push(`amount → $${officer_override.amount.toLocaleString()}`);
    if (officer_override.category && officer_override.category !== currentCategory)
      overrideDetails.push(`category → ${officer_override.category}`);
    if (officer_override.urgency && officer_override.urgency !== currentUrgency)
      overrideDetails.push(`urgency → ${officer_override.urgency}`);

    if (overrideDetails.length > 0) {
      const log: ActivityEvent[] = [...(existing.activity_log ?? [])];
      log.push({
        timestamp: new Date().toISOString(),
        action: "override_updated",
        actor: "Margaret Chen",
        detail: overrideDetails.join(", "),
      });
      updateRequest(id, { officer_override, activity_log: log });
    }

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

    // Enforce cumulative monthly cap for General Support
    const effectiveCategory =
      existing.officer_override?.category ?? existing.parsed?.category;
    if (effectiveCategory === "General Support") {
      const cap = TRUST_POLICY.generalSupport.monthlyCapPerBeneficiary;
      const monthlySpending = getMonthlyGeneralSupportSpending(existing.beneficiary);
      if (monthlySpending + amount > cap) {
        const remaining = Math.max(0, cap - monthlySpending);
        return NextResponse.json(
          {
            error: `Approving would exceed the $${cap.toLocaleString()}/month General Support cap for ${existing.beneficiary}. Already spent: $${monthlySpending.toLocaleString()}, Remaining: $${remaining.toLocaleString()}, This request: $${amount.toLocaleString()}.`,
          },
          { status: 400 }
        );
      }
    }

    // Create ledger DEBIT entry
    const ledgerEntryId = `txn_${crypto.randomUUID()}`;
    const ledgerEntry: LedgerEntry = {
      id: ledgerEntryId,
      date: new Date().toISOString(),
      description: `Beneficiary Distribution — ${existing.beneficiary} (${effectiveCategory ?? "General"})`,
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

    // Append approved event to activity log
    const approveLog: ActivityEvent[] = [...(existing.activity_log ?? [])];
    approveLog.push({
      timestamp: new Date().toISOString(),
      action: "approved",
      actor: "Margaret Chen",
      detail: `Approved $${amount.toLocaleString()} — ${effectiveCategory ?? "General"}`,
    });

    const updated = updateRequest(id, { status: "approved", resolution, activity_log: approveLog });

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

    // Append denied event to activity log
    const denyLog: ActivityEvent[] = [...(existing.activity_log ?? [])];
    denyLog.push({
      timestamp: new Date().toISOString(),
      action: "denied",
      actor: "Margaret Chen",
      detail: notes ? `Reason: ${notes}` : undefined,
    });

    const updated = updateRequest(id, { status: "denied", resolution, activity_log: denyLog });

    return NextResponse.json({ request: updated });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
