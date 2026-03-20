# 🎯 Nova Estrutura de Alertas - Arquitetura

## 📂 Estrutura de Componentes

```
src/
├── app/
│   └── (app)/
│       └── dashboard/
│           └── page.tsx              ← Integração principal
│                                       • Importa AlertsHub
│                                       • Renderiza no header
│
├── components/
│   └── dashboard/
│       ├── AlertsHub.tsx             ← ⭐ NOVO: Gerenciador de Alertas
│       │   ├── Cálculo de alertas (useMemo)
│       │   ├── Toast dispatcher (useEffect)
│       │   ├── Sino com badge
│       │   └── Modal controller
│       │
│       ├── AlertsModalContent.tsx    ← ⭐ NOVO: Apresentação de Alertas
│       │   ├── Agrupamento por severity
│       │   ├── Renderização visual
│       │   └── Ícones e cores
│       │
│       ├── RiskIndicator.tsx         ← EXISTENTE: Risco Geral (mantido)
│       │
│       ├── GeneralPendencies.tsx     ← EXISTENTE: Pendências (mantido)
│       │
│       └── AutomaticAlerts.tsx       ← OPCIONAL: Pode ser deletado
│                                       (lógica movida para AlertsHub)
│
├── providers/
│   └── Provaiders.tsx                ← Modificado: Adicionado <Toaster />
│
└── lib/
    └── unified-pending.ts            ← EXISTENTE: Lógica não-duplicada
```

---

## 🔗 Fluxo de Dados

```
┌─────────────────────────────────────────────────────────────────┐
│                        DashboardPage                             │
│ (carrega: asos, treinamentos)                                   │
└────────────────────────┬────────────────────────────────────────┘
                         │
                    Passa dados
                         │
    ┌────────────────────┴────────────────────┐
    │                                         │
    ▼                                         ▼
┌─────────────────────┐            ┌──────────────────────┐
│   RiskIndicator     │            │    AlertsHub         │
│ (Risco Geral)       │            │ (Toast + Modal)      │
│ ✅ Mantido          │            │ ✅ Novo              │
└─────────────────────┘            │                      │
                                   │ useMemo              │
                                   │  └─→ createAlert()   │
                                   │  └─→ groupByColaborador()
                                   │                      │
                                   │ useEffect            │
                                   │  └─→ toast.error()   │
                                   │  └─→ toast.warning() │
                                   │                      │
                                   │ Renderização         │
                                   │  └─→ <Button />      │
                                   │  └─→ <Dialog />      │
                                   │                      │
                                   └──────┬───────────────┘
                                          │
                    ┌─────────────────────┴─────────────────────┐
                    │                                           │
                    ▼                                           ▼
        ┌──────────────────────┐              ┌──────────────────────┐
        │ Toast (Sonner)       │              │ Dialog (Modal)       │
        │ • Automático ao      │              │ • Ao clicar sino     │
        │   carregar           │              │ • Lista completa     │
        │ • 5s duração         │              │ • Agrupado           │
        │ • Crítico ou aviso   │              │ • Hierarquizado      │
        └──────────────────────┘              └──────────────────────┘
                                                      │
                                                      ▼
                                        ┌──────────────────────┐
                                        │ AlertsModalContent   │
                                        │ (renderização)       │
                                        │ • GroupBy severity   │
                                        │ • Ícones             │
                                        │ • Cores              │
                                        │ • Badges             │
                                        └──────────────────────┘
```

---

## 🎮 Estados & Transições

### **AlertsHub State Management**:

```typescript
State 1: INICIAL (loading)
├─ alerts = []
├─ isOpen = false
├─ toastsShown = false
└─ Sino: Invisível

        ↓ (dados carregam)

State 2: DADOS CARREGADOS (sem alertas)
├─ alerts = []
├─ isOpen = false
├─ toastsShown = false
└─ Sino: Invisível

        ↓ (há alertas)

State 3: COM ALERTAS (antes de toasts)
├─ alerts = [...]
├─ isOpen = false
├─ toastsShown = false
└─ Sino: Visível (com badge)

        ↓ (useEffect dispara)

State 4: COM ALERTAS (após toasts)
├─ alerts = [...]
├─ isOpen = false  (ou true se clicou)
├─ toastsShown = true
└─ Sino: Visível + Toast apareceu

        ↓ (clique no sino)

State 5: MODAL ABERTO
├─ alerts = [...] (mesmos)
├─ isOpen = true
├─ toastsShown = true
└─ Sino: Visível + Modal rendendo

        ↓ (clique X ou fora)

State 6: MODAL FECHADO
├─ alerts = [...]
├─ isOpen = false
├─ toastsShown = true
└─ Sino: Visível (dados mantidos)
```

---

## 🔄 Fluxo de Alertas

### **Geração de Alertas** (em useMemo):

