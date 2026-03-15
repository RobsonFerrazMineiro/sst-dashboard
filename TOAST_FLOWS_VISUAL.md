# 🎬 Fluxos de Toast - Visualização

## 1️⃣ AddTreinamentoModal - Criar/Editar

```
┌─────────────────────────────────────────────────────────────┐
│ Usuário clica em "Adicionar Treinamento"                   │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│ Modal AddTreinamentoModal abre                             │
│ - Seleciona tipo de treinamento                            │
│ - Preenche data e validade                                 │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│ Usuário clica em "Salvar"                                  │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
        ┌────────────────┐
        │ mutation.mutate()
        └────────┬────────┘
                 │
        ┌────────┴────────┐
        ▼                 ▼
    ✅ SUCCESS      ❌ ERROR
        │                 │
        ▼                 ▼
  ┌─────────────┐  ┌──────────────────┐
  │ onSuccess:  │  │ onError:         │
  │             │  │                  │
  │ 🟢 toast    │  │ 🔴 toast.error() │
  │ .success    │  │                  │
  │ (          │  │ "Erro ao        │
  │ "Treina    │  │  salvar          │
  │  mento     │  │  treinamento"    │
  │  criado!"  │  │                  │
  │ )          │  │                  │
  │             │  │                  │
  │ ✅ Modal    │  │ ❌ Mostra erro   │
  │   fecha    │  │    no modal      │
  │             │  │                  │
  │ ✅ Lista    │  │ ⚠️ Usuário      │
  │   atualiza │  │    tenta novamente
  └─────────────┘  └──────────────────┘
```

---

## 2️⃣ AddASOModal - Criar/Editar

```
┌─────────────────────────────────────────────────────────────┐
│ Usuário clica em "Adicionar ASO"                           │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│ Modal AddASOModal abre                                     │
│ - Seleciona tipo de ASO                                    │
│ - Preenche data, validade, clínica                         │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│ Usuário clica em "Salvar"                                  │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
        ┌────────────────┐
        │ mutation.mutate()
        └────────┬────────┘
                 │
        ┌────────┴────────┐
        ▼                 ▼
    ✅ SUCCESS      ❌ ERROR
        │                 │
        ▼                 ▼
  ┌──────────────┐ ┌──────────────────┐
  │ onSuccess:   │ │ onError:         │
  │              │ │                  │
  │ 🟢 toast     │ │ 🔴 toast.error() │
  │ .success     │ │                  │
  │ ("ASO       │ │ "Erro ao        │
  │  criado!"  │ │  salvar ASO"     │
  │ )           │ │                  │
  │              │ │                  │
  │ ✅ Modal     │ │ ❌ Mostra erro   │
  │   fecha     │ │    no modal      │
  │              │ │                  │
  │ ✅ Lista     │ │ ⚠️ Usuário      │
  │   atualiza  │ │    tenta novamente
  └──────────────┘ └──────────────────┘
```

---

## 3️⃣ Excluir Treinamento - Perfil do Colaborador

```
┌──────────────────────────────────────────────────────────┐
│ Usuário clica em ❌ (excluir) na linha do Treinamento  │
└────────────────┬─────────────────────────────────────────┘
                 │
                 ▼
┌──────────────────────────────────────────────────────────┐
│ AlertDialog abre com confirmação                        │
│ "Tem certeza que deseja excluir este treinamento?"     │
└────────────────┬─────────────────────────────────────────┘
                 │
        ┌────────┴────────┐
        ▼                 ▼
  ┌─────────────┐  ┌────────────┐
  │ Cancelar    │  │ Excluir    │
  │ (fecha)     │  │ (confirma) │
  └─────────────┘  └──────┬─────┘
                          │
                          ▼
                   ┌──────────────┐
                   │ delTre       │
                   │ .mutate()    │
                   └────┬─────────┘
                        │
                ┌───────┴───────┐
                ▼               ▼
            ✅ SUCCESS    ❌ ERROR
                │               │
                ▼               ▼
        ┌───────────────┐ ┌──────────────┐
        │ onSuccess:    │ │ onError:     │
        │               │ │              │
        │ 🟢 toast      │ │ 🔴 toast     │
        │ .success      │ │ .error()     │
        │ ("Treina      │ │              │
        │  mento        │ │ "Erro ao     │
        │  excluído!"  │ │  excluir..."  │
        │ )             │ │              │
        │               │ │              │
        │ ✅ Lista      │ │ ⚠️ Tenta     │
        │   atualiza   │ │    novamente  │
        └───────────────┘ └──────────────┘
```

