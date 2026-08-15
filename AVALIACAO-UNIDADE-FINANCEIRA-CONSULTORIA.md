# Avaliação Arquitetural — Plano Família, Unidade Financeira e Acesso do Consultor

> **Natureza deste documento: análise, não implementação.** Nenhum código foi
> alterado, nenhuma migration foi criada, nenhuma policy de RLS foi tocada. Segue a
> risca o pedido: ler o que existe, confrontar com os novos requisitos, classificar,
> recomendar. Onde uma decisão do dono do produto é necessária antes de eu poder
> avançar, está marcado explicitamente.
>
> **Origem:** especificação fornecida pelo usuário em 2026-08-15 ("AVALIAÇÃO
> ARQUITETURAL — PLANO FAMÍLIA, UNIDADE FINANCEIRA E ACESSO DO CONSULTOR"),
> confrontada com `prisma/schema.prisma`, `prisma/sql/001-010`,
> `lib/auth/session.ts`, `lib/workspace/advisor.ts`,
> `lib/workspace/client-onboarding.ts`, `ARQUITETURA-IDENTIDADE-PLANOS.md`,
> `ARQUITETURA-METODO-PROSPECTAR.md` e consultas reais de `app/(app)/painel/page.tsx`
> em 2026-08-15.

---

## 1. Resumo executivo

**A introdução de "Unidade Financeira" como conceito novo não é necessária — ela já
existe e já funciona.** O sistema chama isso de `Workspace` desde o Registro Nº 001
(29/07/2026): toda receita, despesa, carteira, cartão, investimento e bem pertence a
um `Workspace`; toda consulta de painel/relatório/importação filtra por
`workspaceId`, nunca por usuário individual; múltiplas pessoas (`Membership`) já
compartilham um mesmo `Workspace` com papéis distintos. Renomear ou duplicar esse
conceito seria o tipo exato de dívida arquitetural que este documento existe para
evitar, e violaria a regra de não alterar o que já funciona.

Dois achados, porém, são reais e merecem ação:

1. **Conflito real, não hipotético:** o consultor (`Membership.role = ADVISOR`) tem
   hoje **escrita plena** — idêntica a `MEMBRO` — tanto na aplicação
   (`lib/auth/session.ts::can()`) quanto na RLS (`prisma/sql/008_rls_completeness.sql`,
   que deliberadamente igualou ADVISOR a TITULAR/MEMBRO em 2026-08-10). O novo
   requisito ("consultor começa só com leitura") **contradiz uma decisão já tomada e
   já em produção**, com consultores reais usando o sistema hoje. Isto precisa da
   sua decisão explícita — seção 7.
2. **Gap real e barato de fechar agora:** nenhuma carteira, cartão ou investimento
   tem um campo de "titular" dentro da família — hoje tudo pertence só ao
   `Workspace`. Isso não trava nada hoje, mas trava o Open Finance mais tarde (não
   dá para saber de quem é o consentimento bancário sem essa informação). Recomendo
   preparar (campo novo, opcional) já na Etapa 1/4 do roteiro do Método, não
   implementar mais nada além disso agora — seção 6.

Classificação geral: **nenhum dos temas exige incorporação de arquitetura nova
agora** (categoria A). Um tema exige **decisão de política agora, implementação
quando convier** (categoria A-de-decisão, não de código — o gap do ADVISOR). Dois
temas são **preparar agora, implementar depois** (categoria B — titularidade de
carteira, teto de assento familiar, este último já estava no roteiro do Método). O
resto já está resolvido ou pode esperar sem custo (categoria C).

---

## 2. Como o sistema funciona hoje (confirmado no código)

| Pergunta (§21 da especificação) | Resposta confirmada |
|---|---|
| Como usuários são representados? | `Profile` (espelha `auth.users` do Supabase) — 1 humano, 1 identidade global. `Membership` liga `Profile` × `Workspace` com um papel (`TITULAR/MEMBRO/LEITURA/ADVISOR`). Uma mesma `Profile` pode ter `Membership` em vários `Workspace` (ex.: dono do próprio workspace + `ADVISOR` em workspaces de clientes). |
| Transações pertencem a quem? | A um `Workspace` (`Entry.workspaceId`), nunca a um usuário. `Entry.createdBy`/`updatedBy` são auditoria (quem mexeu), não posse. |
| Receitas/despesas estão vinculadas a `user_id`? | **Não.** Vinculadas a `Entry.workspaceId` + `Entry.responsibleId` (→ `Person`, o "responsável", que **não é um usuário do sistema** — ver linha abaixo). |
| Contas pertencem ao usuário? | Não — `Wallet.workspaceId`. Não existe hoje nenhum campo de titular individual dentro do workspace (gap real, seção 6). |
| Cartões? | `CreditCard` é 1:1 com `Wallet` (mesmo gap de titularidade). |
| Investimentos? | `Investment.workspaceId` + `Investment.walletId` — mesmo padrão, mesmo gap. |
| Patrimônio? | `Asset.workspaceId` — mesmo padrão. |
| Planos? | `Subscription.workspaceId` → `Plan` — o plano é do workspace (da "família"), não da pessoa. Correto e já é assim desde a Fase 2 da Arquitetura de Identidade. |
| Consultoria — já existe alguma entidade/autorização? | Sim: `Membership.role = ADVISOR` (identidade + escopo), `AccessLog` (auditoria, já escreve em toda resolução de sessão como ADVISOR), `lib/workspace/advisor.ts::assignAdvisor()` (atribuição, com histórico via `status=REVOKED` — nunca DELETE). |
| RLS depende só de `auth.uid() = user_id`? | **Não, e isso é uma boa notícia.** Só a tabela `profiles` usa `auth.uid() = id` diretamente (correto — `Profile` é literalmente o usuário). Todas as tabelas de negócio (`entries`, `wallets`, `people`, `entry_groups`, `import_batches`...) usam `is_workspace_member(workspace_id)` / `workspace_role(workspace_id)` — já pensadas para múltiplas pessoas por unidade financeira desde `001_auth_and_rls.sql` (29/07/2026). |
| Dashboard pressupõe 1 pessoa? | **Não** — confirmado em `app/(app)/painel/page.tsx`: toda query é `where: { workspaceId }`. Duas pessoas na mesma família já veem o mesmo painel agregado hoje. |
| Relatórios agrupam por usuário? | Não, por `workspaceId` — mesmo padrão em toda `lib/finance/` e `lib/reports/`. |
| Importações (CSV/OFX/PDF) associam a quem? | `ImportBatch.workspaceId` + `createdBy` (auditoria). Os lançamentos gerados recebem `responsibleId` (→ `Person`) conforme mapeamento do usuário no wizard — não há detecção automática de "isto é do cartão da Maria", mas o campo para registrar isso (`responsibleId`) já existe. |
| Open Finance — existe alguma decisão? | Sim, já tomada: **fora do escopo de lançamento** (Metodologia PROSPECTA v5.0 §5.9, já registrado em `ARQUITETURA-METODO-PROSPECTAR.md`). Zero código, zero schema relacionado a conexão bancária hoje. |

### 2.1 A peça que já resolve "origem do lançamento" — `Person`

A especificação (§7, §8) pergunta se é preciso separar "pertencimento econômico",
"origem" e "titularidade". Para lançamentos, isso **já está resolvido** desde a
Fase 0: `ESPECIFICACAO-SISTEMA-FINANCEIRO.md` §2 já registra a decisão —

> "Responsável" e "Usuário" são conceitos **diferentes**. A planilha tem 12
> responsáveis (`Felipe (eu)`, `Lucas (irmão)`, `Dani (Ex)`, `Felipe & Dani`...) e
> apenas 1–2 pessoas que efetivamente operam o arquivo.

`Person` (o "responsável") já é exatamente o conceito de "origem" que a
especificação nova pede no exemplo da Família Silva — um `Entry` de receita de
R$ 6.000 com `responsibleId → Person "João"`, dentro do `Workspace` "Família Silva",
já produz exatamente `{ unidade_financeira: "Família Silva", origem: "João", tipo:
"Salário" }`. **Não é um campo novo — já existe, só não tinha sido nomeado
"origem" explicitamente.** Nenhuma ação necessária aqui além de, talvez, ajustar
rótulo de UI se algum dia "Responsável" confundir um cliente de Plano Família (não
é urgente — é rótulo, não modelo).

---

## 3. Como a arquitetura em elaboração já está desenhada

`ARQUITETURA-METODO-PROSPECTAR.md` (documento anterior a este, ainda em revisão) já
antecipa boa parte do que esta avaliação pede, sem ter sido escrito pensando nisso
de propósito — é um sinal de que o desenho de base está coerente:

- **§4.3 da Metodologia v5.0**, já incorporado: variante Família (2–5 pessoas) é
  regra comercial (`multi_seat_5`, uma `Feature`), **não** limite estrutural do
  banco — exatamente o que a seção 5 desta especificação pede ("o limite deve ser
  tratado como regra comercial/entitlement"). Já na Etapa 4 do roteiro
  (`ARQUITETURA-METODO-PROSPECTAR.md` seção 6): "enforço do teto de assento da
  variante Família em `lib/workspace/invite.ts`".
- **`ConsultingEngagement`** (proposto, ainda não implementado) já carrega
  `seatType: "individual" | "familia"` — é, na prática, o "Relacionamento de
  Consultoria" que a seção 14 desta especificação pede, ligando consultor →
  contrato → unidade financeira (`workspaceId`). Não precisa de entidade adicional.
- **`PlanGrant`** (proposto) já separa "o que o cliente assina"
  (`Subscription`, nunca tocado por consultoria) de "o que foi concedido
  temporariamente" — o mesmo espírito de não acoplar plano comercial a papel de
  acesso que a seção 20 desta especificação pede.

---

## 4. Impacto por tema

### 4.1 Unidade Financeira

Já existe (`Workspace`). Impacto: nenhum. Nenhuma ação de schema. Única ação
recomendada é de **vocabulário**: documentos futuros podem escrever "Workspace
(Unidade Financeira)" na primeira menção de cada documento nesse domínio, para
alinhar a leitura de negócio com o nome técnico, sem renomear nada no código.

### 4.2 Plano Família

Já desenhado corretamente (seção 3 acima). Nenhum conflito. A única peça que falta
é a implementação do teto de 2–5 assentos, já prevista na Etapa 4 do roteiro do
Método — nenhuma mudança de desenho necessária por causa desta especificação.

### 4.3 Titularidade × Unidade Financeira

**Gap real.** Hoje `Wallet` (e por extensão `CreditCard`, `Investment`, `Asset`)
pertence só ao `Workspace` — não existe campo que diga "esta conta é do João, não da
Maria, dentro da Família Silva". Isso não trava nada hoje (o sistema não precisa
saber disso para calcular saldo, balanço ou qualquer relatório atual — tudo já
agrega por workspace, que é o comportamento correto e desejado para a família como
unidade). O risco de adiar aparece em dois cenários futuros específicos:

1. **Open Finance** (seção 4.6) — quando existir, o sistema vai precisar saber de
   quem é o consentimento bancário por trás de cada conta conectada. Sem o campo
   hoje, isso vira uma migração de dado real (milhares de `Wallet` já existentes em
   produção) no meio da implementação do Open Finance — pior momento possível para
   descobrir que falta um campo.
2. **MFP e relatórios "de quem é o quê" dentro da família** — quando o Plano
   Família tiver uso real com múltiplos titulares, "quanto cada um tem" é uma
   pergunta natural que hoje não tem resposta estruturada.

**Recomendação — categoria B (preparar agora, não implementar toda a
funcionalidade):** adicionar `Wallet.ownerPersonId String? @map("owner_person_id")
@db.Uuid` (FK opcional para `Person`, nula por padrão — nenhuma carteira existente
muda de comportamento). Mesma extensão em `Investment` e `Asset`, para
consistência. Nenhuma tela nova é obrigatória agora — o campo pode ficar disponível
sem UI até haver demanda real, mas já existir evita a migração cara depois.

### 4.4 Conta conjunta

**Não modelar agora.** Se `ownerPersonId` for um FK único opcional (proposta acima),
"conta conjunta" (2 titulares) não é representável — mas **nulo já significa
"compartilhada/da família"**, que é o comportamento atual de 100% das carteiras
hoje. Ou seja: o caso conjunto já tem uma representação natural (nulo) sem precisar
de tabela de junção agora. Se um dia for necessário nomear explicitamente os 2+
titulares de uma conta conjunta, isso vira uma tabela `WalletOwner` (many-to-many)
**aditiva**, sem quebrar `ownerPersonId` (que continuaria servindo o caso comum de
"um titular claro"). Categoria C — implementar só quando um cliente real pedir.

### 4.5 Acesso do consultor — conflito com decisão já tomada

**Este é o achado que exige decisão sua antes de eu prosseguir com qualquer Etapa
do Método que toque nisso.** Detalhamento no formato pedido (§24):

- **Decisão atual:** `lib/auth/session.ts::can()` — "`ADVISOR` e `MEMBRO` podem
  escrever, só `LEITURA` não pode." Replicado na RLS por
  `prisma/sql/008_rls_completeness.sql` (2026-08-10), que **deliberadamente**
  igualou `ADVISOR` a `TITULAR/MEMBRO` nas policies de escrita — decisão consciente,
  não descuido, registrada como correção de uma inconsistência que existia antes.
- **Novo requisito:** consultor deve começar **só com leitura**; escrita deve ser
  "explicitamente autorizada, granular, auditável, rastreável, reversível" (§17).
- **Consequência de não alterar:** qualquer consultor ativo hoje continua podendo
  editar/excluir lançamentos do cliente livremente — incompatível com o
  posicionamento de "terapeuta financeiro" que só orienta (P8 da Metodologia: "a
  execução... comportamental é do cliente").
- **Consequência de alterar agora:** é uma mudança de comportamento real, não
  puramente aditiva — qualquer consultor que hoje edita lançamento de cliente por
  conveniência perde essa capacidade até ganhar uma autorização explícita. Isso
  pode ter que ser conversado com quem já usa isso na prática (você, como
  consultor, hoje).
- **Consequência de alterar depois:** quanto mais tempo passar, mais gente se
  acostuma com o comportamento atual (write pleno), maior a chance de a mudança
  parecer uma remoção de funcionalidade em vez de um ajuste de política — pior
  janela de comunicação.
- **Recomendação técnica (desenho, não implementação):** trocar o "tudo ou nada" do
  `can()` para `ADVISOR` por um campo explícito e reversível —
  `Membership.advisorCanWrite Boolean @default(false)` (só usado quando
  `role = ADVISOR`; ignorado nos demais papéis) — TITULAR concede/revoga a
  qualquer momento, cada alteração vira uma linha de `AccessLog` (já existe,
  só precisa de uma `action` nova, ex. `"GRANT_ADVISOR_WRITE"`/`"REVOKE_ADVISOR_WRITE"`).
  `default(false)` é a peça que resolve o requisito ("consultor começa só com
  leitura") sem exigir nenhuma migração de dado além de adicionar a coluna.

**Preciso da sua decisão em duas partes:**
1. Concorda com o desenho acima (flag explícita, default `false`, TITULAR concede)?
2. Quando isso deve entrar em vigor — junto com a Etapa 8 do Método
   (`ConsultingEngagement`, seção 6 de `ARQUITETURA-METODO-PROSPECTAR.md`, já que é
   quando a relação de consultoria ganha modelagem formal), ou antes, como uma
   correção independente?

### 4.6 Open Finance

Sem mudança de escopo — continua adiado (§5.9 da Metodologia, já registrado). A
única interseção com esta avaliação é a seção 4.3: preparar `ownerPersonId` agora
reduz o custo de implementar Open Finance depois, sem adiantar nada da
implementação em si (nenhuma entidade de conexão/consentimento é criada agora).

### 4.7 Individualidade dentro do Plano Família

Hoje **tudo** dentro de um workspace é 100% compartilhado — não existe "meta
pessoal" ou "patrimônio individual" escondido de outros membros. Isso não é uma
limitação estrutural (nada no schema impede adicionar um campo de escopo depois),
é simplesmente o que ainda não foi construído porque ninguém pediu. Categoria C —
não modelar `scope`/`visibility` agora. Nenhuma decisão de hoje torna isso mais
caro de adicionar depois, porque nenhum dos campos propostos nesta avaliação
(macro_bloco, funcao_patrimonial, ownerPersonId) colide com um futuro campo de
visibilidade — são eixos independentes, como o próprio método já reconhece para
`macro_bloco` × fixo/variável.

### 4.8 Ciclo de vida da família

Já suportado pela mecânica existente sem nenhuma peça faltando: convite
(`WorkspaceInvite`) → aceite → `Membership` ativa → saída (`status=REVOKED`,
nunca DELETE — preserva histórico). Separação/divórcio, maioridade, mudança de
plano são todos casos de uso em cima do que já existe (revogar Membership, criar
novo workspace, mudar Subscription) — nenhum exige campo ou tabela nova. Categoria
C, e nem isso: já está pronto.

### 4.9 Multi-tenancy

Já correto (seção 2 acima) — isolamento por `workspace_id`, nunca por `user_id`
cru, em toda tabela de negócio. Nenhuma mudança necessária por causa desta
avaliação. RLS tecnicamente não é exercida hoje (Prisma conecta como owner) — isso
é um débito técnico **pré-existente e documentado** (`ARQUITETURA-IDENTIDADE-
PLANOS.md` item 7), não criado nem agravado por Plano Família ou consultoria.

### 4.10 Plans/Entitlements

Sem mudança além do que `ARQUITETURA-METODO-PROSPECTAR.md` já propõe (Etapas 3–4).

---

## 5. Matriz de impacto

| Tema | Estado atual | Impacto | Incorporar agora? | Risco de adiar | Recomendação |
|---|---|---|---|---|---|
| Unidade Financeira | Já existe (`Workspace`) | Nenhum | **C** — nada a fazer | Nenhum | Usar "Workspace = Unidade Financeira" na documentação |
| Plano Família | `Membership` já suporta N pessoas; teto não implementado | Baixo | **B** — já no roteiro (Etapa 4) | Baixo | Confirmar desenho já proposto |
| Titularidade (carteira/cartão/investimento) | Sem campo de titular | Médio | **B** — preparar agora | Médio-alto se adiado até o Open Finance | `ownerPersonId` opcional em `Wallet`/`Investment`/`Asset` |
| Conta conjunta | Não modelada | Baixo | **C** — depois | Baixo (nulo já cobre o caso hoje) | Não modelar agora |
| Origem do lançamento | Já existe (`Person`/`responsibleId`) | Nenhum | **C** — já resolvido | Nenhum | — |
| Consultoria (relacionamento) | `ADVISOR` + `AccessLog` + `ConsultingEngagement` (proposto) | Nenhum estrutural | **C** — já coberto | Nenhum | — |
| **Acesso delegado do consultor (escrita)** | **ADVISOR = escrita plena hoje** | **Alto — conflito direto** | **Decisão de política agora** (implementação pode esperar a Etapa 8) | **Alto** (produção já usa) | Ver seção 4.5 — aguardando sua decisão |
| Auditoria do consultor | Já existe (`AccessLog`) | Nenhum | **C** — já coberto | Nenhum | — |
| Multi-tenancy | Já isolado por `workspace_id` | Nenhum | **C** — já correto | Nenhum | — |
| Plans/Entitlements | Já no roteiro do Método | Nenhum novo | **B** — já planejado | Baixo | — |
| Open Finance | Fora de escopo (§5.9) | Baixo se `ownerPersonId` for preparado | **B** — só o campo de titularidade | Médio se o campo também for adiado | Preparar só o campo |
| Individualidade na família | Tudo compartilhado hoje | Baixo | **C** — depois | Baixo | Nenhuma ação |

---

## 6. Decisões — resolvidas em 2026-08-15

1. **Seção 4.5 — aprovado.** `Membership.advisorCanWrite` (default `false`, TITULAR
   concede/revoga, auditado em `AccessLog`) — justificativa do usuário: segurança e
   conformidade com a LGPD (Art. 20, toda ação sobre dado de terceiro precisa ser
   rastreável, não automática por papel). Tratado como **Etapa 0**, independente do
   roteiro do Método (não depende de `ConsultingEngagement`) — recomendado o quanto
   antes. Detalhamento técnico movido para `ARQUITETURA-METODO-PROSPECTAR.md`
   seções 3.2/5.7.
2. **Seção 4.3 — aprovado, com refinamento.** `ownerPersonId` (nulo, opcional) em
   `Wallet`/`Investment`/`Asset`, já na Etapa 1. Refinamento decidido: o FK aponta
   para `Person` (titular do recurso, conceito de negócio), não `Profile`
   (titular da conexão, conceito de autenticação/consentimento) — essa segunda
   peça permanece deliberadamente fora de escopo (nenhuma entidade de
   conexão/consentimento bancário é criada agora, só a coluna de titularidade que
   evita a migração cara depois). Detalhamento em
   `ARQUITETURA-METODO-PROSPECTAR.md` seção 5.1.

## 7. O que NÃO precisa de decisão — já está certo como está

`Workspace` como unidade financeira, `Person` como origem do lançamento, isolamento
multi-tenant por `workspace_id`, ciclo de vida de convite/saída de membro, e o
desenho de Plano Família/consultoria já em `ARQUITETURA-METODO-PROSPECTAR.md`. Não
há necessidade de revisitar nenhuma dessas decisões — a especificação nova, na
maior parte, descreve o que o sistema já faz, só com outro vocabulário.

---

## Próximo passo

Ambos os itens já foram incorporados a `ARQUITETURA-METODO-PROSPECTAR.md` (seções
3.2, 3.3, 5.1, 5.7 e a nova Etapa 0) — este documento permanece como o registro da
análise e da justificativa (LGPD/segurança), não precisa de nenhuma ação adicional.
Ainda nenhum código, migration ou schema foi tocado, como definido desde o início.
A revisão principal segue em `ARQUITETURA-METODO-PROSPECTAR.md`, que já retomou e
fechou as Pendências #4/#5/#9/#11 (só a #12, Módulo PJ, segue aberta).
