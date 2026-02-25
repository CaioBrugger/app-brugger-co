import { useState, useMemo, useEffect, useCallback } from 'react';
import { CATEGORIES, LANGUAGE_FLAGS } from '../data/productsData';
import { fetchProducts, getTotalActiveLinks } from '../services/productsService';
import { fetchProductIdeas, saveProductIdea, updateIdeaStatus, deleteProductIdea } from '../services/productIdeasService';
import { runAICouncil, COUNCIL_MODELS } from '../services/aiCouncilService';

const CATEGORY_COLORS = {
    AT: '#C9A962',
    NT: '#4ADE80',
    COMBO: '#60A5FA'
};

const STATUS_CONFIG = {
    idea: { label: 'Ideia', icon: '💡', color: '#C9A962' },
    planned: { label: 'Planejado', icon: '📋', color: '#60A5FA' },
    in_progress: { label: 'Em Progresso', icon: '🔨', color: '#F59E0B' },
    launched: { label: 'Lançado', icon: '🚀', color: '#4ADE80' }
};

const PIPELINE_ORDER = ['idea', 'planned', 'in_progress', 'launched'];

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

    // Tabs
    const [tab, setTab] = useState('catalog');

    // AI Council
    const [councilLoading, setCouncilLoading] = useState(false);
    const [councilProgress, setCouncilProgress] = useState(null);
    const [councilResults, setCouncilResults] = useState(null);
    const [councilError, setCouncilError] = useState('');
    const [savedNotice, setSavedNotice] = useState('');

    // Future Launches / Ideas
    const [ideas, setIdeas] = useState([]);
    const [ideasLoading, setIdeasLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [selectedIdea, setSelectedIdea] = useState(null);
    const [newIdea, setNewIdea] = useState({ name: '', description: '', category: 'AT' });

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

    useEffect(() => {
        fetchProductIdeas()
            .then(setIdeas)
            .catch(err => console.warn('Failed to load ideas:', err))
            .finally(() => setIdeasLoading(false));
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

    // ── Council ──
    const generateSuggestions = useCallback(async () => {
        setCouncilLoading(true);
        setCouncilError('');
        setCouncilResults(null);
        setCouncilProgress({ phase: 'starting', message: 'Iniciando conselho...', percentage: 0 });

        try {
            const result = await runAICouncil(products, (progress) => {
                setCouncilProgress(progress);
            }, ideas);
            setCouncilResults(result);
        } catch (err) {
            setCouncilError(err.message || 'Erro ao gerar sugestões');
        } finally {
            setCouncilLoading(false);
        }
    }, [products, ideas]);

    const handleSaveIdea = async (idea) => {
        try {
            const saved = await saveProductIdea({
                name: idea.name,
                description: idea.description || idea.tagline || '',
                reasoning: idea.reasoning || '',
                category: idea.category || 'AT',
                status: 'idea',
                priceRange: idea.pricePoint || 'low_ticket',
                source: 'ai_council',
                councilData: {
                    score: idea.score,
                    risk: idea.risk,
                    improvement: idea.improvement,
                    verdict: idea.verdict,
                    finalNote: idea.finalNote,
                    marketFit: idea.marketFit,
                    revenueEstimate: idea.revenueEstimate,
                    tagline: idea.tagline,
                    targetAudience: idea.targetAudience,
                    contentIdea: idea.contentIdea,
                    difficulty: idea.difficulty,
                    pricePoint: idea.pricePoint,
                    aiDebate: idea.aiDebate
                }
            });
            setIdeas(prev => [saved, ...prev]);
            setSavedNotice(idea.name);
            setTimeout(() => setSavedNotice(''), 3000);
        } catch (err) {
            console.error('Failed to save idea:', err);
        }
    };

    const handleStatusChange = async (id, newStatus) => {
        try {
            await updateIdeaStatus(id, newStatus);
            setIdeas(prev => prev.map(i => i.id === id ? { ...i, status: newStatus } : i));
        } catch (err) {
            console.error('Failed to update status:', err);
        }
    };

    const handleDeleteIdea = async (id) => {
        try {
            await deleteProductIdea(id);
            setIdeas(prev => prev.filter(i => i.id !== id));
        } catch (err) {
            console.error('Failed to delete idea:', err);
        }
    };

    const handleAddManual = async () => {
        if (!newIdea.name.trim()) return;
        try {
            const saved = await saveProductIdea({
                name: newIdea.name,
                description: newIdea.description,
                category: newIdea.category,
                status: 'idea',
                source: 'manual',
                reasoning: '',
                priceRange: 'low_ticket',
                councilData: {}
            });
            setIdeas(prev => [saved, ...prev]);
            setNewIdea({ name: '', description: '', category: 'AT' });
            setShowAddModal(false);
        } catch (err) {
            console.error('Failed to add idea:', err);
        }
    };

    const ideasByStatus = useMemo(() => {
        const grouped = {};
        for (const s of PIPELINE_ORDER) {
            grouped[s] = ideas.filter(i => i.status === s);
        }
        return grouped;
    }, [ideas]);

    return (
        <div className="products-page">
            <div className="page-header">
                <div className="page-label">Catálogo & Estratégia</div>
                <h1 className="page-title">Nossos <span className="gold">Produtos</span></h1>
                <p className="page-desc">
                    Catálogo, sugestões de IA e pipeline de futuros lançamentos.
                </p>
            </div>

            {/* Tabs */}
            <div className="prod-tabs">
                <button className={`prod-tab ${tab === 'catalog' ? 'active' : ''}`} onClick={() => setTab('catalog')}>
                    📦 Catálogo <span className="prod-tab-count">{products.length}</span>
                </button>
                <button className={`prod-tab ${tab === 'council' ? 'active' : ''}`} onClick={() => setTab('council')}>
                    🤖 Conselho IA
                </button>
                <button className={`prod-tab ${tab === 'launches' ? 'active' : ''}`} onClick={() => setTab('launches')}>
                    🚀 Futuros Lançamentos <span className="prod-tab-count">{ideas.length}</span>
                </button>
            </div>

            {/* ═══════════════ CATALOG TAB ═══════════════ */}
            {tab === 'catalog' && (
                <>
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

                    <div className="prod-toolbar">
                        <div className="prod-search">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
                            </svg>
                            <input type="text" placeholder="Buscar produto..." value={search} onChange={e => setSearch(e.target.value)} />
                        </div>
                        <div className="prod-filters">
                            <button className={`prod-filter-chip ${activeCategory === 'ALL' ? 'active' : ''}`} onClick={() => setActiveCategory('ALL')}>Todos</button>
                            {Object.entries(CATEGORIES).map(([key, label]) => (
                                <button key={key} className={`prod-filter-chip ${activeCategory === key ? 'active' : ''}`} onClick={() => setActiveCategory(key)} style={{ '--chip-color': CATEGORY_COLORS[key] }}>
                                    {label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {error && <div className="prod-no-results"><span>⚠️</span><p>{error}</p></div>}
                    {loading && <div className="prod-no-results"><span>⏳</span><p>Carregando produtos...</p></div>}

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
                                    <div key={product.id} className={`prod-card ${isExpanded ? 'expanded' : ''}`} style={{ '--prod-color': catColor, '--delay': `${i * 60}ms` }}>
                                        <div className="prod-card-header" onClick={() => setExpandedId(isExpanded ? null : product.id)}>
                                            <div className="prod-card-left">
                                                <span className="prod-card-icon">{product.icon}</span>
                                                <div>
                                                    <h3 className="prod-card-name">{product.name}</h3>
                                                    <p className="prod-card-desc">{product.description}</p>
                                                </div>
                                            </div>
                                            <div className="prod-card-right">
                                                <span className="prod-card-badge" style={{ borderColor: catColor, color: catColor }}>{CATEGORIES[product.category]}</span>
                                                <div className="prod-card-meta">
                                                    <span className="prod-card-langs">{activeLangs > 0 ? `${activeLangs} idioma${activeLangs > 1 ? 's' : ''}` : 'Em breve'}</span>
                                                    <svg className={`prod-card-chevron ${isExpanded ? 'open' : ''}`} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                        <polyline points="6 9 12 15 18 9" />
                                                    </svg>
                                                </div>
                                            </div>
                                        </div>

                                        {isExpanded && langEntries.length > 0 && (
                                            <div className="prod-card-body">
                                                <div className="prod-lang-table">
                                                    <div className="prod-lang-header-row">
                                                        <span>Idioma</span><span>Landing Page</span><span>Checkout Básico</span><span>Checkout Completo</span>
                                                    </div>
                                                    {langEntries.map(([lang, data]) => (
                                                        <div key={lang} className="prod-lang-row">
                                                            <span className="prod-lang-name">
                                                                <span className="prod-lang-flag">{LANGUAGE_FLAGS[lang] || '🌐'}</span>{lang}
                                                            </span>
                                                            <span>{data.url ? <a href={data.url} target="_blank" rel="noopener noreferrer" className="prod-link"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" /><polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" /></svg>Abrir</a> : <span className="prod-link-empty">—</span>}</span>
                                                            <span>{data.checkoutBasic ? <a href={data.checkoutBasic} target="_blank" rel="noopener noreferrer" className="prod-link checkout">Básico</a> : <span className="prod-link-empty">—</span>}</span>
                                                            <span>{data.checkoutFull ? <a href={data.checkoutFull} target="_blank" rel="noopener noreferrer" className="prod-link checkout-full">Completo</a> : <span className="prod-link-empty">—</span>}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {isExpanded && langEntries.length === 0 && (
                                            <div className="prod-card-body">
                                                <div className="prod-empty">
                                                    <span className="prod-empty-icon">🚧</span>
                                                    <p>Produto ainda em preparação.</p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {!loading && !error && filtered.length === 0 && search && (
                        <div className="prod-no-results"><span>🔍</span><p>Nenhum produto encontrado para "{search}"</p></div>
                    )}
                </>
            )}

            {/* ═══════════════ AI COUNCIL TAB ═══════════════ */}
            {tab === 'council' && (
                <div className="council-layout">
                    <div className="council-sidebar">
                        <div className="council-info-card">
                            <h3>🤖 Conselho de IAs</h3>
                            <p>5 modelos de IA debatem e propõem novos produtos baseados no seu portfólio e tendências reais de mercado.</p>

                            <div className="council-models">
                                {COUNCIL_MODELS.map((model) => (
                                    <div key={model.key} className={`council-model ${councilProgress?.phase === model.key ? 'active' : ''}`}>
                                        <span className="council-model-icon">{model.icon}</span>
                                        <div>
                                            <span className="council-model-name">{model.name}</span>
                                            <span className="council-model-role">{model.role}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Progress */}
                        {councilLoading && councilProgress && (
                            <div className="council-progress">
                                <div className="council-progress-bar">
                                    <div className="council-progress-fill" style={{ width: `${councilProgress.percentage}%` }} />
                                </div>
                                <p className="council-progress-text">{councilProgress.message}</p>
                            </div>
                        )}

                        {councilError && <div className="council-error">{councilError}</div>}

                        <button className="council-generate-btn" onClick={generateSuggestions} disabled={councilLoading || loading}>
                            {councilLoading ? (
                                <><span className="themes-spinner" /> {councilProgress?.message || 'Processando...'}</>
                            ) : (
                                '🧠 Gerar Sugestões de Produtos'
                            )}
                        </button>
                    </div>

                    <div className="council-results">
                        {!councilResults && !councilLoading && (
                            <div className="council-empty">
                                <span className="council-empty-icon">🧠</span>
                                <h3>Conselho de IAs</h3>
                                <p>Clique em "Gerar Sugestões" para que Perplexity, Claude, Grok, DeepSeek e GPT debatam e sugiram novos produtos para o seu portfólio. O conselho roda quantas rodadas forem necessárias até encontrar <strong>3 ideias com score acima de 7</strong>.</p>
                                <div className="council-flow">
                                    <span>🔍 Pesquisa</span>
                                    <span>→</span>
                                    <span>🟣 Propostas</span>
                                    <span>→</span>
                                    <span>⚡ Desafio</span>
                                    <span>→</span>
                                    <span>🔵 Análise</span>
                                    <span>→</span>
                                    <span>🟢 Veredito</span>
                                </div>
                            </div>
                        )}

                        {councilLoading && !councilResults && (
                            <div className="council-loading">
                                <div className="themes-loading-orb" />
                                <p>{councilProgress?.message || 'Iniciando...'}</p>
                            </div>
                        )}

                        {savedNotice && <div className="council-saved-toast">✅ "{savedNotice}" salvo em Futuros Lançamentos!</div>}

                        {councilResults && councilResults.ideas.length === 0 && (
                            <div className="council-empty">
                                <span className="council-empty-icon">📊</span>
                                <h3>Nenhuma ideia aprovada</h3>
                                <p>O conselho rodou todas as tentativas mas não conseguiu encontrar 3 ideias com score acima de 7. Tente gerar novamente.</p>
                            </div>
                        )}

                        {councilResults && councilResults.ideas.length > 0 && (
                            <div className="council-ideas">
                                {councilResults.ideas.map((idea, i) => (
                                    <div key={i} className="council-idea-card" style={{ '--delay': `${i * 120}ms` }}>
                                        <div className="council-idea-header">
                                            <div>
                                                <span className="council-idea-category" style={{ color: CATEGORY_COLORS[idea.category] || '#C9A962' }}>
                                                    {CATEGORIES[idea.category] || idea.category}
                                                </span>
                                                <h4 className="council-idea-name">{idea.name}</h4>
                                                {idea.tagline && <p className="council-idea-tagline">{idea.tagline}</p>}
                                            </div>
                                            <div className="council-idea-score">
                                                <span className="council-idea-score-value">{idea.score?.toFixed?.(1) || idea.score || '—'}</span>
                                                <span className="council-idea-score-label">Score</span>
                                                <div className="council-idea-score-bar">
                                                    <div style={{ width: `${(idea.score || 0) * 10}%` }} />
                                                </div>
                                            </div>
                                        </div>

                                        <p className="council-idea-desc">{idea.description}</p>

                                        <div className="council-idea-reasoning">
                                            <h5>💡 Por que criar este produto?</h5>
                                            <p>{idea.reasoning}</p>
                                        </div>

                                        <div className="council-idea-meta">
                                            {idea.pricePoint && <span className="council-idea-tag">💰 {idea.pricePoint}</span>}
                                            {idea.difficulty && <span className="council-idea-tag">⚙️ {idea.difficulty}</span>}
                                            {idea.targetAudience && <span className="council-idea-tag">👥 {idea.targetAudience}</span>}
                                            {idea.marketFit && <span className="council-idea-tag">📊 {idea.marketFit}</span>}
                                            {idea.revenueEstimate && <span className="council-idea-tag">💵 {idea.revenueEstimate}</span>}
                                        </div>

                                        {(idea.risk || idea.improvement) && (
                                            <div className="council-idea-debate">
                                                <h5>⚡ Devil's Advocate (Grok)</h5>
                                                {idea.risk && <p className="council-debate-risk">⚠️ <strong>Risco:</strong> {idea.risk}</p>}
                                                {idea.improvement && <p className="council-debate-improvement">✨ <strong>Melhoria:</strong> {idea.improvement}</p>}
                                            </div>
                                        )}

                                        {idea.finalNote && (
                                            <div className="council-idea-debate">
                                                <h5>🟢 Veredito Final (GPT)</h5>
                                                <p className="council-debate-improvement">{idea.finalNote}</p>
                                                {idea.verdict && <span className={`council-verdict ${idea.verdict?.includes('ressalva') ? 'warning' : idea.verdict?.includes('repensar') ? 'danger' : 'success'}`}>{idea.verdict}</span>}
                                            </div>
                                        )}

                                        <div className="council-idea-actions">
                                            <button className="council-save-btn" onClick={() => handleSaveIdea(idea)}>
                                                💾 Salvar Ideia
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* ═══════════════ FUTURE LAUNCHES TAB ═══════════════ */}
            {tab === 'launches' && (
                <div className="pipeline-container">
                    <div className="pipeline-header">
                        <h3>Pipeline de Lançamentos</h3>
                        <button className="pipeline-add-btn" onClick={() => setShowAddModal(true)}>
                            + Adicionar Produto
                        </button>
                    </div>

                    {ideasLoading ? (
                        <div className="prod-no-results"><span>⏳</span><p>Carregando pipeline...</p></div>
                    ) : ideas.length === 0 ? (
                        <div className="prod-no-results">
                            <span>📭</span>
                            <p>Nenhuma ideia ainda. Gere sugestões na aba "Conselho IA" ou adicione manualmente.</p>
                        </div>
                    ) : (
                        <div className="pipeline-board">
                            {PIPELINE_ORDER.map(status => {
                                const config = STATUS_CONFIG[status];
                                const statusIdeas = ideasByStatus[status] || [];
                                return (
                                    <div key={status} className="pipeline-column">
                                        <div className="pipeline-column-header" style={{ '--col-color': config.color }}>
                                            <span>{config.icon} {config.label}</span>
                                            <span className="pipeline-column-count">{statusIdeas.length}</span>
                                        </div>
                                        <div className="pipeline-column-body">
                                            {statusIdeas.map(idea => (
                                                <div key={idea.id} className="pipeline-card" onClick={() => setSelectedIdea(idea)} style={{ cursor: 'pointer' }}>
                                                    <div className="pipeline-card-top">
                                                        <span className="pipeline-card-source">{idea.source === 'ai_council' ? '🤖' : '✍️'}</span>
                                                        <span className="pipeline-card-category" style={{ color: CATEGORY_COLORS[idea.category] || '#C9A962' }}>
                                                            {CATEGORIES[idea.category] || idea.category}
                                                        </span>
                                                    </div>
                                                    <h5 className="pipeline-card-name">{idea.name}</h5>
                                                    {idea.description && <p className="pipeline-card-desc">{idea.description}</p>}
                                                    {idea.councilData?.score && (
                                                        <div className="pipeline-card-score">
                                                            <span>Score: {idea.councilData.score}</span>
                                                        </div>
                                                    )}
                                                    <div className="pipeline-card-actions" onClick={e => e.stopPropagation()}>
                                                        <select
                                                            className="pipeline-status-select"
                                                            value={idea.status}
                                                            onChange={e => handleStatusChange(idea.id, e.target.value)}
                                                        >
                                                            {PIPELINE_ORDER.map(s => (
                                                                <option key={s} value={s}>{STATUS_CONFIG[s].icon} {STATUS_CONFIG[s].label}</option>
                                                            ))}
                                                        </select>
                                                        <button className="pipeline-delete-btn" onClick={() => handleDeleteIdea(idea.id)} title="Deletar">🗑️</button>
                                                    </div>
                                                </div>
                                            ))}
                                            {statusIdeas.length === 0 && (
                                                <div className="pipeline-empty">Nenhum item</div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {/* Detail Modal */}
                    {selectedIdea && (
                        <div className="pipeline-modal-overlay" onClick={() => setSelectedIdea(null)}>
                            <div className="pipeline-detail-modal" onClick={e => e.stopPropagation()}>
                                <button className="pipeline-detail-close" onClick={() => setSelectedIdea(null)}>✕</button>

                                <div className="pipeline-detail-header">
                                    <div>
                                        <span className="council-idea-category" style={{ color: CATEGORY_COLORS[selectedIdea.category] || '#C9A962' }}>
                                            {CATEGORIES[selectedIdea.category] || selectedIdea.category}
                                        </span>
                                        <h3 className="pipeline-detail-name">{selectedIdea.name}</h3>
                                        {selectedIdea.councilData?.tagline && <p className="council-idea-tagline">{selectedIdea.councilData.tagline}</p>}
                                    </div>
                                    {selectedIdea.councilData?.score && (
                                        <div className="council-idea-score">
                                            <span className="council-idea-score-value">{typeof selectedIdea.councilData.score === 'number' ? selectedIdea.councilData.score.toFixed(1) : selectedIdea.councilData.score}</span>
                                            <span className="council-idea-score-label">Score</span>
                                            <div className="council-idea-score-bar">
                                                <div style={{ width: `${(selectedIdea.councilData.score || 0) * 10}%` }} />
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <p className="council-idea-desc">{selectedIdea.description}</p>

                                {selectedIdea.reasoning && (
                                    <div className="council-idea-reasoning">
                                        <h5>💡 Por que criar este produto?</h5>
                                        <p>{selectedIdea.reasoning}</p>
                                    </div>
                                )}

                                <div className="council-idea-meta">
                                    {selectedIdea.councilData?.pricePoint && <span className="council-idea-tag">💰 {selectedIdea.councilData.pricePoint}</span>}
                                    {selectedIdea.councilData?.difficulty && <span className="council-idea-tag">⚙️ {selectedIdea.councilData.difficulty}</span>}
                                    {selectedIdea.councilData?.targetAudience && <span className="council-idea-tag">👥 {selectedIdea.councilData.targetAudience}</span>}
                                    {selectedIdea.councilData?.marketFit && <span className="council-idea-tag">📊 {selectedIdea.councilData.marketFit}</span>}
                                    {selectedIdea.councilData?.revenueEstimate && <span className="council-idea-tag">💵 {selectedIdea.councilData.revenueEstimate}</span>}
                                    {selectedIdea.source === 'ai_council' && <span className="council-idea-tag">🤖 Conselho IA</span>}
                                    {selectedIdea.source === 'manual' && <span className="council-idea-tag">✍️ Manual</span>}
                                </div>

                                {selectedIdea.councilData?.contentIdea && (
                                    <div className="council-idea-reasoning">
                                        <h5>📚 Estrutura do Conteúdo</h5>
                                        <p>{selectedIdea.councilData.contentIdea}</p>
                                    </div>
                                )}

                                {(selectedIdea.councilData?.risk || selectedIdea.councilData?.improvement) && (
                                    <div className="council-idea-debate">
                                        <h5>⚡ Devil's Advocate (Grok)</h5>
                                        {selectedIdea.councilData.risk && <p className="council-debate-risk">⚠️ <strong>Risco:</strong> {selectedIdea.councilData.risk}</p>}
                                        {selectedIdea.councilData.improvement && <p className="council-debate-improvement">✨ <strong>Melhoria:</strong> {selectedIdea.councilData.improvement}</p>}
                                    </div>
                                )}

                                {selectedIdea.councilData?.finalNote && (
                                    <div className="council-idea-debate">
                                        <h5>🟢 Veredito Final (GPT)</h5>
                                        <p className="council-debate-improvement">{selectedIdea.councilData.finalNote}</p>
                                        {selectedIdea.councilData.verdict && (
                                            <span className={`council-verdict ${selectedIdea.councilData.verdict?.includes('ressalva') ? 'warning' : selectedIdea.councilData.verdict?.includes('repensar') ? 'danger' : 'success'}`}>
                                                {selectedIdea.councilData.verdict}
                                            </span>
                                        )}
                                    </div>
                                )}

                                {selectedIdea.councilData?.aiDebate && (
                                    <div className="pipeline-detail-participants">
                                        <h5>🤖 Participantes do Conselho</h5>
                                        <div className="pipeline-detail-models">
                                            {selectedIdea.councilData.aiDebate.researcher && <span>🔍 {selectedIdea.councilData.aiDebate.researcher}</span>}
                                            {selectedIdea.councilData.aiDebate.proposer && <span>🟣 {selectedIdea.councilData.aiDebate.proposer}</span>}
                                            {selectedIdea.councilData.aiDebate.challenger && <span>⚡ {selectedIdea.councilData.aiDebate.challenger}</span>}
                                            {selectedIdea.councilData.aiDebate.analyst && <span>🔵 {selectedIdea.councilData.aiDebate.analyst}</span>}
                                            {selectedIdea.councilData.aiDebate.judge && <span>🟢 {selectedIdea.councilData.aiDebate.judge}</span>}
                                        </div>
                                    </div>
                                )}

                                <div className="pipeline-detail-footer">
                                    <span className="pipeline-detail-date">Criado em {new Date(selectedIdea.createdAt).toLocaleDateString('pt-BR')}</span>
                                    <div className="pipeline-detail-footer-actions">
                                        <select
                                            className="pipeline-status-select"
                                            value={selectedIdea.status}
                                            onChange={e => { handleStatusChange(selectedIdea.id, e.target.value); setSelectedIdea({ ...selectedIdea, status: e.target.value }); }}
                                        >
                                            {PIPELINE_ORDER.map(s => (
                                                <option key={s} value={s}>{STATUS_CONFIG[s].icon} {STATUS_CONFIG[s].label}</option>
                                            ))}
                                        </select>
                                        <button className="pipeline-delete-btn" onClick={() => { handleDeleteIdea(selectedIdea.id); setSelectedIdea(null); }} title="Deletar">🗑️ Deletar</button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Add Manual Modal */}
                    {showAddModal && (
                        <div className="pipeline-modal-overlay" onClick={() => setShowAddModal(false)}>
                            <div className="pipeline-modal" onClick={e => e.stopPropagation()}>
                                <h3>Adicionar Produto Manualmente</h3>
                                <div className="pipeline-modal-field">
                                    <label>Nome do Produto</label>
                                    <input
                                        type="text"
                                        className="themes-input"
                                        placeholder="ex: Salmos Ilustrados"
                                        value={newIdea.name}
                                        onChange={e => setNewIdea(prev => ({ ...prev, name: e.target.value }))}
                                        autoFocus
                                    />
                                </div>
                                <div className="pipeline-modal-field">
                                    <label>Descrição</label>
                                    <textarea
                                        className="themes-textarea"
                                        placeholder="Descrição breve do produto..."
                                        value={newIdea.description}
                                        onChange={e => setNewIdea(prev => ({ ...prev, description: e.target.value }))}
                                        rows={3}
                                    />
                                </div>
                                <div className="pipeline-modal-field">
                                    <label>Categoria</label>
                                    <select className="pipeline-status-select" value={newIdea.category} onChange={e => setNewIdea(prev => ({ ...prev, category: e.target.value }))}>
                                        {Object.entries(CATEGORIES).map(([key, label]) => (
                                            <option key={key} value={key}>{label}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="pipeline-modal-actions">
                                    <button className="themes-btn-secondary" onClick={() => setShowAddModal(false)}>Cancelar</button>
                                    <button className="council-save-btn" onClick={handleAddManual} disabled={!newIdea.name.trim()}>Adicionar</button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
