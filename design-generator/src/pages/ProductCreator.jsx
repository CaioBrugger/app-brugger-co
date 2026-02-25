import { useState, useEffect } from 'react';
import { fetchLandingPages, fetchLandingPage } from '../services/landingPagesService';
import { runEstruturador } from '../services/estruturadorService';

// ─── Design Tokens ─────────────────────────────────────────────────────────────
const C = {
    bg: '#0C0C0E',
    surface: '#131316',
    surface2: '#1A1A1F',
    surface3: '#222228',
    border: '#2A2A32',
    borderLight: '#3A3A45',
    text: '#FAFAFA',
    textSec: '#A0A0A8',
    textMuted: '#6B6B75',
    accent: '#C9A962',
    accentLight: '#DFC07A',
    accentDark: '#A88C4A',
    success: '#4ADE80',
    error: '#F87171',
};

const TIPO_CONFIG = {
    ebook_simples:  { label: 'Ebook Texto',      icon: '📕', color: '#C9A962' },
    ebook_imagens:  { label: 'Ebook + Imagens',  icon: '🖼️', color: '#A78BFA' },
    ebook_slide:    { label: 'Ebook Slide',      icon: '📊', color: '#60A5FA' },
    videoaula:      { label: 'Videoaula',        icon: '🎬', color: '#F59E0B' },
    audio:          { label: 'Áudio',            icon: '🎧', color: '#4ADE80' },
    checklist:      { label: 'Checklist',        icon: '📋', color: '#FB923C' },
};

const FASE_COLORS = {
    'Produto Principal': '#C9A962',
    'Bônus':            '#4ADE80',
    'Order Bumps':      '#60A5FA',
    'Videoaulas':       '#F59E0B',
    'Montagem Final':   '#A78BFA',
};

// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function ProductCreator() {
    // Step
    const [step, setStep] = useState(1);

    // Step 1
    const [lps, setLps] = useState([]);
    const [lpsLoading, setLpsLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [selectedLp, setSelectedLp] = useState(null);
    const [inputMode, setInputMode] = useState('gallery');
    const [manualHtml, setManualHtml] = useState('');

    // Step 2
    const [hasOrderBump, setHasOrderBump] = useState(null);
    const [orderBumps, setOrderBumps] = useState([]);
    const [newOb, setNewOb] = useState({ nome: '', descricao: '', preco: '' });

    // Step 3
    const [analyzing, setAnalyzing] = useState(false);
    const [progress, setProgress] = useState(null);
    const [result, setResult] = useState(null);
    const [error, setError] = useState('');
    const [activeTab, setActiveTab] = useState('overview');
    const [expandedModule, setExpandedModule] = useState(null);

    useEffect(() => {
        fetchLandingPages()
            .then(setLps)
            .catch(err => console.error('Failed to load LPs:', err))
            .finally(() => setLpsLoading(false));
    }, []);

    const filteredLps = search.trim()
        ? lps.filter(lp =>
            lp.name.toLowerCase().includes(search.toLowerCase()) ||
            lp.description?.toLowerCase().includes(search.toLowerCase()))
        : lps;

    const canGoToStep2 = selectedLp || (inputMode === 'manual' && manualHtml.trim().length > 100);

    const handleAnalyze = async () => {
        setStep(3);
        setAnalyzing(true);
        setError('');
        setResult(null);
        setActiveTab('overview');

        try {
            let html;
            if (inputMode === 'manual') {
                html = manualHtml;
            } else {
                const fullLp = await fetchLandingPage(selectedLp.id);
                html = fullLp.html_content;
            }
            const data = await runEstruturador(html, orderBumps, setProgress);
            setResult(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setAnalyzing(false);
        }
    };

    const handleReset = () => {
        setStep(1);
        setSelectedLp(null);
        setResult(null);
        setError('');
        setOrderBumps([]);
        setHasOrderBump(null);
        setManualHtml('');
        setSearch('');
        setProgress(null);
    };

    return (
        <div style={{ padding: '2rem 2rem 5rem', maxWidth: '1400px', margin: '0 auto' }}>
            <style>{`
                @keyframes pc-pulse {
                    0%, 100% { transform: scale(1); opacity: 1; }
                    50% { transform: scale(1.05); opacity: 0.8; }
                }
                @keyframes pc-spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
                @keyframes pc-fadein {
                    from { opacity: 0; transform: translateY(12px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .pc-lp-card:hover {
                    border-color: #3A3A45 !important;
                    transform: translateY(-2px);
                }
                .pc-lp-card.selected:hover {
                    transform: translateY(-2px);
                }
                .pc-btn-primary:hover:not(:disabled) {
                    background: #DFC07A !important;
                    transform: translateY(-1px);
                    box-shadow: 0 6px 20px rgba(201,169,98,0.25);
                }
                .pc-tab-content {
                    animation: pc-fadein 0.3s ease;
                }
            `}</style>

            {/* ── Page Header ── */}
            <div style={{ marginBottom: '2.5rem' }}>
                <div style={{
                    fontSize: '11px', fontWeight: 600, letterSpacing: '0.15em',
                    color: C.accent, textTransform: 'uppercase', marginBottom: '0.5rem',
                    fontFamily: 'DM Sans, sans-serif'
                }}>
                    FERRAMENTAS DE PRODUÇÃO
                </div>
                <h1 style={{
                    fontFamily: 'DM Serif Display, Georgia, serif',
                    fontSize: '2.5rem', fontWeight: 400, color: C.text,
                    margin: '0 0 0.75rem', lineHeight: 1.2
                }}>
                    Estruturador de <span style={{ color: C.accent }}>Produto</span>
                </h1>
                <p style={{
                    color: C.textSec, fontSize: '1rem', margin: 0,
                    fontFamily: 'DM Sans, sans-serif', maxWidth: '600px', lineHeight: 1.7
                }}>
                    Selecione uma landing page, e o Claude Sonnet gerará o plano de produção completo
                    com entregáveis, ferramentas e ordem de execução.
                </p>
            </div>

            {/* ── Step Indicator ── */}
            <StepIndicator currentStep={step} />

            {/* ── Steps ── */}
            {step === 1 && (
                <StepSelectLP
                    lps={filteredLps}
                    loading={lpsLoading}
                    search={search}
                    onSearch={setSearch}
                    selected={selectedLp}
                    onSelect={lp => setSelectedLp(selectedLp?.id === lp.id ? null : lp)}
                    inputMode={inputMode}
                    onInputModeChange={setInputMode}
                    manualHtml={manualHtml}
                    onManualHtmlChange={setManualHtml}
                    canContinue={canGoToStep2}
                    onContinue={() => setStep(2)}
                />
            )}

            {step === 2 && (
                <StepConfigure
                    selectedLp={selectedLp}
                    inputMode={inputMode}
                    hasOrderBump={hasOrderBump}
                    onHasOrderBumpChange={setHasOrderBump}
                    orderBumps={orderBumps}
                    onOrderBumpsChange={setOrderBumps}
                    newOb={newOb}
                    onNewObChange={setNewOb}
                    onBack={() => setStep(1)}
                    onAnalyze={handleAnalyze}
                />
            )}

            {step === 3 && (
                <StepDashboard
                    analyzing={analyzing}
                    progress={progress}
                    result={result}
                    error={error}
                    activeTab={activeTab}
                    onTabChange={setActiveTab}
                    expandedModule={expandedModule}
                    onExpandModule={setExpandedModule}
                    onBack={() => { setStep(2); setResult(null); setError(''); }}
                    onReset={handleReset}
                />
            )}
        </div>
    );
}

// ─── Step Indicator ────────────────────────────────────────────────────────────
function StepIndicator({ currentStep }) {
    const steps = [
        { n: 1, label: 'Selecionar LP' },
        { n: 2, label: 'Configurar' },
        { n: 3, label: 'Dashboard' },
    ];

    return (
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 0, marginBottom: '2.5rem', maxWidth: '480px' }}>
            {steps.map((s, i) => {
                const isActive = s.n === currentStep;
                const isDone = s.n < currentStep;
                return (
                    <div key={s.n} style={{ display: 'flex', alignItems: 'center', flex: i < steps.length - 1 ? 1 : 'none' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.4rem' }}>
                            <div style={{
                                width: 36, height: 36, borderRadius: '50%',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontFamily: 'DM Sans, sans-serif', fontSize: '13px', fontWeight: 700,
                                background: isDone ? C.accent : isActive ? 'rgba(201,169,98,0.15)' : C.surface2,
                                border: `2px solid ${isDone ? C.accent : isActive ? C.accent : C.border}`,
                                color: isDone ? '#0C0C0E' : isActive ? C.accent : C.textMuted,
                                transition: 'all 0.3s ease', flexShrink: 0
                            }}>
                                {isDone ? '✓' : s.n}
                            </div>
                            <span style={{
                                fontSize: '11px', fontFamily: 'DM Sans, sans-serif',
                                color: isActive ? C.text : isDone ? C.textSec : C.textMuted,
                                fontWeight: isActive ? 600 : 400, whiteSpace: 'nowrap'
                            }}>
                                {s.label}
                            </span>
                        </div>
                        {i < steps.length - 1 && (
                            <div style={{
                                flex: 1, height: 2, margin: '0 0.5rem', marginBottom: '1.4rem',
                                background: isDone ? C.accent : C.border,
                                transition: 'background 0.3s ease'
                            }} />
                        )}
                    </div>
                );
            })}
        </div>
    );
}

// ─── Step 1: Select LP ─────────────────────────────────────────────────────────
function StepSelectLP({ lps, loading, search, onSearch, selected, onSelect, inputMode, onInputModeChange, manualHtml, onManualHtmlChange, canContinue, onContinue }) {
    return (
        <div style={{ animation: 'pc-fadein 0.3s ease' }}>
            {/* Mode Toggle */}
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.75rem' }}>
                {[
                    { id: 'gallery', label: '🗂️ Da Galeria', desc: 'LPs salvas no sistema' },
                    { id: 'manual', label: '📋 Colar HTML', desc: 'Cole o código diretamente' },
                ].map(mode => (
                    <button
                        key={mode.id}
                        onClick={() => onInputModeChange(mode.id)}
                        style={{
                            padding: '0.65rem 1.25rem', borderRadius: 8, cursor: 'pointer',
                            border: `1px solid ${inputMode === mode.id ? C.accent : C.border}`,
                            background: inputMode === mode.id ? 'rgba(201,169,98,0.1)' : C.surface,
                            color: inputMode === mode.id ? C.accent : C.textSec,
                            fontFamily: 'DM Sans, sans-serif', fontSize: '13px', fontWeight: 500,
                            transition: 'all 0.2s ease'
                        }}
                    >
                        {mode.label}
                    </button>
                ))}
            </div>

            {inputMode === 'gallery' && (
                <>
                    {/* Search */}
                    <div style={{ position: 'relative', marginBottom: '1.5rem', maxWidth: '380px' }}>
                        <svg style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: C.textMuted, pointerEvents: 'none' }}
                            width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
                        </svg>
                        <input
                            type="text"
                            placeholder="Buscar landing page..."
                            value={search}
                            onChange={e => onSearch(e.target.value)}
                            style={{
                                width: '100%', padding: '0.7rem 1rem 0.7rem 2.4rem',
                                background: C.surface, border: `1px solid ${C.border}`,
                                borderRadius: 8, color: C.text, fontSize: '13px',
                                fontFamily: 'DM Sans, sans-serif', outline: 'none', boxSizing: 'border-box',
                            }}
                        />
                    </div>

                    {/* LP Grid */}
                    {loading ? (
                        <EmptyState icon="⏳" title="Carregando..." desc="Buscando landing pages salvas..." />
                    ) : lps.length === 0 ? (
                        <EmptyState
                            icon="📭"
                            title="Nenhuma Landing Page salva"
                            desc={<>Crie uma LP no <a href="/builder" style={{ color: C.accent }}>LP Builder</a> primeiro, ou use a opção "Colar HTML".</>}
                        />
                    ) : (
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fill, minmax(270px, 1fr))',
                            gap: '1rem', marginBottom: '2rem'
                        }}>
                            {lps.map(lp => (
                                <LPCard
                                    key={lp.id}
                                    lp={lp}
                                    isSelected={selected?.id === lp.id}
                                    onSelect={() => onSelect(lp)}
                                />
                            ))}
                        </div>
                    )}
                </>
            )}

            {inputMode === 'manual' && (
                <div style={{ marginBottom: '2rem' }}>
                    <label style={{
                        display: 'block', color: C.textSec, fontSize: '13px',
                        fontFamily: 'DM Sans', fontWeight: 500, marginBottom: '0.5rem'
                    }}>
                        Cole o código HTML completo da Landing Page:
                    </label>
                    <textarea
                        value={manualHtml}
                        onChange={e => onManualHtmlChange(e.target.value)}
                        placeholder="<!DOCTYPE html>&#10;<html>&#10;  <!-- Cole o HTML completo aqui -->"
                        style={{
                            width: '100%', height: '280px', display: 'block',
                            background: C.surface, border: `1px solid ${C.border}`,
                            borderRadius: 10, color: C.text, fontSize: '12px',
                            fontFamily: 'monospace', padding: '1rem',
                            outline: 'none', resize: 'vertical', boxSizing: 'border-box', lineHeight: 1.6
                        }}
                    />
                    {manualHtml.length > 0 && (
                        <p style={{ color: C.textMuted, fontSize: '11px', fontFamily: 'DM Sans', marginTop: '0.4rem' }}>
                            {manualHtml.length.toLocaleString('pt-BR')} caracteres
                        </p>
                    )}
                </div>
            )}

            {/* Footer CTA */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '1rem' }}>
                {selected && inputMode === 'gallery' && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: C.success, fontSize: '13px', fontFamily: 'DM Sans' }}>
                        <span>✓</span>
                        <span style={{ fontWeight: 500 }}>{selected.name}</span>
                    </div>
                )}
                <button
                    className="pc-btn-primary"
                    onClick={onContinue}
                    disabled={!canContinue}
                    style={{
                        marginLeft: 'auto', padding: '0.85rem 2rem',
                        background: canContinue ? C.accent : C.surface2,
                        border: 'none', borderRadius: 10,
                        color: canContinue ? '#0C0C0E' : C.textMuted,
                        fontFamily: 'DM Sans, sans-serif', fontSize: '14px', fontWeight: 600,
                        cursor: canContinue ? 'pointer' : 'not-allowed',
                        transition: 'all 0.2s ease'
                    }}
                >
                    Continuar →
                </button>
            </div>
        </div>
    );
}

