-- Conversa 5 — RLS para export_logs. Qualquer membro do workspace pode ver
-- e criar seu próprio registro de exportação; ninguém edita/apaga (é log).

alter table public.export_logs enable row level security;

create policy "export_logs_select" on public.export_logs
  for select using (public.is_workspace_member(workspace_id) or public.is_platform_admin());
create policy "export_logs_insert" on public.export_logs
  for insert with check (public.is_workspace_member(workspace_id) or public.is_platform_admin());
