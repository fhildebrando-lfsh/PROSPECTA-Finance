# Arquitetura do Método PROSPECTAR no PROSPECTA Finance — Reformulação (Projeto)

> **Status: proposta para aprovação. Nenhum código, migration, schema ou config foi
> alterado por este documento.** Segue o mesmo protocolo já usado em
> `ARQUITETURA-IDENTIDADE-PLANOS.md` (Registro Nº 006): diagnóstico + arquitetura
> proposta + fases de implementação. A implementação só começa após aprovação
> explícita, etapa por etapa se necessário.
>
> **Origem:** leitura integral de `Metodologia PROSPECTA v5.0 — Diretrizes de
> Planejamento Financeiro, Consultoria e Gestão Patrimonial.docx` (fornecido pelo
> usuário em 2026-08-15, controle de versão interno até v5.0/12-08-2026) contra o
> estado real do código em `C:\Sistema Financeiro` na mesma data.
>
> **Regra de trabalho desta reformulação, definida pelo usuário e vinculante para
> toda etapa futura:**
> 1. Nada do que já existe é alterado, renomeado ou removido — nenhuma função, tela,
>    rota, tabela, coluna ou comportamento.
> 2. Toda mudança é aditiva: nova tabela, nova coluna opcional, novo módulo, nova
>    tela. Onde algo precisar de ajuste (ex.: denominador do indicador de
>    Endividamento), o comportamento atual permanece intacto e o novo cálculo nasce
>    como algo adicional, nunca substituindo em silêncio.
> 3. Este documento organiza a implementação em fases (chamadas aqui de **Etapas**,
>    para não colidir com as "Fases 0–8" do método, que são fases de atendimento ao
>    cliente, não de desenvolvimento).

---

## Como ler este documento

