-- ---------------------------------------------------------------------------
-- ADNA — Etapa 3 da migração para Supabase.
-- Cria a tabela `public.reports` (Relatórios Semanais) e habilita RLS.
--
-- Esta etapa cria somente a infraestrutura do banco.
--
-- Execute este script no SQL Editor do seu projeto Supabase.
-- ---------------------------------------------------------------------------


create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),

  semana text not null,
  status text not null default 'pending'
    check (status in ('pending','sent','reviewed')),

  lider_nome text,
  lider_email text,

  grupo text not null,
  area text not null,
  congregacao text not null,
  campo text not null default 'Assembleia de Deus Nova Ananindeua',

  membros integer not null default 0,
  visitantes integer not null default 0,
  decisoes integer not null default 0,
  batismos integer not null default 0,

  ofertas numeric(10,2) not null default 0,

  observacoes text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);


-- Data API precisa de GRANTs explícitos.
grant select, insert, update, delete on public.reports to authenticated;
grant all on public.reports to service_role;


-- RLS: apenas usuários autenticados podem operar sobre a tabela.
alter table public.reports enable row level security;


drop policy if exists "reports: authenticated read" on public.reports;
create policy "reports: authenticated read"
  on public.reports for select to authenticated using (true);


drop policy if exists "reports: authenticated insert" on public.reports;
create policy "reports: authenticated insert"
  on public.reports for insert to authenticated with check (true);


drop policy if exists "reports: authenticated update" on public.reports;
create policy "reports: authenticated update"
  on public.reports for update to authenticated using (true) with check (true);


drop policy if exists "reports: authenticated delete" on public.reports;
create policy "reports: authenticated delete"
  on public.reports for delete to authenticated using (true);


-- Trigger para manter updated_at.

drop trigger if exists trg_reports_updated_at on public.reports;

create trigger trg_reports_updated_at
  before update on public.reports
  for each row execute function public.set_updated_at();