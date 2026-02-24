-- ============================================================
-- Brugger CO — Schema Supabase
-- Execute no SQL Editor do seu projeto Supabase
-- ============================================================

-- ------------------------------------------------------------
-- TABELA: products
-- ------------------------------------------------------------
create table if not exists public.products (
    id           text primary key,
    name         text        not null,
    category     text        not null check (category in ('AT', 'NT', 'COMBO')),
    icon         text        not null default '',
    description  text        not null default '',
    sort_order   integer     not null default 0,
    created_at   timestamptz not null default now(),
    updated_at   timestamptz not null default now()
);

-- ------------------------------------------------------------
-- TABELA: product_links
-- ------------------------------------------------------------
create table if not exists public.product_links (
    id              bigserial   primary key,
    product_id      text        not null references public.products(id) on delete cascade,
    language        text        not null,
    url             text,
    checkout_basic  text,
    checkout_full   text,
    created_at      timestamptz not null default now(),
    updated_at      timestamptz not null default now(),
    unique (product_id, language)
);

-- ------------------------------------------------------------
-- TABELA: todos
-- ------------------------------------------------------------
create table if not exists public.todos (
    id          bigserial   primary key,
    text        text        not null,
    done        boolean     not null default false,
    created_at  timestamptz not null default now(),
    updated_at  timestamptz not null default now()
);

-- ------------------------------------------------------------
-- RLS: desabilitar para uso inicial (app interno sem auth)
-- Remova estas linhas se quiser ativar autenticação no futuro
-- ------------------------------------------------------------
alter table public.products     disable row level security;
alter table public.product_links disable row level security;
alter table public.todos        disable row level security;

-- ============================================================
-- SEED: Produtos
-- ============================================================

insert into public.products (id, name, category, icon, description, sort_order) values
    ('pentateuco',         'Pentateuco',              'AT',    '📜', 'Os cinco primeiros livros da Bíblia — Gênesis a Deuteronômio.',     1),
    ('historicos',         'Históricos',              'AT',    '⚔️', 'Os livros históricos — Josué a Ester.',                             2),
    ('poeticos',           'Poéticos',                'AT',    '🎵', 'Os livros poéticos e de sabedoria — Jó a Cantares.',                3),
    ('profetas-maiores',   'Profetas Maiores',         'AT',    '🔥', 'Os grandes profetas — Isaías a Daniel.',                           4),
    ('profetas-menores',   'Profetas Menores',         'AT',    '📢', 'Os doze profetas menores — Oséias a Malaquias.',                   5),
    ('evangelhos',         'Evangelhos',              'NT',    '✝️', 'Os quatro Evangelhos — Mateus, Marcos, Lucas e João.',              6),
    ('atos',               'Atos dos Apóstolos',      'NT',    '🕊️', 'A história da igreja primitiva — Atos dos Apóstolos.',             7),
    ('cartas-paulo',       'Cartas de Paulo',         'NT',    '✉️', 'As epístolas paulinas — Romanos a Filemom.',                       8),
    ('cartas-universais',  'Cartas Universais',        'NT',    '📨', 'As epístolas universais — Hebreus a Judas.',                       9),
    ('apocalipse',         'Apocalipse',              'NT',    '🌟', 'O livro da Revelação — Apocalipse de João.',                       10),
    ('combo-profetico',    'Combo Profético',          'COMBO', '📦', 'Combo com conteúdo profético completo.',                          11),
    ('treinamento-obreiros','Treinamento de Obreiros','COMBO', '🎓', 'Curso de formação e treinamento para obreiros.',                  12),
    ('geografia-biblica',  'Geografia Bíblica',        'COMBO', '🗺️', 'Estudo de geografia bíblica com mapas e contexto histórico.',    13)
on conflict (id) do nothing;

-- ------------------------------------------------------------
-- SEED: Links dos produtos
-- ------------------------------------------------------------

-- Pentateuco
insert into public.product_links (product_id, language, url, checkout_basic, checkout_full) values
    ('pentateuco', 'BRASIL',    'https://bibliaexplicativa.com/pentateucobr',      'https://pay.kiwify.com.br/1R8rJ6n',                        'https://pay.kiwify.com.br/8BY3czX'),
    ('pentateuco', 'PORTUGUÊS', 'https://bibliaexplicativa.com/pentateuco',        'https://pay.hotmart.com/X100148771M?checkoutMode=10',      'https://pay.hotmart.com/U100148928P?checkoutMode=10'),
    ('pentateuco', 'ESPANHOL',  'https://bibliaexplicativa.com/pentateucoes',      'https://pay.hotmart.com/D100149043T?checkoutMode=10',      'https://pay.hotmart.com/F100149098T?checkoutMode=10'),
    ('pentateuco', 'INGLÊS',    'https://bibliaexplicativa.com/pentateuch',        'https://pay.hotmart.com/E100149212A?checkoutMode=10',      'https://pay.hotmart.com/P100149294Q?checkoutMode=10'),
    ('pentateuco', 'FRANCÊS',   'https://bibliaexplicativa.com/Pentateuque',       'https://pay.hotmart.com/C101050596C?checkoutMode=10',      'https://pay.hotmart.com/K101050726M?checkoutMode=10')
