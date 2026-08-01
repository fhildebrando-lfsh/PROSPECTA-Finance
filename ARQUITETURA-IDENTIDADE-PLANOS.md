# Arquitetura de Identidade, Autorização, Consultor×Cliente e Planos — Fase 1 (Projeto)

> **Status: proposta para aprovação. Nenhum código, migration ou config foi alterado.**
> Este documento é a Fase 1 pedida: diagnóstico + arquitetura proposta. A Fase 2
> (implementação) só começa após aprovação explícita, item por item se necessário.

---

## Como ler este documento

Você pediu para eu questionar suas premissas, não só formatá-las. Então, antes dos 20
itens pedidos, adianto a conclusão central, porque ela reorganiza a resposta de vários
itens depois:

> **A ideia de "3 papéis principais" (Admin / Consultor / Cliente) mistura dois conceitos
> que deveriam ser independentes: *quem a pessoa é* (uma identidade única, global) e
> *que tipo de acesso ela tem a um workspace específico* (uma relação, por workspace).
> Recomendo NÃO criar "Consultor" e "Cliente" como papéis fixos de uma pessoa — e sim
> como um novo valor de papel dentro do modelo de `Membership` que já existe hoje,
> exatamente como `TITULAR`/`MEMBRO`/`LEITURA` já são.**

O resto do documento desenvolve por que isso é mais escalável, e como isso muda (pra
melhor) as respostas de onboarding, permissões, planos e auditoria.

---

## 1. Diagnóstico da arquitetura atual

O sistema já está no ar, com dado real (~1.100 lançamentos de uso pessoal desde 2016,
importados) — isso não é um protótipo, é um produto em produção com um usuário real. A
arquitetura de identidade hoje:

```
Profile (espelha auth.users do Supabase)
  └─ isPlatformAdmin: boolean          ← 1 flag global, só true pra 1 pessoa hoje
      memberships: Membership[]

Workspace                              ← 1 por conta, criado automaticamente no signup
  └─ memberships: Membership[]

Membership (Profile × Workspace)
  └─ role: TITULAR | MEMBRO | LEITURA  ← só 3 valores, escopado ao workspace

WorkspaceInvite                        ← convite pra um Workspace JÁ EXISTENTE
  └─ email, role, token, phone?, acceptedAt?
```

Autorização hoje é feita em duas funções centrais (`lib/auth/session.ts`):
`assertCanWrite(role, isPlatformAdmin)` e `assertIsAdmin(isPlatformAdmin)`. Toda página e
Server Action deriva `workspaceId` da sessão — nunca do cliente. RLS existe no Postgres
mas não é tecnicamente exercida (a conexão do Prisma é *owner* das tabelas, que contornam
RLS por padrão) — a isolação real hoje é 100% código de aplicação.

