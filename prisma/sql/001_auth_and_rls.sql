-- Fase 0 — Fundação
-- Roda DEPOIS de `npx prisma migrate dev` (que cria as tabelas do schema.prisma).
-- Este arquivo cobre o que o Prisma não gerencia: o vínculo com auth.users
-- (schema do Supabase Auth) e as políticas de Row Level Security (§19.1, §19.3).
--
-- Como aplicar (uma vez, no SQL Editor do Supabase ou via
-- `npx prisma db execute --file prisma/sql/001_auth_and_rls.sql`):

-- ---------------------------------------------------------------------------
-- 1. FK de profiles -> auth.users e trigger de criação automática
-- ---------------------------------------------------------------------------

alter table public.profiles
  add constraint profiles_id_fkey
  foreign key (id) references auth.users (id) on delete cascade;

-- Ao criar um usuário no Supabase Auth: cria o profile e, se ainda não existir
-- nenhum workspace para ele, cria um workspace pessoal com papel TITULAR.
-- [DECISÃO] Fase 0 assume auto-provisionamento (uso pessoal/familiar).
-- Na Fase 4 (consultoria), workspaces de cliente passam a ser criados pelo
-- administrador (§19.1) — este trigger não impede isso, só cobre o caso comum.
create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  new_workspace_id uuid;
begin
  insert into public.profiles (id, full_name)
  values (new.id, new.raw_user_meta_data ->> 'full_name');

  insert into public.workspaces (name)
  values (coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1)) || ' (pessoal)')
  returning id into new_workspace_id;

  insert into public.memberships (workspace_id, profile_id, role)
  values (new_workspace_id, new.id, 'TITULAR');

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_auth_user();

-- ---------------------------------------------------------------------------
-- 2. Funções auxiliares para as políticas de RLS
-- ---------------------------------------------------------------------------

create or replace function public.is_platform_admin()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select coalesce(
    (select is_platform_admin from public.profiles where id = auth.uid()),
    false
  );
$$;

create or replace function public.workspace_role(ws_id uuid)
returns text
language sql
security definer
stable
set search_path = public
as $$
  select role::text from public.memberships
  where workspace_id = ws_id and profile_id = auth.uid();
$$;

create or replace function public.is_workspace_member(ws_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.memberships
    where workspace_id = ws_id and profile_id = auth.uid()
  );
$$;

-- ---------------------------------------------------------------------------
-- 3. Row Level Security
-- ---------------------------------------------------------------------------

alter table public.profiles enable row level security;
alter table public.workspaces enable row level security;
alter table public.memberships enable row level security;
alter table public.people enable row level security;
alter table public.wallets enable row level security;
alter table public.subcategories enable row level security;
alter table public.categories enable row level security;
alter table public.wallet_kinds enable row level security;
alter table public.institutions enable row level security;
alter table public.statuses enable row level security;
alter table public.recurrence_kinds enable row level security;

-- profiles: cada um vê e edita o próprio; admin vê todos.
create policy "profiles_select_own_or_admin" on public.profiles
  for select using (id = auth.uid() or public.is_platform_admin());
create policy "profiles_update_own" on public.profiles
  for update using (id = auth.uid());

-- workspaces: membros e admin.
create policy "workspaces_select_member_or_admin" on public.workspaces
  for select using (public.is_workspace_member(id) or public.is_platform_admin());
create policy "workspaces_write_admin" on public.workspaces
  for insert with check (public.is_platform_admin());
create policy "workspaces_update_admin" on public.workspaces
  for update using (public.is_platform_admin());
create policy "workspaces_delete_admin" on public.workspaces
  for delete using (public.is_platform_admin());

-- memberships: visíveis a quem é do workspace ou admin; escrita por
-- titular do próprio workspace ou admin (convite/remoção de membros, §19.1).
create policy "memberships_select_member_or_admin" on public.memberships
  for select using (public.is_workspace_member(workspace_id) or public.is_platform_admin());
create policy "memberships_write_titular_or_admin" on public.memberships
  for insert with check (public.workspace_role(workspace_id) = 'TITULAR' or public.is_platform_admin());
