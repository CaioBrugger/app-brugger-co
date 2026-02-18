import { useState, useCallback, useRef } from 'react';

// ─── Color Data ──────────────────────────────────────────
const colorGroups = [
    {
        title: 'Fundos (Backgrounds)',
        colors: [
            { token: '--color-bg', hex: '#0C0C0E', label: 'Background principal' },
            { token: '--color-surface', hex: '#131316', label: 'Cards, seções alternadas' },
            { token: '--color-surface-2', hex: '#1A1A1F', label: 'Cards elevados, containers' },
            { token: '--color-surface-3', hex: '#222228', label: 'Hover, elementos interativos' },
        ]
    },
    {
        title: 'Bordas',
        colors: [
            { token: '--color-border', hex: '#2A2A32', label: 'Bordas padrão, divisores' },
            { token: '--color-border-light', hex: '#3A3A45', label: 'Bordas hover, destaque sutil' },
        ]
    },
    {
        title: 'Texto',
        colors: [
            { token: '--color-text', hex: '#FAFAFA', label: 'Títulos, headlines' },
            { token: '--color-text-secondary', hex: '#A0A0A8', label: 'Descrições, parágrafos' },
            { token: '--color-text-muted', hex: '#6B6B75', label: 'Labels, captions' },
        ]
    },
    {
        title: 'Destaque (Dourado)',
        colors: [
            { token: '--color-accent', hex: '#C9A962', label: 'CTAs, preço, destaques' },
            { token: '--color-accent-light', hex: '#DFC07A', label: 'Hover de botões' },
            { token: '--color-accent-dark', hex: '#A88C4A', label: 'Pressed, bordas douradas' },
        ]
    },
    {
        title: 'Funcionais',
        colors: [
            { token: '--color-success', hex: '#4ADE80', label: 'Checks, confirmações' },
            { token: '--color-error', hex: '#F87171', label: 'Preço riscado, alertas' },
            { token: '--color-info', hex: '#60A5FA', label: 'Info, links secundários' },
        ]
    }
];

// ─── Typography Scale ────────────────────────────────────
const typeScale = [
    { element: 'H1 — Headline', size: '48–56px', mobile: '32–36px', weight: 'Normal', family: 'DM Serif Display', lineHeight: '1.2' },
    { element: 'H2 — Seção', size: '40–48px', mobile: '28–32px', weight: 'Normal', family: 'DM Serif Display', lineHeight: '1.2' },
    { element: 'H3 — Subtítulo', size: '24–28px', mobile: '20–24px', weight: 'Normal', family: 'DM Serif Display', lineHeight: '1.3' },
    { element: 'Body', size: '16–18px', mobile: '15–16px', weight: '400', family: 'DM Sans', lineHeight: '1.7' },
    { element: 'Label', size: '12–14px', mobile: '11–12px', weight: '600', family: 'DM Sans', lineHeight: '1.4' },
    { element: 'Botão CTA', size: '16–18px', mobile: '15–16px', weight: '600', family: 'DM Sans', lineHeight: '1.4' },
    { element: 'Preço Grande', size: '64–80px', mobile: '48–56px', weight: '700', family: 'DM Sans', lineHeight: '1.0' },
];

// ─── Spacing Tokens ──────────────────────────────────────
const spacingTokens = [
    { token: '--spacing-xs', value: '0.5rem', px: '8px', use: 'Gap entre ícone e texto' },
    { token: '--spacing-sm', value: '1rem', px: '16px', use: 'Padding de labels e tags' },
    { token: '--spacing-md', value: '1.5rem', px: '24px', use: 'Gap dentro de cards' },
    { token: '--spacing-lg', value: '2rem', px: '32px', use: 'Padding interno de cards' },
    { token: '--spacing-xl', value: '3rem', px: '48px', use: 'Espaço entre blocos' },
    { token: '--spacing-2xl', value: '5rem', px: '80px', use: 'Padding vertical de seções' },
    { token: '--spacing-3xl', value: '7rem', px: '112px', use: 'Separação entre seções' },
];

// ─── Radius & Shadows ────────────────────────────────────
const radiusTokens = [
    { token: '--radius-sm', value: '6px', use: 'Tags, badges, inputs' },
    { token: '--radius-md', value: '10px', use: 'Botões, cards pequenos' },
    { token: '--radius-lg', value: '16px', use: 'Cards grandes, imagens' },
];

