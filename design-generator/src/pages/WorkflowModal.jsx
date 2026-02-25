/**
 * WorkflowModal.jsx
 *
 * Modal de progresso para o pipeline de produção de entregáveis.
 * Exibe os 7 steps com status, preview do markdown e botões de download.
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { runProductionWorkflow } from '../services/productionWorkflowService.js';
import { downloadBlob } from '../services/docxExportService.js';

// ─── Design Tokens (mesmo do ProductCreator) ───────────────────────────────────
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
    { n: 1, label: 'Gerar Prompt',           icon: '📝', detail: 'Montando prompt otimizado para Claude...' },
    { n: 2, label: 'Gerar Conteúdo',         icon: '🧠', detail: 'Claude escrevendo o conteúdo...' },
    { n: 3, label: 'Extrair Imagens',        icon: '🔍', detail: 'Identificando blocos de imagem...' },
    { n: 4, label: 'Gerar Imagens (FLUX)',   icon: '🖼️', detail: 'Gerando imagens com FLUX 1.1 Pro...' },
    { n: 5, label: 'Processar Imagens',      icon: '⚙️', detail: 'Montando mapa de imagens...' },
    { n: 6, label: 'Construir DOCX',         icon: '📄', detail: 'Montando documento Word...' },
    { n: 7, label: 'Gerar PDF',              icon: '📑', detail: 'Gerando PDF multi-página...' },
];

/**
 * @param {Object} props
 * @param {Object} props.item - Item do planoProducao
 * @param {Object} props.result - Resultado do estruturadorService
 * @param {Function} props.onClose
 */