create policy "memberships_update_titular_or_admin" on public.memberships
  for update using (public.workspace_role(workspace_id) = 'TITULAR' or public.is_platform_admin());
create policy "memberships_delete_titular_or_admin" on public.memberships
  for delete using (public.workspace_role(workspace_id) = 'TITULAR' or public.is_platform_admin());

-- people (responsáveis) e wallets (carteiras): CRUD para titular/membro do
-- workspace, leitura para papel LEITURA, tudo visível ao admin (§20).
create policy "people_select" on public.people
  for select using (public.is_workspace_member(workspace_id) or public.is_platform_admin());
create policy "people_write" on public.people
  for insert with check (public.workspace_role(workspace_id) in ('TITULAR', 'MEMBRO') or public.is_platform_admin());
create policy "people_update" on public.people
  for update using (public.workspace_role(workspace_id) in ('TITULAR', 'MEMBRO') or public.is_platform_admin());
create policy "people_delete" on public.people
  for delete using (public.workspace_role(workspace_id) in ('TITULAR', 'MEMBRO') or public.is_platform_admin());

create policy "wallets_select" on public.wallets
  for select using (public.is_workspace_member(workspace_id) or public.is_platform_admin());
create policy "wallets_write" on public.wallets
  for insert with check (public.workspace_role(workspace_id) in ('TITULAR', 'MEMBRO') or public.is_platform_admin());
create policy "wallets_update" on public.wallets
  for update using (public.workspace_role(workspace_id) in ('TITULAR', 'MEMBRO') or public.is_platform_admin());
create policy "wallets_delete" on public.wallets
  for delete using (public.workspace_role(workspace_id) in ('TITULAR', 'MEMBRO') or public.is_platform_admin());

-- subcategories: linhas globais (workspace_id null) legíveis por todo mundo
-- autenticado e editáveis só por admin; linhas custom só pelo próprio workspace.
create policy "subcategories_select" on public.subcategories
  for select using (
    workspace_id is null
    or public.is_workspace_member(workspace_id)
    or public.is_platform_admin()
  );
create policy "subcategories_write" on public.subcategories
  for insert with check (
    (workspace_id is null and public.is_platform_admin())
    or (workspace_id is not null and public.workspace_role(workspace_id) in ('TITULAR', 'MEMBRO'))
  );
create policy "subcategories_update" on public.subcategories
  for update using (
    (workspace_id is null and public.is_platform_admin())
    or (workspace_id is not null and public.workspace_role(workspace_id) in ('TITULAR', 'MEMBRO'))
  );
create policy "subcategories_delete" on public.subcategories
  for delete using (
    (workspace_id is null and public.is_platform_admin())
    or (workspace_id is not null and public.workspace_role(workspace_id) in ('TITULAR', 'MEMBRO'))
  );

-- Tabelas globais somente-leitura para qualquer usuário autenticado;
-- escrita restrita ao administrador (§20 — "Tipo" é fixo no código, as
-- demais referências seguem a mesma lógica de "só admin edita a lista").
create policy "categories_select_all" on public.categories
  for select using (auth.role() = 'authenticated');
create policy "categories_write_admin" on public.categories
  for all using (public.is_platform_admin()) with check (public.is_platform_admin());

create policy "wallet_kinds_select_all" on public.wallet_kinds
  for select using (auth.role() = 'authenticated');
create policy "wallet_kinds_write_admin" on public.wallet_kinds
  for all using (public.is_platform_admin()) with check (public.is_platform_admin());

create policy "institutions_select_all" on public.institutions
  for select using (auth.role() = 'authenticated');
create policy "institutions_write_admin" on public.institutions
  for all using (public.is_platform_admin()) with check (public.is_platform_admin());

create policy "statuses_select_all" on public.statuses
  for select using (auth.role() = 'authenticated');
create policy "statuses_write_admin" on public.statuses
  for all using (public.is_platform_admin()) with check (public.is_platform_admin());

create policy "recurrence_kinds_select_all" on public.recurrence_kinds
  for select using (auth.role() = 'authenticated');
create policy "recurrence_kinds_write_admin" on public.recurrence_kinds
  for all using (public.is_platform_admin()) with check (public.is_platform_admin());
