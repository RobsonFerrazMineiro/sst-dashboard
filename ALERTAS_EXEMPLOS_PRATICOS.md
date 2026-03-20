# 🔍 Exemplos Práticos - Sistema de Alertas

## 📚 Casos de Uso Reais

### **Caso 1: Dashboard Sem Alertas**

```typescript
// Dados:
asos = []
treinamentos = []

// Resultado:
- Sino invisível (alerts.length = 0)
- Nenhum toast disparado
- Dashboard limpo
- Modal vazio se clicado
```

---

### **Caso 2: 1 Colaborador com 3 Vencidos**

```typescript
// Dados:
asos = [
  { id: 1, colaborador_nome: "Gabriel Souza", validade_aso: "2026-03-10", ... },
  { id: 2, colaborador_nome: "Gabriel Souza", validade_aso: "2026-03-12", ... },
  { id: 3, colaborador_nome: "Gabriel Souza", validade_aso: "2026-03-15", ... },
]
treinamentos = []

// Resultado:
// useMemo calcula:
alerts = [
  {
    id: "critico-Gabriel Souza",
    severity: "critical",
    type: "vencido",
    message: "Gabriel Souza tem 3 pendências críticas",
    colaborador: "Gabriel Souza"
  }
]

// useEffect dispara:
toast.error("Gabriel Souza tem 3 pendências críticas", {
  description: "Colaborador: Gabriel Souza",
  duration: 5000
})

// Sino:
[🔔¹] ← com badge vermelha "1"

// Modal ao clicar:
┌─────────────────────────────────────┐
│ 🔔 Alertas (1)               [X]   │
├─────────────────────────────────────┤
│ 🔴 CRÍTICO (1)                      │
│                                     │
│ ┌────────────────────────────────┐  │
│ │ Gabriel Souza tem 3 pendências │  │
│ │ críticas                        │  │
│ │ Colaborador: Gabriel Souza     │  │
│ │ [Critical Badge]               │  │
│ └────────────────────────────────┘  │
└─────────────────────────────────────┘
```

---

### **Caso 3: 2 Colaboradores com Múltiplos Vencidos + Volume Crítico**

```typescript
// Dados:
asos = [
  // Gabriel Souza: 3 vencidos
  { colaborador_nome: "Gabriel Souza", validade_aso: "2026-03-10" },
  { colaborador_nome: "Gabriel Souza", validade_aso: "2026-03-12" },
  { colaborador_nome: "Gabriel Souza", validade_aso: "2026-03-15" },

  // Maria Silva: 2 vencidos
  { colaborador_nome: "Maria Silva", validade_aso: "2026-03-05" },
  { colaborador_nome: "Maria Silva", validade_aso: "2026-03-08" },

  // João: 1 vencido (não crítico)
  { colaborador_nome: "João Santos", validade_aso: "2026-03-20" },
]
treinamentos = []

// Resultado:
alerts = [
  {
    id: "critico-Gabriel Souza",
    severity: "critical",
    type: "vencido",
    message: "Gabriel Souza tem 3 pendências críticas",
    colaborador: "Gabriel Souza"
  },
  {
    id: "critico-Maria Silva",
    severity: "critical",
    type: "vencido",
    message: "Maria Silva tem 2 pendências críticas",
    colaborador: "Maria Silva"
  },
  {
    id: "volume-critico",
    severity: "warning",
    type: "volume",
    message: "6 registros vencidos na equipe"
  }
]

// Toast disparado (apenas 1 crítico):
toast.error("Gabriel Souza tem 3 pendências críticas", {
  description: "Colaborador: Gabriel Souza",
  duration: 5000
})

// Sino:
[🔔³] ← com badge "3"

// Modal ao clicar:
┌──────────────────────────────────────┐
│ 🔔 Alertas (3)                [X]   │
├──────────────────────────────────────┤
│ 🔴 CRÍTICO (2)                       │
│                                      │
│ ┌─────────────────────────────────┐  │
│ │ Gabriel Souza tem 3 pendências  │  │
│ │ Colaborador: Gabriel Souza      │  │
│ │ [Critical]                      │  │
│ └─────────────────────────────────┘  │
│                                      │
│ ┌─────────────────────────────────┐  │
│ │ Maria Silva tem 2 pendências    │  │
│ │ Colaborador: Maria Silva        │  │
│ │ [Critical]                      │  │
│ └─────────────────────────────────┘  │
├──────────────────────────────────────┤
│ 🟡 AVISO (1)                         │
│                                      │
│ ┌─────────────────────────────────┐  │
│ │ 6 registros vencidos na equipe  │  │
│ │ [Warning]                       │  │
│ └─────────────────────────────────┘  │
└──────────────────────────────────────┘
```

