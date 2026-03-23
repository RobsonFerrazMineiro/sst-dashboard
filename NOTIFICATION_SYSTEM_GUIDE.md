# Guia de Uso: Sistema de Notificações Melhorado

## Visão Geral

O novo sistema de notificações foi projetado para:

- ✅ Evitar repetição de toasts ao navegar entre páginas
- ✅ Deduplicar notificações com base em ID único
- ✅ Persistir histórico em localStorage
- ✅ Disparar toasts apenas em mudanças reais
- ✅ Comparar estado atual vs anterior
- ✅ Prevenir poluição da interface

## Componentes Principais

### 1. NotificationManager

Gerencia o ciclo de vida das notificações com deduplicação automática.

**Arquivo**: `src/lib/notification-manager.ts`

**Características**:

- Deduplicação por ID + hash do conteúdo
- Persistência em localStorage
- Limpeza automática de notificações antigas (>24h)
- Timeout configurável por notificação

### 2. Hooks de Notificação

Facilitam o uso em componentes React.

**Arquivo**: `src/lib/notification-hooks.ts`

**Hooks disponíveis**:

- `useNotifyOnChange` - Notifica mudanças de estado
- `useNotifyMutationError` - Notifica erros sem repetição
- `useNotifyMutationSuccess` - Notifica sucesso apenas uma vez
- `useStateComparison` - Compara mudanças complexas

## Exemplos de Uso

### Exemplo 1: Notificação Simples com Deduplicação

```typescript
import { toastNotification } from "@/lib/notification-manager";

// Dispara notificação apenas uma vez a cada 5 segundos
toastNotification.success("Salvo com sucesso!", {
  id: "colaborador_saved", // ID único para deduplicação
  deduplicateFor: 5000,
});
```

### Exemplo 2: Usar em Mutation

```typescript
import { useMutation } from "@tanstack/react-query";
import { useNotifyMutationSuccess, useNotifyMutationError } from "@/lib/notification-hooks";

function MyComponent() {
  const mutation = useMutation({
    mutationFn: async (data) => {
      const response = await fetch("/api/save", { method: "POST", body: JSON.stringify(data) });
      return response.json();
    },
  });

  // Notifica sucesso apenas uma vez
  useNotifyMutationSuccess(mutation.isSuccess, {
    id: "save_operation",
    message: "Dados salvos com sucesso!",
  });

  // Notifica erro sem repetição
  useNotifyMutationError(mutation.error, {
    id: "save_error",
    message: "Erro ao salvar dados",
  });

  return (
    <button onClick={() => mutation.mutate({ name: "João" })}>
      Salvar
    </button>
  );
}
```

### Exemplo 3: Notificar Mudança de Estado

```typescript
import { useNotifyOnChange } from "@/lib/notification-hooks";

function CollaboratorForm({ colaborador }) {
  const { resetNotification } = useNotifyOnChange(colaborador, {
    onSuccess: (current, previous) => ({
      type: "success",
      id: `colaborador_${colaborador.id}_changed`,
      message: "Colaborador atualizado",
      description: `${previous?.name || "Novo"} → ${current.name}`,
      deduplicateFor: 5000,
    }),
  });

  // ...
}
```

### Exemplo 4: Comparação Customizada

```typescript
import { useStateComparison } from "@/lib/notification-hooks";

function TrainingStatus({ training }) {
  useStateComparison(training, {
    getNotification: (changes) => {
      if (changes.status === "Vencido") {
        return {
          type: "error",
          id: `training_expired_${training.id}`,
          message: "Atenção: Treinamento venceu",
          deduplicateFor: 10000,
        };
      }
      if (changes.validade) {
        return {
          type: "warning",
          id: `training_date_changed_${training.id}`,
          message: "Data de validade alterada",
          deduplicateFor: 5000,
        };
      }
      return null;
    },
  });

  // ...
}
```

### Exemplo 5: Usar com React Query

```typescript
import { useQuery } from "@tanstack/react-query";
import { useNotifyMutationError } from "@/lib/notification-hooks";

function DashboardData() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["dashboard"],
    queryFn: fetchDashboard,
  });

  // Notifica erro uma única vez por tipo de erro
  useNotifyMutationError(error, {
    id: "dashboard_fetch_error",
    message: "Erro ao carregar dashboard",
  });

  if (isLoading) return <div>Carregando...</div>;
  if (error) return <div>Erro ao carregar</div>;

  return <div>{/* dados */}</div>;
}
```

## Comportamento de Deduplicação

### Como Funciona

