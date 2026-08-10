-- Débito técnico (PROJECT_STATE.md §22/§23): RLS existe desde a Fase 0 mas
-- nunca acompanhou o crescimento do schema — 14 tabelas criadas depois da
-- Fase 0 nunca ganharam nenhuma policy, e as policies de escrita mais
-- antigas nunca foram atualizadas para o papel ADVISOR (criado na
-- Arquitetura de Identidade/Planos, depois de 001_auth_and_rls.sql).
--
-- IMPORTANTE: este arquivo é só documental/defesa em profundidade por
-- enquanto. A conexão do Prisma usa a role *owner* das tabelas (ver
-- lib/db/prisma.ts), e owners sempre ignoram RLS no Postgres a menos que
-- FORCE ROW LEVEL SECURITY esteja setado (não está, em nenhuma tabela deste
-- projeto) — então nada aqui muda o comportamento do app hoje. Ativar RLS de
-- verdade (trocar a role de conexão) é uma decisão arquitetural separada,
-- ainda não tomada.
--
-- Como aplicar: mesmo processo dos arquivos anteriores (SQL Editor do
-- Supabase, ou `npx prisma db execute --file prisma/sql/008_rls_completeness.sql`
-- se o schema-engine não estiver travando nesta máquina).

-- ---------------------------------------------------------------------------
-- Parte A — corrige o gap do papel ADVISOR nas policies de escrita já
-- existentes. `lib/auth/session.ts::can()` libera escrita para qualquer
-- papel != LEITURA (inclui ADVISOR) desde que esse papel foi criado; as
-- policies de 001_auth_and_rls.sql e 003_entries_rls.sql nunca foram
-- atualizadas e continuam restritas a TITULAR/MEMBRO. `memberships` e
-- `workspace_invites` ficam de fora de propósito — administrar quem faz
-- parte do workspace e convidar gente nova continuam ações só de TITULAR/
-- admin, mesmo para um consultor com acesso de escrita aos dados.
-- ---------------------------------------------------------------------------

drop policy if exists "people_write" on public.people;
drop policy if exists "people_update" on public.people;
drop policy if exists "people_delete" on public.people;

create policy "people_write" on public.people
  for insert with check (public.workspace_role(workspace_id) in ('TITULAR', 'MEMBRO', 'ADVISOR') or public.is_platform_admin());
create policy "people_update" on public.people
  for update using (public.workspace_role(workspace_id) in ('TITULAR', 'MEMBRO', 'ADVISOR') or public.is_platform_admin());
create policy "people_delete" on public.people
  for delete using (public.workspace_role(workspace_id) in ('TITULAR', 'MEMBRO', 'ADVISOR') or public.is_platform_admin());

drop policy if exists "wallets_write" on public.wallets;
drop policy if exists "wallets_update" on public.wallets;
drop policy if exists "wallets_delete" on public.wallets;

create policy "wallets_write" on public.wallets
  for insert with check (public.workspace_role(workspace_id) in ('TITULAR', 'MEMBRO', 'ADVISOR') or public.is_platform_admin());
create policy "wallets_update" on public.wallets
  for update using (public.workspace_role(workspace_id) in ('TITULAR', 'MEMBRO', 'ADVISOR') or public.is_platform_admin());
create policy "wallets_delete" on public.wallets
  for delete using (public.workspace_role(workspace_id) in ('TITULAR', 'MEMBRO', 'ADVISOR') or public.is_platform_admin());

drop policy if exists "entry_groups_write" on public.entry_groups;
drop policy if exists "entry_groups_update" on public.entry_groups;
drop policy if exists "entry_groups_delete" on public.entry_groups;

create policy "entry_groups_write" on public.entry_groups
  for insert with check (public.workspace_role(workspace_id) in ('TITULAR', 'MEMBRO', 'ADVISOR') or public.is_platform_admin());
create policy "entry_groups_update" on public.entry_groups
  for update using (public.workspace_role(workspace_id) in ('TITULAR', 'MEMBRO', 'ADVISOR') or public.is_platform_admin());
create policy "entry_groups_delete" on public.entry_groups
  for delete using (public.workspace_role(workspace_id) in ('TITULAR', 'MEMBRO', 'ADVISOR') or public.is_platform_admin());

drop policy if exists "entries_write" on public.entries;
drop policy if exists "entries_update" on public.entries;
drop policy if exists "entries_delete" on public.entries;

create policy "entries_write" on public.entries
  for insert with check (public.workspace_role(workspace_id) in ('TITULAR', 'MEMBRO', 'ADVISOR') or public.is_platform_admin());
create policy "entries_update" on public.entries
  for update using (public.workspace_role(workspace_id) in ('TITULAR', 'MEMBRO', 'ADVISOR') or public.is_platform_admin());
create policy "entries_delete" on public.entries
  for delete using (public.workspace_role(workspace_id) in ('TITULAR', 'MEMBRO', 'ADVISOR') or public.is_platform_admin());

drop policy if exists "import_batches_write" on public.import_batches;
drop policy if exists "import_batches_update" on public.import_batches;
drop policy if exists "import_batches_delete" on public.import_batches;