const shadowTokens = [
    { token: '--shadow-sm', value: '0 2px 8px rgba(0,0,0,0.3)', use: 'Cards padrão' },
    { token: '--shadow-md', value: '0 4px 16px rgba(0,0,0,0.4)', use: 'Cards hover' },
    { token: '--shadow-lg', value: '0 8px 32px rgba(0,0,0,0.5)', use: 'Modais, produto' },
];

// ─── Breakpoints ─────────────────────────────────────────
const breakpoints = [
    { name: 'Mobile', value: '< 768px', cols: '1 coluna', notes: 'Fontes menores, sticky bar' },
    { name: 'Tablet', value: '768–1024px', cols: '2 colunas', notes: 'Ajustes intermediários' },
    { name: 'Desktop', value: '> 1024px', cols: '3 colunas', notes: 'Layout completo' },
];

// ─── Checklist ───────────────────────────────────────────
const checklistItems = [
    'Background da página é #0C0C0E',
    'Fonte dos títulos é DM Serif Display',
    'Fonte do corpo é DM Sans',
    'Cor de destaque é dourado #C9A962',
    'Labels de seção em CAPS com letter-spacing',
    'Botão CTA é dourado com texto escuro',
    'Cards usam --color-surface com borda --color-border',
    'Preço riscado + preço final dourado grande',
    'Barra fixa de compra funciona no scroll',
    'Pelo menos 1 citação bíblica como separador',
    'Seção de garantia 30 dias presente',
    'FAQ accordion presente',
    'Footer minimalista com copyright + links',
    'Responsivo testado em mobile',
];

// ─── CSS Variables Block ─────────────────────────────────
const cssVarsBlock = `:root {
  /* Backgrounds */
  --color-bg: #0C0C0E;
  --color-surface: #131316;
  --color-surface-2: #1A1A1F;
  --color-surface-3: #222228;

  /* Borders */
  --color-border: #2A2A32;
  --color-border-light: #3A3A45;

  /* Text */
  --color-text: #FAFAFA;
  --color-text-secondary: #A0A0A8;
  --color-text-muted: #6B6B75;

  /* Accent (Gold) */
  --color-accent: #C9A962;
  --color-accent-light: #DFC07A;
  --color-accent-dark: #A88C4A;

  /* Functional */
  --color-success: #4ADE80;
  --color-error: #F87171;

  /* Typography */
  --font-heading: 'DM Serif Display', Georgia, serif;
  --font-body: 'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif;

  /* Spacing */
  --spacing-xs: 0.5rem;
  --spacing-sm: 1rem;
  --spacing-md: 1.5rem;
  --spacing-lg: 2rem;
  --spacing-xl: 3rem;
  --spacing-2xl: 5rem;
  --spacing-3xl: 7rem;

  /* Border Radius */
  --radius-sm: 6px;
  --radius-md: 10px;
  --radius-lg: 16px;

  /* Shadows */
  --shadow-sm: 0 2px 8px rgba(0, 0, 0, 0.3);
  --shadow-md: 0 4px 16px rgba(0, 0, 0, 0.4);
  --shadow-lg: 0 8px 32px rgba(0, 0, 0, 0.5);
}`;

// ─── FAQ Data ────────────────────────────────────────────
const faqItems = [
    { q: 'Posso personalizar o design system?', a: 'Sim, todos os tokens são CSS Custom Properties e podem ser sobrescritos no :root ou em qualquer escopo.' },
    { q: 'Funciona com Tailwind CSS?', a: 'Sim. Os tokens podem ser mapeados para o tailwind.config.js na seção theme.extend.' },
    { q: 'Quais componentes estão incluídos?', a: 'Botões (primário, secundário, outline), cards, badges, blockquotes, FAQ accordion, barra sticky e seção de preço.' },
];

