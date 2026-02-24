import type {
  AsoRecord,
  TipoTreinamento,
  TreinamentoRecord,
} from "@/types/dashboard";

function isoDaysFromToday(days: number) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

export const mockTiposTreinamento: TipoTreinamento[] = [
  { id: "tt1", nr: "NR-35", nome: "Trabalho em Altura" },
  { id: "tt2", nr: "NR-10", nome: "Segurança em Instalações Elétricas" },
  { id: "tt3", nr: "NR-33", nome: "Espaço Confinado" },
];

export const mockAsos: AsoRecord[] = Array.from({ length: 23 }).map((_, i) => {
  const bucket = i % 4;
  const validade =
    bucket === 0
      ? isoDaysFromToday(90)
      : bucket === 1
        ? isoDaysFromToday(15)
        : bucket === 2
          ? isoDaysFromToday(-10)
          : null;

  const dataAso = validade ? isoDaysFromToday(-300) : null;

  return {
    id: `aso-${i + 1}`,
    colaborador_nome: `Colaborador ${i + 1}`,
    setor: ["Operação", "Manutenção", "ADM", "SMS"][i % 4],
    cargo: ["Auxiliar", "Técnico", "Operador", "Supervisor"][i % 4],
    data_aso: dataAso,
    validade_aso: validade,
  };
});

export const mockTreinamentos: TreinamentoRecord[] = Array.from({
  length: 47,
}).map((_, i) => {
  const bucket = i % 5;
  const validade =
    bucket === 0
      ? isoDaysFromToday(120)
      : bucket === 1
        ? isoDaysFromToday(10)
        : bucket === 2
          ? isoDaysFromToday(-20)
          : bucket === 3
            ? null
            : isoDaysFromToday(45);

  const tipoId = ["tt1", "tt2", "tt3"][i % 3];

  return {
    id: `tr-${i + 1}`,
    colaborador_nome: `Colaborador ${(i % 23) + 1}`,
    tipoTreinamento: tipoId,
    data_treinamento: isoDaysFromToday(-400 + i * 3),
    validade,
    nr: null,
  };
});