create policy "import_batches_write" on public.import_batches
  for insert with check (public.workspace_role(workspace_id) in ('TITULAR', 'MEMBRO', 'ADVISOR') or public.is_platform_admin());
create policy "import_batches_update" on public.import_batches
  for update using (public.workspace_role(workspace_id) in ('TITULAR', 'MEMBRO', 'ADVISOR') or public.is_platform_admin());
create policy "import_batches_delete" on public.import_batches
  for delete using (public.workspace_role(workspace_id) in ('TITULAR', 'MEMBRO', 'ADVISOR') or public.is_platform_admin());

-- ---------------------------------------------------------------------------
-- Parte B — RLS para as tabelas criadas depois da Fase 0 que nunca
-- ganharam nenhuma policy.
-- ---------------------------------------------------------------------------

-- Tabelas por workspace, mesmo padrão de wallets/entries (CRUD para
-- TITULAR/MEMBRO/ADVISOR, leitura para qualquer membro, admin sempre passa).

alter table public.description_rules enable row level security;
create policy "description_rules_select" on public.description_rules
  for select using (public.is_workspace_member(workspace_id) or public.is_platform_admin());
create policy "description_rules_write" on public.description_rules
  for insert with check (public.workspace_role(workspace_id) in ('TITULAR', 'MEMBRO', 'ADVISOR') or public.is_platform_admin());
create policy "description_rules_update" on public.description_rules
  for update using (public.workspace_role(workspace_id) in ('TITULAR', 'MEMBRO', 'ADVISOR') or public.is_platform_admin());
create policy "description_rules_delete" on public.description_rules
  for delete using (public.workspace_role(workspace_id) in ('TITULAR', 'MEMBRO', 'ADVISOR') or public.is_platform_admin());

alter table public.budgets enable row level security;
create policy "budgets_select" on public.budgets
  for select using (public.is_workspace_member(workspace_id) or public.is_platform_admin());
create policy "budgets_write" on public.budgets
  for insert with check (public.workspace_role(workspace_id) in ('TITULAR', 'MEMBRO', 'ADVISOR') or public.is_platform_admin());
create policy "budgets_update" on public.budgets
  for update using (public.workspace_role(workspace_id) in ('TITULAR', 'MEMBRO', 'ADVISOR') or public.is_platform_admin());
create policy "budgets_delete" on public.budgets
  for delete using (public.workspace_role(workspace_id) in ('TITULAR', 'MEMBRO', 'ADVISOR') or public.is_platform_admin());

alter table public.assets enable row level security;
create policy "assets_select" on public.assets
  for select using (public.is_workspace_member(workspace_id) or public.is_platform_admin());
create policy "assets_write" on public.assets
  for insert with check (public.workspace_role(workspace_id) in ('TITULAR', 'MEMBRO', 'ADVISOR') or public.is_platform_admin());
create policy "assets_update" on public.assets
  for update using (public.workspace_role(workspace_id) in ('TITULAR', 'MEMBRO', 'ADVISOR') or public.is_platform_admin());
create policy "assets_delete" on public.assets
  for delete using (public.workspace_role(workspace_id) in ('TITULAR', 'MEMBRO', 'ADVISOR') or public.is_platform_admin());

alter table public.goals enable row level security;
create policy "goals_select" on public.goals
  for select using (public.is_workspace_member(workspace_id) or public.is_platform_admin());
create policy "goals_write" on public.goals
  for insert with check (public.workspace_role(workspace_id) in ('TITULAR', 'MEMBRO', 'ADVISOR') or public.is_platform_admin());
create policy "goals_update" on public.goals
  for update using (public.workspace_role(workspace_id) in ('TITULAR', 'MEMBRO', 'ADVISOR') or public.is_platform_admin());
create policy "goals_delete" on public.goals
  for delete using (public.workspace_role(workspace_id) in ('TITULAR', 'MEMBRO', 'ADVISOR') or public.is_platform_admin());

alter table public.investments enable row level security;
create policy "investments_select" on public.investments
  for select using (public.is_workspace_member(workspace_id) or public.is_platform_admin());
create policy "investments_write" on public.investments
  for insert with check (public.workspace_role(workspace_id) in ('TITULAR', 'MEMBRO', 'ADVISOR') or public.is_platform_admin());
create policy "investments_update" on public.investments
  for update using (public.workspace_role(workspace_id) in ('TITULAR', 'MEMBRO', 'ADVISOR') or public.is_platform_admin());
create policy "investments_delete" on public.investments
  for delete using (public.workspace_role(workspace_id) in ('TITULAR', 'MEMBRO', 'ADVISOR') or public.is_platform_admin());

alter table public.google_calendar_connections enable row level security;
create policy "google_calendar_connections_select" on public.google_calendar_connections
  for select using (public.is_workspace_member(workspace_id) or public.is_platform_admin());
create policy "google_calendar_connections_write" on public.google_calendar_connections
  for insert with check (public.workspace_role(workspace_id) in ('TITULAR', 'MEMBRO', 'ADVISOR') or public.is_platform_admin());
