import { useState, useRef, useEffect } from 'react';
import { products } from '../data/productsData';

// ─── Scroll Reveal Hook ──────────────────────────────────────────────────────
function useScrollReveal() {
    useEffect(() => {
        const elements = document.querySelectorAll('[data-reveal]');
        if (!elements.length) return;

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('is-revealed');
                        observer.unobserve(entry.target);
                    }
                });
            },
            { threshold: 0.12, rootMargin: '0px 0px -60px 0px' }
        );

        elements.forEach(el => observer.observe(el));
        return () => observer.disconnect();
    }, []);
}

// ─── Extended Descriptions (change #3: longer descriptions) ───────────────────
const PRODUCT_DESCRIPTIONS = {
    pentateuco: {
        tagline: 'Os cinco primeiros livros da Bíblia — a base de toda a fé cristã',
        full: 'Um estudo versículo a versículo que vai de Gênesis a Deuteronômio, cobrindo a Criação, a Queda, o Dilúvio, a vida dos patriarcas, a libertação do Egito, as leis mosaicas e a aliança com Israel. Cada capítulo inclui contexto histórico, arqueológico e teológico que conecta o Antigo Testamento ao Novo.',
        benefits: [
            'Compreenda a Criação, a Queda e a Aliança com profundidade teológica',
            'Desvende as leis mosaicas e seu cumprimento em Cristo',
            'Explore a jornada de Abraão a Moisés com contexto histórico completo',
            'Fortaleça sua base doutrinária com os fundamentos de toda a Escritura'
        ]
    },
    historicos: {
        tagline: 'A história do povo de Deus — da conquista ao exílio',
        full: 'Uma jornada completa pelos livros de Josué a Ester. Conquista de Canaã, a era dos Juízes, a monarquia unida e dividida, o exílio na Babilônia e o retorno. Inclui mapas, cronologias e conexões arqueológicas que tornam a narrativa viva e contextualizada.',
        benefits: [
            'Josué a Ester — toda a história do povo de Deus em profundidade',
            'Guerras, reis e exílio com arqueologia e contexto histórico integrados',
            'Lições de liderança e obediência com Juízes, Reis e Profetas',
            'Rute, Ester e outros personagens como prefiguras do plano redentor'
        ]
    },
    poeticos: {
        tagline: 'Sabedoria, louvor e adoração nas páginas mais profundas da Escritura',
        full: 'Os cinco livros poéticos — Jó, Salmos, Provérbios, Eclesiastes e Cantares — revelados com análise literária, poética e teológica. Entenda a estrutura hebraica dos Salmos, a filosofia de Eclesiastes, o simbolismo de Cantares e as respostas profundas de Jó para o sofrimento humano.',
        benefits: [
            'Salmos explicados com análise poética que aprofunda o seu louvor',
            'Jó e o mistério do sofrimento humano respondido com a Palavra',
            'Provérbios e Eclesiastes com sabedoria prática para cada área da vida',
            'Cantares — o simbolismo do amor divino revelado em profundidade'
        ]
    },
    'profetas-maiores': {
        tagline: 'Isaías, Jeremias, Ezequiel e Daniel — as vozes que moldaram a profecia bíblica',
        full: 'Um estudo exaustivo dos quatro grandes profetas do Antigo Testamento. Contexto político, social e religioso de cada profecia. As visões de Ezequiel e Daniel interpretadas com rigor acadêmico. As profecias messiânicas de Isaías conectadas ao cumprimento em Cristo.',
        benefits: [
            'Isaías — o Evangelho do AT com profecias messiânicas em detalhe',
            'Ezequiel e Daniel explicados com interpretação contextual e profética',
            'Jeremias e Lamentações — o coração de Deus pela justiça e restauração',
            'Conecte cada profecia ao seu cumprimento em Cristo de forma sistemática'
        ]
    },
    'profetas-menores': {
        tagline: 'Doze vozes proféticas que ainda falam com poder — de Oséias a Malaquias',
        full: 'Os doze profetas menores explicados com toda a riqueza histórica e teológica que merecem. De Oséias — o profeta do amor incondicional — até Malaquias — a última voz antes dos 400 anos de silêncio. Cada livro com aplicação prática para a Igreja contemporânea.',
        benefits: [
            'Oséias a Malaquias — os 12 profetas em profundidade real',
            'A última voz do AT antes do silêncio profético de 400 anos',
            'Profecias sobre o Dia do Senhor, a restauração e a vinda do Messias',
            'Arrependimento, fidelidade e esperança para a Igreja de hoje'
        ]
    },
    evangelhos: {
        tagline: 'Jesus Cristo retratado por quatro perspectivas complementares e inspiradas',
        full: 'Os quatro Evangelhos — Mateus, Marcos, Lucas e João — analisados versículo a versículo com paralelismos sinóticos, contexto judaico e romano, e aplicação teológica. Entenda por que cada evangelista escreveu para públicos diferentes e como suas narrativas se complementam formando o retrato completo de Cristo.',
        benefits: [
            'Mateus, Marcos, Lucas e João versículo a versículo',
            'Paralelos e diferenças entre os quatro evangelhos explicados',
            'O contexto judaico e romano que moldou o ministério de Cristo',
            'A ressurreição — base e prova de toda a fé cristã comprovada'
        ]
    },
    atos: {
        tagline: 'O nascimento da Igreja — do Pentecostes às viagens missionárias de Paulo',
        full: 'A história completa da expansão da Igreja primitiva narrada por Lucas. Do derramamento do Espírito no Pentecostes até a chegada de Paulo a Roma. Inclui mapas das viagens missionárias, contexto geográfico e cultural, e modelos de discipulado aplicáveis à igreja de hoje.',
        benefits: [
            'Nascimento e expansão da Igreja primitiva com riqueza histórica',
            'Padrões de pregação e discipulado que a Igreja deve seguir hoje',
            'As viagens missionárias de Paulo com contexto geográfico e teológico',
            'O modelo apostólico de crescimento — ontem, hoje e sempre'
        ]
    },
    'cartas-paulo': {
        tagline: 'A teologia mais profunda do NT — de Romanos a Filemom',
        full: 'As treze epístolas de Paulo comentadas com profundidade exegética e clareza pastoral. Justificação pela fé em Romanos, vida cristã em Coríntios, liberdade em Gálatas, a plenitude em Efésios e a alegria em Filipenses. Cada carta com contexto histórico da comunidade destinatária e aplicação prática.',
        benefits: [
            'Domine a justificação pela fé em Romanos com precisão exegética',
            'Vida cristã e dons espirituais pelas cartas aos Coríntios',
            'Graça, liberdade e maturidade espiritual de Gálatas a Filemom',
            'Base teológica sólida que sustenta o seu ministério e caminhada'
        ]
    },
    'cartas-universais': {
        tagline: 'Hebreus, Tiago, Pedro, João e Judas — fé prática para os últimos tempos',
        full: 'As oito cartas universais que completam a teologia do Novo Testamento. A superioridade de Cristo em Hebreus, a fé que age em Tiago, a esperança sob perseguição em Pedro, o amor e a verdade em João, e o alerta contra falsos mestres em Judas. Fundamentação sólida para vida cristã madura.',
        benefits: [
            'Hebreus — a superioridade de Cristo e a fé que persevera até o fim',
            'Tiago — a fé que age com princípios práticos que transformam',
            'Pedro — esperança sólida para enfrentar heresias e perseguições',
            'Construa teologia robusta sobre santificação, esperança e amor'
        ]
    },
    apocalipse: {
        tagline: 'O livro da Revelação — decodificado com clareza, contexto e esperança',
        full: 'O Apocalipse de João explicado sem sensacionalismo e sem medo. As sete cartas às igrejas, os selos, as trombetas, as taças, a Babilônia e a Nova Jerusalém — cada visão interpretada com equilíbrio entre as escolas preterista, historicista, futurista e idealista. A mensagem central: Cristo vence.',
        benefits: [
            'Visões de João com interpretação histórica e profética equilibrada',
            'Selos, trombetas e cartas às sete igrejas sem medo nem confusão',
            'A mensagem central do Apocalipse: a vitória final de Cristo',
            'Esperança escatológica com visão clara do retorno glorioso de Jesus'
        ]
    },
    'combo-profetico': {
        tagline: 'Profetas Maiores + Menores + Apocalipse num único pacote profético completo',
        full: 'O pacote definitivo para quem quer dominar toda a profecia bíblica. Reúne os três estudos proféticos — Profetas Maiores, Profetas Menores e Apocalipse — num único acesso com preço reduzido. Visão panorâmica coerente da linha profética de Isaías a João, com comentários integrados.',
        benefits: [
            'Profetas Maiores + Profetas Menores + Apocalipse em um só lugar',
            'Visão panorâmica coerente da profecia bíblica do início ao fim',
            'Comentários integrados e complementares ao longo da linha profética',
            'Ideal para pastores, professores e líderes que ensinam os últimos tempos'
        ]
    },
    'treinamento-obreiros': {
        tagline: 'Formação ministerial completa — de cristão comprometido a obreiro capacitado',
        full: 'Um curso estruturado para quem sente o chamado ministerial. Cobre pregação, ensino, aconselhamento pastoral, liderança de células, administração eclesiástica, ética ministerial e crescimento espiritual. Inclui exercícios práticos, cases reais e certificado de conclusão.',
        benefits: [
            'Formação ministerial: pregação, aconselhamento e liderança',
            'Conteúdo desenvolvido por teólogos e pastores experientes',
            'Cases reais, exercícios aplicados e material de estudo estruturado',
            'Certificado de conclusão para valorizar o seu currículo ministerial'
        ]
    },
    'geografia-biblica': {
        tagline: 'Mapas, rotas e contexto geográfico de toda a narrativa bíblica',
        full: 'A Bíblia ganha vida quando você vê onde cada evento aconteceu. Mapas detalhados de Canaã, Egito, Mesopotâmia e o mundo greco-romano. Rotas do Êxodo, fronteiras tribais, viagens de Paulo, guerras de Israel — tudo com fotografia de sítios arqueológicos e reconstruções 3D.',
        benefits: [
            'Mapas detalhados de todas as regiões, cidades e rotas bíblicas',
            'Contexto geográfico que aprofunda a compreensão de cada narrativa',
            'Rotas do Êxodo, viagens de Paulo e guerras de Israel explicadas',
            'Recurso indispensável para pregadores e professores da Palavra'
        ]
    }
};

