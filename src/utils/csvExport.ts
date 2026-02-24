type ColumnDef = { header: string; accessor: string };

function escapeCSV(value: unknown): string {
  const s = String(value ?? "");
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export function exportToCSV<T extends Record<string, any>>(
  rows: T[],
  filenameBase: string,
  columns: ColumnDef[],
) {
  const headers = columns.map((c) => escapeCSV(c.header)).join(",");
  const lines = rows.map((row) =>
    columns.map((c) => escapeCSV(row[c.accessor])).join(","),
  );

  const csv = [headers, ...lines].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });

  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;

  const date = new Date().toISOString().slice(0, 10);
  a.download = `${filenameBase}_${date}.csv`;

  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);

  URL.revokeObjectURL(url);
}
