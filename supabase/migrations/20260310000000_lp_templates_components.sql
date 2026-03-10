-- Migration: lp_templates + lp_components
-- Run this in Supabase SQL Editor

create table if not exists lp_templates (
    id uuid primary key default gen_random_uuid(),
    name text not null,
    description text default '',
    sections_json jsonb not null default '[]',
    thumbnail_html text default '',
    theme_id text,
    created_at timestamptz default now()
);

create table if not exists lp_components (
    id uuid primary key default gen_random_uuid(),
    name text not null,
    category text not null default 'custom',
    description text default '',
    html text not null default '',
    created_at timestamptz default now()
);
