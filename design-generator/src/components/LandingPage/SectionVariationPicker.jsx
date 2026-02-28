import React, { useState, useEffect } from 'react';

const ACCENT = '#C9A962';
const BG = '#0C0C0E';
const SURFACE = 'rgba(15,15,18,0.99)';
const BORDER = 'rgba(201,169,98,0.15)';
const TEXT = '#F5F0E8';
const MUTED = 'rgba(245,240,232,0.42)';

function buildPreviewHtml(html, themeTokens) {
    const cssVars = themeTokens?.meta?.cssVariables || '';
    return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,wght@0,400;0,500;0,600;0,700;1,400&family=DM+Serif+Display:ital@0;1&display=swap" rel="stylesheet">
  <style>
    ${cssVars}
    *    { box-sizing: border-box; }
    body { margin: 0; padding: 0; background: var(--bg, #0C0C0E); color: var(--text, #F5F0E8); overflow-x: hidden; }
    .lp-animate, .lp-fade-left, .lp-fade-right { opacity: 1 !important; transform: none !important; }
  </style>
</head>
<body>${html}</body>
</html>`;
}

export default function SectionVariationPicker({ variations, sectionId, themeTokens, onPick, onClose }) {
    const [active, setActive] = useState(0);
    const [loaded, setLoaded] = useState(false);
    const [picking, setPicking] = useState(false);

    // Reset loaded state when variation changes
    useEffect(() => { setLoaded(false); }, [active]);

    // Keyboard navigation
    useEffect(() => {
        const onKey = (e) => {
            if (e.key === 'ArrowLeft') setActive(i => Math.max(0, i - 1));
            if (e.key === 'ArrowRight') setActive(i => Math.min((variations?.length ?? 1) - 1, i + 1));
            if (e.key === 'Enter' && !picking) handlePick();
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [active, picking, variations]);

    if (!variations || variations.length === 0) return null;

    const current = variations[active];

    const handlePick = () => {
        setPicking(true);
        onPick(sectionId, current.html);
    };

    return (
        <>
            {/* ── Global animation styles ── */}
            <style>{`
                @keyframes vp-fade-in {
                    from { opacity: 0; }
                    to   { opacity: 1; }
                }
                @keyframes vp-slide-left {
                    from { opacity: 0; transform: translateX(-14px); }
                    to   { opacity: 1; transform: translateX(0); }
                }
                @keyframes vp-spin {
                    to { transform: rotate(360deg); }
                }
                @keyframes vp-shimmer {
                    0%   { background-position: 200% center; }
                    100% { background-position: -200% center; }
                }
                @keyframes vp-dot-grow {
                    0%, 100% { transform: scale(1); }
                    50%      { transform: scale(1.15); }
                }

                /* Tabs */
                .vp-tab {
                    transition: color 0.2s ease, border-color 0.2s ease, background 0.2s ease;
                }
                .vp-tab:hover { color: ${TEXT} !important; }

                /* Side cards */
                .vp-side-card {
                    transition: all 0.2s cubic-bezier(0.4,0,0.2,1);
                }
                .vp-side-card:hover {
                    border-color: rgba(201,169,98,0.32) !important;
                    background: rgba(201,169,98,0.07) !important;
                    transform: translateX(3px);
                }

                /* Nav buttons */
                .vp-nav-btn { transition: all 0.2s ease; }
                .vp-nav-btn:not(:disabled):hover {
                    background: rgba(255,255,255,0.08) !important;
                    border-color: rgba(255,255,255,0.18) !important;
                }

                /* Close button */
                .vp-close-btn { transition: all 0.2s ease; }
                .vp-close-btn:hover {
                    border-color: rgba(255,255,255,0.22) !important;
                    color: ${TEXT} !important;
                }

                /* CTA pick button */
                .vp-pick-btn {
                    background: linear-gradient(90deg, #B8943A 0%, #E8D5A3 40%, #C9A962 60%, #B8943A 100%);
                    background-size: 200% auto;
                    animation: vp-shimmer 3.5s linear infinite;
                    transition: transform 0.25s ease, box-shadow 0.25s ease, opacity 0.2s ease;
                }
                .vp-pick-btn:not(:disabled):hover {
                    transform: translateY(-2px) scale(1.02) !important;
                    box-shadow: 0 10px 28px rgba(201,169,98,0.45) !important;
                }
                .vp-pick-btn:disabled {
                    opacity: 0.65;
                    cursor: default;
                    animation: none;
                }
            `}</style>

            {/* ── Modal overlay ── */}
            <div style={{
                position: 'fixed', inset: 0,
                background: 'rgba(0,0,0,0.88)',
                backdropFilter: 'blur(14px)',
                zIndex: 99999,
                display: 'flex', flexDirection: 'column',
                fontFamily: "'DM Sans', sans-serif",
                animation: 'vp-fade-in 0.18s ease'
            }}>

                {/* ════════════════════════════════
                    HEADER
                ════════════════════════════════ */}
                <div style={{
                    background: SURFACE,
                    borderBottom: `1px solid ${BORDER}`,
                    flexShrink: 0
                }}>
                    {/* Top row: title + close */}
                    <div style={{
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        padding: '0.9rem 1.75rem'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            {/* Icon badge */}
                            <div style={{
                                width: '36px', height: '36px', borderRadius: '8px',
                                background: `linear-gradient(135deg, rgba(201,169,98,0.22), rgba(201,169,98,0.06))`,
                                border: `1px solid rgba(201,169,98,0.28)`,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: '17px', flexShrink: 0
                            }}>✨</div>
                            <div>
                                <h2 style={{
                                    margin: 0, color: TEXT,
                                    fontSize: '17px',
                                    fontFamily: "'DM Serif Display', serif",
                                    fontWeight: 400, letterSpacing: '-0.01em', lineHeight: 1.2
                                }}>Escolha sua Variação</h2>
                                <p style={{ margin: '3px 0 0', color: MUTED, fontSize: '11px', letterSpacing: '0.01em' }}>
                                    {sectionId} · {variations.length} variações ·
                                    <kbd style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '3px', padding: '0px 4px', fontSize: '10px', marginLeft: '5px' }}>←</kbd>
                                    <kbd style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '3px', padding: '0px 4px', fontSize: '10px', marginLeft: '2px' }}>→</kbd>
                                    <span style={{ marginLeft: '4px' }}>navegar ·</span>
                                    <kbd style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '3px', padding: '0px 4px', fontSize: '10px', marginLeft: '5px' }}>↵</kbd>
                                    <span style={{ marginLeft: '4px' }}>aplicar</span>
                                </p>
                            </div>
                        </div>

                        <button
                            className="vp-close-btn"
                            onClick={onClose}
                            style={{
                                background: 'transparent',
                                border: '1px solid rgba(255,255,255,0.09)',
                                color: MUTED, padding: '6px 14px',
                                borderRadius: '6px', cursor: 'pointer',
                                fontSize: '12px', fontFamily: "'DM Sans', sans-serif",
                                display: 'flex', alignItems: 'center', gap: '5px'
                            }}
                        >✕ Fechar</button>
                    </div>

                    {/* Tab row */}
                    <div style={{ display: 'flex', paddingLeft: '1.75rem', gap: 0 }}>
                        {variations.map((v, idx) => (
                            <button
                                key={idx}
                                className="vp-tab"
                                onClick={() => setActive(idx)}
                                style={{
                                    background: 'transparent', border: 'none',
                                    borderBottom: `2px solid ${active === idx ? ACCENT : 'transparent'}`,
                                    color: active === idx ? ACCENT : MUTED,
                                    padding: '0.55rem 1.25rem',
                                    cursor: 'pointer', fontSize: '12px',
                                    fontWeight: active === idx ? 700 : 400,
                                    fontFamily: "'DM Sans', sans-serif",
                                    display: 'flex', alignItems: 'center', gap: '7px'
                                }}
                            >
                                <span style={{
                                    width: '19px', height: '19px', borderRadius: '50%',
                                    background: active === idx ? ACCENT : 'rgba(255,255,255,0.09)',
                                    color: active === idx ? '#0C0C0E' : MUTED,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontSize: '10px', fontWeight: 800, flexShrink: 0,
                                    transition: 'all 0.2s'
                                }}>{idx + 1}</span>
                                {v.title}
                            </button>
                        ))}
                    </div>
                </div>

                {/* ════════════════════════════════
                    MAIN BODY
                ════════════════════════════════ */}
                <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

                    {/* ── Left panel: variation list ── */}
                    <div style={{
                        width: '232px', flexShrink: 0,
                        borderRight: `1px solid ${BORDER}`,
                        background: 'rgba(10,10,12,0.98)',
                        padding: '1rem 0.875rem',
                        display: 'flex', flexDirection: 'column', gap: '0.55rem',
                        overflowY: 'auto'
                    }}>
                        <p style={{
                            margin: '0 0 0.4rem 0.1rem',
                            color: 'rgba(245,240,232,0.28)',
                            fontSize: '9.5px', fontWeight: 700,
                            textTransform: 'uppercase', letterSpacing: '0.1em'
                        }}>Variações</p>

                        {variations.map((v, idx) => (
                            <div
                                key={idx}
                                className="vp-side-card"
                                onClick={() => setActive(idx)}
                                style={{
                                    background: active === idx ? 'rgba(201,169,98,0.09)' : 'rgba(255,255,255,0.025)',
                                    border: `1px solid ${active === idx ? 'rgba(201,169,98,0.32)' : 'rgba(255,255,255,0.055)'}`,
                                    borderRadius: '8px', padding: '0.8rem',
                                    cursor: 'pointer',
                                    animation: `vp-slide-left 0.28s ease ${idx * 0.055}s both`
                                }}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '7px', marginBottom: '5px' }}>
                                    <span style={{
                                        background: active === idx ? ACCENT : 'rgba(255,255,255,0.1)',
                                        color: active === idx ? '#0C0C0E' : MUTED,
                                        width: '21px', height: '21px', borderRadius: '50%',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        fontSize: '10px', fontWeight: 800, flexShrink: 0,
                                        transition: 'all 0.2s'
                                    }}>{idx + 1}</span>
                                    <h4 style={{
                                        margin: 0,
                                        color: active === idx ? ACCENT : TEXT,
                                        fontSize: '12px', fontWeight: 600,
                                        transition: 'color 0.2s'
                                    }}>{v.title}</h4>
                                </div>
                                <p style={{ margin: 0, color: MUTED, fontSize: '11px', lineHeight: 1.55 }}>
                                    {v.description}
                                </p>
                                {active === idx && (
                                    <div style={{
                                        marginTop: '8px',
                                        display: 'flex', alignItems: 'center', gap: '4px',
                                        color: ACCENT, fontSize: '10px', fontWeight: 700,
                                        textTransform: 'uppercase', letterSpacing: '0.06em'
                                    }}>
                                        <span style={{ animation: 'vp-dot-grow 1.2s ease infinite' }}>●</span> Em preview
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>

                    {/* ── Right panel: iframe preview ── */}
                    <div style={{ flex: 1, position: 'relative', background: BG, overflow: 'hidden' }}>

                        {/* Loading overlay */}
                        {!loaded && (
                            <div style={{
                                position: 'absolute', inset: 0,
                                background: BG,
                                display: 'flex', flexDirection: 'column',
                                alignItems: 'center', justifyContent: 'center',
                                gap: '14px', zIndex: 2
                            }}>
                                <div style={{
                                    width: '44px', height: '44px', borderRadius: '50%',
                                    border: `2px solid rgba(201,169,98,0.12)`,
                                    borderTopColor: ACCENT,
                                    animation: 'vp-spin 0.75s linear infinite'
                                }} />
                                <p style={{ color: MUTED, fontSize: '12px', margin: 0 }}>
                                    Carregando preview da Variação {active + 1}…
                                </p>
                            </div>
                        )}

                        {/* Variation badge overlay */}
                        <div style={{
                            position: 'absolute', top: '12px', left: '12px',
                            background: 'rgba(12,12,14,0.82)',
                            border: `1px solid rgba(201,169,98,0.25)`,
                            borderRadius: '6px', padding: '4px 10px',
                            fontSize: '11px', color: ACCENT, fontWeight: 700,
                            backdropFilter: 'blur(8px)', zIndex: 3,
                            transition: 'opacity 0.3s',
                            opacity: loaded ? 1 : 0
                        }}>
                            Variação {active + 1}: {current.title}
                        </div>

                        <iframe
                            key={active}
                            srcDoc={buildPreviewHtml(current.html, themeTokens)}
                            style={{
                                width: '100%', height: '100%',
                                border: 'none', background: BG,
                                opacity: loaded ? 1 : 0,
                                transition: 'opacity 0.35s ease'
                            }}
                            title={`Variação ${active + 1} — ${current.title}`}
                            onLoad={() => setLoaded(true)}
                        />
                    </div>
                </div>

                {/* ════════════════════════════════
                    BOTTOM BAR
                ════════════════════════════════ */}
                <div style={{
                    padding: '0.85rem 1.75rem',
                    borderTop: `1px solid ${BORDER}`,
                    background: SURFACE,
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    flexShrink: 0
                }}>
                    {/* Left: navigation */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <button
                            className="vp-nav-btn"
                            onClick={() => setActive(i => Math.max(0, i - 1))}
                            disabled={active === 0}
                            style={{
                                background: 'rgba(255,255,255,0.04)',
                                border: '1px solid rgba(255,255,255,0.08)',
                                color: active === 0 ? 'rgba(245,240,232,0.18)' : TEXT,
                                padding: '7px 14px', borderRadius: '6px',
                                cursor: active === 0 ? 'default' : 'pointer',
                                fontSize: '12px', fontFamily: "'DM Sans', sans-serif"
                            }}
                        >← Anterior</button>

                        {/* Dot indicators */}
                        <div style={{ display: 'flex', gap: '5px', padding: '0 6px' }}>
                            {variations.map((_, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => setActive(idx)}
                                    style={{
                                        width: active === idx ? '22px' : '7px',
                                        height: '7px', borderRadius: '4px',
                                        background: active === idx ? ACCENT : 'rgba(255,255,255,0.14)',
                                        border: 'none', padding: 0, cursor: 'pointer',
                                        transition: 'all 0.28s cubic-bezier(0.4,0,0.2,1)'
                                    }}
                                    aria-label={`Variação ${idx + 1}`}
                                />
                            ))}
                        </div>

                        <button
                            className="vp-nav-btn"
                            onClick={() => setActive(i => Math.min(variations.length - 1, i + 1))}
                            disabled={active === variations.length - 1}
                            style={{
                                background: 'rgba(255,255,255,0.04)',
                                border: '1px solid rgba(255,255,255,0.08)',
                                color: active === variations.length - 1 ? 'rgba(245,240,232,0.18)' : TEXT,
                                padding: '7px 14px', borderRadius: '6px',
                                cursor: active === variations.length - 1 ? 'default' : 'pointer',
                                fontSize: '12px', fontFamily: "'DM Sans', sans-serif"
                            }}
                        >Próxima →</button>
                    </div>

                    {/* Right: pick CTA */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                        <span style={{ color: MUTED, fontSize: '11px' }}>
                            {active + 1} / {variations.length}
                        </span>
                        <button
                            className="vp-pick-btn"
                            disabled={picking}
                            onClick={handlePick}
                            style={{
                                border: 'none', color: '#0C0C0E',
                                padding: '10px 26px', borderRadius: '6px',
                                fontSize: '13px', fontWeight: 700,
                                cursor: picking ? 'default' : 'pointer',
                                fontFamily: "'DM Sans', sans-serif",
                                boxShadow: '0 4px 18px rgba(201,169,98,0.22)',
                                letterSpacing: '0.01em',
                                display: 'flex', alignItems: 'center', gap: '6px'
                            }}
                        >
                            {picking ? (
                                <>
                                    <span style={{
                                        width: '13px', height: '13px', borderRadius: '50%',
                                        border: '2px solid rgba(0,0,0,0.25)',
                                        borderTopColor: '#0C0C0E',
                                        animation: 'vp-spin 0.6s linear infinite',
                                        display: 'inline-block'
                                    }} />
                                    Aplicando…
                                </>
                            ) : `✓ Aplicar Variação ${active + 1}`}
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
}
