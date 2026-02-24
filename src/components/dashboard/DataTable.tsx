"use client";

import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import React from "react";

type ColumnDef<T> = {
  header: string;
  accessor: keyof T;
  render?: (row: T) => React.ReactNode;
};

type DataTableProps<T extends { id?: string }> = {
  columns: ColumnDef<T>[];
  data: T[];
  isLoading?: boolean;
  emptyMessage?: string;
};

const statusStyles: Record<string, string> = {
  "Em dia": "bg-emerald-100 text-emerald-700 border-emerald-200",
  "Prestes a vencer": "bg-amber-100 text-amber-700 border-amber-200",
  Vencido: "bg-rose-100 text-rose-700 border-rose-200",
  Pendente: "bg-slate-100 text-slate-700 border-slate-200",
  "Sem vencimento": "bg-blue-100 text-blue-700 border-blue-200",
};

export default function DataTable<T extends { id?: string }>({
  columns,
  data,
  isLoading = false,
  emptyMessage = "Nenhum registro encontrado",
}: DataTableProps<T>) {
  if (isLoading) {
    return (
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50">
              {columns.map((column, i) => (
                <TableHead key={i} className="font-semibold text-slate-600">
                  {column.header}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>

          <TableBody>
            {[...Array(5)].map((_, i) => (
              <TableRow key={i}>
                {columns.map((_, j) => (
                  <TableCell key={j}>
                    <Skeleton className="h-4 w-full" />
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow className="bg-slate-50 hover:bg-slate-50">
            {columns.map((column, i) => (
              <TableHead
                key={i}
                className="font-semibold text-slate-600 whitespace-nowrap"
              >
                {column.header}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>

        <TableBody>
          {data.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={columns.length}
                className="text-center py-12 text-slate-500"
              >
                {emptyMessage}
              </TableCell>
            </TableRow>
          ) : (
            data.map((row, i) => (
              <TableRow
                key={row.id ?? i}
                className="hover:bg-slate-50 transition-colors"
              >
                {columns.map((column, j) => {
                  const value = row[column.accessor];

                  return (
                    <TableCell key={j} className="whitespace-nowrap">
                      {column.accessor === "status" ? (
                        <Badge
                          variant="outline"
                          className={cn(
                            "font-medium",
                            statusStyles[String(value)] ?? "",
                          )}
                        >
                          {String(value)}
                        </Badge>
                      ) : column.render ? (
                        column.render(row)
                      ) : (
                        String(value ?? "")
                      )}
                    </TableCell>
                  );
                })}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
