-- Restringe autocadastro aberto (2026-08-12) — pedido do usuário: o sistema não deve
-- ser acessado por qualquer um. Reescreve handle_new_auth_user() (definida em
-- 001_auth_and_rls.sql, invite-aware desde 007_signup_invite_aware.sql) mais uma vez —
-- só o branch "sem convite pendente" muda.
--
-- Comportamento novo:
--   - Existe workspace_invites pendente pro e-mail? Continua IDÊNTICO — entra no
--     workspace já existente com acesso imediato (esse é o fluxo de
--     `/admin/clientes`: admin cadastra o e-mail do cliente, ele recebe convite por
--     e-mail de verdade e já fica apto a criar senha e acessar).
--   - Sem convite pendente (alguém se cadastrou sozinho, por e-mail/senha OU pelo
--     primeiro login via Google — o trigger dispara pros dois igual)? O workspace
--     pessoal continua sendo criado (evita o caminho de `requireActiveMembership()`
--     que lança erro duro pra quem fica com ZERO membership), mas já nasce BLOQUEADO
--     (`blocked_at`/`blocked_reason = 'AGUARDANDO_APROVACAO'`, mesmo mecanismo do
--     bloqueio de acesso admin-only — ver lib/workspace/block.ts). A pessoa consegue
--     logar, mas cai em /acesso-bloqueado até um admin aprovar em /admin/usuarios
--     (mesmo botão "desbloquear", só o rótulo muda pra "aprovar acesso" quando o
--     motivo é este). O aviso por e-mail pro(s) admin(s) é feito pela aplicação
--     (lib/workspace/pending-approval.ts), não daqui — trigger de banco não manda e-mail.
--
-- Aplicar via script (prisma migrate dev/deploy travam nesta máquina — ver
-- PROJECT_STATE.md seção 23): aplicar o .sql cru + registrar em nenhuma tabela (isto
-- não é uma migration Prisma, é troca de função — mesmo padrão de 007/009).

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
    insert into public.workspaces (name, blocked_at, blocked_reason)
    values (
      coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1)) || ' (pessoal)',
      now(),
      'AGUARDANDO_APROVACAO'
    )
    returning id into new_workspace_id;

    insert into public.memberships (workspace_id, profile_id, role)
    values (new_workspace_id, new.id, 'TITULAR');
  end if;

  return new;
end;
$$;
