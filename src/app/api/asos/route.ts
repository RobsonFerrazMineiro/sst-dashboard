import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
  const rows = await prisma.aSO.findMany({
    orderBy: { validade_aso: "desc" },
  });

  // Já está no shape esperado pelo front
  return NextResponse.json(
    rows.map((a: (typeof rows)[number]) => ({
      id: a.id,
      colaborador_id: a.colaborador_id,
      colaborador_nome: a.colaborador_nome,
      setor: a.setor,
      cargo: a.cargo,
      tipoASO_id: a.tipoASO_id,
      tipoASO_nome: a.tipoASO_nome,
      data_aso: a.data_aso ? a.data_aso.toISOString() : null,
      validade_aso: a.validade_aso ? a.validade_aso.toISOString() : null,
      clinica: a.clinica,
      observacao: a.observacao,
    })),
  );
}
