# Dashboard Inteligente - Documentação

## 📋 Resumo

Implementação de um painel gerencial inteligente no Dashboard que fornece:

- Indicadores de status em tempo real (ASOs/Treinamentos vencidos, vencendo, pendências)
- Lista unificada de pendências (mistura ASOs e Treinamentos)
- Filtros interativos por clique em cards
- Integração transparente com estrutura existente

## 🏗️ Arquitetura

### 1. **Helper Functions** (`src/lib/dashboard-analytics.ts`)

Arquivo central com toda a lógica de análise:

```typescript
// Tipos principais
type PendingItem // Item unificado (ASO ou Treinamento)
type DashboardIndicators // Métrica agregadas
type PendingFilterType // Filtros: "todos" | "vencidos" | "vencendo" | "pendencias"

// Funções principais
- createUnifiedPendingsList(asos, treinamentos) // Cria lista unificada
- calculateIndicators(asos, treinamentos) // Calcula métricas
- filterPendingItems(items, filterType) // Filtra por tipo
- getStatusColor(status) // Retorna cores por status
```

**Lógica de Priorização:**

1. Itens são convertidos para `PendingItem` comum
2. Ordenados por:
   - Status (Vencido → Prestes a vencer → Pendente → Em dia → Sem vencimento)
   - Data de validade (mais próxima primeiro)

### 2. **Componentes UI**

#### a) `IndicatorCard.tsx`

Card visual com:

- Ícone colorido
- Rótulo e valor
- Estados: padrão ou clicável
- 4 esquemas de cor (red, amber, emerald, blue)

```tsx
<IndicatorCard
  label="ASOs Vencidos"
  value={5}
  icon={<AlertTriangle />}
  color="red"
  onClick={() => setFilterType("vencidos")}
  isClickable
/>
```

#### b) `PendingList.tsx`

Tabela com:

- Filtros por tipo (botões)
- Status com ícone
- Colaborador
- Tipo (ASO ou Treinamento)
- Descrição
- Validade
- Estado vazio amigável

#### c) `DashboardPanel.tsx`

Componente principal que:

- Recebe dados brutos (ASOs e Treinamentos)
- Calcula indicadores via `useMemo`
- Cria lista unificada via `useMemo`
- Filtra lista baseado em estado local
- Renderiza indicadores + lista

### 3. **Integração**

#### a) `TabNavigation.tsx` - ATUALIZADO

Adicionada nova aba:

```tsx
type TabKey = "dashboard" | "asos" | "treinamentos";
```

Nova TabTrigger com ícone BarChart3

#### b) `page.tsx` (DashboardPage) - ATUALIZADO

```tsx
const [activeTab, setActiveTab] = useState<"dashboard" | "asos" | "treinamentos">("dashboard")

// Renderização:
{activeTab === "dashboard" && <DashboardPanel {...} />}
{activeTab === "asos" && <ASOPanel {...} />}
{activeTab === "treinamentos" && <TreinamentoPanel {...} />}
```

## 🎯 Fluxo de Dados

```
DashboardPage
  ↓
  useQuery([asos, treinamentos, tiposTreinamento])
  ↓
  DashboardPanel
    ↓
    useMemo → calculateIndicators()
    ↓
    useMemo → createUnifiedPendingsList()
    ↓
    useMemo → filterPendingItems()
    ↓
    Renderiza: [IndicatorCard] + [PendingList]
```

## 📊 Lógica dos Indicadores

### 1. ASOs Vencidos

```typescript
asos.filter((a) => getAsoStatus(a.validade_aso, a.data_aso) === "Vencido")
  .length;
```

### 2. Treinamentos Vencidos

```typescript
treinamentos.filter((t) => getTrainingStatus(t.validade) === "Vencido").length;
```

### 3. Vencendo Próximos 30 Dias

```typescript
(ASOs com "Prestes a vencer") + (Treinamentos com "Prestes a vencer")
```

### 4. Colaboradores com Pendências

```typescript
Set único de IDs com status "Pendente" em ASOs ou Treinamentos
```

## 🔄 Filtros Interativos

Clique em qualquer card dispara:

```tsx
onClick={() => setFilterType("vencidos")}
```

Que filtra a lista de pendências:

```tsx
filterPendingItems(unifiedPendingsList, "vencidos");
```

### Tipos de Filtro:

- **"todos"** - Mostra todos os itens
- **"vencidos"** - Apenas status "Vencido"
- **"vencendo"** - Apenas status "Prestes a vencer"
- **"pendencias"** - Apenas status "Pendente"

## 🎨 Esquema de Cores

Cada status tem:

- `bg` - Background color
- `text` - Text color
- `border` - Border color

Exemplo:

```typescript
{
  "Vencido": {
    bg: "bg-rose-50",
    text: "text-rose-700",
    border: "border-rose-200"
  }
  // ...
}
```

## 📈 Otimizações

### useMemo

Três hooks useMemo para evitar recálculos:

```tsx
const indicators = useMemo(
  () => calculateIndicators(asos, treinamentos),
  [asos, treinamentos],
);

const unifiedPendingsList = useMemo(
  () => createUnifiedPendingsList(asos, treinamentos),
  [asos, treinamentos],
);

const filteredPendingsList = useMemo(
  () => filterPendingItems(unifiedPendingsList, filterType),
  [unifiedPendingsList, filterType],
);
```

## 🔗 Estrutura de Dados

### PendingItem

```typescript
type PendingItem = {
  id: string; // ID único
  type: "aso" | "treinamento"; // Tipo
  colaborador: string; // Nome do colaborador
  descricao: string; // Descrição (tipo ASO ou Treinamento)
  validade: string | null; // Data de validade (ISO)
  status: ValidityStatus; // Status calculado
  dataRegistro?: string | null; // Data do registro
  originalData: AsoRecord | TreinamentoRecord; // Dados originais
};
```

### DashboardIndicators

```typescript
type DashboardIndicators = {
  asoVencidos: number; // Total de ASOs vencidos
  treinamentosVencidos: number; // Total de Treinamentos vencidos
  vencendoProximos30Dias: number; // Total vencendo nos próximos 30 dias
  colaboradoresComPendencias: number; // Total de colaboradores únicos com pendências
};
```

## 🚀 Próximos Passos Sugeridos

1. **Exportar Dados**
   - Adicionar botão para exportar lista de pendências como CSV/PDF

2. **Gráficos**
   - Integrar gráficos (pizza, barras) com dados dos indicadores
   - Chart.js ou Recharts

3. **Notificações**
   - Toast quando algum item fica vencido
   - Email semanal com resumo de pendências

4. **Filtros Avançados**
   - Filtro por setor/cargo
   - Filtro por tipo de ASO/Treinamento
   - Filtro por data range

5. **Drill-Down**
   - Clicar em um item da lista para ver detalhes
   - Modal/página com informações completas

## 📝 Notas de Implementação

- ✅ Sem alterações na API
- ✅ Dados originais preservados em `originalData`
- ✅ Compatível com estrutura existente
- ✅ UI consistente com sistema de design
- ✅ Performance otimizada com useMemo
- ✅ Responsivo (grid 1→2→4 colunas)
- ✅ Acessível (ícones, cores, contraste)
