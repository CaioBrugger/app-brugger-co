/**
 * WorkflowModal.jsx
 *
 * Modal de progresso para o pipeline de produção de entregáveis.
 * Exibe os steps, preview de imagens em tempo real e botão de download DOCX.
 *
 * REFACTORED: Now a pure display component. The workflow runs in the background
 * (via useBackgroundWorkflows hook). Closing the modal does NOT cancel the workflow.
 */

import { useState } from 'react';
import { downloadBlob } from '../services/docxExportService.js';

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
    warning: '#FBBF24',
};

const STEP_DEFS = [
    { n: 1, label: 'Gerar Prompt', icon: '📝' },
    { n: 2, label: 'Gerar Conteúdo', icon: '🧠' },
    { n: 3, label: 'Extrair Imagens', icon: '🔍' },
    { n: 4, label: 'Gerar Imagens (FLUX)', icon: '🖼️' },
    { n: 5, label: 'Processar Imagens', icon: '⚙️' },
    { n: 6, label: 'Construir DOCX', icon: '📄' },
];

/**
 * @param {{ job: JobState, onClose: Function, onCancel: Function }} props
 *
 * job: { id, item, phase, currentStep, stepDetail, overallPct, liveImages, totalImages, output, errorMsg }
 * onClose: hide modal (workflow continues)
 * onCancel: abort workflow and close
 */