function LPCard({ lp, isSelected, onSelect }) {
    const date = new Date(lp.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });

    return (
        <div
            className={`pc-lp-card${isSelected ? ' selected' : ''}`}
            onClick={onSelect}
            style={{
                background: C.surface,
                border: `2px solid ${isSelected ? C.accent : C.border}`,
                borderRadius: 14, cursor: 'pointer', overflow: 'hidden',
                transition: 'all 0.2s ease', position: 'relative',
                boxShadow: isSelected ? '0 0 0 4px rgba(201,169,98,0.12)' : 'none',
            }}
        >
            {/* Top bar */}
            <div style={{
                height: 3,
                background: isSelected
                    ? `linear-gradient(90deg, ${C.accentDark}, ${C.accentLight})`
                    : `linear-gradient(90deg, ${C.border}, transparent)`
            }} />

            {/* Selected check */}
            {isSelected && (
                <div style={{
                    position: 'absolute', top: '0.9rem', right: '0.9rem',
                    width: 22, height: 22, borderRadius: '50%',
                    background: C.accent, display: 'flex', alignItems: 'center',
                    justifyContent: 'center', color: '#0C0C0E', fontSize: '11px', fontWeight: 700
                }}>
                    ✓
                </div>
            )}

            <div style={{ padding: '1.1rem 1.25rem' }}>
                <h4 style={{
                    fontFamily: 'DM Serif Display, serif', fontSize: '0.95rem', fontWeight: 400,
                    color: C.text, margin: '0 0 0.35rem', lineHeight: 1.35,
                    paddingRight: isSelected ? '1.75rem' : 0
                }}>
                    {lp.name}
                </h4>

                {lp.description && (
                    <p style={{
                        color: C.textSec, fontSize: '11px', fontFamily: 'DM Sans',
                        margin: '0 0 0.9rem', lineHeight: 1.5,
                        display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden'
                    }}>
                        {lp.description}
                    </p>
                )}

                <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', alignItems: 'center' }}>
                    <span style={{
                        padding: '0.18rem 0.55rem', borderRadius: 6,
                        background: 'rgba(201,169,98,0.1)', border: '1px solid rgba(201,169,98,0.2)',
                        color: C.accent, fontSize: '10px', fontFamily: 'DM Sans', fontWeight: 600
                    }}>
                        {lp.section_count} seções
                    </span>
                    <span style={{ color: C.textMuted, fontSize: '10px', fontFamily: 'DM Sans' }}>{date}</span>
                    {lp.model_used && (
                        <span style={{
                            padding: '0.18rem 0.55rem', borderRadius: 6,
                            background: C.surface2, border: `1px solid ${C.border}`,
                            color: C.textMuted, fontSize: '10px', fontFamily: 'DM Sans'
                        }}>
                            {lp.model_used.split('/').pop()?.substring(0, 18)}
                        </span>
                    )}
                </div>
            </div>
        </div>
    );
}

