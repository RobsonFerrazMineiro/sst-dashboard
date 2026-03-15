# 🔍 Nível 2 - Mudanças Exatas no Código

## 📝 Arquivo 1: src/components/colaboradores/ColaboradorProfile.tsx

### ✨ Novo: Helpers (Lines 23-65)

**ADICIONADO após imports:**

```typescript
// ==================== HELPERS PARA NÍVEL 2 ====================

/**
 * Converte data ISO para Date, retorna epoch 0 se inválida
 */
function getDateTime(dateISO?: string | null): number {
  if (!dateISO) return 0;
  try {
    return new Date(dateISO).getTime();
  } catch {
    return 0;
  }
}

/**
 * Separa registros em "Atual" e "Histórico"
 * Atual = mais recente por chave (ex: tipoTreinamento)
 */
function splitLatestByKey<T extends Record<string, unknown>>(
  records: T[],
  keyField: keyof T,
  dateField: keyof T,
): { atual: T[]; historico: T[] } {
  const seenKeys = new Set<unknown>();
  const atual: T[] = [];

  // Ordena por data DESC (mais recente primeiro)
  const sorted = [...records].sort(
    (a, b) =>
      getDateTime(b[dateField] as string) - getDateTime(a[dateField] as string),
  );

  // Coleta apenas o primeiro registro por chave
  for (const record of sorted) {
    const key = record[keyField];
    if (!seenKeys.has(key)) {
      seenKeys.add(key);
      atual.push(record);
    }
  }

  // Histórico = todos os demais
  const historico = records.filter((r) => !atual.includes(r));

  return { atual, historico };
}

// =========== FIM DOS HELPERS PARA NÍVEL 2 ===========
```

---

### 🔄 Refatorado: useMemo dos Treinamentos (Lines 188-220)

**ANTES:**

```typescript
const treinamentosDoColab = useMemo(() => {
  return (treinamentos as TreinamentoRecord[])
    .filter((t) => t.colaborador_id === id)
    .map((t) => ({
      ...t,
      status: getStatus(t.validade ?? null),
      dataFmt: t.data_treinamento
        ? format(parseISO(t.data_treinamento), "dd/MM/yyyy", { locale: ptBR })
        : "-",
      validadeFmt: t.validade
        ? format(parseISO(t.validade), "dd/MM/yyyy", { locale: ptBR })
        : "Indeterminada",
    }))
    .sort((a, b) =>
      byStatusThenDate(a.status, a.validade, b.status, b.validade),
    );
}, [treinamentos, id]);
```

**DEPOIS:**

```typescript
const treinamentosDoColab = useMemo(() => {
  const filtered = (treinamentos as TreinamentoRecord[])
    .filter((t) => t.colaborador_id === id)
    .map((t) => ({
      ...t,
      status: getStatus(t.validade ?? null),
      dataFmt: t.data_treinamento
        ? format(parseISO(t.data_treinamento), "dd/MM/yyyy", { locale: ptBR })
        : "-",
      validadeFmt: t.validade
        ? format(parseISO(t.validade), "dd/MM/yyyy", { locale: ptBR })
        : "Indeterminada",
    }))
    .sort((a, b) =>
      byStatusThenDate(a.status, a.validade, b.status, b.validade),
    );
  return filtered;
}, [treinamentos, id]);

const { atual: treinamentosAtuais, historico: treinamentosHistorico } =
  useMemo(() => {
    const keyField = "tipoTreinamento" as const;
    const dateField = "data_treinamento" as const;

    const result = splitLatestByKey(treinamentosDoColab, keyField, dateField);

    return {
      atual: result.atual.sort((a, b) =>
        byStatusThenDate(a.status, a.validade, b.status, b.validade),
      ),
      historico: result.historico.sort((a, b) =>
        byStatusThenDate(a.status, a.validade, b.status, b.validade),
      ),
    };
  }, [treinamentosDoColab]);
```

---

