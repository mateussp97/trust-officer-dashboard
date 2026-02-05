import { SiteHeader } from "@/components/site-header";
import { LedgerSummaryCards } from "@/components/ledger/ledger-summary-cards";
import { LedgerTable } from "@/components/ledger/ledger-table";
import { BalanceChart } from "@/components/ledger/balance-chart";
import { AnalyticsCharts } from "@/components/ledger/analytics-charts";
import { ErrorBoundary } from "@/components/error-boundary";

export default function LedgerPage() {
  return (
    <>
      <SiteHeader
        title="Ledger"
        description="Trust financial health and transaction history"
      />
      <div className="flex flex-col gap-6 p-6">
        <ErrorBoundary fallbackTitle="Failed to load summary">
          <LedgerSummaryCards />
        </ErrorBoundary>
        <ErrorBoundary fallbackTitle="Failed to load chart">
          <BalanceChart />
        </ErrorBoundary>
        <ErrorBoundary fallbackTitle="Failed to load analytics">
          <AnalyticsCharts />
        </ErrorBoundary>
        <div>
          <h2 className="text-sm font-medium mb-3">Transaction History</h2>
          <ErrorBoundary fallbackTitle="Failed to load transactions">
            <LedgerTable />
          </ErrorBoundary>
        </div>
      </div>
    </>
  );
}