// ─── Constants ────────────────────────────────────────────────────────────────
const CATEGORY_LABELS = {
    AT: 'Antigo Testamento',
    NT: 'Novo Testamento',
    COMBO: 'Combos & Cursos'
};

const HIGHLIGHTS = {
    evangelhos: { label: 'MAIS VENDIDO', solid: true },
    apocalipse: { label: 'MAIS ESTUDADO', solid: true },
    'combo-profetico': { label: 'MAIS POPULAR', solid: true }
};

const FILTER_CATEGORIES = [
    { id: 'ALL', label: 'Todos' },
    { id: 'AT', label: 'Antigo Testamento' },
    { id: 'NT', label: 'Novo Testamento' },
    { id: 'COMBO', label: 'Combos & Cursos' }
];

const TESTIMONIALS = [
    {
        text: 'O material de Evangelhos mudou completamente minha forma de pregar. A profundidade técnica aliada à clareza é algo raro de encontrar hoje em dia.',
        name: 'Pr. André Santos',
        role: 'Mestre em Divindade',
    },
    {
        text: 'Finalmente entendi o contexto das cartas de Paulo. O material é riquíssimo e as referências cruzadas ajudam muito na preparação de estudos.',
        name: 'Mariana Costa',
        role: 'Líder de Pequeno Grupo',
    },
    {
        text: 'A Bíblia Explicativa eleva o nível do ensino bíblico no Brasil. Recomendo para qualquer um que queira sair da superfície no estudo das Escrituras.',
        name: 'Carlos Oliveira',
        role: 'Seminarista',
    }
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
function getBestLinks(product) {
    const brasil = product.languages?.BRASIL || {};
    const pt = product.languages?.PORTUGUÊS || {};
    if (brasil.checkoutBasic || brasil.checkoutFull || brasil.url) return brasil;
    if (pt.checkoutBasic || pt.checkoutFull || pt.url) return pt;
    return {};
}

function getLangCount(product) {
    return Object.values(product.languages || {}).filter(
        l => l.url || l.checkoutBasic || l.checkoutFull
    ).length;
}

function hasCheckout(product) {
    const links = getBestLinks(product);
    return !!(links.checkoutBasic || links.checkoutFull || links.url);
}

// ─── Sub-Components ───────────────────────────────────────────────────────────

function HeroSection() {
    return (
        <section className="vitrine-hero">
            <div className="vitrine-hero__glow" />

            <div className="vitrine-hero__content">
                <div className="vitrine-badge vitrine-entrance" style={{ animationDelay: '0.1s' }}>
                    Excelência Teológica
                </div>

                <h1 className="vitrine-hero__title vitrine-entrance" style={{ animationDelay: '0.3s' }}>
                    Mergulhe nas Profundezas da{' '}
                    <span className="vitrine-gold">Palavra de Deus</span>
                </h1>

                <p className="vitrine-hero__sub vitrine-entrance" style={{ animationDelay: '0.5s' }}>
                    Materiais de nível acadêmico traduzidos para uma linguagem acessível.
                    Transforme sua jornada espiritual com clareza e profundidade ministerial.
                </p>

                <div className="vitrine-hero__actions vitrine-entrance" style={{ animationDelay: '0.7s' }}>
                    <a href="#catalogo" className="vitrine-btn vitrine-btn--primary vitrine-btn--lg vitrine-btn--glow">
                        Ver Catálogo Completo
                    </a>
                    <a href="#diferencial" className="vitrine-btn vitrine-btn--outline vitrine-btn--lg">
                        Conhecer Metodologia
                    </a>
                </div>

                <div className="vitrine-stats vitrine-entrance" style={{ animationDelay: '0.9s' }}>
                    <StatCard value="13" label="Produtos Digitais" />
                    <StatCard value="6" label="Idiomas Disponíveis" />
                    <StatCard value="10k+" label="Alunos Ativos" />
                </div>
            </div>
        </section>
    );
}

function StatCard({ value, label }) {
    return (
        <div className="vitrine-stat-card">
            <div className="vitrine-stat-card__value">{value}</div>
            <div className="vitrine-stat-card__label">{label}</div>
        </div>
    );
}

function ValuePropsSection() {
    const props = [
        {
            icon: '📖',
            title: 'Exegese Sem Complicação',
            desc: 'Acesso direto ao texto original (Hebraico e Grego) sem a necessidade de anos de seminário. Ferramentas práticas para tradução e interpretação.'
        },
        {
            icon: '🏛️',
            title: 'Contexto Histórico',
            desc: 'Viagem no tempo através da arqueologia e sociologia bíblica. Entenda os costumes, o clima e as tensões políticas da época.'
        },
        {
            icon: '👑',
            title: 'Nível Ministerial',
            desc: 'Conteúdo denso preparado para pastores, líderes e vocacionados que não se contentam com o básico. Teologia robusta com aplicação prática.'
        }
    ];

    return (
        <section id="diferencial" className="vitrine-section vitrine-section--surface">
            <div className="vitrine-container">
                <div className="vitrine-section__header" data-reveal>
                    <h2 className="vitrine-section__title">O Diferencial Brugger Co</h2>
                    <div className="vitrine-divider-bar" />
                </div>

                <div className="vitrine-value-grid">
                    {props.map((p, i) => (
                        <div key={i} className="vitrine-value-card" data-reveal style={{ transitionDelay: `${i * 0.15}s` }}>
                            <div className="vitrine-value-card__icon">{p.icon}</div>
                            <h3 className="vitrine-value-card__title">{p.title}</h3>
                            <p className="vitrine-value-card__desc">{p.desc}</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}

// ─── Change #5: Horizontal scrollable carousel row ────────────────────────────
function CarouselRow({ title, icon, products: rowProducts, badgeStyle }) {
    const scrollRef = useRef(null);
    const needsScroll = rowProducts.length > 3;

    const scroll = (dir) => {
        if (!scrollRef.current) return;
        const cardWidth = scrollRef.current.querySelector('.vitrine-mini-card')?.offsetWidth || 360;
        scrollRef.current.scrollBy({ left: dir * (cardWidth + 20), behavior: 'smooth' });
    };

    return (
        <div className="vitrine-carousel-section" data-reveal>
            <div className="vitrine-carousel__header">
                <h3 className="vitrine-carousel__title">
                    {title}
                </h3>
                {needsScroll && (
                    <div className="vitrine-carousel__nav">
                        <button onClick={() => scroll(-1)} className="vitrine-carousel__arrow">←</button>
                        <button onClick={() => scroll(1)} className="vitrine-carousel__arrow">→</button>
                    </div>
                )}
            </div>
            <div
                ref={scrollRef}
                className={`vitrine-carousel-grid ${needsScroll ? 'vitrine-carousel-grid--scrollable' : ''}`}
            >
                {rowProducts.map(product => (
                    <MiniCard key={product.id} product={product} badgeStyle={badgeStyle} />
                ))}
            </div>
        </div>
    );
}

// ─── Change #1: 4:5 cover + Change #2: only Completo btn + Change #3: longer desc ─
function MiniCard({ product, badgeStyle }) {
    const links = getBestLinks(product);
    const available = hasCheckout(product);
    const desc = PRODUCT_DESCRIPTIONS[product.id] || {};

    return (
        <div className={`vitrine-mini-card ${!available ? 'vitrine-mini-card--dim' : ''}`}>
            {/* 4:5 aspect ratio cover for ALL cards */}
            <div className="vitrine-mini-card__cover">
                <div className="vitrine-mini-card__gradient" />
                <div className={`vitrine-mini-card__badge ${badgeStyle === 'solid' ? 'vitrine-mini-card__badge--solid' : ''}`}>
                    {!available ? 'Em Breve' : badgeStyle === 'solid' ? 'Mais Vendido' : 'Lançamento'}
                </div>
                <span className="vitrine-mini-card__icon">{product.icon}</span>
            </div>

            <div className="vitrine-mini-card__body">
                <h3 className="vitrine-mini-card__title">{product.name}</h3>
                <p className="vitrine-mini-card__tagline">{desc.tagline || product.description}</p>

                {/* Change #3: longer product description */}
                {desc.full && (
                    <p className="vitrine-mini-card__full-desc">{desc.full}</p>
                )}

                {available ? (
                    <div className="vitrine-mini-card__actions">
                        {/* Change #2: Only "Completo" button */}
                        <a href={links.checkoutFull || links.checkoutBasic || links.url}
                            target="_blank" rel="noopener noreferrer"
                            className="vitrine-btn vitrine-btn--primary vitrine-btn--sm vitrine-btn--full">
                            Adquirir Agora →
                        </a>
                    </div>
                ) : (
                    <div className="vitrine-mini-card__actions">
                        <button className="vitrine-btn vitrine-btn--outline vitrine-btn--sm vitrine-btn--full">
                            🔔 Me Avise no Lançamento
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

// ─── Change #4: Same UI for "Todos os Produtos" (ProductCard) ─────────────────
function ProductCard({ product }) {
    const desc = PRODUCT_DESCRIPTIONS[product.id] || {};
    const hl = HIGHLIGHTS[product.id];
    const links = getBestLinks(product);
    const available = hasCheckout(product);
    const langCount = getLangCount(product);

    return (
        <article className={`vitrine-product-card ${!available ? 'vitrine-product-card--dim' : ''}`}>
            {hl && (
                <div className="vitrine-product-card__highlight">{hl.label}</div>
            )}

            <div className="vitrine-product-card__header">
                <span className="vitrine-product-card__icon">{product.icon}</span>
                <span className="vitrine-product-card__cat">{CATEGORY_LABELS[product.category]}</span>
            </div>

            <div className="vitrine-product-card__content">
                <h3 className="vitrine-product-card__title">{product.name}</h3>
                <p className="vitrine-product-card__tagline">
                    {desc.tagline || product.description}
                </p>

                {desc.benefits && (
                    <ul className="vitrine-product-card__benefits">
                        {desc.benefits.map((b, i) => (
                            <li key={i}>
                                <span className="vitrine-check">✓</span>
                                {b}
                            </li>
                        ))}
                    </ul>
                )}
            </div>

            <div className="vitrine-product-card__footer">
                {langCount > 0 && (
                    <div className="vitrine-product-card__langs">
                        🌍 Disponível em <span className="vitrine-gold">{langCount} idioma{langCount !== 1 ? 's' : ''}</span>
                    </div>
                )}

                {available ? (
                    <div className="vitrine-product-card__ctas">
                        {/* Change #2: Only primary/full button */}
                        <a href={links.checkoutFull || links.checkoutBasic || links.url}
                            target="_blank" rel="noopener noreferrer"
                            className="vitrine-btn vitrine-btn--primary vitrine-btn--sm vitrine-btn--full">
                            Adquirir Agora →
                        </a>
                        {links.url && (
                            <a href={links.url} target="_blank" rel="noopener noreferrer"
                                className="vitrine-product-card__link">
                                Ver apresentação ↗
                            </a>
                        )}
                    </div>
                ) : (
                    <div className="vitrine-product-card__coming-soon">
                        🔔 Em breve
                    </div>
                )}
            </div>
        </article>
    );
}

function TestimonialsSection() {
    return (
        <section className="vitrine-section vitrine-section--surface">
            <div className="vitrine-container">
                <div className="vitrine-section__header">
                    <div className="vitrine-badge">Depoimentos</div>
                    <h2 className="vitrine-section__title vitrine-section__title--italic">
                        O que nossos <span className="vitrine-gold">alunos dizem</span>
                    </h2>
                    <div className="vitrine-divider-bar" />
                    <p className="vitrine-section__sub">
                        Junte-se a uma comunidade de estudiosos apaixonados pela Palavra.
                    </p>
                </div>

                <div className="vitrine-testimonials-grid">
                    {TESTIMONIALS.map((t, i) => (
                        <div key={i} className="vitrine-testimonial-card">
                            <div className="vitrine-testimonial-card__stars">
                                {'★★★★★'.split('').map((s, j) => (
                                    <span key={j} className="vitrine-star">{s}</span>
                                ))}
                            </div>
                            <p className="vitrine-testimonial-card__text">"{t.text}"</p>
                            <div className="vitrine-testimonial-card__author">
                                <div className="vitrine-testimonial-card__avatar">
                                    {t.name.charAt(0)}
                                </div>
                                <div>
                                    <div className="vitrine-testimonial-card__name">{t.name}</div>
                                    <div className="vitrine-testimonial-card__role">{t.role}</div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}

// ─── Change #6: New Final CTA buttons ─────────────────────────────────────────
function FinalCTA() {
    return (
        <section className="vitrine-final-cta" data-reveal>
            <div className="vitrine-final-cta__glow" />
            <div className="vitrine-container" style={{ textAlign: 'center', position: 'relative', zIndex: 1 }}>
                <h2 className="vitrine-final-cta__title">Sua jornada começa agora.</h2>
                <p className="vitrine-final-cta__sub">
                    Não aceite o conhecimento superficial. Una-se a milhares de alunos
                    que decidiram levar o estudo da Palavra ao próximo nível.
                </p>
                <div className="vitrine-final-cta__actions">
                    <a href="#" className="vitrine-btn vitrine-btn--primary vitrine-btn--xl vitrine-btn--glow">
                        Comprar Acesso Ilimitado
                    </a>
                    <a href="#" className="vitrine-btn vitrine-btn--outline vitrine-btn--xl">
                        Conversar com Consultor Teológico
                    </a>
                </div>
            </div>
        </section>
    );
}

// ─── Main Vitrine Page ────────────────────────────────────────────────────────
export default function Vitrine() {
    const [activeCategory, setActiveCategory] = useState('ALL');
    const allScrollRef = useRef(null);
    useScrollReveal();

    const filtered = activeCategory === 'ALL'
        ? products
        : products.filter(p => p.category === activeCategory);

    const needsAllScroll = filtered.length > 3;

    const scrollAll = (dir) => {
        if (!allScrollRef.current) return;
        const card = allScrollRef.current.querySelector('.vitrine-mini-card');
        const cardWidth = card?.offsetWidth || 360;
        allScrollRef.current.scrollBy({ left: dir * (cardWidth + 20), behavior: 'smooth' });
    };

    const available = products.filter(hasCheckout);
    const upcoming = products.filter(p => !hasCheckout(p));

    const highlighted = products.filter(p => HIGHLIGHTS[p.id] && hasCheckout(p));
    const launches = available.filter(p => !HIGHLIGHTS[p.id]).slice(0, 3);

    return (
        <div className="vitrine-page">
            <HeroSection />
            <ValuePropsSection />

            {/* ── Product Catalog ── */}
            <section id="catalogo" className="vitrine-section">
                <div className="vitrine-container">

                    {launches.length > 0 && (
                        <CarouselRow
                            title="Lançamentos"
                            products={launches}
                            badgeStyle="outline"
                        />
                    )}

                    {highlighted.length > 0 && (
                        <CarouselRow
                            title="Mais Vendidos"
                            products={highlighted}
                            badgeStyle="solid"
                        />
                    )}

                    {upcoming.length > 0 && (
                        <CarouselRow
                            title="Em Breve"
                            products={upcoming}
                            badgeStyle="coming"
                        />
                    )}

                    {/* ── All Products (single-row carousel) ── */}
                    <div className="vitrine-carousel-section">
                        <div className="vitrine-carousel__header">
                            <div>
                                <h2 className="vitrine-section__title vitrine-section__title--italic">
                                    Todos os <span className="vitrine-gold">Produtos</span>
                                </h2>
                                <p className="vitrine-section__sub">
                                    Explore nosso catálogo completo com filtros especializados.
                                </p>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                <div className="vitrine-filters">
                                    {FILTER_CATEGORIES.map(cat => (
                                        <button
                                            key={cat.id}
                                            onClick={() => setActiveCategory(cat.id)}
                                            className={`vitrine-filter-btn ${activeCategory === cat.id ? 'vitrine-filter-btn--active' : ''}`}
                                        >
                                            {cat.label}
                                        </button>
                                    ))}
                                </div>
                                {needsAllScroll && (
                                    <div className="vitrine-carousel__nav">
                                        <button onClick={() => scrollAll(-1)} className="vitrine-carousel__arrow">←</button>
                                        <button onClick={() => scrollAll(1)} className="vitrine-carousel__arrow">→</button>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div
                            ref={allScrollRef}
                            className={`vitrine-carousel-grid ${needsAllScroll ? 'vitrine-carousel-grid--scrollable' : ''}`}
                        >
                            {filtered.map(p => (
                                <MiniCard key={p.id} product={p} badgeStyle={HIGHLIGHTS[p.id] ? 'solid' : hasCheckout(p) ? 'outline' : 'coming'} />
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            <TestimonialsSection />
            <FinalCTA />
        </div>
    );
}
