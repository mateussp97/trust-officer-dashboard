"use client";

import { SiteHeader } from "@/components/site-header";
import { LedgerSummaryCards } from "@/components/ledger/ledger-summary-cards";
import { LedgerTable } from "@/components/ledger/ledger-table";
import { BalanceChart } from "@/components/ledger/balance-chart";

export default function LedgerPage() {
  return (
    <>
      <SiteHeader
        title="Ledger"
        description="Trust financial health and transaction history"
      />
      <div className="flex flex-col gap-6 p-6">
        <LedgerSummaryCards />
        <BalanceChart />
        <div>
          <h2 className="text-sm font-medium mb-3">Transaction History</h2>
          <LedgerTable />
        </div>
      </div>
    </>
  );
}
