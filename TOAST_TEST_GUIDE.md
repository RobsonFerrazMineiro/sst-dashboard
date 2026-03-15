# 🧪 Guia de Teste - Toast Feedback

## 📋 Como Testar Todos os Toasts

---

## 1️⃣ AddTreinamentoModal (Create/Update)

### ✅ Teste 1: Criar Treinamento

```
PASSOS:
1. Acesse: /colaboradores/[id] (Perfil do colaborador)
2. Scroll down até "Treinamentos"
3. Clique em botão "+ Adicionar Treinamento"
4. Modal "Adicionar Treinamento" abre
5. Selecione "Tipo de Treinamento" (ex: NR-10)
6. Preencha "Data do Treinamento"
7. (Opcional) Preencha "Validade"
8. (Opcional) Preencha "Carga horária"
9. Clique em "Salvar"

RESULTADO ESPERADO:
✅ Toast verde no topo direito: "Treinamento criado!"
✅ Modal fecha
✅ Lista de treinamentos atualiza com novo item
✅ Toast desaparece após 5 segundos
```

### ✅ Teste 2: Editar Treinamento

```
PASSOS:
1. Na lista de treinamentos, clique no ✏️ (edit icon)
2. Modal abre com dados preenchidos
3. Modifique algum campo (ex: data)
4. Clique em "Salvar"

RESULTADO ESPERADO:
✅ Toast verde no topo direito: "Treinamento atualizado!"
✅ Modal fecha
✅ Lista atualiza com dados modificados
```

### ❌ Teste 3: Erro ao Salvar (Simular)

```
PASSOS:
1. Clique em "+ Adicionar Treinamento"
2. NÃO preencha nenhum campo
3. Clique em "Salvar"

RESULTADO ESPERADO:
❌ Toast vermelho no topo direito: "Erro ao salvar treinamento"
❌ Modal permanece aberto
❌ Validação de formulário aparece
```

---

## 2️⃣ AddASOModal (Create/Update)

### ✅ Teste 1: Criar ASO

```
PASSOS:
1. Acesse: /colaboradores/[id] (Perfil do colaborador)
2. Scroll down até "ASOs"
3. Clique em botão "+ Adicionar ASO"
4. Modal "Adicionar ASO" abre
5. Selecione "Tipo de ASO" (ex: Admissional)
6. Preencha "Data do ASO"
7. (Opcional) Preencha "Validade"
8. (Opcional) Preencha "Clínica"
9. (Opcional) Preencha "Observação"
10. Clique em "Salvar"

RESULTADO ESPERADO:
✅ Toast verde no topo direito: "ASO criado!"
✅ Modal fecha
✅ Lista de ASOs atualiza com novo item
```

### ✅ Teste 2: Editar ASO

```
PASSOS:
1. Na lista de ASOs, clique no ✏️ (edit icon)
2. Modal abre com dados preenchidos
3. Modifique algum campo
4. Clique em "Salvar"

RESULTADO ESPERADO:
✅ Toast verde no topo direito: "ASO atualizado!"
✅ Modal fecha
✅ Lista atualiza com dados modificados
```

---

## 3️⃣ Excluir Treinamento

### ✅ Teste 1: Excluir do Perfil

```
PASSOS:
1. Acesse perfil de colaborador: /colaboradores/[id]
2. Scroll até "Treinamentos"
3. Clique no ❌ (delete icon) de uma linha
4. Dialog de confirmação aparece
5. Clique em "Excluir" para confirmar

RESULTADO ESPERADO:
✅ Toast verde no topo direito: "Treinamento excluído!"
✅ Linha desaparece da tabela
✅ Lista atualiza automaticamente
```

### ✅ Teste 2: Excluir da Página Geral

```
PASSOS:
1. Acesse: /treinamentos (Página geral)
2. Localize um treinamento
3. Clique no ❌ (delete icon)
4. Dialog de confirmação aparece
5. Clique em "Excluir" para confirmar

RESULTADO ESPERADO:
✅ Toast verde no topo direito: "Treinamento excluído!"
✅ Linha desaparece da tabela
```

