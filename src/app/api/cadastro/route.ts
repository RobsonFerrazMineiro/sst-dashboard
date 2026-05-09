import { AUDIT_ACTIONS } from "@/constants/audit-actions";
import { createAuditLog, extractRequestMeta } from "@/lib/audit";
import { hashPassword } from "@/lib/auth";
import {
  bootstrapEmpresaRBAC,
  formatCNPJ,
  generateSlug,
  isValidCNPJ,
} from "@/lib/bootstrap-empresa";
import { prisma } from "@/lib/db";
import { PlanoEmpresa, StatusEmpresa, StatusUsuario, TipoCadastro } from "@prisma/client";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { ip, userAgent } = extractRequestMeta(req);
  const body = await req.json().catch(() => ({}));

  const tipo: string = body?.tipo ?? "";

  if (tipo !== "PESSOAL" && tipo !== "EMPRESA") {
    return NextResponse.json(
      { error: "Tipo inválido. Use PESSOAL ou EMPRESA." },
      { status: 400 },
    );
  }

  // ── Campos comuns ────────────────────────────────────────────────────────
  const email     = String(body?.email     ?? "").trim().toLowerCase();
  const senha     = String(body?.senha     ?? "");
  const nomeAdmin = String(body?.nome      ?? "").trim();

  if (!email || !nomeAdmin) {
    return NextResponse.json({ error: "Nome e e-mail são obrigatórios" }, { status: 400 });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "E-mail inválido" }, { status: 400 });
  }
  if (senha.length < 8) {
    return NextResponse.json(
      { error: "A senha deve ter pelo menos 8 caracteres" },
      { status: 400 },
    );
  }

  // ── Campos de empresa ────────────────────────────────────────────────────
  let nomeEmpresa     = "";
  let nomeFantasia: string | null = null;
  let cnpjFormatado: string | null = null;
  let nomeResponsavel: string | null = null;

  if (tipo === "EMPRESA") {
    const razaoSocial = String(body?.razaoSocial  ?? "").trim();
    nomeFantasia      = body?.nomeFantasia ? String(body.nomeFantasia).trim() : null;
    const cnpjRaw     = String(body?.cnpj         ?? "").trim();
    nomeResponsavel   = body?.nomeResponsavel ? String(body.nomeResponsavel).trim() : null;

    if (!razaoSocial) {
      return NextResponse.json({ error: "Razão social é obrigatória" }, { status: 400 });
    }
    if (!cnpjRaw) {
      return NextResponse.json({ error: "CNPJ é obrigatório" }, { status: 400 });
    }
    if (!isValidCNPJ(cnpjRaw)) {
      return NextResponse.json({ error: "CNPJ inválido" }, { status: 400 });
    }

    cnpjFormatado = formatCNPJ(cnpjRaw);
    nomeEmpresa   = razaoSocial;

    // CNPJ único global
    const cnpjExistente = await prisma.empresa.findUnique({ where: { cnpj: cnpjFormatado } });
    if (cnpjExistente) {
      return NextResponse.json(
        { error: "Já existe uma conta cadastrada com este CNPJ" },
        { status: 409 },
      );
    }
  } else {
    // PESSOAL — empresa nasce como "Workspace de {nome}"
    nomeEmpresa   = `Workspace de ${nomeAdmin}`;
    nomeResponsavel = nomeAdmin;
  }

  // ── Slug único ───────────────────────────────────────────────────────────
  let slug = generateSlug(nomeFantasia ?? nomeEmpresa);
  // Garante unicidade (colisão improvável mas possível)
  const slugExistente = await prisma.empresa.findUnique({ where: { slug } });
  if (slugExistente) slug = generateSlug(nomeFantasia ?? nomeEmpresa);

  // ── Transação: cria tudo atomicamente ────────────────────────────────────
  const novaEmpresa = await prisma.$transaction(async (tx) => {
    const empresa = await tx.empresa.create({
      data: {
        nome:           nomeEmpresa,
        slug,
        cnpj:           cnpjFormatado,
        status:         StatusEmpresa.ATIVA,
        plano:          PlanoEmpresa.LITE,
        tipoCadastro:   tipo === "PESSOAL" ? TipoCadastro.PESSOAL : TipoCadastro.EMPRESA,
        nomeFantasia:   nomeFantasia,
        nomeResponsavel: nomeResponsavel,
      },
    });

    // Bootstrap RBAC (permissoes globais + papeis da empresa)
    const { papelAdminId } = await bootstrapEmpresaRBAC(tx, empresa.id);

    // Cria usuário administrador principal
    const admin = await tx.usuario.create({
      data: {
        empresaId:      empresa.id,
        nome:           nomeAdmin,
        login:          email,
        email:          email,
        senhaHash:      await hashPassword(senha),
        isAccountOwner: true,
        status:         StatusUsuario.ATIVO,
      },
    });

    // Vincula ao papel ADMIN
    await tx.usuarioPapel.create({
      data: { usuarioId: admin.id, papelId: papelAdminId },
    });

    return { empresa, adminId: admin.id };
  });

  void createAuditLog({
    empresaId:  novaEmpresa.empresa.id,
    usuarioId:  novaEmpresa.adminId,
    acao:       AUDIT_ACTIONS.EMPRESA_CRIADA,
    entidade:   "empresa",
    entidadeId: novaEmpresa.empresa.id,
    descricao:  `Novo workspace criado: ${nomeEmpresa} (tipo: ${tipo})`,
    ip,
    userAgent,
  });

  return NextResponse.json({ ok: true }, { status: 201 });
}
