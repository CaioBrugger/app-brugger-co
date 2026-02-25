-- Seed file para desenvolvimento local
-- Os dados principais (products + product_links) já estão na migration inicial.
-- Adicione aqui dados de teste que devem ser recarregados com `supabase db reset`.

-- ============================================================
-- TEMAS DEFAULT — sempre preservados após db reset
-- ============================================================
insert into public.themes (id, name, description, tokens, preview_html, accent_colors)
values (
    'default-dark-luxury',
    'Saber Cristão (Padrão)',
    'Dark Luxury Biblical',
    $tokens${"bg":"#0C0C0E","surface":"#131316","surface2":"#1A1A1F","border":"#2A2A32","text":"#FAFAFA","textSecondary":"#A0A0A8","accent":"#C9A962","accentLight":"#DFC07A","fontHeading":"'DM Serif Display', Georgia, serif","fontBody":"'DM Sans', sans-serif"}$tokens$::jsonb,
    '',
    array['#C9A962','#0C0C0E','#FAFAFA','#131316','#DFC07A']
)
on conflict (id) do nothing;

-- Tarefas de exemplo para o Dashboard
insert into public.todos (text, done, created_at) values
    ('Adicionar idioma Alemão no Pentateuco',        false, now() - interval '3 days'),
    ('Revisar links de checkout do Combo Profético', false, now() - interval '2 days'),
    ('Criar landing page Históricos em Português',   false, now() - interval '1 day'),
    ('Atualizar preços da Kiwify',                   false, now() - interval '5 hours'),
    ('Testar integração Supabase no app',            true,  now() - interval '30 minutes')
on conflict do nothing;
