import type {
  AsoRecord,
  TipoTreinamento,
  TreinamentoRecord,
} from "@/types/dashboard";

type JsonRequestInit = Omit<RequestInit, "body"> & {
  json?: unknown;
};

async function requestJSON<T>(
  url: string,
  options?: JsonRequestInit,
): Promise<T> {
  const res = await fetch(url, {
    cache: "no-store",
    headers: {
      "Content-Type": "application/json",
      ...(options?.headers || {}),
    },
    ...options,
    body:
      options?.json !== undefined ? JSON.stringify(options.json) : undefined,
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(errorText || `Failed request: ${url}`);
  }

  return res.json();
}

export const api = {
  asos: {
    list: () => requestJSON<AsoRecord[]>("/api/asos"),
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
