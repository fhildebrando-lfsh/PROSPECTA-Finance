-- Incidente evitado: declarar "auth" em datasource.schemas para o Prisma
-- enxergar essa FK fez o `prisma migrate dev` tratar TODO o schema auth
-- (usuarios, sessoes, tokens do Supabase) como drift e sugerir um reset
-- que apagaria a autenticacao inteira. A correcao e nunca deixar o Prisma
-- precisar saber que auth.users existe: removemos a FK cross-schema e
-- substituimos o ON DELETE CASCADE que ela dava por um trigger.

alter table public.profiles drop constraint if exists profiles_id_fkey;

create or replace function public.handle_deleted_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from public.profiles where id = old.id;
  return old;
end;
$$;

drop trigger if exists on_auth_user_deleted on auth.users;

create trigger on_auth_user_deleted
  after delete on auth.users
  for each row execute function public.handle_deleted_auth_user();
