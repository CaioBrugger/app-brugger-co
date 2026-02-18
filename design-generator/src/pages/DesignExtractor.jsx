import { useState, useCallback, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { extractDesignSystem } from '../services/claude';

// ─── Helper: extract colors from markdown output ────────
function extractColorsFromText(text) {
    const hexRegex = /#(?:[0-9a-fA-F]{6}|[0-9a-fA-F]{3})\b/g;
    const matches = [...new Set(text.match(hexRegex) || [])];
    return matches.slice(0, 30); // Limit to 30 colors
}

// ─── Helper: extract font families from markdown output ──
function extractFontsFromText(text) {
    const fontRegex = /(?:--font-\w+|font-family):\s*['"]?([^;'"\n]+)/gi;
    const fonts = [];
    let m;
    while ((m = fontRegex.exec(text)) !== null) {
        const clean = m[1].trim().replace(/['"]/g, '').split(',')[0].trim();
        if (clean && !fonts.includes(clean) && clean.length > 2 && !clean.startsWith('-')) {
            fonts.push(clean);
        }
    }
    return [...new Set(fonts)].slice(0, 8);
}

// ─── Helper: extract CSS variables block ────────────────
function extractCSSBlock(text) {
    const rootMatch = text.match(/:root\s*\{[\s\S]*?\}/);
    return rootMatch ? rootMatch[0] : null;
}

export default function DesignExtractor() {
    const [inputMethod, setInputMethod] = useState('url'); // 'url' | 'images'
    const [url, setUrl] = useState('');
    const [images, setImages] = useState([]); // { file, preview }
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);
    const [previewTab, setPreviewTab] = useState('full');
    const [toast, setToast] = useState({ msg: '', visible: false, error: false });
    const toastTimer = useRef(null);
    const fileInputRef = useRef(null);

    const showToast = useCallback((msg, error = false) => {
        clearTimeout(toastTimer.current);
        setToast({ msg, error, visible: true });
        toastTimer.current = setTimeout(() => setToast(t => ({ ...t, visible: false })), 3000);
    }, []);

    // Image handling
    const handleImageAdd = useCallback((e) => {
        const files = Array.from(e.target?.files || e.dataTransfer?.files || []);
        const imageFiles = files.filter(f => f.type.startsWith('image/'));
        if (imageFiles.length === 0) {
            showToast('Apenas imagens são aceitas', true);
            return;
        }

        setImages(prev => {
            const remaining = 3 - prev.length;
            const toAdd = imageFiles.slice(0, remaining);
            return [...prev, ...toAdd.map(file => ({
                file,
                preview: URL.createObjectURL(file),
            }))];
        });
    }, [showToast]);

    const removeImage = (idx) => {
        setImages(prev => {
            const updated = [...prev];
            URL.revokeObjectURL(updated[idx].preview);
            updated.splice(idx, 1);
            return updated;
        });
    };

    // Extract
    const handleExtract = async () => {
        let input = '';

        if (inputMethod === 'url') {
            if (!url.trim()) {
                showToast('Insira uma URL válida', true);
                return;
            }
            input = `Website URL to analyze: ${url.trim()}\n\nPlease analyze this website's design system by visiting the URL and extracting all visual design tokens, colors, typography, spacing, components, and patterns.`;
        } else {
            if (images.length === 0) {
                showToast('Adicione pelo menos uma imagem', true);
                return;
            }
            // Convert images to base64 descriptions
            const descriptions = images.map((img, i) => `Image ${i + 1}: ${img.file.name} (${img.file.type}, ${(img.file.size / 1024).toFixed(0)}KB)`);
            input = `UI screenshots to analyze:\n${descriptions.join('\n')}\n\nPlease analyze these UI screenshots and extract the complete design system, including all colors visible, typography styles, spacing, components, and design patterns. Base your analysis on the visual elements described.`;
        }

        setLoading(true);
        setResult(null);

        try {
            const markdown = await extractDesignSystem(input);
            setResult(markdown);
            setPreviewTab('full');
            showToast('Design system extraído com sucesso!');
        } catch (err) {
            console.error('[Extractor] Error:', err);
            showToast(`Erro: ${err.message}`, true);
        } finally {
            setLoading(false);
        }
    };

    // Download
    const downloadResult = () => {
        if (!result) return;
        const blob = new Blob([result], { type: 'text/markdown' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `design-system-extracted.md`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(a.href);
        showToast('Download iniciado!');
    };

    const copyCSSVars = () => {
        const css = extractCSSBlock(result || '');
        if (css) {
            navigator.clipboard.writeText(css);
            showToast('CSS Variables copiado!');
        } else {
            showToast('Nenhum bloco :root {} encontrado', true);
        }
    };

    // Extracted data for preview tabs
    const extractedColors = result ? extractColorsFromText(result) : [];
    const extractedFonts = result ? extractFontsFromText(result) : [];
    const extractedCSS = result ? extractCSSBlock(result) : null;

    return (
        <div className="agents-page">
            {/* Hero */}
            <div className="agents-hero">
                <div className="agents-hero-content">
                    <div className="agents-hero-badge">Ferramenta IA</div>
                    <h1 className="agents-hero-title">
                        Design System<br />
                        <span className="agents-hero-accent">Extractor</span>
                    </h1>
                    <p className="agents-hero-desc">
                        Extraia o design system completo de qualquer site ou UI a partir de um link ou screenshots.
                        Claude Opus 4.6 analisa e gera tokens, cores, tipografia, componentes e CSS variables.
                    </p>
                </div>
                <div className="agents-hero-stats">
                    <div className="agents-hero-stat">
                        <span className="agents-hero-stat-value">14</span>
                        <span className="agents-hero-stat-label">Seções</span>
                    </div>
                    <div className="agents-hero-stat-divider" />
                    <div className="agents-hero-stat">
                        <span className="agents-hero-stat-value">✦</span>
                        <span className="agents-hero-stat-label">Claude Opus</span>
                    </div>
                    <div className="agents-hero-stat-divider" />
                    <div className="agents-hero-stat">
                        <span className="agents-hero-stat-value">.md</span>
                        <span className="agents-hero-stat-label">Output</span>
                    </div>
                </div>
            </div>

            {/* Input Section */}
            <div className="extractor-input-section">
                <div className="extractor-method-tabs">
                    <button
                        className={`extractor-method-tab ${inputMethod === 'url' ? 'active' : ''}`}
                        onClick={() => setInputMethod('url')}
                    >
                        🔗 URL do Site
                    </button>
                    <button
                        className={`extractor-method-tab ${inputMethod === 'images' ? 'active' : ''}`}
                        onClick={() => setInputMethod('images')}
                    >
                        📸 Screenshots
                    </button>
                </div>

                {inputMethod === 'url' && (
                    <div className="extractor-url-input">
                        <input
                            type="url"
                            placeholder="https://exemplo.com — cole a URL do site para analisar"
                            value={url}
                            onChange={(e) => setUrl(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleExtract()}
                        />
                        <button className="btn-primary" onClick={handleExtract} disabled={loading || !url.trim()}>
                            {loading ? <><span className="loading-spinner-sm" /> Extraindo...</> : '✦ Extrair DS'}
                        </button>
                    </div>
                )}

                {inputMethod === 'images' && (
                    <>
                        <div className="extractor-images-grid">
                            {[0, 1, 2].map(idx => {
                                const img = images[idx];
                                return (
                                    <div
                                        key={idx}
                                        className="extractor-image-slot"
                                        onClick={() => !img && fileInputRef.current?.click()}
                                        onDragOver={(e) => e.preventDefault()}
                                        onDrop={(e) => { e.preventDefault(); handleImageAdd(e); }}
                                    >
                                        {img ? (
                                            <>
                                                <img src={img.preview} alt={`Screenshot ${idx + 1}`} />
                                                <button className="extractor-image-remove" onClick={(e) => { e.stopPropagation(); removeImage(idx); }}>✕</button>
                                            </>
                                        ) : (
                                            <>
                                                <span className="extractor-image-slot-icon">📷</span>
                                                <span>Screenshot {idx + 1}</span>
                                                <span style={{ fontSize: '0.6rem' }}>Arraste ou clique</span>
                                            </>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            multiple
                            style={{ display: 'none' }}
                            onChange={handleImageAdd}
                        />
                        <button className="btn-primary btn-full" onClick={handleExtract} disabled={loading || images.length === 0}>
                            {loading ? <><span className="loading-spinner-sm" /> Analisando screenshots...</> : `✦ Extrair DS de ${images.length} screenshot${images.length !== 1 ? 's' : ''}`}
                        </button>
                    </>
                )}
            </div>

            {/* Loading */}
            {loading && (
                <div className="agents-gen-loading">
                    <div className="agents-gen-loading-orbit">
                        <div className="agents-gen-loading-dot" />
                        <div className="agents-gen-loading-dot" />
                        <div className="agents-gen-loading-dot" />
                    </div>
                    <p>Claude Opus 4.6 está analisando o design system...</p>
                    <span>A extração completa pode levar até 60 segundos</span>
                </div>
            )}

            {/* Result */}
            {result && (
                <div className="extractor-preview">
                    {/* Header */}
                    <div className="extractor-preview-header">
                        <h3>🎨 Design System Extraído</h3>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button className="btn-secondary" onClick={copyCSSVars}>📋 Copiar CSS Vars</button>
                            <button className="btn-secondary" onClick={downloadResult}>⬇ Baixar .md</button>
                        </div>
                    </div>

                    {/* Preview Tabs */}
                    <div className="extractor-preview-tabs" style={{ marginBottom: '1rem' }}>
                        {[
                            { id: 'full', label: 'Completo' },
                            { id: 'colors', label: 'Cores' },
                            { id: 'typography', label: 'Tipografia' },
                            { id: 'tokens', label: 'CSS Tokens' },
                        ].map(tab => (
                            <button
                                key={tab.id}
                                className={`extractor-preview-tab ${previewTab === tab.id ? 'active' : ''}`}
                                onClick={() => setPreviewTab(tab.id)}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    {/* Tab: Full Markdown */}
                    {previewTab === 'full' && (
                        <div className="agents-gen-result-body">
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>{result}</ReactMarkdown>
                        </div>
                    )}

                    {/* Tab: Colors */}
                    {previewTab === 'colors' && (
                        <div>
                            <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', marginBottom: '1rem' }}>
                                {extractedColors.length} cores detectadas no design system extraído
                            </p>
                            <div className="extractor-colors-preview">
                                {extractedColors.map((hex, i) => (
                                    <button
                                        key={i}
                                        className="extractor-color-chip"
                                        onClick={() => { navigator.clipboard.writeText(hex); showToast(`${hex} copiado!`); }}
                                        style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '0.5rem' }}
                                    >
                                        <div className="extractor-color-circle" style={{ background: hex }} />
                                        <span className="extractor-color-hex">{hex}</span>
                                    </button>
                                ))}
                            </div>
                            {extractedColors.length === 0 && (
                                <div className="agents-empty">
                                    <span className="agents-empty-icon">🎨</span>
                                    <p>Nenhuma cor extraída — veja a aba "Completo" para o resultado bruto.</p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Tab: Typography */}
                    {previewTab === 'typography' && (
                        <div>
                            <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', marginBottom: '1rem' }}>
                                {extractedFonts.length} famílias tipográficas detectadas
                            </p>
                            <div className="extractor-type-preview">
                                {extractedFonts.map((font, i) => (
                                    <div key={i} style={{ padding: '1rem 0', borderBottom: '1px solid var(--border)' }}>
                                        <div style={{ fontFamily: `'${font}', sans-serif`, fontSize: '1.75rem', marginBottom: '0.5rem', color: 'var(--text)' }}>
                                            {font}
                                        </div>
                                        <div style={{ fontFamily: `'${font}', sans-serif`, fontSize: '1rem', color: 'var(--text-secondary)' }}>
                                            The quick brown fox jumps over the lazy dog — 0123456789
                                        </div>
                                        <code style={{
                                            fontFamily: "'JetBrains Mono', monospace",
                                            fontSize: '0.68rem',
                                            color: 'var(--accent)',
                                            background: 'rgba(201,169,98,0.08)',
                                            padding: '0.15rem 0.4rem',
                                            borderRadius: '2px',
                                            marginTop: '0.5rem',
                                            display: 'inline-block'
                                        }}>
                                            font-family: '{font}'
                                        </code>
                                    </div>
                                ))}
                                {extractedFonts.length === 0 && (
                                    <div className="agents-empty">
                                        <span className="agents-empty-icon">🔤</span>
                                        <p>Nenhuma fonte detectada — veja a aba "Completo" para o resultado bruto.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Tab: CSS Tokens */}
                    {previewTab === 'tokens' && (
                        <div>
                            {extractedCSS ? (
                                <div className="ds-code-block">
                                    <div className="ds-code-header">
                                        <span>:root { }</span>
                                        <button className="ds-code-copy" onClick={copyCSSVars}>📋 Copiar</button>
                                    </div>
                                    <pre className="ds-code-pre"><code>{extractedCSS}</code></pre>
                                </div>
                            ) : (
                                <div className="agents-empty">
                                    <span className="agents-empty-icon">📋</span>
                                    <p>Nenhum bloco :root { } encontrado — veja a aba "Completo" para o resultado bruto.</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}

            {/* Toast */}
            <div className={`toast ${toast.visible ? 'visible' : ''} ${toast.error ? 'error' : ''}`}>{toast.msg}</div>
        </div>
    );
}