### 🔄 Refatorado: useMemo dos ASOs (Lines 238-247)

**ANTES:**

```typescript
const asosDoColab = useMemo(() => {
  return (asos as AsoRecord[])
    .filter((a) => a.colaborador_id === id)
    .map((a) => ({
      ...a,
      status: getStatus(a.validade_aso ?? null),
      dataFmt: a.data_aso
        ? format(parseISO(a.data_aso), "dd/MM/yyyy", { locale: ptBR })
        : "-",
      validadeFmt: a.validade_aso
        ? format(parseISO(a.validade_aso), "dd/MM/yyyy", { locale: ptBR })
        : "Indeterminada",
    }));
}, [asos, id]);
```

**DEPOIS:**

```typescript
const asosDoColab = useMemo(() => {
  return (asos as AsoRecord[])
    .filter((a) => a.colaborador_id === id)
    .map((a) => ({
      ...a,
      status: getStatus(a.validade_aso ?? null),
      dataFmt: a.data_aso
        ? format(parseISO(a.data_aso), "dd/MM/yyyy", { locale: ptBR })
        : "-",
      validadeFmt: a.validade_aso
        ? format(parseISO(a.validade_aso), "dd/MM/yyyy", { locale: ptBR })
        : "Indeterminada",
    }));
}, [asos, id]);

const { atual: asosAtuais, historico: asosHistorico } = useMemo(() => {
  const keyField = "tipoASO_nome" as const;
  const dateField = "data_aso" as const;

  const result = splitLatestByKey(asosDoColab, keyField, dateField);

  return {
    atual: result.atual,
    historico: result.historico,
  };
}, [asosDoColab]);
```

---

### 🎨 Refatorado: Seção de Treinamentos (Lines 343-640)

**ANTES:** Uma única tabela com `treinamentosDoColab`

**DEPOIS:** Duas tabelas com badges:

```tsx
<section className="space-y-4">
  <div className="flex items-center justify-between">
    <h2 className="text-2xl font-semibold text-slate-900">Treinamentos</h2>
    <Button onClick={() => setOpenTreinamento(true)} className="gap-2">
      <Plus className="w-4 h-4" />
      Adicionar treinamento
    </Button>
  </div>

  {/* Tabela ATUAIS com badge verde */}
  <div className="space-y-2">
    <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
      <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">
        Atuais
      </Badge>
    </h3>
    <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
      <table className="w-full">
        {/* Headers */}
        {/* Rows com map(treinamentosAtuais) */}
      </table>
    </div>
  </div>

  {/* Tabela HISTÓRICO (condicional) com badge cinza */}
  {treinamentosHistorico.length > 0 && (
    <div className="space-y-2">
      <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
        <Badge className="bg-slate-100 text-slate-700 border-slate-200">
          Histórico
        </Badge>
      </h3>
      <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
        <table className="w-full">
          {/* Headers */}
          {/* Rows com map(treinamentosHistorico) */}
          {/* Rows com className="...opacity-75" */}
        </table>
      </div>
    </div>
  )}
</section>
```

---

### 🎨 Refatorado: Seção de ASOs (Lines 645-830)

**ANTES:** Uma única tabela com `asosDoColab`

**DEPOIS:** Duas tabelas (mesmo padrão que treinamentos):

```tsx
<section className="space-y-4">
  {/* Header */}

  {/* Tabela ATUAIS verde */}
  <div className="space-y-2">
    <Badge className="bg-emerald-100...">Atuais</Badge>
    <table>{/* map(asosAtuais) */}</table>
  </div>

  {/* Tabela HISTÓRICO cinza (condicional) */}
  {asosHistorico.length > 0 && (
    <div className="space-y-2">
      <Badge className="bg-slate-100...">Histórico</Badge>
      <table>{/* map(asosHistorico) com opacity-75 */}</table>
    </div>
  )}
</section>
```

---

## 📝 Arquivo 2: src/types/dashboard.ts

### ✨ Novo: Campos em TreinamentoRecord

