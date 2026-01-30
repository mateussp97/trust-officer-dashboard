"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useDashboardStore } from "@/stores/dashboard-store";
import { formatCurrency, formatDate } from "@/lib/format";

export function LedgerTable() {
  const ledger = useDashboardStore((s) => s.ledger);

  // Show newest first
  const sorted = [...ledger].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  // Calculate running balance (chronological order for calculation)
  const chronological = [...ledger].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );
  const balanceMap = new Map<string, number>();
  let running = 0;
  for (const entry of chronological) {
    running += entry.type === "CREDIT" ? entry.amount : -entry.amount;
    balanceMap.set(entry.id, running);
  }

  if (sorted.length === 0) {
    return (
      <div className="rounded-lg border p-8 text-center text-sm text-muted-foreground">
        No transactions yet.
      </div>
    );
  }

  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Description</TableHead>
            <TableHead className="text-right">Amount</TableHead>
            <TableHead className="text-right">Balance</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sorted.map((entry) => (
            <TableRow key={entry.id}>
              <TableCell className="font-mono text-xs text-muted-foreground">
                {formatDate(entry.date)}
              </TableCell>
              <TableCell>
                <Badge
                  variant={entry.type === "CREDIT" ? "outline" : "secondary"}
                  className={
                    entry.type === "CREDIT"
                      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                      : "border-red-200 bg-red-50 text-red-700"
                  }
                >
                  {entry.type}
                </Badge>
              </TableCell>
              <TableCell className="max-w-[300px] truncate">
                {entry.description}
              </TableCell>
              <TableCell
                className={`text-right font-mono tabular-nums ${
                  entry.type === "CREDIT"
                    ? "text-emerald-600"
                    : "text-red-500"
                }`}
              >
                {entry.type === "CREDIT" ? "+" : "-"}
                {formatCurrency(entry.amount)}
              </TableCell>
              <TableCell className="text-right font-mono tabular-nums">
                {formatCurrency(balanceMap.get(entry.id) ?? 0)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
