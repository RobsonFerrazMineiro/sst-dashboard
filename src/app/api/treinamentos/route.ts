import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
  const rows = await prisma.treinamento.findMany({
    orderBy: { validade: "desc" },
  });

  return NextResponse.json(
    rows.map((t: (typeof rows)[number]) => ({
      id: t.id,
      colaborador_id: t.colaborador_id,
      colaborador_nome: t.colaborador_nome,
      tipoTreinamento: t.tipoTreinamento,
      nr: t.nr ? String(t.nr).replace("_", "-") : null,
      data_treinamento: t.data_treinamento
        ? t.data_treinamento.toISOString()
        : null,
      validade: t.validade ? t.validade.toISOString() : null,
      carga_horaria: t.carga_horaria,
    })),
  );
}
