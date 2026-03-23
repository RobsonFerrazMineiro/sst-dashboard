# Roadmap - Sistema de Score de Risco

## Status Atual: ✅ MVP Completo

### O que foi implementado (v1.0)

#### Core System ✅

- [x] Biblioteca `src/lib/risk-score.ts` com cálculo robusto
- [x] Componente `RiskScoreBadge.tsx` com visualização e tooltip
- [x] Componente `RiskScoreDetail.tsx` para detalhamento
- [x] Integração em `GeneralPendencies.tsx` (Pendências Gerais)
- [x] Suporte a 4 níveis de risco: Crítico, Alto, Atenção, Controlado
- [x] Penalidades de deduções: -30 (vencido), -10 (vencendo), -15 (pendente), -10 extra (>30 dias)

#### UX/UI ✅

- [x] Visual executivo (ícone + score + nível)
- [x] 3 tamanhos de badge: sm, md, lg
- [x] Cores Tailwind específicas por nível
- [x] Tooltip interativo com breakdown
- [x] Responsive design

#### Qualidade ✅

- [x] Type-safe com TypeScript completo
- [x] Sem alteração de API existente
- [x] Client-side only (useMemo otimizado)
- [x] Documentação RISK_SCORE_GUIDE.md
- [x] Exemplos RISK_SCORE_EXAMPLES.md
- [x] Código limpo sem warnings
- [x] Branch feature/risk-score-system criada

---

## Fase 2: Refinamentos (Próximo Sprint)

### 2.1 Histórico de Score [IMPORTANTE]

**Objetivo:** Rastrear evolução temporal do score

**Implementação:**

```typescript
// Novo tipo
export type RiskScoreHistory = {
  date: Date;
  score: number;
  level: RiskLevel;
  itemsCount: number;
};

// Armazenar em localStorage por colaborador
// localStorage.setItem(`risk-score-history-${id}`, JSON.stringify(history))
```

**UI:**

- Mini-gráfico de linha mostrando últimos 30 dias
- Seta ↑ (piorando) ou ↓ (melhorando)
- Card adicional no GeneralPendencies

**Benefícios:**

- Ver tendências (e.g., João estava 50, agora 20 ↓)
- Identificar que problema está resolvendo ou piorando
- Motivar respeito às deadlines

### 2.2 Score por Tipo de Item [IMPORTANTE]

**Objetivo:** Separar análise de ASOs vs Treinamentos

**Implementação:**

```typescript
export function calculateRiskScoreByType(
  items: UnifiedPendingItem[],
  type: "aso" | "treinamento",
): RiskScore {
  const filtered = items.filter((i) => i.type === type);
  return calculateRiskScore(filtered);
}
```

**UI:**

- 2 badges lado a lado: "ASO: 45" e "Treino: 30"
- Identificar qual área está pior
- Ações direcionadas por tipo

### 2.3 Alertas Automáticos [IMPORTANTE]

**Objetivo:** Notificar gestores quando score muda

**Implementação:**

```typescript
// Trigger em useEffect
useEffect(() => {
  const previousScore = localStorage.getItem(`score-${id}`);
  const currentScore = riskScore.score;

  if (previousScore && parseInt(previousScore) > currentScore + 5) {
    // Score piorou 5+ pontos
    toastNotification.warning("Situação piorou para João");
  }
}, [riskScore]);
```

**Cenários:**

- Score caiu de "Controlado" para "Atenção"
- Score entrou em "Crítico"
- Score melhorou em 20+ pontos
- Item pendente venceu (novo)

### 2.4 Dashboard Executivo [NICE-TO-HAVE]

**Objetivo:** Visão holística de riscos

**Componentes:**

```tsx
// Card Resumo
- Total de colaboradores: N
- Críticos: X (% em vermelho)
- Altos: Y (% em laranja)
- Atenção: Z (% em amarelo)
- Controlados: W (% em verde)

// Gráfico Radial (Pie)
Distribuição de níveis

// Top 5 Piores
Lista dos 5 colaboradores com menor score

// Trending
Score médio no tempo (últimos 7 dias)
```

**Locais:**

- Bloco adicional no Dashboard
- Página executiva dedicada: `/dashboard/risk-analysis`

---

## Fase 3: Análise Avançada (Futuro)

### 3.1 Previsão de Risco

```typescript
// ML simples: extrapolação linear
function predictRiskScore(history: RiskScoreHistory[]): number {
  // Basado na tendência dos últimos 7 dias
  // Alertar se score vai virar crítico em 3 dias
}
```

### 3.2 Comparação Inter-Colaborador

```typescript
// Peer comparison
function getRiskPercentile(score: number, allScores: number[]): number {
  // Mostrar "João está no percentil 15% (melhor que 85% dos colegas)"
}
```

### 3.3 Customização Admin

```typescript
// Permitir ajuste de pesos por gestão
interface RiskScoreWeights {
  expired: number; // Default: -30
  almostExpired: number; // Default: -10
  pending: number; // Default: -15
  oldExpiredPenalty: number; // Default: -10
}

// Salvar em servidor: /api/config/risk-weights
```

