-- Ajuste de permissões pedido pelo usuário após ver a tela de Lançamentos:
-- Subcategoria deixa de ser editável pelo cliente e vira admin-only, igual
-- Categoria (o §20 original previa cliente editando subcategoria — isso mudou).
-- nature_labels (rótulos de exibição de Tipo) segue o mesmo padrão das
-- outras tabelas de referência global: leitura para todo autenticado,
-- escrita só admin.

alter table public.nature_labels enable row level security;

create policy "nature_labels_select_all" on public.nature_labels
  for select using (auth.role() = 'authenticated');
create policy "nature_labels_write_admin" on public.nature_labels
  for all using (public.is_platform_admin()) with check (public.is_platform_admin());

-- Substitui as policies de escrita de subcategories criadas em
-- 001_auth_and_rls.sql (cliente podia criar subcategoria custom do próprio
-- workspace) por admin-only, igual categories.
drop policy if exists "subcategories_write" on public.subcategories;
drop policy if exists "subcategories_update" on public.subcategories;
drop policy if exists "subcategories_delete" on public.subcategories;

create policy "subcategories_write_admin" on public.subcategories
  for insert with check (public.is_platform_admin());
create policy "subcategories_update_admin" on public.subcategories
  for update using (public.is_platform_admin());
create policy "subcategories_delete_admin" on public.subcategories
  for delete using (public.is_platform_admin());
