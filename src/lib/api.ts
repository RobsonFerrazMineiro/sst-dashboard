import type {
  AsoRecord,
  TipoTreinamento,
  TreinamentoRecord,
} from "@/types/dashboard";

async function getJSON<T>(url: string): Promise<T> {
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`Failed to fetch: ${url}`);
  return res.json();
}

export const api = {
  asos: { list: () => getJSON<AsoRecord[]>("/api/asos") },
  treinamentos: {
    list: () => getJSON<TreinamentoRecord[]>("/api/treinamentos"),
  },
  tiposTreinamento: {
    list: () => getJSON<TipoTreinamento[]>("/api/tipos-treinamento"),
  },
};
