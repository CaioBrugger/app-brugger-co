import { useState } from 'react';
import { products } from '../data/productsData';

// ─── Marketing Copy (gerado + otimizado com IA) ───────────────────────────────
const PRODUCT_COPY = {
    pentateuco: {
        tagline: 'Descubra os fundamentos eternos da fé no coração dos primeiros livros da Bíblia',
        benefits: [
            'Compreenda a Criação, a Queda e a Aliança com profundidade teológica',
            'Desvende as leis mosaicas e seu cumprimento em Cristo com clareza doutrinal',
            'Explore a jornada de Abraão a Moisés com contexto histórico completo',
            'Fortaleça sua base doutrinária com os fundamentos que sustentam toda a Escritura'
        ]
    },
    historicos: {
        tagline: 'Viva a história da conquista, da fidelidade e do poder de Deus através do Seu povo',
        benefits: [
            'Josué a Ester — toda a história do povo de Deus em profundidade',
            'Guerras, reis e exílio com arqueologia e contexto histórico integrados',
            'Lições de liderança e obediência com Juízes, Reis e Profetas',
            'Rute, Ester e outros personagens como prefiguras do plano redentor'
        ]
    },
    poeticos: {
        tagline: 'Encontre conforto, sabedoria e adoração nas páginas mais profundas da Escritura',
        benefits: [
            'Salmos explicados com análise poética que aprofunda o seu louvor',
            'Jó e o mistério do sofrimento humano respondido com a Palavra',
            'Provérbios e Eclesiastes com sabedoria prática para cada área da vida',
            'Cantares — o simbolismo do amor divino revelado em profundidade'
        ]
    },
    'profetas-maiores': {
        tagline: 'Ouça os maiores profetas e veja como cada palavra aponta para Jesus Cristo',
        benefits: [
            'Isaías — o Evangelho do AT com profecias messiânicas em detalhe',
            'Ezequiel e Daniel explicados com interpretação contextual e profética',
            'Jeremias e Lamentações — o coração de Deus pela justiça e restauração',
            'Conecte cada profecia ao seu cumprimento em Cristo de forma sistemática'
        ]
    },
    'profetas-menores': {
        tagline: 'Doze vozes proféticas que ainda falam com poder — e você precisa ouvi-las',
        benefits: [
            'Oséias a Malaquias — os 12 profetas em profundidade real',
            'A última voz do AT antes do silêncio profético de 400 anos',
            'Profecias sobre o Dia do Senhor, a restauração e a vinda do Messias',
            'Arrependimento, fidelidade e esperança para a Igreja de hoje'
        ]
    },
    evangelhos: {
        tagline: 'Conheça Jesus Cristo como Ele realmente é — através dos quatro retratos mais sagrados da história',
        benefits: [
            'Mateus, Marcos, Lucas e João versículo a versículo',
            'Paralelos e diferenças entre os quatro evangelhos explicados',
            'O contexto judaico e romano que moldou o ministério de Cristo',
            'A ressurreição — base e prova de toda a fé cristã comprovada'
        ]
    },
    atos: {
        tagline: 'O poder do Espírito Santo em ação — e como ele ainda age na sua Igreja hoje',
        benefits: [
            'Nascimento e expansão da Igreja primitiva com riqueza histórica',
            'Padrões de pregação e discipulado que a Igreja deve seguir hoje',
            'As viagens missionárias de Paulo com contexto geográfico e teológico',
            'O modelo apostólico de crescimento — ontem, hoje e sempre'
        ]
    },
    'cartas-paulo': {
        tagline: 'A teologia mais profunda do Novo Testamento, explicada com clareza que transforma vidas',
        benefits: [
            'Domine a justificação pela fé em Romanos com precisão exegética',
            'Vida cristã e dons espirituais pelas cartas aos Coríntios',
            'Graça, liberdade e maturidade espiritual de Gálatas a Filemom',
            'Base teológica sólida que sustenta o seu ministério e caminhada'
        ]
    },
    'cartas-universais': {
        tagline: 'Fé viva, perseverança real e esperança inabalável para os últimos dias',
        benefits: [
            'Hebreus — a superioridade de Cristo e a fé que persevera até o fim',
            'Tiago — a fé que age com princípios práticos que transformam',
            'Pedro — esperança sólida para enfrentar heresias e perseguições',
            'Construa teologia robusta sobre santificação, esperança e amor'
        ]
    },
    apocalipse: {
        tagline: 'O livro mais temido da Bíblia, explicado com clareza, contexto e esperança',
        benefits: [
            'Visões de João com interpretação histórica e profética equilibrada',
            'Selos, trombetas e cartas às sete igrejas sem medo nem confusão',
            'A mensagem central do Apocalipse: a vitória final de Cristo',
            'Esperança escatológica com visão clara do retorno glorioso de Jesus'
        ]
    },
    'combo-profetico': {
        tagline: 'O pacote completo para dominar a profecia bíblica do Antigo ao Novo Testamento',
        benefits: [
            'Profetas Maiores + Profetas Menores + Apocalipse em um só lugar',
            'Visão panorâmica coerente da profecia bíblica do início ao fim',
            'Comentários integrados e complementares ao longo da linha profética',
            'Ideal para pastores, professores e líderes que ensinam os últimos tempos'
        ]
    },
    'treinamento-obreiros': {
        tagline: 'O curso que transforma cristãos comprometidos em obreiros capacitados para o ministério',
        benefits: [
            'Formação ministerial: pregação, aconselhamento e liderança',
            'Conteúdo desenvolvido por teólogos e pastores experientes',
            'Cases reais, exercícios aplicados e material de estudo estruturado',
            'Certificado de conclusão para valorizar o seu currículo ministerial'
        ]
    },
    'geografia-biblica': {
        tagline: 'Veja a Bíblia ganhar vida quando você entende onde cada evento realmente aconteceu',
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

const CATEGORY_STYLE = {
    AT: { bg: 'rgba(201,169,98,0.12)', color: '#C9A962', border: 'rgba(201,169,98,0.3)' },
    NT: { bg: 'rgba(74,222,128,0.10)', color: '#4ADE80', border: 'rgba(74,222,128,0.28)' },
    COMBO: { bg: 'rgba(96,165,250,0.10)', color: '#60A5FA', border: 'rgba(96,165,250,0.28)' }
};

const HIGHLIGHTS = {
    evangelhos: { label: 'MAIS VENDIDO', color: '#4ADE80', textColor: '#0a2a18' },
    apocalipse: { label: 'MAIS ESTUDADO', color: '#C9A962', textColor: '#1a1200' },
    'combo-profetico': { label: 'MAIS POPULAR', color: '#60A5FA', textColor: '#001a2a' }
};

const FILTER_CATEGORIES = [
    { id: 'ALL', label: 'Todos os Produtos' },
    { id: 'AT', label: '📜 Antigo Testamento' },
    { id: 'NT', label: '✝️ Novo Testamento' },
    { id: 'COMBO', label: '📦 Combos & Cursos' }
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

// ─── ProductCard ──────────────────────────────────────────────────────────────
function ProductCard({ product }) {
    const [hovered, setHovered] = useState(false);
    const copy = PRODUCT_COPY[product.id] || {};
    const cat = CATEGORY_STYLE[product.category];
    const hl = HIGHLIGHTS[product.id];
    const links = getBestLinks(product);
    const hasLinks = !!(links.checkoutBasic || links.checkoutFull || links.url);
    const langCount = getLangCount(product);

    return (
        <article
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            style={{
                position: 'relative',
                background: hovered && hasLinks ? '#222228' : '#1A1A1F',
                border: `1px solid ${hovered && hasLinks ? '#3A3A45' : '#2A2A32'}`,
                borderRadius: '16px',
                padding: '1.5rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem',
                transition: 'all 0.2s ease',
                opacity: hasLinks ? 1 : 0.5,
                boxShadow: hovered && hasLinks
                    ? '0 0 0 1px rgba(201,169,98,0.12), 0 8px 28px rgba(0,0,0,0.38)'
                    : '0 2px 8px rgba(0,0,0,0.22)',
                minHeight: '380px'
            }}
        >
            {/* Highlight badge */}
            {hl && (
                <div style={{
                    position: 'absolute',
                    top: 0,
                    right: '1.25rem',
                    background: hl.color,
                    color: hl.textColor,
                    fontSize: '0.58rem',
                    fontWeight: 800,
                    letterSpacing: '0.12em',
                    padding: '0.22rem 0.65rem',
                    borderRadius: '0 0 7px 7px',
                    textTransform: 'uppercase'
                }}>
                    {hl.label}
                </div>
            )}

            {/* Icon + Category badge */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '2.25rem', lineHeight: 1 }}>{product.icon}</span>
                <span style={{
                    background: cat.bg,
                    color: cat.color,
                    border: `1px solid ${cat.border}`,
                    borderRadius: '5px',
                    fontSize: '0.6rem',
                    fontWeight: 700,
                    letterSpacing: '0.09em',
                    padding: '0.22rem 0.6rem',
                    textTransform: 'uppercase'
                }}>
                    {CATEGORY_LABELS[product.category]}
                </span>
            </div>

            {/* Title + Tagline */}
            <div>
                <h3 style={{
                    fontFamily: "'DM Serif Display', Georgia, serif",
                    fontSize: '1.3rem',
                    color: '#FAFAFA',
                    fontWeight: 400,
                    lineHeight: 1.25,
                    marginBottom: '0.4rem'
                }}>
                    {product.name}
                </h3>
                <p style={{
                    fontSize: '0.81rem',
                    color: '#A0A0A8',
                    lineHeight: 1.55
                }}>
                    {copy.tagline || product.description}
                </p>
            </div>

            {/* Benefits list */}
            {copy.benefits && (
                <ul style={{
                    listStyle: 'none',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.38rem',
                    flex: 1
                }}>
                    {copy.benefits.map((benefit, i) => (
                        <li key={i} style={{
                            display: 'flex',
                            gap: '0.5rem',
                            alignItems: 'flex-start',
                            fontSize: '0.79rem',
                            color: '#A0A0A8',
                            lineHeight: 1.45
                        }}>
                            <span style={{
                                color: '#4ADE80',
                                flexShrink: 0,
                                fontWeight: 700,
                                fontSize: '0.82rem',
                                marginTop: '0.05rem'
                            }}>✓</span>
                            {benefit}
                        </li>
                    ))}
                </ul>
            )}

            {/* Divider */}
            <div style={{ borderTop: '1px solid #2A2A32' }} />

            {/* Footer: lang count + CTAs */}
            <div>
                {langCount > 0 && (
                    <div style={{
                        fontSize: '0.71rem',
                        color: '#6B6B75',
                        marginBottom: '0.75rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.3rem'
                    }}>
                        🌍 Disponível em{' '}
                        <span style={{ color: '#C9A962', fontWeight: 600 }}>
                            {langCount} idioma{langCount !== 1 ? 's' : ''}
                        </span>
                    </div>
                )}

                {hasLinks ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
                        {/* Checkout buttons */}
                        {(links.checkoutBasic || links.checkoutFull) && (
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                {links.checkoutBasic && (
                                    <a
                                        href={links.checkoutBasic}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        style={{
                                            flex: 1,
                                            textAlign: 'center',
                                            background: '#C9A962',
                                            color: '#0C0C0E',
                                            fontWeight: 700,
                                            fontSize: '0.8rem',
                                            padding: '0.62rem 0.75rem',
                                            borderRadius: '10px',
                                            textDecoration: 'none',
                                            fontFamily: "'DM Sans', sans-serif",
                                            transition: 'background 0.15s ease',
                                            display: 'block'
                                        }}
                                        onMouseEnter={e => e.currentTarget.style.background = '#DFC07A'}
                                        onMouseLeave={e => e.currentTarget.style.background = '#C9A962'}
                                    >
                                        {links.checkoutFull ? 'Plano Básico' : 'Adquirir Agora'} →
                                    </a>
                                )}
                                {links.checkoutFull && (
                                    <a
                                        href={links.checkoutFull}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        style={{
                                            flex: 1,
                                            textAlign: 'center',
                                            background: 'transparent',
                                            color: '#C9A962',
                                            border: '1px solid #C9A962',
                                            fontWeight: 700,
                                            fontSize: '0.8rem',
                                            padding: '0.62rem 0.75rem',
                                            borderRadius: '10px',
                                            textDecoration: 'none',
                                            fontFamily: "'DM Sans', sans-serif",
                                            display: 'block'
                                        }}
                                        onMouseEnter={e => {
                                            e.currentTarget.style.background = 'rgba(201,169,98,0.1)';
                                        }}
                                        onMouseLeave={e => {
                                            e.currentTarget.style.background = 'transparent';
                                        }}
                                    >
                                        ✦ Plano Completo
                                    </a>
                                )}
                            </div>
                        )}

                        {/* "Ver produto" only when no checkout */}
                        {links.url && !links.checkoutBasic && !links.checkoutFull && (
                            <a
                                href={links.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{
                                    textAlign: 'center',
                                    background: '#C9A962',
                                    color: '#0C0C0E',
                                    fontWeight: 700,
                                    fontSize: '0.8rem',
                                    padding: '0.62rem 0.75rem',
                                    borderRadius: '10px',
                                    textDecoration: 'none',
                                    display: 'block'
                                }}
                            >
                                Ver Produto →
                            </a>
                        )}

                        {/* Subtle "see presentation" link */}
                        {links.url && (links.checkoutBasic || links.checkoutFull) && (
                            <a
                                href={links.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{
                                    textAlign: 'center',
                                    color: '#6B6B75',
                                    fontSize: '0.73rem',
                                    textDecoration: 'none',
                                    padding: '0.2rem',
                                    display: 'block',
                                    transition: 'color 0.15s'
                                }}
                                onMouseEnter={e => e.currentTarget.style.color = '#A0A0A8'}
                                onMouseLeave={e => e.currentTarget.style.color = '#6B6B75'}
                            >
                                Ver apresentação ↗
                            </a>
                        )}
                    </div>
                ) : (
                    <div style={{
                        textAlign: 'center',
                        padding: '0.7rem',
                        background: 'rgba(255,255,255,0.025)',
                        border: '1px dashed rgba(255,255,255,0.08)',
                        borderRadius: '10px',
                        fontSize: '0.8rem',
                        color: '#6B6B75',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.4rem'
                    }}>
                        <span>🔔</span> Em breve
                    </div>
                )}
            </div>
        </article>
    );
}

// ─── StatsItem ────────────────────────────────────────────────────────────────
function StatItem({ value, label }) {
    return (
        <div style={{ textAlign: 'center' }}>
            <div style={{
                fontFamily: "'DM Serif Display', Georgia, serif",
                fontSize: '1.75rem',
                color: '#C9A962',
                lineHeight: 1
            }}>
                {value}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#6B6B75', marginTop: '0.2rem' }}>
                {label}
            </div>
        </div>
    );
}

// ─── ValueProp ────────────────────────────────────────────────────────────────
function ValueProp({ icon, title, desc }) {
    return (
        <div style={{
            background: '#131316',
            border: '1px solid #2A2A32',
            borderRadius: '10px',
            padding: '1.125rem 1.25rem',
            display: 'flex',
            gap: '0.875rem',
            alignItems: 'flex-start'
        }}>
            <span style={{ fontSize: '1.4rem', flexShrink: 0, lineHeight: 1, marginTop: '0.1rem' }}>
                {icon}
            </span>
            <div>
                <div style={{
                    fontWeight: 600,
                    fontSize: '0.875rem',
                    color: '#FAFAFA',
                    marginBottom: '0.2rem'
                }}>
                    {title}
                </div>
                <div style={{ fontSize: '0.78rem', color: '#A0A0A8', lineHeight: 1.5 }}>
                    {desc}
                </div>
            </div>
        </div>
    );
}

// ─── SectionDivider ───────────────────────────────────────────────────────────
function SectionDivider({ label, count }) {
    return (
        <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            marginBottom: '1.25rem',
            marginTop: '0.5rem'
        }}>
            <div style={{ flex: 1, height: '1px', background: '#2A2A32' }} />
            <span style={{
                fontSize: '0.72rem',
                fontWeight: 700,
                color: '#6B6B75',
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                whiteSpace: 'nowrap'
            }}>
                {label} {count !== undefined && `· ${count} produto${count !== 1 ? 's' : ''}`}
            </span>
            <div style={{ flex: 1, height: '1px', background: '#2A2A32' }} />
        </div>
    );
}