on conflict (product_id, language) do nothing;

-- Evangelhos
insert into public.product_links (product_id, language, url, checkout_basic, checkout_full) values
    ('evangelhos', 'BRASIL',    'https://sabercristao.com/evangelhos',             'https://pay.kiwify.com.br/b7rXaVc',                        'https://pay.kiwify.com.br/XGHbDp0'),
    ('evangelhos', 'PORTUGUÊS', 'https://sabercristao.com/4evangelhos',            'https://pay.hotmart.com/S97742930F?checkoutMode=10',       'https://pay.hotmart.com/H97743035I?checkoutMode=10'),
    ('evangelhos', 'ESPANHOL',  'https://sabercristao.com/evangelio',             'https://pay.hotmart.com/P97292015M?checkoutMode=10',       'https://pay.hotmart.com/E97292140X?checkoutMode=10'),
    ('evangelhos', 'INGLÊS',    'https://sabercristao.com/gospel',                'https://pay.hotmart.com/M97176773P?checkoutMode=10',       'https://pay.hotmart.com/D97177203Q?checkoutMode=10'),
    ('evangelhos', 'FRANCÊS',   'https://sabercristao.com/Evangiles',             'https://pay.hotmart.com/T98948867B?checkoutMode=10',       'https://pay.hotmart.com/N98948943S?checkoutMode=10'),
    ('evangelhos', 'ALEMÃO',    'https://sabercristao.com/evangeliums',           'https://pay.hotmart.com/G98197154M?checkoutMode=10',       'https://pay.hotmart.com/L98197301C?checkoutMode=10')
on conflict (product_id, language) do nothing;

-- Cartas de Paulo
insert into public.product_links (product_id, language, url, checkout_basic, checkout_full) values
    ('cartas-paulo', 'BRASIL',    'https://sabercristao.com/cartasdepaulo',        'https://pay.kiwify.com.br/9u1dDlG',                        'https://pay.kiwify.com.br/FoesrKX'),
    ('cartas-paulo', 'PORTUGUÊS', 'https://sabercristao.com/cartasdepaulovpv',     'https://pay.hotmart.com/F97922733A?checkoutMode=10',       'https://pay.hotmart.com/U97922922J?checkoutMode=10'),
    ('cartas-paulo', 'ESPANHOL',  'https://sabercristao.com/cartasdepablo',        'https://pay.hotmart.com/W98015568P?checkoutMode=10',       'https://pay.hotmart.com/V98015731O?checkoutMode=10'),
    ('cartas-paulo', 'INGLÊS',    'https://sabercristao.com/Paulsletters',         'https://pay.hotmart.com/J98041114T?checkoutMode=10',       'https://pay.hotmart.com/P98041339S?checkoutMode=10'),
    ('cartas-paulo', 'FRANCÊS',   'https://sabercristao.com/lettresdePaul',        'https://pay.hotmart.com/F99057350A?checkoutMode=10',       'https://pay.hotmart.com/Q99057509R?checkoutMode=10'),
    ('cartas-paulo', 'ALEMÃO',    'https://sabercristao.com/DiePaulusbriefe',      'https://pay.hotmart.com/X98385413L?checkoutMode=10',       'https://pay.hotmart.com/W98416671D?checkoutMode=10')
on conflict (product_id, language) do nothing;

-- Cartas Universais
insert into public.product_links (product_id, language, url, checkout_basic, checkout_full) values
    ('cartas-universais', 'BRASIL',    'https://sabercristao.com/cartasuniversais',    'https://pay.kiwify.com.br/8fUKFtD',                    'https://pay.kiwify.com.br/CYtx3n4'),
    ('cartas-universais', 'PORTUGUÊS', 'https://sabercristao.com/cartasuniversaisvpv', 'https://pay.hotmart.com/Y98868042Q?checkoutMode=10',   'https://pay.hotmart.com/L98868248E?checkoutMode=10'),
    ('cartas-universais', 'ESPANHOL',  'https://sabercristao.com/CARTASUNIVERSALES',   'https://pay.hotmart.com/F99107782U?checkoutMode=10',   'https://pay.hotmart.com/L99107908T?checkoutMode=10'),
    ('cartas-universais', 'INGLÊS',    'https://sabercristao.com/generalepistles',     'https://pay.hotmart.com/N99538838D?checkoutMode=10',   'https://pay.hotmart.com/X99539043O?checkoutMode=10'),
    ('cartas-universais', 'FRANCÊS',   'https://sabercristao.com/lesepitresuniverselles', 'https://pay.hotmart.com/P101596597Y?checkoutMode=10', 'https://pay.hotmart.com/N101597063B?checkoutMode=10')
