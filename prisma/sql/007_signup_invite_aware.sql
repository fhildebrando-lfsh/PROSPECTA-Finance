-- Arquitetura de Identidade/Planos, Fase 2 Etapa 1.
-- Reescreve handle_new_auth_user() (definida em 001_auth_and_rls.sql) pra
-- checar convite pendente ANTES de criar um workspace automático. Resolve
-- a colisão descoberta na Fase 1: hoje TODO signup ganha workspace próprio,
-- o que não serve pro onboarding de cliente de consultoria (o workspace já
-- deveria existir, criado pelo consultor/admin, antes do cliente logar pela
-- primeira vez — ver ARQUITETURA-IDENTIDADE-PLANOS.md seção 12).
--
-- Comportamento novo:
--   - Existe workspace_invites pendente (accepted_at is null) pro e-mail
--     do novo usuário? Aceita o convite mais recente: cria a Membership no
--     workspace já existente, com o papel definido no convite, e marca
--     accepted_at. NÃO cria workspace novo.
--   - Não existe convite pendente? Comportamento de sempre, inalterado:
--     cria workspace pessoal + Membership TITULAR.
--
-- Nenhuma tela/Server Action muda nesta etapa — isso só passa a ser
-- exercitado de verdade quando o fluxo de convite ADVISOR/pré-cadastro for
-- construído numa etapa futura (backend). Até lá, é estritamente aditivo:
-- o caminho "sem convite pendente" continua idêntico ao de hoje.
--
-- Aplicar via: npx prisma db execute --file prisma/sql/007_signup_invite_aware.sql

create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  new_workspace_id uuid;
  pending_invite record;
begin
  insert into public.profiles (id, full_name)
  values (new.id, new.raw_user_meta_data ->> 'full_name');

  select * into pending_invite
  from public.workspace_invites
  where email = new.email and accepted_at is null
  order by created_at desc
  limit 1;

  if pending_invite.id is not null then
    insert into public.memberships (workspace_id, profile_id, role)
    values (pending_invite.workspace_id, new.id, pending_invite.role)
    on conflict (workspace_id, profile_id) do nothing;

    update public.workspace_invites
    set accepted_at = now()
    where id = pending_invite.id;
  else
    insert into public.workspaces (name)
    values (coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1)) || ' (pessoal)')
    returning id into new_workspace_id;

    insert into public.memberships (workspace_id, profile_id, role)
    values (new_workspace_id, new.id, 'TITULAR');
  end if;

  return new;
end;
$$;
