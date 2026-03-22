# Exemplos de Uso - Sistema de Score de Risco

## 1. Uso Básico no GeneralPendencies

```tsx
import { calculateRiskScore } from "@/lib/risk-score";
import RiskScoreBadge from "@/components/dashboard/RiskScoreBadge";

// Dentro do componente
const riskScore = calculateRiskScore(group.items);

// Renderizar
<RiskScoreBadge riskScore={riskScore} size="md" showLabel={true} />;
```

## 2. Com Detalhamento (Tooltip)

```tsx
// Com tooltip habilitado (padrão)
<RiskScoreBadge riskScore={riskScore} size="md" showTooltip={true} />

// Clique para ver detalhamento
// Mostra breakdown de deduções e insights
```

## 3. Diferentes Tamanhos

```tsx
// Pequeno (35px altura)
<RiskScoreBadge riskScore={riskScore} size="sm" />

// Médio (44px altura) - DEFAULT
<RiskScoreBadge riskScore={riskScore} size="md" />

// Grande (52px altura)
<RiskScoreBadge riskScore={riskScore} size="lg" />
```

## 4. Sem Label

```tsx
// Mostra apenas score e ícone
<RiskScoreBadge riskScore={riskScore} showLabel={false} />
```

## 5. Usando RiskScoreDetail Diretamente

```tsx
import RiskScoreDetail from "@/components/dashboard/RiskScoreDetail";

// Para exibir detalhamento manual
<RiskScoreDetail riskScore={riskScore} />;

// Útil para modal, sidebar ou drawer
```

## 6. Cálculo Customizado

```tsx
import { calculateRiskScore, getRiskLevelColors } from "@/lib/risk-score";

const items = [
  // Seus UnifiedPendingItem
];

const score = calculateRiskScore(items);
const colors = getRiskLevelColors(score.level);

// Score: 45 → Alto (laranja)
// Colors: { bg: "bg-orange-50", text: "text-orange-700", ... }
```

## 7. Em useMemo para Performance

```tsx
// Recalcula apenas quando items mudam
const groupsWithScores = useMemo(
  () =>
    filteredGroups.map((group) => ({
      ...group,
      riskScore: calculateRiskScore(group.items),
    })),
  [filteredGroups],
);
```

## 8. Cenários de Teste

### Caso 1: Sem Pendências

```typescript
items = []
Score esperado: 100 → Controlado (verde) ✅
```

### Caso 2: 1 Vencido

```typescript
items = [{ status: "Vencido", ... }]
Score: 100 - 30 = 70 → Atenção (amarelo) ✅
```

### Caso 3: 2 Vencidos, 1 Prestes a Vencer

```typescript
items = [
  { status: "Vencido", ... },
  { status: "Vencido", ... },
  { status: "Prestes a vencer", ... }
]
Score: 100 - 30 - 30 - 10 = 30 → Alto (laranja) ✅
```

### Caso 4: Crítico (Múltiplas Pendências)

```typescript
items = [
  { status: "Vencido", validade: "2025-01-01" }, // -30
  { status: "Vencido", validade: "2025-01-01" }, // -30 (>30 dias: -10)
  { status: "Vencido", validade: "2025-12-01" }, // -30 (>30 dias: -10)
  { status: "Prestes a vencer", ... },            // -10
  { status: "Prestes a vencer", ... },            // -10
  { status: "Pendente", ... }                     // -15
]
Score: 100 - 30 - 40 - 30 - 10 - 10 - 10 - 15 = -45 → 0 (mínimo)
Nível: Crítico (vermelho) ⚠️
```

## 9. Integração com Análise de Dados

```tsx
// Para extrair estatísticas
function analyzeRiskScores(groups: PendingsByColaborador[]) {
  const scores = groups.map((g) => calculateRiskScore(g.items));

  return {
    average: scores.reduce((a, s) => a + s.score, 0) / scores.length,
    critical: scores.filter((s) => s.level === "Crítico").length,
    high: scores.filter((s) => s.level === "Alto").length,
    attention: scores.filter((s) => s.level === "Atenção").length,
    controlled: scores.filter((s) => s.level === "Controlado").length,
  };
}
```

## 10. Futura Integração: Comparação com Período Anterior

```tsx
// Placeholder para comparação histórica
interface RiskScoreHistory {
  date: Date;
  score: number;
  level: RiskLevel;
  trending: "improved" | "stable" | "degraded";
}

// Exemplo de visualização futura:
// João: 45 → 38 (↓ Melhorando)
// Maria: 20 → 25 (↑ Piorando)
```

## 11. API Completa

### Tipos Exportados

```typescript
// src/lib/risk-score.ts
export type RiskLevel = "Crítico" | "Alto" | "Atenção" | "Controlado";

export type RiskScore = {
  score: number; // 0-100
  level: RiskLevel; // Classificação
  breakdown: {
    initial: number; // 100
    expiredDeduction: number; // -30 per item
    almostExpiredDeduction: number; // -10 per item
    pendingDeduction: number; // -15 per item
    oldExpiredPenalty: number; // -10 per item >30 dias
  };
};
```

### Funções Exportadas

```typescript
calculateRiskScore(items: UnifiedPendingItem[]): RiskScore
getRiskLevelColors(level: RiskLevel): ColorConfig
getRiskLevelIcon(level: RiskLevel): string
```

### Componentes Exportados

```typescript
RiskScoreBadge: React.FC<RiskScoreBadgeProps>;
RiskScoreDetail: React.FC<RiskScoreDetailProps>;
```

## 12. Debugging

```tsx
// Para visualizar cálculo detalhado
console.log("Risk Score Breakdown:", riskScore.breakdown);
console.log("Score Level:", riskScore.level);
console.log("Final Score:", riskScore.score);

// Verificar que score está limitado
console.assert(riskScore.score >= 0 && riskScore.score <= 100);
```

## Próximos Passos

1. **Hover Behavior** - Tooltip aparece ao passar mouse (já implementado)
2. **Histórico** - Rastrear mudanças de score
3. **Alertas** - Notificar quando score muda de nível
4. **Exportação** - Incluir score em relatórios
5. **Customização** - Admin configurar pesos
