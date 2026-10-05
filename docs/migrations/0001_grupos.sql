-- ---------------------------------------------------------------------------
-- ADNA — Etapa 1 da migração para Supabase.
-- Cria a tabela `public.grupos` (Grupos Familiares) e habilita RLS.
--
-- Execute este script no SQL Editor do seu projeto Supabase.
-- ---------------------------------------------------------------------------

create table if not exists public.grupos (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  area text not null,
  congregacao text not null,
  campo text not null default 'Assembleia de Deus Nova Ananindeua',
  status text not null default 'Ativo' check (status in ('Ativo','Inativo')),
  lider_nome text,
  lider_email text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Data API precisa de GRANTs explícitos.
grant select, insert, update, delete on public.grupos to authenticated;
grant all on public.grupos to service_role;

-- RLS: apenas usuários autenticados podem operar sobre a tabela.
alter table public.grupos enable row level security;

drop policy if exists "grupos: authenticated read" on public.grupos;
create policy "grupos: authenticated read"
  on public.grupos for select to authenticated using (true);

drop policy if exists "grupos: authenticated insert" on public.grupos;
create policy "grupos: authenticated insert"
  on public.grupos for insert to authenticated with check (true);

drop policy if exists "grupos: authenticated update" on public.grupos;
create policy "grupos: authenticated update"
  on public.grupos for update to authenticated using (true) with check (true);

drop policy if exists "grupos: authenticated delete" on public.grupos;
create policy "grupos: authenticated delete"
  on public.grupos for delete to authenticated using (true);

-- Trigger para manter updated_at.
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end
$$;

drop trigger if exists trg_grupos_updated_at on public.grupos;
create trigger trg_grupos_updated_at
  before update on public.grupos
  for each row execute function public.set_updated_at();

-- Seed inicial — espelha os dados que existiam em memória.
insert into public.grupos (nome, area, congregacao, campo, status, lider_nome, lider_email)
values
  ('Grupo Esperança',   'Área 1', 'Centro',      'Assembleia de Deus Nova Ananindeua', 'Ativo',   'Marcos Silva',   'marcos@adnova.com'),
  ('GRUPO MONTE SIÃO',  'Área 2', 'Marambaia',   'Assembleia de Deus Nova Ananindeua', 'Ativo',   'Maria Souza',    'maria@email.com'),
  ('GRUPO EBENÉZER',    'Área 1', 'Pedreira',    'Assembleia de Deus Nova Ananindeua', 'Ativo',   null,             null),
  ('GRUPO SHALOM',      'Área 3', 'Cidade Nova', 'Assembleia de Deus Nova Ananindeua', 'Ativo',   'Beatriz Souza',  'b.souza@example.com'),
  ('GRUPO TESTE 1',     'Área 1', 'Centro',      'Assembleia de Deus Nova Ananindeua', 'Inativo', null,             null)
on conflict do nothing;
