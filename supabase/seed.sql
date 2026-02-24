-- Seed file para desenvolvimento local
-- Os dados principais (products + product_links) já estão na migration inicial.
-- Adicione aqui dados de teste que devem ser recarregados com `supabase db reset`.

-- Tarefas de exemplo para o Dashboard
insert into public.todos (text, done, created_at) values
    ('Adicionar idioma Alemão no Pentateuco',        false, now() - interval '3 days'),
    ('Revisar links de checkout do Combo Profético', false, now() - interval '2 days'),
    ('Criar landing page Históricos em Português',   false, now() - interval '1 day'),
    ('Atualizar preços da Kiwify',                   false, now() - interval '5 hours'),
    ('Testar integração Supabase no app',            true,  now() - interval '30 minutes')
on conflict do nothing;
