# PROSPECTA Finance — Resumo do sistema (para planejar redesenho de usuários/permissões/planos)

## O que é

Sistema web de gestão financeira pessoal e familiar, substituindo uma planilha Google
Sheets em uso contínuo desde 2016 (~5.900 lançamentos reais). O modelo de dados foi
extraído por engenharia reversa dessa planilha — as regras de negócio são comportamento
validado na prática, não hipótese de design.

- **Dono/usuário principal hoje:** Felipe Hildebrando (administrador único da plataforma).
- **Uso atual:** pessoal/familiar (Felipe + esposa).
- **Visão de negócio futura (já prevista na especificação original, ainda não construída):**
  oferecer o sistema também como ferramenta de **consultoria financeira para terceiros** —
  um consultor (o próprio Felipe ou outros) atendendo múltiplos **clientes**, cada um com
  espaço de dados isolado. Isso é o que o usuário quer agora desenhar/redesenhar: a
  arquitetura de usuários, permissões e planos pra viabilizar esse modelo comercial.

## Estado de implantação (produção real, não protótipo)

- **Deploy:** Vercel, projeto `prospecta-finance`, URL `https://prospecta-finance.vercel.app`.
- **Repositório:** GitHub, `github.com/fhildebrando-lfsh/PROSPECTA-Finance`, branch `master`
  (push nessa branch redeploya automaticamente na Vercel).
- **Banco de dados:** PostgreSQL gerenciado pelo **Supabase** (região `sa-east-1`), projeto
  `zfugldawxhvzclooisqj`. **Mesmo banco é usado em desenvolvimento e produção hoje** (não há
  ambiente separado ainda).
- **Autenticação:** Supabase Auth (`@supabase/ssr`), sessão via cookies HTTP-only.
- **E-mail transacional:** não funciona hoje (confirmação de cadastro, recuperação de
  senha). Causa raiz: o remetente usado é um endereço `@gmail.com`, que nenhum provedor
  terceiro (Brevo, etc.) consegue autenticar via DKIM/DMARC — bloqueado por
  Google/Yahoo/Microsoft como anti-spoofing. Correção real exige domínio próprio; comprado
  ainda não. Contorno manual: confirmar e-mail direto no painel do Supabase.
- **Sem integrações de pagamento, Open Finance ou push ainda** — tudo isso é fase futura.

## Stack técnico

Next.js 16 (App Router), TypeScript, Tailwind CSS v4, Prisma 7 (driver adapter
`@prisma/adapter-pg`, sem o engine Rust clássico), Zod, Vitest (113 testes unitários, só em
`lib/`). PWA instalável via Serwist. Sem biblioteca de componentes (shadcn/ui não
instalado) — tudo HTML+Tailwind à mão. Sem gerenciador de estado global (Redux/Zustand/
Context) — padrão é Server Component busca dado + Server Action grava.

## Modelo de identidade/acesso ATUAL (o que existe hoje, ponto de partida do redesenho)

```
Profile (espelha auth.users do Supabase)
  ├─ isPlatformAdmin: boolean   ← só true pra 1 pessoa hoje, setado manualmente via SQL
  │                                (não existe UI pra promover outro usuário a admin)
  └─ memberships: Membership[]

Workspace (criado automaticamente no signup, via trigger — 1 por conta)
  └─ memberships: Membership[]

Membership (liga Profile ↔ Workspace)
  └─ role: TITULAR | MEMBRO | LEITURA   (enum fixo, só 3 valores, por workspace)

WorkspaceInvite (convite pra um workspace JÁ EXISTENTE)
  └─ email, role, token opaco (UUID), phone? (pro link wa.me), acceptedAt?
```

**Regras de autorização hoje:**
- `assertCanWrite(role, isPlatformAdmin)` — LEITURA não escreve; MEMBRO/TITULAR/admin sim.
- `assertIsAdmin(isPlatformAdmin)` — só usado pra Categoria/Tipo (edição) e uma parte de
  Subcategoria (edição/arquivamento) — recursos considerados "estruturais" (comparáveis
  entre workspaces/clientes no futuro).
- **Tudo deriva da sessão no servidor** (`lib/auth/session.ts`), nunca de payload do
  cliente. Nenhuma rota confia em `workspace_id` vindo do client.
- **RLS (Row Level Security) do Postgres existe mas não é efetivamente exercida** — a
  connection string do Prisma usa uma role que é *owner* das tabelas, e owners contornam
  RLS automaticamente. A isolação multi-tenant real hoje é 100% a aplicação filtrar por
  `workspace_id` da sessão em toda query — funciona, mas é uma única camada, não duas como
  o design original pretendia.

**Limitações conhecidas, diretamente relevantes pro redesenho:**
1. **Não existe seletor de workspace.** Todo `Profile` tem `memberships[]`, mas o app
   sempre usa `memberships[0]` (a primeira). Alguém que aceita um convite pra outro
   workspace, mas já tinha conta própria, fica com 2 memberships e o app continua
   mostrando só a primeira — sem jeito de trocar.
