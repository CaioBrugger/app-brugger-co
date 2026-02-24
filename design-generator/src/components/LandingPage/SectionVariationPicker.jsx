import React, { useState, useRef, useEffect } from 'react';

export default function SectionVariationPicker({ variations, sectionId, onPick, onClose }) {
    const [activeIndex, setActiveIndex] = useState(0);
    const iframeRefs = useRef([]);

    if (!variations || variations.length === 0) return null;

    const activeVariation = variations[activeIndex];

    const buildPreviewHtml = (html) => `<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=DM+Serif+Display&display=swap" rel="stylesheet">
    <style>
        body { margin: 0; padding: 0; background: #0C0C0E; overflow-x: hidden; }
        .lp-animate { opacity: 1; transform: none; }
        .lp-fade-left, .lp-fade-right { opacity: 1; transform: none; }
    </style>
</head>
<body>${html}</body>
</html>`;

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)',
            zIndex: 99999, display: 'flex', flexDirection: 'column',
            fontFamily: "'DM Sans', sans-serif"
        }}>
            {/* HEADER */}
            <div style={{
                padding: '1rem 2rem', borderBottom: '1px solid rgba(201,169,98,0.2)',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                background: 'rgba(12,12,14,0.95)'
            }}>
                <div>
                    <h2 style={{ margin: 0, color: '#F5F0E8', fontSize: '20px', fontFamily: "'DM Serif Display', serif" }}>
                        Escolha sua Variação
                    </h2>
                    <p style={{ margin: '4px 0 0', color: 'rgba(245,240,232,0.5)', fontSize: '13px' }}>
                        Seção: {sectionId} • {variations.length} variações geradas
                    </p>
                </div>
                <button onClick={onClose} style={{
                    background: 'transparent', border: '1px solid rgba(245,240,232,0.2)',
                    color: '#F5F0E8', padding: '8px 16px', borderRadius: '6px',
                    cursor: 'pointer', fontSize: '13px', transition: 'all 0.2s'
                }}>
                    ✕ Fechar
                </button>
            </div>

            {/* MAIN PREVIEW AREA */}
            <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
                {/* LEFT: Thumbnails */}
                <div style={{
                    width: '260px', flexShrink: 0, borderRight: '1px solid rgba(201,169,98,0.15)',
                    background: 'rgba(12,12,14,0.95)', padding: '1rem',
                    display: 'flex', flexDirection: 'column', gap: '0.75rem', overflowY: 'auto'
                }}>
                    {variations.map((v, idx) => (
                        <div
                            key={idx}
                            onClick={() => setActiveIndex(idx)}
                            style={{
                                background: activeIndex === idx ? 'rgba(201,169,98,0.12)' : 'rgba(255,255,255,0.03)',
                                border: `2px solid ${activeIndex === idx ? '#C9A962' : 'rgba(255,255,255,0.06)'}`,
                                borderRadius: '10px', padding: '1rem', cursor: 'pointer',
                                transition: 'all 0.3s ease'
                            }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                                <span style={{
                                    background: activeIndex === idx ? '#C9A962' : 'rgba(255,255,255,0.1)',
                                    color: activeIndex === idx ? '#0C0C0E' : '#F5F0E8',
                                    width: '28px', height: '28px', borderRadius: '50%',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontSize: '13px', fontWeight: 'bold', flexShrink: 0,
                                    transition: 'all 0.3s'
                                }}>{idx + 1}</span>
                                <h4 style={{
                                    margin: 0, color: activeIndex === idx ? '#C9A962' : '#F5F0E8',
                                    fontSize: '14px', fontWeight: 600, transition: 'color 0.3s'
                                }}>{v.title}</h4>
                            </div>
                            <p style={{ margin: 0, color: 'rgba(245,240,232,0.5)', fontSize: '12px', lineHeight: 1.4 }}>
                                {v.description}
                            </p>
                        </div>
                    ))}
                </div>

                {/* CENTER: Live Preview */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', position: 'relative' }}>
                    <iframe
                        key={activeIndex}
                        srcDoc={buildPreviewHtml(activeVariation.html)}
                        style={{
                            width: '100%', flex: 1, border: 'none',
                            background: '#0C0C0E'
                        }}
                        title={`Variação ${activeIndex + 1}`}
                    />
                </div>
            </div>

            {/* BOTTOM BAR */}
            <div style={{
                padding: '1rem 2rem', borderTop: '1px solid rgba(201,169,98,0.2)',
                background: 'rgba(12,12,14,0.95)',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center'
            }}>
                {/* Navigation */}
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <button
                        onClick={() => setActiveIndex(Math.max(0, activeIndex - 1))}
                        disabled={activeIndex === 0}
                        style={{
                            background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                            color: activeIndex === 0 ? 'rgba(245,240,232,0.2)' : '#F5F0E8',
                            padding: '8px 16px', borderRadius: '6px', cursor: activeIndex === 0 ? 'default' : 'pointer',
                            fontSize: '13px', transition: 'all 0.2s'
                        }}
                    >← Anterior</button>

                    <span style={{ color: 'rgba(245,240,232,0.4)', fontSize: '13px', padding: '0 12px' }}>
                        {activeIndex + 1} / {variations.length}
                    </span>

                    <button
                        onClick={() => setActiveIndex(Math.min(variations.length - 1, activeIndex + 1))}
                        disabled={activeIndex === variations.length - 1}
                        style={{
                            background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                            color: activeIndex === variations.length - 1 ? 'rgba(245,240,232,0.2)' : '#F5F0E8',
                            padding: '8px 16px', borderRadius: '6px',
                            cursor: activeIndex === variations.length - 1 ? 'default' : 'pointer',
                            fontSize: '13px', transition: 'all 0.2s'
                        }}
                    >Próxima →</button>
                </div>

                {/* Pick Button */}
                <button
                    onClick={() => onPick(sectionId, activeVariation.html)}
                    style={{
                        background: 'linear-gradient(135deg, #C9A962 0%, #E8D5A3 50%, #C9A962 100%)',
                        backgroundSize: '200% auto',
                        color: '#0C0C0E', border: 'none',
                        padding: '12px 32px', borderRadius: '8px',
                        fontSize: '15px', fontWeight: '700', cursor: 'pointer',
                        boxShadow: '0 4px 20px rgba(201,169,98,0.3)',
                        transition: 'all 0.3s ease',
                        animation: 'lp-shimmer-btn 3s linear infinite'
                    }}
                    onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px) scale(1.02)'}
                    onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0) scale(1)'}
                >
                    ✓ Escolher Variação {activeIndex + 1}
                </button>
            </div>

            <style>{`
                @keyframes lp-shimmer-btn {
                    0% { background-position: 200% center; }
                    100% { background-position: -200% center; }
                }
            `}</style>
        </div>
    );
}
