"use client";

import { useMemo } from "react";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useDashboardStore } from "@/stores/dashboard-store";

const CATEGORY_CHART_COLORS: Record<string, string> = {
  Education: "var(--chart-1)",
  Medical: "var(--chart-2)",
  "General Support": "var(--chart-3)",
  Investment: "var(--chart-4)",
  Vehicle: "var(--chart-5)",
  Other: "var(--muted-foreground)",
};

const categoryChartConfig = {
  amount: { label: "Amount" },
  Education: { label: "Education", color: "var(--chart-1)" },
  Medical: { label: "Medical", color: "var(--chart-2)" },
  "General Support": { label: "General Support", color: "var(--chart-3)" },
  Investment: { label: "Investment", color: "var(--chart-4)" },
  Vehicle: { label: "Vehicle", color: "var(--chart-5)" },
  Other: { label: "Other", color: "var(--muted-foreground)" },
} satisfies ChartConfig;

const monthlyChartConfig = {
  total: { label: "Distributions", color: "var(--chart-1)" },
} satisfies ChartConfig;

export function AnalyticsCharts() {
  const ledger = useDashboardStore((s) => s.ledger);
  const requests = useDashboardStore((s) => s.requests);

  const categoryData = useMemo(() => {
    const approved = requests.filter((r) => r.status === "approved");
    const byCategory: Record<string, number> = {};
    for (const r of approved) {
      const cat =
        r.officer_override?.category ?? r.parsed?.category ?? "Other";
      byCategory[cat] =
        (byCategory[cat] ?? 0) + (r.resolution?.approved_amount ?? 0);
    }
    return Object.entries(byCategory)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [requests]);

  const monthlyData = useMemo(() => {
    const debits = ledger.filter((e) => e.type === "DEBIT");
    const byMonth: Record<string, number> = {};
    for (const e of debits) {
      const d = new Date(e.date);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      byMonth[key] = (byMonth[key] ?? 0) + e.amount;
    }
    return Object.entries(byMonth)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, total]) => ({
        month: new Date(month + "-01").toLocaleDateString("en-US", {
          month: "short",
          year: "2-digit",
          timeZone: "UTC",
        }),
        total,
      }));
  }, [ledger]);

  if (categoryData.length === 0 && monthlyData.length === 0) return null;

  return (
    <div className="grid gap-6 sm:grid-cols-2">
      {/* Distributions by category */}
      {categoryData.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Distributions by Category
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={categoryChartConfig} className="h-[220px] w-full">
              <PieChart>
                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      formatter={(value) => `$${Number(value).toLocaleString()}`}
                    />
                  }
                />
                <Pie
                  data={categoryData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={2}
                  strokeWidth={2}
                  stroke="var(--background)"
                >
                  {categoryData.map((entry) => (
                    <Cell
                      key={entry.name}
                      fill={CATEGORY_CHART_COLORS[entry.name] ?? "var(--muted-foreground)"}
                    />
                  ))}
                </Pie>
              </PieChart>
            </ChartContainer>
            {/* Legend */}
            <div className="flex flex-wrap justify-center gap-3 mt-2">
              {categoryData.map((entry) => (
                <div key={entry.name} className="flex items-center gap-1.5 text-xs">
                  <div
                    className="size-2.5 rounded-full"
                    style={{
                      backgroundColor:
                        CATEGORY_CHART_COLORS[entry.name] ?? "var(--muted-foreground)",
                    }}
                  />
                  <span className="text-muted-foreground">{entry.name}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Monthly spend trend */}
      {monthlyData.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Monthly Distribution Trend
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={monthlyChartConfig} className="h-[220px] w-full">
              <BarChart
                data={monthlyData}
                margin={{ top: 4, right: 4, bottom: 0, left: 4 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="var(--border)"
                />
                <XAxis
                  dataKey="month"
                  tickLine={false}
                  axisLine={false}
                  fontSize={11}
                  tickMargin={8}
                  stroke="var(--muted-foreground)"
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  fontSize={11}
                  tickMargin={8}
                  stroke="var(--muted-foreground)"
                  tickFormatter={(value: number) =>
                    value >= 1000 ? `$${(value / 1000).toFixed(0)}k` : `$${value}`
                  }
                />
                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      formatter={(value) => `$${Number(value).toLocaleString()}`}
                    />
                  }
                />
                <Bar
                  dataKey="total"
                  fill="var(--chart-1)"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