```
Entrada: asos[], treinamentos[], isLoading
   │
   ├─ createRealPendingsList() → UnifiedPendingItem[]
   │
   ├─ groupPendingsByColaborador() → PendingsByColaborador[]
   │
   └─ Analisar grupos:

      ├─ Loop 1: Críticos (vencidosCount >= 2)
      │  └─ Alert { severity: "critical", type: "vencido", ... }
      │  └─ Max 5 colaboradores
      │
      ├─ Loop 2: Volume (total vencidos > 5)
      │  └─ Alert { severity: "warning", type: "volume", ... }
      │  └─ Max 1
      │
      └─ Loop 3: Vencimento próximo (<=7 dias)
         └─ Alert { severity: "warning", type: "soon_expire", ... }
         └─ Max 1

Saída: Alert[]
   │
   └─ Ordenado: critical > warning > info
```

---

## 📊 Hierarquia de Renders

### **DashboardPage**:

```tsx
export default function DashboardPage() {
  const [activeTab] = useState(...)
  const { data: asos } = useQuery(...)
  const { data: treinamentos } = useQuery(...)

  return (
    <div className="max-w-7xl">
      {/* Header com AlertsHub */}
      <div className="mb-8">
        <div className="flex justify-between">
          <Logo />
          <div className="flex gap-2">
            <AlertsHub      {/* ← NOVO */}
              asos={asos}
              treinamentos={treinamentos}
            />
            <RefreshButton />
          </div>
        </div>
      </div>

      {/* Conteúdo principal */}
      <RiskIndicator ... />
      <GeneralPendencies ... />
      <TabNavigation ... />
    </div>
  )
}
```

### **AlertsHub**:

```tsx
export default function AlertsHub({ asos, treinamentos }) {
  const [isOpen, setIsOpen] = useState(false);
  const alerts = useMemo(() => {
    /* ... */
  }, [asos, treinamentos]);

  useEffect(() => {
    /* disparar toasts */
  }, [alerts]);

  return (
    <>
      <Button onClick={() => setIsOpen(true)}>
        <Bell />
        {alerts.length > 0 && <Badge>{alerts.length}</Badge>}
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent>
          <DialogHeader>Alertas</DialogHeader>
          <AlertsModalContent alerts={alerts} />
        </DialogContent>
      </Dialog>

      {/* Toast renderizado por <Toaster /> em Providers */}
    </>
  );
}
```

### **AlertsModalContent**:

```tsx
export default function AlertsModalContent({ alerts }) {
  const alertsBySeverity = useMemo(() => {
    // agrupar por severity
  }, [alerts]);

  return (
    <div className="space-y-4">
      {["critical", "warning", "info"].map((severity) => (
        <div key={severity}>
          <h3>{severity}</h3>
          <div className="space-y-2">
            {alertsBySeverity[severity].map((alert) => (
              <AlertItem key={alert.id} alert={alert} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
```

---

## 🎨 Renderização Visual

### **Sino com Badge** (Sempre no Header):

```
[🔔] ← Invisível se alertas.length = 0
[🔔⁵] ← Visível se alertas.length > 0
      └─ Badge: rose-600, número branco

Posição: flex-direction row
         gap: 2
         Logo | [Sino] [Botão]
```

### **Toast** (Automático, 5s):

```
Top-right corner, not intrusive

Crítico:
┌──────────────────────────┐
│ 🔴 Gabriel Souza tem 3   │
│    pendências críticas   │
│                 [X]      │ ← Dura 5s
└──────────────────────────┘

Warning:
┌──────────────────────────┐
│ ⚠️ 8 registros vencidos  │
│    na equipe             │
│                 [X]      │ ← Dura 5s
└──────────────────────────┘
```

### **Modal** (Ao Clicar):

```
┌───────────────────────────────────────┐
│ 🔔 Alertas (5)              [X]      │ ← Title
├───────────────────────────────────────┤
│ 🔴 CRÍTICO (2)                        │
│                                       │
│  ┌─────────────────────────────────┐  │
│  │ Gabriel Souza tem 3 vencidos    │  │
│  │ Colaborador: Gabriel Souza      │  │
│  │ [Critical Badge]                │  │
│  └─────────────────────────────────┘  │
│                                       │
│  ┌─────────────────────────────────┐  │
│  │ Maria Silva tem 2 vencidos      │  │
│  │ Colaborador: Maria Silva        │  │
│  │ [Critical Badge]                │  │
│  └─────────────────────────────────┘  │
├───────────────────────────────────────┤
│ 🟡 AVISO (3)                          │
│                                       │
│  ┌─────────────────────────────────┐  │
│  │ 8 registros vencidos na equipe  │  │
│  │ [Warning Badge]                 │  │
│  └─────────────────────────────────┘  │
│                                       │
│  ┌─────────────────────────────────┐  │
│  │ 4 colaboradores com pendências  │  │
│  │ vencendo em até 7 dias          │  │
│  │ [Warning Badge]                 │  │
│  └─────────────────────────────────┘  │
│                                       │
│  ┌─────────────────────────────────┐  │
│  │ 2 colaboradores com NR-35...    │  │
│  │ [Warning Badge]                 │  │
│  └─────────────────────────────────┘  │
│                                       │
└───────────────────────────────────────┘
```

