-- Auction Dugout activity history
-- Run once in Supabase SQL Editor. This table is independent of auction_data
-- and is intentionally not part of the auction transaction/persistence path.

create table if not exists public.activity_logs (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users(id) on delete cascade,
    user_email text,
    tournament_name text,
    event_category text not null default 'BUSINESS',
    event_type text not null,
    description text,
    entity_type text,
    entity_id text,
    old_data jsonb,
    new_data jsonb,
    metadata jsonb not null default '{}'::jsonb,
    status text not null default 'SUCCESS',
    created_at timestamptz not null default now()
);

create index if not exists activity_logs_user_created_idx
    on public.activity_logs (user_id, created_at desc);
create index if not exists activity_logs_tournament_created_idx
    on public.activity_logs (user_id, tournament_name, created_at desc);
create index if not exists activity_logs_event_type_idx
    on public.activity_logs (user_id, event_type, created_at desc);

alter table public.activity_logs enable row level security;

drop policy if exists "Users can insert their own activity logs" on public.activity_logs;
create policy "Users can insert their own activity logs"
    on public.activity_logs for insert to authenticated
    with check (auth.uid() = user_id);

drop policy if exists "Users can read their own activity logs" on public.activity_logs;
create policy "Users can read their own activity logs"
    on public.activity_logs for select to authenticated
    using (auth.uid() = user_id);

-- No update/delete policy is provided: activity history is append-only for users.