### ❌ Teste 3: Cancelar Exclusão

```
PASSOS:
1. Clique em ❌ de um treinamento
2. Dialog aparece
3. Clique em "Cancelar"

RESULTADO ESPERADO:
❌ Nenhum toast aparece
❌ Dialog fecha
❌ Treinamento permanece na lista
```

---

## 4️⃣ Excluir ASO

### ✅ Teste 1: Excluir do Perfil

```
PASSOS:
1. Acesse perfil de colaborador: /colaboradores/[id]
2. Scroll até "ASOs"
3. Clique no ❌ (delete icon) de uma linha
4. Dialog de confirmação aparece
5. Clique em "Excluir"

RESULTADO ESPERADO:
✅ Toast verde no topo direito: "ASO excluído!"
✅ Linha desaparece
✅ Lista atualiza
```

### ✅ Teste 2: Excluir da Página Geral

```
PASSOS:
1. Acesse: /asos (Página geral)
2. Localize um ASO
3. Clique no ❌ (delete icon)
4. Dialog de confirmação aparece
5. Clique em "Excluir"

RESULTADO ESPERADO:
✅ Toast verde no topo direito: "ASO excluído!"
✅ Linha desaparece
```

---

## 5️⃣ BÔNUS: Criar Colaborador

### ✅ Teste 1: Criar

```
PASSOS:
1. Acesse: /colaboradores (Página geral)
2. Clique em botão "+ Novo colaborador"
3. Modal "Novo colaborador" abre
4. Preencha:
   - Nome *
   - Setor *
   - Cargo *
   - Matrícula (opcional)
5. Clique em "Salvar"

RESULTADO ESPERADO:
✅ Toast verde no topo direito: "Colaborador criado!"
✅ Modal fecha
✅ Novo colaborador aparece na lista
```

### ✅ Teste 2: Editar

```
PASSOS:
1. Na lista, clique no ✏️ de um colaborador
2. Modal abre em modo EDITAR
3. Modifique algum campo
4. Clique em "Salvar"

RESULTADO ESPERADO:
✅ Toast verde no topo direito: "Colaborador atualizado!"
✅ Modal fecha
✅ Dados atualizam na lista
```

### ✅ Teste 3: Excluir

```
PASSOS:
1. Na lista, clique no 🗑️ (delete icon)
2. Dialog de confirmação aparece
3. Clique em "Excluir"

RESULTADO ESPERADO:
✅ Toast verde no topo direito: "Colaborador excluído!"
✅ Linha desaparece da lista
```

---

## 🎯 Checklist de Teste Completo

### Toast Success (Verde) ✅

- [ ] Criar Treinamento → "Treinamento criado!"
- [ ] Editar Treinamento → "Treinamento atualizado!"
- [ ] Excluir Treinamento → "Treinamento excluído!"
- [ ] Criar ASO → "ASO criado!"
- [ ] Editar ASO → "ASO atualizado!"
- [ ] Excluir ASO → "ASO excluído!"
- [ ] Criar Colaborador → "Colaborador criado!"
- [ ] Editar Colaborador → "Colaborador atualizado!"
- [ ] Excluir Colaborador → "Colaborador excluído!"
- [ ] Criar Tipo ASO → "Tipo de ASO criado!"
- [ ] Editar Tipo ASO → "Tipo de ASO atualizado!"
- [ ] Excluir Tipo ASO → "Tipo de ASO excluído!"
- [ ] Criar Tipo Treinamento → "Tipo de treinamento criado!"
- [ ] Editar Tipo Treinamento → "Tipo de treinamento atualizado!"
- [ ] Excluir Tipo Treinamento → "Tipo de treinamento excluído!"

### Toast Error (Vermelho) ❌