export default function DesignSystemPage() {
    const [copiedToken, setCopiedToken] = useState(null);
    const [checkedItems, setCheckedItems] = useState(new Set());
    const [openFaq, setOpenFaq] = useState(null);
    const [toast, setToast] = useState({ msg: '', visible: false });
    const toastTimer = useRef(null);

    const showToast = useCallback((msg) => {
        clearTimeout(toastTimer.current);
        setToast({ msg, visible: true });
        toastTimer.current = setTimeout(() => setToast(t => ({ ...t, visible: false })), 2000);
    }, []);

    const copyToClipboard = useCallback((text, label) => {
        navigator.clipboard.writeText(text);
        setCopiedToken(label);
        showToast(`${label} copiado!`);
        setTimeout(() => setCopiedToken(null), 2000);
    }, [showToast]);

    const toggleCheck = (idx) => {
        setCheckedItems(prev => {
            const next = new Set(prev);
            next.has(idx) ? next.delete(idx) : next.add(idx);
            return next;
        });
    };

    // Active section tracking for side nav
    const [activeSection, setActiveSection] = useState('filosofia');
    const sections = [
        { id: 'filosofia', label: 'Filosofia', icon: '✦' },
        { id: 'cores', label: 'Cores', icon: '🎨' },
        { id: 'tipografia', label: 'Tipografia', icon: '🔤' },
        { id: 'espacamento', label: 'Espaçamento', icon: '📏' },
        { id: 'radius-sombras', label: 'Radius & Sombras', icon: '◻️' },
        { id: 'componentes', label: 'Componentes', icon: '🧩' },
        { id: 'animacoes', label: 'Animações', icon: '✨' },
        { id: 'responsividade', label: 'Responsividade', icon: '📱' },
        { id: 'css-vars', label: 'CSS Variables', icon: '📋' },
        { id: 'checklist', label: 'Checklist', icon: '✅' },
    ];

    const scrollTo = (id) => {
        setActiveSection(id);
        document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };

    return (
        <div className="agents-page">
            {/* Hero */}
            <div className="agents-hero">
                <div className="agents-hero-content">
                    <div className="agents-hero-badge">Design System</div>
                    <h1 className="agents-hero-title">
                        Dark Luxury<br />
                        <span className="agents-hero-accent">Biblical</span>
                    </h1>
                    <p className="agents-hero-desc">
                        Sistema visual completo para criação de interfaces premium.
                        Design escuro, dourado e sofisticado com autoridade teológica e alto valor percebido.
                    </p>
                </div>
                <div className="agents-hero-stats">
                    <div className="agents-hero-stat">
                        <span className="agents-hero-stat-value">{colorGroups.reduce((s, g) => s + g.colors.length, 0)}</span>
                        <span className="agents-hero-stat-label">Tokens de cor</span>
                    </div>
                    <div className="agents-hero-stat-divider" />
                    <div className="agents-hero-stat">
                        <span className="agents-hero-stat-value">2</span>
                        <span className="agents-hero-stat-label">Famílias</span>
                    </div>
                    <div className="agents-hero-stat-divider" />
                    <div className="agents-hero-stat">
                        <span className="agents-hero-stat-value">{spacingTokens.length + radiusTokens.length + shadowTokens.length}</span>
                        <span className="agents-hero-stat-label">Design Tokens</span>
                    </div>
                </div>
            </div>

            {/* Section Nav */}
            <div className="ds-section-nav">
                {sections.map(s => (
                    <button key={s.id} className={`ds-section-nav-item ${activeSection === s.id ? 'active' : ''}`} onClick={() => scrollTo(s.id)}>
                        <span>{s.icon}</span> {s.label}
                    </button>
                ))}
            </div>

            {/* ── 1. FILOSOFIA ──────────────────────────────── */}
            <section id="filosofia" className="ds-section">
                <div className="ds-section-label">01 — Filosofia Visual</div>
                <h2 className="ds-section-title">Princípios Fundamentais</h2>
                <div className="ds-principles-grid">
                    {[
                        { icon: '🌑', title: 'Dark Mode Completo', desc: 'Fundo escuro predominante em todas as telas e seções.' },
                        { icon: '✦', title: 'Acentos Dourados', desc: 'Dourado para CTAs, preços e palavras-chave — remetendo a ouro e realeza bíblica.' },
                        { icon: '🔤', title: 'Tipografia Dual', desc: 'Serifada nos títulos (elegância clássica) e sans-serif no corpo (legibilidade).' },
                        { icon: '💨', title: 'Espaçamento Generoso', desc: 'A página "respira" — whitespace é intencional e premium.' },
                        { icon: '🎬', title: 'Imagens Cinematográficas', desc: 'Fotos de alta qualidade, tons quentes, estilo épico/bíblico.' },
                        { icon: '🎯', title: 'Minimalismo Funcional', desc: 'Cada elemento tem um propósito de conversão — zero decoração vazia.' },
                    ].map((p, i) => (
                        <div key={i} className="ds-principle-card" style={{ '--delay': `${i * 70}ms` }}>
                            <span className="ds-principle-icon">{p.icon}</span>
                            <h4 className="ds-principle-title">{p.title}</h4>
                            <p className="ds-principle-desc">{p.desc}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* ── 2. PALETA DE CORES ────────────────────────── */}
            <section id="cores" className="ds-section">
                <div className="ds-section-label">02 — Paleta de Cores</div>
                <h2 className="ds-section-title">Cores do Sistema</h2>
                <p className="ds-section-desc">Clique em qualquer swatch para copiar o valor hex.</p>

                {colorGroups.map((group, gi) => (
                    <div key={gi} className="ds-color-group">
                        <h3 className="ds-color-group-title">{group.title}</h3>
                        <div className="ds-color-swatches">
                            {group.colors.map((c, ci) => (
                                <button key={ci} className={`ds-swatch ${copiedToken === c.token ? 'copied' : ''}`}
                                    onClick={() => copyToClipboard(c.hex, c.token)}
                                    title={`Copiar ${c.hex}`}
                                >
                                    <div className="ds-swatch-color" style={{ background: c.hex, border: c.hex === '#0C0C0E' ? '1px solid #2A2A32' : 'none' }} />
                                    <div className="ds-swatch-info">
                                        <code className="ds-swatch-hex">{c.hex}</code>
                                        <span className="ds-swatch-token">{c.token}</span>
                                        <span className="ds-swatch-label">{c.label}</span>
                                    </div>
                                    {copiedToken === c.token && <span className="ds-swatch-check">✓</span>}
                                </button>
                            ))}
                        </div>
                    </div>
                ))}

                {/* Color rules */}
                <div className="ds-rules-box">
                    <h4>Regras de Aplicação</h4>
                    <ul>
                        <li><span className="ds-rule-no">✗</span> Nunca usar cores claras ou brancas como fundo de seção</li>
                        <li><span className="ds-rule-yes">✓</span> Dourado é EXCLUSIVO para: botões CTA, preço final, highlights no título</li>
                        <li><span className="ds-rule-yes">✓</span> Texto do corpo SEMPRE em <code>--color-text-secondary</code></li>
                        <li><span className="ds-rule-yes">✓</span> Ícones de check (✓) usam <code>--color-success</code></li>
                    </ul>
                </div>
            </section>

            {/* ── 3. TIPOGRAFIA ─────────────────────────────── */}
            <section id="tipografia" className="ds-section">
                <div className="ds-section-label">03 — Tipografia</div>
                <h2 className="ds-section-title">Sistema Tipográfico</h2>

                <div className="ds-type-families">
                    <div className="ds-type-family">
                        <div className="ds-type-family-sample" style={{ fontFamily: "'DM Serif Display', Georgia, serif", fontSize: '2.5rem' }}>
                            DM Serif Display
                        </div>
                        <div className="ds-type-family-meta">
                            <code>--font-heading</code>
                            <span>Títulos H1, H2, H3 • Citações bíblicas</span>
                        </div>
                    </div>
                    <div className="ds-type-family">
                        <div className="ds-type-family-sample" style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '2rem', fontWeight: 400 }}>
                            DM Sans — Regular, Medium, Bold
                        </div>
                        <div className="ds-type-family-meta">
                            <code>--font-body</code>
                            <span>Corpo, botões, labels, preços</span>
                        </div>
                    </div>
                </div>

                <h3 className="ds-subsection-title">Escala Tipográfica</h3>
                <div className="ds-type-scale">
                    {typeScale.map((t, i) => (
                        <div key={i} className="ds-type-scale-row">
                            <div className="ds-type-scale-sample"
                                style={{
                                    fontFamily: t.family === 'DM Serif Display' ? "'DM Serif Display', Georgia, serif" : "'DM Sans', sans-serif",
                                    fontSize: t.size.split('–')[0],
                                    fontWeight: t.weight === 'Normal' ? 400 : parseInt(t.weight),
                                    lineHeight: t.lineHeight,
                                    maxWidth: '100%',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap',
                                }}
                            >
                                {t.element.split(' — ')[0]}
                            </div>
                            <div className="ds-type-scale-meta">
                                <span className="ds-type-scale-name">{t.element}</span>
                                <span className="ds-type-scale-spec">{t.size} / {t.mobile} · {t.family} · {t.weight}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* ── 4. ESPAÇAMENTO ────────────────────────────── */}
            <section id="espacamento" className="ds-section">
                <div className="ds-section-label">04 — Espaçamento</div>
                <h2 className="ds-section-title">Tokens de Espaçamento</h2>

                <div className="ds-spacing-list">
                    {spacingTokens.map((s, i) => (
                        <div key={i} className="ds-spacing-row" onClick={() => copyToClipboard(s.value, s.token)}>
                            <div className="ds-spacing-bar-wrap">
                                <div className="ds-spacing-bar" style={{ width: s.px }} />
                            </div>
                            <div className="ds-spacing-info">
                                <code>{s.token}</code>
                                <span className="ds-spacing-value">{s.value} ({s.px})</span>
                                <span className="ds-spacing-use">{s.use}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* ── 5. RADIUS & SOMBRAS ───────────────────────── */}
            <section id="radius-sombras" className="ds-section">
                <div className="ds-section-label">05 — Border Radius & Sombras</div>
                <h2 className="ds-section-title">Forma e Profundidade</h2>

                <div className="ds-radius-shadow-grid">
                    <div>
                        <h3 className="ds-subsection-title">Border Radius</h3>
                        <div className="ds-radius-boxes">
                            {radiusTokens.map((r, i) => (
                                <div key={i} className="ds-radius-box" onClick={() => copyToClipboard(r.value, r.token)}>
                                    <div className="ds-radius-preview" style={{ borderRadius: r.value }} />
                                    <code>{r.token}: {r.value}</code>
                                    <span>{r.use}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div>
                        <h3 className="ds-subsection-title">Sombras</h3>
                        <div className="ds-shadow-boxes">
                            {shadowTokens.map((s, i) => (
                                <div key={i} className="ds-shadow-box" onClick={() => copyToClipboard(s.value, s.token)}>
                                    <div className="ds-shadow-preview" style={{ boxShadow: s.value }} />
                                    <code>{s.token}</code>
                                    <span>{s.use}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* ── 6. COMPONENTES ────────────────────────────── */}
            <section id="componentes" className="ds-section">
                <div className="ds-section-label">06 — Componentes</div>
                <h2 className="ds-section-title">Biblioteca de Componentes</h2>

                {/* Buttons */}
                <div className="ds-component-block">
                    <h3 className="ds-subsection-title">Botões</h3>
                    <div className="ds-component-preview">
                        <button className="ds-btn-primary">Adquirir Agora</button>
                        <button className="ds-btn-secondary">Saiba Mais</button>
                        <button className="ds-btn-outline">Ver Detalhes</button>
                        <button className="ds-btn-primary" disabled>Desabilitado</button>
                    </div>
                    <div className="ds-component-specs">
                        <span>Primário: bg <code>#C9A962</code> · texto <code>#0C0C0E</code> · DM Sans 600 · radius 10px</span>
                        <span>Hover: <code>#DFC07A</code> · translateY(-2px) · shadow dourada</span>
                    </div>
                </div>

                {/* Cards */}
                <div className="ds-component-block">
                    <h3 className="ds-subsection-title">Cards</h3>
                    <div className="ds-cards-preview">
                        <div className="ds-card-demo">
                            <div className="ds-card-demo-badge">MÓDULO 1</div>
                            <h4>Card com Badge</h4>
                            <p>Conteúdo de demonstração com tipografia secundária e espaçamento consistente.</p>
                        </div>
                        <div className="ds-card-demo ds-card-demo-bonus">
                            <span className="ds-card-demo-tag-free">GRÁTIS</span>
                            <h4>Card de Bônus</h4>
                            <p>Com tag de preço e benefício extra para o usuário.</p>
                            <div className="ds-card-demo-price">
                                <s style={{ color: '#6B6B75' }}>R$ 97,00</s>
                                <strong style={{ color: '#4ADE80' }}>GRÁTIS</strong>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Blockquote */}
                <div className="ds-component-block">
                    <h3 className="ds-subsection-title">Citações Bíblicas</h3>
                    <blockquote className="ds-blockquote">
                        <p>"Porque a palavra de Deus é viva, e eficaz, e mais penetrante do que qualquer espada de dois gumes."</p>
                        <cite>— Hebreus 4:12</cite>
                    </blockquote>
                </div>

                {/* FAQ Accordion */}
                <div className="ds-component-block">
                    <h3 className="ds-subsection-title">FAQ Accordion</h3>
                    <div className="ds-faq-list">
                        {faqItems.map((item, i) => (
                            <div key={i} className={`ds-faq-item ${openFaq === i ? 'open' : ''}`}>
                                <button className="ds-faq-question" onClick={() => setOpenFaq(openFaq === i ? null : i)}>
                                    <span>{item.q}</span>
                                    <span className="ds-faq-icon">{openFaq === i ? '−' : '+'}</span>
                                </button>
                                {openFaq === i && <div className="ds-faq-answer">{item.a}</div>}
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── 7. ANIMAÇÕES ──────────────────────────────── */}
            <section id="animacoes" className="ds-section">
                <div className="ds-section-label">07 — Animações & Transições</div>
                <h2 className="ds-section-title">Motion Design</h2>

                <div className="ds-animation-grid">
                    <div className="ds-animation-demo">
                        <div className="ds-anim-card ds-anim-hover">
                            <span>Hover Effect</span>
                            <small>translateY(-4px) + border glow</small>
                        </div>
                        <code>transition: transform 0.3s ease, border-color 0.3s ease</code>
                    </div>
                    <div className="ds-animation-demo">
                        <div className="ds-anim-card ds-anim-btn-hover">
                            <span>Botão Hover</span>
                            <small>translateY(-2px) + gold shadow</small>
                        </div>
                        <code>transition: all 0.3s ease + box-shadow dourada</code>
                    </div>
                    <div className="ds-animation-demo">
                        <div className="ds-anim-card ds-anim-reveal">
                            <span>Scroll Reveal</span>
                            <small>opacity 0→1 + translateY(30→0)</small>
                        </div>
                        <code>IntersectionObserver + stagger delay +100ms</code>
                    </div>
                </div>
            </section>

            {/* ── 8. RESPONSIVIDADE ─────────────────────────── */}
            <section id="responsividade" className="ds-section">
                <div className="ds-section-label">08 — Responsividade</div>
                <h2 className="ds-section-title">Breakpoints</h2>

                <div className="ds-table-wrap">
                    <table className="ds-table">
                        <thead>
                            <tr><th>Dispositivo</th><th>Breakpoint</th><th>Colunas</th><th>Notas</th></tr>
                        </thead>
                        <tbody>
                            {breakpoints.map((bp, i) => (
                                <tr key={i}>
                                    <td><strong>{bp.name}</strong></td>
                                    <td><code>{bp.value}</code></td>
                                    <td>{bp.cols}</td>
                                    <td>{bp.notes}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </section>

            {/* ── 9. CSS VARIABLES ──────────────────────────── */}
            <section id="css-vars" className="ds-section">
                <div className="ds-section-label">09 — CSS Custom Properties</div>
                <h2 className="ds-section-title">Copiar e Colar</h2>
                <p className="ds-section-desc">Bloco completo com todos os tokens do design system.</p>

                <div className="ds-code-block">
                    <div className="ds-code-header">
                        <span>:root { }</span>
                        <button className="ds-code-copy" onClick={() => copyToClipboard(cssVarsBlock, 'CSS Variables')}>
                            {copiedToken === 'CSS Variables' ? '✓ Copiado' : '📋 Copiar'}
                        </button>
                    </div>
                    <pre className="ds-code-pre"><code>{cssVarsBlock}</code></pre>
                </div>
            </section>

            {/* ── 10. CHECKLIST ─────────────────────────────── */}
            <section id="checklist" className="ds-section">
                <div className="ds-section-label">10 — Consistência Visual</div>
                <h2 className="ds-section-title">Checklist de Verificação</h2>
                <p className="ds-section-desc">
                    {checkedItems.size}/{checklistItems.length} itens verificados
                </p>

                <div className="ds-checklist">
                    {checklistItems.map((item, i) => (
                        <label key={i} className={`ds-checklist-item ${checkedItems.has(i) ? 'checked' : ''}`}>
                            <input type="checkbox" checked={checkedItems.has(i)} onChange={() => toggleCheck(i)} />
                            <span className="ds-checklist-box">{checkedItems.has(i) ? '✓' : ''}</span>
                            <span>{item}</span>
                        </label>
                    ))}
                </div>

                {checkedItems.size === checklistItems.length && (
                    <div className="ds-checklist-done">
                        <span>✦</span> Design system validado com sucesso!
                    </div>
                )}
            </section>

            {/* Toast */}
            <div className={`toast ${toast.visible ? 'visible' : ''}`}>{toast.msg}</div>
        </div>
    );
}
