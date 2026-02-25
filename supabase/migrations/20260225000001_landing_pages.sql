-- ================================================================
-- Migration 003: Landing Pages Gallery
-- Stores LP Builder generated pages for the Gallery view
-- ================================================================

create table if not exists public.landing_pages (
    id             uuid        primary key default gen_random_uuid(),
    name           text        not null,
    description    text        not null default '',
    theme_id       text        not null default '',
    model_used     text        not null default '',
    section_count  int         not null default 0,
    sections_json  jsonb       not null default '[]',
    html_content   text        not null default '',
    thumbnail_html text        not null default '',
    created_at     timestamptz not null default now(),
    updated_at     timestamptz not null default now()
);

-- Index for ordering by creation date (gallery default sort)
create index if not exists landing_pages_created_at_idx
    on public.landing_pages (created_at desc);

-- Auto-update updated_at on row changes
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
    new.updated_at = now();
    return new;
end;
$$;

drop trigger if exists landing_pages_updated_at on public.landing_pages;
create trigger landing_pages_updated_at
    before update on public.landing_pages
    for each row execute procedure public.set_updated_at();

-- Row Level Security (open policy — adjust for auth if needed)
alter table public.landing_pages enable row level security;

drop policy if exists "landing_pages_open" on public.landing_pages;
create policy "landing_pages_open"
    on public.landing_pages
    for all
    using (true)
    with check (true);