export default function WorkflowModal({ item, result, onClose }) {
    const [phase, setPhase] = useState('running'); // 'running' | 'done' | 'error'
    const [currentStep, setCurrentStep] = useState(0);
    const [stepDetail, setStepDetail] = useState('Iniciando...');
    const [overallPct, setOverallPct] = useState(0);
    const [errorMsg, setErrorMsg] = useState('');
    const [output, setOutput] = useState(null); // { docxBlob, pdfBlob, filename, markdown }
    const [showMarkdown, setShowMarkdown] = useState(false);

    const abortRef = useRef(null);

    const handleProgress = useCallback(({ step, label, pct, detail }) => {
        setCurrentStep(step);
        setStepDetail(detail || label);
        setOverallPct(pct);
    }, []);

    useEffect(() => {
        const controller = new AbortController();
        abortRef.current = controller;

        runProductionWorkflow(item, result, handleProgress, controller.signal)
            .then(out => {
                setOutput(out);
                setOverallPct(100);
                setCurrentStep(7);
                setPhase('done');
            })
            .catch(err => {
                if (err.name === 'AbortError') {
                    onClose();
                    return;
                }
                console.error('[WorkflowModal] Erro:', err);
                setErrorMsg(err.message || 'Erro desconhecido');
                setPhase('error');
            });

        return () => controller.abort();
    }, [item, result, handleProgress, onClose]);

    const handleCancel = () => {
        abortRef.current?.abort();
        onClose();
    };

    const handleDownloadDocx = () => {
        if (output?.docxBlob) {
            downloadBlob(output.docxBlob, `${output.filename}.docx`);
        }
    };

    const handleDownloadPdf = () => {
        if (output?.pdfBlob) {
            downloadBlob(output.pdfBlob, `${output.filename}.pdf`);
        }
    };

    return (
        <div
            style={{
                position: 'fixed', inset: 0, zIndex: 9999,
                background: 'rgba(0,0,0,0.85)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                padding: '1.5rem',
                backdropFilter: 'blur(6px)',
            }}
            onClick={e => e.target === e.currentTarget && phase === 'done' && onClose()}
        >
            <div style={{
                background: C.surface, border: `1px solid ${C.border}`,
                borderRadius: 20, width: '100%', maxWidth: 640,
                boxShadow: '0 32px 80px rgba(0,0,0,0.6)',
                overflow: 'hidden',
                animation: 'wm-fadein 0.3s ease',
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
                        50% { opacity: 0.5; }
                    }
                `}</style>

                {/* Header */}
                <div style={{
                    padding: '1.25rem 1.5rem',
                    borderBottom: `1px solid ${C.border}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between'
                }}>
                    <div>
                        <div style={{ color: C.accent, fontSize: '10px', fontFamily: 'DM Sans', fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '0.25rem' }}>
                            {phase === 'done' ? '✓ CONCLUÍDO' : phase === 'error' ? '⚠ ERRO' : 'EM PRODUÇÃO'}
                        </div>
                        <h3 style={{ fontFamily: 'DM Serif Display, serif', fontSize: '1.2rem', color: C.text, margin: 0 }}>
                            {item.nome}
                        </h3>
                    </div>
                    {phase !== 'running' && (
                        <button
                            onClick={onClose}
                            style={{
                                background: 'transparent', border: `1px solid ${C.border}`,
                                color: C.textMuted, width: 32, height: 32, borderRadius: 8,
                                cursor: 'pointer', fontSize: '16px', display: 'flex',
                                alignItems: 'center', justifyContent: 'center',
                                fontFamily: 'DM Sans',
                            }}
                        >
                            ×
                        </button>
                    )}
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
                            const isDone   = currentStep > s.n || (phase === 'done');
                            const isActive = currentStep === s.n && phase === 'running';
                            const isPending = currentStep < s.n && phase === 'running';
                            const isError  = phase === 'error' && currentStep === s.n;

                            return (
                                <div key={s.n} style={{
                                    display: 'flex', alignItems: 'center', gap: '0.75rem',
                                    padding: '0.55rem 0.85rem', borderRadius: 10,
                                    background: isActive ? 'rgba(201,169,98,0.07)' : 'transparent',
                                    border: `1px solid ${isActive ? 'rgba(201,169,98,0.2)' : 'transparent'}`,
                                    transition: 'all 0.3s ease',
                                }}>
                                    {/* Status icon */}
                                    <div style={{
                                        width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        fontSize: '12px',
                                        background: isDone
                                            ? 'rgba(74,222,128,0.15)'
                                            : isActive
                                                ? 'rgba(201,169,98,0.15)'
                                                : isError
                                                    ? 'rgba(248,113,113,0.15)'
                                                    : C.surface2,
                                        border: `1px solid ${
                                            isDone ? 'rgba(74,222,128,0.4)'
                                            : isActive ? 'rgba(201,169,98,0.4)'
                                            : isError ? 'rgba(248,113,113,0.4)'
                                            : C.border
                                        }`,
                                        color: isDone ? C.success : isActive ? C.accent : isError ? C.error : C.textMuted,
                                    }}>
                                        {isDone ? '✓' : isActive ? (
                                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"
                                                style={{ animation: 'wm-spin 1s linear infinite' }}>
                                                <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
                                            </svg>
                                        ) : s.n}
                                    </div>

                                    {/* Label */}
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
                                                marginTop: '0.15rem', animation: 'wm-pulse 2s infinite'
                                            }}>
                                                {stepDetail}
                                            </div>
                                        )}
                                    </div>

                                    {/* Step number (right) */}
                                    {!isDone && !isActive && (
                                        <span style={{ color: C.textMuted, fontSize: '10px', fontFamily: 'DM Sans' }}>
                                            {s.n}/7
                                        </span>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>

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

                {/* Estado: Concluído */}
                {phase === 'done' && output && (
                    <div style={{ padding: '1.25rem 1.5rem' }}>
                        {/* Preview do markdown */}
                        <button
                            onClick={() => setShowMarkdown(v => !v)}
                            style={{
                                width: '100%', background: C.surface2, border: `1px solid ${C.border}`,
                                borderRadius: 8, padding: '0.6rem 1rem', cursor: 'pointer',
                                color: C.textSec, fontFamily: 'DM Sans', fontSize: '12px',
                                textAlign: 'left', marginBottom: '0.75rem',
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
                                marginBottom: '0.75rem',
                                fontFamily: 'monospace', fontSize: '11px',
                                color: C.textSec, lineHeight: 1.6, whiteSpace: 'pre-wrap',
                            }}>
                                {output.markdown?.slice(0, 2000)}
                                {output.markdown?.length > 2000 && (
                                    <span style={{ color: C.textMuted }}>\n... [{output.markdown.length - 2000} caracteres adicionais]</span>
                                )}
                            </div>
                        )}

                        {/* Info sobre imagens */}
                        {output.imageResults?.length > 0 && (
                            <div style={{
                                display: 'flex', gap: '0.5rem', marginBottom: '0.75rem', flexWrap: 'wrap'
                            }}>
                                {output.imageResults.map((ir, i) => (
                                    <div key={i} style={{
                                        padding: '0.25rem 0.6rem', borderRadius: 6, fontSize: '10px',
                                        fontFamily: 'DM Sans',
                                        background: ir.error ? 'rgba(248,113,113,0.1)' : 'rgba(74,222,128,0.1)',
                                        border: `1px solid ${ir.error ? 'rgba(248,113,113,0.3)' : 'rgba(74,222,128,0.3)'}`,
                                        color: ir.error ? C.error : C.success,
                                    }}>
                                        {ir.error ? `✗ Img ${i + 1}` : `✓ Img ${i + 1}`}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* Footer com botões */}
                <div style={{
                    padding: '1rem 1.5rem 1.5rem',
                    display: 'flex', gap: '0.75rem', justifyContent: 'flex-end',
                    borderTop: `1px solid ${C.border}`,
                }}>
                    {phase === 'running' && (
                        <button
                            onClick={handleCancel}
                            style={{
                                padding: '0.7rem 1.5rem', background: 'transparent',
                                border: `1px solid ${C.border}`, borderRadius: 10,
                                color: C.textSec, fontFamily: 'DM Sans', fontSize: '13px',
                                cursor: 'pointer',
                            }}
                        >
                            Cancelar
                        </button>
                    )}

                    {phase === 'error' && (
                        <>
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
                        </>
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
                                    onClick={handleDownloadDocx}
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

                            {output?.pdfBlob && (
                                <button
                                    onClick={handleDownloadPdf}
                                    style={{
                                        padding: '0.7rem 1.25rem',
                                        background: C.accent,
                                        border: 'none', borderRadius: 10,
                                        color: '#0C0C0E',
                                        fontFamily: 'DM Sans', fontSize: '13px',
                                        fontWeight: 600, cursor: 'pointer',
                                        display: 'flex', alignItems: 'center', gap: '0.4rem',
                                    }}
                                >
                                    📑 Baixar PDF
                                </button>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