**O que isso significa na prática:** o esqueleto já está certo em um ponto crítico — a
distinção entre "papel dentro do workspace" (`Membership.role`) e "papel global da
plataforma" (`isPlatformAdmin`) já existe e já é tratada como duas verificações
diferentes, exatamente como a especificação original (§19.1) já mandava fazer
("Administrador é um papel global, não do workspace... não devem compartilhar a mesma
função de autorização"). **Você não está partindo de um design ruim — está partindo de um
design correto, mas incompleto**: falta o terceiro tipo de relação (alguém com acesso a
um workspace que não é seu, por delegação — o consultor) e falta qualquer noção de
comercial (plano, cobrança).

---

## 2. Pontos fortes (preservar)

1. **`workspace_id` sempre derivado da sessão, nunca do payload do cliente** — isso é a
   base de qualquer sistema multi-tenant seguro e já está correto em 100% das rotas
   hoje. Qualquer redesenho deve manter essa regra intocada.
2. **Separação clara entre papel de workspace e papel de plataforma** já existe
   (`Membership.role` vs. `Profile.isPlatformAdmin`) — é exatamente a separação de eixos
   que a maioria dos SaaS malfeitos não tem (e paga caro depois).
3. **Autorização centralizada em um único módulo** (`lib/auth/session.ts`) — toda página/
   action passa por ali. Isso é o ponto de alavancagem certo pra adicionar auditoria e
   entitlements sem espalhar lógica nova em 40 arquivos.
4. **Dinheiro em `Decimal`, datas sem fuso, regras financeiras puras e testadas em
   `lib/finance/`** — não é escopo deste documento, mas é relevante: o núcleo de domínio
   é sólido, o que sobra de esforço é inteiramente na camada de identidade/comercial.
5. **Já existe o conceito de convite assíncrono com token opaco** (`WorkspaceInvite`) —
   é a peça que o novo onboarding de cliente vai reaproveitar, só precisa de um ajuste
   (item 12/13).

---

## 3. Pontos fracos

1. **`isPlatformAdmin` é um booleano, não um papel** — não escala além de "existe ou não
   existe admin". Não há como ter, por exemplo, um admin com acesso só a relatórios e
   outro com acesso a cobrança, se isso um dia for necessário.
2. **Não existe hoje nenhuma relação "pessoa com acesso a um workspace que não é seu"**
   — todo `Membership` pressupõe que a pessoa "pertence" àquele workspace. Um consultor
   não pertence ao workspace do cliente da mesma forma que o cliente pertence — é uma
   relação de prestação de serviço, revogável, auditável, e isso não existe no modelo.
3. **Nenhum conceito de plano/cobrança em lugar nenhum** — nem no schema, nem no código,
   nem uma tabela vazia preparada. Início do zero.
4. **Convite só serve pra workspace já existente** — não há fluxo de "crie um workspace
   novo para esta pessoa que ainda nem tem conta".
5. **Todo signup cria automaticamente 1 workspace com o próprio criador como TITULAR**
   (via trigger no Postgres) — isso é exatamente o oposto do que o onboarding de cliente
   de consultoria precisa (o workspace deveria já existir, criado pelo consultor, *antes*
   do cliente logar pela primeira vez).
6. **Sem seletor de workspace** — um `Profile` com múltiplas `memberships` só enxerga a
   primeira. Isso quebra o dia em que uma pessoa for, ao mesmo tempo, dona do seu
   workspace pessoal e cliente/consultor em outro.
7. **RLS não é tecnicamente exercida** — não é bloqueador pra este redesenho (a barreira
   de aplicação já cobre isso hoje), mas qualquer modelo novo de papéis vai precisar ser
   espelhado em política de RLS eventualmente, e hoje isso seria trabalho perdido (não
   está testado, não está em vigor).

---

## 4. Riscos

| Risco | Por quê importa | Mitigação recomendada |
|---|---|---|
| **Modelar "Consultor"/"Cliente" como papéis fixos da pessoa (não da relação)** | Trava o sistema no dia em que uma pessoa precisar ser as duas coisas (consultor que também é cliente de outro consultor mais sênior; ou o próprio Felipe usando o sistema pessoalmente E prestando consultoria) | Modelar como `Membership.role` adicional (ver seção 6) |
| **Acoplar Plano a Papel** | Você já identificou esse risco corretamente. Se "Cliente Premium" for um papel, toda vez que um plano mudar de nome/composição, é preciso migrar papel de usuário — comercial e autorização ficam acoplados desnecessariamente | Plano = Subscription + Entitlements, papel = Membership.role (ver seção 9) |
| **Big-bang migration** (trocar tudo de uma vez em produção com dado real) | Há um usuário real, com lançamentos reais, hoje. Uma migration malfeita quebra o único usuário pagante-de-fato (uso real) que existe | Migração estritamente aditiva + aliases de compatibilidade (ver seção 20) |
| **Misturar "corrigir RLS" com "redesenhar papéis" na mesma leva** | Multiplica a superfície de erro numa mudança já grande | Sequenciar: primeiro este redesenho (RLS continua não-enforced, como já é hoje), depois um projeto separado de "RLS de verdade" usando o modelo novo como blueprint |
| **Superdesenhar RBAC genérico (papéis customizáveis por tenant, permissões granulares configuráveis)** | Nada no cenário descrito pede isso — são ~4 tipos de relação (Owner/Membro/Leitura/Advisor) + 1 flag de plataforma. RBAC genérico configurável é a arquitetura certa pra um Salesforce, não pro estágio atual | Permissão como função explícita e testável (`can(action, membership)`), não tabela de permissões configurável |
| **Auditoria como boa intenção, não como exigência de produto** | A especificação original já classifica isso como *exigência* (não boa prática) a partir da Fase 4 — "o cliente tem direito de saber quando seus dados foram vistos" | Tratar `AuditLog` como entidade de primeira classe desde o desenho inicial, não como afterthought |
| **E-mail transacional continua quebrado** (problema conhecido #9, não resolvido) | Todo o fluxo de convite de cliente depende de e-mail funcionando — hoje precisa de confirmação manual no painel do Supabase | Resolver domínio próprio + SMTP antes de abrir onboarding de cliente pra qualquer pessoa fora da família |

---

## 5. Melhor arquitetura proposta (visão geral)

```
IDENTIDADE (quem a pessoa é — global, único por pessoa)
  Profile
    ├─ platformRole: enum { NONE, PLATFORM_ADMIN }   (troca o booleano por enum extensível)
    └─ memberships: Membership[]

RELAÇÃO COM UM WORKSPACE (o que a pessoa pode fazer ali — por workspace, múltiplas por pessoa)
  Membership (Profile × Workspace)
    └─ role: OWNER | MEMBER | VIEWER | ADVISOR
         OWNER   = hoje "TITULAR" (renomeado só no rótulo, não precisa migrar o enum)
         MEMBER  = hoje "MEMBRO"
         VIEWER  = hoje "LEITURA"
         ADVISOR = NOVO — é o "consultor" deste workspace específico

COMERCIAL (o que o workspace tem direito de usar — por workspace, ao longo do tempo)
  Plan            (catálogo: nome, preço, ciclo)
  PlanFeature     (o que cada Plan libera)
  Subscription    (Workspace × Plan, com status e vínculo com o gateway de pagamento)
  Entitlement     (override pontual, opcional — dá/tira uma feature specific sem mudar de plano)

AUDITORIA E ALERTAS (derivados do acesso, não uma feature nova isolada)
  AccessLog       (todo acesso de ADVISOR/PLATFORM_ADMIN a um workspace que não é o seu)
  Notification    (com campo de visibilidade: SHARED vs ADVISOR_ONLY)
```

**Por que isso é melhor que a hipótese original:**

- **Zero conceito novo de "tipo de pessoa".** `Profile` continua exatamente uma pessoa,
  uma conta, um login — do jeito que já é. Ninguém precisa decidir "esse profile é um
  consultor ou um cliente" numa coluna fixa, porque isso não é uma propriedade da
  pessoa, é uma propriedade de **cada relação** que ela tem com **cada workspace**. A
  mesma pessoa pode ser `OWNER` do seu workspace pessoal e `ADVISOR` em três workspaces
  de clientes, simultaneamente, sem nenhuma contorção de modelo.
- **Reaproveita 100% do que já existe.** `Membership` já é exatamente a tabela certa —
  só ganha um valor novo de enum. Nenhuma tabela nova de identidade é necessária.
- **Plano vira uma decisão puramente comercial, plugada em cima**, sem tocar em
  autorização. Trocar de plano nunca muda quem pode editar o quê — só o que está
  disponível pra editar.
- **Consultor × Cliente vira uma relação auditável e revogável por natureza** — porque é
  uma linha de `Membership`, exatamente como já se audita/revoga qualquer outro acesso.
  Encerrar o contrato com um consultor é... remover uma linha. Não é preciso desenhar
  nada especial pra isso.

---

## 6. Modelagem conceitual

```
Profile
  id, fullName, platformRole (NONE | PLATFORM_ADMIN), createdAt

Workspace
  id, name, kind (INDIVIDUAL | ADVISORY_CLIENT — só rótulo/contexto, não muda comportamento),
  createdAt

Membership
  id, workspaceId, profileId, role (OWNER | MEMBER | VIEWER | ADVISOR),
  status (ACTIVE | REVOKED), createdAt, revokedAt?

WorkspaceInvite
  id, workspaceId, email, role, token, phone?, createdBy, acceptedAt?, expiresAt
  (campo `expiresAt` é novo — hoje o convite não expira, o que já é uma lacuna
  independente deste redesenho, vale corrigir junto)

Plan
  id, code, name, priceCents, billingInterval (MONTHLY | YEARLY), isActive

Feature
  id, code (ex.: "modulo_mei", "ia_assistente", "open_finance"), name

PlanFeature
  planId, featureId    (join simples — o que cada plano libera)

Subscription
  id, workspaceId, planId, status (TRIALING | ACTIVE | PAST_DUE | CANCELED),
  paymentProvider (STRIPE | ASAAS), providerCustomerId, providerSubscriptionId,
  currentPeriodEnd, createdAt

Entitlement   (override pontual — opcional, cresce sob demanda)
  workspaceId, featureId, grantedBy, reason, expiresAt?

AccessLog
  id, actorProfileId, workspaceId, actorRole (o Membership.role usado no momento),
  action (VIEW_WORKSPACE | EDIT_ENTRY | EXPORT | ...), occurredAt

Notification
  id, workspaceId, visibility (SHARED | ADVISOR_ONLY), severity, message,
  relatedEntity?, createdAt, resolvedAt?
```

Nenhuma tabela de hoje precisa ser **removida**. `Entry`, `Wallet`, `Category`, etc. não
mudam nada — continuam com `workspaceId`, do jeito que já é.

---

## 7. Modelo de usuários

**Recomendação final:** não existem "3 papéis de pessoa". Existem:

- **1 atributo de identidade global, opcional:** `Profile.platformRole` (hoje seria só
  `NONE` ou `PLATFORM_ADMIN`; o enum já nasce pronto pra crescer — ex.: um futuro
  `SUPPORT` que vê tudo mas não edita — sem migrar todo mundo de novo).
- **1 papel por relação com um workspace:** `Membership.role`, com 4 valores em vez de 3
  (`OWNER`, `MEMBER`, `VIEWER`, `ADVISOR`).

Isso responde sua pergunta diretamente: **"Consultor" não é uma coisa que uma pessoa É —
é uma coisa que ela FAZ em relação a um workspace específico.** A mesma pessoa pode ter
zero, uma ou várias relações `ADVISOR` (com clientes diferentes) e ainda ter sua própria
relação `OWNER` no workspace pessoal dela — tudo com o mesmo login, sem seletor de "modo
consultor vs. modo cliente", só um seletor de workspace (que já é uma lacuna conhecida
hoje, item 8 dos "pontos fracos", e que este redesenho torna **obrigatório** de resolver
junto — ver seção 12).

---

## 8. Modelo de permissões

**Não recomendo RBAC genérico configurável.** Recomendo permissão como **função
explícita**, testável, com dois eixos combinados:

```ts
// eixo 1 — o que o papel na workspace permite (existe hoje, só cresce)
function can(action: Action, membership: Membership, platformRole: PlatformRole): boolean

// eixo 2 — o que o plano da workspace libera (novo)
function hasFeature(workspaceId: string, feature: FeatureCode): Promise<boolean>
```

Os dois eixos são **checados juntos, mas nunca misturados na mesma função** — um erro
comum é fazer `can()` decidir "esse plano não paga por isso, então bloqueia", o que
mistura autorização com comercial e vira dívida técnica rapidamente (qualquer mudança de
plano vira uma mudança de regra de permissão). O padrão certo:

```ts
// numa Server Action / página:
const membership = await requireMembership(workspaceId);
assertCan("editEntry", membership);              // RBAC: papel permite a ação?
await assertFeature(workspaceId, "modulo_mei");   // Entitlement: o plano paga por isso?
```

Isso é o padrão usado por produtos SaaS maduros (Linear, Notion, GitHub): **role
controla o que você pode fazer nos dados que você já tem acesso; plano controla quais
dados/telas/módulos existem pra você acessar.** São perguntas diferentes, feitas em
lugares diferentes, e nunca devem virar uma função só — é exatamente o motivo pelo qual
sua intuição de "plano não deve ser papel" está certa.

`ADVISOR` precisa de uma regra própria adicional, específica de auditoria (não é RBAC
comum): toda vez que `membership.role === "ADVISOR"` acessa um recurso, isso é logado
(seção 11) — isso fica dentro de `requireMembership()`, no ponto único onde a sessão já
é resolvida hoje (`lib/auth/session.ts`), sem precisar espalhar chamada de log em cada
tela.

---

## 9. Modelo de planos

Você perguntou especificamente: Feature Flags, Subscription ou Entitlements?

**Resposta: Subscription + Entitlements. Feature Flags é uma ferramenta diferente, para
um problema diferente — não misturar.**

- **Feature Flag** resolve "rollout" — ligar uma funcionalidade nova gradualmente, testar
  A/B, desligar rápido se der problema em produção. É uma ferramenta de **engenharia**,
  não de **comercial**. Se você usar feature flag pra cobrar por funcionalidade, todo
  cliente que "ganhou" a flag de teste continua com ela de graça depois — a ferramenta
  não tem conceito de contrato/cobrança.
- **Entitlement** resolve "o que este cliente pagante tem direito de usar" — é o
  conceito comercial correto. Um `Entitlement` é sempre derivado de uma `Subscription`
  ativa a um `Plan`, mais qualquer override pontual (`Entitlement` override, pra dar uma
  cortesia sem mudar o plano formal do cliente).

Fluxo de resolução, sempre nessa ordem:

```
workspaceId
  → Subscription ativa? (senão: plano "Individual/Legado" default, feature mínima)
  → Plan dessa Subscription
  → Features desse Plan (via PlanFeature)
  → + Entitlement overrides pontuais desse workspace (soma, nunca subtrai o do plano)
  = conjunto final de features liberadas
```

Isso separa completamente "o que vendemos" (Plan, catálogo, muda com frequência
comercial) de "quem tem o quê agora" (Subscription, muda por evento de cobrança) de "essa
tela específica está liberada" (`hasFeature()`, checado em runtime, nunca hardcoded por
nome de plano no código de tela — sempre por *código de feature*, ex.: `"modulo_mei"`,
nunca `plan.name === "Premium"`. Isso é o que garante que renomear/reprecificar um plano
nunca exige tocar em código de tela).

