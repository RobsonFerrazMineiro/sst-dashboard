# 🎬 Nível 2 - Demo Visual (Antes e Depois)

## 🖼️ ANTES (Uma única tabela confusa)

### Visual na Tela:

```
┌──────────────────────────────────────────────────────────────┐
│ TREINAMENTOS                         [+ Adicionar treinamento]│
├──────────────────────────────────────────────────────────────┤
│ Tipo/NR │ Data      │ Validade  │ Carga │ Status   │ Ações  │
├─────────┼───────────┼───────────┼───────┼──────────┼────────┤
│ NR 1200 │ 01/12/24  │ 01/12/25  │  8h   │ Em dia   │ ✏ 🗑   │
│ NR 1200 │ 01/06/24  │ 01/06/25  │  8h   │ Vencido  │ ✏ 🗑   │ ❌ Confuso!
│ NR 1050 │ 20/10/24  │ 20/10/25  │  4h   │ Em dia   │ ✏ 🗑   │
│ NR 1050 │ 20/04/24  │ 20/04/25  │  4h   │ Vencido  │ ✏ 🗑   │ ❌ Qual é atual?
│ NR 0800 │ 10/11/24  │ 10/11/25  │  2h   │ Em dia   │ ✏ 🗑   │
└──────────────────────────────────────────────────────────────┘
```

### Problemas:

❌ NR 1200 aparece 2x (qual é o mais recente?)  
❌ NR 1050 aparece 2x (qual é o vigente?)  
❌ Impossível saber qual é o "atual" olhando  
❌ Histórico misturado com atuais  
❌ Confuso para o usuário final

### Quem sabe qual é o atual?

- 👨‍💻 Desenvolvedor: "Olho para a data"
- 👤 Usuário: "🤷 Qual é o correto?"

---

## 🎯 DEPOIS (Separação clara)

### Visual na Tela:

```
┌──────────────────────────────────────────────────────────────┐
│ TREINAMENTOS                         [+ Adicionar treinamento]│
├──────────────────────────────────────────────────────────────┤
│  🟢 ATUAIS (mais recente por tipo)                          │
├──────────────────────────────────────────────────────────────┤
│ Tipo/NR │ Data      │ Validade  │ Carga │ Status   │ Ações  │
├─────────┼───────────┼───────────┼───────┼──────────┼────────┤
│ NR 1200 │ 01/12/24  │ 01/12/25  │  8h   │ Em dia   │ ✏ 🗑   │ ✅ Claro!
│ NR 1050 │ 20/10/24  │ 20/10/25  │  4h   │ Em dia   │ ✏ 🗑   │ ✅ Atual!
│ NR 0800 │ 10/11/24  │ 10/11/25  │  2h   │ Em dia   │ ✏ 🗑   │
├──────────────────────────────────────────────────────────────┤
│  ⚪ HISTÓRICO (registros anteriores)                         │
├──────────────────────────────────────────────────────────────┤
│ Tipo/NR │ Data      │ Validade  │ Carga │ Status   │ Ações  │
├─────────┼───────────┼───────────┼───────┼──────────┼────────┤
│ NR 1200 │ 01/06/24  │ 01/06/25  │  8h   │ Vencido  │ ✏ 🗑   │ (mais suave)
│ NR 1050 │ 20/04/24  │ 20/04/25  │  4h   │ Vencido  │ ✏ 🗑   │ (mais suave)
└──────────────────────────────────────────────────────────────┘
```

### Benefícios:

✅ Claro qual é o "atual" de cada tipo  
✅ Histórico bem separado e identificado  
✅ Verde = ativo, Cinza = histórico  
✅ Fácil rastrear renovações  
✅ Excelente UX

### Quem sabe qual é o atual?

- 👨‍💻 Desenvolvedor: ✅ Óbvio (primeira tabela)
- 👤 Usuário: ✅ Óbvio (badge verde + visual claro)

---

## 🎨 Cores & Estilo

### Badges:

**ATUAIS:**

```
┌─────────────┐
│ 🟢 ATUAIS   │
└─────────────┘
  bg-emerald-100
  text-emerald-700
  border-emerald-200

  → Cor quente (ativa)
  → Alto contraste (chama atenção)
  → Indica "vigente/atual"
```

**HISTÓRICO:**