A Metodologia PROSPECTA v5.0 já contém, na sua seção 13 ("Integração Método ↔
PROSPECTA Finance"), um diagnóstico e um roteiro de construção (13.9) muito bem
pensados — este documento não os reescreve do zero. O trabalho feito aqui é:

1. **Verificar cada afirmação da seção 13 contra o código real** (não contra o que o
   documento presume que existe) — seção 1.
2. **Traduzir as 10 entidades novas (13.7) em modelagem Prisma concreta**, aditiva ao
   `schema.prisma` atual — seção 3.
3. **Resolver a Pendência #1 do próprio documento** ("classificar cada funcionalidade
   atual em Start/Pro/Max, tela a tela") contra as rotas reais de `app/(app)/` — seção 4.
4. **Transformar a sequência de 17 passos (13.9) em Etapas de implementação
   verificáveis**, no formato que este projeto já usa (uma etapa = um Registro
   Operacional, testes, `tsc`/`build` limpos) — seção 6.

Leia primeiro `PROJECT_STATE.md` (estado atual) e `ARQUITETURA-IDENTIDADE-PLANOS.md`
(o modelo de identidade em 3 papéis que este documento estende, não substitui). Este
documento pressupõe os dois.

---

## 1. Diagnóstico verificado — o que já existe hoje

Conferido linha a linha contra `prisma/schema.prisma`, `lib/`, `app/(app)/` e
`prisma/seed.ts` em 2026-08-15. Onde a Metodologia v5.0 (§13.1–13.2) e o código real
divergem, vale o código — e está anotado abaixo.

| Área | Metodologia v5.0 diz | Confirmado no código |
|---|---|---|
| Núcleo de lançamentos | ✅ completo | ✅ confirmado — `lib/entries/`, `lib/finance/`, `Entry`/`EntryGroup` |
| Importação CSV/OFX/PDF | ✅ 5 bancos | ✅ confirmado — `lib/import/pdf-statement/parsers/{nubank,casas-bahia,porto-seguro,itau,santander}.ts` |
| Patrimônio, metas, dívidas (parcelamento) | ✅ | ✅ confirmado — `Asset`, `Goal`, `lib/finance/open-installments.ts` |
| Investimentos | ✅ | ✅ confirmado — `Investment`, `InvestmentClass`, `app/(app)/investimentos/` |
| Identidade (OWNER/MEMBER/VIEWER/ADVISOR, AccessLog, bloqueio) | ✅ | ✅ confirmado — papéis reais são `TITULAR/MEMBRO/LEITURA/ADVISOR` (nomenclatura do sistema diverge da do documento; ver nota abaixo) |
| `Plan`/`Feature`/`PlanFeature`/`Subscription`/`Entitlement` | "projetada e aprovada" | ✅ tabelas existem no schema, **mas nenhuma seed, nenhuma tela e nenhum call site usa `hasFeature()` ainda** — confirmado em `prisma/seed.ts` (não semeia `Plan`/`Feature`) e no comentário de `lib/billing/entitlements.ts`: *"Nenhum call site usa isto ainda... nenhuma tela está gateada por feature"* |
| PSF (Painel de Saúde Financeira) | "5 dos 7 indicadores computáveis hoje" | ❌ **não existe nenhum código de PSF** — nem tabela, nem tela, nem cálculo. O que existe são os *insumos* dispersos (saldos, `reserve.ts`, `open-installments.ts`) que tornariam 5 dos 7 indicadores calculáveis, mas nada os calcula, exibe ou versiona hoje |
| Régua de Alocação (RAP) | "orçamento é por categoria" | ✅ confirmado — `Budget` é por categoria/mês, sem noção de macrobloco. Nenhum código de Régua existe |
| `macro_bloco` na taxonomia | ❌ falta | ❌ confirmado ausente — `Subcategory` não tem esse campo |
| `funcao_patrimonial` | ❌ falta | ❌ confirmado ausente — `Asset`/`Investment`/`Wallet` não têm esse campo |
| Dívidas — MEC (CET, credor, negativação) | "Tela de Dívidas é só parcelamento" | ✅ confirmado — `lib/finance/open-installments.ts` só agrupa parcelas de `Entry`; não existe entidade `Debt`. O próprio `schema.prisma` já registra a decisão histórica: *"Dívidas (`debt`) fica de fora desta etapa, adiado a pedido do usuário até haver mais clareza de uso real"* — o Método agora é essa clareza |
| `ConsultingEngagement`, `PlanGrant`, `MethodPhase`, `GateCheck`, `Deliverable` etc. | ❌ falta | ❌ confirmado ausente por completo |
| Instrumentos A1/A2/B/C | ❌ falta | ❌ confirmado ausente |

**Nota de nomenclatura (importante, não é divergência de fato):** a Metodologia v5.0
usa "OWNER/MEMBER/VIEWER" ao descrever os papéis já implementados (§13.1). O schema
real usa `TITULAR/MEMBRO/LEITURA/ADVISOR` (`MembershipRole`, ver
`ARQUITETURA-IDENTIDADE-PLANOS.md` seção 7). São os mesmos quatro papéis — a
Metodologia parece ter sido escrita citando os nomes em inglês do rascunho original
da Arquitetura de Identidade, não os nomes finais em português que foram
efetivamente implementados. Este documento usa sempre os nomes reais do código:
`TITULAR/MEMBRO/LEITURA/ADVISOR`.

**Conclusão do diagnóstico:** a Metodologia v5.0 está certa na análise estrutural
(base de identidade pronta, comercial projetado mas não ligado, PSF/Régua/Método
inexistentes) e um pouco otimista em dois pontos (PSF não está parcialmente pronto,
está zerado; a camada comercial está desenhada no schema mas zero por cento
operante). Isso não muda a arquitetura proposta — apenas informa por onde a Etapa 1
realmente começa.

---

## 2. O que a Metodologia v5.0 exige, em uma frase por peça

Para não repetir o que já está bem descrito no documento de origem (§4.6, §8, §13),
o resumo funcional mínimo que a arquitetura técnica precisa sustentar:

1. **Três camadas de direito de acesso**, nunca duas: o que o cliente **assina**
   (`Subscription`), o que foi **concedido temporariamente** por causa de um
   contrato de consultoria (`PlanGrant`, novo), e se a **camada de método** está
   liberada (`ConsultingEngagement`, novo) — porque features de método (PIP, PFI,
   MEC completo etc.) não podem ficar disponíveis por dinheiro de assinatura sozinho
   (§3.1, "PIP autogerada é recomendação disfarçada").
2. **Um catálogo de features nomeado por código**, nunca por nome de plano — a
   peça `hasFeature()` já existe e já foi pensada assim; falta usá-la.
3. **Dois eixos novos e independentes na taxonomia/patrimônio**: `macro_bloco`
   (fluxo — alimenta a Régua) e `funcao_patrimonial` (estoque — alimenta o MFP),
   nenhum dos dois duplica o eixo fixo×variável que já existe.
4. **Um Painel de Saúde Financeira com 7 indicadores**, calculado, versionado no
   tempo, e escalonado por nível (3 no Pro, 5 no Max, 7 com consultoria).
5. **Uma trilha de método** (fases 0–8/∞, gates, entregáveis) que só existe quando
   há um `ConsultingEngagement` ativo — é operação da consultoria, não do produto.

---

## 3. Modelo de direitos em três camadas — tradução técnica de §4.6

```
nivelEfetivo(workspace) =
  maior(
    subscription.plano.nivel,
    maior(g.plano.nivel para g em PlanGrant onde workspaceId = workspace
                                            e ativo (now between startsAt e endsAt))
  )

hasFeature(workspace, codigo):
  feature = buscarFeaturePorCodigo(codigo)
  se feature.gateKind = METODO:
    retorna existe ConsultingEngagement ativo para este workspace
           cobrindo este código (ver regra de escopo por projeto, 13.8 fim)
  senão: // feature.gateKind = PLANO (default)
    retorna codigo está entre as features do Plan resolvido por nivelEfetivo(workspace)
           OU existe Entitlement pontual não expirado para este código (já suportado)
```

Isso é uma extensão de `lib/billing/entitlements.ts::hasFeature()`, não uma
reescrita — a função já resolve `Entitlement` + `Subscription`; o que falta é (a)
somar `PlanGrant` ao cálculo do plano efetivo e (b) desviar os códigos de método
para checar `ConsultingEngagement` em vez do plano. A assinatura da função
(`hasFeature(workspaceId, featureCode): Promise<boolean>`) não muda — quem já a
chamar no futuro não precisa saber que por trás existem três tabelas em vez de duas.

**Garantia central, repetida do próprio documento (§13.7): `Subscription` nunca é
escrita por causa de contratação, conclusão ou cancelamento de consultoria.** Toda
elevação de nível é um `PlanGrant` com início e fim. Isso é o que faz a "escolha de
continuidade" (§4.7) funcionar sem nenhuma migração de dado: a assinatura do cliente
nunca mudou, só a concessão temporária expirou.

### 3.1 Painel administrativo de "Planos" — decisão do usuário, 2026-08-15

O §13.8 do documento de origem define o catálogo de features por escrita direta em
código (uma lista fixa de códigos por nível). **Decisão tomada nesta revisão:** isso
vira uma tela administrativa (`/admin/planos`, visível só a `platformRole =
PLATFORM_ADMIN`, mesmo padrão de guarda de `admin/usuarios`), não um catálogo
fixo — o admin geral (a empresa) atribui e desatribui feature↔plano e decide se cada
feature é `gateKind = PLANO` ou `gateKind = METODO` sem precisar de deploy. Isso é
uma extensão natural, não uma mudança de arquitetura: `hasFeature()` já resolve por
código de feature, nunca por nome de plano (comentário original em
`lib/billing/entitlements.ts`) — o catálogo de §13.8 sempre foi dado, não código; a
única mudança é onde esse dado mora (tela, não `seed.ts`).

O seed inicial (Etapa 3, seção 6) continua existindo — ele só deixa de ser a fonte
de verdade permanente e passa a ser o estado inicial editável. Mesmo espírito já
usado em `NatureLabel` (rótulo de natureza nasce por seed, editável pelo admin
depois) e em `Category`/`Subcategory` (`isSystem: true` no seed, editáveis por admin
via `cadastros/*`).

### 3.2 Acesso do consultor — escrita explícita, não automática (decisão de 2026-08-15)

Achado de `AVALIACAO-UNIDADE-FINANCEIRA-CONSULTORIA.md` §4.5: `Membership.role =
ADVISOR` tem hoje escrita plena (idêntica a `MEMBRO`), tanto em
`lib/auth/session.ts::can()` quanto na RLS (`prisma/sql/008_rls_completeness.sql`).
**Decisão confirmada pelo usuário:** isso muda — consultor nasce só com leitura;
escrita é concessão explícita do TITULAR, por exigência de segurança e LGPD (Art. 20
— toda ação sobre dado de terceiro precisa ser rastreável e não pode ser automática
por papel). Ver `Membership.advisorCanWrite` (seção 5.7) e Etapa 0 (seção 6) — tratada
como correção independente do restante do roteiro do Método, porque não depende de
`ConsultingEngagement` existir: `ADVISOR` já é usado em produção hoje, sem nenhuma
camada de método por trás.

### 3.3 Permissão entre membros da família — Pendência #11 (2026-08-15)

Diferente do consultor (3.2), **não há mudança recomendada aqui.** Hoje
`TITULAR`/`MEMBRO` têm escrita idêntica — qualquer adulto da família pode
editar/excluir o lançamento de outro adulto do mesmo workspace. A única diferença
de papel é administrativa (só `TITULAR` convida/remove membro, RLS
`memberships_write_titular_or_admin`).

**Por que isso está certo como está, e não é o mesmo caso do consultor:** um
consultor é um terceiro com acesso delegado, revogável, a um patrimônio que não é
dele — daí a exigência de consentimento explícito e granular (LGPD Art. 20). Um
membro da família é, por definição do próprio método (§9.5), parte da mesma
unidade econômica — restringir a escrita entre eles recriaria artificialmente a
separação que o Plano Família existe para superar ("VIDA FINANCEIRA DA FAMÍLIA
SILVA", não "finanças do João + finanças da Maria"). O reforço de responsabilidade
individual que o §4.3 da Metodologia pede ("cada adulto lança os próprios gastos")
já é satisfeito por `Entry.responsibleId` (quem o lançamento pertence, seção 2.1 de
`AVALIACAO-UNIDADE-FINANCEIRA-CONSULTORIA.md`) — é dado de atribuição, não uma
trava de permissão, e não precisa virar uma.

**Nenhuma ação de código.** Pendência considerada resolvida por manutenção do
comportamento atual.

---

## 4. Classificação das telas atuais por nível — Pendência #1 (Alta) resolvida

**Confirmado nesta revisão** (2026-08-15): mantém `compromissos/incidentes` no
Start (a fila de Incidentes já existe hoje para qualquer importação de CSV, e o
Índice de Consistência a usa independente do nível); nenhuma outra tela precisou
mudar de nível. A tabela abaixo é o **seed inicial** do catálogo — editável depois,
sem deploy, pela tela `/admin/planos` (seção 3.1).

Mapeamento de cada rota real de `app/(app)/` contra o catálogo de features de §13.8.
Nenhuma tela muda de comportamento — este é o inventário que a Etapa 3 (seção 6)
usa para popular `PlanFeature`.

| Nível | Rotas reais (`app/(app)/...`) |
|---|---|
| **Start** | `painel` (versão básica) · `lancamentos`, `lancamentos/novo`, `lancamentos/transferir` · `lancamentos/importar` (só CSV) · `compromissos`, `compromissos/calendario`, `compromissos/incidentes` · `cadastros/*` (carteiras, categorias, subcategorias, responsaveis, membros, tipos) · `cartoes`, `cartoes/novo`, `cartoes/[id]` (fatura) · `relatorios/balanco-anual` · export CSV/XLSX (`lib/entries/build-csv.ts`, `build-xlsx.ts`) · PWA (`app/sw.ts`) |
| **Pro** (tudo do Start, mais) | `lancamentos/importar` com OFX/PDF (`lib/import/ofx-*`, `lib/import/pdf-statement/`) · integração Google Agenda (`api/integrations/google-calendar/*`) · `relatorios/orcamento` · `relatorios/fluxo-projetado` · `relatorios/parceladas` · `patrimonio/bens` · `patrimonio/metas` · `patrimonio/dividas` · Régua — posição atual (**novo**, Etapa 1) · PSF nível 1 — 3 indicadores (**novo**, Etapa 5) |
| **Max** (tudo do Pro, mais) | `investimentos`, `investimentos/novo`, `investimentos/[id]`, `investimentos/analise` · `cartoes/analise` (benefícios) · Régua — simulação de cenários (**novo**) · PSF nível 2 — 5 indicadores (**novo**) · cadastro de apólices (**novo**) · `funcao_patrimonial` em bens/investimentos (**novo**, Etapa 7) · IA Assistente — perguntas em linguagem natural sobre os próprios dados (**novo**, Etapa 6, seção 5.5) · Automações — motor de alertas por regra (**novo**, Etapa 6, seção 5.5) |
| **Camada de Método** (exige `ConsultingEngagement` ativo, independente de nível) | Régua — trajetória de metas · PSF nível 3 + devolutiva revisada · todos os Instrumentos (A1/A2/B/C) · PAN, MEC completo, MRP completo, PLA, PIP (política), MFP (diagnóstico), PCP, PFI · trilha de fases e gates · agenda de consultoria — **tudo novo**, Etapas 8–16 |
| **Plataforma** (não é feature de plano — depende de `platformRole`/`Membership.role`, não de `Subscription`) | `admin/clientes`, `admin/consultores`, `admin/usuarios`, `admin/planos` (**novo**, seção 3.1) · `minha-conta` |

**Observação sobre `compromissos/incidentes` ficar no Start:** a fila de Incidentes
já existe hoje para qualquer importação de CSV (Start), não só para OFX/PDF (Pro) —
manter no Start evita bloquear higiene de dado básica atrás de paywall, e o Índice de
Consistência (Etapa 2) a usa como um dos seus componentes independente do nível do
workspace.

**Sobre IA Assistente e Automações não terem mais nota "fora de escopo":** a
Metodologia v5.0 só citava as duas de passagem, sem detalhar. Nesta revisão (decisão
do usuário, 2026-08-15) elas ganharam desenho próprio, com benchmark de mercado — ver
seção 5.5.

---

## 5. Extensões aditivas ao `schema.prisma`

Todas as mudanças abaixo são: tabela nova, ou coluna opcional (`?`) adicionada a uma
tabela existente. Nenhuma coluna existente muda de tipo, nome ou obrigatoriedade;
nenhuma relação existente perde `onDelete`; nenhum enum existente perde valor.

### 5.1 Campos aditivos em tabelas existentes

```prisma
model Subcategory {
  // ...todos os campos atuais, inalterados...

  /// Método PROSPECTAR §13.3 — eixo independente de fixo×variável. Herdado da
  /// categoria quando nulo na subcategoria (ver lib/method/allocation.ts).
  macroBloco MacroBloco? @map("macro_bloco")
}

enum MacroBloco {
  ESSENCIAL
  ESTILO_DE_VIDA
  OBRIGACAO
  POUPANCA
}

model Entry {
  // ...todos os campos atuais, inalterados...

  /// Método PROSPECTAR §13.3 — mesmo espírito de isFixedOverride: quando
  /// preenchido, manda sobre o macroBloco herdado da subcategoria.
  macroBlocoOverride MacroBloco? @map("macro_bloco_override")
}

model Asset {
  // ...todos os campos atuais, inalterados...
  funcaoPatrimonial FuncaoPatrimonial? @map("funcao_patrimonial")
  /// AVALIACAO-UNIDADE-FINANCEIRA-CONSULTORIA.md §4.3 — titular econômico
  /// dentro da unidade financeira (Workspace). Aponta para Person (o
  /// "responsável" já existente, não Profile/login — titularidade de
  /// recurso é conceito de negócio, não de autenticação). Nulo = comum/
  /// compartilhado entre os membros da família, o comportamento atual.
  ownerPersonId String? @map("owner_person_id") @db.Uuid
}

model Investment {
  // ...todos os campos atuais, inalterados...
  funcaoPatrimonial FuncaoPatrimonial? @map("funcao_patrimonial")
  ownerPersonId     String?             @map("owner_person_id") @db.Uuid
}

model Wallet {
  // ...todos os campos atuais, inalterados...
  funcaoPatrimonial FuncaoPatrimonial? @map("funcao_patrimonial")
  ownerPersonId     String?             @map("owner_person_id") @db.Uuid
}

enum FuncaoPatrimonial {
  PROTECAO
  LIQUIDEZ_OPERACIONAL
  OBJETIVOS
  LONGEVIDADE
  CRESCIMENTO
  USO
  SUCESSAO
}
```

Nulo em todos os campos por padrão — nenhuma subcategoria/bem/carteira existente
muda de classificação ou titularidade sozinho; a Régua, o MFP e o Painel de Saúde
tratam "não classificado" como estado explícito, não como erro (mesmo princípio já
usado em `isFixedOverride`).

**Sobre `ownerPersonId` — por que `Person`, não `Profile`, e por que não é Open
Finance ainda.** `Person` já é o "responsável" (§2 da especificação, decisão de
Fase 0) — decoupled de login, cobre inclusive quem nunca acessa o sistema. É o alvo
certo para "titular do recurso" porque titularidade econômica é conceito de
negócio, não de autenticação: numa família, uma conta pode "ser da Maria" mesmo que
Maria nunca tenha feito login. `Profile` continua sendo o alvo certo para "titular
da conexão" — quem efetivamente autoriza um consentimento bancário —, mas essa é
uma decisão por evento de conexão, não uma propriedade estática da carteira, e
**não é modelada agora**: criar `BankConnection`/`Consent` hoje seria antecipar um
fornecedor de Open Finance que ainda não foi escolhido (§5.9 segue adiada). O que
`ownerPersonId` faz é só a preparação mínima e reversível — sem ele, o dia em que o
Open Finance for retomado exigiria migrar milhares de `Wallet` já em produção;
com ele, existe apenas uma coluna vazia esperando por um valor.

**Cálculo dos 4 blocos da Régua (§11.2) — decisão do usuário, 2026-08-15.** Três
blocos vêm de soma direta de `Entry` (nature = DESPESA) agrupada por
`macroBlocoOverride ?? subcategory.macroBloco`. O quarto (`POUPANCA`) **não** é
classificação de nenhuma subcategoria de despesa — poupar neste sistema nunca é uma
despesa, é um aporte (`INVESTIMENTO`) ou uma transferência para carteira. Duas formas
foram avaliadas; escolhida a **(b) soma direta**:

```
ESSENCIAL / ESTILO_DE_VIDA / OBRIGACAO (período) =
  Σ |amount| de Entry onde nature = DESPESA
    e (macroBlocoOverride ?? subcategory.macroBloco) = bloco
    e due_date ∈ período

POUPANCA (período) =
  Σ amount de Entry onde nature = INVESTIMENTO e due_date ∈ período   [aportes reais]
  + Σ |amount| de Entry onde nature = OUTRO e categoria = Transferências
      e wallet_destino.kindCode = CONTA_CAIXA e due_date ∈ período    [dinheiro movido pra caixinha]
```

Preferida à alternativa residual (`Receita − Essenciais − Estilo de vida −
Obrigações`) porque mede o que realmente foi guardado, não o que sobrou sem
destino — mais fiel ao espírito de "cada real tem uma função" que o método já usa
para o MFP (§13.4). Consequência aceita: os quatro blocos podem não somar 100% da
receita (dinheiro parado na conta corrente fica de fora dos quatro) — isso é
informação, não erro de cálculo, e a Etapa 1 deve exibir esse resíduo separadamente
("não alocado"), nunca escondê-lo dentro de um dos quatro blocos.

### 5.2 Camada comercial — ativar o que já existe + `PlanGrant`

`Plan`, `Feature`, `PlanFeature`, `Subscription`, `Entitlement` já existem no schema
(Fase 2 Etapa 1 da Arquitetura de Identidade). Nenhum campo existente muda. Uma
tabela nova (`PlanGrant`) e um campo opcional em `Feature`, para sustentar o painel
administrativo de Planos (seção 3.1):

```prisma
enum FeatureGateKind {
  /// Padrão — resolvido por nivelEfetivo(workspace), ver seção 3.
  PLANO
  /// Resolvido por ConsultingEngagement ativo, nunca por assinatura — ver seção 3.
  METODO
}

model Feature {
  // ...todos os campos atuais, inalterados...

  /// §3.1 — admin decide, por feature, se ela é liberada por nível de plano ou
  /// por camada de método, sem precisar de deploy. Default PLANO preserva o
  /// comportamento atual (nenhuma feature hoje é de método, porque método
  /// ainda não existe).
  gateKind FeatureGateKind @default(PLANO) @map("gate_kind")
}

/// §4.6 — camada 2 do modelo de direitos: elevação temporária de nível
/// decorrente de um contrato de consultoria. Nunca substitui a Subscription,
/// só soma no cálculo de nivelEfetivo() — ver lib/billing/entitlements.ts.
model PlanGrant {
  id            String    @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  workspaceId   String    @map("workspace_id") @db.Uuid
  planId        String    @map("plan_id") @db.Uuid
  engagementId  String?   @map("engagement_id") @db.Uuid
  reason        String
  startsAt      DateTime  @map("starts_at")
  endsAt        DateTime  @map("ends_at")
  createdBy     String    @map("created_by") @db.Uuid
  createdAt     DateTime  @default(now()) @map("created_at")
  revokedAt     DateTime? @map("revoked_at")

  workspace  Workspace              @relation(fields: [workspaceId], references: [id], onDelete: Cascade)
  plan       Plan                   @relation(fields: [planId], references: [id])
  engagement ConsultingEngagement?  @relation(fields: [engagementId], references: [id])

  @@index([workspaceId, endsAt])
  @@map("plan_grants")
}
```

### 5.3 Camada de método — as 9 entidades restantes de §13.7

```prisma
enum EngagementModality {
  DIAGNOSTICO
  PLANEJAMENTO
  PROJETO
  ACOMPANHAMENTO
}

enum EngagementTrack {
  ESSENCIAL
  COMPLETO
}

enum EngagementStatus {
  ATIVO
  CONCLUIDO
  CANCELADO
}

/// §13.7 — contrato de consultoria; chave da camada de método. Um workspace
/// pode ter mais de um ao longo do tempo (histórico); nunca mais de um ATIVO
/// por vez (regra de aplicação, não de schema, mesmo padrão de Subscription).
model ConsultingEngagement {
  id           String              @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  workspaceId  String              @map("workspace_id") @db.Uuid
  modality     EngagementModality
  track        EngagementTrack?
  /// Só relevante para modality = PROJETO — qual fase do método este
  /// contrato libera (regra de escopo por projeto, §13.8 fim). Nula nos
  /// demais casos, onde a camada inteira é liberada.
  projectPhase Int?                @map("project_phase")
  seatType     String              @map("seat_type") // "individual" | "familia"
  status       EngagementStatus    @default(ATIVO)
  startsAt     DateTime            @map("starts_at")
  endsAt       DateTime?           @map("ends_at")
  createdBy    String              @map("created_by") @db.Uuid
  createdAt    DateTime            @default(now()) @map("created_at")

  workspace   Workspace     @relation(fields: [workspaceId], references: [id], onDelete: Cascade)
  planGrants  PlanGrant[]
  phases      MethodPhase[]
  deliverables Deliverable[]

  @@index([workspaceId, status])
  @@map("consulting_engagements")
}

enum GatePhaseStatus {
  EM_ANDAMENTO
  AVANCO_PLENO
  AVANCO_CONDICIONAL
  RETORNO_ASSISTIDO
}

/// §7 — fase atual e histórico dentro de um engagement. 0–8 mapeiam às
/// fases do método; 9 representa a Fase ∞ (Plano Integrado).
model MethodPhase {
  id           String          @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  engagementId String          @map("engagement_id") @db.Uuid
  phaseNumber  Int             @map("phase_number") // 0-8, 9 = "∞"
  status       GatePhaseStatus @default(EM_ANDAMENTO)
  startedAt    DateTime        @map("started_at")
  endedAt      DateTime?       @map("ended_at")

  engagement ConsultingEngagement @relation(fields: [engagementId], references: [id], onDelete: Cascade)
  gateChecks GateCheck[]

  @@unique([engagementId, phaseNumber])
  @@map("method_phases")
}

/// §7.2 — avaliação de um gate ao fim de uma fase. Registra o ritual de
/// passagem (§7.3): critério, resultado, evidência, quem avaliou, quando.
model GateCheck {
  id          String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  phaseId     String   @map("phase_id") @db.Uuid
  criterion   String
  result      GatePhaseStatus
  evidence    String?
  evaluatedBy String   @map("evaluated_by") @db.Uuid
  evaluatedAt DateTime @default(now()) @map("evaluated_at")
  /// Preenchido só em AVANCO_CONDICIONAL/RETORNO_ASSISTIDO — micrometa (§7.1 Regra 3).
  followUpDueAt DateTime? @map("follow_up_due_at")

  phase MethodPhase @relation(fields: [phaseId], references: [id], onDelete: Cascade)

  @@map("gate_checks")
}

enum DeliverableCode {
  PAN
  AFF
  RAP
  MEC
  MRP
  PLA
  PIP
  MFP
  PCP
  PFI
}

enum DeliverableStatus {
  RASCUNHO
  VALIDADO
  ASSINADO
}

/// §12.1 — os artefatos codificados do método. Versionado (cada validação
/// nova de fase gera uma versão, ex.: PFI v0 na Fase 1, v1 na Fase 2...) —
/// nunca sobrescreve a versão anterior, mesmo espírito de EntryAudit.
model Deliverable {
  id           String            @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  workspaceId  String            @map("workspace_id") @db.Uuid
  engagementId String            @map("engagement_id") @db.Uuid
  code         DeliverableCode
  version      Int
  status       DeliverableStatus @default(RASCUNHO)
  /// Conteúdo estruturado do entregável — schema por `code`, ver lib/method/deliverables/.
  content      Json
  createdAt    DateTime          @default(now()) @map("created_at")
  validatedAt  DateTime?         @map("validated_at")

  workspace  Workspace            @relation(fields: [workspaceId], references: [id], onDelete: Cascade)
  engagement ConsultingEngagement @relation(fields: [engagementId], references: [id], onDelete: Cascade)

  @@unique([engagementId, code, version])
  @@map("deliverables")
}

/// §8 — foto do PSF no tempo. Uma linha por cálculo (automático, ao menos
/// mensal) ou por revisão do consultor. É o que sustenta o "comparativo
/// início x fim" (§8.1) sem recalcular o passado.
model HealthSnapshot {
  id           String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  workspaceId  String   @map("workspace_id") @db.Uuid
  snapshotDate DateTime @map("snapshot_date") @db.Date
  /// {organizacao, endividamento, liquidez, protecao?, construcao?, longevidade?, continuidade?}
  /// cada um {faixa: "critico"|"fragil"|"em_construcao"|"saudavel"|"consolidado"|null, valor: number|null}
  /// — indicador ausente por nível fica null, nunca faixa ruim (§8.3).
  indicators   Json
  origin       String   @default("AUTO") // "AUTO" | "REVISADO"
  reviewedBy   String?  @map("reviewed_by") @db.Uuid
  createdAt    DateTime @default(now()) @map("created_at")

  workspace Workspace @relation(fields: [workspaceId], references: [id], onDelete: Cascade)

  @@index([workspaceId, snapshotDate])
  @@map("health_snapshots")
}

enum DiagnosticInstrument {
  A1
  A2
  B
  C
}

/// §12 — respostas dos instrumentos de diagnóstico. B (entrevista) é
/// preenchido pelo consultor após a reunião, não pelo cliente — respondidoPor
/// reflete isso (pode ser o consultor, não sempre o titular).
model DiagnosticResponse {
  id           String               @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  workspaceId  String               @map("workspace_id") @db.Uuid
  engagementId String               @map("engagement_id") @db.Uuid
  instrument   DiagnosticInstrument
  /// Estrutura por instrumento — ver lib/method/instruments/.
  answers      Json
  respondedBy  String               @map("responded_by") @db.Uuid
  respondedAt  DateTime             @default(now()) @map("responded_at")

  workspace  Workspace            @relation(fields: [workspaceId], references: [id], onDelete: Cascade)
  engagement ConsultingEngagement @relation(fields: [engagementId], references: [id], onDelete: Cascade)

  @@map("diagnostic_responses")
}

/// §11 — metas da Régua por macrobloco. Registro POR PERÍODO permite a
/// trajetória (§11.4: hoje / 12 meses / 24 meses) sem inventar histórico.
model AllocationTarget {
  id            String     @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  workspaceId   String     @map("workspace_id") @db.Uuid
  macroBloco    MacroBloco @map("macro_bloco")
  targetPercent Decimal    @map("target_percent") @db.Decimal(5, 2)
  /// Nulo = posição-alvo atual (sem prazo); preenchido = meta de trajetória (camada de método).
  horizonMonths Int?       @map("horizon_months")
  setBy         String     @map("set_by") @db.Uuid
  createdAt     DateTime   @default(now()) @map("created_at")

  workspace Workspace @relation(fields: [workspaceId], references: [id], onDelete: Cascade)

  @@map("allocation_targets")
}

enum InsuranceType {
  VIDA
  INVALIDEZ
  DOENCAS_GRAVES
  RESIDENCIAL
  AUTO
  RC_PROFISSIONAL
  OUTROS
}

/// §4 — apólices para o MRP. Registro, não recomendação (§3.1) — o cliente
/// cadastra o que já tem; a PROSPECTA nunca sugere seguradora ou produto.
model InsurancePolicy {
  id             String        @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  workspaceId    String        @map("workspace_id") @db.Uuid
  type           InsuranceType
  insurerName    String        @map("insurer_name")
  insuredCapital Decimal       @map("insured_capital") @db.Decimal(14, 2)
  premiumAmount  Decimal?      @map("premium_amount") @db.Decimal(14, 2)
  validUntil     DateTime?     @map("valid_until") @db.Date
  isActive       Boolean       @default(true) @map("is_active")
  createdAt      DateTime      @default(now()) @map("created_at")

  workspace Workspace @relation(fields: [workspaceId], references: [id], onDelete: Cascade)

  @@map("insurance_policies")
}

/// §5 — cenários do PLA. Um RetirementProjection por cenário (conservador/
/// base/otimista) por versão do plano — nunca sobrescreve, sempre soma versão.
model RetirementProjection {
  id                  String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  workspaceId         String   @map("workspace_id") @db.Uuid
  engagementId        String   @map("engagement_id") @db.Uuid
  scenario            String   // "conservador" | "base" | "otimista"
  version             Int
  targetAge           Int      @map("target_age")
  desiredMonthlyIncome Decimal @map("desired_monthly_income") @db.Decimal(14, 2)
  /// Premissas nomeadas (taxa real de retorno, inflação, fontes já existentes) — ver lib/method/retirement.ts.
  assumptions         Json
  requiredCapital     Decimal  @map("required_capital") @db.Decimal(14, 2)
  requiredMonthlyContribution Decimal @map("required_monthly_contribution") @db.Decimal(14, 2)
  createdAt           DateTime @default(now()) @map("created_at")

  workspace  Workspace            @relation(fields: [workspaceId], references: [id], onDelete: Cascade)
  engagement ConsultingEngagement @relation(fields: [engagementId], references: [id], onDelete: Cascade)

  @@unique([engagementId, scenario, version])
  @@map("retirement_projections")
}
```

#### 5.3.1 Faixas dos 7 indicadores do PSF — Pendência #4 (2026-08-15)

Escala qualitativa de 5 faixas por indicador (§8.3: crítico/frágil/em
construção/saudável/consolidado), cada uma derivada de uma fórmula 0–100% para
poder desenhar a barra visual do §7.1 ("o cliente não enxerga bloqueio, enxerga
marcador subindo"). Onde o método já definia um alvo (reserva de 6 meses, §11.6;
bandas de renda da Régua, §11.3), a faixa usa esse alvo como referência — não
inventa um número novo por cima de um que já existe.

| Indicador | Fórmula (0–100%) | Nível |
|---|---|---|
| Organização | = Índice de Consistência (§13.6, seção 6 Etapa 2) diretamente | Pro |
| Endividamento | `100 − min(100, (compromisso mensal de dívidas ÷ receita líquida média) × 200)` — invertido porque dívida alta é ruim; `× 200` faz 50% de comprometimento zerar a nota | Pro |
| Liquidez | `min(100, (meses de cobertura ÷ 6) × 100)` — usa o mesmo alvo de 6 meses já definido em `lib/finance/reserve.ts` (§11.6), não um número novo | Pro |
| Proteção | `(reserva atingida % × 50%) + (coberturas cadastradas ÷ coberturas recomendadas × 50%)` — metade progresso de reserva, metade completude de apólices | Max |
| Construção Patrimonial | `min(100, (% da renda no bloco Poupança do período ÷ piso da banda de renda do cliente, §11.3) × 100)` — atingir o piso da própria faixa de renda já vale 100% | Max |
| Longevidade | `min(100, (aporte atual ÷ aporte necessário do PLA) × 100)` | Método |
| Continuidade | `(itens do checklist sucessório concluídos ÷ total de itens) × 100` | Método |

Faixas (iguais para todos os indicadores, sobre o resultado 0–100%): **crítico**
0–20 · **frágil** 20–40 · **em construção** 40–60 · **saudável** 60–80 ·
**consolidado** 80–100. Limiares redondos de propósito — o texto de origem (§8.3)
já avisa para não sugerir precisão que o dado não tem; um corte em "63,4%" seria
falso rigor.

**Confiança desta proposta:** alta para Organização/Liquidez (reaproveitam alvo já
definido no sistema) e Endividamento (fórmula direta); média para
Proteção/Construção (a ponderação 50/50 e o uso do piso da banda de renda são
escolhas razoáveis, não derivadas de nenhum número do documento de origem); baixa
para Longevidade/Continuidade só porque dependem de entidades que ainda não
existem (`RetirementProjection`, checklist do PCP) — a fórmula pode precisar de
ajuste quando essas telas forem desenhadas de verdade nas Etapas 13/15.

### 5.4 `Debt` — a entidade adiada em 2026-08-11, agora com a clareza que faltava

O comentário original em `schema.prisma` dizia: *"Dívidas (`debt`) fica de fora
desta etapa, adiado a pedido do usuário até haver mais clareza de uso real."* O MEC
(§10, Fase 3) é exatamente essa clareza — precisa de CET, credor, negativação e
plano de quitação, que `openInstallmentGroups()` nunca teve porque foi desenhado só
para acompanhar parcelas de `Entry`, não para gerir a saúde de crédito.

```prisma
enum DebtStatus {
  EM_DIA
  NEGATIVADO
  RENEGOCIADO
  QUITADO
}

/// §10 Fase 3 — MEC. Não substitui "Despesas parceladas" (lib/finance/open-
/// installments.ts, que continua lendo Entry normalmente) — é uma camada de
/// gestão de crédito por cima, opcionalmente ligada às parcelas via groupId.
model Debt {
  id                String     @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  workspaceId       String     @map("workspace_id") @db.Uuid
  /// Liga ao EntryGroup do parcelamento correspondente, quando existir —
  /// nulo para dívida ainda não lançada como parcela (ex.: cheque especial).
  entryGroupId      String?    @map("entry_group_id") @db.Uuid
  creditorName      String     @map("creditor_name")
  modality          String
  outstandingBalance Decimal   @map("outstanding_balance") @db.Decimal(14, 2)
  /// Custo Efetivo Total anualizado, em % — ordena o MEC por custo, não por saldo (§10).
  cetAnnualPercent  Decimal?   @map("cet_annual_percent") @db.Decimal(6, 2)
  hasNegativação    Boolean    @default(false) @map("has_negativacao")
  hasLegalAction    Boolean    @default(false) @map("has_legal_action")
  status            DebtStatus @default(EM_DIA)
  quitationTargetDate DateTime? @map("quitation_target_date") @db.Date
  notes             String?
  createdAt         DateTime   @default(now()) @map("created_at")
  updatedAt         DateTime   @updatedAt @map("updated_at")

  workspace  Workspace   @relation(fields: [workspaceId], references: [id], onDelete: Cascade)
  entryGroup EntryGroup? @relation(fields: [entryGroupId], references: [id])

  @@map("debts")
}
```

**Critério de "dívida tóxica" — Pendência #9 (2026-08-15).** O texto de origem
(§9.6, §10 Fase 3) já dá os dois sinais: modalidade ("rotativo de cartão, cheque
especial, crédito pessoal acima de patamar definido") e custo ("juros compostos em
patamares de três dígitos ao ano"). Proposta, direta do próprio texto, sem número
inventado: `Debt` é tóxica quando `modality ∈ {"Rotativo do cartão", "Cheque
especial"}` **ou** `cetAnnualPercent >= 100` (o "três dígitos ao ano" citado
literalmente). É esse sinalizador que antecipa a Fase 3 para rodar em paralelo com
a Fase 2 (§9.6) e que aciona a regra de pré-requisito dos projetos especializados
(abaixo).

**Faixas mínimas de pré-requisito dos projetos especializados — Pendência #5
(2026-08-15).** A tabela de §4.9 já diz *qual* indicador do PSF cada projeto exige;
faltava o valor mínimo. Usando as faixas de 5.3.1 (mesma escala 0–100%, sem inventar
uma segunda):

| Projeto | Pré-requisito (§4.9) | Valor mínimo proposto |
|---|---|---|
| Reestruturação de Dívidas | Nenhum | — |
| Longevidade e Aposentadoria | Organização em faixa mínima | Organização ≥ 40 (nível "em construção") |
| Política de Investimentos | Liquidez em faixa mínima (reserva constituída) | Liquidez ≥ 80 ("saudável" — equivale à reserva de 6 meses já quase completa, mesmo espírito da trava dura Fase 4→6 do §7.2) |
| Estruturação Patrimonial | Organização + Endividamento em faixa mínima | Ambos ≥ 40 |
| Planejamento Sucessório | Proteção avaliada | Proteção ≠ null (existe ao menos 1 `InsurancePolicy` cadastrada — "avaliada" é presença de dado, não uma nota mínima) |
| Organização PF/PJ | Nenhum | — |

Se o pré-requisito não for atendido, a Etapa correspondente (11 em diante) usa o
mesmo texto de redirecionamento já roteirizado em §4.9 ("antes de estruturar sua
sucessão, precisamos resolver X...") — nenhuma tela nova além do que a Etapa já
previa, só a checagem antes de liberar a contratação.

**Nenhuma das 12 tabelas/enums acima toca `Entry`, `Wallet` ou `Category` além dos
campos opcionais de 5.1** — a mesma garantia que a Metodologia v5.0 já exige em
§13.7.

### 5.5 IA Assistente e Automações (Max) — desenho por benchmark, decisão de 2026-08-15

A Metodologia v5.0 cita `ia_assistente` e `automacoes` no catálogo do Max (§13.8)
sem detalhar escopo. Por pedido do usuário, o desenho abaixo parte de como o mercado
já resolve isso, não de suposição.

**O que foi verificado (agosto de 2026):**

- **Monarch Money** — Assistente de IA responde pergunta em linguagem natural
  ("quanto gastei em restaurante no último trimestre?") e produz um "Weekly Recap"
  — resumo semanal de gastos, fluxo de caixa e mudanças em recorrências. A IA
  **interpreta e resume dado já calculado**, não computa valor monetário livremente.
- **Copilot Money** — IA de categorização que aprende com a correção do usuário.
  **Já existe no PROSPECTA Finance** — é exatamente `DescriptionRule` +
  `lib/import/suggest-category-bulk.ts`. Nada novo a construir aqui.
- **YNAB** — categorização automática por memória de favorecido + transações
  agendadas. **Já coberto** pela combinação `RecurrenceKind` + `DescriptionRule`.
- **Rocket Money / Cleo** — automação "agêntica": cancela assinatura, negocia
  fatura, move dinheiro sozinho (Cleo Plus, 2026). Depende de acesso transacional
  real (agregador bancário/Open Finance).
- **Mobills** — automação = sincronização bancária automática. Mesma dependência.
- **Pierre** (CloudWalk, benchmark adicionado em 2026-08-15, a pedido do usuário) —
  assistente brasileiro, "conversa em vez de dashboard": conecta via Open Finance a
  100+ instituições, importa tudo automaticamente, e substitui a tela por
  notificação proativa. Achado mais relevante: **arquitetura de três agentes
  especializados por cadência**, não um modelo único — "Albert" monitora anomalias
  diárias (gasto fora do padrão), "Marie" analisa tendência comportamental
  quinzenal, "Galileu" entrega visão estratégica mensal (projeção, rebalanceamento).
  Usuário também cria alertas próprios por categoria/limite. Frase da empresa após a
  aquisição: não compraram Pierre "para adicionar uma função de IA", e sim "para
  criar uma nova interface de relação financeira" — o chat como substituto do
  dashboard, não complemento dele. **Achado que mais importa para esta decisão:**
  mesmo com acesso transacional completo via Open Finance (capacidade técnica de
  mover dinheiro), Pierre **também** só detecta e notifica — nunca age sozinho.
  Isso não é uma limitação de Pierre, é uma escolha de produto do próprio líder de
  mercado com a infraestrutura que faltaria ao PROSPECTA Finance — reforça que
  "alerta, nunca execução" não é uma segunda opção por falta de Open Finance, é o
  padrão correto mesmo para quem tem a peça que falta aqui.

**Decisão de posicionamento, derivada do próprio método (reforçada pelo achado do
Pierre):** Open Finance está fora do escopo de lançamento (§5.9) e o método proíbe
agir por procuração ou executar em nome do cliente (P2, P8 — "a execução técnica...
é do profissional habilitado; a comportamental é do cliente"). Isso significa que
**replicar o modelo agêntico de Cleo/Rocket Money exigiria uma peça (rail de
pagamento) que a própria Metodologia já decidiu não ter, e uma ação (mover
dinheiro/negociar sozinho) que o método já proíbe.** A escolha correta não é imitar
o recurso mais chamativo do concorrente — é reconhecer que "automação" no PROSPECTA
Finance só pode significar **detectar e alertar**, nunca **executar**. Isso é, na
prática, mais alinhado à postura regulatória do método do que qualquer alternativa
"agêntica" — e o próprio Pierre, que TEM a peça que falta aqui, faz a mesma escolha.

**Estrutura adotada do Pierre — cadência, não agentes com nome próprio.** Sem
personificar ("Albert"/"Marie"/"Galileu" não fazem sentido fora do posicionamento de
marca do Pierre), mas a lógica de organizar verificações por horizonte temporal é
boa e independe de Open Finance — funciona igual sobre dado já lançado no sistema:

| Horizonte | Espírito | Gatilhos desta etapa |
|---|---|---|
| Imediato | anomalia pontual | `LIMIAR_CATEGORIA`, `VARIACAO_RECORRENCIA` |
| Periódico | padrão acumulando | `INCIDENTE_ACUMULADO`, `VENCIMENTO_PROXIMO` |
| Estratégico | visão de mês | `META_FORA_DA_TRAJETORIA` |

Nesta etapa, todos os gatilhos rodam na mesma janela diária (ver 6.1) — a tabela
acima organiza o *raciocínio* de cada verificação, não agenda de execução separada
por enquanto; múltiplos crons por cadência é otimização prematura sem volume real de
uso.

**Correção de premissa, encontrada ao investigar antes de codar:** a versão anterior
deste documento (seção 6, Etapa 6) dizia que o motor de automação rodaria "mesmo
padrão do job mensal de extensão de recorrência já existente" — **isso não existe**.
Conferido em `lib/finance/installments.ts::generateInstallments()`: a materialização
de 24 meses acontece inteira no momento da criação do lançamento recorrente, não via
job periódico nenhum. Não há `vercel.json`, nem rota de cron, nem qualquer
infraestrutura de execução periódica neste projeto hoje. A Etapa 6 precisa criar essa
peça do zero (seção 5.5.1), não reaproveitar nada.

**Escopo do Assistente de IA nesta etapa — determinístico por palavra-chave, não um
modelo de linguagem de verdade.** Construir compreensão de linguagem natural livre
exigiria integrar uma API de IA externa (custo recorrente, chave de API nova,
decisão comercial que não foi pedida nesta sessão). O que entra agora é o motor de
consulta estruturada completo — a peça seguindo o desenho do parágrafo anterior
(pergunta → `answerQuery` → resposta) — com o reconhecimento de pergunta feito por
casamento de padrão sobre um catálogo pequeno de perguntas comuns ("quanto tenho de
saldo", "quanto gastei em [categoria] este mês", "quantos incidentes pendentes"), em
vez de um modelo de linguagem real. Trocar o casamento de padrão por uma LLM de
verdade depois é uma mudança isolada (só a função que decide qual `answerQuery`
rodar muda) — todo o resto (auditoria, guarda-corpo, estrutura de resposta) já fica
pronto para isso.

**IA Assistente — Q&A determinístico, nunca cálculo livre pelo modelo.** A pergunta
em linguagem natural é traduzida para uma chamada estruturada a `lib/finance/`
(as mesmas funções puras já testadas que alimentam Painel/Relatórios) — o modelo de
linguagem nunca "calcula" um valor monetário por conta própria, só formata a
resposta em português a partir de um número que `lib/finance/` já produziu. Isso é
auditável (a consulta estruturada fica gravada, não só a resposta em texto) e
elimina o risco de alucinação num domínio onde o número errado é o pior erro
possível. Guarda-corpo obrigatório (P2, §3.1/§3.2): o assistente **nunca** é
autorizado a responder com nome de produto, ativo, emissor ou recomendação de
compra/venda — seu acesso a ferramentas é limitado a consultas de leitura sobre o
dado do próprio workspace.

**Automações — motor de regras, ação sempre = alerta.** Cada regra observa uma
condição sobre dado já existente e, quando verdadeira, produz uma linha em
`Notification` (tabela já existente, nunca usada por código ainda) — nunca cria,
edita ou liquida um `Entry`, nunca transfere, nunca cancela nada externamente.

```prisma
enum AutomationTrigger {
  LIMIAR_CATEGORIA        // gasto de uma categoria passou de X no período
  VENCIMENTO_PROXIMO      // compromisso vence em N dias
  VARIACAO_RECORRENCIA    // valor de uma recorrência mudou vs. histórico (ex.: assinatura que subiu de preço)
  META_FORA_DA_TRAJETORIA // Goal abaixo do ritmo necessário pro targetDate
  INCIDENTE_ACUMULADO     // fila de incidentes passou de N itens
}

/// Max. Nunca executa ação financeira — só produz Notification. Sem acesso
/// transacional (§5.9, Open Finance adiado): "automação" aqui é alerta, não
/// execução, por desenho, não por limitação temporária.
model AutomationRule {
  id          String            @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  workspaceId String            @map("workspace_id") @db.Uuid
  trigger     AutomationTrigger
  /// Parâmetros do gatilho — {categoryId, thresholdAmount} / {daysBefore} / etc.,
  /// forma por trigger documentada em lib/method/automation-engine.ts.
  condition   Json
  isActive    Boolean           @default(true) @map("is_active")
  createdBy   String            @map("created_by") @db.Uuid
  createdAt   DateTime          @default(now()) @map("created_at")

  workspace Workspace @relation(fields: [workspaceId], references: [id], onDelete: Cascade)

  @@map("automation_rules")
}

/// Histórico de perguntas ao assistente — auditoria (P9; LGPD Art. 20 já exige
/// isso para o PSF, mesmo princípio aplicado aqui). answerQuery grava a
/// consulta estruturada que de fato gerou a resposta — cada resposta é
/// reproduzível, não só um texto solto.
model AiInteraction {
  id          String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  workspaceId String   @map("workspace_id") @db.Uuid
  askedBy     String   @map("asked_by") @db.Uuid
  question    String
  answerQuery Json?    @map("answer_query")
  answerText  String   @map("answer_text")
  createdAt   DateTime @default(now()) @map("created_at")

  workspace Workspace @relation(fields: [workspaceId], references: [id], onDelete: Cascade)

  @@map("ai_interactions")
}
```

#### 5.5.1 Infraestrutura de execução periódica — nova, não existia

Vercel Cron (já disponível no plano usado por este projeto, sem custo adicional
para 1 execução diária): `vercel.json` com uma entrada de cron apontando para
`app/api/cron/automations/route.ts`, protegida pelo header `Authorization: Bearer
${CRON_SECRET}` que a própria Vercel envia (padrão oficial da plataforma — nunca um
endpoint aberto). A rota varre todos os workspaces com `AutomationRule` ativa,
avalia cada uma contra o dado atual (`lib/method/automation-engine.ts`, puro) e
grava uma `Notification` pra cada regra que disparar. Roda 1x ao dia — não há
volume de uso ainda que justifique granularidade maior; múltiplas cadências reais
(diário/quinzenal/mensal, seção 5.5) ficam para quando houver sinal de que
verificação diária de tudo é cedo ou tarde demais pra algum gatilho específico.

### 5.6 Conciliação de saldo — captura para o Índice de Consistência (§13.6)

Decisão do usuário, 2026-08-15: o componente "Conciliação" do Índice de
Consistência (Pendência #3) entra na Etapa 2, não fica adiado. O sistema hoje não
tem nenhum lugar onde a pessoa informa "meu saldo real é X" — esta é a captura
mínima que falta.

```prisma
/// §13.6 — captura periódica e leve de "quanto essa carteira realmente tem",
/// pra comparar contra o saldo calculado (lib/finance/balance.ts). Não é
/// conciliação bancária de verdade (isso seria Open Finance, §5.9, fora de
/// escopo) — é o cliente confirmando de próprio punho, mesmo espírito de
/// conferência manual de extrato.
model BalanceReconciliation {
  id              String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  workspaceId     String   @map("workspace_id") @db.Uuid
  walletId        String   @map("wallet_id") @db.Uuid
  declaredBalance Decimal  @map("declared_balance") @db.Decimal(14, 2)
  systemBalance   Decimal  @map("system_balance") @db.Decimal(14, 2)
  /// Diferença travada no momento da checagem — não recalculada depois,
  /// pra registro histórico ficar estável mesmo se lançamentos passados mudarem.
  checkedBy       String   @map("checked_by") @db.Uuid
  checkedAt       DateTime @default(now()) @map("checked_at")

  workspace Workspace @relation(fields: [workspaceId], references: [id], onDelete: Cascade)
  wallet    Wallet    @relation(fields: [walletId], references: [id], onDelete: Cascade)

  @@index([workspaceId, walletId, checkedAt])
  @@map("balance_reconciliations")
}
```

Componente de Conciliação no Índice de Consistência: `1 −
(|declaredBalance − systemBalance| ÷ max(|declaredBalance|, 1))`, usando a
checagem mais recente de cada carteira ativa; carteira nunca conferida entra como
"não avaliada" (mesmo padrão do PSF, §8.3), não como falha — evita que todo
workspace novo comece com nota baixa por falta de uso, não por inconsistência real.

### 5.7 Acesso do consultor — `Membership.advisorCanWrite` (decisão de 2026-08-15)

Ver seção 3.2. Um campo, coluna nova, `default(false)` — mais restritivo que o
comportamento atual, de propósito: é uma correção deliberada, não uma extensão
neutra, decidida com o usuário por exigência de segurança/LGPD.

```prisma
model Membership {
  // ...todos os campos atuais, inalterados...

  /// Só tem efeito quando role = ADVISOR — ignorado nos demais papéis (TITULAR/
  /// MEMBRO/LEITURA continuam regidos só por role, sem mudança de comportamento).
  /// default(false): consultor nasce só com leitura, mesmo com Membership ACTIVE.
  /// TITULAR concede/revoga a qualquer momento (nunca o próprio consultor).
  advisorCanWrite Boolean @default(false) @map("advisor_can_write")
}
```

Mudanças de comportamento associadas (fora do schema, mas parte da mesma decisão):

- `lib/auth/session.ts::can()` — o caso `"write"` para `role = "ADVISOR"` passa a
  checar `membership.advisorCanWrite` em vez de liberar direto; `TITULAR`/`MEMBRO`
  continuam sem mudança (só `LEITURA` nunca escreve, como hoje).
- `prisma/sql/008_rls_completeness.sql` precisa de uma migration nova (não uma
  edição do arquivo já aplicado — nunca editar migration já rodada) trocando `in
  ('TITULAR', 'MEMBRO', 'ADVISOR')` por uma checagem que também considere
  `advisor_can_write` nas tabelas que ele tocou.
- `lib/workspace/advisor.ts::assignAdvisor()` ganha a ação de conceder/revogar
  escrita, registrada em `AccessLog` com `action` nova
  (`"GRANT_ADVISOR_WRITE"`/`"REVOKE_ADVISOR_WRITE"`) — reaproveita a tabela já
  existente, sem criar mecanismo de auditoria paralelo.

**Tratada como correção independente do roteiro do Método** (Etapa 0, seção 6) —
não depende de `ConsultingEngagement` existir, porque `ADVISOR` já é usado hoje sem
nenhuma camada de método por trás.

---

## 6. Etapas de implementação

A sequência de 17 passos de §13.9 é boa e é preservada quase 1:1 — agrupada em 4
blocos de valor entregável, no espírito de como este projeto já trabalha (cada Etapa
termina em um Registro Operacional próprio, com `npm test`, `tsc --noEmit` e `build`
limpos, e verificação ao vivo contra o banco de dev). Nenhuma etapa depende de código
de uma etapa posterior. **Revisão de 2026-08-15:** ganhou uma Etapa nova (6, IA
Assistente + Automações) e por isso as etapas antigas 6–16 viraram 7–17. Ganhou
também uma **Etapa 0**, fora da numeração dos 4 blocos — não é entrega do Método,
é correção de segurança/LGPD sobre o que já existe.

### Etapa 0 — Acesso do consultor: escrita explícita (correção independente) — ✅ concluída em 2026-08-15

| Entrega | Arquivos principais | Depende de |
|---|---|---|
| `Membership.advisorCanWrite` (5.7); `can()` passa a checar o campo para `ADVISOR`; migration nova de RLS (não edita `008_rls_completeness.sql`, que já rodou); `assignAdvisor()` ganha conceder/revogar escrita, auditado em `AccessLog` | `Membership.advisorCanWrite`; `lib/auth/session.ts::can()`; `prisma/sql/011_advisor_write_grant.sql` (novo); `lib/workspace/advisor.ts` | — (usa só o que já existe hoje: `Membership`, `AccessLog`) |

Recomendado **antes** do Bloco I ou em paralelo — não tem relação técnica com o
roteiro do Método (não depende de `PlanGrant`/`ConsultingEngagement`), só está fora
da contagem de 17 porque não é uma entrega do Método, é a correção de uma decisão
de acesso já em produção. Quanto mais cedo, menor a chance de algum fluxo real de
consultoria já ter se acostumado com a escrita automática.

**Status: implementada e verificada contra o banco de dev (Registro Nº 066).**
`Membership.advisorCanWrite` aplicado, `can()`/`assertCanWrite()` atualizados nos 46
pontos de chamada (parâmetro obrigatório, sem default — o compilador apontou todos),
`AdvisorWriteToggle.tsx` em `/admin/usuarios`, RLS em sincronia. `tsc`, `npm test`
(305/305) e `npm run build` limpos; 9 testes de integração novos contra o banco de
dev real. Não implementado ainda: concessão direta pelo TITULAR do workspace (hoje
só o admin da plataforma concede/revoga, via `/admin/usuarios`) — extensão natural
futura, fora do escopo desta correção.

### Bloco I — Motor comercial e monetização imediata (Etapas 1–6) — ✅ fechado em 2026-08-15, **em produção desde 2026-08-16** (Registro Nº 075)

Sustenta a diferença real entre Start/Pro/Max e liga o que já existe. Nenhuma
depende de haver um cliente de consultoria.

| Etapa | Entrega | Arquivos principais | Depende de |
|---|---|---|---|
| **1** ✅ | `macro_bloco` na taxonomia (seed inicial das 285 subcategorias de Despesa, já classificado — ver planilha de revisão) + override por lançamento + Régua (posição atual, fórmula da Poupança por soma direta, bandas de referência de §11.3) + `ownerPersonId` opcional em Wallet/Investment/Asset (preparação para Open Finance e diagnóstico familiar do Método, seção 5.1) | `Subcategory.macroBloco`, `Entry.macroBlocoOverride`, `Wallet/Investment/Asset.ownerPersonId` (5.1); `seeds/seed_macro_blocos.csv` (novo); `lib/method/allocation.ts` (novo); `app/(app)/relatorios/regua/` (novo) | — |
| **2** ✅ | Índice de Consistência (§13.6) — pesos confirmados: cobertura temporal 25%, qualidade de categorização 25%, fila de incidentes 20% (sem incidente aberto há mais de 30 dias), cobertura de carteiras 15%, conciliação 15% (nova captura de saldo declarado, seção 5.6) | `BalanceReconciliation` (5.6); coluna "Conciliação" em `app/(app)/cadastros/carteiras/` (a captura ficou colada onde a carteira já é gerenciada, em vez de tela própria); `lib/method/consistency.ts` (novo, 5 componentes) | Etapa 1 não é pré-requisito técnico, mas os dois formam o "Painel de Saúde" visualmente |
| **3** ✅ | `Plan`/`Feature`/`PlanFeature` reais — seed inicial dos 6 SKUs (Start/Pro/Max × Individual/Família) e do catálogo de §13.8, mais a tela `/admin/planos` (seção 3.1) pra atribuir feature↔plano e `gateKind` sem deploy; `hasFeature()` ligado às primeiras telas | `prisma/seed-plans.ts` (novo, mesmo padrão de `seed.ts`); `Feature.gateKind` (5.2); `app/(app)/admin/planos/` (novo); `lib/billing/entitlements.ts` (estende, não reescreve) | Etapa 1 (para gatear `regua_posicao`) |
| **4** ✅ | `PlanGrant` + resolução de nível efetivo em 3 camadas (§4.6); enforço do teto de assento da variante Família em `lib/workspace/invite.ts` | `PlanGrant` (5.2); `lib/billing/effective-level.ts` (novo) | Etapa 3 |
| **5** ✅ | PSF níveis 1 e 2 + `HealthSnapshot` (histórico) | `HealthSnapshot` (5.3); `lib/method/psf.ts` (novo, 5 dos 7 indicadores — Organização, Endividamento, Liquidez, Proteção, Construção); `app/(app)/painel/saude-financeira/` (novo) | Etapas 1–4 (Organização usa Etapa 2; Endividamento precisa do ajuste de denominador — ver nota abaixo) |
| **6** ✅ | IA Assistente (Q&A por casamento de padrão sobre um catálogo pequeno de perguntas, nunca recomenda produto — P2; LLM de verdade é upgrade futuro isolado) + motor de Automações (alerta via `Notification`, nunca execução financeira — §5.9), organizado por cadência (imediato/periódico/estratégico, benchmark Pierre) | `AutomationRule`, `AiInteraction` (5.5); `lib/method/automation-engine.ts` (novo); `lib/method/ai-assistant.ts` (novo, traduz pergunta → chamada estruturada a `lib/finance/`); `vercel.json` + `app/api/cron/automations/route.ts` (novo — infraestrutura de execução periódica não existia, seção 5.5.1) | Etapa 3 (features `ia_assistente`/`automacoes` precisam existir no catálogo) |

**Etapa 1 — status: implementada e verificada contra o banco de dev (Registro Nº
067).** `computeAllocation`/`percentOfIncome`/`bandForIncome`/`compareToBand`
implementados com 18 testes unitários; tela `/relatorios/regua` no ar (grupo
Relatórios, sem regime nem PDF nesta primeira versão). Teste de integração novo
confirma, contra dado real: as três decisões da revisão de 2026-08-15 (financiamento
= Essencial, vestuário conforme o método, Poupança por soma direta) persistidas
corretamente, e o fluxo Entry → Prisma → `computeAllocation` bate com o esperado.
`tsc`, `npm test` (323/323) e `npm run build` limpos.

**Etapa 2 — status: implementada e verificada contra o banco de dev (Registro Nº
068).** Os 5 componentes + `computeConsistencyIndex()` implementados com 27 testes
unitários; captura de conciliação integrada à tela de Carteiras já existente, em vez
de tela nova dedicada (decisão de implementação — não muda o desenho do documento).
`filaDeIncidentes` reaproveita `lib/finance/incidents.ts::isEntryIncident` em vez de
duplicar a definição. `tsc`, `npm test` (350/350) e `npm run build` limpos. O
Índice de Consistência em si ainda não tem uma tela própria que mostre o número
composto — isso é natural: ele alimenta o indicador "Organização" do PSF, que é
Etapa 5, ainda não implementada.

**Etapa 3 — status: implementada e verificada contra o banco de dev (Registro Nº
069).** A primeira etapa que efetivamente liga `hasFeature()` a uma tela real — por
isso a mais arriscada até agora. Achado crítico antes de gatear qualquer coisa:
nenhum dos workspaces reais tinha `Subscription`, o que travaria todo mundo; a
solução (plano `LEGACY_INTERNAL`, já previsto em `ARQUITETURA-IDENTIDADE-
PLANOS.md`) já existia, só nunca tinha rodado contra o banco de dev atual — reforçada
com o catálogo novo inteiro e reaplicada antes de qualquer gate ser escrito. 61
features no catálogo (49 novas + 2 reaproveitadas de um catálogo de roadmap
anterior com nome igual — `ia_assistente`, `open_finance` — + 12 antigas
preservadas mas agora órfãs de plano ativo). `/relatorios/regua` (Etapa 1) é a
primeira tela gateada, por `regua_posicao`. `/admin/planos` no ar. `tsc`, `npm
test` (350/350) e `npm run build` (69 rotas) limpos.

**Etapa 4 — status: implementada e verificada contra o banco de dev (Registro Nº
070), fecha o Bloco I.** `PlanGrant` + `hasFeature()` somando três fontes
(Entitlement, Subscription, PlanGrant ativo); teto de assento em
`lib/workspace/invite.ts`. Segundo achado crítico da sessão, desta vez pego pelos
próprios testes de integração pré-existentes falhando: a primeira versão do teto
aplicava `cap=1` por padrão pra workspace sem Subscription — o caso de toda
produção hoje, já que o backfill da Etapa 3 só rodou contra o dev — o que teria
bloqueado convite de qualquer cliente real sem nenhuma mudança de plano ter
acontecido. Corrigido: sem plano conhecido, sem restrição. `tsc`, `npm test`
(350/350) e `npm run build` (69 rotas) limpos; suíte de integração com 13
arquivos, 55 testes.

**Nota sobre o indicador de Endividamento (§13.5):** hoje `lib/finance/open-
installments.ts::monthlyDebtCommitment()` soma compromisso mensal, mas nada no
sistema divide isso pela renda — os relatórios de Dívidas de hoje não calculam
percentual algum. `lib/method/psf.ts` **adiciona** essa razão
(`monthlyDebtCommitment ÷ receita líquida média`) como um cálculo novo,
especificamente para o PSF — a tela de Dívidas atual continua exibindo exatamente o
que exibe hoje, sem nenhuma mudança.

**Etapa 5 — status: implementada e verificada contra o banco de dev (Registro Nº
071).** 5 dos 7 indicadores implementados com 18 testes unitários (+3 de
`averageMonthlyIncome`, novo em `lib/finance/reserve.ts`, espelhando
`averageMonthlyExpense`). Decisão de desenho documentada explicitamente no código
(`lib/method/psf.ts::liquidez()`) pra não regredir um bug já corrigido: Liquidez
mede fôlego geral (saldo líquido ÷ despesa média), nunca `goalProgress()`/a `Goal`
de reserva do usuário — são perguntas diferentes, e o Painel já teve um bug real
corrigido antes desta sessão por confundir as duas. Proteção usa 100% do peso na
reserva por enquanto — a metade de cobertura de seguros aguarda `InsurancePolicy`
(Etapa 12). Nova tela `/painel/saude-financeira`, gateada por
`psf_nivel_1`/`psf_nivel_2` (já cobertas por `LEGACY_INTERNAL` desde a Etapa 3,
nenhum backfill novo necessário), distinguindo "não avaliado" de "disponível no
Max" (§8.3). `tsc`, `npm test` (371/371) e `npm run build` (70 rotas) limpos;
suíte de integração com 14 arquivos, 58 testes.

**Etapa 6 — status: implementada e verificada contra o banco de dev (Registro Nº
072), fecha o Bloco I.** Benchmark do sistema Pierre (CloudWalk) feito antes de
codar: mesmo com acesso transacional completo via Open Finance, o próprio líder
de mercado só alerta, nunca executa sozinho — validou o desenho já planejado
(automação = `Notification`, nunca `Entry`/transferência/cancelamento). Achado
ao investigar antes de codar: a premissa anterior deste documento ("reaproveita
o job mensal de recorrência já existente") era falsa — não existia job nenhum
nem infraestrutura de cron no projeto; construídos do zero (`vercel.json` +
`app/api/cron/automations/route.ts`, 1ª rota de cron do projeto). 5 gatilhos de
automação implementados com 20 testes unitários; Assistente por casamento de
padrão (5 intenções + recusa explícita de recomendação de produto/ativo) com 13
testes unitários. `lib/method/run-automations.ts` isola a lógica impura da
rota HTTP, testável direto contra o banco de dev sem simular requisição.
`tsc`, `npm test` (404/404) e `npm run build` (64 rotas) limpos; suíte de
integração com 15 arquivos, 62 testes. Não verificado por navegação real
logada — tentativa de login sem senha (magic link) bloqueada pelo
classificador de permissão do ambiente no passo de injetar o cookie de sessão
no browser; sem tentativa de contornar.

### Bloco II — Camada de Método (Etapas 7–10)

Abre a trilha de consultoria propriamente dita.

| Etapa | Entrega | Depende de |
|---|---|---|
| **7** ✅ | `funcao_patrimonial` em bens/investimentos/carteiras + achado automático de "ativo sem função" (§13.4) | Bloco I (Max) |
| **8** ✅ | `ConsultingEngagement` + `MethodPhase` + `GateCheck` — a trilha de fases e o ritual de passagem (§7.3) em tela para o consultor. Registro Nº 084 | Etapa 4 (`PlanGrant` nasce junto com o engagement) |
| **9** ✅ | `Deliverable` + templates dos 10 artefatos codificados (PAN, AFF, RAP, MEC, MRP, PLA, PIP, MFP, PCP, PFI) — v0 pode ser HTML/PDF gerado a partir de `content: Json`, reaproveitando `lib/reports/pdf/` já existente como padrão de geração | Etapa 8 |
| **10** ◐ | Instrumentos A1/A2/C como formulário digital + envio automático (A1 na Fase 0, A2+C na Fase 1) | Etapa 8 |

**Etapa 10 — status: formulários implementados e verificados; envio automático
pendente (Registro Nº 092, 2026-08-17).** `DiagnosticResponse` + catálogo puro em
`lib/method/instruments/`, telas `/metodo/instrumentos` e
`/metodo/instrumentos/[code]`, gateadas por `diagnostico_dip`. Os **campos** de
cada instrumento vêm literalmente de §12.3 (A1), §12.4 (A2) e §12.6 (C); a
**redação pergunta a pergunta** segue sendo decisão do dono do produto
(Pendências #6–8 da Metodologia v5.0) e está marcada como `redacaoConfirmada:
false`, com um teste que falha de propósito quando for definida.

O `◐` na tabela é literal: a metade **"envio automático"** da entrega não foi
feita. §12.4 prevê que o A2 seja "guiado pelo sistema após a entrevista, com
prazo e lembretes automáticos", e hoje não há disparo nem lembrete — o cliente
só encontra o formulário se entrar na tela. A infraestrutura de cron
(`runDueAutomations`) e a de e-mail (Brevo) já existem, então o que falta é
ligar as duas a um gatilho de prazo, não construir base nova.

B continua fora de escopo por decisão do próprio documento (§12.5: uso interno,
nunca entregue ao cliente); o enum do banco já o prevê.

#### Etapa 9-A — Proteção e Segurança / PROSPECTA-MCRF (antecipa a Etapa 12)

Reordenação decidida com o usuário em 2026-08-16, a partir da especificação
`PROSPECTA_MCRF_Gestao_de_Risco_Financeiro_Pessoal.md` (metodologia
PROSPECTA-MCRF-1.0). Antecipa `InsurancePolicy`/MRP, que eram Etapa 12, porque o
indicador **Proteção do PSF só sai de zero quando reserva e seguros existirem
juntos** — hoje ele espelha Liquidez por falta da metade de coberturas.

A `ConsultingEngagement` (Etapa 8 original) fica para depois: ela destrava
features de método, que só fazem sentido com consultor ativo, enquanto o MCRF é
valor direto ao cliente final.

**Gate comercial (decisão do usuário, 2026-08-16):** reserva recomendada e
stress tests em `reserva_inteligente` (**Max**, `gateKind = PLANO`); mapa de
riscos e plano de tratamento em `mrp_completo` (**método**, exige consultor).
Seguros seguem em `seguros_cadastro` (Max), que já existia — nenhuma feature
duplicada foi criada.

| Sub-etapa | Entrega | Depende |
|---|---|---|
| **9-A.1** ✅ | Perfil de risco: `Person` estendida (§19/§21), `IncomeSource` (§14), motor de observação de renda, tela `/protecao/perfil` | — |
| **9-A.2** ✅ | `InsurancePolicy` + coberturas + `BenefitEntitlement` (§25/§26) | 9-A.1 |
| **9-A.3** ✅ | CEMA, CCM, liquidez elegível, IPP — puros (§11/§12/§20/§30). Registros Nº 079 e 080 | 9-A.1 |
| **9-A.4** ✅ | Stress tests A–H + Reserva Recomendada + `McrfAssessment` versionado (§31/§35/§48). Registro Nº 081 | 9-A.2, 9-A.3 |
| **9-A.5** ✅ | Telas: reserva, explicação, stress test visual, mapa de riscos (§39/§41/§42/§56). Registro Nº 082 | 9-A.4 |
| **9-A.6** ✅ | Simulador "E se?" e plano de construção (§43/§44). Registro Nº 083. Protocolo de recomposição (§45) e aprendizado com eventos (§46) entregues depois, via `ShockEvent` — Registro Nº 085 |
| **9-A.7** ✅ | PSF passa a consumir MCRF em Proteção e Liquidez. Registro Nº 083 | 9-A.4 |

**Reuso confirmado no código — três peças centrais da especificação já existiam
com outro nome**, o que encurta muito o caminho: `Subcategory.macroBloco`
(Etapa 1) **é** o eixo de classificação do CEMA (§11);
`funcaoPatrimonial` (Etapa 7) **é** a classificação de liquidez (§29);
`Person` + `Entry.responsibleId` **são** a estrutura familiar e a atribuição de
renda por pessoa (§7.2/§32). `WalletKind.isLiability` já exclui crédito, que
§29.5 proíbe contar como reserva.

**Seis divergências encontradas na especificação e as decisões tomadas** (§58
manda não implementar silenciosamente; cada uma preserva o objetivo de negócio):

1. **§33 dimensiona a reserva por soma de déficits mensais já pisados em zero.**
   Isso ignora que superávit de um mês financia déficit de outro e superestima a
   necessidade. Reserva é estoque, não fluxo — adotado o **pico de saldo
   acumulado negativo** (máximo drawdown). Quando todos os meses são
   deficitários os dois coincidem, então nunca reduz conservadorismo.
2. **§30 multiplica três fatores** (`liquidez × estabilidade × disponibilidade`):
   0,8³ = 0,51 destruiria a elegibilidade de um ativo apenas levemente
   restrito. Mantido o modelo multiplicativo (é explicável), com fatores
   calibrados e piso por classe, versionados em `MethodologyConfig`.
3. **IPRF colidiria com o PSF já em produção** — Liquidez, Proteção e
   Endividamento medem quase o mesmo. Dois scores de saúde divergentes e nenhum
   com autoridade. Decisão: **o IPRF não vira segundo score de capa**; ele
   alimenta os indicadores do PSF e aparece decomposto dentro de Proteção e
   Segurança.
4. **Reserva Recomendada colidiria com `Goal`.** O projeto já teve bug por
   calcular meta de reserva paralela à `Goal` real ("nunca um número paralelo",
   comentário em `painel/page.tsx`). Decisão: MCRF produz **recomendação**;
   `Goal` segue fonte de verdade única do alvo; a tela mostra os dois e oferece
   ação explícita de **adotar a recomendação**.
5. **Margem dupla entre §35 e §37.** Se o cenário H (combinado) já está no
   `max()`, Proteção Reforçada = Recomendada e o terceiro nível some. Decisão:
   Essencial = PLI; **Recomendada = max(PLI, cenários materiais incluindo H) ×
   (1 + margem)**; Reforçada = margem elevada e horizonte estendido.
6. **HHI (§17) e correlação (§18) medem faceta sobreposta.** Penalizar por
   ambos conta a mesma vulnerabilidade duas vezes. Decisão: a **correlação
   ajusta a renda resiliente dentro do cenário**; o HHI fica só como diagnóstico
   no IPRF, fora da conta da reserva.

**Detalhe de implementação que a especificação não menciona e erra a maioria das
implementações:** ao calcular o CEMA (§11.4), a despesa anual precisa ser
**removida da série mensal antes** da mediana e reintroduzida como duodécimo —
senão ela conta duas vezes no mês em que ocorreu.

**Rigidez da despesa (§11.1–11.3) — decidido pelo usuário em 2026-08-16.**
`ESSENCIAL` não distinguia moradia (rígida) de alimentação (ajustável), e é
essa distinção que separa CEMA (custo essencial normal) de CCM (custo durante a
crise, depois de cortes razoáveis). Regra aprovada:

> **Rígida** = contrato de valor fixo que se paga mesmo sem usar.
> **Ajustável** = essencial cujo consumo a pessoa controla.
> **Discricionária** = pode ser suspensa (já é o `ESTILO_DE_VIDA` de hoje).

**Exceção explícita do usuário:** Energia, Água, Gás, Telefone e Internet
entram como **rígidas**, e não como ajustáveis. Tecnicamente são consumo, mas a
compressão real é pequena; a escolha é deliberadamente conservadora — erra para
reserva maior, não menor.

**Redução aplicada às ajustáveis no CCM: 30%.**

**Governança destes parâmetros (decisão do usuário):** rigidez por subcategoria
e o percentual de redução são **globais e editáveis somente pelo administrador
da plataforma**, valendo para todo o sistema — não são configuração por
workspace nem por cliente. Isso mantém a metodologia uniforme (dois clientes
com o mesmo dado precisam receber a mesma recomendação) e é coerente com §20,
que já trata a taxonomia como admin-only, e com §52, que exige parâmetros
centralizados e versionados. Implicação técnica: o percentual não pode ser
constante em código — vira parâmetro em banco (`MethodologyParameter`), com o
valor de `lib/method/mcrf/config.ts` servindo de padrão inicial e fallback.

**Etapa 9-A.2 — status: implementada e verificada, em produção (Registro Nº
078).** `InsurancePolicy`, `InsuranceCoverage` e `BenefitEntitlement` (novos) e
dois motores puros. **O motor não consome a apólice, consome a cobertura:**
franquia, carência e `payoutDelayDays` são o que decide se a proteção reduz a
necessidade de caixa — e o terceiro é o mais esquecido, porque indenização que
chega no 3º mês não paga a conta do 1º (§33). `bestProtectionFor()` aplica a
melhor cobertura e **nunca soma** duas apólices do mesmo risco. `benefits-
engine.ts` implementa §23 (militar/servidor/autônomo/MEI/informal sem FGTS,
seguro-desemprego e rescisão; regime desconhecido nunca nega proteção), e só
conta benefício confirmado **e** com valor. Telas `/protecao/seguros` e
`/protecao/beneficios`, esta filtrando por regime e explicando o que ficou de
fora — a regra é barrada também na Server Action, não só na tela.

**Etapa 9-A.1 — status: implementada e verificada, em produção (Registro Nº
077).** `RegimeTrabalho` (os 15 valores de §19), `SegundaAtividadeNivel` (§21.1–
21.4), `IncomeSourceKind`, `Person` estendida e `IncomeSource` novo — tudo
aditivo e nulo por padrão. `lib/method/mcrf/config.ts` centraliza a versão da
metodologia e os parâmetros (§52: nenhum número mágico); `income-observation.ts`
mede mediana, pior mês, meses sem renda, variabilidade e HHI a partir do `Entry`
real. **Mediana e não média, por decisão registrada em teste**: 5 meses de
R$ 5.000 mais um 13º de R$ 20.000 dá mediana 5.000 e média 7.500 — a média
superestimaria em 50% a renda tida como resiliente e produziria reserva
insuficiente. Tela `/protecao/perfil` no menu novo **Proteção e Segurança**,
que aplica §6 literalmente: a renda **não é perguntada**, é exibida como
observada, e o formulário só pede o que o extrato não revela.

**Etapa 7 — status: implementada e verificada contra o banco de dev (Registros Nº
073 e Nº 074), abre o Bloco II.** `FuncaoPatrimonial` (7 valores) como campo opcional
em `Asset`/`Investment`/`Wallet` — eixo de estoque, independente do `MacroBloco`
(fluxo, Etapa 1) e do `InvestmentClass` (o que a coisa é, não para que serve).
`lib/method/patrimony-function.ts` (novo, puro): `computeFunctionMap()` mantém "sem
função" sempre separado das 7 fatias (mesmo princípio do "não alocado" da Régua e do
"não avaliado" do PSF), `unclassifiedFindings()` é o achado automático de §13.4 (só
valor positivo, maior primeiro) e `buildPatrimonyItems()` monta os itens das três
origens descontando dupla contagem.

**Dupla contagem — a primeira versão errou e foi corrigida (Registro Nº 074).** O
raciocínio original era: lançamento de patrimônio usa AQUISICAO/ATUALIZACAO,
`SETTLED_FOR_BALANCE` é {PAGO, RECEBIDO, ISENTO}, logo somar bens + investimentos +
saldo de carteiras não conta nada duas vezes. **A premissa é verdadeira, a conclusão
não era:** a disjunção vale por lançamento, não no agregado — o dinheiro chega na
carteira de investimento por transferência comum (pernas `PAGO`, que entram no saldo)
e comprar a posição não debita esse caixa, então R$ 10.000 apareciam como R$ 20.000.
Hoje `buildPatrimonyItems()` desconta do saldo de cada carteira as posições que ela
abriga (chaveado por `Investment.walletId`, o que sobra é o caixa não alocado; piso em
zero para posição cadastrada sem transferência). A função ficou no módulo puro de
propósito: a montagem estava duplicada entre tela e teste, e foi isso que deixou o
defeito passar. Vale como precedente para as próximas etapas — **valor agregado de
patrimônio nunca deve ser somado de duas origens sem provar o cenário completo com
transferência real.**

Nova tela `/patrimonio/funcao` (dentro do grupo Patrimônio já existente), gateada por
`patrimonio_funcao` (Max, já no catálogo desde a Etapa 3), com classificação inline;
carteira de passivo sai por `WalletKind.isLiability` e a pseudo-carteira interna
"Patrimônio" por `isPseudoWallet`, nunca por lista de códigos na tela. **Limite de
escopo deliberado:** a tela mostra a distribuição e não julga se está certa — opinar
sobre composição é aconselhamento (§3.1/P2) e pertence ao `mfp_diagnostico` (feature
de método, Etapa 14, exige consultor ativo).

**Em produção desde 2026-08-16** (Registro Nº 075), junto com todo o Bloco I. `tsc` limpo,
`npm test` 423/423, integração 16 arquivos / 70 testes, `npm run build` limpo.

### Bloco III — Entregáveis especializados do método (Etapas 11–15)

Cada um também é vendável isoladamente como Projeto Especializado (§4.9) — a regra
de pré-requisito do §4.9 é aplicação de código sobre o PSF (Etapa 5) + `Debt`
(Etapa 11), não uma entidade nova.

| Etapa | Entrega | Depende de |
|---|---|---|
| **11** | `Debt` (5.4) — MEC completo: CET, credor, negativação, plano de quitação; migração/ligação opcional com `EntryGroup` existente | Bloco I |
| **12** | `InsurancePolicy` + MRP (mapa de coberturas atuais × necessárias) | Etapa 7 (função Proteção) |
| **13** | Motor de projeção de longo prazo + `RetirementProjection` (PLA, 3 cenários) | Etapa 8 (precisa de `ConsultingEngagement` para existir) |
| **14** | `AllocationTarget` com faixa-alvo por classe + alerta de desvio (PIP) sobre a Análise de investimentos já existente (`app/(app)/investimentos/analise`) | Etapa 1 (Régua) |
| **15** | PCP + teste de liquidez sucessória (checklist estruturado sobre `Deliverable`, código PCP) | Etapa 9 |

### Bloco IV — Consolidação e extensão (Etapas 16–17)

| Etapa | Entrega | Depende de |
|---|---|---|
| **16** | Compilador do PFI — agrega os `Deliverable` mais recentes de um engagement num documento único versionado + comparativo do PSF (linha de base × hoje, §10 Fase ∞) | Etapas 9–15 (usa o que cada uma produziu) |
| **17** | Módulo PJ (add-on) — escopo ainda pendente de detalhamento (Pendência #12 da Metodologia v5.0); tratado como etapa própria justamente por isso, para não travar o Bloco III esperando definição | Bloco I (é add-on de assinatura) |

**Sequenciamento sugerido:** Bloco I primeiro, sempre — é o que já paga a conta
(assinatura) e não depende de nenhum cliente de consultoria fechado para existir. Os
Blocos II–III podem, como o próprio documento de origem observa (§13.9), rodar
manualmente em documento/planilha por um tempo, com a Etapa 8 sendo a única
realmente urgente (sem ela não há como ligar um cliente de consultoria a nada do
Bloco III). O Bloco IV fecha o ciclo quando houver volume real que justifique
automatizar o que hoje pode ser montado à mão.

---

## 7. Pendências que bloqueiam etapas específicas

Da seção 17 (Pendências) da Metodologia v5.0, mapeadas às Etapas que dependem de
cada decisão do usuário antes de codar — para não haver suposição embutida em
código onde a decisão ainda é do dono do produto:

| Pendência (Metodologia v5.0 §17) | Bloqueia |
|---|---|
| #1 Classificar cada funcionalidade em Start/Pro/Max | **Confirmada em 2026-08-15**, seção 4 — e deixou de ser fixa: vira seed inicial editável pela tela `/admin/planos` (seção 3.1) |
| #2 Mapear as ~300 subcategorias nos 4 macroblocos | **Metodologia confirmada em 2026-08-15** (financiamento=Essencial, vestuário conforme o método, Poupança por soma direta, seção 5.1) — classificação das 285 subcategorias entregue em planilha; 60 linhas de confiança média/baixa seguem abertas para ajuste fino do usuário, sem bloquear a Etapa 1 |
| #3 Composição e pesos do Índice de Consistência | **Confirmada em 2026-08-15** — pesos e o componente de Conciliação (nova captura `BalanceReconciliation`) definidos na seção 5.6/Etapa 2 |
| #4 Faixas e critérios de cada indicador do PSF | **Confirmada em 2026-08-15**, seção 5.3.1 — fórmula 0–100% + 5 faixas por indicador, reaproveitando alvos já existentes (reserva de 6 meses, bandas de renda da Régua) onde possível |
| #5 Faixas mínimas de pré-requisito dos projetos especializados | **Confirmada em 2026-08-15**, seção 5.4 — valores mínimos por indicador do PSF (5.3.1), derivados do texto de §4.9 sem número inventado |
| #9 Critério objetivo de "dívida tóxica" | **Confirmada em 2026-08-15**, seção 5.4 — modalidade (rotativo/cheque especial) ou CET ≥ 100% a.a., direto do texto de §9.6/§10 |
| #11 Regras de permissão por papel na variante Família | **Confirmada em 2026-08-15**, seção 3.3 — recomendação de manter TITULAR/MEMBRO com escrita idêntica (são coproprietários da mesma unidade econômica, diferente do caso do consultor); teto de 2–5 assentos continua na Etapa 4 |
| #12 Escopo funcional do Módulo PJ | Sem mudança — segue deferida para Etapa 17, aguardando o usuário detalhar o escopo |

As pendências de natureza comercial/jurídica pura (#6–8 instrumentos pergunta a
pergunta, #10 validação de contrato com advogado, #14 templates, #15 ITCMD/SP, #16–20
comerciais) não bloqueiam código de nenhuma Etapa deste documento — afetam o
*conteúdo* que entra em `content: Json` de `Deliverable`/`DiagnosticResponse`, não a
modelagem.

---

## 8. Garantias de não-regressão

Explicitando a regra do usuário em termos verificáveis, para cada Etapa poder ser
auditada contra ela:

1. **Nenhuma migration remove ou renomeia coluna/tabela.** Toda migration desta
   reformulação é `CREATE TABLE` ou `ALTER TABLE ... ADD COLUMN` opcional.
2. **Nenhum arquivo em `lib/finance/` é reescrito** — o que existe (balanço, cartão,
   parcelas, patrimônio, reserva, incidentes) continua servindo exatamente às telas
   que já serve. O novo módulo é `lib/method/` (por analogia estrutural — regras
   puras e testadas, mesmo padrão de `lib/finance/`), que **lê** de `lib/finance/`
   quando precisa (ex.: PSF lê `averageMonthlyExpense`), nunca o contrário.
3. **Nenhuma rota existente muda de comportamento por padrão.** Onde uma tela
   ganha uma seção nova condicionada a `hasFeature()` (ex.: Régua dentro do
   Painel), o restante da tela é idêntico para quem não tem a feature.
4. **`hasFeature()` mantém a assinatura atual.** Código futuro que já a chamar
   continua funcionando sem alteração quando `PlanGrant`/`ConsultingEngagement`
   entrarem no cálculo por trás.
5. **Cada Etapa é um Registro Operacional próprio**, com teste automatizado,
   `tsc --noEmit` e `build` limpos, e verificação ao vivo contra o banco de dev —
   mesmo padrão já em uso desde o Registro Nº 001.

---

## Resumo executivo

A Metodologia PROSPECTA v5.0 já fez o trabalho difícil de decidir *o quê* construir
e *por quê* — este documento confirma que o diagnóstico bate com o código real (com
duas correções: PSF está zerado, não parcial; comercial está no schema, não
operante) e traduz as 10 entidades novas de §13.7 (mais `Debt`, resgatada de uma
decisão de escopo anterior, e `AutomationRule`/`AiInteraction`, desenhadas por
benchmark de mercado em 2026-08-15) em modelagem Prisma concreta, 100% aditiva.

A sequência de 17 passos do documento de origem vira **17 Etapas agrupadas em 4
blocos, mais uma Etapa 0 independente**: **Etapa 0** corrige o acesso de escrita do
consultor (seção 3.2/5.7), fora da contagem do Método porque é correção de
segurança sobre o que já existe, não entrega nova. **Bloco I** (Etapas 1–6) liga o
que já existe, paga a conta sozinho sem depender de nenhum cliente de consultoria,
e inclui o painel administrativo de Planos (seção 3.1), `ownerPersonId` como
preparação para Open Finance (seção 5.1) e o par IA Assistente/Automações
(seção 5.5); **Bloco II** (7–10) abre a trilha de método; **Bloco III** (11–15)
entrega os artefatos vendáveis como projeto avulso; **Bloco IV** (16–17) consolida.
Nenhuma etapa altera, renomeia ou remove qualquer função, tela, tabela ou coluna já
existente — apenas soma.

**Decisões confirmadas nesta revisão (2026-08-15):** `compromissos/incidentes`
mantido no Start; classificação Start/Pro/Max liberada do código-fonte (vira dado
editável via `/admin/planos`); IA Assistente e Automações ganham desenho próprio
(seção 5.5), sempre alerta, nunca execução (coerente com o adiamento de Open
Finance, §5.9); taxonomia das 285 subcategorias de Despesa classificada (seção 5.1);
Índice de Consistência com pesos e captura de conciliação (seção 5.6); as 7 faixas
do PSF e os pré-requisitos dos projetos especializados definidos a partir de alvos
já existentes no sistema (seção 5.3.1/5.4); critério de dívida tóxica direto do
texto de origem (seção 5.4); consultor passa a nascer só com leitura, concessão de
escrita explícita e auditada (`Membership.advisorCanWrite`, seção 5.7); membros da
família mantêm escrita igual entre si (seção 3.3); `ownerPersonId` opcional prepara
Wallet/Investment/Asset para Open Finance sem implementá-lo (seção 5.1).

**Todas as Pendências da seção 7 estão resolvidas, exceto a #12** (escopo do Módulo
PJ, que segue aguardando detalhamento do usuário — não bloqueia nenhuma Etapa antes
da 17). O documento está pronto para virar plano de execução assim que você
confirmar a leitura final.