---

## 4️⃣ Excluir ASO - Página Geral

```
┌──────────────────────────────────────────────────────────┐
│ Usuário clica em ❌ (excluir) na linha do ASO           │
└────────────────┬─────────────────────────────────────────┘
                 │
                 ▼
┌──────────────────────────────────────────────────────────┐
│ AlertDialog abre com confirmação                        │
│ "Tem certeza que deseja excluir este ASO?"             │
└────────────────┬─────────────────────────────────────────┘
                 │
        ┌────────┴────────┐
        ▼                 ▼
  ┌─────────────┐  ┌────────────┐
  │ Cancelar    │  │ Excluir    │
  │ (fecha)     │  │ (confirma) │
  └─────────────┘  └──────┬─────┘
                          │
                          ▼
                   ┌──────────────┐
                   │ deleteMutation
                   │ .mutate()    │
                   └────┬─────────┘
                        │
                ┌───────┴───────┐
                ▼               ▼
            ✅ SUCCESS    ❌ ERROR
                │               │
                ▼               ▼
        ┌───────────────┐ ┌──────────────┐
        │ onSuccess:    │ │ onError:     │
        │               │ │              │
        │ 🟢 toast      │ │ 🔴 toast     │
        │ .success      │ │ .error()     │
        │ ("ASO         │ │              │
        │  excluído!"  │ │ "Erro ao     │
        │ )             │ │  excluir..."  │
        │               │ │              │
        │ ✅ Queries    │ │ ⚠️ Tenta     │
        │   invalidadas │ │    novamente  │
        │               │ │              │
        │ ✅ Lista      │ │              │
        │   atualiza   │ │              │
        └───────────────┘ └──────────────┘
```

---

## 5️⃣ Criar/Editar Colaborador - Bonus

```
┌──────────────────────────────────────────────────────────┐
│ Usuário clica em "Novo colaborador" ou no ✏️            │
└────────────────┬─────────────────────────────────────────┘
                 │
                 ▼
┌──────────────────────────────────────────────────────────┐
│ Modal ColaboradorModal abre                            │
│ - Modo CRIAR ou EDITAR                                  │
│ - Preenche: nome, setor, cargo, matrícula               │
└────────────────┬─────────────────────────────────────────┘
                 │
                 ▼
┌──────────────────────────────────────────────────────────┐
│ Usuário clica em "Salvar"                               │
└────────────────┬─────────────────────────────────────────┘
                 │
                 ▼
        ┌────────────────┐
        │ mutation.mutate()
        │ (CREATE/UPDATE)│
        └────────┬────────┘
                 │
        ┌────────┴────────┐
        ▼                 ▼
    ✅ SUCCESS      ❌ ERROR
        │                 │
        ▼                 ▼
  ┌──────────────┐ ┌──────────────────┐
  │ onSuccess:   │ │ onError:         │
  │              │ │                  │
  │ 🟢 toast     │ │ 🔴 toast.error() │
  │ .success     │ │                  │
  │ ("Colabor   │ │ "Erro ao        │
  │  ador       │ │  salvar"         │
  │  criado!"  │ │                  │
  │ or          │ │ ❌ Mostra erro   │
  │ "...atualiz│ │    no modal      │
  │  ado!"     │ │                  │
  │ )           │ │ ⚠️ Usuário      │
  │             │ │    tenta novamente
  │ ✅ Modal    │ │                  │
  │   fecha    │ │                  │
  │             │ │                  │
  │ ✅ Lista    │ │                  │
  │   atualiza │ │                  │
  └──────────────┘ └──────────────────┘
```

---

## 🎨 Posicionamento dos Toasts

```
                        ┌─────────────────────────────┐
                        │ 🟢 Colaborador criado!      │
                        │           [✕]               │
                        └─────────────────────────────┘
                        ┌─────────────────────────────┐
                        │ 🟢 Treinamento atualizado! │
                        │           [✕]               │
                        └─────────────────────────────┘


                        ┌─────────────────────────────┐
                        │ 🔴 Erro ao excluir ASO     │
                        │           [✕]               │
                        └─────────────────────────────┘

                    (Top-right position, rich colors)
```

---

## 📱 Responsividade

