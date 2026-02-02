"use client";

import { SearchIcon, XIcon, ArrowUpDownIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { CATEGORIES } from "@/lib/constants";

const SORT_OPTIONS = [
  { value: "newest", label: "Newest first" },
  { value: "oldest", label: "Oldest first" },
  { value: "amount-desc", label: "Amount: high → low" },
  { value: "amount-asc", label: "Amount: low → high" },
  { value: "urgency", label: "Urgency: critical first" },
  { value: "beneficiary", label: "Beneficiary: A → Z" },
] as const;

export type SortOption = (typeof SORT_OPTIONS)[number]["value"];

interface RequestQueueFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  beneficiaryFilter: string;
  onBeneficiaryFilterChange: (value: string) => void;
  categoryFilter: string;
  onCategoryFilterChange: (value: string) => void;
  policyFilter: string;
  onPolicyFilterChange: (value: string) => void;
  sortBy: SortOption;
  onSortChange: (value: SortOption) => void;
  beneficiaries: string[];
  hasActiveFilters: boolean;
  onClearFilters: () => void;
}

export function RequestQueueFilters({
  search,
  onSearchChange,
  beneficiaryFilter,
  onBeneficiaryFilterChange,
  categoryFilter,
  onCategoryFilterChange,
  policyFilter,
  onPolicyFilterChange,
  sortBy,
  onSortChange,
  beneficiaries,
  hasActiveFilters,
  onClearFilters,
}: RequestQueueFiltersProps) {
  return (
    <div className="flex items-center gap-2 mt-3 flex-wrap">
      <div className="relative flex-1 min-w-[200px] max-w-xs">
        <SearchIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
        <Input
          placeholder="Search requests..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-8 h-8 text-sm"
        />
      </div>

      <Select
        value={beneficiaryFilter}
        onValueChange={onBeneficiaryFilterChange}
      >
        <SelectTrigger className="h-8 w-auto min-w-[130px] text-sm">
          <SelectValue placeholder="Beneficiary" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All beneficiaries</SelectItem>
          {beneficiaries.map((b) => (
            <SelectItem key={b} value={b}>
              {b}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={categoryFilter} onValueChange={onCategoryFilterChange}>
        <SelectTrigger className="h-8 w-auto min-w-[120px] text-sm">
          <SelectValue placeholder="Category" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All categories</SelectItem>
          {CATEGORIES.map((c) => (
            <SelectItem key={c} value={c}>
              {c}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={policyFilter} onValueChange={onPolicyFilterChange}>
        <SelectTrigger className="h-8 w-auto min-w-[110px] text-sm">
          <SelectValue placeholder="Policy" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All statuses</SelectItem>
          <SelectItem value="compliant">Compliant</SelectItem>
          <SelectItem value="warning">Warning</SelectItem>
          <SelectItem value="blocked">Blocked</SelectItem>
        </SelectContent>
      </Select>

      {hasActiveFilters && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onClearFilters}
          className="h-8 text-xs text-muted-foreground"
        >
          <XIcon className="size-3" />
          Clear
        </Button>
      )}

      <div className="ml-auto">
        <Select
          value={sortBy}
          onValueChange={(v) => onSortChange(v as SortOption)}
        >
          <SelectTrigger className="h-8 w-auto min-w-[160px] text-sm">
            <ArrowUpDownIcon className="size-3 mr-1.5 text-muted-foreground" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {SORT_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
