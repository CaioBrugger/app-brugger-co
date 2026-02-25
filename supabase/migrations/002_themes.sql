-- ============================================================
-- TABELA: themes (Design System Themes)
-- ============================================================
create table if not exists public.themes (
    id            text primary key,
    name          text not null,
    description   text not null default '',
    tokens        jsonb not null default '{}',
    preview_html  text not null default '',
    accent_colors text[] not null default '{}',
    created_at    timestamptz not null default now()
);

alter table public.themes disable row level security;

-- SEED: Tema padrão
insert into public.themes (id, name, description, tokens, accent_colors)
values (
    'default-dark-luxury',
    E'Saber Crist\u00e3o (Padr\u00e3o)',
    'Dark Luxury Biblical',
    '{"bg":"#0C0C0E","surface":"#131316","surface2":"#1A1A1F","border":"#2A2A32","text":"#FAFAFA","textSecondary":"#A0A0A8","accent":"#C9A962","accentLight":"#DFC07A","fontHeading":"DM Serif Display, Georgia, serif","fontBody":"DM Sans, sans-serif"}'::jsonb,
    ARRAY['#C9A962','#0C0C0E','#FAFAFA','#131316','#DFC07A']
)
on conflict (id) do nothing;
