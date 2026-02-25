import React, { useEffect } from 'react';

export default function BuilderCommandPalette({
    selectedSectionId,
    sections,
    onRegenerate,
    isGenerating,
    onClose,
    variations,
    onPickVariation
}) {
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onClose]);

    if (!selectedSectionId) return null;

    const section = sections.find(s => s.id === selectedSectionId) || {};
    const title = section.name || section.id || 'Seção';
    const hasVariations = variations && variations.length > 0;

    return (
        <>
            <style>{`
                @keyframes paletteSlideUp {
                    from { opacity: 0; transform: translateX(-50%) translateY(16px); }
                    to   { opacity: 1; transform: translateX(-50%) translateY(0); }
                }
                @keyframes dotBounce {
                    0%, 80%, 100% { transform: scale(0.7); opacity: 0.4; }
                    40%           { transform: scale(1);   opacity: 1;   }
                }
                @keyframes skeletonPulse {
                    0%, 100% { opacity: 0.25; }
                    50%      { opacity: 0.55; }
                }
                @keyframes varCardIn {
                    from { opacity: 0; transform: translateY(10px); }
                    to   { opacity: 1; transform: translateY(0); }
                }
                .regen-btn:hover { background: rgba(201,169,98,0.18) !important; }
                .close-btn:hover { border-color: rgba(255,255,255,0.22) !important; color: #F5F0E8 !important; }
                .var-pick-card:hover {
                    border-color: rgba(201,169,98,0.45) !important;
                    background: rgba(201,169,98,0.07) !important;
                    transform: translateY(-3px) !important;
                    box-shadow: 0 12px 28px rgba(0,0,0,0.35) !important;
                }
            `}</style>

            <div style={{
                position: 'absolute',
                bottom: '32px',
                left: '50%',
                transform: 'translateX(-50%)',
                width: hasVariations ? '860px' : '480px',
                maxWidth: '95vw',
                background: 'rgba(17,17,20,0.97)',
                border: '1px solid rgba(201,169,98,0.18)',
                borderRadius: '12px',
                padding: '1.125rem 1.25rem',
                boxShadow: '0 32px 64px rgba(0,0,0,0.65), 0 0 0 1px rgba(201,169,98,0.04), inset 0 1px 0 rgba(255,255,255,0.04)',
                backdropFilter: 'blur(20px)',
                zIndex: 10000,
                fontFamily: 'var(--font-body)',
                animation: 'paletteSlideUp 0.22s cubic-bezier(0.4,0,0.2,1)',
                transition: 'width 0.3s cubic-bezier(0.4,0,0.2,1)'
            }}>

                {/* ── Header ── */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: hasVariations || isGenerating ? '1rem' : 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        {/* Icon */}
                        <div style={{
                            width: '30px', height: '30px', borderRadius: '7px',
                            background: 'rgba(201,169,98,0.1)',
                            border: '1px solid rgba(201,169,98,0.22)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: '14px', flexShrink: 0
                        }}>✨</div>

                        {/* Status text */}
                        <div>
                            <div style={{ color: '#F5F0E8', fontSize: '13px', fontWeight: 600, lineHeight: 1.2, display: 'flex', alignItems: 'center', gap: '6px' }}>
                                {isGenerating ? (
                                    <>
                                        Gerando 3 variações
                                        <span style={{ display: 'inline-flex', gap: '3px' }}>
                                            {[0, 1, 2].map(i => (
                                                <span key={i} style={{
                                                    width: '5px', height: '5px', borderRadius: '50%',
                                                    background: '#C9A962',
                                                    animation: `dotBounce 1.2s ease-in-out ${i * 0.2}s infinite`
                                                }} />
                                            ))}
                                        </span>
                                    </>
                                ) : hasVariations ? 'Escolha uma variação' : 'Seção selecionada'}
                            </div>
                            <div style={{ color: 'rgba(245,240,232,0.4)', fontSize: '11px', marginTop: '2px' }}>
                                {title}
                            </div>
                        </div>
                    </div>

                    {/* Actions */}
                    <div style={{ display: 'flex', gap: '7px', alignItems: 'center' }}>
                        {hasVariations && !isGenerating && (
                            <button
                                className="regen-btn"
                                onClick={() => onRegenerate(selectedSectionId, '')}
                                style={{
                                    background: 'rgba(201,169,98,0.07)',
                                    border: '1px solid rgba(201,169,98,0.2)',
                                    color: '#C9A962',
                                    padding: '5px 11px', borderRadius: '6px',
                                    cursor: 'pointer', fontSize: '11px', fontWeight: 600,
                                    transition: 'all 0.2s',
                                    display: 'flex', alignItems: 'center', gap: '4px'
                                }}
                            >↻ Novas variações</button>
                        )}
                        <button
                            className="close-btn"
                            onClick={onClose}
                            style={{
                                background: 'transparent',
                                border: '1px solid rgba(255,255,255,0.08)',
                                color: 'rgba(245,240,232,0.38)',
                                padding: '5px 10px', borderRadius: '6px',
                                cursor: 'pointer', fontSize: '12px',
                                transition: 'all 0.2s'
                            }}
                        >✕</button>
                    </div>
                </div>

                {/* ── Loading skeleton ── */}
                {isGenerating && (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.65rem' }}>
                        {[1, 2, 3].map((_, i) => (
                            <div key={i} style={{
                                background: 'rgba(255,255,255,0.025)',
                                border: '1px solid rgba(255,255,255,0.05)',
                                borderRadius: '8px', padding: '1rem', minHeight: '82px'
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '7px', marginBottom: '8px' }}>
                                    <div style={{ width: '22px', height: '22px', borderRadius: '50%', background: 'rgba(201,169,98,0.15)', animation: `skeletonPulse 1.5s ease ${i * 0.18}s infinite` }} />
                                    <div style={{ flex: 1, height: '10px', borderRadius: '4px', background: 'rgba(255,255,255,0.07)', animation: `skeletonPulse 1.5s ease ${i * 0.18}s infinite` }} />
                                </div>
                                <div style={{ height: '8px', width: '85%', borderRadius: '4px', background: 'rgba(255,255,255,0.04)', marginBottom: '5px', animation: `skeletonPulse 1.5s ease ${i * 0.22}s infinite` }} />
                                <div style={{ height: '8px', width: '60%', borderRadius: '4px', background: 'rgba(255,255,255,0.03)', animation: `skeletonPulse 1.5s ease ${i * 0.26}s infinite` }} />
                            </div>
                        ))}
                    </div>
                )}

                {/* ── Variation cards ── */}
                {!isGenerating && hasVariations && (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.65rem' }}>
                        {variations.map((v, idx) => (
                            <div
                                key={idx}
                                className="var-pick-card"
                                onClick={() => onPickVariation(selectedSectionId, v.html)}
                                style={{
                                    background: 'rgba(255,255,255,0.02)',
                                    border: '1px solid rgba(255,255,255,0.07)',
                                    borderRadius: '8px', padding: '1rem',
                                    cursor: 'pointer',
                                    transition: 'all 0.22s cubic-bezier(0.4,0,0.2,1)',
                                    display: 'flex', flexDirection: 'column', gap: '0.4rem',
                                    animation: `varCardIn 0.28s ease ${idx * 0.07}s both`
                                }}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                                    <span style={{
                                        background: 'linear-gradient(135deg, #C9A962, #E8D5A3)',
                                        color: '#0C0C0E',
                                        width: '22px', height: '22px', borderRadius: '50%',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        fontSize: '10px', fontWeight: 800, flexShrink: 0
                                    }}>{idx + 1}</span>
                                    <h5 style={{ margin: 0, color: '#F5F0E8', fontSize: '12px', fontWeight: 600 }}>{v.title}</h5>
                                </div>
                                <p style={{ margin: 0, color: 'rgba(245,240,232,0.42)', fontSize: '11px', lineHeight: 1.5 }}>
                                    {v.description}
                                </p>
                                <span style={{
                                    color: '#C9A962', fontSize: '10px', fontWeight: 700,
                                    marginTop: 'auto', paddingTop: '4px',
                                    display: 'flex', alignItems: 'center', gap: '3px',
                                    letterSpacing: '0.03em', textTransform: 'uppercase'
                                }}>Aplicar →</span>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </>
    );
}