---

### **Caso 4: Vencimento Próximo (<=7 dias)**

```typescript
// Dados:
asos = []
treinamentos = [
  {
    colaborador_nome: "Pedro Costa",
    tipoTreinamento_nome: "NR-35",
    validade: "2026-03-22" // 3 dias
  },
  {
    colaborador_nome: "Ana Silva",
    tipoTreinamento_nome: "NR-10",
    validade: "2026-03-24" // 5 dias
  }
]

// Resultado:
alerts = [
  {
    id: "soon-expire",
    severity: "warning",
    type: "soon_expire",
    message: "2 colaboradores com pendências vencendo em até 7 dias"
  }
]

// Toast disparado (no máximo 2 avisos):
toast.warning(
  "2 colaboradores com pendências vencendo em até 7 dias",
  { duration: 5000 }
)

// Sino:
[🔔¹] ← com badge "1"

// Modal:
┌─────────────────────────────────────────────────┐
│ 🔔 Alertas (1)                           [X]   │
├─────────────────────────────────────────────────┤
│ 🟡 AVISO (1)                                    │
│                                                 │
│ ┌────────────────────────────────────────────┐  │
│ │ 2 colaboradores com pendências vencendo em │  │
│ │ até 7 dias                                 │  │
│ │ [Warning]                                  │  │
│ └────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────┘
```

---

### **Caso 5: Combinação: Críticos + Volume + Próximo Vencimento**

```typescript
// Dados:
asos = [
  // Gabriel: 3 vencidos
  { colaborador_nome: "Gabriel Souza", validade_aso: "2026-03-10" },
  { colaborador_nome: "Gabriel Souza", validade_aso: "2026-03-12" },
  { colaborador_nome: "Gabriel Souza", validade_aso: "2026-03-15" },

  // Maria: 2 vencidos
  { colaborador_nome: "Maria Silva", validade_aso: "2026-03-05" },
  { colaborador_nome: "Maria Silva", validade_aso: "2026-03-08" },

  // João: 1 vencido
  { colaborador_nome: "João", validade_aso: "2026-03-20" },
]

treinamentos = [
  // Pedro: vencendo em 3 dias
  {
    colaborador_nome: "Pedro Costa",
    tipoTreinamento_nome: "NR-35",
    validade: "2026-03-22"
  },
  // Ana: vencendo em 5 dias
  {
    colaborador_nome: "Ana Silva",
    tipoTreinamento_nome: "NR-10",
    validade: "2026-03-24"
  }
]

// Resultado:
alerts = [
  // Críticos
  {
    id: "critico-Gabriel Souza",
    severity: "critical",
    type: "vencido",
    message: "Gabriel Souza tem 3 pendências críticas",
    colaborador: "Gabriel Souza"
  },
  {
    id: "critico-Maria Silva",
    severity: "critical",
    type: "vencido",
    message: "Maria Silva tem 2 pendências críticas",
    colaborador: "Maria Silva"
  },

  // Volume
  {
    id: "volume-critico",
    severity: "warning",
    type: "volume",
    message: "6 registros vencidos na equipe"
  },

  // Próximo vencimento
  {
    id: "soon-expire",
    severity: "warning",
    type: "soon_expire",
    message: "2 colaboradores com pendências vencendo em até 7 dias"
  }
]

// Toast disparado (1 crítico, máximo):
toast.error("Gabriel Souza tem 3 pendências críticas", {
  description: "Colaborador: Gabriel Souza",
  duration: 5000
})
// (os outros aparecem no modal)

// Sino:
[🔔⁴] ← com badge "4"

// Modal ao clicar:
┌──────────────────────────────────────┐
│ 🔔 Alertas (4)                [X]   │
├──────────────────────────────────────┤
│ 🔴 CRÍTICO (2)                       │
│                                      │
│ ┌─────────────────────────────────┐  │
│ │ Gabriel Souza tem 3 pendências  │  │
│ │ Colaborador: Gabriel Souza      │  │
│ │ [Critical]                      │  │
│ └─────────────────────────────────┘  │
│                                      │
│ ┌─────────────────────────────────┐  │
│ │ Maria Silva tem 2 pendências    │  │
│ │ Colaborador: Maria Silva        │  │
│ │ [Critical]                      │  │
│ └─────────────────────────────────┘  │
├──────────────────────────────────────┤
│ 🟡 AVISO (2)                         │
│                                      │
│ ┌─────────────────────────────────┐  │
│ │ 6 registros vencidos na equipe  │  │
│ │ [Warning]                       │  │
│ └─────────────────────────────────┘  │
│                                      │
│ ┌─────────────────────────────────┐  │
│ │ 2 colaboradores com pendências  │  │
│ │ vencendo em até 7 dias          │  │
│ │ [Warning]                       │  │
│ └─────────────────────────────────┘  │
└──────────────────────────────────────┘
```

