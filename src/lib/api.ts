import type {
  AsoRecord,
  Colaborador,
  TipoASO,
  TipoTreinamento,
  TreinamentoRecord,
} from "@/types/dashboard";

type JsonInit = Omit<RequestInit, "body"> & { json?: unknown };

async function requestJSON<T>(url: string, init?: JsonInit): Promise<T> {
  const res = await fetch(url, {
    cache: "no-store",
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
    body: init?.json !== undefined ? JSON.stringify(init.json) : undefined,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(text || `Failed request: ${res.status} ${url}`);
  }

  // DELETE pode devolver vazio em alguns casos
  const ct = res.headers.get("content-type") || "";
  if (!ct.includes("application/json")) return {} as T;

  return res.json();
}

export const api = {
  asos: { list: () => requestJSON<AsoRecord[]>("/api/asos") },

  colaboradores: {
    list: () => requestJSON<Colaborador[]>("/api/colaboradores"),

    create: (json: Partial<Colaborador>) =>
      requestJSON<Colaborador>("/api/colaboradores", { method: "POST", json }),

    update: (id: string, json: Partial<Colaborador>) =>
      requestJSON<Colaborador>(`/api/colaboradores/${id}`, {
        method: "PATCH",
        json,
      }),

    remove: (id: string) =>
      requestJSON<{ ok: boolean }>(`/api/colaboradores/${id}`, {
        method: "DELETE",
      }),
  },

  tiposASO: {
    list: () => requestJSON<TipoASO[]>("/api/tipos-aso"),
    create: (json: Partial<TipoASO>) =>
      requestJSON<TipoASO>("/api/tipos-aso", { method: "POST", json }),
    update: (id: string, json: Partial<TipoASO>) =>
      requestJSON<TipoASO>(`/api/tipos-aso/${id}`, { method: "PATCH", json }),
    remove: (id: string) =>
      requestJSON<{ ok: boolean }>(`/api/tipos-aso/${id}`, {
        method: "DELETE",
      }),
  },

  treinamentos: {
    list: () => requestJSON<TreinamentoRecord[]>("/api/treinamentos"),
  },

  tiposTreinamento: {
    list: () => requestJSON<TipoTreinamento[]>("/api/tipos-treinamento"),

    create: (json: Partial<TipoTreinamento>) =>
      requestJSON<TipoTreinamento>("/api/tipos-treinamento", {
        method: "POST",
        json,
      }),

    update: (id: string, json: Partial<TipoTreinamento>) =>
      requestJSON<TipoTreinamento>(`/api/tipos-treinamento/${id}`, {
        method: "PATCH",
        json,
      }),

    remove: (id: string) =>
      requestJSON<{ ok: boolean }>(`/api/tipos-treinamento/${id}`, {
        method: "DELETE",
      }),
  },
};