// ─── Step 2: Configure ─────────────────────────────────────────────────────────
function StepConfigure({ selectedLp, inputMode, hasOrderBump, onHasOrderBumpChange, orderBumps, onOrderBumpsChange, newOb, onNewObChange, onBack, onAnalyze }) {
    const canAnalyze = hasOrderBump !== null;

    const addOrderBump = () => {
        if (!newOb.nome.trim()) return;
        onOrderBumpsChange([...orderBumps, { ...newOb }]);
        onNewObChange({ nome: '', descricao: '', preco: '' });
    };

    const removeOrderBump = (i) => {
        onOrderBumpsChange(orderBumps.filter((_, idx) => idx !== i));
    };

    return (
        <div style={{ maxWidth: '680px', animation: 'pc-fadein 0.3s ease' }}>
            {/* Selected LP badge */}
            <div style={{
                background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12,
                padding: '1.1rem 1.25rem', marginBottom: '1.75rem',
                display: 'flex', alignItems: 'center', gap: '0.9rem'
            }}>
                <div style={{
                    width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
                    background: 'rgba(74,222,128,0.1)', border: '1px solid rgba(74,222,128,0.25)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px'
                }}>
                    ✓
                </div>
                <div>
                    <div style={{ color: C.success, fontSize: '10px', fontFamily: 'DM Sans', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                        Landing Page Selecionada
                    </div>
                    <div style={{ color: C.text, fontSize: '14px', fontFamily: 'DM Serif Display, serif', marginTop: '0.1rem' }}>
                        {inputMode === 'manual' ? 'HTML colado manualmente' : selectedLp?.name || 'Landing Page'}
                    </div>
                </div>
            </div>

            {/* Order Bump section */}
            <div style={{
                background: C.surface, border: `1px solid ${C.border}`, borderRadius: 16,
                padding: '1.75rem', marginBottom: '1.5rem'
            }}>
                <h3 style={{
                    fontFamily: 'DM Serif Display, serif', fontSize: '1.2rem',
                    color: C.text, margin: '0 0 0.4rem'
                }}>
                    Este produto terá Order Bump?
                </h3>
                <p style={{
                    color: C.textSec, fontSize: '13px', fontFamily: 'DM Sans',
                    margin: '0 0 1.25rem', lineHeight: 1.65
                }}>
                    Order Bumps aparecem no checkout como produtos complementares e precisam ser incluídos no plano de produção.
                </p>

                <div style={{ display: 'flex', gap: '0.65rem', marginBottom: hasOrderBump ? '1.5rem' : 0 }}>
                    <button
                        onClick={() => onHasOrderBumpChange(false)}
                        style={{
                            padding: '0.65rem 1.4rem', borderRadius: 8, cursor: 'pointer',
                            border: `1px solid ${hasOrderBump === false ? C.success : C.border}`,
                            background: hasOrderBump === false ? 'rgba(74,222,128,0.08)' : C.surface2,
                            color: hasOrderBump === false ? C.success : C.textSec,
                            fontFamily: 'DM Sans', fontSize: '13px', fontWeight: 500, transition: 'all 0.2s'
                        }}
                    >
                        Não, apenas a LP
                    </button>
                    <button
                        onClick={() => onHasOrderBumpChange(true)}
                        style={{
                            padding: '0.65rem 1.4rem', borderRadius: 8, cursor: 'pointer',
                            border: `1px solid ${hasOrderBump === true ? C.accent : C.border}`,
                            background: hasOrderBump === true ? 'rgba(201,169,98,0.08)' : C.surface2,
                            color: hasOrderBump === true ? C.accent : C.textSec,
                            fontFamily: 'DM Sans', fontSize: '13px', fontWeight: 500, transition: 'all 0.2s'
                        }}
                    >
                        Sim, tenho Order Bump
                    </button>
                </div>

                {hasOrderBump && (
                    <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: '1.5rem' }}>
                        {/* Existing OBs */}
                        {orderBumps.map((ob, i) => (
                            <div key={i} style={{
                                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                background: C.surface2, border: `1px solid ${C.border}`,
                                borderRadius: 8, padding: '0.75rem 1rem', marginBottom: '0.5rem'
                            }}>
                                <div>
                                    <div style={{ color: C.text, fontSize: '13px', fontFamily: 'DM Sans', fontWeight: 500 }}>{ob.nome}</div>
                                    <div style={{ color: C.textMuted, fontSize: '11px', fontFamily: 'DM Sans' }}>
                                        {ob.preco ? `R$${ob.preco}` : ''}{ob.descricao ? ` — ${ob.descricao}` : ''}
                                    </div>
                                </div>
                                <button onClick={() => removeOrderBump(i)} style={{
                                    background: 'none', border: 'none', color: C.textMuted,
                                    cursor: 'pointer', fontSize: '18px', lineHeight: 1, padding: '0.2rem 0.4rem'
                                }}>×</button>
                            </div>
                        ))}

                        {/* Add OB form */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 120px auto', gap: '0.5rem', marginBottom: '0.5rem' }}>
                            <input
                                type="text"
                                placeholder="Nome do order bump..."
                                value={newOb.nome}
                                onChange={e => onNewObChange({ ...newOb, nome: e.target.value })}
                                onKeyDown={e => e.key === 'Enter' && addOrderBump()}
                                style={{
                                    padding: '0.65rem 0.85rem',
                                    background: C.surface3, border: `1px solid ${C.border}`,
                                    borderRadius: 8, color: C.text, fontSize: '13px',
                                    fontFamily: 'DM Sans', outline: 'none',
                                }}
                            />
                            <input
                                type="text"
                                placeholder="Preço R$"
                                value={newOb.preco}
                                onChange={e => onNewObChange({ ...newOb, preco: e.target.value })}
                                style={{
                                    padding: '0.65rem 0.85rem',
                                    background: C.surface3, border: `1px solid ${C.border}`,
                                    borderRadius: 8, color: C.text, fontSize: '13px',
                                    fontFamily: 'DM Sans', outline: 'none',
                                }}
                            />
                            <button
                                onClick={addOrderBump}
                                disabled={!newOb.nome.trim()}
                                style={{
                                    padding: '0.65rem 1rem', borderRadius: 8, cursor: newOb.nome.trim() ? 'pointer' : 'not-allowed',
                                    background: newOb.nome.trim() ? 'rgba(201,169,98,0.12)' : C.surface3,
                                    border: `1px solid ${newOb.nome.trim() ? C.accent : C.border}`,
                                    color: newOb.nome.trim() ? C.accent : C.textMuted,
                                    fontFamily: 'DM Sans', fontSize: '13px', transition: 'all 0.2s'
                                }}
                            >
                                + Adicionar
                            </button>
                        </div>
                        <input
                            type="text"
                            placeholder="Descrição breve (opcional)"
                            value={newOb.descricao}
                            onChange={e => onNewObChange({ ...newOb, descricao: e.target.value })}
                            style={{
                                width: '100%', padding: '0.65rem 0.85rem', boxSizing: 'border-box',
                                background: C.surface3, border: `1px solid ${C.border}`,
                                borderRadius: 8, color: C.text, fontSize: '13px',
                                fontFamily: 'DM Sans', outline: 'none',
                            }}
                        />
                    </div>
                )}
            </div>

            {/* Model info */}
            <div style={{
                display: 'flex', alignItems: 'center', gap: '0.9rem',
                background: C.surface, border: `1px solid ${C.border}`,
                borderRadius: 12, padding: '1rem 1.25rem', marginBottom: '1.75rem'
            }}>
                <span style={{ fontSize: '1.25rem' }}>🟣</span>
                <div>
                    <div style={{ color: C.text, fontSize: '13px', fontFamily: 'DM Sans', fontWeight: 500 }}>Claude Sonnet 4.6</div>
                    <div style={{ color: C.textMuted, fontSize: '11px', fontFamily: 'DM Sans' }}>via OpenRouter — modelo de análise e estruturação</div>
                </div>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button
                    onClick={onBack}
                    style={{
                        padding: '0.85rem 1.5rem', background: 'transparent',
                        border: `1px solid ${C.border}`, borderRadius: 10,
                        color: C.textSec, fontFamily: 'DM Sans', fontSize: '14px', cursor: 'pointer'
                    }}
                >
                    ← Voltar
                </button>
                <button
                    className="pc-btn-primary"
                    onClick={onAnalyze}
                    disabled={!canAnalyze}
                    style={{
                        flex: 1, padding: '0.85rem 2rem',
                        background: canAnalyze ? C.accent : C.surface2,
                        border: 'none', borderRadius: 10,
                        color: canAnalyze ? '#0C0C0E' : C.textMuted,
                        fontFamily: 'DM Sans', fontSize: '15px', fontWeight: 600,
                        cursor: canAnalyze ? 'pointer' : 'not-allowed', transition: 'all 0.2s ease'
                    }}
                >
                    🚀 Estruturar com Claude Sonnet
                </button>
            </div>
        </div>
    );
}

// ─── Step 3: Dashboard ─────────────────────────────────────────────────────────
function StepDashboard({ analyzing, progress, result, error, activeTab, onTabChange, expandedModule, onExpandModule, onBack, onReset }) {
    if (error) {
        return (
            <div style={{ textAlign: 'center', padding: '5rem 2rem', animation: 'pc-fadein 0.3s ease' }}>
                <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>⚠️</div>
                <h3 style={{ fontFamily: 'DM Serif Display, serif', color: C.text, marginBottom: '0.75rem' }}>Erro na análise</h3>
                <p style={{ color: C.textSec, fontFamily: 'DM Sans', marginBottom: '2rem', maxWidth: '400px', margin: '0 auto 2rem' }}>
                    {error}
                </p>
                <button
                    onClick={onBack}
                    style={{
                        padding: '0.85rem 2rem', background: C.accent, border: 'none',
                        borderRadius: 10, color: '#0C0C0E', fontFamily: 'DM Sans', fontSize: '14px',
                        fontWeight: 600, cursor: 'pointer'
                    }}
                >
                    ← Tentar Novamente
                </button>
            </div>
        );
    }

    if (analyzing || !result) {
        return <AnalysisProgress progress={progress} />;
    }

    const tabs = [
        { id: 'overview', label: 'Visão Geral',        icon: '📦' },
        { id: 'modulos',  label: 'Módulos',             icon: '📚', count: result.produto?.modulos?.length },
        { id: 'bonus',    label: 'Bônus',               icon: '🎁', count: result.bonus?.length },
        { id: 'plano',    label: 'Plano de Produção',   icon: '📋', count: result.planoProducao?.length },
    ];

    return (
        <div style={{ animation: 'pc-fadein 0.3s ease' }}>
            {/* Result header */}
            <div style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
                marginBottom: '1.75rem', gap: '1rem', flexWrap: 'wrap'
            }}>
                <div>
                    <div style={{ color: C.success, fontSize: '10px', fontFamily: 'DM Sans', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '0.35rem' }}>
                        ✓ ANÁLISE CONCLUÍDA
                    </div>
                    <h2 style={{ fontFamily: 'DM Serif Display, serif', fontSize: '1.75rem', color: C.text, margin: '0 0 0.3rem' }}>
                        {result.produto?.nome || 'Produto'}
                    </h2>
                    {result.produto?.subtitulo && (
                        <p style={{ color: C.textSec, fontFamily: 'DM Sans', fontSize: '13px', margin: 0 }}>
                            {result.produto.subtitulo}
                        </p>
                    )}
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0 }}>
                    <button onClick={onBack} style={{
                        padding: '0.6rem 1.1rem', background: 'transparent', border: `1px solid ${C.border}`,
                        borderRadius: 8, color: C.textSec, fontFamily: 'DM Sans', fontSize: '12px', cursor: 'pointer'
                    }}>
                        ← Reconfigurar
                    </button>
                    <button onClick={onReset} style={{
                        padding: '0.6rem 1.1rem', background: 'rgba(201,169,98,0.08)',
                        border: '1px solid rgba(201,169,98,0.25)', borderRadius: 8,
                        color: C.accent, fontFamily: 'DM Sans', fontSize: '12px', cursor: 'pointer'
                    }}>
                        + Nova Análise
                    </button>
                </div>
            </div>

            {/* Quick stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.85rem', marginBottom: '2rem' }}>
                {[
                    { label: 'Páginas',  value: `${result.produto?.paginas || '—'}+`,                                icon: '📄' },
                    { label: 'Imagens',  value: `${result.produto?.imagens || '—'}+`,                                icon: '🖼️' },
                    { label: 'Módulos',  value: result.produto?.modulosCount ?? result.produto?.modulos?.length ?? '—', icon: '📚' },
                    { label: 'Bônus',    value: result.bonus?.length ?? '—',                                          icon: '🎁' },
                ].map((stat, i) => (
                    <div key={i} style={{
                        background: C.surface, border: `1px solid ${C.border}`,
                        borderRadius: 12, padding: '1.1rem 1.25rem',
                        display: 'flex', alignItems: 'center', gap: '0.75rem'
                    }}>
                        <span style={{ fontSize: '1.4rem' }}>{stat.icon}</span>
                        <div>
                            <div style={{ fontFamily: 'DM Sans', fontSize: '1.4rem', fontWeight: 700, color: C.accent, lineHeight: 1 }}>
                                {stat.value}
                            </div>
                            <div style={{ fontFamily: 'DM Sans', fontSize: '11px', color: C.textMuted, marginTop: '0.2rem' }}>
                                {stat.label}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', gap: 0, borderBottom: `1px solid ${C.border}`, marginBottom: '1.75rem' }}>
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => onTabChange(tab.id)}
                        style={{
                            padding: '0.75rem 1.1rem', background: 'transparent', border: 'none',
                            borderBottom: `2px solid ${activeTab === tab.id ? C.accent : 'transparent'}`,
                            color: activeTab === tab.id ? C.accent : C.textSec,
                            fontFamily: 'DM Sans', fontSize: '13px',
                            fontWeight: activeTab === tab.id ? 600 : 400,
                            cursor: 'pointer', transition: 'all 0.2s ease',
                            marginBottom: '-1px', display: 'flex', alignItems: 'center', gap: '0.4rem'
                        }}
                    >
                        {tab.icon} {tab.label}
                        {tab.count != null && (
                            <span style={{
                                padding: '0.1rem 0.4rem', borderRadius: 10, fontSize: '10px',
                                background: activeTab === tab.id ? 'rgba(201,169,98,0.18)' : C.surface2,
                                color: activeTab === tab.id ? C.accent : C.textMuted
                            }}>
                                {tab.count}
                            </span>
                        )}
                    </button>
                ))}
            </div>

            {/* Tab Content */}
            <div className="pc-tab-content" key={activeTab}>
                {activeTab === 'overview' && <OverviewTab result={result} />}
                {activeTab === 'modulos'  && <ModulosTab  result={result} expandedModule={expandedModule} onExpandModule={onExpandModule} />}
                {activeTab === 'bonus'    && <BonusTab    result={result} />}
                {activeTab === 'plano'    && <PlanoTab    result={result} />}
            </div>
        </div>
    );
}