---

## 🎬 Sequência de Eventos

### **Ao Carregar o Dashboard**:

```
t=0ms:  ComponentMount
        └─ useState([isOpen, toastsShown])

t=5ms:  QueryClient carrega asos
        └─ setData(asos)

t=10ms: QueryClient carrega treinamentos
        └─ setData(treinamentos)

t=15ms: AlertsHub renderiza
        └─ useMemo calcula alertas
        └─ Sino renderizado (com ou sem badge)

t=20ms: useEffect rodar?
        ├─ Check: toastsShown? → false
        ├─ Check: alerts.length > 0? → sim
        ├─ Check: isLoading? → false
        └─ setTimeout 0ms

t=25ms: Timeout executa
        ├─ setToastsShown(true)
        ├─ toast.error() ou toast.warning()
        └─ Toast aparece (top-right)

t=5000ms: Toast desaparece automaticamente

t=5100ms: Usuário clica no sino
        ├─ setIsOpen(true)
        └─ Dialog abre com AlertsModalContent
        └─ Modal renderiza agrupado por severity
```

---

## 🖱️ Interações do Usuário

### **Clique no Sino**:

```
Usuário clica em [🔔]
      ↓
onClick dispara
      ↓
setIsOpen(true)
      ↓
Dialog abre (animação suave)
      ↓
AlertsModalContent renderiza
      ↓
Modal exibe alertas agrupados
      ↓
Usuário vê lista completa
      ↓
[Opções]:
├─ Clica em [X] → modal fecha
├─ Clica fora → modal fecha
└─ Lê os alertas → depois fecha
```

### **Ignore Toast**:

```
Toast aparece
      ↓
Usuário ignora (ou lê)
      ↓
Após 5 segundos
      ↓
Toast desaparece automaticamente
      ↓
[Opcionalmente]:
└─ Clica [X] no toast → fecha antes
```

### **Atualizar Dashboard**:

```
Usuário clica em [Atualizar]
      ↓
handleRefresh() dispara
      ↓
refetch(asos) + refetch(treinamentos)
      ↓
Dados carregam
      ↓
AlertsHub useMemo recalcula
      ↓
Badge atualiza
      ↓
Modal atualiza se aberto
      ↓
⚠️ Toasts NÃO disparam novamente
   (toastsShown está true)
      ↓
Dashboard com dados atualizados
```

---

## 🔍 Debug & Troubleshooting

### **Toast Não Aparece?**

1. **Verificar Providers**:

```typescript
// src/providers/Provaiders.tsx deve ter:
import { Toaster } from "sonner"

export function Providers({ children }) {
  return (
    <QueryClientProvider client={client}>
      {children}
      <Toaster position="top-right" />  {/* ← AQUI */}
    </QueryClientProvider>
  )
}
```

2. **Verificar AlertsHub**:

```typescript
// useEffect deve ter:
useEffect(() => {
  if (toastsShown || alerts.length === 0 || isLoading) return;

  const timer = setTimeout(() => {
    setToastsShown(true);  // ← ANTES de toast

    const toShow = criticalAlerts.length > 0
      ? criticalAlerts.slice(0, 1)
      : alerts.slice(0, 2);

    toShow.forEach(alert => {
      toast[alert.severity === "critical" ? "error" : "warning"](...)
    });
  }, 0);

  return () => clearTimeout(timer);
}, [alerts, isLoading, toastsShown])
```

3. **Verificar DevTools**:

```javascript
// No console do navegador:
// Check se sonner está disponível
window.__sonner_toasts;

// Disparar teste manual:
import { toast } from "sonner";
toast.success("Test toast");
```

### **Modal Não Abre?**

1. **Verificar imports**:

```typescript
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
```

2. **Verificar state**:

```typescript
const [isOpen, setIsOpen] = useState(false);
```

3. **Verificar Dialog**:

