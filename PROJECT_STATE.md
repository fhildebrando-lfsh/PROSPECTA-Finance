# PROJECT_STATE.md — Memória Permanente do Projeto

> **Como usar este documento:** é o ponto de entrada para retomar o trabalho em uma nova
> conversa sem perder contexto. Leia isto primeiro, depois `ESPECIFICACAO-SISTEMA-FINANCEIRO.md`
> (a fonte de verdade do domínio/regras) e `GUIA-DE-INICIO.md` (o roteiro de conversas).
> Atualize este arquivo sempre que uma funcionalidade importante for concluída ou uma
> decisão arquitetural relevante for tomada — é assim que ele continua confiável.
>
> **Última atualização:** 2026-07-31. Além das 5 pontas soltas da Fase 1 (Compromissos,
> reverter importação, transferência entre carteiras, convidar membro, edição in-line/ações
> em lote), o projeto agora está **implantado em produção na Vercel**
> (`https://prospecta-finance.vercel.app`, repo `github.com/fhildebrando-lfsh/PROSPECTA-Finance`)
> e ganhou, a partir de feedback de uso real: convite por WhatsApp (link `wa.me`), excluir
> convite pendente, "Esqueci minha senha", nome no cadastro, um painel `/admin/usuarios`
> (visão de plataforma pra `isPlatformAdmin`), e um **menu lateral novo** (`components/Sidebar.tsx`,
> só desktop/tablet) inspirado visualmente no sistema "Meu Vista", com `lucide-react` pros
> ícones. **E-mail de confirmação do Supabase não funciona** — causa raiz diagnosticada
> (remetente `@gmail.com` não passa DKIM/DMARC em nenhum provedor terceiro, nem Gmail SMTP
> nem Brevo), correção real exige domínio próprio, **adiada de propósito pelo usuário** (não
> é um bug esquecido) — ver "Problemas conhecidos" #9. `recovery-codes.txt` já foi removido
> da pasta pelo usuário; ainda falta confirmar se a chave SMTP do Brevo exposta no chat foi
> revogada. **Fase 2 pausada a pedido do usuário** — ele vai reportar bugs pontuais de uso
> real primeiro, avança pra Fase 2 só depois de satisfeito com o estado atual (ver seção 27).
> **App renomeado pra "PROSPECTA Finance"** (nome visível em toda parte: aba, login,
> sidebar, PWA) com logo própria enviada pelo usuário, substituindo os ícones placeholder
> "R$". A 1ª versão da logo (fundo branco "consertado" via `sharp`) foi **rejeitada** pelo
> usuário, que refez a arte com transparência real — versão final aplicada em tudo.
> Navegação mobile (`components/MobileNav.tsx`) foi unificada visualmente com o `Sidebar`
> desktop (mesmos ícones, mesmo destaque de página ativa). A cor do menu (Sidebar +
> MobileNav + header mobile) foi trocada duas vezes a pedido do usuário — `#090D24` e
> depois `#131A47` (valor atual) — sempre via `bg-[#hex]` do Tailwind nos três lugares
> juntos. **Painel redesenhado** (cards no mesmo `#131A47`, "Distribuição por categoria"
> virou anéis de progresso com ícone, "Reserva de emergência" virou velocímetro SVG) — e,
> nessa mesma rodada, **corrigido um bug real**: o fundo da página renderizava branco em
> vez de escuro por uma regra de CSS não-layered em `globals.css` vencendo as utilities do
> Tailwind (cascade layers); a correção também destravou a fonte Geist, que nunca tinha
> sido aplicada de verdade. Mais 3 correções de uso real: **mostrar/ocultar senha**
> (`PasswordInput`), **zoom indevido no mobile** (faltava `width`/`initialScale` na
> viewport meta — bug real, não configuração do celular do usuário), e um **banner de
> instalar o PWA** (`InstallPrompt`) na tela de login — a 1ª versão tinha cooldown de 14
> dias após fechar, removido a pedido do usuário (sem persistência nenhuma: fechar só
> esconde na visita atual). **Favicon errado corrigido:** um `app/favicon.ico` esquecido
> do template padrão do Next (o triângulo da Vercel) desde a Fase 0 competia com
> `app/icon.png` — removido, `/favicon.ico` agora 404 de propósito, só `icon.png` (a
> logo real) é servido. **Painel ganhou visão Mensal/Anual/Geral** (`?view=`) além da
> navegação por mês — afeta KPIs, Top 5 e distribuição por categoria; o gráfico "Últimos
> 6 meses" continua fixo em 6 meses independente da view (é sobre tendência recente, não
> o período selecionado). Ver seção "Estado do Git" — HEAD `2e9fa19`.

---

## 1. Objetivo do projeto

Sistema web de gestão financeira pessoal e familiar para substituir uma planilha Google
Sheets em uso contínuo desde 2016 (~5.900 lançamentos). O modelo de dados foi extraído por
engenharia reversa dessa planilha — as regras documentadas em
`ESPECIFICACAO-SISTEMA-FINANCEIRO.md` são comportamento validado na prática, não hipótese.

Dono do produto / usuário principal: **Felipe Hildebrando** (fhildebrando@gmail.com),
administrador da plataforma. Pensa em oferecer o sistema no futuro também como ferramenta
de consultoria financeira para terceiros (Fase 4 — ainda não iniciada).

Princípios centrais (não negociáveis, ver §4 da especificação):
- O modelo de dados é sagrado; a interface é descartável.
- Nenhuma perda histórica.
- Multi-tenant desde o primeiro dia (`workspace_id` em toda tabela de dados).
- Auditabilidade (quem criou/alterou, quando).
- Entrega incremental e usável — cada fase termina em uso real.

---

## 2. Arquitetura geral

Aplicação **Next.js 16 (App Router) full-stack**, um único deploy (frontend + backend +
rotas de API no mesmo projeto). Banco **PostgreSQL gerenciado pelo Supabase**, com
**Supabase Auth** para autenticação e **Row Level Security (RLS)** nativa do Postgres como
segunda camada de isolamento multi-tenant (a primeira é sempre filtrar por `workspace_id`
derivado da sessão no código da aplicação — nunca confiar em `workspace_id` vindo do
cliente).

```
Browser (PWA instalável)
   │
   ▼
Next.js App Router (em produção na Vercel: prospecta-finance.vercel.app)
   ├─ Server Components (a maioria das páginas — leem direto do Prisma)
   ├─ Server Actions ("use server", formulários de Cadastros e lançamento rápido)
   ├─ Route Handlers (/app/api/** — importação, exportação, CRUD de entries)
   └─ Middleware (proxy.ts — sessão Supabase, redireciona não-autenticado)
   │
   ▼
Prisma Client (driver adapter @prisma/adapter-pg, Prisma 7)
   │
   ▼
PostgreSQL (Supabase, sa-east-1) — RLS habilitada em toda tabela multi-tenant
   └─ auth.users (Supabase Auth) — trigger cria Profile + Workspace + Membership no signup
```

**Regra de autorização em duas camadas:**
1. **Camada de aplicação** (a que realmente importa hoje): toda query Prisma nas páginas/
   actions/rotas deriva `workspace_id` da sessão via `lib/auth/session.ts`, nunca do
   payload do cliente.