export default function WorkflowModal({ job, onClose, onCancel }) {
    const [showMarkdown, setShowMarkdown] = useState(false);

    if (!job) return null;

    const { item, phase, currentStep, stepDetail, overallPct, liveImages, totalImages, output, errorMsg } = job;

    // Images to display
    const displayImages = phase === 'done' && output?.imageResults?.length > 0
        ? output.imageResults.map(ir => liveImages[ir.index] || { blobUrl: null, error: ir.error || 'Falhou' })
        : liveImages;
    const displayTotal = phase === 'done' && output?.imageResults?.length > 0
        ? output.imageResults.length
        : totalImages;

    const hasImageSection = displayTotal > 0 && (currentStep >= 4 || phase === 'done');

    return (
        <div
            style={{
                position: 'fixed', inset: 0, zIndex: 9999,
                background: 'rgba(0,0,0,0.85)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                padding: '1.5rem',
                backdropFilter: 'blur(6px)',
            }}
            onClick={e => e.target === e.currentTarget && onClose()}
        >
            <div style={{
                background: C.surface, border: `1px solid ${C.border}`,
                borderRadius: 20, width: '100%', maxWidth: 680,
                boxShadow: '0 32px 80px rgba(0,0,0,0.6)',
                overflow: 'hidden',
                animation: 'wm-fadein 0.3s ease',
                maxHeight: '90vh', overflowY: 'auto',
            }}>
                <style>{`
                    @keyframes wm-fadein {
                        from { opacity: 0; transform: translateY(20px) scale(0.97); }
                        to   { opacity: 1; transform: translateY(0) scale(1); }
                    }
                    @keyframes wm-spin {
                        from { transform: rotate(0deg); }
                        to   { transform: rotate(360deg); }
                    }
                    @keyframes wm-pulse {
                        0%,100% { opacity: 1; }
                        50% { opacity: 0.4; }
                    }
                    @keyframes wm-shimmer {
                        0%   { background-position: -200% 0; }
                        100% { background-position:  200% 0; }
                    }
                `}</style>

                {/* Header */}
                <div style={{
                    padding: '1.25rem 1.5rem',
                    borderBottom: `1px solid ${C.border}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    position: 'sticky', top: 0, background: C.surface, zIndex: 1,
                }}>
                    <div>
                        <div style={{ color: C.accent, fontSize: '10px', fontFamily: 'DM Sans', fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '0.25rem' }}>
                            {phase === 'done' ? '✓ CONCLUÍDO' : phase === 'error' ? '⚠ ERRO' : 'EM PRODUÇÃO'}
                        </div>
                        <h3 style={{ fontFamily: 'DM Serif Display, serif', fontSize: '1.2rem', color: C.text, margin: 0 }}>
                            {item.nome}
                        </h3>
                    </div>
                    {/* Close button — always visible, just hides modal */}
                    <button
                        onClick={onClose}
                        title={phase === 'running' ? 'Minimizar (continua em segundo plano)' : 'Fechar'}
                        style={{
                            background: 'transparent', border: `1px solid ${C.border}`,
                            color: C.textMuted, width: 32, height: 32, borderRadius: 8,
                            cursor: 'pointer', fontSize: '16px', display: 'flex',
                            alignItems: 'center', justifyContent: 'center',
                        }}
                    >
                        {phase === 'running' ? '−' : '×'}
                    </button>
                </div>

                {/* Barra de progresso */}
                <div style={{ height: 3, background: C.surface2 }}>
                    <div style={{
                        height: '100%',
                        background: phase === 'error'
                            ? C.error
                            : `linear-gradient(90deg, ${C.accentDark}, ${C.accentLight})`,
                        width: `${overallPct}%`,
                        transition: 'width 0.5s ease',
                    }} />
                </div>

                {/* Steps list */}
                <div style={{ padding: '1.25rem 1.5rem 0' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                        {STEP_DEFS.map(s => {
                            const isDone = currentStep > s.n || phase === 'done';
                            const isActive = currentStep === s.n && phase === 'running';
                            const isPending = currentStep < s.n && phase === 'running';
                            const isError = phase === 'error' && currentStep === s.n;

                            return (
                                <div key={s.n} style={{
                                    display: 'flex', alignItems: 'center', gap: '0.75rem',
                                    padding: '0.55rem 0.85rem', borderRadius: 10,
                                    background: isActive ? 'rgba(201,169,98,0.07)' : 'transparent',
                                    border: `1px solid ${isActive ? 'rgba(201,169,98,0.2)' : 'transparent'}`,
                                    transition: 'all 0.3s ease',
                                }}>
                                    <div style={{
                                        width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        fontSize: '12px',
                                        background: isDone ? 'rgba(74,222,128,0.15)' : isActive ? 'rgba(201,169,98,0.15)' : isError ? 'rgba(248,113,113,0.15)' : C.surface2,
                                        border: `1px solid ${isDone ? 'rgba(74,222,128,0.4)' : isActive ? 'rgba(201,169,98,0.4)' : isError ? 'rgba(248,113,113,0.4)' : C.border}`,
                                        color: isDone ? C.success : isActive ? C.accent : isError ? C.error : C.textMuted,
                                    }}>
                                        {isDone ? '✓' : isActive ? (
                                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"
                                                style={{ animation: 'wm-spin 1s linear infinite' }}>
                                                <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
                                            </svg>
                                        ) : s.n}
                                    </div>

                                    <div style={{ flex: 1 }}>
                                        <div style={{
                                            fontFamily: 'DM Sans', fontSize: '13px', fontWeight: isActive ? 600 : 400,
                                            color: isDone ? C.success : isActive ? C.text : isPending ? C.textMuted : C.error,
                                        }}>
                                            {s.icon} {s.label}
                                        </div>
                                        {isActive && stepDetail && (
                                            <div style={{
                                                fontFamily: 'DM Sans', fontSize: '11px', color: C.textMuted,
                                                marginTop: '0.15rem', animation: 'wm-pulse 2s infinite',
                                            }}>
                                                {stepDetail}
                                            </div>
                                        )}
                                    </div>

                                    {!isDone && !isActive && (
                                        <span style={{ color: C.textMuted, fontSize: '10px', fontFamily: 'DM Sans' }}>
                                            {s.n}/6
                                        </span>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* ── Preview de Imagens em Tempo Real ─────────────────────────── */}
                {hasImageSection && (
                    <div style={{ padding: '1rem 1.5rem 0' }}>
                        <div style={{
                            fontSize: '10px', fontFamily: 'DM Sans', fontWeight: 600,
                            letterSpacing: '0.1em', textTransform: 'uppercase',
                            color: C.textMuted, marginBottom: '0.6rem',
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        }}>
                            <span>Imagens geradas</span>
                            <span style={{ color: displayImages.filter(i => i?.blobUrl).length > 0 ? C.success : C.textMuted }}>
                                {displayImages.filter(i => i?.blobUrl).length}/{displayTotal} ✓
                            </span>
                        </div>

                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: `repeat(${Math.min(displayTotal, 4)}, 1fr)`,
                            gap: '0.5rem',
                        }}>
                            {Array.from({ length: displayTotal }, (_, i) => {
                                const img = displayImages[i];
                                const isReady = !!img?.blobUrl;
                                const isFailed = !!img?.error && !img?.blobUrl;
                                const isPendingImg = !img;

                                return (
                                    <div key={i} style={{
                                        aspectRatio: '16/9',
                                        borderRadius: 8,
                                        overflow: 'hidden',
                                        position: 'relative',
                                        border: `1px solid ${isFailed ? 'rgba(248,113,113,0.35)' : isReady ? 'rgba(74,222,128,0.35)' : C.border}`,
                                        background: C.surface2,
                                    }}>
                                        {isReady && (
                                            <img
                                                src={img.blobUrl}
                                                alt={`Imagem ${i + 1}`}
                                                style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                                            />
                                        )}
                                        {isFailed && (
                                            <div style={{
                                                display: 'flex', flexDirection: 'column',
                                                alignItems: 'center', justifyContent: 'center',
                                                height: '100%', gap: '0.25rem',
                                            }}>
                                                <span style={{ fontSize: '18px' }}>✗</span>
                                                <span style={{ fontSize: '9px', color: C.error, fontFamily: 'DM Sans', textAlign: 'center', padding: '0 4px' }}>
                                                    {img.error?.slice(0, 40)}
                                                </span>
                                            </div>
                                        )}
                                        {isPendingImg && (
                                            <div style={{
                                                width: '100%', height: '100%',
                                                background: `linear-gradient(90deg, ${C.surface2} 25%, ${C.surface3} 50%, ${C.surface2} 75%)`,
                                                backgroundSize: '200% 100%',
                                                animation: 'wm-shimmer 1.5s infinite',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            }}>
                                                <span style={{ fontSize: '9px', color: C.textMuted, fontFamily: 'DM Sans', animation: 'wm-pulse 2s infinite' }}>
                                                    gerando...
                                                </span>
                                            </div>
                                        )}

                                        {/* Badge do número */}
                                        <div style={{
                                            position: 'absolute', bottom: 4, right: 4,
                                            background: 'rgba(0,0,0,0.65)', borderRadius: 4,
                                            padding: '1px 5px', fontSize: '9px',
                                            color: 'rgba(255,255,255,0.8)', fontFamily: 'DM Sans',
                                        }}>
                                            #{i + 1}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Estado: Erro */}
                {phase === 'error' && (
                    <div style={{ padding: '1.25rem 1.5rem' }}>
                        <div style={{
                            background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.25)',
                            borderRadius: 10, padding: '1rem',
                        }}>
                            <div style={{ color: C.error, fontSize: '13px', fontFamily: 'DM Sans', fontWeight: 600, marginBottom: '0.35rem' }}>
                                ⚠ Erro no pipeline
                            </div>
                            <p style={{ color: C.textSec, fontSize: '12px', fontFamily: 'DM Sans', margin: 0, lineHeight: 1.6 }}>
                                {errorMsg}
                            </p>
                        </div>
                    </div>
                )}

                {/* Estado: Concluído — preview do markdown */}
                {phase === 'done' && output && (
                    <div style={{ padding: '1rem 1.5rem 0' }}>
                        <button
                            onClick={() => setShowMarkdown(v => !v)}
                            style={{
                                width: '100%', background: C.surface2, border: `1px solid ${C.border}`,
                                borderRadius: 8, padding: '0.6rem 1rem', cursor: 'pointer',
                                color: C.textSec, fontFamily: 'DM Sans', fontSize: '12px',
                                textAlign: 'left',
                                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                            }}
                        >
                            <span>📄 Preview do conteúdo gerado</span>
                            <span style={{ fontSize: '10px' }}>{showMarkdown ? '▲' : '▼'}</span>
                        </button>

                        {showMarkdown && (
                            <div style={{
                                background: C.surface2, border: `1px solid ${C.border}`,
                                borderRadius: 8, padding: '1rem',
                                maxHeight: '180px', overflowY: 'auto',
                                marginTop: '0.5rem',
                                fontFamily: 'monospace', fontSize: '11px',
                                color: C.textSec, lineHeight: 1.6, whiteSpace: 'pre-wrap',
                            }}>
                                {output.markdown?.slice(0, 2000)}
                                {output.markdown?.length > 2000 && (
                                    <span style={{ color: C.textMuted }}>{'\n'}... [{output.markdown.length - 2000} caracteres adicionais]</span>
                                )}
                            </div>
                        )}
                    </div>
                )}

                {/* Footer com botões */}
                <div style={{
                    padding: '1rem 1.5rem 1.5rem',
                    display: 'flex', gap: '0.75rem', justifyContent: 'flex-end',
                    borderTop: `1px solid ${C.border}`,
                    marginTop: '1rem',
                }}>
                    {phase === 'running' && (
                        <>
                            <button
                                onClick={onCancel}
                                style={{
                                    padding: '0.7rem 1.25rem', background: 'transparent',
                                    border: `1px solid rgba(248,113,113,0.35)`, borderRadius: 10,
                                    color: C.error, fontFamily: 'DM Sans', fontSize: '13px',
                                    cursor: 'pointer',
                                }}
                            >
                                ✗ Cancelar
                            </button>
                            <button
                                onClick={onClose}
                                style={{
                                    padding: '0.7rem 1.25rem',
                                    background: 'rgba(201,169,98,0.1)',
                                    border: `1px solid rgba(201,169,98,0.35)`,
                                    borderRadius: 10, color: C.accent,
                                    fontFamily: 'DM Sans', fontSize: '13px',
                                    fontWeight: 600, cursor: 'pointer',
                                    display: 'flex', alignItems: 'center', gap: '0.4rem',
                                }}
                            >
                                − Minimizar
                            </button>
                        </>
                    )}

                    {phase === 'error' && (
                        <button
                            onClick={onClose}
                            style={{
                                padding: '0.7rem 1.5rem', background: 'transparent',
                                border: `1px solid ${C.border}`, borderRadius: 10,
                                color: C.textSec, fontFamily: 'DM Sans', fontSize: '13px',
                                cursor: 'pointer',
                            }}
                        >
                            Fechar
                        </button>
                    )}

                    {phase === 'done' && (
                        <>
                            <button
                                onClick={onClose}
                                style={{
                                    padding: '0.7rem 1.25rem', background: 'transparent',
                                    border: `1px solid ${C.border}`, borderRadius: 10,
                                    color: C.textSec, fontFamily: 'DM Sans', fontSize: '13px',
                                    cursor: 'pointer',
                                }}
                            >
                                Fechar
                            </button>

                            {output?.docxBlob && (
                                <button
                                    onClick={() => downloadBlob(output.docxBlob, `${output.filename}.docx`)}
                                    style={{
                                        padding: '0.7rem 1.25rem',
                                        background: 'rgba(201,169,98,0.1)',
                                        border: `1px solid rgba(201,169,98,0.35)`,
                                        borderRadius: 10, color: C.accent,
                                        fontFamily: 'DM Sans', fontSize: '13px',
                                        fontWeight: 600, cursor: 'pointer',
                                        display: 'flex', alignItems: 'center', gap: '0.4rem',
                                    }}
                                >
                                    📄 Baixar DOCX
                                </button>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
