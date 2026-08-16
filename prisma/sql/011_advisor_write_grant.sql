-- Etapa 0 (2026-08-15) — ver ARQUITETURA-METODO-PROSPECTAR.md §3.2/5.7.
-- Consultor (ADVISOR) deixa de ter escrita automática nas policies de RLS —
-- só quando memberships.advisor_can_write = true. Mesmo aviso do arquivo
-- anterior (008): defesa em profundidade por enquanto, o Prisma conecta como
-- role owner e ignora RLS; o gate que realmente vale hoje é
-- lib/auth/session.ts::can(). Mantido em sincronia para o dia em que a role
-- de conexão mudar (ARQUITETURA-IDENTIDADE-PLANOS.md item 7).
--
-- Como aplicar: mesmo processo dos arquivos anteriores.

create or replace function public.workspace_advisor_can_write(ws_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select coalesce(
    (select advisor_can_write from public.memberships
     where workspace_id = ws_id and profile_id = auth.uid() and role = 'ADVISOR'),
    false
  );
$$;

-- Mesmas 6 tabelas + credit_cards (aninhada) tocadas por 008_rls_completeness.sql
-- Parte A — troca `... in ('TITULAR', 'MEMBRO', 'ADVISOR')` por uma condição
-- que separa TITULAR/MEMBRO (sempre passam) de ADVISOR (só com a concessão).

drop policy if exists "people_write" on public.people;
drop policy if exists "people_update" on public.people;
drop policy if exists "people_delete" on public.people;

create policy "people_write" on public.people
  for insert with check (
    public.workspace_role(workspace_id) in ('TITULAR', 'MEMBRO')
    or (public.workspace_role(workspace_id) = 'ADVISOR' and public.workspace_advisor_can_write(workspace_id))
    or public.is_platform_admin()
  );
create policy "people_update" on public.people
  for update using (
    public.workspace_role(workspace_id) in ('TITULAR', 'MEMBRO')
    or (public.workspace_role(workspace_id) = 'ADVISOR' and public.workspace_advisor_can_write(workspace_id))
    or public.is_platform_admin()
  );
create policy "people_delete" on public.people
  for delete using (
    public.workspace_role(workspace_id) in ('TITULAR', 'MEMBRO')
    or (public.workspace_role(workspace_id) = 'ADVISOR' and public.workspace_advisor_can_write(workspace_id))
    or public.is_platform_admin()
  );

drop policy if exists "wallets_write" on public.wallets;
drop policy if exists "wallets_update" on public.wallets;
drop policy if exists "wallets_delete" on public.wallets;

create policy "wallets_write" on public.wallets
  for insert with check (
    public.workspace_role(workspace_id) in ('TITULAR', 'MEMBRO')
    or (public.workspace_role(workspace_id) = 'ADVISOR' and public.workspace_advisor_can_write(workspace_id))
    or public.is_platform_admin()
  );
create policy "wallets_update" on public.wallets
  for update using (
    public.workspace_role(workspace_id) in ('TITULAR', 'MEMBRO')
    or (public.workspace_role(workspace_id) = 'ADVISOR' and public.workspace_advisor_can_write(workspace_id))
    or public.is_platform_admin()
  );
create policy "wallets_delete" on public.wallets
  for delete using (
    public.workspace_role(workspace_id) in ('TITULAR', 'MEMBRO')
    or (public.workspace_role(workspace_id) = 'ADVISOR' and public.workspace_advisor_can_write(workspace_id))
    or public.is_platform_admin()
  );

drop policy if exists "entry_groups_write" on public.entry_groups;
drop policy if exists "entry_groups_update" on public.entry_groups;
drop policy if exists "entry_groups_delete" on public.entry_groups;

create policy "entry_groups_write" on public.entry_groups
  for insert with check (
    public.workspace_role(workspace_id) in ('TITULAR', 'MEMBRO')
    or (public.workspace_role(workspace_id) = 'ADVISOR' and public.workspace_advisor_can_write(workspace_id))
    or public.is_platform_admin()
  );
create policy "entry_groups_update" on public.entry_groups
  for update using (
    public.workspace_role(workspace_id) in ('TITULAR', 'MEMBRO')
    or (public.workspace_role(workspace_id) = 'ADVISOR' and public.workspace_advisor_can_write(workspace_id))
    or public.is_platform_admin()
  );
create policy "entry_groups_delete" on public.entry_groups
  for delete using (
    public.workspace_role(workspace_id) in ('TITULAR', 'MEMBRO')
    or (public.workspace_role(workspace_id) = 'ADVISOR' and public.workspace_advisor_can_write(workspace_id))
    or public.is_platform_admin()
  );

drop policy if exists "entries_write" on public.entries;
drop policy if exists "entries_update" on public.entries;
drop policy if exists "entries_delete" on public.entries;

create policy "entries_write" on public.entries
  for insert with check (
    public.workspace_role(workspace_id) in ('TITULAR', 'MEMBRO')
    or (public.workspace_role(workspace_id) = 'ADVISOR' and public.workspace_advisor_can_write(workspace_id))
    or public.is_platform_admin()
  );
create policy "entries_update" on public.entries
  for update using (
    public.workspace_role(workspace_id) in ('TITULAR', 'MEMBRO')
    or (public.workspace_role(workspace_id) = 'ADVISOR' and public.workspace_advisor_can_write(workspace_id))
    or public.is_platform_admin()
  );
create policy "entries_delete" on public.entries
  for delete using (
    public.workspace_role(workspace_id) in ('TITULAR', 'MEMBRO')
    or (public.workspace_role(workspace_id) = 'ADVISOR' and public.workspace_advisor_can_write(workspace_id))
    or public.is_platform_admin()
  );

drop policy if exists "import_batches_write" on public.import_batches;
drop policy if exists "import_batches_update" on public.import_batches;
drop policy if exists "import_batches_delete" on public.import_batches;

create policy "import_batches_write" on public.import_batches
  for insert with check (
    public.workspace_role(workspace_id) in ('TITULAR', 'MEMBRO')
    or (public.workspace_role(workspace_id) = 'ADVISOR' and public.workspace_advisor_can_write(workspace_id))
    or public.is_platform_admin()
  );
create policy "import_batches_update" on public.import_batches
  for update using (
    public.workspace_role(workspace_id) in ('TITULAR', 'MEMBRO')
    or (public.workspace_role(workspace_id) = 'ADVISOR' and public.workspace_advisor_can_write(workspace_id))
    or public.is_platform_admin()
  );
create policy "import_batches_delete" on public.import_batches
  for delete using (
    public.workspace_role(workspace_id) in ('TITULAR', 'MEMBRO')
    or (public.workspace_role(workspace_id) = 'ADVISOR' and public.workspace_advisor_can_write(workspace_id))
    or public.is_platform_admin()
  );

drop policy if exists "description_rules_write" on public.description_rules;
drop policy if exists "description_rules_update" on public.description_rules;
drop policy if exists "description_rules_delete" on public.description_rules;

create policy "description_rules_write" on public.description_rules
  for insert with check (
    public.workspace_role(workspace_id) in ('TITULAR', 'MEMBRO')
    or (public.workspace_role(workspace_id) = 'ADVISOR' and public.workspace_advisor_can_write(workspace_id))
    or public.is_platform_admin()
  );
create policy "description_rules_update" on public.description_rules
  for update using (
    public.workspace_role(workspace_id) in ('TITULAR', 'MEMBRO')
    or (public.workspace_role(workspace_id) = 'ADVISOR' and public.workspace_advisor_can_write(workspace_id))
    or public.is_platform_admin()
  );
create policy "description_rules_delete" on public.description_rules
  for delete using (
    public.workspace_role(workspace_id) in ('TITULAR', 'MEMBRO')
    or (public.workspace_role(workspace_id) = 'ADVISOR' and public.workspace_advisor_can_write(workspace_id))
    or public.is_platform_admin()
  );

drop policy if exists "budgets_write" on public.budgets;
drop policy if exists "budgets_update" on public.budgets;
drop policy if exists "budgets_delete" on public.budgets;

create policy "budgets_write" on public.budgets
  for insert with check (
    public.workspace_role(workspace_id) in ('TITULAR', 'MEMBRO')
    or (public.workspace_role(workspace_id) = 'ADVISOR' and public.workspace_advisor_can_write(workspace_id))
    or public.is_platform_admin()
  );
create policy "budgets_update" on public.budgets
  for update using (
    public.workspace_role(workspace_id) in ('TITULAR', 'MEMBRO')
    or (public.workspace_role(workspace_id) = 'ADVISOR' and public.workspace_advisor_can_write(workspace_id))
    or public.is_platform_admin()
  );
create policy "budgets_delete" on public.budgets
  for delete using (
    public.workspace_role(workspace_id) in ('TITULAR', 'MEMBRO')
    or (public.workspace_role(workspace_id) = 'ADVISOR' and public.workspace_advisor_can_write(workspace_id))
    or public.is_platform_admin()
  );

drop policy if exists "assets_write" on public.assets;
drop policy if exists "assets_update" on public.assets;
drop policy if exists "assets_delete" on public.assets;

create policy "assets_write" on public.assets
  for insert with check (
    public.workspace_role(workspace_id) in ('TITULAR', 'MEMBRO')
    or (public.workspace_role(workspace_id) = 'ADVISOR' and public.workspace_advisor_can_write(workspace_id))
    or public.is_platform_admin()
  );
create policy "assets_update" on public.assets
  for update using (
    public.workspace_role(workspace_id) in ('TITULAR', 'MEMBRO')
    or (public.workspace_role(workspace_id) = 'ADVISOR' and public.workspace_advisor_can_write(workspace_id))
    or public.is_platform_admin()
  );
create policy "assets_delete" on public.assets
  for delete using (
    public.workspace_role(workspace_id) in ('TITULAR', 'MEMBRO')
    or (public.workspace_role(workspace_id) = 'ADVISOR' and public.workspace_advisor_can_write(workspace_id))
    or public.is_platform_admin()
  );

drop policy if exists "goals_write" on public.goals;
drop policy if exists "goals_update" on public.goals;
drop policy if exists "goals_delete" on public.goals;

create policy "goals_write" on public.goals
  for insert with check (
    public.workspace_role(workspace_id) in ('TITULAR', 'MEMBRO')
    or (public.workspace_role(workspace_id) = 'ADVISOR' and public.workspace_advisor_can_write(workspace_id))
    or public.is_platform_admin()
  );
create policy "goals_update" on public.goals
  for update using (
    public.workspace_role(workspace_id) in ('TITULAR', 'MEMBRO')
    or (public.workspace_role(workspace_id) = 'ADVISOR' and public.workspace_advisor_can_write(workspace_id))
    or public.is_platform_admin()
  );
create policy "goals_delete" on public.goals
  for delete using (
    public.workspace_role(workspace_id) in ('TITULAR', 'MEMBRO')
    or (public.workspace_role(workspace_id) = 'ADVISOR' and public.workspace_advisor_can_write(workspace_id))
    or public.is_platform_admin()
  );

drop policy if exists "investments_write" on public.investments;
drop policy if exists "investments_update" on public.investments;
drop policy if exists "investments_delete" on public.investments;

create policy "investments_write" on public.investments
  for insert with check (
    public.workspace_role(workspace_id) in ('TITULAR', 'MEMBRO')
    or (public.workspace_role(workspace_id) = 'ADVISOR' and public.workspace_advisor_can_write(workspace_id))
    or public.is_platform_admin()
  );
create policy "investments_update" on public.investments
  for update using (
    public.workspace_role(workspace_id) in ('TITULAR', 'MEMBRO')
    or (public.workspace_role(workspace_id) = 'ADVISOR' and public.workspace_advisor_can_write(workspace_id))
    or public.is_platform_admin()
  );
create policy "investments_delete" on public.investments
  for delete using (
    public.workspace_role(workspace_id) in ('TITULAR', 'MEMBRO')
    or (public.workspace_role(workspace_id) = 'ADVISOR' and public.workspace_advisor_can_write(workspace_id))
    or public.is_platform_admin()
  );

drop policy if exists "google_calendar_connections_write" on public.google_calendar_connections;
drop policy if exists "google_calendar_connections_update" on public.google_calendar_connections;
drop policy if exists "google_calendar_connections_delete" on public.google_calendar_connections;

create policy "google_calendar_connections_write" on public.google_calendar_connections
  for insert with check (
    public.workspace_role(workspace_id) in ('TITULAR', 'MEMBRO')
    or (public.workspace_role(workspace_id) = 'ADVISOR' and public.workspace_advisor_can_write(workspace_id))
    or public.is_platform_admin()
  );
create policy "google_calendar_connections_update" on public.google_calendar_connections
  for update using (
    public.workspace_role(workspace_id) in ('TITULAR', 'MEMBRO')
    or (public.workspace_role(workspace_id) = 'ADVISOR' and public.workspace_advisor_can_write(workspace_id))
    or public.is_platform_admin()
  );
create policy "google_calendar_connections_delete" on public.google_calendar_connections
  for delete using (
    public.workspace_role(workspace_id) in ('TITULAR', 'MEMBRO')
    or (public.workspace_role(workspace_id) = 'ADVISOR' and public.workspace_advisor_can_write(workspace_id))
    or public.is_platform_admin()
  );

-- credit_cards: mesma indireção via wallets já usada em 008.

drop policy if exists "credit_cards_write" on public.credit_cards;
drop policy if exists "credit_cards_update" on public.credit_cards;
drop policy if exists "credit_cards_delete" on public.credit_cards;

create policy "credit_cards_write" on public.credit_cards
  for insert with check (
    exists (
      select 1 from public.wallets w
      where w.id = wallet_id
        and (
          public.workspace_role(w.workspace_id) in ('TITULAR', 'MEMBRO')
          or (public.workspace_role(w.workspace_id) = 'ADVISOR' and public.workspace_advisor_can_write(w.workspace_id))
          or public.is_platform_admin()
        )
    )
  );
create policy "credit_cards_update" on public.credit_cards
  for update using (
    exists (
      select 1 from public.wallets w
      where w.id = wallet_id
        and (
          public.workspace_role(w.workspace_id) in ('TITULAR', 'MEMBRO')
          or (public.workspace_role(w.workspace_id) = 'ADVISOR' and public.workspace_advisor_can_write(w.workspace_id))
          or public.is_platform_admin()
        )
    )
  );
create policy "credit_cards_delete" on public.credit_cards
  for delete using (
    exists (
      select 1 from public.wallets w
      where w.id = wallet_id
        and (
          public.workspace_role(w.workspace_id) in ('TITULAR', 'MEMBRO')
          or (public.workspace_role(w.workspace_id) = 'ADVISOR' and public.workspace_advisor_can_write(w.workspace_id))
          or public.is_platform_admin()
        )
    )
  );
