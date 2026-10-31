-- Auction reset audit trail.
-- Run this once in Supabase SQL Editor before deploying the frontend changes.

create table if not exists public.auction_audit_logs (
    id bigint generated always as identity primary key,
    user_id uuid not null references auth.users(id) on delete restrict,
    event_type text not null,
    status text not null default 'info',
    details jsonb not null default '{}'::jsonb,
    created_at timestamptz not null default now()
);

create index if not exists auction_audit_logs_user_created_idx
    on public.auction_audit_logs (user_id, created_at desc);

create index if not exists auction_audit_logs_event_created_idx
    on public.auction_audit_logs (event_type, created_at desc);

alter table public.auction_audit_logs enable row level security;

drop policy if exists "Users can insert their own auction audit logs"
    on public.auction_audit_logs;
create policy "Users can insert their own auction audit logs"
    on public.auction_audit_logs
    for insert
    to authenticated
    with check (auth.uid() = user_id);

drop policy if exists "Users can read their own auction audit logs"
    on public.auction_audit_logs;
create policy "Users can read their own auction audit logs"
    on public.auction_audit_logs
    for select
    to authenticated
    using (auth.uid() = user_id);

-- Intentionally do not create UPDATE or DELETE policies: audit entries are append-only.
grant insert, select on public.auction_audit_logs to authenticated;
grant usage, select on sequence public.auction_audit_logs_id_seq to authenticated;