1. **ID Único**: Cada notificação tem um ID único
2. **Hash do Conteúdo**: Compara tipo + mensagem + descrição
3. **Timeout**: Tempo mínimo entre exibições da mesma notificação
4. **localStorage**: Persiste histórico para evitar repetição ao navegar

### Cenários

#### ✅ Notificação Exibida (Primeira Vez)

```
Nova notificação com ID não visto -> Exibe
```

#### ✅ Notificação Exibida (Mudança de Conteúdo)

```
Mesmo ID mas conteúdo diferente -> Exibe (novo conteúdo)
```

#### ❌ Notificação NÃO Exibida (Repetida)

```
Mesmo ID + mesmo conteúdo + dentro do timeout -> NÃO exibe
```

#### ✅ Notificação Exibida (Timeout Expirado)

```
Mesmo ID + mesmo conteúdo + APÓS timeout -> Exibe novamente
```

## Configuração de Timeout

### Padrões Recomendados

```typescript
// Informações rápidas
info("Ação realizada", { deduplicateFor: 3000 }); // 3 segundos

// Sucesso de operação
success("Salvo!", { deduplicateFor: 5000 }); // 5 segundos

// Erros importantes
error("Erro ao salvar", { deduplicateFor: 10000 }); // 10 segundos

// Avisos de vencimento
warning("Vencendo em breve", { deduplicateFor: 15000 }); // 15 segundos
```

## Limpeza de Histórico

### Manual

```typescript
import { toastNotification } from "@/lib/notification-manager";

// Limpar notificação específica
toastNotification.clearNotification("my_notification_id");

// Limpar tudo
toastNotification.clearAll();
```

### Automática

- Notificações antigas (>24h) são limpas automaticamente
- Executa a cada 1 minuto em background
- Mantém máximo de 100 notificações no localStorage

## Integração com Sonner

O sistema é baseado em `sonner`, mantendo compatibilidade total:

```typescript
import { toast } from "sonner"; // Ainda funciona como antes

// Novo sistema (recomendado)
import { toastNotification } from "@/lib/notification-manager";
toastNotification.success("Com deduplicação!");

// Sistema antigo (ainda suportado)
toast.success("Sem deduplicação");
```

## Melhores Práticas

### ✅ Fazer

1. **Use IDs Significativos**

   ```typescript
   toastNotification.success("Salvo!", {
     id: "training_123_saved", // Claro e específico
   });
   ```

2. **Defina Timeouts Apropriados**

   ```typescript
   toastNotification.error("Falha crítica", {
     deduplicateFor: 30000, // Avisos críticos duram mais
   });
   ```

3. **Use Hooks para Lógica Complexa**
   ```typescript
   useNotifyMutationSuccess(mutation.isSuccess, {
     /* config */
   });
   useNotifyMutationError(mutation.error, {
     /* config */
   });
   ```

### ❌ Não Fazer

1. **Não Use IDs Genéricos**

   ```typescript
   // ❌ RUIM - Vai deduplicar para todos
   toastNotification.success("Salvo!", { id: "success" });

   // ✅ BOM - Específico por recurso
   toastNotification.success("Salvo!", { id: "user_123_saved" });
   ```

2. **Não Ignore Deduplicação**

   ```typescript
   // ❌ RUIM - Vai poluir a tela
   asos.forEach((aso) => {
     toast.success("ASO carregado");
   });

   // ✅ BOM - Notifica uma vez por tipo de operação
   toastNotification.success("ASOs carregados!", {
     id: "asos_loaded",
   });
   ```

3. **Não Repita Chamadas**

   ```typescript
   // ❌ RUIM - Pode disparar múltiplas vezes
   if (mutation.isSuccess) {
     toast.success("Salvo!");
   }

   // ✅ BOM - Usa hook que garante apenas uma exibição
   useNotifyMutationSuccess(mutation.isSuccess);
   ```

## Debugging

### Visualizar Histórico Persistido

```typescript
// No console do navegador
localStorage.getItem("displayed_notifications");
```

### Limpar Histórico do Navegador

```typescript
// No console
localStorage.removeItem("displayed_notifications");
```

### Monitorar Notificações

```typescript
import { getNotificationManager } from "@/lib/notification-manager";

const manager = getNotificationManager();
console.log(manager); // Inspecionar estado interno
```

## Conclusão

Este sistema garante uma experiência melhor ao:

- ✅ Evitar spam de notificações
- ✅ Manter histórico entre navegações
- ✅ Comparar estado antes/depois
- ✅ Disparar apenas mudanças reais
- ✅ Permitir controle fino via IDs
