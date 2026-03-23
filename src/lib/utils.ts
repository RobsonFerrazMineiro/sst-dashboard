import { clsx, type ClassValue } from "clsx";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format a date string (YYYY-MM-DD) to dd/MM/yyyy
 * Handles both string dates and Date objects safely
 * Uses local timezone to prevent UTC offset issues
 */
export function formatDate(
  date: string | Date | null | undefined,
  fallback: string = "-",
): string {
  if (!date) return fallback;

  try {
    let dateObj: Date | null;

    if (date instanceof Date) {
      dateObj = date;
    } else {
      const dateStr = String(date).trim();
      // Use parseLocalDate to handle timezone correctly (not UTC)
      dateObj = parseLocalDate(dateStr);
    }

    // Validate the date
    if (!dateObj || Number.isNaN(dateObj.getTime())) return fallback;

    return format(dateObj, "dd/MM/yyyy", { locale: ptBR });
  } catch {
    return fallback;
  }
}

/**
 * Parse a date string (YYYY-MM-DD) as local date, not UTC
 * This prevents timezone offset issues when comparing dates
 * Supports: string (YYYY-MM-DD) or Date objects
 * Returns null for invalid inputs
 * Always returns a Date with hours zeroed in local timezone
 */
export function parseLocalDate(
  date: string | Date | null | undefined,
): Date | null {
  if (!date) return null;

  try {
    let dateObj: Date;

    // If already a Date object
    if (date instanceof Date) {
      if (Number.isNaN(date.getTime())) return null;
      dateObj = new Date(date);
    } else {
      // Convert to string
      const dateStr = String(date).trim();

      // Try to parse as YYYY-MM-DD or YYYY-MM-DDTHH:MM:SS
      const match = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})/);
      if (match) {
        const [, year, month, day] = match;
        dateObj = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      } else {
        return null;
      }
    }

    // Ensure hours are zeroed in local timezone
    dateObj.setHours(0, 0, 0, 0);

    // Validate the date
    if (Number.isNaN(dateObj.getTime())) return null;

    return dateObj;
  } catch {
    return null;
  }
}
