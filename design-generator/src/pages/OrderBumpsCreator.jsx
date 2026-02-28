import { useState, useEffect } from 'react';
import { fetchLandingPages, fetchLandingPage } from '../services/landingPagesService';
import { generateOrderBumps, generateSingleReplacement, saveOrderBumps, fetchOrderBumpsByLp } from '../services/orderBumpsService';

// ─── Design Tokens ──────────────────────────────────────────────────────────
const C = {
    bg: '#0C0C0E', surface: '#131316', surface2: '#1A1A1F', surface3: '#222228',
    border: 'rgba(255,255,255,0.06)', text: '#F5F0E8', textSec: 'rgba(245,240,232,0.72)',
    textMuted: 'rgba(245,240,232,0.38)', accent: '#C9A962', accentDark: '#B8943A',
    accentLight: '#E8D5A3', success: '#4ADE80', error: '#F87171', warning: '#FBBF24',
};

const CAT_COLORS = {
    complementar: '#60A5FA', aprofundamento: '#A78BFA', ferramenta: '#F97316',
    visual: '#34D399', devocional: '#F472B6',
};

export default function OrderBumpsCreator() {
    // ── State ────────────────────────────────────────────────────────────────
    const [step, setStep] = useState('select'); // select | generating | review | saved
    const [lps, setLps] = useState([]);
    const [selectedLp, setSelectedLp] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [orderBumps, setOrderBumps] = useState([]);
    const [savedBumps, setSavedBumps] = useState([]);
    const [progress, setProgress] = useState(null);
    const [replacingIdx, setReplacingIdx] = useState(null);
    const [lpHtml, setLpHtml] = useState('');
    const [expandedCard, setExpandedCard] = useState(null);

    useEffect(() => { loadLps(); }, []);

    const loadLps = async () => {
        try { setLps(await fetchLandingPages()); } catch (e) { console.error(e); }
    };

    // ── Select LP and generate ───────────────────────────────────────────────
    const handleSelectLp = async (lp) => {
        setSelectedLp(lp);
        setStep('generating');
        setProgress({ phase: 'loading', message: '📄 Carregando HTML da LP...', percentage: 5 });

        try {
            const full = await fetchLandingPage(lp.id);
            const html = full.html_content || '';
            setLpHtml(html);

            const bumps = await generateOrderBumps(html, 7, [], setProgress);
            setOrderBumps(bumps);
            setStep('review');
        } catch (err) {
            console.error(err);
            alert('Erro ao gerar order bumps: ' + err.message);
            setStep('select');
        }
        setProgress(null);
    };

    // ── Remove + replace ─────────────────────────────────────────────────────
    const handleRemove = async (idx) => {
        setReplacingIdx(idx);
        try {
            const remaining = orderBumps.filter((_, i) => i !== idx);
            const replacement = await generateSingleReplacement(lpHtml, remaining);
            if (replacement) {
                const updated = [...remaining];
                updated.splice(idx, 0, replacement);
                setOrderBumps(updated);
            } else {
                setOrderBumps(remaining);
            }
        } catch (err) {
            console.error(err);
            setOrderBumps(orderBumps.filter((_, i) => i !== idx));
        }
        setReplacingIdx(null);
    };

    // ── Approve and save ─────────────────────────────────────────────────────
    const handleApprove = async () => {
        try {
            setProgress({ phase: 'saving', message: '💾 Salvando no banco de dados...', percentage: 50 });
            await saveOrderBumps(selectedLp.id, selectedLp.name, orderBumps);
            const saved = await fetchOrderBumpsByLp(selectedLp.id);
            setSavedBumps(saved);
            setStep('saved');
        } catch (err) {
            console.error(err);
            alert('Erro ao salvar: ' + err.message);
        }
        setProgress(null);
    };

    // ── Reset ────────────────────────────────────────────────────────────────
    const handleReset = () => {
        setStep('select');
        setSelectedLp(null);
        setOrderBumps([]);
        setSavedBumps([]);
        setLpHtml('');
        setExpandedCard(null);
    };

    // ── Filtered LPs ─────────────────────────────────────────────────────────
    const filteredLps = lps.filter(lp =>
        lp.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="page-container" style={{ padding: '2.5rem 3rem', maxWidth: '1300px', margin: '0 auto' }}>
            <style>{`
                @keyframes ob-fadein { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
                @keyframes ob-pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
                @keyframes ob-spin { to { transform: rotate(360deg); } }
                .ob-card { transition: all 0.25s cubic-bezier(0.4,0,0.2,1); }
                .ob-card:hover { border-color: rgba(201,169,98,0.3) !important; transform: translateY(-2px); box-shadow: 0 8px 24px rgba(0,0,0,0.3); }
                .ob-remove-btn { transition: all 0.2s; }
                .ob-remove-btn:hover { background: rgba(248,113,113,0.15) !important; color: ${C.error} !important; border-color: rgba(248,113,113,0.3) !important; }
                .ob-lp-card { transition: all 0.2s; cursor: pointer; }
                .ob-lp-card:hover { border-color: rgba(201,169,98,0.35) !important; background: rgba(201,169,98,0.04) !important; transform: translateY(-1px); }
            `}</style>

            {/* ── Header ── */}
            <div style={{ marginBottom: '2rem' }}>
                <div style={{ color: C.accent, fontSize: '10px', fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: '0.5rem', fontFamily: 'DM Sans' }}>
                    FERRAMENTAS DE PRODUÇÃO
                </div>
                <h1 style={{ fontFamily: 'DM Serif Display, serif', fontSize: '2rem', color: C.text, margin: 0, fontWeight: 400 }}>
                    Criador de <span style={{ color: C.accent }}>Order Bumps</span>
                </h1>
                <p style={{ color: C.textSec, fontSize: '14px', fontFamily: 'DM Sans', margin: '0.5rem 0 0', lineHeight: 1.6 }}>
                    Selecione uma landing page e o Conselho IA sugerirá 7 order bumps complementares.
                </p>
            </div>

            {/* ── Step: Select LP ── */}
            {step === 'select' && (
                <div style={{ animation: 'ob-fadein 0.3s ease' }}>
                    <div style={{
                        background: C.surface, border: `1px solid ${C.border}`, borderRadius: 16,
                        padding: '1.75rem', marginBottom: '1.5rem'
                    }}>
                        <h3 style={{ fontFamily: 'DM Serif Display, serif', fontSize: '1.15rem', color: C.text, margin: '0 0 0.5rem' }}>
                            Selecione a Landing Page
                        </h3>
                        <p style={{ color: C.textMuted, fontSize: '12px', fontFamily: 'DM Sans', margin: '0 0 1.25rem' }}>
                            O Claude Sonnet analisará a LP e sugerirá order bumps complementares ao produto.
                        </p>

                        <input
                            type="text"
                            placeholder="🔍 Buscar landing page..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            style={{
                                width: '100%', boxSizing: 'border-box', padding: '0.75rem 1rem',
                                background: C.surface2, border: `1px solid ${C.border}`, borderRadius: 10,
                                color: C.text, fontSize: '13px', fontFamily: 'DM Sans', outline: 'none',
                                marginBottom: '1rem', transition: 'border-color 0.2s'
                            }}
                            onFocus={e => e.target.style.borderColor = C.accent}
                            onBlur={e => e.target.style.borderColor = C.border}
                        />

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '0.75rem', maxHeight: '420px', overflowY: 'auto' }}>
                            {filteredLps.length === 0 ? (
                                <p style={{ color: C.textMuted, fontSize: '13px', fontFamily: 'DM Sans', gridColumn: '1 / -1', textAlign: 'center', padding: '2rem' }}>
                                    Nenhuma LP encontrada. Crie uma no LP Builder primeiro.
                                </p>
                            ) : filteredLps.map(lp => (
                                <div
                                    key={lp.id}
                                    className="ob-lp-card"
                                    onClick={() => handleSelectLp(lp)}
                                    style={{
                                        background: C.surface2, border: `1px solid ${C.border}`, borderRadius: 12,
                                        padding: '1rem 1.15rem'
                                    }}
                                >
                                    <div style={{ color: C.text, fontSize: '13px', fontFamily: 'DM Sans', fontWeight: 600, marginBottom: '0.3rem' }}>
                                        {lp.name}
                                    </div>
                                    <div style={{ color: C.textMuted, fontSize: '11px', fontFamily: 'DM Sans' }}>
                                        {lp.section_count || '?'} seções · {new Date(lp.created_at).toLocaleDateString('pt-BR')}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* ── Step: Generating ── */}
            {step === 'generating' && progress && (
                <div style={{
                    animation: 'ob-fadein 0.3s ease', display: 'flex', flexDirection: 'column',
                    alignItems: 'center', justifyContent: 'center', minHeight: '340px', gap: '1.5rem'
                }}>
                    <div style={{
                        width: 56, height: 56, borderRadius: '50%',
                        border: `3px solid rgba(201,169,98,0.15)`, borderTopColor: C.accent,
                        animation: 'ob-spin 0.8s linear infinite'
                    }} />
                    <div style={{ textAlign: 'center' }}>
                        <p style={{ color: C.text, fontSize: '15px', fontFamily: 'DM Serif Display, serif', margin: '0 0 0.5rem' }}>
                            {progress.message}
                        </p>
                        <div style={{ width: '260px', height: '4px', background: C.surface2, borderRadius: 4, overflow: 'hidden' }}>
                            <div style={{
                                width: `${progress.percentage}%`, height: '100%', borderRadius: 4,
                                background: `linear-gradient(90deg, ${C.accentDark}, ${C.accentLight})`,
                                transition: 'width 0.5s ease'
                            }} />
                        </div>
                        <p style={{ color: C.textMuted, fontSize: '11px', fontFamily: 'DM Sans', margin: '0.5rem 0 0' }}>
                            {selectedLp?.name}
                        </p>
                    </div>
                </div>
            )}

            {/* ── Step: Review OBs ── */}
            {step === 'review' && (
                <div style={{ animation: 'ob-fadein 0.3s ease' }}>
                    {/* LP badge */}
                    <div style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12,
                        padding: '0.85rem 1.25rem', marginBottom: '1.5rem'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <div style={{
                                width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
                                background: 'rgba(201,169,98,0.1)', border: '1px solid rgba(201,169,98,0.25)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px'
                            }}>📄</div>
                            <div>
                                <div style={{ color: C.accent, fontSize: '10px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', fontFamily: 'DM Sans' }}>
                                    ORDER BUMPS PARA
                                </div>
                                <div style={{ color: C.text, fontSize: '14px', fontFamily: 'DM Serif Display, serif' }}>
                                    {selectedLp?.name}
                                </div>
                            </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <span style={{ color: C.textMuted, fontSize: '12px', fontFamily: 'DM Sans' }}>
                                {orderBumps.length} sugestões
                            </span>
                            <button onClick={handleReset} style={{
                                background: 'transparent', border: `1px solid ${C.border}`, color: C.textMuted,
                                padding: '6px 12px', borderRadius: 6, cursor: 'pointer', fontSize: '11px', fontFamily: 'DM Sans',
                                transition: 'all 0.2s'
                            }}>
                                ← Nova análise
                            </button>
                        </div>
                    </div>

                    {/* Grid of OB cards */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
                        {orderBumps.map((ob, idx) => (
                            <div
                                key={idx}
                                className="ob-card"
                                style={{
                                    background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14,
                                    overflow: 'hidden', position: 'relative',
                                    animation: `ob-fadein 0.35s ease ${idx * 0.05}s both`,
                                    opacity: replacingIdx === idx ? 0.4 : 1,
                                }}
                            >
                                {/* Replacing spinner overlay */}
                                {replacingIdx === idx && (
                                    <div style={{
                                        position: 'absolute', inset: 0, background: 'rgba(12,12,14,0.85)',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2,
                                        borderRadius: 14
                                    }}>
                                        <div style={{
                                            width: 32, height: 32, borderRadius: '50%',
                                            border: '2px solid rgba(201,169,98,0.2)', borderTopColor: C.accent,
                                            animation: 'ob-spin 0.7s linear infinite'
                                        }} />
                                    </div>
                                )}

                                {/* Category bar */}
                                <div style={{ height: 3, background: CAT_COLORS[ob.categoria] || C.accent }} />

                                <div style={{ padding: '1.15rem 1.25rem' }}>
                                    {/* Top: category + price + remove */}
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.65rem' }}>
                                        <span style={{
                                            padding: '0.15rem 0.5rem', borderRadius: 5,
                                            background: `${CAT_COLORS[ob.categoria] || C.accent}15`,
                                            border: `1px solid ${CAT_COLORS[ob.categoria] || C.accent}30`,
                                            color: CAT_COLORS[ob.categoria] || C.accent,
                                            fontSize: '10px', fontFamily: 'DM Sans', fontWeight: 600, textTransform: 'capitalize'
                                        }}>
                                            {ob.categoria || 'complementar'}
                                        </span>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <span style={{ color: C.accent, fontSize: '16px', fontFamily: 'DM Serif Display, serif', fontWeight: 400 }}>
                                                R${typeof ob.preco === 'number' ? ob.preco.toFixed(2).replace('.', ',') : ob.preco}
                                            </span>
                                            <button
                                                className="ob-remove-btn"
                                                onClick={() => handleRemove(idx)}
                                                disabled={replacingIdx !== null}
                                                style={{
                                                    background: 'transparent', border: `1px solid ${C.border}`, color: C.textMuted,
                                                    width: 26, height: 26, borderRadius: 6, cursor: replacingIdx !== null ? 'not-allowed' : 'pointer',
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', lineHeight: 1
                                                }}
                                            >×</button>
                                        </div>
                                    </div>

                                    {/* Name */}
                                    <h4 style={{ fontFamily: 'DM Sans', fontSize: '14px', fontWeight: 600, color: C.text, margin: '0 0 0.35rem' }}>
                                        {ob.nome}
                                    </h4>

                                    {/* Description */}
                                    <p style={{ color: C.textSec, fontSize: '12px', fontFamily: 'DM Sans', margin: '0 0 0.85rem', lineHeight: 1.55 }}>
                                        {ob.descricao}
                                    </p>

                                    {/* Expandable sections */}
                                    <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: '0.75rem' }}>
                                        <button
                                            onClick={() => setExpandedCard(expandedCard === idx ? null : idx)}
                                            style={{
                                                background: 'none', border: 'none', color: C.accent, cursor: 'pointer',
                                                fontSize: '11px', fontFamily: 'DM Sans', fontWeight: 600, padding: 0,
                                                display: 'flex', alignItems: 'center', gap: '4px'
                                            }}
                                        >
                                            {expandedCard === idx ? '▾' : '▸'} Copy & Entregáveis
                                        </button>

                                        {expandedCard === idx && (
                                            <div style={{ marginTop: '0.65rem', animation: 'ob-fadein 0.2s ease' }}>
                                                <div style={{ marginBottom: '0.65rem' }}>
                                                    <div style={{ color: C.textMuted, fontSize: '9px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.25rem', fontFamily: 'DM Sans' }}>
                                                        Copy para Checkout
                                                    </div>
                                                    <p style={{ color: C.textSec, fontSize: '11px', fontFamily: 'DM Sans', margin: 0, lineHeight: 1.55, fontStyle: 'italic' }}>
                                                        "{ob.copyCheckout}"
                                                    </p>
                                                </div>
                                                <div style={{ marginBottom: '0.65rem' }}>
                                                    <div style={{ color: C.textMuted, fontSize: '9px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.25rem', fontFamily: 'DM Sans' }}>
                                                        Entregáveis
                                                    </div>
                                                    <p style={{ color: C.textSec, fontSize: '11px', fontFamily: 'DM Sans', margin: 0, lineHeight: 1.55 }}>
                                                        {ob.entregaveis}
                                                    </p>
                                                </div>
                                                {ob.raciocinio && (
                                                    <div>
                                                        <div style={{ color: C.textMuted, fontSize: '9px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.25rem', fontFamily: 'DM Sans' }}>
                                                            Raciocínio Estratégico
                                                        </div>
                                                        <p style={{ color: C.textMuted, fontSize: '11px', fontFamily: 'DM Sans', margin: 0, lineHeight: 1.55 }}>
                                                            {ob.raciocinio}
                                                        </p>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Bottom bar: Approve */}
                    <div style={{
                        position: 'sticky', bottom: 0, left: 0, right: 0,
                        background: 'rgba(12,12,14,0.92)', backdropFilter: 'blur(12px)',
                        borderTop: `1px solid ${C.border}`, borderRadius: '16px 16px 0 0',
                        padding: '1rem 1.5rem',
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    }}>
                        <div style={{ color: C.textSec, fontSize: '13px', fontFamily: 'DM Sans' }}>
                            <span style={{ color: C.accent, fontWeight: 700 }}>{orderBumps.length}</span> order bumps prontos para aprovação
                        </div>
                        <button
                            onClick={handleApprove}
                            disabled={orderBumps.length === 0 || progress !== null}
                            style={{
                                background: `linear-gradient(90deg, ${C.accentDark}, ${C.accentLight})`,
                                border: 'none', color: '#0C0C0E', padding: '0.75rem 2rem',
                                borderRadius: 8, fontSize: '14px', fontWeight: 700, fontFamily: 'DM Sans',
                                cursor: orderBumps.length === 0 ? 'not-allowed' : 'pointer',
                                boxShadow: '0 4px 16px rgba(201,169,98,0.25)',
                                transition: 'all 0.25s', display: 'flex', alignItems: 'center', gap: '6px'
                            }}
                        >
                            ✓ Aprovar {orderBumps.length} Order Bumps
                        </button>
                    </div>
                </div>
            )}

            {/* ── Step: Saved ── */}
            {step === 'saved' && (
                <div style={{ animation: 'ob-fadein 0.3s ease' }}>
                    {/* Success banner */}
                    <div style={{
                        background: 'rgba(74,222,128,0.06)', border: '1px solid rgba(74,222,128,0.2)', borderRadius: 14,
                        padding: '1.5rem 1.75rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem'
                    }}>
                        <div style={{
                            width: 44, height: 44, borderRadius: '50%', flexShrink: 0,
                            background: 'rgba(74,222,128,0.12)', border: '1px solid rgba(74,222,128,0.25)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px'
                        }}>✓</div>
                        <div>
                            <h3 style={{ fontFamily: 'DM Serif Display, serif', fontSize: '1.1rem', color: C.success, margin: '0 0 0.2rem', fontWeight: 400 }}>
                                Order Bumps Salvos!
                            </h3>
                            <p style={{ color: C.textSec, fontSize: '12px', fontFamily: 'DM Sans', margin: 0 }}>
                                {savedBumps.length} order bumps para "{selectedLp?.name}" foram salvos no banco de dados.
                                Eles estarão disponíveis no Estruturador de Produto.
                            </p>
                        </div>
                    </div>

                    {/* Saved OBs list */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '0.85rem', marginBottom: '2rem' }}>
                        {savedBumps.map((ob, i) => (
                            <div key={ob.id || i} style={{
                                background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12,
                                padding: '1rem 1.15rem'
                            }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                                    <span style={{
                                        padding: '0.12rem 0.45rem', borderRadius: 4,
                                        background: `${CAT_COLORS[ob.categoria] || C.accent}15`,
                                        color: CAT_COLORS[ob.categoria] || C.accent,
                                        fontSize: '9px', fontFamily: 'DM Sans', fontWeight: 600, textTransform: 'capitalize'
                                    }}>{ob.categoria}</span>
                                    <span style={{ color: C.accent, fontSize: '14px', fontFamily: 'DM Serif Display, serif' }}>
                                        R${parseFloat(ob.preco).toFixed(2).replace('.', ',')}
                                    </span>
                                </div>
                                <h4 style={{ fontFamily: 'DM Sans', fontSize: '13px', fontWeight: 600, color: C.text, margin: '0 0 0.25rem' }}>
                                    {ob.nome}
                                </h4>
                                <p style={{ color: C.textMuted, fontSize: '11px', fontFamily: 'DM Sans', margin: 0, lineHeight: 1.5 }}>
                                    {ob.descricao}
                                </p>
                            </div>
                        ))}
                    </div>

                    {/* Actions */}
                    <div style={{ display: 'flex', gap: '0.75rem' }}>
                        <button onClick={handleReset} style={{
                            background: C.surface, border: `1px solid ${C.border}`, color: C.text,
                            padding: '0.7rem 1.5rem', borderRadius: 8, cursor: 'pointer',
                            fontSize: '13px', fontWeight: 500, fontFamily: 'DM Sans', transition: 'all 0.2s'
                        }}>
                            + Criar mais Order Bumps
                        </button>
                        <button onClick={() => window.location.href = '/product-creator'} style={{
                            background: 'rgba(201,169,98,0.1)', border: `1px solid rgba(201,169,98,0.3)`, color: C.accent,
                            padding: '0.7rem 1.5rem', borderRadius: 8, cursor: 'pointer',
                            fontSize: '13px', fontWeight: 600, fontFamily: 'DM Sans', transition: 'all 0.2s'
                        }}>
                            Ir para Estruturador →
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
