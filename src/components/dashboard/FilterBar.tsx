"use client";

import { Search, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export type FilterOption = { value: string; label: string };

export type FilterDef = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  options: FilterOption[];
};

type FilterBarProps = {
  searchValue: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;
  filters?: FilterDef[];
  onClearFilters?: () => void;
};

export default function FilterBar({
  searchValue,
  onSearchChange,
  searchPlaceholder = "Buscar por nome...",
  filters = [],
  onClearFilters,
}: FilterBarProps) {
  const hasActiveFilters =
    !!searchValue || filters.some((f) => f.value && f.value !== "todos");

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 mb-6">
      <div className="flex flex-col lg:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder={searchPlaceholder}
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10 bg-slate-50 border-slate-200 focus:bg-white transition-colors"
          />
        </div>

        <div className="flex flex-wrap gap-3">
          {filters.map((filter, index) => (
            <Select
              key={index}
              value={filter.value}
              onValueChange={filter.onChange}
            >
              <SelectTrigger className="w-45 bg-slate-50 border-slate-200">
                <SelectValue placeholder={filter.placeholder} />
              </SelectTrigger>

              <SelectContent>
                {filter.options.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ))}

          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onClearFilters}
              className="text-slate-500 hover:text-slate-700"
              aria-label="Limpar filtros"
              title="Limpar filtros"
              disabled={!onClearFilters}
            >
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