---

## 🚀 Performance & Otimizações

### **useMemo - Cálculo de Alertas**:

```typescript
const alerts = useMemo<Alert[]>(() => {
  // Executado APENAS quando asos/treinamentos/isLoading mudam
  // Não re-calcula em cada render
  // Evita cálculos desnecessários
}, [asos, treinamentos, isLoading]);
```

### **useEffect - Toast Dispatcher**:

```typescript
useEffect(() => {
  if (toastsShown || alerts.length === 0 || isLoading) return;

  // Usa setTimeout para evitar cascading renders
  const timer = setTimeout(() => {
    setToastsShown(true);
    // ... disparar toasts
  }, 0);

  return () => clearTimeout(timer);
}, [alerts, isLoading, toastsShown]);
// Executa APENAS quando alerts/isLoading mudam
// toastsShown bloqueia re-runs
```

### **Evita Re-renders Desnecessários**:

- ✅ Toast dispara apenas 1x (toastsShown state)
- ✅ useMemo evita cálculos de alertas
- ✅ Dialog só renderiza quando aberto
- ✅ Badge e ícone mínimos

---

## 🔒 Isolamento de Lógica

```
unified-pending.ts (Reutilizado)
  ├─ createRealPendingsList()      ← UsadoPor: AlertsHub
  ├─ groupPendingsByColaborador()  ← UsadoPor: AlertsHub
  └─ getStatusColorClasses()       ← Não usado em alertas

AlertsHub.tsx (Novo)
  ├─ Calcula alertas
  ├─ Dispara toasts
  ├─ Gerencia modal
  └─ Renderiza UI

AlertsModalContent.tsx (Novo)
  └─ APENAS renderiza (recebe alerts prontos)

RiskIndicator.tsx (Separado)
  └─ Calcula risco (independente de alertas)

GeneralPendencies.tsx (Separado)
  └─ Lista pendências (independente de alertas)

AutomaticAlerts.tsx (Legado)
  └─ Pode ser deletado (lógica em AlertsHub)
```

---

## 🎯 Decisões de Design

### **Por que Toast + Modal?**

- ✅ Toast avisa sem poluir
- ✅ Modal oferece visão completa
- ✅ Não obriga usuário a ler tudo
- ✅ Discreto mas acessível
- ✅ Padrão moderno (Slack, Discord, etc)

### **Por que Sino com Badge?**

- ✅ Ícone universal para notificações
- ✅ Badge mostra quantidade
- ✅ Discreto no header
- ✅ Fácil de localizar
- ✅ Padrão reconhecido

### **Por que Priorização (Critical > Warning)?**

- ✅ Usuário vê o mais importante primeiro
- ✅ Evita overload de informação
- ✅ Toast não toma espaço demais
- ✅ Modal mantém lista completa

### **Por que Duração 5s nos Toasts?**

- ✅ Tempo suficiente para ler
- ✅ Não fica muito tempo (chato)
- ✅ Padrão da indústria
- ✅ Usuário pode clicar X antes

---

## ✅ Verificação Final

### **Arquivos**:

- ✅ AlertsHub.tsx criado
- ✅ AlertsModalContent.tsx criado
- ✅ DashboardPage atualizado
- ✅ Providers atualizado

### **Funcionalidades**:

- ✅ Alertas calculados (useMemo)
- ✅ Toasts disparados (useEffect)
- ✅ Sino com badge renderizado
- ✅ Modal funcional (Dialog)
- ✅ Priorização implementada
- ✅ Sem duplicação de lógica

### **Tipos**:

- ✅ Alert type exportado
- ✅ Severity: "critical" | "warning" | "info"
- ✅ AlertsHubProps definido
- ✅ AlertsModalContentProps definido

### **Performance**:

- ✅ useMemo para alertas
- ✅ useEffect otimizado
- ✅ Evita cascading renders
- ✅ Renderização condicional

### **UX**:

- ✅ Toast automático (5s)
- ✅ Sino discreto
- ✅ Modal acessível
- ✅ Agrupamento claro
- ✅ Cores e ícones apropriados

---

## 🎓 Conclusão

**Arquitetura moderna, eficiente e user-friendly!** ✨

Dashboard agora:

- 📍 Exibe alertas sem poluir
- 🎯 Prioriza os mais críticos
- 🔔 Notifica automaticamente
- 📊 Oferece visão completa
- ⚡ Otimizado para performance
- 🎨 Consistente com design existente
