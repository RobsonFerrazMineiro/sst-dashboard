import { NR } from "@prisma/client";

export function parseNRInput(value: unknown): NR | null {
  if (!value) return null;

  const normalized = String(value).trim().toUpperCase().replace("-", "_");
  return NR[normalized as keyof typeof NR] ?? null;
}

export function formatNR(value: NR | null | undefined): string | null {
  if (!value) return null;
  return value.replace("_", "-");
}
