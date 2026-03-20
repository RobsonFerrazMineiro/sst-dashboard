# Refatoração de Alertas - Documentação

## 📋 Visão Geral

A funcionalidade de alertas foi refatorada de um **bloco fixo e poluidor** no dashboard para uma abordagem **moderna, não-intrusiva e mais funcional**:

- ❌ **Antes**: Bloco grande fixo ocupando espaço no dashboard
- ✅ **Depois**: Toasts automáticos + Modal com central de alertas

---

## 🎯 Componentes Criados

### 1. **AlertsHub** (`src/components/dashboard/AlertsHub.tsx`)

**Responsabilidades**:

- ✅ Calcular e gerenciar todos os alertas
- ✅ Disparar toasts automáticos ao carregar (apenas uma vez)
- ✅ Renderizar botão de sino com badge de contagem
- ✅ Controlar abertura/fechamento do modal

**Props**:

```typescript
{
  asos: AsoRecord[]
  treinamentos: TreinamentoRecord[]
  isLoading?: boolean
}
```

**Funcionalidades**:

- ✅ Usa `useMemo` para calcular alertas (performance)
- ✅ Usa `useEffect` para disparar toasts automáticos
- ✅ Evita re-renders desnecessários com `toastsShown` state
- ✅ Prioriza alertas críticos nos toasts (max 1)
- ✅ Se não houver críticos, mostra até 2 avisos
- ✅ Badge vermelha com contagem total de alertas
- ✅ Dialog com modal para ver todos os alertas

**Tipos de Alertas**:

```typescript
type Alert = {
  id: string; // Identificador único
  severity: "critical" | "warning" | "info";
  message: string; // Mensagem principal
  colaborador?: string; // Nome do colaborador (opcional)
  type: "vencido" | "volume" | "soon_expire";
};
```

**Priorização de Severidade**:

1. 🔴 **CRITICAL** - Colaboradores com >=2 vencidos
2. 🟡 **WARNING** - Volume >5 vencidos OU <=7 dias para vencer
3. 🔵 **INFO** - Informações gerais (ainda não usado)

---

### 2. **AlertsModalContent** (`src/components/dashboard/AlertsModalContent.tsx`)

**Responsabilidades**:

- ✅ Renderizar a lista completa de alertas no modal
- ✅ Agrupar alertas por severidade
- ✅ Apresentar hierarquia visual clara

**Features**:

- ✅ Agrupa alertas por severity (critical, warning, info)
- ✅ Mostra ícone apropriado para cada severidade
- ✅ Cores consistentes com o design existente
- ✅ Badge com label de severidade
- ✅ Exibe nome do colaborador quando aplicável
- ✅ Ordem de exibição: Critical → Warning → Info

**Cores por Severidade**:

- 🔴 **Critical**: rose-50 / rose-500 border
- 🟡 **Warning**: amber-50 / amber-500 border
- 🔵 **Info**: blue-50 / blue-500 border

---

## 📍 Posicionamento no Dashboard

### **Antes** (Layout com bloco fixo):

```
┌─────────────────────────────────────┐
│ Header com sino + Botão Atualizar   │
├─────────────────────────────────────┤
│ Indicador de Risco Geral            │ ← RiskIndicator
├─────────────────────────────────────┤
│ Alertas Automáticos (BLOCO FIXO)    │ ← AutomaticAlerts ❌ REMOVIDO
├─────────────────────────────────────┤
│ Pendências Gerais                   │ ← GeneralPendencies
├─────────────────────────────────────┤
│ Tabs (ASOs / Treinamentos)          │
├─────────────────────────────────────┤
│ Conteúdo das Tabs                   │
└─────────────────────────────────────┘
```

### **Depois** (Layout mais limpo):

```
┌──────────────────────────────────────────┐
│ Header com [Sino📍] [Atualizar]          │ ← AlertsHub no header
├──────────────────────────────────────────┤
│ Indicador de Risco Geral                 │ ← RiskIndicator
├──────────────────────────────────────────┤
│ Pendências Gerais                        │ ← GeneralPendencies
├──────────────────────────────────────────┤
│ Tabs (ASOs / Treinamentos)               │
├──────────────────────────────────────────┤
│ Conteúdo das Tabs                        │
└──────────────────────────────────────────┘

Toast (topo direito):
┌─────────────────────────┐
│ Alerta crítico           │ ← Desaparece em 5s
└─────────────────────────┘

Modal (ao clicar no sino):
┌────────────────────────────┐
│ Alertas (5)                │
├────────────────────────────┤
│ 🔴 CRÍTICO (2)             │
│  • Gabriel Souza: 3 vencidos
│  • Maria Silva: 2 vencidos │
├────────────────────────────┤
│ 🟡 AVISO (3)               │
│  • 8 registros vencidos    │
│  • 4 colaboradores vencendo│
│  • 2 dias para vencer      │
└────────────────────────────┘
```

---

## 🔄 Fluxo de Funcionamento

### 1️⃣ **Ao Carregar o Dashboard**:

```
DashboardPage carrega
    ↓
AlertsHub recebe asos + treinamentos
    ↓
useMemo calcula todos os alertas
    ↓
useEffect dispara toasts (apenas uma vez)
    ↓
Mostrado: 1 alerta crítico OU 2 avisos
    ↓
Toast desaparece em 5 segundos
```

