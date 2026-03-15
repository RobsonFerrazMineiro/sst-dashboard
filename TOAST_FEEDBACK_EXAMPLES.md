# 🎬 Toast Feedback - Exemplos de Implementação

## 1️⃣ Modal - Criar/Editar

### Exemplo: AddTreinamentoModal

```tsx
const mutation = useMutation({
  mutationFn: async () => {
    // ... requisição API
    if (initial?.id) {
      return api.treinamentos.update(initial.id, payload);
    }
    return api.treinamentos.create(payload);
  },
  onSuccess: async () => {
    // ✅ Toast de Sucesso
    toast.success(
      initial?.id ? "Treinamento atualizado!" : "Treinamento criado!",
    );
    await onSaved();
    onOpenChange(false);
  },
  onError: (err: any) => {
    // ❌ Toast de Erro
    toast.error(err?.message || "Erro ao salvar treinamento");
  },
});
```

---

## 2️⃣ Página - Deletar

### Exemplo: Página de Colaboradores

```tsx
const deleteMutation = useMutation({
  mutationFn: (id: string) => api.colaboradores.remove(id),
  onSuccess: async () => {
    // ✅ Toast de Sucesso
    toast.success("Colaborador excluído!");
    await qc.invalidateQueries({ queryKey: ["colaboradores"] });
  },
  onError: (err: unknown) => {
    // ❌ Toast de Erro
    toast.error(
      err instanceof Error ? err.message : "Erro ao excluir colaborador",
    );
  },
});
```

---

## 3️⃣ Toaster Configuration

### layout.tsx (Raiz)

```tsx
"use client";

import { Providers } from "@/providers/Provaiders";
import { Toaster } from "sonner";
import "./globals.css";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body>
        <Providers>{children}</Providers>
        {/* ✅ Configurado com richColors e posição fixa */}
        <Toaster richColors position="top-right" closeButton />
      </body>
    </html>
  );
}
```

---

## 4️⃣ Mensagens Personalizadas

### Padrão de Mensagens

| Ação    | Sucesso                     | Erro                           |
| ------- | --------------------------- | ------------------------------ |
| Criar   | "{Entidade} criado(a)!"     | "Erro ao salvar {entidade}"    |
| Editar  | "{Entidade} atualizado(a)!" | "Erro ao atualizar {entidade}" |
| Deletar | "{Entidade} excluído(a)!"   | "Erro ao excluir {entidade}"   |

---

## 5️⃣ Tipos de Toast Disponíveis

```tsx
import { toast } from "sonner";

// Sucesso
toast.success("Operação realizada com sucesso!");

// Erro
toast.error("Ocorreu um erro na operação");

// Info
toast.info("Informação importante");

// Loading (async)
toast.promise(promise, {
  loading: "Carregando...",
  success: "Sucesso!",
  error: "Erro!",
});
```

---

## 6️⃣ Checklist de Verificação

Para cada ação (create/update/delete), verificar:

- [ ] Import `{ toast } from "sonner"`
- [ ] Mutation tem `onSuccess` callback
- [ ] Mutation tem `onError` callback
- [ ] `toast.success()` é chamado em `onSuccess`
- [ ] `toast.error()` é chamado em `onError`
- [ ] Mensagem é clara e útil
- [ ] Queries são invalidadas quando necessário
- [ ] Modal/Página fecha após sucesso

---

## 7️⃣ Estrutura de Diretórios

```
src/
├── app/
│   ├── layout.tsx (✅ Toaster configurado)
│   └── (app)/
│       ├── colaboradores/
│       │   └── page.tsx (✅ Delete toast)
│       ├── tipos-aso/
│       │   └── page.tsx (✅ Delete toast)
│       ├── tipos-treinamento/
│       │   └── page.tsx (✅ Delete toast)
│       ├── asos/
│       │   └── page.tsx (✅ Delete toast)
│       └── treinamentos/
│           └── page.tsx (✅ Delete toast)
├── components/
│   ├── colaboradores/
│   │   ├── ColaboradorModal.tsx (✅ Create/Update toast)
│   │   ├── ColaboradorProfile.tsx (✅ Delete toast)
│   │   └── modals/
│   │       ├── AddASOModal.tsx (✅ Create/Update toast)
│   │       └── AddTreinamentoModal.tsx (✅ Create/Update toast)
│   └── tipos-*/
│       ├── TipoASOModal.tsx (✅ Create/Update toast)
│       └── TipoTreinamentoModal.tsx (✅ Create/Update toast)
```

---

## 8️⃣ Teste Manual

### Testar cada ação:

1. **Colaborador:**
   - [ ] Criar novo
   - [ ] Editar
   - [ ] Excluir

2. **Tipo de ASO:**
   - [ ] Criar novo
   - [ ] Editar
   - [ ] Excluir

3. **Tipo de Treinamento:**
   - [ ] Criar novo
   - [ ] Editar
   - [ ] Excluir

4. **Treinamento (de Colaborador):**
   - [ ] Adicionar
   - [ ] Editar
   - [ ] Excluir

5. **ASO (de Colaborador):**
   - [ ] Adicionar
   - [ ] Editar
   - [ ] Excluir

6. **Página Geral:**
   - [ ] Excluir Treinamento
   - [ ] Excluir ASO

---

**Status:** ✅ Tudo implementado e funcionando!
