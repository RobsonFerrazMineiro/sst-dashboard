# Sistema de Score de Risco por Colaborador

## Objetivo

Gerar uma nota de risco (0 a 100) para cada colaborador com base nas pendências (ASOs e Treinamentos) agrupadas no dashboard.

## Arquitetura

### Biblioteca: `src/lib/risk-score.ts`

Calcula o score de risco baseado em pendências.

**Exports:**

- `RiskLevel` - Type: "Crítico" | "Alto" | "Atenção" | "Controlado"
- `RiskScore` - Type com score, level e breakdown detalhado
- `calculateRiskScore(items: UnifiedPendingItem[]): RiskScore` - Função principal
- `getRiskLevelColors(level): { bg, text, border, icon }` - Cores Tailwind
- `getRiskLevelIcon(level): string` - Nome do ícone Lucide

### Componentes

#### `RiskScoreBadge.tsx`

Exibe o score de forma visual e compacta.

**Props:**

```typescript
{
  riskScore: RiskScore
  showLabel?: boolean    // Exibe nome do nível (default: true)
  size?: "sm" | "md" | "lg"  // Tamanho (default: "md")
}
```

**Exemplo:**

```tsx
<RiskScoreBadge riskScore={riskScore} size="md" />
```

#### `RiskScoreDetail.tsx`

Exibe detalhamento completo do cálculo do score.

**Props:**

```typescript
{
  riskScore: RiskScore;
}
```

**Mostra:**

- Score final
- Breakdown de cada deduções
- Insights dos problemas encontrados

### Integração

#### Em `GeneralPendencies.tsx`

O score é calculado automaticamente para cada grupo de pendências.

```tsx
// Calcula score para cada grupo
const groupsWithRiskScores = useMemo(
  () =>
    filteredGroups.map((group) => ({
      ...group,
      riskScore: calculateRiskScore(group.items),
    })),
  [filteredGroups],
);
```

E exibido como uma coluna ao lado do nome do colaborador:

```tsx
<RiskScoreBadge riskScore={group.riskScore} size="md" />
```

## Regras de Cálculo

### Pontuação

| Item                          | Desconto |
| ----------------------------- | -------- |
| Inicial                       | +100     |
| Cada item vencido             | -30      |
| Cada item prestes a vencer    | -10      |
| Cada item pendente            | -15      |
| Penalidade (vencido >30 dias) | -10      |

### Classificação por Faixa

| Score  | Nível      | Cor             | Ícone         |
| ------ | ---------- | --------------- | ------------- |
| 0-29   | Crítico    | Rose (vermelho) | AlertTriangle |
| 30-59  | Alto       | Orange          | AlertCircle   |
| 60-84  | Atenção    | Amber (amarelo) | Info          |
| 85-100 | Controlado | Emerald (verde) | CheckCircle2  |

## Exemplo de Cálculo

**Cenário:** João tem 5 pendências

- 2 itens vencidos
- 1 item prestes a vencer
- 1 item vencido há 45 dias
- 1 item pendente

**Cálculo:**

```
Inicial: 100
- 2 itens vencidos: -30 × 2 = -60
- 1 item prestes a vencer: -10
- 1 item pendente: -15
- 1 penalidade (>30 dias): -10
= 100 - 60 - 10 - 15 - 10 = 5

Resultado: Score 5 → CRÍTICO
```

## Características Técnicas

### Sem Alteração de API

- ✅ Não modifica endpoints de dados
- ✅ Não altera estrutura de dados existente
- ✅ Cálculo puramente client-side com `useMemo`

### Performance

- Cálculo feito apenas quando pendências mudam
- Uso de `useMemo` para evitar recálculos desnecessários
- Componentes de visualização são puros (sem side effects)

### Type Safety

- TypeScript completo
- Tipos bem definidos para RiskScore, RiskLevel
- Sem uso de 'any'

### Não Substitui Badges Existentes

- Score é **complementar** aos badges de vencido/vencendo
- Ambos são exibidos juntos
- Informações anteriores mantidas intactas

## Próximas Melhorias

1. **Histórico de Score** - Rastrear evolução do score ao longo do tempo
2. **Score por Tipo** - Separar score para ASOs e Treinamentos
3. **Alertas Automáticos** - Notificar quando score cai para nível crítico
4. **Dashboard Executivo** - Gráfico de distribuição de scores
5. **Exportação** - Incluir score em relatórios CSV
6. **Internacionalização** - Suporte a múltiplos idiomas
7. **Customização** - Permitir ajuste dos pesos de deduções

## Estrutura de Branches

```
main
 └── feature/risk-score-system (CURRENT)
      ├── src/lib/risk-score.ts
      ├── src/components/dashboard/RiskScoreBadge.tsx
      ├── src/components/dashboard/RiskScoreDetail.tsx
      └── src/components/dashboard/GeneralPendencies.tsx (modificado)
```

## Testes Sugeridos

1. **Cálculo Correto**
   - [ ] Score 100 quando sem pendências
   - [ ] Score 0 com muitas pendências
   - [ ] Penalidade >30 dias aplicada corretamente

2. **Visual**
   - [ ] Cores corretas por nível
   - [ ] Ícones aparecem corretamente
   - [ ] Responsividade em mobile

3. **Integração**
   - [ ] Score atualiza quando filtro muda
   - [ ] Score aparece ao lado do nome
   - [ ] Detalhe aparece ao hover (futuro)
