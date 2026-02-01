"use client";

import {
  WalletIcon,
  ArrowUpRightIcon,
  ArrowDownRightIcon,
  ClockIcon,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useDashboardStore, selectPendingExposure } from "@/stores/dashboard-store";
import { formatCurrency } from "@/lib/format";

export function LedgerSummaryCards() {
  const balance = useDashboardStore((s) => s.balance);
  const totalCredits = useDashboardStore((s) => s.totalCredits);
  const totalDebits = useDashboardStore((s) => s.totalDebits);
  const pendingExposure = useDashboardStore(selectPendingExposure);

  const cards = [
    {
      title: "Current Balance",
      value: formatCurrency(balance),
      icon: WalletIcon,
      description: "Available trust funds",
      accent: "text-foreground",
    },
    {
      title: "Total Credits",
      value: formatCurrency(totalCredits),
      icon: ArrowUpRightIcon,
      description: "All-time inflows",
      accent: "text-emerald-600",
    },
    {
      title: "Total Debits",
      value: formatCurrency(totalDebits),
      icon: ArrowDownRightIcon,
      description: "All-time outflows",
      accent: "text-red-500",
    },
    {
      title: "Pending Exposure",
      value: formatCurrency(pendingExposure),
      icon: ClockIcon,
      description: "Awaiting review",
      accent: "text-amber-600",
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => (
        <Card key={card.title}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              {card.title}
            </CardTitle>
            <card.icon className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-semibold tabular-nums tracking-tight ${card.accent}`}>
              {card.value}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {card.description}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