// ─── Main Vitrine Page ────────────────────────────────────────────────────────
export default function Vitrine() {
    const [activeCategory, setActiveCategory] = useState('ALL');

    const filtered = activeCategory === 'ALL'
        ? products
        : products.filter(p => p.category === activeCategory);

    const availableCount = filtered.filter(p => {
        const links = getBestLinks(p);
        return links.checkoutBasic || links.checkoutFull || links.url;
    }).length;

    return (
        <div style={{ maxWidth: '1100px' }}>

            {/* ── Page Header ── */}
            <div style={{ marginBottom: '2rem' }}>
                <div style={{
                    fontSize: '0.7rem',
                    color: '#6B6B75',
                    letterSpacing: '0.14em',
                    textTransform: 'uppercase',
                    marginBottom: '0.4rem'
                }}>
                    ✦ Brugger CO
                </div>
                <h1 style={{
                    fontFamily: "'DM Serif Display', Georgia, serif",
                    fontSize: '2rem',
                    fontWeight: 400,
                    color: '#FAFAFA',
                    marginBottom: '0.45rem'
                }}>
                    Vitrine de Produtos
                </h1>
                <p style={{ color: '#A0A0A8', fontSize: '0.9rem' }}>
                    Nossa coleção completa de materiais de estudo bíblico premium — pronta para compartilhar com clientes.
                </p>
            </div>

            {/* ── Hero Banner ── */}
            <div style={{
                background: 'linear-gradient(135deg, rgba(201,169,98,0.07) 0%, rgba(201,169,98,0.015) 60%, transparent 100%)',
                border: '1px solid rgba(201,169,98,0.18)',
                borderRadius: '16px',
                padding: '2.75rem 2.5rem',
                marginBottom: '1.5rem',
                position: 'relative',
                overflow: 'hidden'
            }}>
                {/* Ornament */}
                <div style={{
                    position: 'absolute',
                    right: '2rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    fontSize: '10rem',
                    opacity: 0.035,
                    lineHeight: 1,
                    userSelect: 'none',
                    fontFamily: "'DM Serif Display', Georgia, serif",
                    color: '#C9A962'
                }}>
                    ✦
                </div>

                <div style={{ maxWidth: '580px', position: 'relative' }}>
                    {/* Badge */}
                    <div style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.4rem',
                        background: 'rgba(201,169,98,0.1)',
                        border: '1px solid rgba(201,169,98,0.25)',
                        color: '#C9A962',
                        borderRadius: '100px',
                        padding: '0.3rem 1rem',
                        fontSize: '0.7rem',
                        fontWeight: 700,
                        letterSpacing: '0.12em',
                        textTransform: 'uppercase',
                        marginBottom: '1.25rem'
                    }}>
                        ✦ Coleção Completa Saber Cristão
                    </div>

                    <h2 style={{
                        fontFamily: "'DM Serif Display', Georgia, serif",
                        fontSize: '2.5rem',
                        fontWeight: 400,
                        lineHeight: 1.2,
                        marginBottom: '1rem',
                        color: '#FAFAFA'
                    }}>
                        Mergulhe nas Profundezas da{' '}
                        <span style={{ color: '#C9A962' }}>Palavra de Deus</span>{' '}
                        com a Clareza que Você Sempre Buscou
                    </h2>

                    <p style={{
                        fontSize: '0.97rem',
                        color: '#A0A0A8',
                        lineHeight: 1.75,
                        marginBottom: '2rem'
                    }}>
                        A Bíblia Explicativa transforma cada livro sagrado em um estudo profundo,
                        acessível e transformador — para quem leva a fé a sério.
                    </p>

                    <div style={{ display: 'flex', gap: '2.5rem' }}>
                        <StatItem value="13" label="Produtos" />
                        <StatItem value="6" label="Idiomas" />
                        <StatItem value="+10 mil" label="Alunos" />
                    </div>
                </div>
            </div>

            {/* ── Value Props ── */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '0.875rem',
                marginBottom: '2.25rem'
            }}>
                <ValueProp
                    icon="📖"
                    title="Exegese Sem Complicação"
                    desc="Comentários teológicos rigorosos em linguagem clara, sem perder a profundidade que a Palavra merece"
                />
                <ValueProp
                    icon="🏛️"
                    title="Contexto Histórico e Cultural"
                    desc="Entenda cada passagem no contexto original — quem escreveu, para quem, quando e por quê"
                />
                <ValueProp
                    icon="👑"
                    title="Nível Ministerial"
                    desc="Desenvolvido para pastores, líderes e cristãos que ensinam a Palavra com autoridade e convicção"
                />
            </div>

            {/* ── Category Filter ── */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                marginBottom: '1.75rem',
                flexWrap: 'wrap'
            }}>
                {FILTER_CATEGORIES.map(cat => {
                    const isActive = activeCategory === cat.id;
                    return (
                        <button
                            key={cat.id}
                            onClick={() => setActiveCategory(cat.id)}
                            style={{
                                background: isActive ? '#C9A962' : '#131316',
                                color: isActive ? '#0C0C0E' : '#A0A0A8',
                                border: `1px solid ${isActive ? 'transparent' : '#2A2A32'}`,
                                borderRadius: '100px',
                                padding: '0.45rem 1.125rem',
                                fontSize: '0.83rem',
                                fontWeight: isActive ? 700 : 500,
                                cursor: 'pointer',
                                fontFamily: "'DM Sans', sans-serif",
                                transition: 'all 0.15s ease'
                            }}
                        >
                            {cat.label}
                        </button>
                    );
                })}
                <span style={{
                    marginLeft: 'auto',
                    fontSize: '0.75rem',
                    color: '#6B6B75'
                }}>
                    {availableCount} disponíve{availableCount !== 1 ? 'is' : 'l'} de {filtered.length}
                </span>
            </div>

            {/* ── Products Grid ── */}
            {activeCategory === 'ALL' ? (
                <>
                    {/* AT Section */}
                    <SectionDivider
                        label="Antigo Testamento"
                        count={products.filter(p => p.category === 'AT').length}
                    />
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(310px, 1fr))',
                        gap: '1.125rem',
                        marginBottom: '2rem'
                    }}>
                        {products.filter(p => p.category === 'AT').map(p => (
                            <ProductCard key={p.id} product={p} />
                        ))}
                    </div>

                    {/* NT Section */}
                    <SectionDivider
                        label="Novo Testamento"
                        count={products.filter(p => p.category === 'NT').length}
                    />
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(310px, 1fr))',
                        gap: '1.125rem',
                        marginBottom: '2rem'
                    }}>
                        {products.filter(p => p.category === 'NT').map(p => (
                            <ProductCard key={p.id} product={p} />
                        ))}
                    </div>

                    {/* COMBO Section */}
                    <SectionDivider
                        label="Combos & Cursos"
                        count={products.filter(p => p.category === 'COMBO').length}
                    />
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(310px, 1fr))',
                        gap: '1.125rem',
                        marginBottom: '2.5rem'
                    }}>
                        {products.filter(p => p.category === 'COMBO').map(p => (
                            <ProductCard key={p.id} product={p} />
                        ))}
                    </div>
                </>
            ) : (
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(310px, 1fr))',
                    gap: '1.125rem',
                    marginBottom: '2.5rem'
                }}>
                    {filtered.map(p => <ProductCard key={p.id} product={p} />)}
                </div>
            )}

            {/* ── Bottom CTA ── */}
            <div style={{
                textAlign: 'center',
                padding: '2.5rem 2rem',
                background: 'linear-gradient(135deg, rgba(201,169,98,0.06) 0%, rgba(201,169,98,0.02) 100%)',
                border: '1px solid rgba(201,169,98,0.14)',
                borderRadius: '16px',
                marginBottom: '1.5rem'
            }}>
                <div style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '48px',
                    height: '48px',
                    background: 'rgba(201,169,98,0.1)',
                    border: '1px solid rgba(201,169,98,0.2)',
                    borderRadius: '50%',
                    fontSize: '1.4rem',
                    marginBottom: '1rem'
                }}>
                    ✉️
                </div>
                <h3 style={{
                    fontFamily: "'DM Serif Display', Georgia, serif",
                    fontSize: '1.6rem',
                    fontWeight: 400,
                    color: '#FAFAFA',
                    marginBottom: '0.6rem',
                    lineHeight: 1.3
                }}>
                    Sua jornada nas profundezas da{' '}
                    <span style={{ color: '#C9A962' }}>Palavra de Deus</span>{' '}
                    começa agora
                </h3>
                <p style={{
                    fontSize: '0.9rem',
                    color: '#A0A0A8',
                    maxWidth: '480px',
                    margin: '0 auto',
                    lineHeight: 1.7
                }}>
                    Junte-se a milhares de cristãos que já transformaram o seu estudo bíblico.
                    Escolha o seu produto, aprofunde a sua fé e seja equipado para ensinar a
                    Palavra com autoridade e clareza.
                </p>
            </div>
        </div>
    );
}