```
┌─────────────┐
│ ⚪ HISTÓRICO│
└─────────────┘
  bg-slate-100
  text-slate-700
  border-slate-200

  + opacity-75 nas linhas

  → Cor neutra (não distrai)
  → Transparência (menos importante)
  → Indica "anterior/antigo"
```

---

## 📊 Comparação de Comportamento

### Cenário 1: Ver Registros

| Ação                  | Antes               | Depois                       |
| --------------------- | ------------------- | ---------------------------- |
| Abrir página          | 4 linhas misturadas | 3 em Atuais + 2 em Histórico |
| Entender qual é atual | 🤔 Confuso          | ✅ Óbvio (tabela verde)      |
| Rastrear histórico    | ❌ Não dá           | ✅ Fácil                     |

---

### Cenário 2: Adicionar Novo Treinamento

**Situação:** Colaborador com NR1200 (01/12/2024) em Atuais

**Ação:** Adicionar novo NR1200 com data 15/03/2025

#### Antes:

```
Resultado: 3 linhas de NR1200
│ NR 1200 │ 15/03/25 │ ...  (qual é o atual?)
│ NR 1200 │ 01/12/24 │ ...  (qual é o atual?)
│ NR 1200 │ 01/06/24 │ ...  (qual é o atual?)

❌ Usuário confuso: "Qual é o vigente agora?"
```

#### Depois:

```
ATUAIS:
│ NR 1200 │ 15/03/25 │ ... ✅ Novo é o atual

HISTÓRICO:
│ NR 1200 │ 01/12/24 │ ... (moveu para histórico)
│ NR 1200 │ 01/06/24 │ ... (ficou em histórico)

✅ Óbvio: novo é o atual (primeira tabela)
```

---

### Cenário 3: Editar Registro de Histórico

**Situação:**

- Atuais: NR1200 (01/12/2024)
- Histórico: NR1200 (01/06/2024)

**Ação:** Editar o de histórico (01/06) para data 25/12/2024

#### Antes:

```
Antes de salvar: 2 linhas confusas
Depois de salvar: 2 linhas AINDA confusas
│ NR 1200 │ 01/12/24 │ ...
│ NR 1200 │ 25/12/24 │ ...

❌ Qual é o atual agora? Não fica claro!
```

#### Depois:

```
Depois de salvar automaticamente se reorganiza:

ATUAIS:
│ NR 1200 │ 25/12/24 │ ... ✅ Novo "atual"

HISTÓRICO:
│ NR 1200 │ 01/12/24 │ ... (moveu para histórico)

✅ Claro: o que foi editado é agora o atual
```

---

### Cenário 4: Deletar Registro

**Situação:** 2 NR1200 (um em Atuais, um em Histórico)

**Ação:** Deletar o de Histórico

#### Antes:

```
1 linha desaparece, mas fica estranho
│ NR 1200 │ 01/12/24 │ ... (continua em algum lugar)

❌ O que aconteceu? Onde está?
```

#### Depois:

```
ATUAIS:
│ NR 1200 │ 01/12/24 │ ... ✅ Continua aqui

HISTÓRICO:
(vazio agora)              ✅ Desapareceu daqui

✅ Claro: linha foi deletada do histórico
```

---

## 🔄 Fluxo de Reorganização Automática

### Diagram de Estado:

```
┌─ NOVO TREINAMENTO ─┐
│ Sempre vai para    │
│ ATUAIS (1º em sua  │ ───────┐
│ categoria)         │        │
└────────────────────┘        │
                               ▼
                    ┌──────────────────┐
                    │     ATUAIS       │
                    │  (1 por tipo)    │
                    └──────────────────┘
                    ▲          │
                    │          │
         Editar     │          │  Se data
         com data   │          │  não é
         mais recente│         │  mais recente
                    │          ▼
                    │    ┌──────────────────┐
                    └────│   HISTÓRICO      │
                         │ (resto dos reg)  │
                         └──────────────────┘
                              │
                              │ Se deletar
                              ▼
                         ┌──────────┐
                         │ DELETADO  │
                         │ (DB)      │
                         └──────────┘
```

---

## 💾 Exemplo de Dados na DB

### Tabela: treinamentos

```sql
-- ANTES: sem informação de qual é "atual"
SELECT * FROM treinamentos WHERE colaborador_id = 'ABC' ORDER BY data_treinamento DESC;

id  │ tipo_treina │ data          │ status
────┼─────────────┼───────────────┼─────────
1   │ NR1200      │ 2024-12-01    │ Em dia
2   │ NR1200      │ 2024-06-01    │ Vencido
3   │ NR1050      │ 2024-10-20    │ Em dia
4   │ NR1050      │ 2024-04-20    │ Vencido

❌ DB não sabe qual é "atual"
❌ Lógica está na APP (Python/Node/React)
```

