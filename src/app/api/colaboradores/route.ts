import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
  const rows = await prisma.colaborador.findMany({
    orderBy: { nome: "asc" },
  });

  return NextResponse.json(rows);
}
