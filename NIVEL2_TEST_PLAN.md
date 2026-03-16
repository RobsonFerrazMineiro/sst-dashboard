# 🧪 Nível 2 - Teste e Validação

## 📋 Plano de Testes

### ✅ Test Suite 1: Separação de Dados

#### Test 1.1: Treinamentos Atuais Aparecem

**Pré-condição:** Colaborador com 3+ treinamentos do mesmo tipo
**Passos:**

1. Navegar para ColaboradorProfile de um colaborador
2. Verificar seção "Treinamentos"
3. Verificar que existe badge "Atuais" em verde

**Esperado:**

- ✅ Apenas 1 registro de cada tipo em "Atuais"
- ✅ O registro exibido é o mais recente
- ✅ Badge verde com "Atuais"

**Validação:**

```
SELECT * FROM treinamentos WHERE colaborador_id = ? ORDER BY data_treinamento DESC
└─ Primeiro resultado de cada tipo deve estar em "Atuais"
```

---

#### Test 1.2: Histórico Aparece Corretamente

**Pré-condição:** Colaborador com 3+ treinamentos do mesmo tipo
**Passos:**

1. Navegar para ColaboradorProfile
2. Role para baixo na seção Treinamentos
3. Verificar se existe seção "Histórico"

**Esperado:**

- ✅ Seção "Histórico" aparece APENAS se houver registros anteriores
- ✅ Badge cinza com "Histórico"
- ✅ Registros com opacity-75 (mais suave)
- ✅ Contém todos exceto os atuais

**Validação:**

```
Atuais + Histórico = Total de registros
```

---

#### Test 1.3: Separação Correta por Tipo

**Pré-condição:**

- 2x NR1200 (01/12/2024, 01/06/2024)
- 2x NR1050 (15/10/2024, 15/05/2024)

**Passos:**

1. Navegar para ColaboradorProfile
2. Contar registros em "Atuais"

**Esperado:**

- ✅ "Atuais" tem 2 linhas (1 NR1200 + 1 NR1050)
- ✅ "Histórico" tem 2 linhas (1 NR1200 + 1 NR1050)
- ✅ NR1200 do 01/12 está em Atuais
- ✅ NR1200 do 01/06 está em Histórico

---

### ✅ Test Suite 2: Operações CRUD (Treinamentos)

#### Test 2.1: Adicionar Novo Treinamento

**Passos:**

1. Ir para ColaboradorProfile
2. Clicar "[+ Adicionar treinamento]"
3. Preencher modal:
   - Tipo: "NR 1200"
   - Data: "15/03/2026"
   - Validade: "15/03/2027"
   - Carga: "8"
4. Clicar "[Salvar]"

**Esperado:**

- ✅ Modal fecha
- ✅ Toast: "Treinamento adicionado!"
- ✅ Novo registro aparece em "Atuais"
- ✅ Se havia outro NR1200, aquele vai para "Histórico"

**Validação Visual:**

```
ANTES: Atuais [1], Histórico [1]
DEPOIS: Atuais [1], Histórico [2]
```

---

#### Test 2.2: Editar Treinamento (manter em Atuais)

**Pré-condição:** NR1200 em "Atuais" com data 01/12/2024

**Passos:**

1. Clicar ✏ (editar) no registro
2. Modal abre
3. Mudar "Carga horária" de 8 para 6
4. Salvar

**Esperado:**

- ✅ Toast: "Treinamento atualizado!"
- ✅ Registro continua em "Atuais"
- ✅ Campo "Carga" agora mostra "6"

---

#### Test 2.3: Editar Histórico para Atual

**Pré-condição:**

- Atuais: NR1200 com data 01/12/2024
- Histórico: NR1200 com data 01/06/2024

**Passos:**

1. Clicar ✏ em NR1200 do histórico (01/06/2024)
2. Modal abre
3. Mudar data para "25/12/2024" (mais recente que 01/12)
4. Salvar

**Esperado:**

- ✅ Toast: "Treinamento atualizado!"
- ✅ Registro SE MOVE para "Atuais"
- ✅ Antigo (01/12) VA PARA "Histórico"
- ✅ Ordem: nova data mais recente primeiro

**Validação:**

```
ANTES: Atuais [01/12], Histórico [01/06]
DEPOIS: Atuais [25/12], Histórico [01/12]
```

---

#### Test 2.4: Deletar Treinamento

**Passos:**

1. Clicar 🗑 (lixeira) em qualquer registro
2. AlertDialog: "Excluir treinamento?"
3. Clicar "[Excluir]"

**Esperado:**

- ✅ Toast: "Treinamento excluído!"
- ✅ Registro desaparece
- ✅ Se era o único em "Atuais", tabela mostra "Nenhum treinamento atual"