---

## 10. Modelo de assinatura

`Subscription` é 1 linha por workspace-com-plano-ativo (ou histórico, se você quiser
manter linhas antigas com `status=CANCELED` em vez de apagar — recomendo manter, é dado
de auditoria/billing barato de guardar). Campos essenciais: `workspaceId`, `planId`,
`status`, `paymentProvider`, `providerCustomerId`/`providerSubscriptionId` (o ID do lado
de Stripe/Asaas — nunca duplicar lógica de cobrança local, o gateway é a fonte de
verdade de "foi pago"), `currentPeriodEnd`.

**Ponto importante que sua descrição do cenário não resolve sozinho, e que eu recomendo
decidir agora, mesmo que a resposta seja "ainda não sei":** a cobrança é sempre por
**workspace de cliente**, ou existe também uma assinatura no nível do **consultor/escritório**
(ex.: "Consultor Pro — até 50 clientes")? Nada no modelo acima impede o segundo caso no
futuro (bastaria criar depois uma entidade `Firm`/`Organization` acima de `Workspace`,
com sua própria `Subscription`), mas vale já registrar que a resposta de hoje é: **modelar
a cobrança presa ao workspace do cliente**, que é o caso concreto descrito, e deixar
"assinatura de consultor/escritório" como extensão sem breaking change quando esse
modelo comercial for de fato definido (não precisa ser resolvido nesta Fase 1).