```typescript
<Dialog open={isOpen} onOpenChange={setIsOpen}>
  <DialogContent>
    <DialogHeader>...</DialogHeader>
    <AlertsModalContent alerts={alerts} />
  </DialogContent>
</Dialog>
```

### **Sino Não Aparece?**

Sino aparece QUANDO:

- `alerts.length > 0` (tem alertas)
- `isLoading === false` (dados carregaram)

Sino desaparece QUANDO:

- `alerts.length === 0` (sem alertas)

```typescript
{alerts.length > 0 && (
  <Button ...>
    <Bell className="h-5 w-5" />
    <span className="...rose-600...">{alerts.length}</span>
  </Button>
)}
```

### **Alertas Repetindo?**

A lógica evita com `toastsShown` state:

```typescript
// ✅ CORRETO: Bloqueia re-run
useEffect(() => {
  if (toastsShown) return;  // ← Sai se já mostrado

  const timer = setTimeout(() => {
    setToastsShown(true);  // ← Marca como mostrado
    // ... disparar toasts
  }, 0);

  return () => clearTimeout(timer);
}, [..., toastsShown])  // ← Depende de toastsShown
```

---

## 💡 Dicas & Boas Práticas

### **1. Testar com Diferentes Dados**:

```bash
# Teste 1: Sem alertas
- Todos os vencimentos > 30 dias
- Resultado: Sino invisível

# Teste 2: Crítico simples
- 1 colaborador com 2+ vencidos
- Resultado: 1 toast crítico

# Teste 3: Múltiplos críticos
- 3+ colaboradores com vencidos
- Resultado: 1 toast, mas 3 no modal

# Teste 4: Volume crítico
- >5 vencidos total
- Resultado: Toast de volume

# Teste 5: Vencimento próximo
- Items vencendo em <=7 dias
- Resultado: Toast de aviso
```

### **2. Verificar Performance**:

```typescript
// React DevTools → Profiler
// Procure por:
- ✅ useMemo recalcula apenas quando deps mudam
- ✅ useEffect roda apenas 1x (toastsShown)
- ✅ Sem renders em cascata

// No console:
performance.mark('AlertsHub-start')
// ... operações
performance.mark('AlertsHub-end')
performance.measure('AlertsHub', 'AlertsHub-start', 'AlertsHub-end')
performance.getEntriesByName('AlertsHub')[0]
```

### **3. Customizar Toasts**:

```typescript
// Mudar duração
toast.error(message, { duration: 10000 }) // 10s

// Mudar posição em Toaster
<Toaster position="top-left" /> // top-left
<Toaster position="bottom-right" /> // bottom-right
<Toaster position="center" /> // center

// Adicionar descrição
toast.error(message, {
  description: "Descrição adicional",
  duration: 5000
})

// Adicionar ação
toast.success(message, {
  action: {
    label: "Undo",
    onClick: () => console.log("Undo!")
  }
})
```

### **4. Estender AlertsHub**:

```typescript
// Adicionar dismiss de alertas
export function AlertsHub({ ... }) {
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set())

  const visibleAlerts = alerts.filter(a => !dismissedIds.has(a.id))

  // ...
}

// Adicionar filtros no modal
<AlertsModalContent
  alerts={alerts}
  filters={{ severity: "critical" }}
/>
```

---

## ✅ Checklist de Validação

- [ ] Toast aparece ao carregar (5s)
- [ ] Sino visível quando há alertas
- [ ] Badge mostra contagem correta
- [ ] Modal abre ao clicar sino
- [ ] Alertas agrupados por severity
- [ ] Ícones e cores corretos
- [ ] Colaborador mostrado quando aplicável
- [ ] Scroll funciona no modal se houver muitos
- [ ] Fechar modal com X funciona
- [ ] Fechar modal clicando fora funciona
- [ ] Atualizar não dispara toasts novamente
- [ ] Responsivo em mobile
- [ ] Performance adequada
- [ ] Sem erros no console

---

## 🎓 Resumo

Agora você entende completamente como funciona o sistema de alertas:

- 📍 **Onde está**: Header (sino) e modal
- 🎯 **Como funciona**: Toast automático + modal sob demanda
- 🔔 **O quê mostra**: Alertas críticos (vencidos) e avisos (volume/próximo)
- ⚡ **Performance**: useMemo + useEffect otimizado
- 🎨 **Design**: Sino com badge, toasts, modal com agrupamento
- 🔧 **Técnica**: React hooks, TypeScript, Tailwind, shadcn/ui, sonner

**Parabéns!** Você agora é especialista no novo sistema de alertas! 🚀