---

### ✅ Test Suite 3: Operações CRUD (ASOs)

#### Test 3.1: Adicionar novo ASO

**Passos:**

1. Ir para seção "ASOs"
2. Clicar "[+ Adicionar ASO]"
3. Preencher modal:
   - Tipo: "Clínica X"
   - Data: "15/03/2026"
   - Validade: "15/03/2027"
   - Clínica: "Clínica X"
4. Salvar

**Esperado:**

- ✅ Toast: "ASO adicionado!"
- ✅ Registro aparece em "Atuais"
- ✅ Antigos vão para "Histórico"

---

#### Test 3.2: Editar ASO

**Passos:**

1. Clicar ✏ em um ASO
2. Mudar "Clínica" campo
3. Salvar

**Esperado:**

- ✅ Toast: "ASO atualizado!"
- ✅ Campo reflete mudança

---

#### Test 3.3: Deletar ASO

**Passos:**

1. Clicar 🗑 em um ASO
2. Confirmar em AlertDialog
3. Clicar "[Excluir]"

**Esperado:**

- ✅ Toast: "ASO excluído!"
- ✅ Registro desaparece

---

### ✅ Test Suite 4: Renderização & Visual

#### Test 4.1: Badges Aparecem Corretamente

**Passos:**

1. Navegar para ColaboradorProfile com múltiplos registros

**Esperado:**

- ✅ Badge "Atuais" em verde (emerald)
  - `bg-emerald-100 text-emerald-700`
- ✅ Badge "Histórico" em cinza (slate)
  - `bg-slate-100 text-slate-700`
- ✅ Histórico condicional (não aparece se vazio)

---

#### Test 4.2: Responsividade

**Passos:**

1. Abrir em desktop (1920px)
2. Verificar layout
3. Redimensionar para mobile (375px)
4. Verificar que tabelas ainda funciona

**Esperado:**

- ✅ Desktop: tabelas lado a lado, sem scroll horizontal
- ✅ Mobile: scroll horizontal com boa UX
- ✅ Buttons acessíveis em ambos

---

#### Test 4.3: Loading State

**Passos:**

1. Abrir ColaboradorProfile
2. Observar durante carregamento

**Esperado:**

- ✅ Enquanto carrega: "Carregando..." em ambas tabelas
- ✅ Após carregamento: dados aparecem

---

### ✅ Test Suite 5: Lógica de Agrupamento

#### Test 5.1: Múltiplos Tipos (Treinamentos)

**Pré-condição:**

```
BD:
- NR1200_1: data 01/12/2024
- NR1200_2: data 01/06/2024
- NR1050_1: data 20/10/2024
- NR1050_2: data 20/04/2024
- NR0800_1: data 10/11/2024
```

**Esperado em Atuais:**

```
- NR1200_1 (01/12/2024)
- NR1050_1 (20/10/2024)
- NR0800_1 (10/11/2024)
```

**Esperado em Histórico:**

```
- NR1200_2 (01/06/2024)
- NR1050_2 (20/04/2024)
```

---

#### Test 5.2: Múltiplos Tipos (ASOs)

**Pré-condição:**

```
BD:
- CLINICA_X_1: data 01/12/2024
- CLINICA_X_2: data 01/06/2024
- CLINICA_Y_1: data 20/10/2024
- CLINICA_Y_2: data 20/04/2024
```

**Esperado em Atuais:**

```
- CLINICA_X_1
- CLINICA_Y_1
```

**Esperado em Histórico:**

```
- CLINICA_X_2
- CLINICA_Y_2
```

---

### ✅ Test Suite 6: Edge Cases

#### Test 6.1: Sem Dados

**Pré-condição:** Colaborador novo sem registros

**Esperado:**

- ✅ Seção "Atuais" mostra "Nenhum treinamento atual"
- ✅ Seção "Histórico" NÃO aparece
- ✅ Botões "[+ Adicionar]" funcionam

---

#### Test 6.2: Apenas 1 Registro por Tipo

**Pré-condição:** 1x NR1200, 1x NR1050, etc

**Esperado:**

- ✅ Todos em "Atuais"
- ✅ "Histórico" não aparece (vazio)

---

#### Test 6.3: Null em Tipo

**Pré-condição:** Registro com tipoTreinamento = null

**Esperado:**

- ✅ Agrupa null como uma "chave única"
- ✅ Máximo 1 registro com null em "Atuais"
- ✅ Demais null vão para "Histórico"

---

#### Test 6.4: Data Igual

**Pré-condição:** 2 registros do mesmo tipo COM A MESMA data

**Esperado:**

- ✅ Um fica em "Atuais" (primeira encontrada no sort)
- ✅ Outro vai para "Histórico"
- ✅ Comportamento determinístico

