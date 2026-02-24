"use client";

import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

type PaginationProps = {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
};

export default function Pagination({
  currentPage,
  totalPages,
  onPageChange,
}: PaginationProps) {
  if (totalPages <= 1) return null;

  const pages: number[] = [];
  const maxVisiblePages = 5;

  let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
  const endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

  if (endPage - startPage < maxVisiblePages - 1) {
    startPage = Math.max(1, endPage - maxVisiblePages + 1);
  }

  for (let i = startPage; i <= endPage; i++) pages.push(i);

  const go = (page: number) => {
    const clamped = Math.max(1, Math.min(totalPages, page));
    onPageChange(clamped);
  };

  return (
    <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 bg-slate-50">
      <p className="text-sm text-slate-500">
        Página <span className="font-medium text-slate-700">{currentPage}</span>{" "}
        de <span className="font-medium text-slate-700">{totalPages}</span>
      </p>

      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="icon"
          onClick={() => go(currentPage - 1)}
          disabled={currentPage === 1}
          className="h-8 w-8"
          aria-label="Página anterior"
        >
          <ChevronLeft className="w-4 h-4" />
        </Button>

        {startPage > 1 && (
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => go(1)}
              className="h-8 w-8 p-0"
              aria-label="Ir para página 1"
            >
              1
            </Button>
            {startPage > 2 && <span className="text-slate-400">...</span>}
          </>
        )}

        {pages.map((page) => (
          <Button
            key={page}
            variant={currentPage === page ? "default" : "outline"}
            size="sm"
            onClick={() => go(page)}
            className="h-8 w-8 p-0"
            aria-label={`Ir para página ${page}`}
            aria-current={currentPage === page ? "page" : undefined}
          >
            {page}
          </Button>
        ))}

        {endPage < totalPages && (
          <>
            {endPage < totalPages - 1 && (
              <span className="text-slate-400">...</span>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => go(totalPages)}
              className="h-8 w-8 p-0"
              aria-label={`Ir para última página (${totalPages})`}
            >
              {totalPages}
            </Button>
          </>
        )}

        <Button
          variant="outline"
          size="icon"
          onClick={() => go(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="h-8 w-8"
          aria-label="Próxima página"
        >
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
