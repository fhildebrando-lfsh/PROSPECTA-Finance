-- RLS de workspace_invites (convite de membro pro workspace, §19.1 pendente).
-- Só TITULAR/admin criam e listam convites do próprio workspace; a aceitação
-- em si roda via Prisma (role bypassa RLS, igual todo o resto do app) porque
-- quem aceita ainda não é membro do workspace de destino.

alter table public.workspace_invites enable row level security;

create policy "workspace_invites_select_titular_or_admin" on public.workspace_invites
  for select using (public.workspace_role(workspace_id) = 'TITULAR' or public.is_platform_admin());
create policy "workspace_invites_write_titular_or_admin" on public.workspace_invites
  for insert with check (public.workspace_role(workspace_id) = 'TITULAR' or public.is_platform_admin());
create policy "workspace_invites_delete_titular_or_admin" on public.workspace_invites
  for delete using (public.workspace_role(workspace_id) = 'TITULAR' or public.is_platform_admin());
