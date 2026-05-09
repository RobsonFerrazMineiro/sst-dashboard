/**
 * Bootstrap de RBAC para uma nova empresa.
 *
 * Chamado dentro de uma transação Prisma ao criar um novo workspace.
 * - Faz upsert das Permissoes globais (idempotente)
 * - Cria os Papeis padrão vinculados à empresa
 * - Vincula Papeis ↔ Permissoes
 *
 * Retorna o ID do papel ADMIN criado.
 */

import type { Prisma } from "@prisma/client";

// Permissoes globais do sistema (não pertencem a nenhuma empresa)
export const PERMISSOES_PADRAO = [
  { codigo: "dashboard.visualizar",          nome: "Visualizar dashboard",             modulo: "dashboard"    },
  { codigo: "colaboradores.visualizar",      nome: "Visualizar colaboradores",         modulo: "colaboradores"},
  { codigo: "colaboradores.gerenciar",       nome: "Gerenciar colaboradores",          modulo: "colaboradores"},
  { codigo: "tipos-aso.gerenciar",           nome: "Gerenciar tipos de ASO",           modulo: "tipos-aso"   },
  { codigo: "tipos-treinamento.gerenciar",   nome: "Gerenciar tipos de treinamento",   modulo: "tipos-treinamento"},
  { codigo: "asos.gerenciar",                nome: "Gerenciar ASOs",                   modulo: "asos"        },
  { codigo: "treinamentos.gerenciar",        nome: "Gerenciar treinamentos",           modulo: "treinamentos"},
  { codigo: "colaborador.visualizar-proprio",nome: "Visualizar próprio perfil",        modulo: "perfil"      },
] as const;

// Papeis padrão e suas permissoes
const PAPEIS_PADRAO = [
  {
    codigo: "ADMIN",
    nome: "Administrador",
    descricao: "Acesso completo ao sistema",
    permissoes: PERMISSOES_PADRAO.map((p) => p.codigo),
  },
  {
    codigo: "GESTOR",
    nome: "Gestor",
    descricao: "Consulta colaboradores e dashboard. Sem CRUD operacional.",
    permissoes: [
      "dashboard.visualizar",
      "colaboradores.visualizar",
      "colaborador.visualizar-proprio",
    ],
  },
  {
    codigo: "TECNICO_SST",
    nome: "Técnico SST",
    descricao: "Gerencia colaboradores, ASOs e treinamentos",
    permissoes: [
      "dashboard.visualizar",
      "colaboradores.visualizar",
      "colaboradores.gerenciar",
      "asos.gerenciar",
      "treinamentos.gerenciar",
      "colaborador.visualizar-proprio",
    ],
  },
  {
    codigo: "COLABORADOR",
    nome: "Colaborador",
    descricao: "Acesso restrito ao próprio perfil",
    permissoes: ["colaborador.visualizar-proprio"],
  },
] as const;

type TxClient = Prisma.TransactionClient;

export async function bootstrapEmpresaRBAC(
  tx: TxClient,
  empresaId: string,
): Promise<{ papelAdminId: string }> {
  // 1. Upsert permissoes globais (idempotente — já podem existir de outras empresas)
  for (const p of PERMISSOES_PADRAO) {
    await tx.permissao.upsert({
      where:  { codigo: p.codigo },
      update: {},
      create: { codigo: p.codigo, nome: p.nome, modulo: p.modulo },
    });
  }

  const todasPermissoes = await tx.permissao.findMany({
    select: { id: true, codigo: true },
  });
  const permissaoByCodigo = new Map(todasPermissoes.map((p) => [p.codigo, p.id]));

  // 2. Cria papeis para esta empresa e vincula as permissoes
  let papelAdminId = "";

  for (const papelBase of PAPEIS_PADRAO) {
    const papel = await tx.papel.create({
      data: {
        empresaId,
        nome:     papelBase.nome,
        codigo:   papelBase.codigo,
        descricao:papelBase.descricao,
      },
    });

    if (papelBase.codigo === "ADMIN") papelAdminId = papel.id;

    const vinculosPermissao = papelBase.permissoes
      .map((cod) => permissaoByCodigo.get(cod))
      .filter((id): id is string => id !== undefined)
      .map((permissaoId) => ({ papelId: papel.id, permissaoId }));

    if (vinculosPermissao.length > 0) {
      await tx.papelPermissao.createMany({ data: vinculosPermissao, skipDuplicates: true });
    }
  }

  if (!papelAdminId) throw new Error("Papel ADMIN não foi criado corretamente");

  return { papelAdminId };
}

/** Gera um slug único a partir de um nome. */
export function generateSlug(nome: string): string {
  const base = nome
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")   // remove acentos
    .replace(/[^a-z0-9]+/g, "-")       // não-alfanuméricos → hífen
    .replace(/^-+|-+$/g, "")           // remove hífens nas bordas
    .slice(0, 40);
  const suffix = Math.random().toString(36).slice(2, 7);
  return `${base || "workspace"}-${suffix}`;
}

/** Valida formato de CNPJ (14 dígitos, ignora formatação). */
export function isValidCNPJ(cnpj: string): boolean {
  const digits = cnpj.replace(/\D/g, "");
  if (digits.length !== 14) return false;
  // Rejeita sequências triviais: 00000000000000, 11111111111111, etc.
  if (/^(\d)\1+$/.test(digits)) return false;
  return true;
}

/** Formata CNPJ para armazenamento padronizado: XX.XXX.XXX/XXXX-XX */
export function formatCNPJ(cnpj: string): string {
  const d = cnpj.replace(/\D/g, "");
  return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8, 12)}-${d.slice(12, 14)}`;
}
