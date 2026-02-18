import { useState, useRef, useCallback, useEffect } from 'react';
import { callGemini, generateImage } from '../api';
import { buildGeneratePrompt, buildRefinePrompt, buildImagePrompt } from '../prompt';

export default function DesignGenerator() {
    const [scope, setScope] = useState('section');
    const [input, setInput] = useState('');
    const [variations, setVariations] = useState([]);
    const [loading, setLoading] = useState(false);
    const [loadingText, setLoadingText] = useState('');
    const [refining, setRefining] = useState({ index: -1, text: '' });
    const [fullscreen, setFullscreen] = useState({ open: false, index: -1 });
    const [toast, setToast] = useState({ msg: '', error: false, visible: false });
    const toastTimer = useRef(null);
    const fullscreenIframeRef = useRef(null);

    // Toast
    const showToast = useCallback((msg, error = false) => {
        clearTimeout(toastTimer.current);
        setToast({ msg, error, visible: true });
        toastTimer.current = setTimeout(() => {
            setToast(t => ({ ...t, visible: false }));
        }, 3000);
    }, []);

    // Generate designs
    const generateDesigns = async (append = false) => {
        if (!input.trim()) return;
        setLoading(true);
        setLoadingText('Gerando 3 variações de design...');
        try {
            const prompt = buildGeneratePrompt(input, scope);
            const result = await callGemini(prompt);
            if (result.variations && Array.isArray(result.variations)) {
                setVariations(prev => append ? [...prev, ...result.variations] : result.variations);
            } else {
                throw new Error('Formato de resposta inválido');
            }
        } catch (err) {
            showToast(`Erro: ${err.message}`, true);
        } finally {
            setLoading(false);
        }
    };

    // Copy code
    const copyCode = (idx) => {
        const html = variations[idx]?.html;
        if (!html) return;
        navigator.clipboard.writeText(html)
            .then(() => showToast('Código copiado!'))
            .catch(() => showToast('Código copiado!'));
    };

    // Download
    const downloadCode = (idx) => {
        const v = variations[idx];
        if (!v) return;
        const blob = new Blob([v.html], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${(v.title || `design-${idx + 1}`).replace(/\s+/g, '-').toLowerCase()}.html`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        showToast('Download iniciado!');
    };

    // Generate Image (Nano Banana)
    const [genImgLoading, setGenImgLoading] = useState({});
    const [genImages, setGenImages] = useState({});

    const genImage = async (idx) => {
        const v = variations[idx];
        if (!v) return;
        setGenImgLoading(prev => ({ ...prev, [idx]: true }));
        try {
            const prompt = buildImagePrompt(v.title, v.description, input);
            const result = await generateImage(prompt);
            setGenImages(prev => ({ ...prev, [idx]: result.images }));
            showToast('Imagem gerada com sucesso!');
        } catch (err) {
            console.error('[NanoBanana] Error:', err);
            showToast(`Erro ao gerar imagem: ${err.message}`, true);
        } finally {
            setGenImgLoading(prev => ({ ...prev, [idx]: false }));
        }
    };

    // Download generated image
    const downloadImage = (img, idx, imgIdx) => {
        const a = document.createElement('a');
        a.href = `data:${img.mimeType};base64,${img.data}`;
        a.download = `design-${idx + 1}-img-${imgIdx + 1}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        showToast('Download da imagem iniciado!');
    };

    // Refine
    const refineDesign = async () => {
        const { index, text } = refining;
        if (!text.trim() || index < 0) return;
        setLoading(true);
        setLoadingText('Refinando design...');
        try {
            const prompt = buildRefinePrompt(variations[index].html, text);
            const result = await callGemini(prompt);
            setVariations(prev => {
                const copy = [...prev];
                copy[index] = result;
                return copy;
            });
            setRefining({ index: -1, text: '' });
            showToast('Design refinado com sucesso!');
        } catch (err) {
            showToast(`Erro: ${err.message}`, true);
        } finally {
            setLoading(false);
        }
    };

    // Fullscreen
    const openFullscreen = (idx) => {
        setFullscreen({ open: true, index: idx });
    };

    const closeFullscreen = () => {
        setFullscreen({ open: false, index: -1 });
    };

    useEffect(() => {
        const handleEsc = (e) => { if (e.key === 'Escape') closeFullscreen(); };
        document.addEventListener('keydown', handleEsc);
        return () => document.removeEventListener('keydown', handleEsc);
    }, []);

    // Set srcdoc on fullscreen iframe
    useEffect(() => {
        if (fullscreen.open && fullscreen.index >= 0 && fullscreenIframeRef.current) {
            fullscreenIframeRef.current.srcdoc = variations[fullscreen.index]?.html || '';
        }
    }, [fullscreen.open, fullscreen.index, variations]);

    const esc = (str) => {
        const d = document.createElement('div');
        d.textContent = str;
        return d.innerHTML;
    };

    return (
        <div>
            <div className="page-header">
                <div className="page-label">Ferramenta de Design</div>
                <h1 className="page-title">Design <span className="gold">Generator</span></h1>
                <p className="page-desc">
                    Descreva sua ideia e gere designs profissionais seguindo nosso design system.
                </p>
            </div>

            {/* Form */}
            <form onSubmit={(e) => { e.preventDefault(); generateDesigns(); }}>
                <textarea
                    rows="5"
                    placeholder="Descreva sua ideia de design ou cole seu copy aqui..."
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                />
                <div className="scope-row">
                    <div className="scope-selector">
                        {['section', 'component', 'both'].map(s => (
                            <button
                                key={s}
                                type="button"
                                className={`scope-btn ${scope === s ? 'active' : ''}`}
                                onClick={() => setScope(s)}
                            >
                                {s === 'section' ? 'Seção' : s === 'component' ? 'Componente' : 'Ambos'}
                            </button>
                        ))}
                    </div>
                </div>
                <button type="submit" className="btn-primary btn-full" disabled={loading || !input.trim()}>
                    ✦ Gerar Designs
                </button>
            </form>

            {/* Loading */}
            {loading && (
                <div className="loading">
                    <div className="loading-spinner" />
                    <div className="loading-text">{loadingText}</div>
                </div>
            )}

            {/* Results */}
            {variations.length > 0 && !loading && (
                <div style={{ marginTop: '3rem' }}>
                    <div className="page-label">Opções Geradas</div>
                    <h2 className="page-title" style={{ fontSize: '1.5rem', marginBottom: '1.5rem' }}>
                        Escolha seu <span className="gold">design favorito</span>
                    </h2>

                    <div className="previews-grid">
                        {variations.map((v, i) => (
                            <div key={i} className="preview-card" style={{ animationDelay: `${i * 150}ms` }}>
                                <div className="preview-header">
                                    <span className="preview-number">Opção {i + 1}</span>
                                    <h3 className="preview-title">{v.title || `Variação ${i + 1}`}</h3>
                                    <p className="preview-desc">{v.description || ''}</p>
                                </div>

                                <div className="preview-frame-container">
                                    <IframeSrcdoc html={v.html} className="preview-frame" />
                                    <div className="preview-overlay" onClick={() => openFullscreen(i)}>
                                        <span>Clique para expandir</span>
                                    </div>
                                </div>

                                <div className="preview-actions">
                                    <button className="btn-action" onClick={() => copyCode(i)}>
                                        <CopyIcon /> Copiar
                                    </button>
                                    <button className="btn-action" onClick={() => downloadCode(i)}>
                                        <DownloadIcon /> Baixar
                                    </button>
                                    <button className="btn-action" onClick={() => setRefining({ index: i, text: '' })}>
                                        <EditIcon /> Refinar
                                    </button>
                                    <button
                                        className="btn-action"
                                        onClick={() => genImage(i)}
                                        disabled={genImgLoading[i]}
                                    >
                                        {genImgLoading[i]
                                            ? <><span className="loading-spinner-sm" /> Gerando...</>
                                            : <><ImageIcon /> Gerar Imagem</>
                                        }
                                    </button>
                                </div>

                                {/* Generated Images */}
                                {genImages[i] && (
                                    <div className="preview-images">
                                        {genImages[i].map((img, imgIdx) => (
                                            <div key={imgIdx} className="generated-image-wrapper">
                                                <img
                                                    src={`data:${img.mimeType};base64,${img.data}`}
                                                    alt="Imagem gerada"
                                                    className="generated-image"
                                                />
                                                <div className="generated-image-actions">
                                                    <button className="btn-action" onClick={() => downloadImage(img, i, imgIdx)}>
                                                        <DownloadIcon /> Baixar Imagem
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>

                    <button
                        className="btn-secondary"
                        style={{ margin: '2rem auto', display: 'flex' }}
                        onClick={() => generateDesigns(true)}
                    >
                        + Gerar mais opções
                    </button>
                </div>
            )}

            {/* Refine Panel */}
            {refining.index >= 0 && (
                <div className="refine-section">
                    <div className="page-label">Refinamento</div>
                    <h2 className="page-title" style={{ fontSize: '1.3rem', marginBottom: '1rem' }}>
                        Refinar <span className="gold">{variations[refining.index]?.title || 'Design'}</span>
                    </h2>
                    <div className="refine-preview">
                        <IframeSrcdoc html={variations[refining.index]?.html || ''} className="refine-frame" />
                    </div>
                    <textarea
                        rows="3"
                        placeholder="Descreva as alterações desejadas..."
                        value={refining.text}
                        onChange={(e) => setRefining(r => ({ ...r, text: e.target.value }))}
                    />
                    <div className="refine-actions">
                        <button className="btn-primary" onClick={refineDesign} disabled={loading}>
                            ✦ Aplicar Refinamento
                        </button>
                        <button className="btn-outline" onClick={() => setRefining({ index: -1, text: '' })}>
                            Cancelar
                        </button>
                    </div>
                </div>
            )}

            {/* Fullscreen Modal */}
            {fullscreen.open && (
                <div className={`fullscreen-modal ${fullscreen.open ? 'visible' : ''}`}>
                    <div className="fullscreen-bar">
                        <button className="fullscreen-back" onClick={closeFullscreen}>
                            ← Voltar às Opções
                        </button>
                        <h3>{variations[fullscreen.index]?.title || ''}</h3>
                        <button className="fullscreen-close" onClick={closeFullscreen}>×</button>
                    </div>
                    <iframe
                        ref={fullscreenIframeRef}
                        className="fullscreen-frame"
                        sandbox="allow-scripts"
                    />
                </div>
            )}

            {/* Toast */}
            <div className={`toast ${toast.visible ? 'visible' : ''} ${toast.error ? 'error' : ''}`}>
                {toast.msg}
            </div>
        </div>
    );
}

// Helper: iframe with srcdoc set via ref (avoids React escaping issues)
function IframeSrcdoc({ html, className }) {
    const ref = useRef(null);
    useEffect(() => {
        if (ref.current) ref.current.srcdoc = html;
    }, [html]);
    return <iframe ref={ref} className={className} sandbox="allow-scripts" />;
}

// SVG Icons
function CopyIcon() {
    return (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="9" y="9" width="13" height="13" rx="2" />
            <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
        </svg>
    );
}

function DownloadIcon() {
    return (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
        </svg>
    );
}

function EditIcon() {
    return (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
            <path d="M18.5 2.5a2.1 2.1 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
        </svg>
    );
}

function ImageIcon() {
    return (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <circle cx="8.5" cy="8.5" r="1.5" />
            <path d="M21 15l-5-5L5 21" />
        </svg>
    );
}
