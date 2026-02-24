import { useState, useMemo, useEffect } from 'react';
import { CATEGORIES, LANGUAGE_FLAGS } from '../data/productsData';
import { fetchProducts, getTotalActiveLinks } from '../services/productsService';

const CATEGORY_COLORS = {
    AT: '#C9A962',
    NT: '#4ADE80',
    COMBO: '#60A5FA'
};

function getActiveLanguageCount(product) {
    return Object.values(product.languages).filter(
        lang => lang.url || lang.checkoutBasic || lang.checkoutFull
    ).length;
}

export default function Products() {
    const [products, setProducts] = useState([]);
    const [totalLinks, setTotalLinks] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [search, setSearch] = useState('');
    const [activeCategory, setActiveCategory] = useState('ALL');
    const [expandedId, setExpandedId] = useState(null);

    useEffect(() => {
        async function load() {
            try {
                const [prods, links] = await Promise.all([
                    fetchProducts(),
                    getTotalActiveLinks()
                ]);
                setProducts(prods);
                setTotalLinks(links);
            } catch (err) {
                setError('Erro ao carregar produtos: ' + err.message);
            } finally {
                setLoading(false);
            }
        }
        load();
    }, []);

    const filtered = useMemo(() => {
        let result = products;
        if (activeCategory !== 'ALL') {
            result = result.filter(p => p.category === activeCategory);
        }
        if (search.trim()) {
            const q = search.toLowerCase();
            result = result.filter(p => p.name.toLowerCase().includes(q));
        }
        return result;
    }, [products, search, activeCategory]);

    const totalActive = products.filter(p => Object.values(p.languages).some(l => l.url)).length;

    return (
        <div className="products-page">
            <div className="page-header">
                <div className="page-label">Catálogo de Produtos</div>
                <h1 className="page-title">Nossos <span className="gold">Produtos</span></h1>
                <p className="page-desc">
                    Todos os produtos da Saber Cristão organizados por categoria, língua e links de venda.
                </p>
            </div>

            {/* Stats */}
            <div className="prod-stats">
                <div className="prod-stat">
                    <span className="prod-stat-value">{loading ? '…' : products.length}</span>
                    <span className="prod-stat-label">Produtos</span>
                </div>
                <div className="prod-stat-divider" />
                <div className="prod-stat">
                    <span className="prod-stat-value">{loading ? '…' : totalActive}</span>
                    <span className="prod-stat-label">Com Landing Page</span>
                </div>
                <div className="prod-stat-divider" />
                <div className="prod-stat">
                    <span className="prod-stat-value">6</span>
                    <span className="prod-stat-label">Idiomas</span>
                </div>
                <div className="prod-stat-divider" />
                <div className="prod-stat">
                    <span className="prod-stat-value">{loading ? '…' : totalLinks}</span>
                    <span className="prod-stat-label">Links Ativos</span>
                </div>
            </div>

            {/* Filters + Search */}
            <div className="prod-toolbar">
                <div className="prod-search">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
                    </svg>
                    <input
                        type="text"
                        placeholder="Buscar produto..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                    />
                </div>
                <div className="prod-filters">
                    <button
                        className={`prod-filter-chip ${activeCategory === 'ALL' ? 'active' : ''}`}
                        onClick={() => setActiveCategory('ALL')}
                    >Todos</button>
                    {Object.entries(CATEGORIES).map(([key, label]) => (
                        <button
                            key={key}
                            className={`prod-filter-chip ${activeCategory === key ? 'active' : ''}`}
                            onClick={() => setActiveCategory(key)}
                            style={{ '--chip-color': CATEGORY_COLORS[key] }}
                        >
                            {label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Error */}
            {error && (
                <div className="prod-no-results">
                    <span>⚠️</span>
                    <p>{error}</p>
                </div>
            )}

            {/* Loading */}
            {loading && (
                <div className="prod-no-results">
                    <span>⏳</span>
                    <p>Carregando produtos...</p>
                </div>
            )}

            {/* Product Grid */}
            {!loading && !error && (
                <div className="prod-grid">
                    {filtered.map((product, i) => {
                        const isExpanded = expandedId === product.id;
                        const activeLangs = getActiveLanguageCount(product);
                        const langEntries = Object.entries(product.languages).filter(
                            ([, data]) => data.url || data.checkoutBasic || data.checkoutFull
                        );
                        const catColor = CATEGORY_COLORS[product.category];

                        return (
                            <div
                                key={product.id}
                                className={`prod-card ${isExpanded ? 'expanded' : ''}`}
                                style={{ '--prod-color': catColor, '--delay': `${i * 60}ms` }}
                            >
                                <div
                                    className="prod-card-header"
                                    onClick={() => setExpandedId(isExpanded ? null : product.id)}
                                >
                                    <div className="prod-card-left">
                                        <span className="prod-card-icon">{product.icon}</span>
                                        <div>
                                            <h3 className="prod-card-name">{product.name}</h3>
                                            <p className="prod-card-desc">{product.description}</p>
                                        </div>
                                    </div>
                                    <div className="prod-card-right">
                                        <span className="prod-card-badge" style={{ borderColor: catColor, color: catColor }}>
                                            {CATEGORIES[product.category]}
                                        </span>
                                        <div className="prod-card-meta">
                                            <span className="prod-card-langs">
                                                {activeLangs > 0 ? `${activeLangs} idioma${activeLangs > 1 ? 's' : ''}` : 'Em breve'}
                                            </span>
                                            <svg
                                                className={`prod-card-chevron ${isExpanded ? 'open' : ''}`}
                                                width="18" height="18" viewBox="0 0 24 24"
                                                fill="none" stroke="currentColor" strokeWidth="2"
                                            >
                                                <polyline points="6 9 12 15 18 9" />
                                            </svg>
                                        </div>
                                    </div>
                                </div>

                                {isExpanded && langEntries.length > 0 && (
                                    <div className="prod-card-body">
                                        <div className="prod-lang-table">
                                            <div className="prod-lang-header-row">
                                                <span>Idioma</span>
                                                <span>Landing Page</span>
                                                <span>Checkout Básico</span>
                                                <span>Checkout Completo</span>
                                            </div>
                                            {langEntries.map(([lang, data]) => (
                                                <div key={lang} className="prod-lang-row">
                                                    <span className="prod-lang-name">
                                                        <span className="prod-lang-flag">{LANGUAGE_FLAGS[lang] || '🌐'}</span>
                                                        {lang}
                                                    </span>
                                                    <span>
                                                        {data.url ? (
                                                            <a href={data.url} target="_blank" rel="noopener noreferrer" className="prod-link">
                                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                                    <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" />
                                                                    <polyline points="15 3 21 3 21 9" />
                                                                    <line x1="10" y1="14" x2="21" y2="3" />
                                                                </svg>
                                                                Abrir
                                                            </a>
                                                        ) : <span className="prod-link-empty">—</span>}
                                                    </span>
                                                    <span>
                                                        {data.checkoutBasic ? (
                                                            <a href={data.checkoutBasic} target="_blank" rel="noopener noreferrer" className="prod-link checkout">
                                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                                    <circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" />
                                                                    <path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6" />
                                                                </svg>
                                                                Básico
                                                            </a>
                                                        ) : <span className="prod-link-empty">—</span>}
                                                    </span>
                                                    <span>
                                                        {data.checkoutFull ? (
                                                            <a href={data.checkoutFull} target="_blank" rel="noopener noreferrer" className="prod-link checkout-full">
                                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                                    <circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" />
                                                                    <path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6" />
                                                                </svg>
                                                                Completo
                                                            </a>
                                                        ) : <span className="prod-link-empty">—</span>}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {isExpanded && langEntries.length === 0 && (
                                    <div className="prod-card-body">
                                        <div className="prod-empty">
                                            <span className="prod-empty-icon">🚧</span>
                                            <p>Produto ainda em preparação. Links serão adicionados em breve.</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            {!loading && !error && filtered.length === 0 && search && (
                <div className="prod-no-results">
                    <span>🔍</span>
                    <p>Nenhum produto encontrado para "{search}"</p>
                </div>
            )}
        </div>
    );
}