---

## 11. Modelo de auditoria

`AccessLog`, escrito num único ponto de instrumentação: dentro de `requireMembership()`/
`requireWorkspaceId()` (o funil central que já existe hoje em `lib/auth/session.ts`).
Regra de quando logar: **sempre que `actorProfileId` não é o próprio dono do workspace**
— ou seja, toda vez que `platformRole === PLATFORM_ADMIN` ou `membership.role === ADVISOR`
acessa um workspace. Acesso do próprio `OWNER`/`MEMBER` ao seu próprio workspace **não**
precisa virar log de auditoria (seria ruído puro, sem valor de compliance).

Nível de detalhe recomendado pra começar: **por rota/página, não por campo.** A
especificação já define a régua certa: "quem, quando, qual workspace, quais telas" — não
pede "qual campo específico foi alterado". Auditoria de campo-a-campo é véspera de gerar
um volume de log inútil de manter e consultar; comece grosso, refine se um requisito
regulatório concreto (CVM, etc.) exigir granularidade maior — isso já está corretamente
marcado na especificação original como fora do escopo de engenharia até ser definido.

**Importante:** este log deve ser desenhado desde já para ser **visível ao próprio
cliente** (não é um log interno de auditoria "pra nunca ninguém ver") — é a exigência
explícita da especificação ("o cliente tem direito de saber quando seus dados foram
vistos"). Trate como uma tela futura do produto, não como uma tabela de operações.

---

## 12. Fluxo de onboarding

Seu esboço (admin cria pré-cadastro → cliente recebe convite → cliente completa
cadastro) está no caminho certo, mas precisa de um ajuste técnico importante, causado por
uma peça que já existe hoje: **o trigger `on_auth_user_created` cria automaticamente um
Workspace + Membership TITULAR pra QUALQUER novo signup**, sem exceção. Isso serve bem
pro caso de hoje (alguém chega e cria conta pessoal), mas quebra o caso de cliente de
consultoria (o workspace **já deveria existir**, criado pelo consultor, antes do cliente
logar pela primeira vez).

**Fluxo recomendado:**

1. Consultor (ou admin) cria o registro do cliente: nome + e-mail + plano escolhido.
   Isso cria, na hora: (a) um `Workspace` novo, `kind=ADVISORY_CLIENT`; (b) uma
   `Subscription` no plano escolhido; (c) uma `Membership` do próprio consultor nesse
   workspace, `role=ADVISOR`, **já ativa** (o consultor pode começar a configurar o
   workspace do cliente antes dele nunca ter logado — necessidade real de consultoria);
   (d) um `WorkspaceInvite` pendente pro e-mail do cliente, `role=OWNER`.
2. Cliente recebe o link (e-mail — depende de resolver o problema #9 antes de abrir isso
   pra qualquer pessoa fora da família; ou WhatsApp manual, como já existe hoje) → conclui
   o cadastro (define senha).
3. **O trigger de signup precisa de uma condição nova**: antes de criar workspace
   automaticamente, checar se existe um `WorkspaceInvite` pendente pra esse e-mail. Se
   existir, **não cria workspace novo** — só aceita o convite existente (cria a
   `Membership` `OWNER` no workspace que o consultor já preparou). Se não existir convite
   pendente, o comportamento de hoje continua (cria workspace pessoal, `role=OWNER`) —
   isso preserva 100% do fluxo de auto-cadastro atual pra quem não veio de convite.

Isso é uma mudança de **1 trigger SQL** (adicionar uma condição), não uma reescrita — mas
é a peça que faz o fluxo de pré-cadastro funcionar de verdade em vez de gerar um
workspace órfão extra pro cliente.

---

## 13. Fluxo de convites

Reaproveita `WorkspaceInvite` quase sem mudança — só 2 acréscimos:

- **`expiresAt`** — hoje o convite não expira nunca, o que já é frágil mesmo no uso
  familiar de hoje (um link de convite de meses atrás continua válido). Vale corrigir
  junto, é trivial.
- **Convite pode nascer com `role=ADVISOR`** também, não só `OWNER`/`MEMBER`/`VIEWER` —
  serve pro caso de "cliente já existe, mas quer adicionar um segundo consultor" (troca
  de escritório, consultor de apoio, etc.) sem precisar de fluxo novo nenhum.

---

## 14. Fluxo do consultor

- Loga normalmente (mesma conta, mesmo login — não existe "modo consultor" separado).
- **Precisa de um seletor de workspace** (peça que falta hoje até pro caso simples de
  hoje, e que se torna obrigatória aqui) — lista todos os workspaces onde tem
  `Membership` ativa, agrupados por papel (o(s) workspace(s) próprio(s) como
  `OWNER`/`MEMBER`, e a lista de clientes onde é `ADVISOR`).
- Ao entrar num workspace de cliente como `ADVISOR`: `AccessLog` grava a entrada; a UI
  deixa claro visualmente "você está vendo o workspace de [Cliente]" (nunca ambíguo com
  o próprio workspace, pra evitar erro humano de lançar algo no lugar errado).
- Pode ver/criar `Notification` com `visibility=ADVISOR_ONLY` (os "alertas internos" que
  o cliente não vê).

## 15. Fluxo do cliente

- Loga normalmente, cai direto no seu workspace (só tem um, na maioria dos casos — o
  seletor só aparece de fato se a pessoa tiver mais de uma `Membership`, o que já é raro
  hoje e continua raro).
- Vê seus dados, seu(s) consultor(es) responsável(is) (lista de `Membership` com
  `role=ADVISOR` naquele workspace), e — a entregar quando a tela existir — o log de
  quando o(s) consultor(es) acessaram seus dados.
- Não vê `Notification` com `visibility=ADVISOR_ONLY`.
- Vê o próprio plano/assinatura (read-only, a menos que autogestão de assinatura entre
  no escopo comercial depois).

---

## 16. Impacto no banco de dados

**Só aditivo — nenhuma tabela existente perde coluna, nenhum dado é reescrito.**

- `Profile` ganha `platformRole` (enum) — migração: `isPlatformAdmin=true` vira
  `platformRole='PLATFORM_ADMIN'`; `false` vira `'NONE'`. Coluna antiga pode ficar como
  alias por um tempo (ver seção 20) ou ser removida direto, já que só 1 linha usa hoje.
- `MembershipRole` ganha o valor `ADVISOR` (e os 3 existentes podem manter os nomes atuais
  no banco — `TITULAR/MEMBRO/LEITURA` — só o rótulo de exibição vira Owner/Member/Viewer
  se você quiser, sem precisar migrar o enum em si; ou migrar o enum também, é decisão de
  gosto, não tem impacto técnico relevante).
- `Membership` ganha `status` (ACTIVE/REVOKED) — hoje remover acesso provavelmente
  significa deletar a linha; ter um status revogável preserva histórico (relevante pra
  auditoria: "esse consultor teve acesso entre X e Y").
- `WorkspaceInvite` ganha `expiresAt`.
- Tabelas novas: `Plan`, `Feature`, `PlanFeature`, `Subscription`, `Entitlement`,
  `AccessLog`, `Notification`. Nenhuma referencia nada que precise mudar em `Entry`,
  `Wallet`, `Category`, etc.

---

## 17. Impacto nas RLS

**Recomendo não tocar em RLS nesta rodada.** RLS não é tecnicamente exercida hoje (ver
seção 3) — ativar de verdade é um projeto próprio, com seu próprio risco (testar que
nenhuma query legítima quebra). Fazer isso junto com o redesenho de papéis multiplicaria
a superfície de erro numa mudança que já mexe em identidade/autorização/comercial ao
mesmo tempo.

Quando esse projeto de RLS acontecer (recomendo como próxima rodada **depois** deste
redesenho estar estável), o modelo novo torna as políticas **mais fáceis de escrever
corretamente**, não mais difíceis: uma política por `Membership.role` (incluindo
`ADVISOR`) é mais direta de expressar do que o modelo atual de 3 papéis + admin
booleano solto.

---

## 18. Impacto no Frontend

- **Seletor de workspace** (novo, obrigatório pra este redesenho funcionar — ver seção
  14/15) — provavelmente no header/sidebar, junto de onde hoje mostra o nome do
  workspace atual (`Sidebar.tsx`/`MobileNav.tsx` já mostram isso, viram um dropdown).
- **Indicador visual "você está em workspace de cliente"** quando `membership.role ===
  ADVISOR` — evita erro de lançar no workspace errado.
- **Gate de feature por `hasFeature()`** em vez de esconder/mostrar por nome de plano —
  cada tela nova de Fase 2+ (MEI, IRPF, IA, etc.) checa a feature própria, não o plano.
- **Tela de plano/assinatura** pro cliente ver o que tem.
- **Tela de alertas internos** pro consultor (novo).
- Nenhuma tela existente (Painel, Lançamentos, Cadastros) muda de comportamento pra quem
  é `OWNER`/`MEMBER`/`VIEWER` do próprio workspace — o impacto é aditivo, não uma
  reescrita das telas atuais.

---

## 19. Impacto no Backend

- `lib/auth/session.ts` ganha: `platformRole` no lugar do booleano, resolução de
  `ADVISOR` como um tipo válido de `requireWorkspaceId()`/`requireMembership()`,
  parâmetro explícito de qual workspace (hoje sempre `memberships[0]` — precisa aceitar
  um `workspaceId` vindo de um seletor, ainda validando contra as memberships reais da
  sessão, nunca confiando cegamente).
- Novo módulo `lib/billing/` (ou `lib/plans/`): resolução de `Subscription` →
  `Entitlement` → `hasFeature()`.
- Novo módulo `lib/audit/`: `logAccess()`, chamado de dentro do funil de sessão.
- `createSubcategory`/`updateWallet`/etc. (as Server Actions de Cadastros que hoje usam
  `assertCanWrite`/`assertIsAdmin`) não mudam de assinatura — continuam recebendo
  `role` + `platformRole` (renomeado), o `can()` novo é um superset do que já existe.
- Trigger de signup (`001_auth_and_rls.sql`) ganha a condição de "convite pendente" (seção
  12) — único ponto de banco que muda *comportamento*, não só schema.

---

## 20. Estratégia de migração sem perda de dados

Princípio geral: **tudo aditivo primeiro, gate depois, nunca simultâneo.**

1. **Passo 1 — Schema aditivo puro.** Todas as tabelas/colunas novas descritas na seção
   16, sem remover nada. `isPlatformAdmin` continua existindo em paralelo a
   `platformRole` por um tempo (populado pela mesma migration, os dois sempre
   sincronizados por um trigger simples ou só por não ser mais escrito depois de
   migrado).
2. **Passo 2 — Backfill seguro.** O único workspace real hoje (o pessoal do Felipe)
   ganha uma `Subscription` num plano especial, ex. `LEGACY_INTERNAL`, com **todas as
   features liberadas** — garante que nada quebra pro único uso real existente, mesmo
   antes de qualquer plano comercial de verdade estar definido.
3. **Passo 3 — Código novo, atrás de flag de ambiente**, sem trocar o código antigo
   ainda: `hasFeature()`/`can()` novos existem e são testados, mas nenhuma tela real
   passa a chamá-los ainda. Zero risco de regressão porque nada mudou de comportamento
   visível.
4. **Passo 4 — Trocar os call-sites, um por um.** `assertCanWrite`/`assertIsAdmin`
   existentes viram wrappers finos em cima do `can()` novo (mesma assinatura de fora,
   implementação nova por dentro) — cada Server Action continua funcionando sem precisar
   ser reescrita individualmente.
5. **Passo 5 — Ativar o fluxo de convite `ADVISOR`/pré-cadastro de cliente** só depois de
   1-4 estarem em produção e estáveis por um tempo, e só depois de o e-mail transacional
   estar resolvido (problema conhecido #9) — abrir onboarding de cliente sem e-mail
   funcionando é pedir suporte manual pra cada cliente novo.
6. **Nunca deletar dado histórico** — `Membership` revogada vira `status=REVOKED`, nunca
   um `DELETE`; `Subscription` cancelada vira `status=CANCELED`, nunca é removida.

Cada passo é revertível isoladamente (é sempre aditivo até o passo 4, que troca
implementação mas mantém a mesma interface externa) — nenhum passo exige um "big bang"
de deploy simultâneo de banco + backend + frontend.

---

## Resumo executivo (pra decisão rápida)

| Sua hipótese | Meu parecer | Recomendação |
|---|---|---|
| 3 papéis fixos (Admin/Consultor/Cliente) | Mistura identidade com relação | `platformRole` (identidade, global) + `Membership.role` com `ADVISOR` novo (relação, por workspace) |
| Plano não deve ser papel | **Correto, manter** | `Subscription` (comercial) + `Entitlement`/`hasFeature()` (o que libera) — nunca Feature Flag pra isso |
| RBAC robusto | Genérico/configurável é over-engineering pro cenário descrito | Função explícita `can()`, poucos papéis, testável |
| Cliente tem 1 consultor responsável (FK fixa) | Rígido demais — trava múltiplos consultores/histórico de troca | `Membership` com `role=ADVISOR` — várias linhas possíveis, revogáveis, auditáveis |
| Pré-cadastro → convite → cadastro | Direção certa, falta 1 ajuste técnico | Trigger de signup precisa checar convite pendente antes de criar workspace automático |
| Alertas internos do consultor | Não é feature isolada | `Notification` com campo `visibility` |
| Auditoria de acesso do consultor | Correto e já previsto na especificação original como exigência (não opcional) | `AccessLog`, escrito 1 único lugar (`lib/auth/session.ts`), visível ao cliente eventualmente |

---

**Próximo passo:** revisar este documento, marcar o que aprova/questiona por item, e só
então eu começo a Fase 2 (migrations, RLS, backend, frontend, testes, documentação) —
nada disso é iniciado até você confirmar.