// ─── Tab: Visão Geral ──────────────────────────────────────────────────────────
function OverviewTab({ result }) {
    const produto   = result.produto   || {};
    const metricas  = result.metricas  || [];
    const validacao = result.validacao || {};

    const detailItems = [
        { label: 'Formato',   value: produto.formato   || 'Ebook PDF' },
        { label: 'Páginas',   value: `${produto.paginas || '?'}+` },
        { label: 'Imagens',   value: `${produto.imagens || '?'}+` },
        { label: 'Módulos',   value: produto.modulosCount ?? produto.modulos?.length ?? '?' },
        { label: 'Garantia',  value: `${produto.garantia || 30} dias` },
        { label: 'Público',   value: produto.publicoAlvo || '—' },
    ];

    const validItems = [
        { key: 'paginasCumpridas',  label: 'Páginas prometidas cumpridas' },
        { key: 'imagensCumpridas',  label: 'Imagens prometidas cumpridas' },
        { key: 'modulosCumpridos',  label: 'Módulos listados cobertos' },
        { key: 'bonusCumpridos',    label: 'Todos os bônus com instrução' },
    ];

    return (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', alignItems: 'start' }}>
            {/* Product card */}
            <div>
                <SectionCard title="PRODUTO PRINCIPAL">
                    <h3 style={{ fontFamily: 'DM Serif Display, serif', fontSize: '1.2rem', color: C.text, margin: '0 0 0.35rem' }}>
                        {produto.nome || 'Produto'}
                    </h3>
                    {produto.subtitulo && (
                        <p style={{ color: C.textSec, fontSize: '13px', fontFamily: 'DM Sans', margin: '0 0 1.25rem', lineHeight: 1.6 }}>
                            {produto.subtitulo}
                        </p>
                    )}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.65rem' }}>
                        {detailItems.map((item, i) => (
                            <div key={i} style={{ background: C.surface2, borderRadius: 8, padding: '0.65rem 0.85rem' }}>
                                <div style={{ color: C.textMuted, fontSize: '10px', fontFamily: 'DM Sans', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.2rem' }}>
                                    {item.label}
                                </div>
                                <div style={{ color: C.text, fontSize: '13px', fontFamily: 'DM Sans', fontWeight: 500 }}>
                                    {String(item.value)}
                                </div>
                            </div>
                        ))}
                    </div>
                </SectionCard>

                {/* Validation */}
                {validItems.some(v => validacao[v.key] !== undefined) && (
                    <div style={{ marginTop: '1rem' }}>
                        <SectionCard title="VALIDAÇÃO">
                            {validItems.map(v => (
                                <div key={v.key} style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.5rem' }}>
                                    <span style={{ fontSize: '13px', color: validacao[v.key] ? C.success : C.error }}>
                                        {validacao[v.key] ? '✓' : '✗'}
                                    </span>
                                    <span style={{ color: C.textSec, fontSize: '13px', fontFamily: 'DM Sans' }}>
                                        {v.label}
                                    </span>
                                </div>
                            ))}
                            {validacao.observacoes && (
                                <p style={{ color: C.textMuted, fontSize: '12px', fontFamily: 'DM Sans', margin: '0.75rem 0 0', lineHeight: 1.6, borderTop: `1px solid ${C.border}`, paddingTop: '0.75rem' }}>
                                    {validacao.observacoes}
                                </p>
                            )}
                        </SectionCard>
                    </div>
                )}
            </div>

            {/* Metrics + time */}
            <div>
                <SectionCard title="MÉTRICAS A CUMPRIR">
                    {metricas.length === 0 ? (
                        <p style={{ color: C.textMuted, fontSize: '13px', fontFamily: 'DM Sans' }}>Nenhuma métrica extraída.</p>
                    ) : metricas.map((m, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.65rem', marginBottom: '0.7rem' }}>
                            <div style={{
                                width: 18, height: 18, borderRadius: 4, flexShrink: 0, marginTop: '2px',
                                border: `2px solid ${m.cumprivel ? C.success : C.border}`,
                                background: m.cumprivel ? 'rgba(74,222,128,0.1)' : 'transparent',
                                display: 'flex', alignItems: 'center', justifyContent: 'center'
                            }}>
                                {m.cumprivel && <span style={{ color: C.success, fontSize: '10px', lineHeight: 1 }}>✓</span>}
                            </div>
                            <div>
                                <span style={{ color: C.text, fontSize: '13px', fontFamily: 'DM Sans' }}>{m.item}</span>
                                {m.valor && (
                                    <span style={{ color: C.accent, fontSize: '12px', fontFamily: 'DM Sans', fontWeight: 600, marginLeft: '0.4rem' }}>
                                        {m.valor}
                                    </span>
                                )}
                            </div>
                        </div>
                    ))}
                </SectionCard>

                {result.tempoTotalHoras != null && (
                    <div style={{
                        marginTop: '1rem', background: 'rgba(201,169,98,0.06)',
                        border: '1px solid rgba(201,169,98,0.2)', borderRadius: 12, padding: '1.1rem 1.25rem',
                        display: 'flex', alignItems: 'center', gap: '1rem'
                    }}>
                        <span style={{ fontSize: '1.6rem' }}>⏱️</span>
                        <div>
                            <div style={{ color: C.accent, fontFamily: 'DM Sans', fontWeight: 700, fontSize: '1.4rem', lineHeight: 1 }}>
                                ~{result.tempoTotalHoras}h
                            </div>
                            <div style={{ color: C.textSec, fontSize: '12px', fontFamily: 'DM Sans', marginTop: '0.2rem' }}>
                                Tempo total estimado de produção
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

// ─── Tab: Módulos ──────────────────────────────────────────────────────────────
function ModulosTab({ result, expandedModule, onExpandModule }) {
    const modulos = result.produto?.modulos || [];

    if (modulos.length === 0) {
        return <EmptyState icon="📚" title="Sem módulos" desc="Nenhum módulo foi extraído desta landing page." />;
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            {modulos.map((mod, i) => {
                const isOpen = expandedModule === i;
                return (
                    <div key={i} style={{
                        background: C.surface, border: `1px solid ${isOpen ? C.borderLight : C.border}`,
                        borderRadius: 12, overflow: 'hidden', transition: 'all 0.2s ease'
                    }}>
                        <div
                            onClick={() => onExpandModule(isOpen ? null : i)}
                            style={{
                                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                padding: '1rem 1.25rem', cursor: 'pointer',
                                background: isOpen ? C.surface2 : 'transparent'
                            }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                                <div style={{
                                    width: 30, height: 30, borderRadius: '50%', flexShrink: 0,
                                    background: 'rgba(201,169,98,0.12)', border: '1px solid rgba(201,169,98,0.25)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    color: C.accent, fontSize: '12px', fontFamily: 'DM Sans', fontWeight: 700
                                }}>
                                    {mod.numero ?? i + 1}
                                </div>
                                <div>
                                    <div style={{ color: C.text, fontSize: '13px', fontFamily: 'DM Sans', fontWeight: 600 }}>
                                        {mod.nome}
                                    </div>
                                    {mod.paginasEstimadas && (
                                        <div style={{ color: C.textMuted, fontSize: '11px', fontFamily: 'DM Sans', marginTop: '0.1rem' }}>
                                            ~{mod.paginasEstimadas} páginas
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                                {mod.topicos?.length > 0 && (
                                    <span style={{
                                        padding: '0.18rem 0.55rem', borderRadius: 10,
                                        background: C.surface2, border: `1px solid ${C.border}`,
                                        color: C.textSec, fontSize: '11px', fontFamily: 'DM Sans'
                                    }}>
                                        {mod.topicos.length} tópicos
                                    </span>
                                )}
                                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={C.textMuted} strokeWidth="2"
                                    style={{ transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', flexShrink: 0 }}>
                                    <polyline points="6 9 12 15 18 9" />
                                </svg>
                            </div>
                        </div>

                        {isOpen && mod.topicos?.length > 0 && (
                            <div style={{ padding: '0 1.25rem 1.1rem', borderTop: `1px solid ${C.border}`, paddingTop: '0.9rem' }}>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.4rem' }}>
                                    {mod.topicos.map((t, j) => (
                                        <div key={j} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.4rem' }}>
                                            <span style={{ color: C.success, fontSize: '11px', marginTop: '3px', flexShrink: 0 }}>•</span>
                                            <span style={{ color: C.textSec, fontSize: '12px', fontFamily: 'DM Sans', lineHeight: 1.5 }}>{t}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
}

// ─── Tab: Bônus ────────────────────────────────────────────────────────────────
function BonusTab({ result }) {
    const bonus     = result.bonus     || [];
    const orderBumps = result.orderBumps || [];

    if (bonus.length === 0 && orderBumps.length === 0) {
        return <EmptyState icon="🎁" title="Sem bônus" desc="Nenhum bônus foi extraído desta landing page." />;
    }

    return (
        <div>
            {bonus.length > 0 && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
                    {bonus.map((b, i) => {
                        const tipo = TIPO_CONFIG[b.tipo] || TIPO_CONFIG.ebook_simples;
                        return (
                            <div key={i} style={{
                                background: C.surface, borderRadius: 14, overflow: 'hidden',
                                border: `1px solid ${b.isSuper ? 'rgba(201,169,98,0.4)' : C.border}`,
                                boxShadow: b.isSuper ? '0 0 20px rgba(201,169,98,0.08)' : 'none'
                            }}>
                                <div style={{
                                    height: 3,
                                    background: b.isSuper
                                        ? `linear-gradient(90deg, ${C.accentDark}, ${C.accentLight})`
                                        : `linear-gradient(90deg, ${tipo.color}50, transparent)`
                                }} />
                                <div style={{ padding: '1.1rem 1.25rem' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.65rem' }}>
                                        <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                                            <span style={{
                                                padding: '0.18rem 0.55rem', borderRadius: 6,
                                                background: `${tipo.color}18`, border: `1px solid ${tipo.color}35`,
                                                color: tipo.color, fontSize: '10px', fontFamily: 'DM Sans', fontWeight: 600
                                            }}>
                                                {tipo.icon} {tipo.label}
                                            </span>
                                            {b.isSuper && (
                                                <span style={{
                                                    padding: '0.18rem 0.55rem', borderRadius: 6,
                                                    background: 'rgba(201,169,98,0.12)', border: '1px solid rgba(201,169,98,0.3)',
                                                    color: C.accent, fontSize: '10px', fontFamily: 'DM Sans', fontWeight: 600
                                                }}>
                                                    ⭐ SUPER
                                                </span>
                                            )}
                                        </div>
                                        {b.valorAtribuido && (
                                            <span style={{ color: C.error, fontSize: '11px', fontFamily: 'DM Sans', textDecoration: 'line-through', flexShrink: 0 }}>
                                                {b.valorAtribuido}
                                            </span>
                                        )}
                                    </div>

                                    <h4 style={{ fontFamily: 'DM Sans', fontSize: '13px', fontWeight: 600, color: C.text, margin: '0 0 0.35rem' }}>
                                        {b.nome}
                                    </h4>
                                    {b.descricao && (
                                        <p style={{ color: C.textSec, fontSize: '11px', fontFamily: 'DM Sans', margin: '0 0 0.85rem', lineHeight: 1.5 }}>
                                            {b.descricao}
                                        </p>
                                    )}

                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                                        <span style={{ color: C.textMuted, fontSize: '11px', fontFamily: 'DM Sans' }}>🔧</span>
                                        <span style={{ color: C.textMuted, fontSize: '11px', fontFamily: 'DM Sans' }}>
                                            {b.ferramenta || tipo.label}
                                        </span>
                                        {b.paginasEstimadas > 0 && (
                                            <>
                                                <span style={{ color: C.border }}>·</span>
                                                <span style={{ color: C.textMuted, fontSize: '11px', fontFamily: 'DM Sans' }}>~{b.paginasEstimadas}pg</span>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {orderBumps.length > 0 && (
                <>
                    <div style={{ color: C.accent, fontSize: '10px', fontFamily: 'DM Sans', fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '0.9rem' }}>
                        ORDER BUMPS
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '0.85rem' }}>
                        {orderBumps.map((ob, i) => (
                            <div key={i} style={{
                                background: C.surface, border: '1px solid rgba(96,165,250,0.25)',
                                borderRadius: 12, padding: '1.1rem 1.25rem'
                            }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                                    <span style={{
                                        padding: '0.18rem 0.55rem', borderRadius: 6,
                                        background: 'rgba(96,165,250,0.1)', color: '#60A5FA',
                                        fontSize: '10px', fontFamily: 'DM Sans', fontWeight: 600
                                    }}>
                                        💳 Order Bump
                                    </span>
                                    {ob.preco && (
                                        <span style={{ color: C.accent, fontFamily: 'DM Sans', fontWeight: 700, fontSize: '14px' }}>
                                            R${ob.preco}
                                        </span>
                                    )}
                                </div>
                                <h4 style={{ fontFamily: 'DM Sans', fontSize: '13px', fontWeight: 600, color: C.text, margin: '0 0 0.25rem' }}>
                                    {ob.nome}
                                </h4>
                                {ob.descricao && (
                                    <p style={{ color: C.textSec, fontSize: '11px', fontFamily: 'DM Sans', margin: '0 0 0.5rem' }}>{ob.descricao}</p>
                                )}
                                {ob.ferramenta && (
                                    <div style={{ color: C.textMuted, fontSize: '11px', fontFamily: 'DM Sans' }}>🔧 {ob.ferramenta}</div>
                                )}
                            </div>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
}

// ─── Tab: Plano de Produção ────────────────────────────────────────────────────
function PlanoTab({ result }) {
    const plano = result.planoProducao || [];

    if (plano.length === 0) {
        return <EmptyState icon="📋" title="Plano não gerado" desc="O plano de produção não foi extraído desta análise." />;
    }

    const grouped = {};
    for (const item of plano) {
        const fase = item.fase || 'Outros';
        if (!grouped[fase]) grouped[fase] = [];
        grouped[fase].push(item);
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
            {Object.entries(grouped).map(([fase, items]) => {
                const faseColor = FASE_COLORS[fase] || C.accent;
                const totalMin = items.reduce((acc, it) => acc + (it.tempoMinutos || 0), 0);

                return (
                    <div key={fase}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.75rem' }}>
                            <div style={{ width: 7, height: 7, borderRadius: '50%', background: faseColor, flexShrink: 0 }} />
                            <span style={{ color: faseColor, fontSize: '10px', fontFamily: 'DM Sans', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
                                {fase}
                            </span>
                            {totalMin > 0 && (
                                <span style={{ color: C.textMuted, fontSize: '11px', fontFamily: 'DM Sans', marginLeft: 'auto' }}>
                                    ~{totalMin >= 60 ? `${Math.round(totalMin / 60)}h` : `${totalMin}min`}
                                </span>
                            )}
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            {items.map((item, i) => (
                                <div key={i} style={{
                                    background: C.surface, border: `1px solid ${C.border}`,
                                    borderRadius: 10, padding: '0.9rem 1.1rem',
                                    display: 'flex', alignItems: 'flex-start', gap: '0.9rem'
                                }}>
                                    <div style={{
                                        width: 26, height: 26, borderRadius: '50%', flexShrink: 0,
                                        background: `${faseColor}18`, border: `1px solid ${faseColor}35`,
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        color: faseColor, fontSize: '11px', fontFamily: 'DM Sans', fontWeight: 700
                                    }}>
                                        {item.passo ?? i + 1}
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.4rem' }}>
                                            <span style={{ color: C.text, fontSize: '13px', fontFamily: 'DM Sans', fontWeight: 500 }}>
                                                {item.nome}
                                            </span>
                                            <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center', flexShrink: 0 }}>
                                                {item.ferramenta && (
                                                    <span style={{
                                                        padding: '0.15rem 0.5rem', borderRadius: 6,
                                                        background: C.surface2, border: `1px solid ${C.border}`,
                                                        color: C.textMuted, fontSize: '10px', fontFamily: 'DM Sans'
                                                    }}>
                                                        {item.ferramenta}
                                                    </span>
                                                )}
                                                {item.tempoMinutos > 0 && (
                                                    <span style={{ color: C.textMuted, fontSize: '10px', fontFamily: 'DM Sans' }}>
                                                        ~{item.tempoMinutos}min
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        {item.descricao && (
                                            <p style={{ color: C.textSec, fontSize: '12px', fontFamily: 'DM Sans', margin: '0.25rem 0 0', lineHeight: 1.55 }}>
                                                {item.descricao}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

// ─── Analysis Progress ─────────────────────────────────────────────────────────
function AnalysisProgress({ progress }) {
    const stages = [
        { id: 'reading',   label: 'Lendo a landing page',     icon: '📄' },
        { id: 'analyzing', label: 'Analisando promessas',      icon: '🔍' },
        { id: 'parsing',   label: 'Estruturando plano',        icon: '📋' },
        { id: 'done',      label: 'Plano concluído',           icon: '✅' },
    ];
    const currentIdx = stages.findIndex(s => s.id === progress?.stage);

    return (
        <div style={{ maxWidth: '460px', margin: '0 auto', padding: '4rem 2rem', textAlign: 'center' }}>
            <div style={{
                width: 72, height: 72, borderRadius: '50%', margin: '0 auto 1.75rem',
                background: 'radial-gradient(circle, rgba(201,169,98,0.3) 0%, rgba(201,169,98,0.04) 70%)',
                border: '2px solid rgba(201,169,98,0.25)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '1.75rem', animation: 'pc-pulse 2.5s infinite'
            }}>
                🧠
            </div>

            <h3 style={{ fontFamily: 'DM Serif Display, serif', fontSize: '1.35rem', color: C.text, margin: '0 0 0.5rem' }}>
                Claude está analisando...
            </h3>
            <p style={{ color: C.textSec, fontFamily: 'DM Sans', fontSize: '13px', margin: '0 0 1.75rem' }}>
                {progress?.message || 'Iniciando análise...'}
            </p>

            {/* Progress bar */}
            <div style={{ height: 4, background: C.surface2, borderRadius: 4, marginBottom: '2rem', overflow: 'hidden' }}>
                <div style={{
                    height: '100%', borderRadius: 4,
                    background: `linear-gradient(90deg, ${C.accentDark}, ${C.accentLight})`,
                    width: `${progress?.pct || 5}%`, transition: 'width 0.6s ease'
                }} />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', textAlign: 'left' }}>
                {stages.map((s, i) => {
                    const isDone   = i < currentIdx;
                    const isActive = i === currentIdx;
                    return (
                        <div key={s.id} style={{
                            display: 'flex', alignItems: 'center', gap: '0.65rem',
                            padding: '0.55rem 0.9rem', borderRadius: 8,
                            background: isActive ? 'rgba(201,169,98,0.06)' : 'transparent',
                            border: `1px solid ${isActive ? 'rgba(201,169,98,0.18)' : 'transparent'}`
                        }}>
                            <span style={{ fontSize: '0.95rem', opacity: isDone || isActive ? 1 : 0.3 }}>
                                {isDone ? '✓' : s.icon}
                            </span>
                            <span style={{
                                fontFamily: 'DM Sans', fontSize: '12px',
                                color: isDone ? C.success : isActive ? C.text : C.textMuted,
                                fontWeight: isActive ? 500 : 400
                            }}>
                                {s.label}
                            </span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

// ─── Shared primitives ─────────────────────────────────────────────────────────
function SectionCard({ title, children }) {
    return (
        <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, overflow: 'hidden' }}>
            <div style={{ padding: '1rem 1.25rem', borderBottom: `1px solid ${C.border}` }}>
                <span style={{ color: C.accent, fontSize: '10px', fontFamily: 'DM Sans', fontWeight: 700, letterSpacing: '0.13em', textTransform: 'uppercase' }}>
                    {title}
                </span>
            </div>
            <div style={{ padding: '1.25rem' }}>
                {children}
            </div>
        </div>
    );
}

function EmptyState({ icon, title, desc }) {
    return (
        <div style={{
            textAlign: 'center', padding: '3.5rem 2rem',
            background: C.surface, borderRadius: 16, border: `1px solid ${C.border}`
        }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '0.9rem' }}>{icon}</div>
            <h3 style={{ fontFamily: 'DM Serif Display, serif', color: C.text, margin: '0 0 0.5rem', fontSize: '1.2rem' }}>
                {title}
            </h3>
            <p style={{ color: C.textSec, fontFamily: 'DM Sans', fontSize: '13px', margin: 0 }}>{desc}</p>
        </div>
    );
}