on conflict (product_id, language) do nothing;

-- Apocalipse
insert into public.product_links (product_id, language, url, checkout_basic, checkout_full) values
    ('apocalipse', 'BRASIL',    'https://sabercristao.com/apocalipse',             'https://pay.kiwify.com.br/orD6JUk',                        'https://pay.kiwify.com.br/PoXuv2Y'),
    ('apocalipse', 'PORTUGUÊS', 'https://sabercristao.com/apocalipsevpv',          'https://pay.hotmart.com/E97797712P?checkoutMode=10',       'https://pay.hotmart.com/M97798100V?checkoutMode=10'),
    ('apocalipse', 'ESPANHOL',  'https://sabercristao.com/apocalipsis',           'https://pay.hotmart.com/D97075949P?checkoutMode=10',       'https://pay.hotmart.com/F97076216U?checkoutMode=10'),
    ('apocalipse', 'INGLÊS',    'https://sabercristao.com/revelation',            'https://pay.hotmart.com/B97207752J?checkoutMode=10',       'https://pay.hotmart.com/F97208105V?checkoutMode=10'),
    ('apocalipse', 'FRANCÊS',   'https://sabercristao.com/APOCALYPSE',            'https://pay.hotmart.com/A99276650K?checkoutMode=10',       'https://pay.hotmart.com/W99276769R?checkoutMode=10'),
    ('apocalipse', 'ALEMÃO',    'https://sabercristao.com/offenbarung',           'https://pay.hotmart.com/C98282066B?checkoutMode=10',       'https://pay.hotmart.com/O98282192A?checkoutMode=10')
on conflict (product_id, language) do nothing;

-- Combo Profético
insert into public.product_links (product_id, language, url, checkout_basic, checkout_full) values
    ('combo-profetico', 'BRASIL',    'https://sabercristao.com/comboprofetico',       'https://pay.kiwify.com.br/Cqv6siT',                    null),
    ('combo-profetico', 'PORTUGUÊS', 'https://sabercristao.com/comboprofeticovpv',    'https://pay.hotmart.com/O101309614E?checkoutMode=10',  null),
    ('combo-profetico', 'ESPANHOL',  'https://sabercristao.com/comboprofeticoes',     'https://pay.hotmart.com/I101369877V?checkoutMode=10',  null),
    ('combo-profetico', 'INGLÊS',    'https://sabercristao.com/propheticbundle',      'https://pay.hotmart.com/J101959432A?checkoutMode=10',  null),
    ('combo-profetico', 'FRANCÊS',   'https://sabercristao.com/comboprophetique',     'https://pay.hotmart.com/P101808998W?checkoutMode=10',  null)
on conflict (product_id, language) do nothing;

-- Treinamento de Obreiros
insert into public.product_links (product_id, language, url, checkout_basic, checkout_full) values
    ('treinamento-obreiros', 'ESPANHOL', 'https://excel-servant-guide.lovable.app/',     'https://pay.hotmart.com/A102711485I?checkoutMode=10', null),
    ('treinamento-obreiros', 'INGLÊS',   'https://ministry-workers.lovable.app/',        'https://pay.hotmart.com/X102797937Q?checkoutMode=10', null),
    ('treinamento-obreiros', 'FRANCÊS',  'https://formation-des-ouvriers-v2.netlify.app/', 'https://pay.hotmart.com/N102813353I?checkoutMode=10', null),
    ('treinamento-obreiros', 'ALEMÃO',   'https://mirarbeiter-schulung.netlify.app/',    'https://pay.hotmart.com/K104296323N?checkoutMode=10', null)
on conflict (product_id, language) do nothing;

-- Geografia Bíblica
insert into public.product_links (product_id, language, url, checkout_basic, checkout_full) values
    ('geografia-biblica', 'PORTUGUÊS', 'https://geografia-biblica.netlify.app/',        'https://pay.hotmart.com/D103473219G?checkoutMode=10', null),
    ('geografia-biblica', 'ESPANHOL',  'https://geografia-biblica-es.netlify.app/',     'https://pay.hotmart.com/X103436167Y?checkoutMode=10', null),
    ('geografia-biblica', 'INGLÊS',    'https://biblical-geography.netlify.app/',       'https://pay.hotmart.com/X103440143K?checkoutMode=10', null),
    ('geografia-biblica', 'FRANCÊS',   'https://geographie-biblique.netlify.app/',      'https://pay.hotmart.com/D103445044A?checkoutMode=10', null),
    ('geografia-biblica', 'ALEMÃO',    'https://biblische-geographie.netlify.app/',     'https://pay.hotmart.com/M103507036P?checkoutMode=10', null)
on conflict (product_id, language) do nothing;
