import type { AccessRoleOption, EmpresaUser } from "@/types/access";
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
  colaboradores: {
    list: () => requestJSON<Colaborador[]>("/api/colaboradores"),
    get: (id: string) => requestJSON<Colaborador>(`/api/colaboradores/${id}`),

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
    list: (colaboradorId?: string) =>
      requestJSON<TreinamentoRecord[]>(
        colaboradorId
          ? `/api/treinamentos?colaboradorId=${colaboradorId}`
          : "/api/treinamentos",
      ),
    create: (json: Partial<TreinamentoRecord>) =>
      requestJSON<TreinamentoRecord>("/api/treinamentos", {
        method: "POST",
        json,
      }),
    update: (id: string, json: Partial<TreinamentoRecord>) =>
      requestJSON<TreinamentoRecord>(`/api/treinamentos/${id}`, {
        method: "PATCH",
        json,
      }),
    remove: (id: string) =>
      requestJSON<{ ok: boolean }>(`/api/treinamentos/${id}`, {
        method: "DELETE",
      }),
  },

  asos: {
    list: (colaboradorId?: string) =>
      requestJSON<AsoRecord[]>(
        colaboradorId
          ? `/api/asos?colaboradorId=${colaboradorId}`
          : "/api/asos",
      ),
    create: (json: Partial<AsoRecord>) =>
      requestJSON<AsoRecord>("/api/asos", { method: "POST", json }),
    update: (id: string, json: Partial<AsoRecord>) =>
      requestJSON<AsoRecord>(`/api/asos/${id}`, { method: "PATCH", json }),
    remove: (id: string) =>
      requestJSON<{ ok: boolean }>(`/api/asos/${id}`, { method: "DELETE" }),
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

  usuarios: {
    list: () => requestJSON<EmpresaUser[]>("/api/usuarios"),

    listRoles: () => requestJSON<AccessRoleOption[]>("/api/usuarios/papeis"),

    /** Lista papéis disponíveis para criação manual (exclui COLABORADOR). */
    listManualRoles: () =>
      requestJSON<AccessRoleOption[]>("/api/usuarios/papeis?manual=true"),

    /** Colaboradores sem usuário vinculado — aparecem como "Pendente" na tela de Acessos. */
    pendentes: () =>
      requestJSON<import("@/types/access").PendingColaborador[]>(
        "/api/colaboradores/pendentes",
      ),

    create: (json: {
      nome: string;
      login: string;
      email?: string;
      senha: string;
      papelCodigo: string;
    }) =>
      requestJSON<EmpresaUser>("/api/usuarios", {
        method: "POST",
        json,
      }),

    /** Cria usuário vinculado a um Colaborador existente (fluxo "Ativar primeiro acesso"). */
    ativarColaborador: (json: {
      colaboradorId: string;
      nome: string;
      login: string;
      email?: string;
      senha: string;
    }) =>
      requestJSON<EmpresaUser>("/api/usuarios", {
        method: "POST",
        json: { ...json, papelCodigo: "COLABORADOR" },
      }),

    update: (
      id: string,
      json: {
        nome?: string;
        login?: string;
        email?: string;
        status?: "ATIVO" | "INATIVO";
        papelCodigo?: string;
      },
    ) =>
      requestJSON<EmpresaUser>(`/api/usuarios/${id}`, {
        method: "PATCH",
        json,
      }),
  },
};