2. **`isPlatformAdmin` é um booleano global único**, não um sistema de papéis. Promover
   alguém a admin é uma UPDATE manual no banco. Não existe hoje o conceito de "consultor"
   como papel distinto de "admin da plataforma" — quem é admin vê TUDO (painel
   `/admin/usuarios` lista todo usuário do sistema, todos os workspaces).
3. **Nenhum conceito de plano/assinatura/cobrança existe no schema ou no código.** Zero
   tabelas, zero integração de pagamento. A especificação original já previa isso como
   "Fase 4" mas nada foi modelado.
4. **Convite de workspace é só pra workspace já existente** — não existe fluxo de "admin/
   consultor cria um workspace novo para um cliente".
5. **Todo signup cria automaticamente 1 workspace pessoal com papel TITULAR.** Não há hoje
   um fluxo alternativo (ex.: cliente é convidado sem nunca ter criado conta própria antes,
   ou consultor cria o workspace do cliente diretamente).
6. Nenhum teste ainda com uma segunda conta real de usuário (só o admin foi testado em
   produção).

## Visão original da especificação para "Fase 4 — Consultoria" (nunca implementada, mas documenta a intenção de produto)

A especificação de domínio (`ESPECIFICACAO-SISTEMA-FINANCEIRO.md`) já antecipava este
redesenho como fase futura, com estes elementos (nenhum construído ainda):

- **Papéis de pessoa previstos:** Titular (dono da conta pessoal/familiar) · Cônjuge/membro
  da família · Terceiros rastreados (não são usuários, só "responsável" em lançamentos) ·
  **Cliente de consultoria** (pessoa externa com espaço de dados isolado) · **Consultor**
  (titular atuando como profissional, com visão sobre múltiplos clientes).
- **Multi-workspace real** — hoje é 1 workspace por conta; a visão é um consultor
  enxergando/gerenciando N workspaces de clientes.
- **Toda visita de um consultor ao workspace de um cliente deve ser auditada** (quem, quando,
  qual workspace, quais telas) — na Fase 4 isso é exigência, não boa prática opcional,
  porque o cliente tem direito de saber quando seus dados foram acessados.
- **Planos e cobrança** — gateway de pagamento (Stripe ou Asaas cotados originalmente) pra
  cobrar assinatura dos clientes. Nada modelado ainda (sem tabela de plano, sem
  billing_customer_id, sem status de assinatura).
- **Permissão por lista/recurso já tem uma matriz pensada na especificação original**
  (quem edita Categoria vs. Subcategoria vs. Tipo, etc.) — parcialmente implementada hoje
  (ver "regras de autorização" acima), mas pensada pro caso de 1 workspace só, não pro caso
  de um consultor com múltiplos clientes de planos diferentes.
- Fase 4 também depende de definições regulatórias (CVM, certificação) que a própria
  especificação marca como **fora do escopo de software** — não é problema de código.

## O que já foi construído (contexto de maturidade do produto)

- Fase 0 (fundação): login, cadastro, RLS, papéis básicos, taxonomia via seed.
- Motor de regras financeiras (`lib/finance/`) — puro, testado, sem I/O — implementa saldo,
  período (caixa/competência), parcelamento, recorrência materializada, transferência entre
  carteiras, reserva de emergência, fixa×variável, top 5/distribuição por categoria.
- CRUD completo de lançamentos (rápido + importação de CSV/exportação CSV/XLSX com
  auditoria), Painel com KPIs/gráficos, tela de Compromissos (vencidos/a vencer), edição
  in-line + ações em lote em Lançamentos (desktop).
- Cadastros: Carteiras, Responsáveis, Categorias, Subcategorias, Tipos, Membros — cada um
  com sua própria regra de quem pode criar/editar/arquivar/excluir (algumas admin-only,
  outras liberadas pra qualquer membro do workspace).
- Convite de membro pra workspace **existente** (link + botão WhatsApp), painel
  `/admin/usuarios` (visão de todos os usuários da plataforma, só pro admin único).
  PWA instalável, rebranding completo ("PROSPECTA Finance", logo própria), menu lateral
  desktop + navegação mobile.
- **Fase 2 (relatórios avançados) explicitamente pausada** a pedido do usuário — ele está
  fazendo uso real e reportando bugs/ajustes pontuais antes de pedir para avançar.
  **Fases 3/4 (patrimônio, dívidas, metas, Open Finance, consultoria multi-workspace) não
  foram iniciadas.**

## Por que isso importa pro prompt que você vai montar

O pedido concreto do usuário agora é: **redesenhar a arquitetura de usuários, permissões e
planos** — ou seja, transformar o modelo atual (1 pessoa admin global + workspaces
pessoais/familiares simples, sem cobrança) no modelo que a especificação original já
imaginava (consultor × múltiplos clientes, planos pagos, auditoria de acesso), decidindo
concretamente: como fica `Profile`/`Membership`/`isPlatformAdmin` daqui pra frente, se
"consultor" vira um papel de verdade (e como ele se relaciona com múltiplos workspaces),
como modelar plano/assinatura/cobrança, e como o convite/onboarding de um cliente novo deve
funcionar (hoje só existe convite pra workspace já existente).