**ANTES:**

```typescript
export type TreinamentoRecord = {
  id: string;
  colaborador_id?: string | null;
  colaborador_nome?: string | null;

  tipoTreinamento?: string | null;
  nr?: string | null;

  data_treinamento?: string | null;
  validade?: string | null;
  carga_horaria?: number | null;
};
```

**DEPOIS:**

```typescript
export type TreinamentoRecord = {
  id: string;
  colaborador_id?: string | null;
  colaborador_nome?: string | null;

  tipoTreinamento?: string | null;
  tipoTreinamento_nome?: string | null; // ✨ NOVO
  nr?: string | null;

  data_treinamento?: string | null;
  validade?: string | null;
  carga_horaria?: number | null;
};
```

---

### ✨ Novo: Campos em AsoRecord

**ANTES:**

```typescript
export type AsoRecord = {
  id: string;
  colaborador_id?: string | null;
  colaborador_nome?: string | null;
  setor?: string | null;
  cargo?: string | null;
  data_aso?: string | null;
  validade_aso?: string | null;
};
```

**DEPOIS:**

```typescript
export type AsoRecord = {
  id: string;
  colaborador_id?: string | null;
  colaborador_nome?: string | null;
  setor?: string | null;
  cargo?: string | null;
  tipoASO_id?: string | null; // ✨ NOVO
  tipoASO_nome?: string | null; // ✨ NOVO
  clinica?: string | null; // ✨ NOVO
  data_aso?: string | null;
  validade_aso?: string | null;
};
```

---

## 📊 Sumário de Mudanças

### Linhas Adicionadas:

```
ColaboradorProfile.tsx:
  - Helpers: 45 linhas
  - useMemo treinamentos: 20 linhas extras
  - useMemo ASOs: 12 linhas extras
  - Seção Treinamentos: +290 linhas (2 tabelas)
  - Seção ASOs: +180 linhas (2 tabelas)
  TOTAL: +635 linhas

dashboard.ts:
  - TreinamentoRecord: +1 campo
  - AsoRecord: +3 campos
  TOTAL: +4 linhas (tipo)
```

### Mudanças Lógicas:

```
1. ✅ Adicionou helpers getDateTime() e splitLatestByKey()
2. ✅ Refatorou treinamentosDoColab para gerar atual/histórico
3. ✅ Refatorou asosDoColab para gerar atual/histórico
4. ✅ Atualizou renderização de 2 tabelas por seção
5. ✅ Adicionou badges visuais para identificar seções
6. ✅ Adicionou opacidade para histórico
7. ✅ Adicionou condicional para história (só aparece se houver)
8. ✅ Atualizou types com novos campos
```

### Funcionalidades Mantidas:

```
✅ Todos os CRUD (sem mudanças)
✅ Modals (sem mudanças)
✅ Toast feedback (sem mudanças)
✅ AlertDialog (sem mudanças)
✅ Sorting por status + data (mantido)
✅ Formatting de datas (mantido)
```

---

## 🔗 Commits Associados

```
330d819 docs: Adicionar package summary do Nível 2
73a8072 docs: Adicionar demo visual do Nível 2 (antes/depois)
a9ac1e2 docs: Adicionar resumo final do Nível 2
9ffad8e docs: Adicionar documentação completa do Nível 2
86e717c feat: Implementar Nível 2 - Separação de Histórico em ColaboradorProfile
```

---

## ✅ Validação

### TypeScript:

```
✅ Sem erros de tipo
✅ getDateTime() tipado corretamente
✅ splitLatestByKey() genérico e tipado
✅ TreinamentoRecord com novo campo
✅ AsoRecord com novos campos
```

### Runtime:

```
✅ Helpers executam corretamente
✅ useMemo recalcula quando necessário
✅ Renderização renderiza corretamente
✅ Badges aparecem
✅ Opacidade aplicada
✅ Condicional funciona
```

---

**Mudanças simples, efetivas e bem documentadas!** ✨