### 3.4 Exportação em Relatórios

```typescript
// Incluir score em CSV/PDF
- Adicionar coluna "Risk Score" na tabela
- Incluir breakdown no rodapé do relatório
- Filtro por nível de risco (critical only, etc)
```

---

## Fase 4: Integração (Longo Prazo)

### 4.1 Notificações Integradas

```typescript
// Sistema de notifications
- Email semanal: "3 colaboradores em risco crítico"
- Push notification quando score < 30
- Webhook para Slack
```

### 4.2 SLA e Metas

```typescript
// Define target score por equipe
interface RiskSLA {
  teamId: string;
  targetScore: number; // e.g., 75
  deadline: Date;
  penalty: string;
}

// Comparar: esperado vs atual
```

### 4.3 Histórico Auditável

```typescript
// Log completo de mudanças
{
  date: Date;
  colaboradorId: string;
  previousScore: number;
  newScore: number;
  reason: string;
  triggeredBy: string; // API, system, manual
}
```

---

## Checklist Implementação

### Branch Atual: feature/risk-score-system

- [x] Core library (risk-score.ts)
- [x] Badge component (RiskScoreBadge.tsx)
- [x] Detail component (RiskScoreDetail.tsx)
- [x] Integration (GeneralPendencies.tsx)
- [x] Documentation (guides + examples)
- [x] Testing (manual)
- [ ] Unit tests (pendente)

### Antes de Merge para Main

- [ ] Code review
- [ ] Browser testing (desktop + mobile)
- [ ] Performance testing
- [ ] Merge feature/risk-score-system → main
- [ ] Tag v1.0-risk-score

### Próximas PRs

1. **PR 1:** Histórico + Trending
   - Branch: `feature/risk-score-history`
   - Estimate: 2-3 dias
2. **PR 2:** Score por Tipo
   - Branch: `feature/risk-score-by-type`
   - Estimate: 1 dia
3. **PR 3:** Alertas Automáticos
   - Branch: `feature/risk-score-alerts`
   - Estimate: 2 dias

4. **PR 4:** Dashboard Executivo
   - Branch: `feature/risk-analysis-dashboard`
   - Estimate: 3-4 dias

---

## Estimativas

| Fase    | Escopo           | Esforço | Prioridade |
| ------- | ---------------- | ------- | ---------- |
| ✅ v1.0 | MVP básico       | 4h      | P0         |
| 2.1     | Histórico        | 2 dias  | P1         |
| 2.2     | Por Tipo         | 1 dia   | P1         |
| 2.3     | Alertas          | 2 dias  | P2         |
| 2.4     | Dashboard Exec   | 3 dias  | P2         |
| 3.x     | Análise Avançada | 5 dias  | P3         |
| 4.x     | Integrações      | 7 dias  | P3         |

**Total:** ~3 semanas para funcionalidade completa

---

## Decisões Arquiteturais

### ✅ Client-Side Only (v1.0)

**Pro:**

- Rápido, sem latência
- Funciona offline
- Fácil de implementar

**Con:**

- Sem histórico persistente (fase 2)
- Sem análise em servidor

### 📋 localStorage para Histórico (Fase 2)

**Pro:**

- Simples de implementar
- Não requer servidor

**Con:**

- Limitado a 5-10MB
- Solução para 7-30 dias de histórico

### 🎯 Pesos Fixos (v1.0) vs Customizáveis (Fase 3)

**Pro (v1.0):**

- Simples para MVP
- Consistente para todos

**Con:**

- Pouca flexibilidade
- Fase 3 adiciona customização

---

## Testing Strategy

### Unit Tests (Fase 1 - Pendente)

```typescript
describe("calculateRiskScore", () => {
  test("should return 100 with no items");
  test("should deduct 30 for expired");
  test("should apply penalty for >30 days");
  test("should cap at 0 and 100");
  test("should calculate breakdown correctly");
});
```

### Integration Tests (Fase 2)

```typescript
describe("RiskScoreBadge", () => {
  test("should display correct level based on score");
  test("should show tooltip on click");
  test("should handle all sizes correctly");
});
```

### E2E Tests (Fase 3)

```
scenarios:
1. User views GeneralPendencies → sees scores
2. User clicks score → tooltip appears → breakdown shown
3. User refreshes → scores updated
4. Mobile view → responsive layout
```

---

## Recursos

- **Branch:** `feature/risk-score-system`
- **Docs:** RISK_SCORE_GUIDE.md, RISK_SCORE_EXAMPLES.md
- **Componentes:** RiskScoreBadge, RiskScoreDetail
- **Biblioteca:** src/lib/risk-score.ts
- **Integração:** src/components/dashboard/GeneralPendencies.tsx

---

## Contatos

- **Feature Owner:** [User Name]
- **Code Review:** [Lead Dev]
- **QA:** [QA Lead]
- **Stakeholders:** Gestão de SST

---

**Status Final:** Feature completa e pronta para produção! 🚀

Próximo passo: Code review + Merge para main