---

### ✅ Test Suite 7: Toast Feedback

#### Test 7.1: Toast em Adicionar

**Esperado:**

- ✅ "Treinamento adicionado!" (sucesso) - verde
- ✅ "Erro ao adicionar treinamento" (erro) - vermelho

---

#### Test 7.2: Toast em Editar

**Esperado:**

- ✅ "Treinamento atualizado!" (sucesso)
- ✅ "Erro ao atualizar treinamento" (erro)

---

#### Test 7.3: Toast em Deletar

**Esperado:**

- ✅ "Treinamento excluído!" (sucesso)
- ✅ "Erro ao excluir treinamento" (erro)

---

## 🔧 Executar Testes

### Teste Manual (Recomendado Primeiro)

```bash
# 1. Navegar até um colaborador
cd http://localhost:3000/colaboradores/[id]

# 2. Abrir DevTools (F12)
# 3. Ir à aba "Network" e "Console"

# 4. Executar cada teste acima
# 5. Verificar:
#    - Estado visual (badges, tabelas)
#    - Toasts aparecem
#    - Network: requests esperadas
#    - Console: sem erros
```

### Teste Automatizado (Futuro)

```typescript
// src/__tests__/ColaboradorProfile.test.tsx (exemplo)

describe("ColaboradorProfile - Nível 2", () => {
  it("should separate treinamentos into atual and historico", () => {
    const treinamentos = [
      { tipoTreinamento: "NR1200", data_treinamento: "2024-12-01" },
      { tipoTreinamento: "NR1200", data_treinamento: "2024-06-01" },
    ];

    const { atual, historico } = splitLatestByKey(
      treinamentos,
      "tipoTreinamento",
      "data_treinamento",
    );

    expect(atual).toHaveLength(1);
    expect(historico).toHaveLength(1);
    expect(atual[0].data_treinamento).toBe("2024-12-01");
  });
});
```

---

## 📊 Resultado Esperado Final

### Telas Finais Esperadas:

**Tela 1: ColaboradorProfile - Treinamentos**

```
┌────────────────────────────────────────────┐
│ 🟢 ATUAIS                                  │
├────────────────────────────────────────────┤
│ NR 1200 │ 01/12/2024 │ 01/12/2025 │ 8h   │
│ NR 1050 │ 20/10/2024 │ 20/10/2025 │ 4h   │
│ NR 0800 │ 10/11/2024 │ 10/11/2025 │ 2h   │
└────────────────────────────────────────────┘

┌────────────────────────────────────────────┐
│ ⚪ HISTÓRICO                               │
├────────────────────────────────────────────┤
│ NR 1200 │ 01/06/2024 │ 01/06/2025 │ 8h   │
│ NR 1050 │ 20/04/2024 │ 20/04/2025 │ 4h   │
└────────────────────────────────────────────┘
   (texto mais suave - opacity 75%)
```

**Tela 2: ColaboradorProfile - ASOs**

```
┌────────────────────────────────────────────┐
│ 🟢 ATUAIS                                  │
├────────────────────────────────────────────┤
│ Clínica X │ 01/12/2024 │ 01/12/2025 │... │
│ Clínica Y │ 20/10/2024 │ 20/10/2025 │... │
└────────────────────────────────────────────┘

┌────────────────────────────────────────────┐
│ ⚪ HISTÓRICO                               │
├────────────────────────────────────────────┤
│ Clínica X │ 01/06/2024 │ 01/06/2025 │... │
└────────────────────────────────────────────┘
```

---

## ✅ Checklist Final

Antes de mergear para main:

- [ ] Test 1.1: Atuais aparecem
- [ ] Test 1.2: Histórico aparece
- [ ] Test 1.3: Separação por tipo correta
- [ ] Test 2.1: Adicionar funciona
- [ ] Test 2.2: Editar mantém em Atuais
- [ ] Test 2.3: Editar move para Atuais
- [ ] Test 2.4: Deletar funciona
- [ ] Test 3.1: ASOs adicionar funciona
- [ ] Test 3.2: ASOs editar funciona
- [ ] Test 3.3: ASOs deletar funciona
- [ ] Test 4.1: Badges corretos
- [ ] Test 4.2: Responsivo
- [ ] Test 4.3: Loading state OK
- [ ] Test 5.1: Múltiplos tipos (tre)
- [ ] Test 5.2: Múltiplos tipos (aso)
- [ ] Test 6.1: Sem dados
- [ ] Test 6.2: Apenas 1 por tipo
- [ ] Test 6.3: Null em tipo
- [ ] Test 6.4: Datas iguais
- [ ] Test 7.1-7.3: Toasts funcionam

---

**Status:** 🔄 Pronto para testes em staging