- [ ] Erro ao salvar Treinamento → Mensagem de erro
- [ ] Erro ao salvar ASO → Mensagem de erro
- [ ] Erro ao salvar Colaborador → Mensagem de erro
- [ ] Erro ao excluir → Mensagem de erro

### Comportamento do Toast

- [ ] Toast aparece no topo direito
- [ ] Toast tem cor rica (verde para sucesso, vermelho para erro)
- [ ] Toast tem botão de fechar (X)
- [ ] Toast desaparece automaticamente após 5 segundos
- [ ] Toast é legível em qualquer resolução

### Comportamento da UI

- [ ] Modal fecha após sucesso
- [ ] Modal permanece aberto em erro
- [ ] Lista atualiza após sucesso
- [ ] Queries são invalidadas corretamente
- [ ] Não há duplicatas na lista
- [ ] Ordem da lista é mantida

---

## 🐛 Possíveis Problemas e Soluções

### Problema 1: Toast não aparece

```
DIAGNÓSTICO:
❌ Toaster não está configurado no layout.tsx
❌ Import de "sonner" está faltando
❌ toast.success() não está sendo chamado

SOLUÇÃO:
✅ Verificar src/app/layout.tsx
✅ Confirmar: <Toaster richColors position="top-right" closeButton />
✅ Verificar imports: import { toast } from "sonner"
```

### Problema 2: Toast aparece mas desaparece muito rápido

```
DIAGNÓSTICO:
❌ Duração padrão é 5 segundos

SOLUÇÃO:
✅ Se quiser aumentar:
   toast.success("msg", { duration: 10000 })
```

### Problema 3: Modal não fecha após sucesso

```
DIAGNÓSTICO:
❌ onOpenChange() não está sendo chamada

SOLUÇÃO:
✅ Verificar: onOpenChange(false) em onSuccess
```

### Problema 4: Lista não atualiza

```
DIAGNÓSTICO:
❌ qc.invalidateQueries não está sendo chamada

SOLUÇÃO:
✅ Verificar em onSuccess:
   await qc.invalidateQueries({ queryKey: ["colaboradores"] })
```

---

## 📊 Métricas de Teste

| Teste               | Status | Data | Notas |
| ------------------- | ------ | ---- | ----- |
| Criar Treinamento   | ✅     |      |       |
| Editar Treinamento  | ✅     |      |       |
| Excluir Treinamento | ✅     |      |       |
| Criar ASO           | ✅     |      |       |
| Editar ASO          | ✅     |      |       |
| Excluir ASO         | ✅     |      |       |
| Criar Colaborador   | ✅     |      |       |
| Editar Colaborador  | ✅     |      |       |
| Excluir Colaborador | ✅     |      |       |

---

## 🎬 Vídeo de Teste (Roteiro)

```
1. ABRIR APLICAÇÃO (30s)
   - Acesse http://localhost:3000
   - Navegue para /colaboradores

2. CRIAR COLABORADOR (1min)
   - Clique "+ Novo colaborador"
   - Preencha dados
   - Salve
   - Verifique toast

3. EDITAR COLABORADOR (1min)
   - Clique edit em um colaborador
   - Modifique dados
   - Salve
   - Verifique toast

4. EDITAR PERFIL (2min)
   - Abra perfil de colaborador
   - Adicione treinamento
   - Verifique toast
   - Edite treinamento
   - Verifique toast
   - Exclua treinamento
   - Verifique toast

5. ADICIONAR ASO (2min)
   - Ainda no perfil
   - Adicione ASO
   - Verifique toast
   - Edite ASO
   - Verifique toast
   - Exclua ASO
   - Verifique toast

6. PÁGINAS GERAIS (2min)
   - Acesse /tipos-aso
   - Teste create/delete com toasts
   - Acesse /tipos-treinamento
   - Teste create/delete com toasts

TOTAL: ~8-10 MINUTOS DE TESTE
```

---

**Última atualização:** 15 de março de 2026  
**Status:** ✅ Pronto para teste completo