2. **RLS no Postgres** (defesa em profundidade): políticas em `prisma/sql/*.sql`. **Atenção:**
   a conexão do Prisma usa a connection string do Postgres (via pooler do Supabase), que
   por padrão é o *owner* das tabelas — **owners contornam RLS**. Ou seja, hoje a RLS
   protege acesso via PostgREST/Supabase client direto (se algum dia for usado
   client-side), mas **não** está sendo tecnicamente exercida pelas queries do Prisma.
   A camada 1 é a que efetivamente isola os dados agora. Ver "Débitos técnicos" (#20).

---

## 3. Tecnologias utilizadas

| Categoria | Escolha | Versão (aprox.) |
|---|---|---|
| Framework | Next.js (App Router) | 16.2.12 |
| Linguagem | TypeScript | ^5 |
| UI | React + Tailwind CSS v4 | 19.2.4 / ^4 |
| Gráficos | Recharts | ^3.10 |
| Ícones | `lucide-react` | ^1.28 (instalado 2026-07-31 pro `Sidebar`) |
| Banco | PostgreSQL (Supabase, sa-east-1) | — |
| ORM | Prisma (novo generator `prisma-client`, driver adapters) | ^7.9.1 |
| Driver adapter | `@prisma/adapter-pg` + `pg` | — |
| Auth | Supabase Auth (`@supabase/ssr`, `@supabase/supabase-js`) | — |
| Validação | Zod | ^4.4 |
| CSV | `csv-parse` (import), builder manual (export) | ^7 |
| XLSX | `exceljs` | ^4.4 |
| PWA | Serwist (`@serwist/next`, `@serwist/window`, `serwist`) | ^9.5 |
| Testes | Vitest | ^4.1 |
| Runtime scripts | `tsx` | ^4.23 |
| Deploy | Vercel, produção ativa | `prospecta-finance.vercel.app` |

Stack segue exatamente o recomendado em `ESPECIFICACAO-SISTEMA-FINANCEIRO.md` §15, com uma
diferença: Next.js 16 em vez de 15 (a versão "latest" no momento da Fase 0; a intenção do
documento — framework mainstream com App Router — foi preservada).

---

## 4. Estrutura completa de diretórios

```
C:\Sistema Financeiro\
├── ESPECIFICACAO-SISTEMA-FINANCEIRO.md   # fonte de verdade do domínio (1198 linhas)
├── GUIA-DE-INICIO.md                     # roteiro das "Conversas" (Fase 0 a 5)
├── PROJECT_STATE.md                      # este arquivo
├── CLAUDE.md / AGENTS.md                 # instruções pro Claude Code
├── .env.local                            # segredos (gitignored)
├── seeds/                                # CSVs de referência (taxonomia, carteiras...)
│   ├── seed_*.csv                        # UTF-8 sem BOM, separador , (o código lê)
│   └── excel-br/seed_*.csv               # UTF-8 com BOM, separador ; (conferir no Excel)
├── prisma/
│   ├── schema.prisma                     # schema completo, ver seção 10
│   ├── prisma.config.ts (raiz do projeto, não dentro de prisma/) 
│   ├── migrations/                       # 4 migrations aplicadas, ver seção 10
│   ├── sql/                              # RLS e triggers não gerenciados pelo Prisma
│   │   ├── 001_auth_and_rls.sql          # trigger signup, RLS Fase 0
│   │   ├── 002_drop_cross_schema_fk.sql  # correção de incidente, ver seção 19
│   │   ├── 003_entries_rls.sql           # RLS de entries/entry_groups/import_batches
│   │   ├── 004_permission_updates.sql    # subcategoria virou admin-only
│   │   ├── 005_export_logs_rls.sql       # RLS de export_logs
│   │   └── 006_workspace_invites_rls.sql # RLS de workspace_invites (convite de membro)
│   ├── seed.ts                           # seed global (taxonomia, tipos, etc.)
│   └── seed-workspace.ts                 # seed por workspace (carteiras/responsáveis)
├── app/
│   ├── layout.tsx                        # root layout, tema escuro fixo, PWA metadata
│   ├── page.tsx                          # redirect pra /painel
│   ├── manifest.ts                       # manifest PWA dinâmico
│   ├── sw.ts                             # service worker (Serwist)
│   ├── icon.png                           # favicon (convenção do App Router; favicon.ico
│   │                                          padrão do template foi removido, competia com este)
│   ├── (auth)/login/                     # login + cadastro (Supabase Auth)
│   ├── auth/confirm/route.ts             # callback de confirmação de e-mail (token_hash)
│   ├── (app)/                            # tudo atrás de autenticação
│   │   ├── layout.tsx                    # header + nav mobile inferior + botão flutuante +
│   │   ├── actions.ts                    # logout
│   │   ├── painel/page.tsx               # dashboard (§11)
│   │   ├── compromissos/page.tsx         # vencidos/hoje/próximos 7-30 dias, marcar pago (§13)
│   │   ├── convite/[token]/page.tsx      # aceitar convite pra um workspace existente
│   │   ├── lancamentos/
│   │   │   ├── page.tsx                  # tabela (edição in-line + seleção em lote) / cards + exportar
│   │   │   ├── EntriesTable.tsx          # client component: seleção, ações em lote, edição in-line
│   │   │   ├── novo/                     # lançamento rápido (§12)
│   │   │   ├── transferir/               # transferência entre carteiras (§10 R5)
│   │   │   └── importar/                 # wizard de importação de CSV (§18.1) + reverter lote
│   │   └── cadastros/                    # carteiras, responsáveis, categorias, subcategorias, tipos, membros
│   └── api/
│       ├── entries/                      # CRUD, settle, export, suggest-category
│       └── import/                       # preview, commit, revert
├── lib/
│   ├── finance/                          # regras puras testadas (Conversa 2), ver seção 12
│   ├── entries/                          # criação/edição/exportação de lançamentos (server-side)
│   ├── import/                           # parsing/validação/resolução/reversão do importador de CSV
│   ├── workspace/invite.ts               # criar/aceitar convite pra workspace existente
│   ├── auth/session.ts                   # toda derivação de sessão/permissão
│   ├── supabase/                         # clients Supabase (browser/server/middleware)
│   ├── db/prisma.ts                      # singleton do Prisma Client
│   ├── api/                              # erros de API padronizados
│   ├── validation/entry.ts               # schemas Zod de Entry
│   ├── format.ts                         # formatação pt-BR (moeda, data)
│   └── slug.ts                           # geração de slug (§18.3)
├── components/
│   ├── charts/MonthlyChart.tsx           # gráfico Recharts (client component)
│   └── RegisterServiceWorker.tsx         # registra o SW no browser
├── tests/                                # espelha lib/finance e lib/import, Vitest
└── public/                               # logo.png (fonte, 500x500, transparência real, ~125KB,
    #                                        commitado), logo-sidebar.png/icon-192.png/icon-512.png
    #                                        (marca PROSPECTA Finance, gerados via sharp)
```

---

## 5. Responsabilidade de cada pasta

| Pasta | Responsabilidade |
|---|---|
| `app/(auth)/` | Telas públicas de autenticação (login/cadastro). Fora do middleware de sessão obrigatória. |
| `app/(app)/` | Todo o produto autenticado. Layout comum com nav e botão de lançamento rápido. |
| `app/api/` | Route Handlers — usados por formulários/JS client-side que precisam de resposta JSON/arquivo (export, import wizard, suggest-category). CRUD que só roda em Server Component/Server Action **não** passa por aqui (ver `lib/entries/create.ts`). |
| `lib/finance/` | **Núcleo do domínio.** Funções puras, sem I/O, todas testadas. Implementam literalmente as fórmulas de `ESPECIFICACAO-SISTEMA-FINANCEIRO.md` §8, §10, §11. Nunca importam Prisma. |
| `lib/entries/` | Ponte entre `lib/finance` (puro) e o banco: cria séries de lançamentos (parcelado/recorrente), monta linhas de exportação. |
| `lib/import/` | Todo o pipeline do importador de CSV: detecção de cabeçalho, parsing BR, resolução de referências, deduplicação. |
| `lib/auth/session.ts` | **Único lugar** que deriva workspace/papel/admin da sessão. Toda página e action passa por aqui. |
| `lib/workspace/invite.ts` | Cria e aceita convite pra um workspace existente (token opaco, sem envio de e-mail próprio). |
| `lib/supabase/` | Clients Supabase Auth para os três contextos do Next.js (browser, server component, middleware). |
| `prisma/sql/` | Tudo que o Prisma não consegue expressar em `schema.prisma`: RLS, triggers em `auth.users`. Aplicado manualmente via `prisma db execute --file`. |
| `seeds/` | Dados de referência extraídos da planilha original — taxonomia, carteiras, responsáveis, tipos, situações, recorrências. Carregados por `prisma/seed.ts` e `prisma/seed-workspace.ts`. |
| `tests/` | Espelha a estrutura de `lib/`. 113 testes, todos unitários (nenhum teste de integração/e2e ainda). |

---

## 6. Responsabilidade de cada módulo (arquivos-chave)

### `lib/finance/` (puro, sem Prisma — ver seção 12 para a lista completa de regras)
- `types.ts` — tipos compartilhados (`FinanceEntry`, `FinanceWallet`, `Period`, `Regime`, re-exporta `Decimal` do runtime do Prisma).
- `dates.ts` — utilitários de data "pura" (sem fuso), `addMonths` com clamp de fim de mês.
- `derived.ts` — Resultado derivado (§10 R3) e classificação de urgência pra UI.
- `balance.ts` — saldo de carteira e blocos do dashboard (§11.1, §11.2).
- `period.ts` — totais Receita/Despesa/Investimento/Balanço com regime Caixa×Competência (§11.3, §10 R2).
- `card.ts` — janela de fatura, fatura vigente (usado no lançamento rápido), cobertura (§11.4, §11.5, §12).
- `installments.ts` — geração de parcelas e de recorrências materializadas 24 meses (§8.5).
- `transfer.ts` — monta o par de linhas de uma transferência (§10 R5).
- `fixed.ts` — despesa fixa × variável (§11.7).
- `reserve.ts` — média de despesa, meta e gauge de reserva de emergência (§11.6).
- `rankings.ts` — top 5 e distribuição por categoria (§11.8).
- `from-db.ts` — **o único lugar que traduz uma linha do Prisma pro tipo `FinanceEntry`**. Qualquer tela nova que precise calcular algo deve passar por aqui.

### `lib/entries/`
- `create.ts` — `createEntryOrSeries()`: cria lançamento único, parcelado ou recorrente materializado. Usado por `/api/entries` (POST) **e** pelo lançamento rápido — não duplicar essa lógica.
- `settle.ts` — `settleEntry()`: A_PAGAR→PAGO / A_RECEBER→RECEBIDO. Usado por `/api/entries/:id/settle` **e** pela tela de Compromissos.
- `transfer.ts` — `createTransfer()`: resolve a categoria fixa "Transferências" (`nature=OUTRO`, `slug=transferencias`) e cria as duas linhas via `lib/finance/transfer.ts::createTransferPair()` numa `$transaction`. Usado pela tela `/lancamentos/transferir`.
- `recurrence-label.ts` — reconstrói o texto de Recorrência pra exibição/exportação.
- `export-row.ts` — mapeia uma `Entry` do Prisma pra uma linha exportável (mesmos headers do importador).
- `build-csv.ts` / `build-xlsx.ts` — geram os arquivos de exportação (§18.2).

### `lib/import/`
- `parse-csv.ts` — `parseCsvWithHeaderDetection()`: acha a linha de cabeçalho real (tolera lixo antes, como exports do Google Sheets) e detecta separador `,` ou `;`.
- `column-mapping.ts` — mapeamento cabeçalho→campo, auto-detecção.
- `parse-brl.ts` — datas `dd/mm/aaaa` e valores `R$ 1.234,56` / negativo / parênteses.
- `parse-recorrencia.ts` — desmembra a coluna Recorrência, incluindo os formatos reais `"N de M"` e `"N/M"` (não documentados na especificação original).
- `parse-status.ts` — Situação → código.
- `parse-row.ts` — valida uma linha (o que dá pra checar sem banco).
- `resolve.ts` — resolve carteira/categoria/subcategoria/responsável contra o banco (com suporte a `legacy_name` de carteira) e detecta duplicata.
- `duplicate-key.ts` — chave de deduplicação (`due_date + amount + description + wallet`).
- `revert.ts` — `revertImportBatch()`: reverte um lote (bloqueado se algum lançamento foi editado depois). Usado por `/api/import/:batchId/revert` **e** pela tela de Importar.

### `lib/workspace/invite.ts`
- `createInvite()` — cria um `WorkspaceInvite` (e-mail + papel + token opaco + telefone opcional, normalizado via `lib/format.ts::toWhatsAppDigits()`). Só TITULAR/admin (checado na action, não na função).
- `acceptInvite()` — valida token não aceito e **e-mail do perfil logado bate com o e-mail convidado** (senão `ApiError(403)`), cria a `Membership` (ou reaproveita se já existir) numa `$transaction` junto com marcar `acceptedAt`.
- **Envio continua 100% manual:** o sistema nunca manda e-mail nem WhatsApp sozinho — só gera o link e, se houver telefone, um link `https://wa.me/<telefone>?text=<mensagem>` que abre o WhatsApp com a mensagem pronta pro usuário clicar em enviar. Decisão explícita: uma API paga do WhatsApp Business exigiria conta comercial verificada e aprovação de template pela Meta, fora do escopo (ver seção 21).

### `lib/auth/session.ts`
- `getCurrentProfile()` — perfil + memberships, com `cache()` do React (dedup por request).
- `requireProfile()` / `requireWorkspaceId()` — pra Server Components (redirecionam se não autenticado).
- `requireApiWorkspaceMembership()` — pra Route Handlers (lança `ApiError`, não redireciona).
- `requireAdminProfile()` — existe mas **não está mais em uso** desde que as telas de Cadastros passaram a ser visíveis-porém-desabilitadas em vez de bloqueadas (ver seção 20).
- `assertCanWrite()` — LEITURA não escreve.
- `assertIsAdmin()` — só admin (Categoria/Subcategoria/Tipo).

### Outros
- `lib/supabase/admin.ts` — `createAdminClient()`, client com a service role key (contorna RLS, enxerga `auth.users` inteiro via Admin API). **Só server-side** — nunca importar num Client Component. Único consumidor hoje: `/admin/usuarios`.
- `lib/db/prisma.ts` — singleton do Prisma Client com `PrismaPg` adapter; carrega `.env.local` explicitamente (necessário pros scripts standalone via `tsx`, que não passam pelo carregamento automático do Next).
- `lib/format.ts` — `formatCurrencyBRL`, `formatDateBR` (Intl pt-BR), `toWhatsAppDigits` (normaliza telefone pro link `wa.me`, assume DDI 55 se vierem 10-11 dígitos).
- `lib/slug.ts` — `slugify()`, implementa o algoritmo exato do §18.3.
- `lib/api/errors.ts` / `prisma-errors.ts` — `ApiError`, `apiErrorResponse()`, `rethrowFriendly()` (converte violação de unique constraint em mensagem legível).
- `lib/validation/entry.ts` — schemas Zod `createEntrySchema`/`updateEntrySchema`, `parseIsoDate`.

---

## 7. Fluxo completo da aplicação

1. Usuário acessa qualquer rota → `proxy.ts` (middleware) intercepta, renova sessão Supabase, redireciona pra `/login` se não autenticado (exceto `/login`, `/auth/*`, manifest/ícones/service worker).
2. `/` redireciona pra `/painel`.
3. `(app)/layout.tsx` carrega perfil + membership (via `requireProfile`), monta header/nav.
4. Navegação principal: **Painel** (dashboard) · **Lançamentos** (listar/filtrar/importar/exportar) · **Cadastros** (carteiras, responsáveis, categorias, subcategorias, tipos) · botão flutuante **+** (lançamento rápido) · nav inferior no mobile.
5. Toda leitura de dados financeiros passa por: página busca `workspaceId` da sessão → query Prisma filtrada → (quando envolve cálculo) mapeia pra `FinanceEntry` via `lib/finance/from-db.ts` → chama função pura de `lib/finance/*`.
6. Toda escrita (criar/editar lançamento, cadastro) passa por Server Action ou Route Handler → deriva `workspaceId`/papel da sessão → valida (Zod nas rotas de API; validação manual nas actions) → Prisma.

---

## 8. Fluxo de autenticação

1. **Cadastro:** `app/(auth)/login/actions.ts` → `signup()` → `supabase.auth.signUp({ email,
   password, options: { data: { full_name } } })`. O form pede **Nome completo** (obrigatório,
   único campo extra além de e-mail/senha — decisão explícita de manter o cadastro mínimo,
   ver seção 21) e passa como `full_name` no metadata, que o trigger abaixo usa.
2. Supabase cria a linha em `auth.users` → **trigger** `on_auth_user_created`
   (`prisma/sql/001_auth_and_rls.sql`) roda automaticamente e, na mesma transação:
   - cria `public.profiles` (id = auth.users.id);
   - cria um `Workspace` pessoal ("Nome (pessoal)");
   - cria a `Membership` com papel `TITULAR`.
   - **Efeito prático:** todo signup já nasce com workspace próprio — não há hoje um fluxo
     de "administrador cria workspace de cliente" (isso é Fase 4/consultoria, não construído).
3. E-mail de confirmação enviado pelo Supabase (template **padrão**, não customizado — ver
   seção 19). Ao clicar, a sessão é estabelecida automaticamente via `@supabase/ssr` no
   client (cookies).
4. **Login:** `login()` → `supabase.auth.signInWithPassword()` → redirect pro `redirectTo`
   recebido via campo hidden do form (fallback `/painel`).
5. **Sessão:** cookies HTTP-only gerenciados pelo `@supabase/ssr`; renovados a cada request
   pelo middleware (`lib/supabase/middleware.ts`).
5b. **Deep link pós-login (`redirectTo`):** quando o middleware redireciona um usuário não
   autenticado pra `/login`, ele preserva o caminho original em `?redirectTo=`. A página de
   login repassa isso num campo hidden do form; a action `login()` só aceita caminhos que
   começam com `/` e não `//` (evita open redirect) antes de usar como destino do
   `redirect()`. Existe principalmente pra permitir abrir um link de convite
   (`/convite/:token`) sem estar logado e continuar direto pra ele após entrar — mas serve
   pra qualquer link direto. `signup()` não usa isso (Supabase exige confirmação de e-mail
   antes de logar; a pessoa reabre o link original depois de confirmar).
6. **Logout:** `app/(app)/actions.ts` → `supabase.auth.signOut()` → redirect `/login`.
7. **Admin da plataforma:** `Profile.isPlatformAdmin` — hoje só é `true` pra
   `fhildebrando@gmail.com`, setado manualmente via SQL direto (não existe UI para
   promover outro usuário a admin). Ver "Débitos técnicos".
8. **`/auth/confirm/route.ts`** existe (verifica `token_hash` + `type` via `verifyOtp`) mas
   **não está sendo usado na prática** — o fluxo real funciona via o link padrão do
   Supabase + detecção automática de sessão no client. Ficou como código morto/preparado
   pra quando o template de e-mail for customizado (precisa de SMTP próprio, não configurado).
9. **Esqueci minha senha:** link na tela de login → modo "recover" → `requestPasswordReset()`
   chama `supabase.auth.resetPasswordForEmail(email, { redirectTo: origin + "/redefinir-senha" })`.
   A mensagem de retorno é sempre genérica ("se esse e-mail existir…"), nunca confirma se o
   e-mail está cadastrado (evita enumeração de contas). `/redefinir-senha`
   (`app/(auth)/redefinir-senha/page.tsx`, client component) fica de fora do gate de sessão
   do middleware (`PUBLIC_PATHS` em `lib/supabase/middleware.ts`) porque a sessão de
   recuperação só é estabelecida depois que o browser processa a URL do link de e-mail
   (evento `PASSWORD_RECOVERY` do `onAuthStateChange`, ou sessão já presente se o fluxo for
   PKCE) — a página espera até 6s por isso antes de mostrar "link inválido ou expirado".
   Depois de confirmada a sessão, `supabase.auth.updateUser({ password })` troca a senha e
   redireciona pra `/painel`.

---

## 9. Fluxo financeiro (como um lançamento nasce e é calculado)

**Criação (duas origens):**
- **Lançamento rápido** (`/lancamentos/novo`): form client-side com defaults automáticos
  (carteira/responsável = último usado em 24h; Vence/Situação calculados a partir do tipo
  de carteira) → `createQuickEntry()` (action) → `createEntryOrSeries()`.
- **Importação de CSV** (`/lancamentos/importar`): upload → preview (mapeamento +
  validação, `/api/import/preview`) → confirmação (`/api/import/commit`) → grava em lote
  atômico, cria `ImportBatch`.

**`createEntryOrSeries()` (`lib/entries/create.ts`) decide:**
- `installmentsTotal >= 2` → `generateInstallments()` (parcelamento numerado, mesmo
  `group_id`, `due_date` avançando mês a mês a partir do dia original).
- `recurrenceCode` fora de `{UNICA, VARIAVEL}` → `generateRecurrenceOccurrences()`
  (materializa 24 meses à frente, mesmo `group_id`).
- Senão → lançamento único.

**Cálculo (Painel):** toda a leitura para exibição é: buscar `Entry[]` do workspace →
`toFinanceEntry()` → passar pras funções puras de `lib/finance`. Nenhum cálculo financeiro
vive dentro de componente React (regra não-negociável do §15).

**Transferência (§10 R5):** tela própria em `/lancamentos/transferir` (origem, destino,
valor, data, responsável, subcategoria opcional). `lib/entries/transfer.ts::createTransfer()`
resolve a categoria fixa "Transferências" (`nature=OUTRO`, seed já trazia essa categoria e
suas 6 subcategorias) e usa `lib/finance/transfer.ts::createTransferPair()` pra montar o par
saída/entrada, gravado numa `$transaction`. Situação sempre `PAGO` (não há noção de
"transferência a pagar" no domínio); recorrência sempre `UNICA`.

---

## 10. Modelagem do banco de dados

Schema completo em `prisma/schema.prisma`. Resumo por grupo:

**Identidade/acesso**
- `Profile` (espelha `auth.users`, `is_platform_admin` global)
- `Workspace`, `Membership` (`role`: TITULAR/MEMBRO/LEITURA)
- `WorkspaceInvite` (convite pra um workspace existente: `email`, `role`, `token` único,
  `phone` nullable (só dígitos com DDI, pro botão "Enviar por WhatsApp"), `acceptedAt`
  nullable — ver `lib/workspace/invite.ts`)

**Taxonomia (global, não por workspace)**
- `EntryNature` (enum fixo no código: RECEITA/DESPESA/INVESTIMENTO/OUTRO — nunca tabela)
- `NatureLabel` (rótulo de exibição editável pelo admin; a chave em si não muda)
- `Category` (`nature`, admin-only)
- `Subcategory` (`categoryId`, `workspaceId` nullable — hoje sempre `null`/global desde que
  virou admin-only; `isActive` pra arquivar)

**Carteiras**
- `WalletKind` (tabela de referência extensível, nunca enum — §6.2)
- `Institution` (sem seed próprio; populada a partir dos nomes distintos em
  `seed_carteiras.csv`)
- `Wallet` (`workspaceId`, `kindCode`, `institutionId?`, `linkedWalletId?` self-relation
  pra caixinha↔cartão, `closingDay`/`dueDay`/`creditLimit` pra cartão, `isActive` pra
  arquivar)

**Responsáveis**
- `Person` (`workspaceId`, `isShared`)

**Referências de lançamento (global)**
- `Status` (8 valores, `countsAsSettled`)
- `RecurrenceKind` (13 valores, `intervalMonths`)

**Lançamentos**
- `EntryGroup` (agrupa parcelas/recorrências)
- `Entry` (a entidade central — ver §8.1 da especificação pra semântica completa de cada
  campo; `amount` é `Decimal(14,2)` com sinal, nunca float)
- `ImportBatch` (lote de importação, revertível)
- `ExportLog` (auditoria leve de exportação)

**Migrations aplicadas (em ordem):**
1. `20260729220239_init` — Fase 0 completa (identidade, taxonomia, carteiras, responsáveis, referências).
2. `20260729234528_entries` — `EntryGroup`, `Entry`, `ImportBatch`.
3. `20260730131325_nature_labels` — `NatureLabel`.
4. `20260730160517_subcategory_archive_export_log` — `Subcategory.isActive`, `ExportLog`.
5. `20260730172238_workspace_invites` — `WorkspaceInvite`.
6. `20260730194550_workspace_invite_phone` — `WorkspaceInvite.phone`.

**SQL manual (não gerenciado pelo Prisma, aplicado via `prisma db execute --file`):**
- `001_auth_and_rls.sql` — FK profiles→auth.users, trigger de signup, RLS Fase 0.
- `002_drop_cross_schema_fk.sql` — remove a FK cross-schema, substitui por trigger de
  delete (ver seção 19, incidente evitado).
- `003_entries_rls.sql` — RLS de entry_groups/entries/import_batches.
- `004_permission_updates.sql` — RLS de nature_labels; subcategoria vira admin-only.
- `005_export_logs_rls.sql` — RLS de export_logs.
- `006_workspace_invites_rls.sql` — RLS de workspace_invites (select/insert/delete só
  TITULAR do workspace ou admin; a aceitação em si roda via Prisma, que contorna RLS —
  quem aceita ainda não é membro do workspace de destino).

**Convenção:** toda tabela usa `snake_case` no banco (`@map`), `camelCase` no Prisma/TS.
IDs são UUID (`gen_random_uuid()`), exceto tabelas de referência cuja PK é o próprio
`code` (string).

---

## 11. Regras de negócio implementadas

Todas testadas em `tests/finance/` (113 testes no total, incluindo `lib/import`).

| # | Regra | Onde |
|---|---|---|
| §8.3 | Valor com sinal (despesa negativa, receita positiva); usuário nunca digita o sinal | `lib/entries/create.ts` (quick entry), `lib/import/parse-brl.ts` |
| §8.5 | Parcelamento numerado, `group_id` automático, due_date avança a partir do dia original (não em cadeia) | `lib/finance/installments.ts` |
| §8.5 | Recorrência sem fim materializa 24 meses à frente | `lib/finance/installments.ts::generateRecurrenceOccurrences` |
| §10 R2 | Regime Caixa (Vence, default) × Competência (Compra) | `lib/finance/period.ts` |
| §10 R3 | Resultado derivado (Ok/vencido/a pagar/a receber), nunca digitado | `lib/finance/derived.ts` |
| §10 R5 | Transferência: par de linhas, soma zero, tela própria (origem/destino/valor/data) | `lib/finance/transfer.ts`, `lib/entries/transfer.ts`, `app/(app)/lancamentos/transferir/*` |
| §11.1/11.2 | Saldo de carteira, blocos do dashboard | `lib/finance/balance.ts` |
| §11.3 | Receita/Despesa/Investimento/Balanço do período (fiel à fórmula — **não filtra por situação**, inclui A_PAGAR/A_RECEBER/ESTIMATIVA) | `lib/finance/period.ts` |
| — | Painel com 3 visões de período — Mensal (padrão), Anual (ano inteiro, nav ano anterior/seguinte), Geral (todo o histórico, sem nav) — via `?view=`. Afeta KPIs, Top 5, distribuição por categoria; o gráfico "Últimos 6 meses" não muda (sempre 6 meses fixos, é sobre tendência recente, não o período selecionado) | `app/(app)/painel/page.tsx` |
| §11.4/11.5 | Janela de fatura, fatura vigente, cobertura | `lib/finance/card.ts` |
| §11.6 | Reserva de emergência (média 6 meses fechados, meta, gauge) | `lib/finance/reserve.ts` |
| §11.7 | Fixa × variável (regra automática + override manual) | `lib/finance/fixed.ts` |
| §11.8 | Top 5 e distribuição por categoria | `lib/finance/rankings.ts` |
| §12 | Lançamento rápido: defaults automáticos de carteira/responsável (24h), Vence/Situação por tipo de carteira, sugestão de categoria por texto repetido | `app/(app)/lancamentos/novo/*`, `/api/entries/suggest-category` |
| §18.1 | Importação: detecção de cabeçalho, formatos BR, duplicata, revert de lote | `lib/import/*`, `/api/import/*` |
| §18.2 | Exportação CSV/XLSX respeitando filtros, round-trip sem perda (testado com 1085 lançamentos reais), log de auditoria | `lib/entries/build-*.ts`, `/api/entries/export` |
| §18.3 | Slug (acentos/maiúsculas), CSV com BOM+`;` pro Excel, detecção automática de separador no import | `lib/slug.ts`, `lib/import/parse-csv.ts` |
| §20 | Carteira/Responsável: qualquer membro edita. Categoria/Subcategoria/Tipo (rótulo): só admin, visível-porém-desabilitado pra quem não é admin. Nome duplicado vira erro legível. Arquivar em vez de excluir (Wallet e Subcategory). | `app/(app)/cadastros/**`, `lib/auth/session.ts`, `lib/api/prisma-errors.ts` |
| §21 | Nav inferior + cards no mobile, PWA instalável (manifest/ícone/service worker) | `app/(app)/layout.tsx`, `app/(app)/lancamentos/page.tsx`, `app/manifest.ts`, `app/sw.ts` |
| §13 | Tela Compromissos: vencidos/hoje/próximos 7/próximos 30 dias, marcar pago/recebido em 1 clique | `app/(app)/compromissos/*`, `lib/entries/settle.ts` |
| §13 | Lançamentos: seleção múltipla (excluir em lote, marcar pago/recebido em lote) e edição in-line (descrição, categoria, subcategoria, responsável, situação, vencimento, valor) — **só no desktop** (≥768px); mobile continua somente leitura, decisão de escopo desta rodada | `app/(app)/lancamentos/EntriesTable.tsx` |
| §18.1 | Reverter importação: botão por lote na tela de Importar | `app/(app)/lancamentos/importar/*`, `lib/import/revert.ts` |
| §19.1 | Convidar membro pra workspace existente: TITULAR/admin gera link de convite com token (+ botão opcional "Enviar por WhatsApp" via `wa.me` se o telefone for informado), pode excluir um convite pendente; quem aceita precisa estar logado com o e-mail exato do convite | `app/(app)/cadastros/membros/*`, `app/(app)/convite/[token]/*`, `lib/workspace/invite.ts` |
| §19.1 | Painel `/admin/usuarios` (só `isPlatformAdmin`): todo usuário cadastrado no sistema — nome, e-mail, se é admin, workspaces + papel em cada um, e-mail confirmado, cadastro, último login | `app/(app)/admin/usuarios/page.tsx`, `lib/supabase/admin.ts` |
| — | Esqueci minha senha (login → e-mail → link → nova senha) | `app/(auth)/login/*`, `app/(auth)/redefinir-senha/page.tsx` |

---

## 12. Regras de negócio ainda pendentes

- **§11.3 `[DECIDIR]`:** distinção entre `BALANÇO` e `SALDO` na aba BALANCO da planilha
  original — não bloqueia nada hoje, só afeta um relatório de Fase 2 ainda não construído.
- **§13 — Edição in-line/ações em lote no mobile:** ficaram restritas ao desktop nesta
  rodada (ver seção 11) — no celular a tela de Lançamentos continua só leitura.
- **§18.1 — Perfil de mapeamento salvável:** mapeamento é feito na hora a cada importação,
  não é lembrado.
- **§18.1 — Importação de .xlsx:** só CSV é aceito.
- **§19.1 — Seletor de workspace:** não existe. Quem aceita um convite mas já tinha conta
  (e portanto já tem workspace próprio, criado automaticamente no signup) passa a ter duas
  memberships, mas o app sempre mostra `memberships[0]` — não necessariamente a nova. Só
  funciona sem ambiguidade pra quem aceita o convite **antes** de ter criado conta própria.
  Ver seção 22 (Problemas conhecidos).
- **§20 — "Criar item" durante importação:** quando carteira/categoria não existe, a linha
  vira erro; não há atalho pra criar o item na hora, como a especificação sugere.
- **§21 — Lançar offline:** **explicitamente adiado** (fila de sincronização é projeto à
  parte). O service worker cacheia o app shell mas não enfileira gravações sem rede.
- **Fase 2 completa:** analítico mês a mês, despesas parceladas, balanço anual, orçamento,
  fluxo projetado, importação de OFX — nada disso foi iniciado.
- **Fase 3/4:** patrimônio (`asset`), dívidas (`debt`), metas (`goal`), Open Finance,
  multi-workspace de consultoria — nada disso foi modelado ainda (§7.4 "OUTRO" continua
  como natureza única, sem as entidades dedicadas que a especificação recomenda como
  melhoria).

---

## 13. APIs existentes

Todas exigem sessão Supabase válida (via `requireApiWorkspaceMembership`); escrita exige
`assertCanWrite` (LEITURA bloqueado). `workspace_id` sempre derivado da sessão.

| Rota | Método | Descrição |
|---|---|---|
| `/api/entries` | GET | Lista paginada com filtros (período, carteira, natureza, texto) |
| `/api/entries` | POST | Cria lançamento único, parcelado ou recorrente materializado |
| `/api/entries/:id` | PATCH | Edita campos parciais |
| `/api/entries/:id` | DELETE | Exclui; se for transferência, exclui as duas linhas |
| `/api/entries/:id/settle` | PATCH | Marca A_PAGAR→PAGO ou A_RECEBER→RECEBIDO |
| `/api/entries/suggest-category` | GET | Sugestão de categoria por repetição exata de descrição |
| `/api/entries/export` | GET | Exporta CSV ou XLSX (`?format=csv\|xlsx`) respeitando filtros; loga em `ExportLog` |
| `/api/import/preview` | POST | Passo 2/3 do importador: mapeamento + validação, sem gravar |
| `/api/import/commit` | POST | Passo 4: grava em lote atômico, cria `ImportBatch` |
| `/api/import/:batchId/revert` | POST | Reverte lote (bloqueado se algo foi editado depois); botão na tela de Importar |
| `/auth/confirm` | GET | Callback de confirmação de e-mail (token_hash) — **não usado na prática hoje** |

Compromissos, transferência e convite de membro **não** passam por `app/api/**` — são
Server Actions (`app/(app)/compromissos/actions.ts`, `.../lancamentos/transferir/actions.ts`,
`.../cadastros/membros/actions.ts`, `.../convite/[token]/actions.ts`), seguindo o mesmo
critério já documentado: Route Handler só quando um client component precisa de `fetch` com
resposta JSON (import wizard, sugestão de categoria) ou o `EntriesTable` client component
(edição in-line e ações em lote usam `fetch` direto contra `/api/entries/:id` e
`/api/entries/:id/settle` já existentes, sem endpoint novo).

---

## 14. Serviços

Não há serviços externos além do **Supabase** (Postgres + Auth). Nenhuma integração de
pagamento, Open Finance ou push ainda (todas são Fase 2+). `SUPABASE_SERVICE_ROLE_KEY` agora
**é usada** em `lib/supabase/admin.ts` (Admin API do Supabase, só server-side) — a página
`/admin/usuarios` lista todo usuário cadastrado no sistema (ver seção 11).

**E-mail transacional (confirmação de cadastro, redefinição de senha): não funciona hoje,
causa raiz identificada, correção adiada de propósito.** Ver "Problemas conhecidos" #9 pro
diagnóstico completo — resumo: nem o e-mail padrão do Supabase, nem SMTP via Gmail, nem SMTP
via Brevo (com o remetente `prospectafinancas@gmail.com`) conseguiram entregar. A causa raiz
real é que o remetente é um endereço `@gmail.com` — nenhum provedor terceiro consegue
autenticar DKIM/DMARC pra um domínio que não controla, e Google/Yahoo/Microsoft bloqueiam ou
jogam pra spam e-mails "em nome de" um freemail relayado por terceiro. A correção exige um
domínio próprio (usuário decidiu comprar depois, não agora). Contorno manual enquanto isso:
confirmar o e-mail do usuário direto no painel do Supabase (Authentication → Users → usuário
→ confirmar e-mail).

---

## 15. Componentes principais

| Componente | Tipo | Onde |
|---|---|---|
| `QuickEntryForm` | Client | `app/(app)/lancamentos/novo/QuickEntryForm.tsx` — form completo do lançamento rápido, com sugestão de categoria, defaults reativos por carteira |
| `EntriesTable` | Client | `app/(app)/lancamentos/EntriesTable.tsx` — tabela desktop de Lançamentos: checkbox de seleção, barra de ações em lote (excluir / marcar pago-recebido), edição in-line por linha (`EditRow`, componente interno) via `fetch` PATCH em `/api/entries/:id` |
| `TransferForm` | Client | `app/(app)/lancamentos/transferir/TransferForm.tsx` — origem/destino (com exclusão mútua), valor, data, responsável |
| `InviteLink` | Client | `app/(app)/cadastros/membros/InviteLink.tsx` — botão "copiar" do link de convite; recebe a URL já montada (origin resolvido no server via `headers()`, não `window.location`, pra evitar mismatch de hidratação) |
| `MonthlyChart` | Client | `components/charts/MonthlyChart.tsx` — gráfico Recharts (Receita/Despesa/Saldo, 6 meses) |
| `CategoryRings` | Server | `components/charts/CategoryRings.tsx` — "Distribuição por categoria" do Painel: grid de anéis de progresso SVG (não Recharts) com ícone `lucide-react` por categoria, escolhido por palavra-chave no nome (`iconForCategory`, sem lista fixa — a taxonomia é livre, §7). Puramente apresentacional, server-renderizável (sem `"use client"`). |
| `ReserveGauge` | Server | `components/charts/ReserveGauge.tsx` — "Reserva de emergência" do Painel: velocímetro SVG (semicírculo, 3 zonas vermelho/âmbar/verde + ponteiro), mesmas faixas 0-33/33-66/66-100% de `lib/finance/reserve.ts::reserveGaugeBand`. Também server-renderizável. |
| `PasswordInput` | Client | `components/PasswordInput.tsx` — campo de senha com toggle mostrar/ocultar (ícone de olho, `lucide-react`), usado no login/cadastro. Não-controlado (só `name`/`required`/`autoComplete`) — `redefinir-senha/page.tsx` tem o mesmo toggle implementado inline porque os campos lá são controlados (`value`/`onChange`), não reaproveita este componente. |
| `InstallPrompt` | Client | `components/InstallPrompt.tsx` — banner de instalar o PWA na tela de login. Android/Chrome: escuta `beforeinstallprompt`, botão dispara `prompt()` nativo. iOS Safari (sem essa API): mostra instrução manual. Fechar (`X`) não persiste bloqueio nenhum — reaparece na próxima vez que `/login` for aberta, decisão explícita do usuário depois de uma primeira versão com cooldown de 14 dias (ver seção 21). |
| `RegisterServiceWorker` | Client | `components/RegisterServiceWorker.tsx` — registra o SW, só em produção |
| `Sidebar` | Client | `components/Sidebar.tsx` — menu lateral de navegação (desktop/tablet, `md+`), fundo `#131A47` (cor exata pedida pelo usuário), item ativo em âmbar, grupos expansíveis "Lançamentos" e "Cadastros" com sub-páginas, ícones via `lucide-react`. Estilo pedido pelo usuário inspirado no sistema "Meu Vista" (mesma referência já usada pro fundo claro da tabela de Lançamentos, ver seção 21). |
| `MobileNav` | Client | `components/MobileNav.tsx` — barra inferior do celular (`<md`), mesma cor `#131A47` e mesmos ícones do `Sidebar`, com destaque em âmbar da página atual (antes não existia esse destaque). Junto com o header mobile em `(app)/layout.tsx` (também `#131A47`), unifica a linguagem visual entre desktop e mobile — pedido explícito do usuário após o primeiro corte do Sidebar deixar os dois muito diferentes. |
| Páginas de Cadastros | Server | `app/(app)/cadastros/{carteiras,responsaveis,categorias,subcategorias,tipos,membros}/page.tsx` — todas seguem o mesmo padrão: tabela + form inline de criação, campos `disabled` com nota quando o usuário não tem permissão (Membros usa TITULAR/admin como critério de permissão, não `assertCanWrite`) |
| `StatCard` | Server (local) | Definido dentro de `painel/page.tsx`, não extraído |

Não há biblioteca de componentes (shadcn/ui) instalada apesar de recomendada no §15 — os
componentes são HTML+Tailwind direto, estilo consistente mas escrito à mão em cada tela.
`lucide-react` foi instalado (só ícones, não é uma lib de componentes) especificamente pro
`Sidebar`.

---

## 16. Hooks

Nenhum hook customizado (`useX`) foi criado. O único estado client-side relevante vive
dentro de `QuickEntryForm.tsx` via `useState` (nature, wallet, categoria, subcategoria,
responsável, situação, "mais opções") — não foi extraído pra hooks reutilizáveis porque só
há um consumidor até agora.

---

## 17. Context Providers

Nenhum React Context foi criado. Estado de sessão/tema/etc. não usa Context — cada Server
Component busca o que precisa direto via `lib/auth/session.ts` (com `cache()` do React pra
deduplicar entre layout e página na mesma request).

---

## 18. Utilitários e bibliotecas (resumo)

Ver seção 3 (tecnologias) pra bibliotecas de terceiros. Utilitários próprios:
`lib/format.ts`, `lib/slug.ts`, `lib/finance/dates.ts`, `lib/api/prisma-errors.ts`.

---

## 19. Variáveis de ambiente necessárias

Todas em `.env.local` (gitignored, nunca commitado, nunca colado em chat):

| Variável | Uso |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | URL do projeto Supabase (público) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Chave anônima do Supabase (público) |
| `SUPABASE_SERVICE_ROLE_KEY` | Chave de serviço (privada) — usada em `lib/supabase/admin.ts` (Admin API, página `/admin/usuarios`) |
| `DATABASE_URL` | Connection string do Postgres — **usa o "Session pooler" do Supabase** (porta 5432, `aws-0-sa-east-1.pooler.supabase.com`), não a conexão direta (a rede residencial do usuário não tem IPv6, que a conexão direta exige) |

Projeto Supabase: `zfugldawxhvzclooisqj`, região `sa-east-1` (São Paulo).

**Deploy em produção:** Vercel, projeto `prospecta-finance`, branch `master` do repositório
`github.com/fhildebrando-lfsh/PROSPECTA-Finance` (push nessa branch redeploya
automaticamente). URL: `https://prospecta-finance.vercel.app`. As 4 variáveis acima estão
configuradas em Project Settings → Environment Variables na Vercel (mesmos valores do
`.env.local`, apontando pro **mesmo banco Supabase** usado em desenvolvimento local — não há
banco de produção separado ainda). No Supabase, Authentication → URL Configuration tem
`Site URL` e `Redirect URLs` apontando pra essa mesma URL da Vercel (necessário pro link de
confirmação de e-mail do signup funcionar; sem isso ele apontaria pro `localhost`).

---

## 20. Convenções de código adotadas

- **`camelCase` no TS, `snake_case` no banco** via `@map`/`@@map` do Prisma.
- **Dinheiro sempre `Decimal`** (do runtime do Prisma, `@prisma/client/runtime/client`),
  nunca `number`/float. Import: `import { Decimal } from "@/lib/finance/types"`.
- **Datas "puras"**: sempre `Date.UTC(...)`, nunca depender do fuso local. `lib/finance/dates.ts`
  centraliza qualquer aritmética de data.
- **Regras financeiras são sempre funções puras em `lib/finance/`**, sem import de Prisma,
  sempre com teste. A ponte com o banco é explícita via `lib/finance/from-db.ts`.
- **Server Actions em `actions.ts`** ao lado da página que as usa (`"use server"` no topo
  do arquivo, não inline).
- **Slugs via `lib/slug.ts::slugify()`** — nunca inventar outra normalização.
- **Erros de escrita**: Server Actions lançam `Error` com mensagem legível (aparece no
  overlay do Next em dev); Route Handlers usam `ApiError` + `apiErrorResponse()`.
  `rethrowFriendly()` converte violação de unique constraint (P2002) em mensagem amigável.
- **Comentários no código**: só quando explicam o "porquê" não-óbvio (uma decisão, uma
  seção da especificação, um bug real evitado) — nunca "o quê" (nomes já dizem isso).
  Muitos comentários referenciam `§N` da especificação de propósito, pra rastreabilidade.
- **Sem gerenciador de estado global** (Redux/Zustand/Context) — o padrão é Server
  Component busca dado + Server Action grava, sem cache client-side dedicado ainda
  (TanStack Query estava no stack recomendado mas não foi instalado; não há necessidade
  percebida até agora, já que quase tudo é Server Component).
- **Testes:** Vitest, um arquivo de teste por módulo em `lib/finance`/`lib/import`,
  nomeados igual ao módulo. Fixtures em `tests/finance/helpers.ts`.

---

## 21. Decisões arquiteturais tomadas e o motivo de cada uma

| Decisão | Motivo |
|---|---|
| Next.js 16 em vez de 15 | Era a versão "latest" disponível ao iniciar o projeto; a especificação pede "framework mainstream com App Router", não uma versão específica. |
| Prisma 7 com driver adapter (`@prisma/adapter-pg`) em vez do engine Rust clássico | Exigência do próprio Prisma 7 (removeu `url`/`directUrl` do schema; motor "no Rust engine" é o caminho atual). |
| `DATABASE_URL` = Session Pooler, não conexão direta | A rede do usuário não tem IPv6 (que a conexão direta do Supabase exige por padrão). |
| FK `profiles → auth.users` removida, substituída por trigger | **Incidente evitado:** declarar o schema `auth` em `datasource.schemas` pro Prisma enxergar essa FK fazia `prisma migrate dev` tratar TODO o schema `auth` (usuários, sessões, tokens do Supabase) como drift e sugerir um **reset que apagaria a autenticação inteira**. A correção foi nunca deixar o Prisma precisar saber que `auth.users` existe. Ver `prisma/sql/002_drop_cross_schema_fk.sql`. |
| Workspace criado automaticamente no signup (trigger) | Uso é pessoal/familiar hoje — não há fluxo de "admin cria workspace de cliente" ainda (isso é Fase 4). |
| `Subcategory` virou admin-only (diferente do §20 original, que previa edição pelo cliente) | **Decisão explícita do usuário** durante a Conversa 3/5, sobrepondo a especificação original. `Category` continuou admin-only como já estava. |
| `Tipo` (natureza) continua 100% fixo no código; só o rótulo de exibição é editável (`NatureLabel`) | Todo `lib/finance` assume exatamente essas 4 naturezas nas fórmulas (soma Receita+Despesa+Investimento=Balanço). Tornar dinâmico exigiria redesenhar todas as fórmulas — escopo recusado explicitamente pelo usuário quando perguntado. |
| Categorias/Subcategorias/Tipos **visíveis mas desabilitadas** pra quem não é admin, em vez de escondidas | Pedido explícito da especificação (§20: "campo travado aparece visível e desabilitado, nunca escondido") — a primeira implementação escondia as abas, foi corrigido. |
| Cadastros de Categoria/Subcategoria/Tipo usam páginas separadas com forms simples (sem biblioteca de tabela) | Consistência com o resto do app (sem shadcn/ui instalado) e escopo — TanStack Table do stack recomendado não foi necessário até agora. |
| CSV de exportação usa `;` + BOM (não `,` sem BOM) como padrão | Por causa do uso real em Excel em português (§18.3) — o importador foi atualizado pra detectar automaticamente `,` ou `;`, então não há perda de compatibilidade. |
| `lib/entries/create.ts` centraliza criação de lançamento | Evita duplicar a lógica de parcelamento/recorrência entre `/api/entries` (POST) e o lançamento rápido — um bug corrigido em um lugar corrige os dois fluxos. |
| Serwist com `disable` em dev + `turbopack: {}` + `next build --webpack` | Serwist ainda não suporta Turbopack (default do Next 16) nativamente. Dev usa Turbopack normal (SW desligado, sem necessidade real em dev); produção força webpack só pro build gerar o service worker. Sem isso, `next dev` crashava (**bug real encontrado e corrigido**). |
| Middleware (`proxy.ts`) exclui `manifest.webmanifest`, `sw.js`, `icon-192`, `icon-512` do matcher | Sem isso, o próprio navegador (buscando esses arquivos sem sessão) era redirecionado pra tela de login — **bug real que quebrava a instalação como PWA**, encontrado e corrigido. |
| Tabela de Lançamentos usa fundo **claro** (não escuro como o resto do app) | Pedido explícito do usuário, inspirado numa referência visual (sistema "Meu Vista") — texto preto normal só funciona em fundo claro. É uma ilha clara dentro de um app majoritariamente escuro, decisão consciente registrada na conversa. |
| Sugestão de categoria no lançamento rápido usa repetição **exata** de texto, não fuzzy matching | Implementação literal do exemplo do §12 ("digitou Padaria 40 vezes") — mais simples e previsível que um matching aproximado. |
| `ExportLog` é uma tabela enxuta só pra exportação, não um sistema de auditoria genérico | Escopo: a especificação só exige rastrear exportação especificamente ("principal via de vazamento de dados"), não todo evento do sistema. |
| Convite de workspace exige que o e-mail da conta logada bata exatamente com o e-mail convidado | Sem isso, qualquer pessoa com o link (que é só um UUID, não protegido por senha) poderia entrar no workspace de outra pessoa. `Profile` não guarda e-mail (vive em `auth.users`, schema que o Prisma deliberadamente não enxerga — ver decisão da FK cross-schema); a checagem usa o `email` já resolvido em `lib/auth/session.ts::getCurrentProfile()`. |
| Edição in-line de valor infere o sinal pela natureza (Despesa/Receita) igual ao lançamento rápido; Investimento/Transferência usam um botão de inverter sinal em vez de digitar `-` | Mantém o princípio do §8.3 ("usuário nunca digita o sinal") pro caso comum; Investimento/Transferência não têm uma dicotomia natural tipo Despesa/Receita, então não dá pra inferir automaticamente — o toggle é a exceção mínima necessária, não digitação livre do sinal. |
| Edição in-line e ações em lote só existem na tabela desktop (`EntriesTable`); os cards mobile continuam somente leitura | Escopo desta rodada: seleção múltipla e forms de edição densos não cabem bem no layout de card; a tela de Compromissos já cobre a ação mobile mais comum (marcar pago/recebido). Reavaliar se o uso real (30 dias) mostrar necessidade. |
| `redirectTo` via query string, validado no server (`login()` só aceita caminho relativo começando com `/` e não `//`) | Permite abrir um link de convite sem estar logado e continuar direto pra ele após o login, sem introduzir open redirect (destino arbitrário controlado por quem gera a URL). |
| Origin do link de convite resolvido no Server Component via headers `x-forwarded-proto`/`host`, não `window.location` no client | Evita mismatch de hidratação (SSR não tem acesso a `window`) — o padrão de projeto até agora era client component só cuidar de interatividade, nunca de dado que o server já tem como calcular. |
| Botão "Enviar por WhatsApp" usa link `wa.me` (usuário clica em enviar dentro do próprio WhatsApp) em vez de envio automático via API do WhatsApp Business | Pedido do usuário após relatar que o e-mail do convite "não chegou" (na real, o sistema nunca mandou e-mail — mal-entendido esclarecido). Envio automático de verdade exigiria conta comercial verificada + aprovação de template pela Meta + custo por mensagem — infraestrutura que não existe e está fora do escopo pedido; o link `wa.me` entrega o essencial (mensagem e link prontos) sem nenhuma dependência nova. |
| `next build --webpack` (produção) roda separado do `next dev` (Turbopack) — bug do `useSearchParams()` sem `Suspense` na página de login só aparece no build de produção, nunca em dev | Descoberto ao rodar `npm run build` localmente antes do primeiro deploy na Vercel — se não fosse pego antes, o build teria falhado direto na Vercel. Lição: sempre rodar `npm run build` local antes de um deploy novo, não confiar só em `next dev` funcionando. |
| `/admin/usuarios` usa a Admin API do Supabase (`auth.admin.listUsers()` via service role key) em vez de `$queryRaw` direto em `auth.users` | Mais robusto — a Admin API é uma interface pública estável do Supabase; consultar `auth.users` via SQL cru dependeria do schema interno deles, que pode mudar. Reaproveita `SUPABASE_SERVICE_ROLE_KEY`, que já existia na config exatamente pra esse caso de uso (documentado desde a Fase 0). |
| Cadastro pede só "Nome completo" além de e-mail/senha, nada mais | Pedido explícito do usuário ("formulário com o mínimo de informação relevante") — resolve de quebra o bug de `Profile.fullName` sempre nascer nulo (aparecia como "(sem nome)" em Membros), sem inflar o formulário de cadastro. |
| Painel de "todos os usuários" ficou restrito a `isPlatformAdmin` vendo todo mundo — não virou um sistema de categorias/papéis novo (Administrador/Planejador/Cliente) | O usuário cogitou papéis novos inspirados na Fase 4 (consultoria multi-workspace) mas, perguntado, confirmou que só queria a visão de plataforma pra ele mesmo — não pediu pra mudar o modelo de permissões atual (`MembershipRole` por workspace + `isPlatformAdmin` global). Redesenhar papéis fica pra quando a Fase 4 for de fato encomendada. |
| Menu lateral (`Sidebar`) só em desktop/tablet (`md+`); mobile mantém barra inferior, não vira sidebar | Pedido explícito do usuário, com o sistema "Meu Vista" como referência visual (print anexado). Um menu lateral fixo não cabe bem numa tela de celular — a barra inferior é o padrão certo pra esse tamanho de tela. **Atualização:** a estrutura (sidebar vs. barra) ficou diferente de propósito, mas a *cor* e os *ícones* precisaram ficar iguais — ver `MobileNav` — porque o usuário achou o visual mobile/desktop "diferente demais" no primeiro corte. |
| Logo: 1ª tentativa (remover fundo branco + medalhão circular via `sharp`) foi rejeitada; versão final usa o arquivo que o próprio usuário refez com transparência real | O PNG original tinha canal alpha mas o branco ao redor do ícone era **opaco** (alpha 255), não transparente — dava efeito de "logo dentro de um quadrado branco" mesmo depois de redimensionada. Tentei consertar programaticamente (threshold de "brancura" + composição num círculo branco) e mandei preview antes de aplicar em tudo — o usuário rejeitou o resultado e preferiu refazer a arte ele mesmo. Lição: quando o problema é "a arte está errada", perguntar/mostrar preview antes de aplicar em todo canto vale mais do que tentar consertar via processamento automático — e valeu a pena ter perguntado antes de já ter commitado. |
| Cor do menu fixada em `#131A47` (valor exato, não um token Tailwind como `indigo-950`) | Pedido explícito do usuário com o hex exato — usado via sintaxe arbitrária do Tailwind (`bg-[#131A47]`) nos três lugares que representam "o menu" (`Sidebar`, `MobileNav`, header mobile), não alterado em mais nada (bordas/textos indigo-200/300/900 mantidos, servem de contraste sobre o novo fundo). |
| `#131A47` também virou a cor de fundo de **todos os cards do Painel** (StatCard, Top 5, gráfico mensal, cobertura de fatura, anéis de categoria, gauge de reserva) — não só do menu | O usuário só pediu explicitamente pros KPI cards, mas deixar alguns cards em `#131A47` e outros no antigo `bg-zinc-900` ficaria inconsistente/remendado num pedido que era sobre "visual moderno". Extensão de escopo pequena e óbvia, não uma decisão arriscada. |
| Bug real encontrado e corrigido: `app/globals.css` tinha uma regra `body { background: var(--background); ... }` **fora de qualquer `@layer`**, sobrescrevendo `bg-zinc-950`/`text-zinc-50` do `<body>` (que são utilities do Tailwind, geradas dentro de `@layer utilities`) — em CSS Cascade Layers, **qualquer regra não-layered vence qualquer regra layered**, independente de especificidade. O fundo real da página renderizava branco (`--background: #ffffff` do template padrão do Next), só os elementos com `bg-*` explícito (os cards) ficavam escuros. Foi assim que o usuário viu texto "sumindo" — não era cor de texto errada, era o fundo errado. | O usuário pediu pra pintar os textos de preto como solução — isso teria funcionado só até o fundo branco "de verdade" ser corrigido, e depois os deixaria invisíveis de novo (preto sobre zinc-950 quase preto). Corrigi a causa raiz (removi a regra `body {...}` e as variáveis `--background`/`--foreground` do template padrão, nunca usadas de propósito) em vez de aplicar o band-aid pedido — efeito colateral bom: o `font-family: Arial` que a mesma regra impunha também sumiu, e a fonte Geist (configurada desde a Fase 0 mas nunca efetivamente aplicada) passou a funcionar. |
| `lucide-react` instalado em vez de desenhar ~15 ícones à mão em SVG | O projeto evita bibliotecas de componentes (shadcn/ui) por escopo, mas ícones são uma categoria à parte — bem mais barato que autoria manual de SVG pra essa quantidade, e é o par natural de Tailwind pra esse caso. |
| App renomeado pra "PROSPECTA Finance"; logo do usuário redimensionada via `sharp` (já presente no `node_modules`) em vez de subir o PNG original de 2.5MB pro repo | Pedido explícito do usuário, com arquivo de logo anexado. 2.5MB carregado em toda página seria um problema real de performance — gerado `app/icon.png` (favicon, convenção do App Router), `public/icon-192.png`/`icon-512.png` (PWA) e `public/logo-sidebar.png` (menu lateral/login) via script Node descartável. Substituiu os ícones dinâmicos placeholder "R$" (`ImageResponse`), que foram removidos. |
| `<Image priority>` nas 3 instâncias do logo (login, recuperar senha, sidebar) | Sem `priority`, o Next posterga o carregamento de imagens fora da viewport inicial (lazy loading padrão) — como essas três aparecem sempre acima da dobra, `priority` evita o atraso/flash perceptível. Descoberto testando no browser: sem isso, `naturalWidth` ficava `0` mesmo com a URL respondendo 200. |
| Bug real encontrado e corrigido: `export const viewport` em `app/layout.tsx` só setava `themeColor`, sem `width`/`initialScale` — o navegador mobile assumia uma viewport larga (~980px) e renderizava a página com zoom, exigindo ajuste manual do usuário (relatado como "abre com zoom leve, preciso reduzir na mão"). Corrigido adicionando `width: "device-width", initialScale: 1`. | Diagnóstico direto a partir do sintoma relatado — comportamento clássico de meta viewport ausente/incompleta em mobile. Confirmado depois via `document.querySelector('meta[name="viewport"]')` no preview. |
| Banner de instalar o PWA (`InstallPrompt`) sem nenhum cooldown persistido após fechar | Primeira versão guardava 14 dias em `localStorage` antes de mostrar de novo. O usuário apontou o problema certo: se alguém fecha por engano (ou muda de ideia), ficaria bloqueado por duas semanas sem um caminho de volta. Trocado por comportamento simples: fechar só esconde na visita atual: reaparece normalmente na próxima vez que `/login` carregar (se `beforeinstallprompt` disparar de novo ou, no iOS, se ainda não estiver em modo standalone). |

---

## 22. Problemas conhecidos

1. **RLS não é efetivamente exercida pelo Prisma** (ver seção 2) — a conexão usa uma role
   que contorna RLS por ser owner das tabelas. A isolação real hoje depende 100% da
   aplicação sempre filtrar por `workspace_id` da sessão (o que ela faz, mas é uma
   camada só, não duas como o design pretendia).
2. **Nenhum outro usuário testado ainda** além de Felipe (admin). O convite de membro
   (seção 11, §19.1) agora tem UI e lógica completas, mas **nunca foi testado
   ponta-a-ponta com uma segunda conta real** — só verificado via `tsc`/lint/testes
   automatizados e revisão de código; não foi possível testar no browser porque isso
   exigiria digitar a senha de login, ação que o assistente não pode realizar. Testar com
   a esposa antes de confiar no fluxo em uso real. Além disso, **não existe seletor de
   workspace** — ver limitação detalhada na seção 12.
3. **Servidor de dev do Next precisa de restart completo** (não só Fast Refresh) toda vez
   que o schema do Prisma muda — o singleton do Prisma Client fica em cache no
   `globalThis` entre reloads e não pega o client regenerado. Aconteceu repetidas vezes
   durante o desenvolvimento; sempre resolver com `preview_stop` + `preview_start` (ou
   matar e subir `npm run dev` de novo), nunca só recarregar a página.
4. **`app/auth/confirm/route.ts`** existe mas não está no caminho real usado hoje (ver
   seção 8) — o e-mail de confirmação usa o link padrão do Supabase, não o formato
   `token_hash`. Não é bug ativo, mas é código morto até o template de e-mail ser
   customizado (precisa de SMTP próprio configurado no Supabase).
5. **`requireAdminProfile()`** em `lib/auth/session.ts` — **agora tem uso**: gate de
   `/admin/usuarios` (seção 11, §19.1).
6. **Toda a rodada de Compromissos/reverter importação/transferência/convite/edição
   in-line (seção 11) foi verificada só por `tsc --noEmit`, `eslint` e os 113 testes
   automatizados**, não por navegação real logada — o login exige senha, que o assistente
   não tem permissão de digitar. As rotas protegidas foram confirmadas via middleware
   (redirecionam corretamente, sem erro 500) e os tipos do Prisma validam os nomes de
   chave composta (`nature_slug`, `workspaceId_profileId`) e a forma dos dados, mas **um
   teste manual logado como Felipe é recomendado antes de considerar esta rodada
   totalmente confiável**, em especial a edição in-line de valor com inversão de sinal
   (seção 21) e o painel `/admin/usuarios` (só verificado por build + tipos, nunca
   navegado). **Atualização:** o convite de membro (link + WhatsApp) já foi testado
   manualmente por Felipe em produção com sucesso; falta só alguém aceitar um convite de
   fato pra fechar o ciclo completo (bloqueado agora pelo problema #9, e-mail de
   confirmação do Supabase não chegando pro convidado).
7. **Desenvolvimento e produção usam o mesmo banco Supabase** (não há banco separado pra
   produção ainda) — rodar `npm run dev` local e testar coisas continua escrevendo nos
   mesmos dados que o site em produção usa. Tomar cuidado extra com testes/seeds locais
   depois que uso real começar; considerar um projeto Supabase separado pra produção se
   isso virar um problema.
8. **Um arquivo `recovery-codes.txt` apareceu na raiz do projeto em 2026-07-30** (parecem
   códigos de recuperação 2FA de GitHub/Vercel) — **nunca foi commitado** (excluído
   manualmente do `git add` de propósito) e o usuário foi avisado pra mover pra um lugar
   seguro fora do repositório. Se esse arquivo ainda existir numa sessão futura, não
   commitar em hipótese nenhuma e lembrar o usuário de novo.
9. **E-mail de confirmação de cadastro do Supabase não está chegando — causa raiz
   diagnosticada, correção adiada de propósito pelo usuário.** Confirmado na prática em
   2026-07-30 com dois provedores diferentes:
   - E-mail padrão do Supabase (sem SMTP custom): não chegou (limite do plano gratuito).
   - SMTP Gmail (`smtp.gmail.com`, senha de app de 16 caracteres, configurado
     corretamente): não chegou. O próprio Supabase mostra um aviso na tela de SMTP
     Settings dizendo que esse provedor "é feito pra envio pessoal, não transacional".
   - SMTP Brevo (`smtp-relay.brevo.com`, remetente `prospectafinancas@gmail.com`
     verificado no Brevo): **também não chegou**. Causa raiz real, visível no painel do
     Brevo (Remetentes → aviso de conformidade): o remetente é um endereço `@gmail.com`,
     e **nenhum provedor terceiro consegue autenticar DKIM/DMARC pra um domínio que não
     controla** (só o Google controla o DNS de `gmail.com`). Desde 2024, Google/Yahoo/
     Microsoft bloqueiam ou jogam pra spam e-mails "em nome de" um endereço @gmail.com
     enviados via relay terceiro (proteção anti-spoofing). **O problema nunca foi o
     provedor SMTP — é o remetente ser um endereço de freemail, não um domínio próprio.**
   - **Correção real:** comprar um domínio próprio (~R$40-60/ano) e configurar DKIM/SPF/
     DMARC nele via Brevo (guia completo já dado ao usuário nesta conversa). **O usuário
     decidiu adiar essa compra de propósito** ("deixe esse passo para depois... posterior
     tratamos esse problema") — não é uma tarefa esquecida, é uma decisão explícita.
   - **Contorno enquanto isso:** confirmar e-mail manualmente no painel do Supabase
     (Authentication → Users → usuário → confirmar e-mail) toda vez que alguém se
     cadastrar. Funciona bem pra uso familiar/baixo volume, não escala.
   - Isso bloqueia testar o fluxo de convite ponta-a-ponta (item 6) até ser contornado
     manualmente ou até o domínio ser comprado.
   - **⚠️ Nota de segurança:** durante essa investigação, uma chave SMTP do Brevo
     (`xsmtpsib-...8Tafio`) foi colada em texto puro no chat pelo usuário — foi orientado a
     revogá-la e gerar uma nova no painel do Brevo (Settings → SMTP & API). Confirmar numa
     sessão futura se isso foi feito; se a chave antiga ainda aparecer ativa lá, lembrar o
     usuário de novo.

---

## 23. Débitos técnicos

- Sem testes de integração/e2e (só unitários em `lib/`). Nenhuma página/Server Action/rota
  de API tem cobertura de teste automatizado.
- Sem CI configurado (GitHub Actions, etc.) — testes rodam só manualmente.
- Sem deploy feito ainda — Vercel mencionado no stack mas projeto nunca foi publicado.
- `npm audit` reporta ~20 vulnerabilidades, quase todas em dependências de build/dev
  (eslint/postcss/minimatch transitivos via `exceljs`→`archiver`) — não são superfície de
  ataque em runtime, mas nunca foram formalmente triadas/aceitas por escrito.
- Sem rate limiting em nenhuma rota de API.
- Sem paginação real na tela de Lançamentos (limita a 200 registros mais recentes; a API
  `/api/entries` GET tem paginação, mas a página não usa).
- `Person` (responsável) não tem campo `isActive`/arquivamento — só `delete`, que falha se
  houver lançamentos vinculados (mensagem amigável já existe, mas não há alternativa de
  arquivar como Wallet/Subcategory têm).
- ~~Ícones do PWA gerados dinamicamente com texto "R$"~~ **Resolvido 2026-07-31** — o app
  ganhou marca própria, "PROSPECTA Finance". Ver seção 21 (decisões) e 24 (concluídas).

---

## 24. Funcionalidades concluídas

- ✅ **Fase 0 (Fundação):** login, cadastro, RLS, papéis, taxonomia completa via seed.
- ✅ **Conversa 2:** todas as regras de `lib/finance` (§8, §10, §11), 59 testes iniciais.
- ✅ **Conversa 3:** modelo `Entry`, CRUD via API, importador de CSV completo (validado
  com os ~1100 lançamentos reais do usuário), tela de Lançamentos.
- ✅ **Conversa 4:** Painel completo (§11) com gráfico, lançamento rápido (§12) com
  defaults automáticos e sugestão de categoria.
- ✅ **Conversa 5:** permissões refinadas (§20), exportação CSV/XLSX com auditoria (§18.2,
  round-trip validado), responsividade mobile + PWA instalável (§21).
- ✅ Cadastros: Carteiras, Responsáveis (qualquer membro), Categorias, Subcategorias, Tipos
  (admin-only, visível-porém-desabilitado pra outros), Membros (convite).
- ✅ **Conversa 6 (pontas soltas da Fase 1, sem número oficial no guia):** Compromissos,
  reverter importação (UI), transferência entre carteiras (UI), convidar membro pra
  workspace existente, edição in-line + ações em lote em Lançamentos (desktop). Ver
  seção 11 e "Problemas conhecidos" #6 (verificado só por tipos/lint/testes, não por
  navegação logada real).
- ✅ **Deploy em produção na Vercel** (`prospecta-finance.vercel.app`) — primeiro deploy
  real do projeto. Corrigido um bug de build (Suspense boundary faltando em
  `useSearchParams()` na página de login) que só aparecia em `next build`, não em `next dev`.
- ✅ **Convite por WhatsApp:** campo telefone opcional no convite de membro + botão "Enviar
  por WhatsApp" (link `wa.me` com mensagem pronta, sem API paga).
- ✅ **Excluir convite pendente**, **"Esqueci minha senha"** (fluxo completo com
  `/redefinir-senha`), **Nome completo no cadastro**, e **`/admin/usuarios`** (visão de
  plataforma pra `isPlatformAdmin`, todo usuário de todo workspace). Ver seção 11.
- ✅ **Menu lateral (`Sidebar`)** — redesenho do layout desktop/tablet, inspirado
  visualmente no sistema "Meu Vista" (print fornecido pelo usuário). Substitui a nav
  horizontal do header por um menu fixo à esquerda, com grupos expansíveis pra
  Lançamentos e Cadastros.
- ✅ **Rebranding pra "PROSPECTA Finance"** — nome trocado em toda parte visível (título da
  aba, login, sidebar, manifest do PWA), logo real do usuário substituindo os ícones
  placeholder "R$" (versão final com transparência real, depois de uma 1ª tentativa
  rejeitada — ver seção 21), débito técnico da seção 23 resolvido.
- ✅ **`MobileNav` + cor `#131A47`** — navegação mobile redesenhada pra usar a mesma cor,
  ícones e destaque de página ativa do `Sidebar` desktop (pedido do usuário depois de achar
  os dois "diferentes demais" no primeiro corte). Cor do menu (desktop e mobile) fixada em
  `#131A47` a pedido do usuário.
- ✅ **Bug real corrigido: fundo da página renderizava branco em vez de escuro** —
  `app/globals.css` tinha uma regra `body {...}` fora de `@layer`, que em CSS Cascade
  Layers vence qualquer utility do Tailwind independente de especificidade. Removida;
  efeito colateral bom: a fonte Geist (configurada desde a Fase 0, nunca efetivamente
  aplicada) passou a funcionar. Ver seção 21.
- ✅ **Painel redesenhado** — KPI cards, Top 5 receitas/despesas, gráfico mensal e
  cobertura de fatura usam `#131A47`. "Distribuição por categoria" virou um grid de anéis
  de progresso com ícone (`CategoryRings`). "Reserva de emergência" virou um velocímetro
  SVG com as mesmas faixas vermelho/âmbar/verde de `lib/finance/reserve.ts` (`ReserveGauge`).
- ✅ **Login/PWA — 3 correções de uso real:** mostrar/ocultar senha (`PasswordInput`),
  zoom indevido no mobile corrigido (viewport meta faltando `width`/`initialScale`), e
  banner de instalar o app (`InstallPrompt`, sem cooldown persistido — ver seção 21).
- ✅ **Favicon corrigido** — `app/favicon.ico` (o triângulo padrão do Next/Vercel, esquecido
  desde a Fase 0) removido; só `app/icon.png` (a logo real) fica.
- ✅ **Painel: visão Mensal/Anual/Geral** — botões de período além da navegação de mês,
  afetando KPIs/Top 5/distribuição por categoria (ver seção 11).

## 25. Funcionalidades em andamento

Nenhuma no momento. Tudo da seção 24 foi verificado (typecheck, lint, 113 testes, build de
produção local) e commitado/pushado (ver seção 26). Não há trabalho pendente no working tree
(exceto o `recovery-codes.txt` — ver "Problemas conhecidos" #8 — que nunca deve ser
commitado).

## 26. Estado do Git

```
2e9fa19 Adiciona visao Mensal/Anual/Geral no Painel   <- HEAD / origin/master
41acf58 Atualiza PROJECT_STATE.md: favicon.ico padrao removido
61d039c Remove favicon.ico padrao do Next.js (era o triangulo da Vercel)
95ee7ee Atualiza PROJECT_STATE.md: senha visivel, zoom mobile, banner de instalar sem cooldown
b0b476d Mostrar/ocultar senha, corrige zoom no mobile, banner de instalar o app
ef86a4b Atualiza PROJECT_STATE.md: bug do fundo branco corrigido, Painel redesenhado
8da4ccd Redesenha Painel: cards #131A47, rosca de categorias, velocimetro de reserva
f2341ac Atualiza PROJECT_STATE.md: cor do menu trocada de novo para #131A47
401a47a Muda cor de fundo do menu (sidebar/mobile) para #131A47
01c7e2c Muda cor de fundo do menu (sidebar/mobile) para #090D24
50c36e2 Corrige logo com transparencia real e unifica visual mobile/desktop
4b71504 Documenta rebranding PROSPECTA Finance e remove referencia morta no proxy.ts
1b3e8ae Renomeia app para PROSPECTA Finance e adiciona a logomarca real
089e466 Atualiza PROJECT_STATE.md: menu lateral, Fase 2 pausada a pedido do usuario
56fbf3b Substitui nav horizontal por menu lateral (desktop), estilo inspirado no Meu Vista
acc8802 Documenta investigacao do SMTP: causa raiz DKIM/DMARC, compra de dominio adiada
917d42e Atualiza PROJECT_STATE.md: excluir convite, esqueci senha, nome no cadastro, admin/usuarios
1a61db6 Adiciona nome no cadastro e painel admin de todos os usuarios
96147ea Adiciona excluir convite pendente e fluxo de "esqueci minha senha"
804bccb Atualiza PROJECT_STATE.md: deploy em producao, convite por WhatsApp, avisos de seguranca
92d8035 Adiciona envio de convite por WhatsApp (link wa.me com mensagem pronta)
5db6f57 Corrige prontidao pro deploy: Suspense boundary no login, config de preview de producao, lint ignora sw.js gerado
a389222 Fase 1: fecha pontas soltas (Compromissos, reverter importacao, transferencia, convite de membro, edicao in-line)
640d4f6 Fase 1 / Conversa 5: permissoes, exportacao e responsividade/PWA
175677b Fase 1 / Conversa 4: lancamento rapido e painel
72756da Fase 1 / Conversa 3: lancamentos, importador de CSV e Cadastros
96ad5e3 Fase 1 / Conversa 2: regras financeiras puras em lib/finance, com testes
5189b78 Fase 0 (Fundacao): Next.js + Prisma + Supabase Auth/RLS + seed da taxonomia
```

**Remote configurado:** `origin` → `https://github.com/fhildebrando-lfsh/PROSPECTA-Finance.git`,
branch `master` — este é o repositório real conectado à Vercel (push em `master` redeploya
automaticamente). Working tree limpo no momento desta atualização (nada pendente de commit,
exceto o `recovery-codes.txt` intencionalmente nunca adicionado). As migrations
`20260730172238_workspace_invites` e `20260730194550_workspace_invite_phone`, e os SQLs
`006_workspace_invites_rls.sql`, já estão aplicados no banco Supabase (o mesmo usado em dev
e produção — ver "Problemas conhecidos" #7) e commitados junto com o código. Numa nova
sessão, rode `git status` e `git log --oneline -5` primeiro pra confirmar o estado real —
nunca confiar cegamente num hash hardcoded aqui. **Nunca commitar ou dar push sem o usuário
pedir explicitamente**, mesmo que pareça óbvio (ele tem pedido isso todas as vezes até
agora, inclusive o push real pro GitHub).

## 27. Próximos passos recomendados

As 5 pontas soltas da Fase 1 (seção 24) e o primeiro deploy em produção estão concluídos.
Seguindo `GUIA-DE-INICIO.md`, o guia recomenda **30 dias de uso real antes de qualquer
funcionalidade nova de Fase 2**:

1. Configurar Supabase Authentication → URL Configuration com a URL da Vercel (Site
   URL + Redirect URLs) — **já feito** pelo usuário em 2026-07-30.
2. **E-mail de confirmação continua quebrado, correção adiada de propósito pelo usuário**
   (ver "Problemas conhecidos" #9) — a causa raiz exige domínio próprio (DKIM/DMARC não dá
   pra autenticar num endereço @gmail.com), e o usuário decidiu comprar o domínio depois,
   não agora. Contorno enquanto isso: confirmar e-mail manualmente no painel do Supabase
   (Authentication → Users) quando alguém se cadastrar.
3. Uso real por Felipe e a esposa — o fluxo de convite (link + WhatsApp) já foi testado
   manualmente com sucesso, mas **ninguém aceitou um convite de fato ainda** porque o
   e-mail de confirmação do Supabase não chega (item 2 acima) — usar o contorno manual pra
   destravar isso quando quiser fechar o ciclo.
4. Mover `recovery-codes.txt` pra um lugar seguro fora da pasta do projeto (ver
   "Problemas conhecidos" #8).
5. Backup mensal em CSV guardado fora do sistema (prática recomendada no guia).

**Estado da Fase 2:** o usuário perguntou sobre avançar pra Fase 2 (relatórios — analítico
mensal, parceladas, balanço anual, orçamento, fatura de cartão, OFX) em 2026-07-31; foi
avisado que a especificação recomenda 30 dias de uso real antes, e **decidiu pausar de
propósito**: vai usar o sistema, reportar bugs pontuais conforme aparecerem (ex.: o menu
lateral desta rodada nasceu de um desses pedidos), e só pedir pra avançar pra Fase 2 quando
estiver satisfeito com o estado atual. **Não iniciar Fase 2 nem sugerir isso proativamente
numa sessão futura** — esperar o usuário pedir explicitamente. Enquanto isso, tratar cada
pedido como um ajuste pontual (bug fix, UI, pequena feature), não como início de fase nova.

## 28. Checklist atualizado do projeto

- [x] Fase 0 — Fundação (login, RLS, papéis, taxonomia)
- [x] Conversa 2 — Regras financeiras (`lib/finance`, testadas)
- [x] Conversa 3 — Lançamentos, parcelamento/recorrência, importador de CSV
- [x] Conversa 4 — Painel completo, lançamento rápido
- [x] Conversa 5 — Permissões, exportação, responsividade/PWA
- [x] Commit do trabalho da Conversa 5 (`640d4f6`)
- [x] Tela de Compromissos
- [x] Reverter importação (UI)
- [x] Edição in-line / ações em lote em Lançamentos (desktop)
- [x] UI de transferência entre carteiras
- [x] Convidar membro pra workspace existente (não testado ponta-a-ponta, ver seção 22)
- [x] Commit do trabalho da Conversa 6 (`a389222`)
- [x] Deploy em produção (Vercel) — `prospecta-finance.vercel.app`, repo
      `github.com/fhildebrando-lfsh/PROSPECTA-Finance`
- [x] Convite por WhatsApp (link `wa.me`) — commit `92d8035`
- [x] Configurar Supabase Auth URL Configuration com a URL da Vercel
- [x] Excluir convite pendente, "Esqueci minha senha", Nome no cadastro, `/admin/usuarios`
      — commits `96147ea` e `1a61db6`
- [x] `recovery-codes.txt` movido pra fora da pasta do projeto (confirmado pelo usuário)
- [ ] Comprar domínio próprio + configurar DKIM/SPF/DMARC no Brevo — única correção real
      pro e-mail de confirmação (ver "Problemas conhecidos" #9). **Adiado de propósito**
      pelo usuário, não esquecido — contorno manual em uso enquanto isso.
- [ ] Confirmar se a chave SMTP do Brevo exposta no chat (`xsmtpsib-...8Tafio`) foi
      revogada e substituída (ver "Problemas conhecidos" #9)
- [x] Menu lateral (`Sidebar`) desktop/tablet, estilo Meu Vista — commit `56fbf3b`
- [x] Rebranding "PROSPECTA Finance" + logo real (ícones PWA, favicon, sidebar, login) —
      commit `1b3e8ae`; logo corrigida (transparência real) + navegação mobile unificada
      com o Sidebar (`MobileNav`) + cor `#131A47` (após um ajuste intermediário em `#090D24`)
      — commits `50c36e2`/`01c7e2c`/`401a47a`
- [x] Bug do fundo branco corrigido (CSS cascade layers) + Painel redesenhado (cards
      `#131A47`, `CategoryRings`, `ReserveGauge`) — commit `8da4ccd`
- [x] Mostrar/ocultar senha, zoom mobile corrigido (viewport meta), banner de instalar
      o app sem cooldown — commit `b0b476d`
- [x] Favicon.ico padrão do Next removido — commit `61d039c`
- [x] Painel: visão Mensal/Anual/Geral — commit `2e9fa19`
- [ ] Teste manual logado ponta-a-ponta (login, aceitar um convite de verdade, edição
      in-line com inversão de sinal, `/admin/usuarios`, menu lateral novo, Painel
      redesenhado) — login exige senha, fora do alcance do assistente
- [ ] 30 dias de uso real / correções pontuais reportadas pelo usuário (**Fase 2 pausada
      de propósito** — ver seção 27, não iniciar sem pedido explícito)
- [ ] Banco Supabase separado pra produção (hoje dev e prod compartilham o mesmo)
- [ ] Fase 2 (relatórios: analítico, parceladas, balanço anual, orçamento, fluxo projetado, OFX)
- [ ] Fase 3 (patrimônio, dívidas, metas, Open Finance)
- [ ] Fase 4 (consultoria multi-workspace)
