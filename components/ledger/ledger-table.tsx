"use client";

import { useState, useMemo } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { useDashboardStore } from "@/stores/dashboard-store";
import { formatCurrency, formatDate } from "@/lib/format";
import {
  ArrowUpIcon,
  ArrowDownIcon,
  SearchIcon,
  XIcon,
  DownloadIcon,
  CalendarIcon,
  BookOpenIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

type SortField = "date" | "amount" | "type";
type SortDir = "asc" | "desc";

const TIME_RANGE_OPTIONS = [
  { value: "all", label: "All time" },
  { value: "7d", label: "Last 7 days" },
  { value: "30d", label: "Last 30 days" },
  { value: "90d", label: "Last 3 months" },
] as const;

type TimeRange = (typeof TIME_RANGE_OPTIONS)[number]["value"];

function getTimeRangeCutoff(range: TimeRange): Date | null {
  if (range === "all") return null;
  const now = new Date();
  const days = range === "7d" ? 7 : range === "30d" ? 30 : 90;
  return new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
}

function escapeCSV(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export function LedgerTable() {
  const ledger = useDashboardStore((s) => s.ledger);

  const [typeFilter, setTypeFilter] = useState<"all" | "CREDIT" | "DEBIT">(
    "all"
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [timeRange, setTimeRange] = useState<TimeRange>("all");
  const [sortField, setSortField] = useState<SortField>("date");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  // Calculate running balance from FULL ledger (chronological)
  const balanceMap = useMemo(() => {
    const chronological = [...ledger].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );
    const map = new Map<string, number>();
    let running = 0;
    for (const entry of chronological) {
      running += entry.type === "CREDIT" ? entry.amount : -entry.amount;
      map.set(entry.id, running);
    }
    return map;
  }, [ledger]);

  // Filter
  const filtered = useMemo(() => {
    let result = ledger;

    const cutoff = getTimeRangeCutoff(timeRange);
    if (cutoff) {
      result = result.filter((e) => new Date(e.date) >= cutoff);
    }

    if (typeFilter !== "all") {
      result = result.filter((e) => e.type === typeFilter);
    }

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter((e) =>
        e.description.toLowerCase().includes(q)
      );
    }

    return result;
  }, [ledger, typeFilter, searchQuery, timeRange]);

  // Sort
  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      let cmp = 0;
      switch (sortField) {
        case "date":
          cmp =
            new Date(a.date).getTime() - new Date(b.date).getTime();
          break;
        case "amount":
          cmp = a.amount - b.amount;
          break;
        case "type":
          cmp = a.type.localeCompare(b.type);
          break;
      }
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [filtered, sortField, sortDir]);

  function toggleSort(field: SortField) {
    if (sortField === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir(field === "date" ? "desc" : "asc");
    }
  }

  const hasActiveFilters =
    typeFilter !== "all" || searchQuery !== "" || timeRange !== "all";

  function clearFilters() {
    setTypeFilter("all");
    setSearchQuery("");
    setTimeRange("all");
  }

  function downloadCSV() {
    const headers = ["Date", "Type", "Description", "Amount", "Balance"];
    const rows = sorted.map((entry) => {
      const sign = entry.type === "CREDIT" ? "" : "-";
      return [
        formatDate(entry.date),
        entry.type,
        entry.description,
        `${sign}${entry.amount.toFixed(2)}`,
        (balanceMap.get(entry.id) ?? 0).toFixed(2),
      ]
        .map(escapeCSV)
        .join(",");
    });

    const csv = [headers.join(","), ...rows].join("\n");
    const bom = "\uFEFF";
    const blob = new Blob([bom + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `trust-ledger-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  if (ledger.length === 0) {
    return (
      <div className="rounded-lg border p-12 text-center">
        <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-muted mb-3">
          <BookOpenIcon className="size-6 text-muted-foreground" />
        </div>
        <h3 className="text-sm font-medium">No transactions yet</h3>
        <p className="text-xs text-muted-foreground mt-1">
          Transactions will appear here once requests are processed.
        </p>
      </div>
    );
  }

  const SortArrow = sortDir === "asc" ? ArrowUpIcon : ArrowDownIcon;

  return (
    <div className="space-y-3">
      {/* Filter bar */}
      <div className="flex items-center gap-2 flex-wrap">
        <Tabs
          value={typeFilter}
          onValueChange={(v) =>
            setTypeFilter(v as "all" | "CREDIT" | "DEBIT")
          }
        >
          <TabsList className="h-8">
            <TabsTrigger value="all" className="text-xs px-2.5">
              All
            </TabsTrigger>
            <TabsTrigger value="CREDIT" className="text-xs px-2.5">
              Credits
            </TabsTrigger>
            <TabsTrigger value="DEBIT" className="text-xs px-2.5">
              Debits
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="relative flex-1 min-w-[180px] max-w-xs">
          <SearchIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
          <Input
            placeholder="Search transactions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8 h-8 text-sm"
          />
        </div>

        <Select value={timeRange} onValueChange={(v) => setTimeRange(v as TimeRange)}>
          <SelectTrigger className="h-8 w-auto min-w-[130px] text-sm">
            <CalendarIcon className="size-3 mr-1.5 text-muted-foreground" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {TIME_RANGE_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {hasActiveFilters && (
          <>
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="h-8 text-xs text-muted-foreground"
            >
              <XIcon className="size-3" />
              Clear
            </Button>
            <span className="text-xs text-muted-foreground">
              Showing {sorted.length} of {ledger.length} transactions
            </span>
          </>
        )}

        <Button
          variant="outline"
          size="sm"
          onClick={downloadCSV}
          disabled={sorted.length === 0}
          className="h-8 text-xs ml-auto"
        >
          <DownloadIcon className="size-3" />
          Export
        </Button>
      </div>

      {/* Table */}
      {sorted.length === 0 ? (
        <div className="rounded-lg border p-8 text-center">
          <SearchIcon className="mx-auto size-8 text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground">
            No transactions match your filters.
          </p>
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="mt-2 text-xs"
          >
            Clear all filters
          </Button>
        </div>
      ) : (
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead
                  className={cn(
                    "cursor-pointer select-none hover:text-foreground transition-colors",
                    sortField === "date" && "text-foreground"
                  )}
                  onClick={() => toggleSort("date")}
                >
                  Date
                  {sortField === "date" && <SortArrow className="size-3 ml-1 inline" />}
                </TableHead>
                <TableHead
                  className={cn(
                    "cursor-pointer select-none hover:text-foreground transition-colors",
                    sortField === "type" && "text-foreground"
                  )}
                  onClick={() => toggleSort("type")}
                >
                  Type
                  {sortField === "type" && <SortArrow className="size-3 ml-1 inline" />}
                </TableHead>
                <TableHead>Description</TableHead>
                <TableHead
                  className={cn(
                    "text-right cursor-pointer select-none hover:text-foreground transition-colors",
                    sortField === "amount" && "text-foreground"
                  )}
                  onClick={() => toggleSort("amount")}
                >
                  Amount
                  {sortField === "amount" && <SortArrow className="size-3 ml-1 inline" />}
                </TableHead>
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
                      variant={
                        entry.type === "CREDIT" ? "outline" : "secondary"
                      }
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
      )}
    </div>
  );
}