### 2️⃣ **Ao Clicar no Sino**:

```
Usuário clica no ícone Bell
    ↓
Dialog abre
    ↓
AlertsModalContent renderiza todos os alertas
    ↓
Agrupados por severidade
    ↓
Usuário pode visualizar/analisar todos
    ↓
Clica para fechar ou clica fora
```

### 3️⃣ **Lógica de Alertas** (sem mudanças):

```
Colaboradores Críticos (CRITICAL):
  - Tem >=2 pendências vencidas
  - Max 5 mostrados

Volume Crítico (WARNING):
  - Total de vencidos > 5 na equipe

Vencimento Próximo (WARNING):
  - Itens com <=7 dias para vencer
```

---

## 🎨 UI/UX

### **Sino com Badge**:

```
Posição: Header (lado direito do logo)
Ícone: lucide-react Bell
Badge: Fundo rose-600, contagem em branco
Estados:
  - Normal: Bell cinza
  - Com alertas: Bell cinza + badge vermelho
  - Hover: Cursor pointer
```

### **Toasts (Sonner)**:

```
Posição: Topo direito
Duração: 5 segundos (automático)
Tipos:
  - Critical: toast.error() - Fundo vermelho
  - Warning: toast.warning() - Fundo laranja
  - Info: toast.info() - Fundo azul
Descrição: Mostra colaborador se aplicável
```

### **Modal (Dialog shadcn/ui)**:

```
Tamanho: max-w-2xl, max-h-[80vh]
Scroll: overflow-y-auto
Conteúdo:
  - DialogHeader com título + ícone
  - AlertsModalContent (lista organizada)
  - Fechar: Clique no X ou fora do modal
```

---

## 📊 Comparação: Antes vs Depois

| Aspecto                     | Antes                    | Depois                               |
| --------------------------- | ------------------------ | ------------------------------------ |
| **Ocupação de Espaço**      | Bloco fixo grande        | Apenas ícone no header               |
| **Visibilidade**            | Sempre visível (poluído) | Sob demanda (não-intrusivo)          |
| **Alertas Iniciais**        | Lista completa           | Toasts dos mais críticos             |
| **Acesso à Lista Completa** | Scroll no dashboard      | Modal via sino                       |
| **Performance**             | Re-renderiza lista       | Apenas calcula, não renderiza sempre |
| **UX Mobile**               | Ocupa espaço precioso    | Sino discreto, modal responsivo      |
| **Limpeza Visual**          | ❌ Poluído               | ✅ Limpo                             |
| **Intrusividade**           | ❌ Sempre lá             | ✅ Notificação e sob demanda         |

---

## 🔧 Integração Técnica

### **Em DashboardPage**:

```typescript
// No header, ao lado do botão Atualizar
<div className="flex items-center gap-2">
  <AlertsHub
    asos={asos}
    treinamentos={treinamentos}
    isLoading={loadingASOs || loadingTreinamentos}
  />
  <Button onClick={handleRefresh}>
    Atualizar
  </Button>
</div>
```

### **Dependências**:

- ✅ `sonner` - Toast notifications
- ✅ `shadcn/ui Dialog` - Modal
- ✅ `lucide-react` - Icons (Bell)
- ✅ Existing: `unified-pending.ts` - Alert logic

### **Sem Mudanças**:

- ✅ API routes (não tocadas)
- ✅ RiskIndicator (mantido)
- ✅ GeneralPendencies (mantido)
- ✅ Lógica de cálculo de alertas (reutilizada)

---

## 📝 Próximas Melhorias Possíveis

1. **Persistência**: Salvar alertas vistos no localStorage
2. **Filtros Modal**: Filtrar por severidade no modal
3. **Ações**: Clicar em colaborador → abrir ProfileModal
4. **Dismiss**: Botão para descartar alertas individuais
5. **Customização**: Usuário ajustar quais toasts ver
6. **Histórico**: Ver alertas anteriores
7. **Agendamento**: Re-check de alertas periodicamente

---

## ✅ Resultado Final

- ✅ **Dashboard mais limpo**: Sem bloco fixo de alertas
- ✅ **Menos poluição visual**: Apenas sino discreto no header
- ✅ **Alertas ainda visíveis**: Via toasts automáticos
- ✅ **Central de alertas**: Modal com lista completa
- ✅ **Performance**: useMemo + useEffect otimizado
- ✅ **UX melhorada**: Não-intrusivo mas ainda acessível
- ✅ **Design consistente**: Tailwind + shadcn/ui + Sonner
- ✅ **Sem quebras**: Tudo reutiliza lógica existente

---

## 📂 Arquivos Modificados

```
✅ Created:
  - src/components/dashboard/AlertsHub.tsx
  - src/components/dashboard/AlertsModalContent.tsx

✅ Updated:
  - src/app/(app)/dashboard/page.tsx
    * Removido: <AutomaticAlerts />
    * Adicionado: AlertsHub no header

⚠️ Not Touched:
  - src/components/dashboard/AutomaticAlerts.tsx (mantém funcionalidade)
  - src/components/dashboard/RiskIndicator.tsx
  - src/components/dashboard/GeneralPendencies.tsx
  - src/lib/unified-pending.ts
  - API routes
```

---

## 🚀 Status: CONCLUÍDO ✅

Refatoração realizada com sucesso. Dashboard agora exibe alertas de forma inteligente e não-intrusiva!
