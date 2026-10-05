-- ---------------------------------------------------------------------------
-- ADNA — Etapa 2 da migração para Supabase.
-- Cria a tabela `public.profiles` (usuários da aplicação) + trigger que
-- sincroniza automaticamente novos cadastros vindos do Supabase Auth.
--
-- Regras desta etapa:
--   • Não há tabela de roles. Líder = quem consta em `grupos.lider_email`.
--   • `profiles.id` recebe o `auth.users.id` sempre que existe usuário no
--     Auth correspondente; para usuários criados pelo Admin antes do
--     signup, o id é gerado localmente e re-vinculado no trigger via
--     `on conflict (email)`.
--
-- Execute este script no SQL Editor do seu projeto Supabase.
-- ---------------------------------------------------------------------------

create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  email text not null unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Data API precisa de GRANTs explícitos.
grant select, insert, update, delete on public.profiles to authenticated;
grant all on public.profiles to service_role;

-- RLS: apenas usuários autenticados podem operar sobre a tabela.
alter table public.profiles enable row level security;

drop policy if exists "profiles: authenticated read" on public.profiles;
create policy "profiles: authenticated read"
  on public.profiles for select to authenticated using (true);

drop policy if exists "profiles: authenticated insert" on public.profiles;
create policy "profiles: authenticated insert"
  on public.profiles for insert to authenticated with check (true);

drop policy if exists "profiles: authenticated update" on public.profiles;
create policy "profiles: authenticated update"
  on public.profiles for update to authenticated using (true) with check (true);

drop policy if exists "profiles: authenticated delete" on public.profiles;
create policy "profiles: authenticated delete"
  on public.profiles for delete to authenticated using (true);

-- Reaproveita a função set_updated_at() já criada em 0001_grupos.sql.
-- Recria por segurança, caso este script rode isoladamente.
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end
$$;

drop trigger if exists trg_profiles_updated_at on public.profiles;
create trigger trg_profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Sincronização com auth.users:
-- Sempre que um usuário for criado no Supabase Auth, cria (ou re-vincula)
-- o profile correspondente. Se já existir um profile com o mesmo e-mail
-- (ex.: criado antes pelo Admin), reaproveita a linha e ajusta o id para
-- coincidir com auth.users.id.
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, nome, email)
  values (
    new.id,
    coalesce(
      nullif(new.raw_user_meta_data->>'name', ''),
      nullif(new.raw_user_meta_data->>'full_name', ''),
      split_part(new.email, '@', 1)
    ),
    new.email
  )
  on conflict (email) do update
    set id = excluded.id,
        updated_at = now();
  return new;
end
$$;

drop trigger if exists trg_on_auth_user_created on auth.users;
create trigger trg_on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_auth_user();

-- ---------------------------------------------------------------------------
-- Seed inicial — espelha os usuários "semente" que existiam em memória.
-- ---------------------------------------------------------------------------
insert into public.profiles (nome, email) values
  ('João Silva',       'joao@email.com'),
  ('Maria Souza',      'maria@email.com'),
  ('Ana Paula Silva',  'ana.silva@example.com'),
  ('Carlos Henrique',  'carlos.h@example.com'),
  ('Beatriz Souza',    'b.souza@example.com')
on conflict (email) do nothing;