create policy "google_calendar_connections_update" on public.google_calendar_connections
  for update using (public.workspace_role(workspace_id) in ('TITULAR', 'MEMBRO', 'ADVISOR') or public.is_platform_admin());
create policy "google_calendar_connections_delete" on public.google_calendar_connections
  for delete using (public.workspace_role(workspace_id) in ('TITULAR', 'MEMBRO', 'ADVISOR') or public.is_platform_admin());

-- credit_cards: não tem workspace_id direto — é 1:1 com wallets via
-- wallet_id, então a policy herda o workspace da carteira dona do cartão.

alter table public.credit_cards enable row level security;
create policy "credit_cards_select" on public.credit_cards
  for select using (
    exists (
      select 1 from public.wallets w
      where w.id = wallet_id and (public.is_workspace_member(w.workspace_id) or public.is_platform_admin())
    )
  );
create policy "credit_cards_write" on public.credit_cards
  for insert with check (
    exists (
      select 1 from public.wallets w
      where w.id = wallet_id
        and (public.workspace_role(w.workspace_id) in ('TITULAR', 'MEMBRO', 'ADVISOR') or public.is_platform_admin())
    )
  );
create policy "credit_cards_update" on public.credit_cards
  for update using (
    exists (
      select 1 from public.wallets w
      where w.id = wallet_id
        and (public.workspace_role(w.workspace_id) in ('TITULAR', 'MEMBRO', 'ADVISOR') or public.is_platform_admin())
    )
  );
create policy "credit_cards_delete" on public.credit_cards
  for delete using (
    exists (
      select 1 from public.wallets w
      where w.id = wallet_id
        and (public.workspace_role(w.workspace_id) in ('TITULAR', 'MEMBRO', 'ADVISOR') or public.is_platform_admin())
    )
  );

-- notifications: leitura respeita a visibilidade — SHARED para qualquer
-- membro, ADVISOR_ONLY só para quem acessa como ADVISOR ou admin. Nenhuma
-- tela cria notificação ainda, então escrita fica admin-only por enquanto.

alter table public.notifications enable row level security;
create policy "notifications_select" on public.notifications
  for select using (
    public.is_platform_admin()
    or (visibility = 'SHARED' and public.is_workspace_member(workspace_id))
    or (visibility = 'ADVISOR_ONLY' and public.workspace_role(workspace_id) = 'ADVISOR')
  );
create policy "notifications_write_admin" on public.notifications
  for all using (public.is_platform_admin()) with check (public.is_platform_admin());

-- subscriptions/entitlements: qualquer membro do workspace pode ver o
-- próprio plano/entitlement; escrita fica admin-only — não é algo que
-- titular/membro edita direto pela aplicação hoje, é área comercial.

alter table public.subscriptions enable row level security;
create policy "subscriptions_select" on public.subscriptions
  for select using (public.is_workspace_member(workspace_id) or public.is_platform_admin());
create policy "subscriptions_write_admin" on public.subscriptions
  for all using (public.is_platform_admin()) with check (public.is_platform_admin());

alter table public.entitlements enable row level security;
create policy "entitlements_select" on public.entitlements
  for select using (public.is_workspace_member(workspace_id) or public.is_platform_admin());
create policy "entitlements_write_admin" on public.entitlements
  for all using (public.is_platform_admin()) with check (public.is_platform_admin());

-- access_logs: log de auditoria — só leitura (TITULAR do workspace vê quando
-- um consultor acessou os dados dele, admin vê tudo). Sem policy de
-- insert/update/delete de propósito: só a conexão de owner do servidor
-- grava (lib/audit/access-log.ts), nunca uma sessão de usuário comum.

alter table public.access_logs enable row level security;
create policy "access_logs_select" on public.access_logs
  for select using (public.workspace_role(workspace_id) = 'TITULAR' or public.is_platform_admin());

-- Tabelas de referência global (mesmo padrão de categories/wallet_kinds):
-- leitura para qualquer autenticado, escrita só admin.

alter table public.investment_classes enable row level security;
create policy "investment_classes_select_all" on public.investment_classes
  for select using (auth.role() = 'authenticated');
create policy "investment_classes_write_admin" on public.investment_classes
  for all using (public.is_platform_admin()) with check (public.is_platform_admin());

alter table public.plans enable row level security;
create policy "plans_select_all" on public.plans
  for select using (auth.role() = 'authenticated');
create policy "plans_write_admin" on public.plans
  for all using (public.is_platform_admin()) with check (public.is_platform_admin());

alter table public.features enable row level security;
create policy "features_select_all" on public.features
  for select using (auth.role() = 'authenticated');
create policy "features_write_admin" on public.features
  for all using (public.is_platform_admin()) with check (public.is_platform_admin());

alter table public.plan_features enable row level security;
create policy "plan_features_select_all" on public.plan_features
  for select using (auth.role() = 'authenticated');
create policy "plan_features_write_admin" on public.plan_features
  for all using (public.is_platform_admin()) with check (public.is_platform_admin());