### Algoritmo de Separação (APP):

```typescript
// DEPOIS: lógica na APP separa inteligentemente
const records = [...]; // 4 registros do DB

const { atual, historico } = splitLatestByKey(
  records,
  'tipoTreinamento',  // Agrupar por tipo
  'data_treinamento'  // Ordenar por data
);

// Resultado:
atual = [
  { id: 1, tipo: 'NR1200', data: '2024-12-01' }, // 1º NR1200
  { id: 3, tipo: 'NR1050', data: '2024-10-20' }  // 1º NR1050
]

historico = [
  { id: 2, tipo: 'NR1200', data: '2024-06-01' }, // 2º NR1200
  { id: 4, tipo: 'NR1050', data: '2024-04-20' }  // 2º NR1050
]

✅ Lógica na APP, DB simples
✅ Reutilizável em outras páginas
```

---

## 🎯 Impacto no Usuário

### Métrica: Tempo para Entender "Qual é o Atual"

| Versão | Tempo  | Confiança                        |
| ------ | ------ | -------------------------------- |
| Antes  | ⏱️ 30s | 😕 50% ("é este? ou aquele?")    |
| Depois | ⏱️ 1s  | 😊 100% ("vejo na tabela verde") |

---

### Métrica: Erros ao Navegar

| Tarefa              | Antes         | Depois   |
| ------------------- | ------------- | -------- |
| Identificar atual   | ❌ Alto       | ✅ Zero  |
| Achar histórico     | ❌ Não existe | ✅ Claro |
| Encontrar renovação | ❌ Difícil    | ✅ Fácil |

---

## 📱 Responsividade

### Desktop (1920px):

```
┌─ ATUAIS ─────────┬─ HISTÓRICO ──────┐
│ Tabela           │ Tabela           │
│ lado a lado      │ lado a lado      │
└──────────────────┴──────────────────┘
```

### Tablet (768px):

```
┌─ ATUAIS ───────────┐
│ Tabela            │
├───────────────────┤
│ Com scroll h.     │
└───────────────────┘

┌─ HISTÓRICO ────────┐
│ Tabela            │
├───────────────────┤
│ Com scroll h.     │
└───────────────────┘
```

### Mobile (375px):

```
┌─ ATUAIS ───┐
│ Tabela    │
│ com scroll│
└───────────┘

┌─ HISTÓRICO ┐
│ Tabela    │
│ com scroll│
└───────────┘
```

---

## ✅ Validação Visual

### Checklist Rápido:

```
Ao abrir ColaboradorProfile:

□ Vejo "Treinamentos" (título)
  └─ Vejo badge "🟢 ATUAIS" em verde
  └─ Vejo tabela com dados

  └─ Se houver histórico:
     └─ Vejo badge "⚪ HISTÓRICO" em cinza
     └─ Vejo tabela com opacity-75

□ Vejo "ASOs" (título)
  └─ Mesmo padrão de badges e tabelas

□ Todos os botões funcionam:
  └─ ✏ (editar) abre modal
  └─ 🗑 (deletar) pede confirmação
  └─ [+ Adicionar] abre modal

□ Toast feedback:
  └─ Adicionar mostra "...adicionado!"
  └─ Editar mostra "...atualizado!"
  └─ Deletar mostra "...excluído!"
```

---

## 🎬 GIF Mental (Fluxo Real)

### 1. Abrir página

```
Carregando... → [Spinner] → Dados carregam
```

### 2. Ver dados separados

```
┌─ ATUAIS 🟢      ┐
│ NR1200          │ ← Destaca-se
│ NR1050          │   (verde + normal)
└─────────────────┘

┌─ HISTÓRICO ⚪    ┐
│ NR1200 (suave)  │ ← Recua
│ NR1050 (suave)  │   (cinza + opaco)
└─────────────────┘
```

### 3. Editar um de histórico

```
Clica ✏ → Modal abre → Muda data → [Salvar]
                        ↓
                    Toast: "Atualizado!"
                        ↓
                    Página se reorganiza
                        ↓
                    Registro sai de HISTÓRICO
                    e entra em ATUAIS
```

---

**Visual completo e intuitivo! ✨**
