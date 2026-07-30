-- Conversa 3 — RLS para entry_groups, entries e import_batches.
-- Mesmo padrao de wallets/people (001_auth_and_rls.sql): titular/membro
-- fazem CRUD dentro do proprio workspace, leitura so consulta, admin ve tudo.

alter table public.entry_groups enable row level security;
alter table public.entries enable row level security;
alter table public.import_batches enable row level security;

create policy "entry_groups_select" on public.entry_groups
  for select using (public.is_workspace_member(workspace_id) or public.is_platform_admin());
create policy "entry_groups_write" on public.entry_groups
  for insert with check (public.workspace_role(workspace_id) in ('TITULAR', 'MEMBRO') or public.is_platform_admin());
create policy "entry_groups_update" on public.entry_groups
  for update using (public.workspace_role(workspace_id) in ('TITULAR', 'MEMBRO') or public.is_platform_admin());
create policy "entry_groups_delete" on public.entry_groups
  for delete using (public.workspace_role(workspace_id) in ('TITULAR', 'MEMBRO') or public.is_platform_admin());

create policy "entries_select" on public.entries
  for select using (public.is_workspace_member(workspace_id) or public.is_platform_admin());
create policy "entries_write" on public.entries
  for insert with check (public.workspace_role(workspace_id) in ('TITULAR', 'MEMBRO') or public.is_platform_admin());
create policy "entries_update" on public.entries
  for update using (public.workspace_role(workspace_id) in ('TITULAR', 'MEMBRO') or public.is_platform_admin());
create policy "entries_delete" on public.entries
  for delete using (public.workspace_role(workspace_id) in ('TITULAR', 'MEMBRO') or public.is_platform_admin());

create policy "import_batches_select" on public.import_batches
  for select using (public.is_workspace_member(workspace_id) or public.is_platform_admin());
create policy "import_batches_write" on public.import_batches
  for insert with check (public.workspace_role(workspace_id) in ('TITULAR', 'MEMBRO') or public.is_platform_admin());
create policy "import_batches_update" on public.import_batches
  for update using (public.workspace_role(workspace_id) in ('TITULAR', 'MEMBRO') or public.is_platform_admin());
create policy "import_batches_delete" on public.import_batches
  for delete using (public.workspace_role(workspace_id) in ('TITULAR', 'MEMBRO') or public.is_platform_admin());
