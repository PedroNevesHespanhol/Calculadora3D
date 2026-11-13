-- Calculadora 3D — esquema do banco (Supabase / Postgres)
-- Rode este arquivo inteiro no Supabase: SQL Editor > New query > colar > Run.
-- Cada registro pertence ao usuário logado; o RLS impede que outros usuários vejam seus dados.

-- Tabelas de cadastro: o objeto completo (Printer, Filament, ...) fica em "data" (jsonb).
do $$
declare t text;
begin
  foreach t in array array['printers', 'filaments', 'accessories', 'pieces'] loop
    execute format($f$
      create table if not exists public.%1$I (
        id uuid primary key,
        user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
        data jsonb not null,
        created_at timestamptz not null default now()
      );
      create index if not exists %1$s_user_idx on public.%1$I (user_id, created_at);
      alter table public.%1$I enable row level security;
      drop policy if exists "dono acessa" on public.%1$I;
      create policy "dono acessa" on public.%1$I
        for all to authenticated
        using (user_id = auth.uid())
        with check (user_id = auth.uid());
    $f$, t);
  end loop;
end $$;

-- Configurações e rascunho de orçamento: uma linha por usuário.
create table if not exists public.user_data (
  user_id uuid primary key default auth.uid() references auth.users (id) on delete cascade,
  settings jsonb,
  quote_draft jsonb,
  updated_at timestamptz not null default now()
);
alter table public.user_data enable row level security;
drop policy if exists "dono acessa" on public.user_data;
create policy "dono acessa" on public.user_data
  for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());