```
DESKTOP (1200px+)         TABLET (768px)           MOBILE (320px)
┌─────────────────────┐  ┌──────────────┐         ┌────────────┐
│ ✅ Toast no topo   │  │ ✅ Toast topo│         │ ✅ Toast   │
│    direito         │  │    direito   │         │    topo    │
│                    │  │              │         │    dir     │
│ Sem problemas      │  │ Bem posiciad │         │ Adaptado   │
│                    │  │   o          │         │   para     │
│                    │  │              │         │   tela     │
│                    │  │              │         │            │
└─────────────────────┘  └──────────────┘         └────────────┘
```

---

## 🔄 Fluxo Completo de Ação

```
┌─────────────────────────────────────────────────────────────────┐
│ USUÁRIO                                                         │
├─────────────────────────────────────────────────────────────────┤
│ 1. Clica em botão (Novo, Editar, Excluir)                      │
│ 2. Preenche formulário ou confirma ação                         │
│ 3. Clica em "Salvar" ou "Excluir"                               │
│ 4. Sistema valida dados                                         │
│ 5. Sistema envia requisição à API                               │
│ 6. Aguarda resposta da API                                      │
└────────┬─────────────────────────────────────────────────────────┘
         │
    ┌────┴────┐
    ▼         ▼
  ✅ OK     ❌ ERRO
    │         │
    ▼         ▼
┌──────┐  ┌──────────────────────┐
│ ✅   │  │ ❌ Toast.error()     │
│Toast │  │                      │
│ .    │  │ Usuário vê mensagem  │
│success│  │ de erro clara        │
│      │  │                      │
│ Msg  │  │ Pode:                │
│clara │  │ - Tentar novamente   │
│      │  │ - Verificar dados    │
│Usuário  │ - Contactar suporte  │
│ tem  │  │                      │
│confirm│  │                      │
│ação  │  │                      │
└──────┘  └──────────────────────┘
   │
   ▼
┌──────────────────────┐
│ ✅ Sistema:          │
│ - Modal fecha        │
│ - Queries invalidas  │
│ - Lista atualiza     │
│ - Novo estado visível│
└──────────────────────┘
```

---

## 📊 Sumário Visual

```
┌─────────────────────────────────────────────────────────────┐
│  AÇÕES COM TOAST IMPLEMENTADO                              │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ✅ Criar Treinamento          → 🟢 "Treinamento criado!"  │
│  ✅ Editar Treinamento         → 🟢 "...atualizado!"       │
│  ✅ Excluir Treinamento        → 🟢 "...excluído!"         │
│                                                             │
│  ✅ Criar ASO                  → 🟢 "ASO criado!"          │
│  ✅ Editar ASO                 → 🟢 "...atualizado!"       │
│  ✅ Excluir ASO                → 🟢 "...excluído!"         │
│                                                             │
│  ✅ Criar Colaborador          → 🟢 "...criado!"           │
│  ✅ Editar Colaborador         → 🟢 "...atualizado!"       │
│  ✅ Excluir Colaborador        → 🟢 "...excluído!"         │
│                                                             │
│  ✅ Criar Tipo ASO             → 🟢 "...criado!"           │
│  ✅ Editar Tipo ASO            → 🟢 "...atualizado!"       │
│  ✅ Excluir Tipo ASO           → 🟢 "...excluído!"         │
│                                                             │
│  ✅ Criar Tipo Treinamento     → 🟢 "...criado!"           │
│  ✅ Editar Tipo Treinamento    → 🟢 "...atualizado!"       │
│  ✅ Excluir Tipo Treinamento   → 🟢 "...excluído!"         │
│                                                             │
│  ❌ Todas as ações também      → 🔴 Toast de erro          │
│     mostram erro se falhar                                  │
│                                                             │
│  TOTAL: 15+ TOASTS IMPLEMENTADOS                           │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 🎯 Conclusão Visual

```
      ANTES                          DEPOIS
    ┌────────┐                    ┌────────────┐
    │ Ação   │                    │ Ação       │
    └────┬───┘                    └──────┬─────┘
         │                               │
         ▼                               ▼
    ❓ Será que          ┌──────────────────────┐
      funcionou?         │ 🟢 Sucesso!         │
                         │ "Dados salvos"       │
    ❌ Incerteza         │ com confirmação      │
                         │ clara               │
                         └──────────────────────┘
    ❌ Frustração        ✅ Clareza
    ❌ Confusão          ✅ Confiança
                         ✅ Satisfação
```

---

**Status Final:** 🎉 100% Implementado e Funcionando!
