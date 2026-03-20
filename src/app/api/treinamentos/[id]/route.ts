import { prisma } from "@/lib/db";
import { NR, Prisma } from "@prisma/client";
import { NextResponse } from "next/server";

type Ctx = { params: Promise<{ id: string }> };

function parseDateOrNull(value: unknown): Date | null {
  if (value === null || value === undefined || value === "") return null;
  const d = new Date(String(value));
  return Number.isNaN(d.getTime()) ? null : d;
}

function parseNR(value: unknown): NR | null {
  if (!value) return null;
  const s = String(value).trim(); // "NR-35"
  const key = s.replace("-", "_") as keyof typeof NR; // "NR_35"
  return NR[key] ?? null;
}

// PATCH
export async function PATCH(req: Request, { params }: Ctx) {
  try {
    const { id } = await params;
    if (!id) return NextResponse.json({ error: "id ausente" }, { status: 400 });

    const body = await req.json();

    const data: Prisma.TreinamentoUncheckedUpdateInput = {};

    if (body.data_treinamento !== undefined) {
      const d = parseDateOrNull(body.data_treinamento);
      if (!d)
        return NextResponse.json(
          { error: "data_treinamento inválida" },
          { status: 400 },
        );
      data.data_treinamento = d;
    }

    if (body.validade !== undefined) {
      data.validade = parseDateOrNull(body.validade);
    }

    if (body.carga_horaria !== undefined) {
      data.carga_horaria =
        body.carga_horaria === null || body.carga_horaria === ""
          ? null
          : Math.trunc(Number(body.carga_horaria));

      if (data.carga_horaria !== null && Number.isNaN(data.carga_horaria)) {
        return NextResponse.json(
          { error: "carga_horaria inválida" },
          { status: 400 },
        );
      }
    }

    // ✅ agora atualiza tipoTreinamento
    if (body.tipoTreinamento !== undefined) {
      const tipoTreinamento = body.tipoTreinamento
        ? String(body.tipoTreinamento)
        : null;

      data.tipoTreinamento = tipoTreinamento;

      if (tipoTreinamento) {
        const tipo = await prisma.tipoTreinamento.findUnique({
          where: { id: tipoTreinamento },
        });

        if (!tipo) {
          return NextResponse.json(
            { error: "tipoTreinamento inválido" },
            { status: 400 },
          );
        }

        // ✅ recalcula NR baseado no tipo.nr (ex: "NR-35")
        data.nr = parseNR(tipo.nr);

        // ✅ se não veio validade no PATCH e o tipo tiver validadeMeses,
        //    calcula a validade com base na data_treinamento (nova ou atual)
        const current = await prisma.treinamento.findUnique({ where: { id } });
        const baseDateValue =
          (typeof data.data_treinamento === "object" &&
          data.data_treinamento instanceof Date
            ? data.data_treinamento
            : null) ??
          current?.data_treinamento ??
          null;

        if (
          body.validade === undefined && // só calcula se usuário não mandou validade
          !data.validade &&
          baseDateValue &&
          tipo.validadeMeses &&
          tipo.validadeMeses > 0
        ) {
          const d = new Date(baseDateValue);
          d.setMonth(d.getMonth() + tipo.validadeMeses);
          data.validade = d;
        }
      } else {
        data.nr = null;
      }
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json(
        { error: "Nada para atualizar" },
        { status: 400 },
      );
    }

    const updated = await prisma.treinamento.update({
      where: { id },
      data,
    });

    return NextResponse.json(updated);
  } catch (err: unknown) {
    console.error("PATCH /api/treinamentos/[id] ->", err);
    return NextResponse.json(
      {
        error: "Erro interno",
        detail: err instanceof Error ? err.message : String(err),
      },
      { status: 500 },
    );
  }
}

// DELETE
export async function DELETE(_req: Request, { params }: Ctx) {
  try {
    const { id } = await params;
    if (!id) return NextResponse.json({ error: "id ausente" }, { status: 400 });

    await prisma.treinamento.delete({ where: { id } });

    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    console.error("DELETE /api/treinamentos/[id] ->", err);
    return NextResponse.json(
      {
        error: "Erro interno",
        detail: err instanceof Error ? err.message : String(err),
      },
      { status: 500 },
    );
  }
}
