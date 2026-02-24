import { useState, useEffect, useRef, useCallback } from 'react';
import { callGeminiWithImages, callGemini } from '../api';
import { buildExtractThemePrompt, buildThemePreviewPrompt } from '../prompt';
import { fetchThemes, saveTheme, deleteTheme } from '../services/themesService';

function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
            const base64 = reader.result.split(',')[1];
            resolve({ mimeType: file.type, data: base64 });
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

export default function Themes() {
    const [name, setName] = useState('');
    const [specs, setSpecs] = useState('');
    const [urls, setUrls] = useState('');
    const [images, setImages] = useState([]);
    const [previews, setPreviews] = useState([]);
    const [loading, setLoading] = useState(false);
    const [loadingPreview, setLoadingPreview] = useState(false);
    const [status, setStatus] = useState('');
    const [result, setResult] = useState(null);
    const [previewHtml, setPreviewHtml] = useState('');
    const [savedThemes, setSavedThemes] = useState([]);
    const [selectedTheme, setSelectedTheme] = useState(null);
    const [copiedCSS, setCopiedCSS] = useState(false);
    const [error, setError] = useState('');
    const [tab, setTab] = useState('create');
    const fileInputRef = useRef(null);

    useEffect(() => {
        fetchThemes().then(setSavedThemes);
    }, []);

    const handleImageUpload = useCallback((e) => {
        const files = Array.from(e.target.files || []);
        if (images.length + files.length > 5) {
            setError('Máximo de 5 imagens');
            return;
        }
        const newPreviews = files.map(f => URL.createObjectURL(f));
        setImages(prev => [...prev, ...files]);
        setPreviews(prev => [...prev, ...newPreviews]);
        setError('');
    }, [images]);

    const removeImage = (idx) => {
        URL.revokeObjectURL(previews[idx]);
        setImages(prev => prev.filter((_, i) => i !== idx));
        setPreviews(prev => prev.filter((_, i) => i !== idx));
    };

    const handleDrop = useCallback((e) => {
        e.preventDefault();
        const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'));
        if (images.length + files.length > 5) {
            setError('Máximo de 5 imagens');
            return;
        }
        const newPreviews = files.map(f => URL.createObjectURL(f));
        setImages(prev => [...prev, ...files]);
        setPreviews(prev => [...prev, ...newPreviews]);
        setError('');
    }, [images]);

    const generate = async () => {
        if (!name.trim()) { setError('Dê um nome ao tema'); return; }
        if (!specs.trim() && images.length === 0 && !urls.trim()) {
            setError('Adicione especificações, imagens ou URLs de referência');
            return;
        }

        setLoading(true);
        setError('');
        setResult(null);
        setPreviewHtml('');
        setStatus('Preparando imagens...');

        try {
            const base64Images = await Promise.all(images.map(fileToBase64));

            setStatus('Extraindo Design System com IA...');
            const prompt = buildExtractThemePrompt(name.trim(), specs.trim(), urls.trim());

            let tokens;
            if (base64Images.length > 0) {
                tokens = await callGeminiWithImages(prompt, base64Images);
            } else {
                tokens = await callGemini(prompt);
            }

            setResult(tokens);
            setStatus('Gerando preview visual...');
            setLoadingPreview(true);

            try {
                const previewPrompt = buildThemePreviewPrompt(tokens);
                const preview = await callGemini(previewPrompt);
                if (preview?.html) setPreviewHtml(preview.html);
            } catch (previewErr) {
                console.warn('Preview generation failed:', previewErr);
            }

            setLoadingPreview(false);
            setStatus('');
        } catch (err) {
            setError(err.message || 'Erro ao gerar tema');
            setStatus('');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!result) return;
        const theme = await saveTheme({
            name: result.name || name,
            description: result.description || '',
            tokens: result,
            previewHtml,
            accentColors: [
                result.colors?.accent,
                result.colors?.background,
                result.colors?.text,
                result.colors?.surface,
                result.colors?.accentLight
            ].filter(Boolean)
        });
        setSavedThemes(prev => [theme, ...prev]);
        setTab('gallery');
    };

    const handleDelete = async (id) => {
        await deleteTheme(id);
        setSavedThemes(prev => prev.filter(t => t.id !== id));
        if (selectedTheme?.id === id) setSelectedTheme(null);
    };

    const copyCSS = (css) => {
        navigator.clipboard.writeText(css);
        setCopiedCSS(true);
        setTimeout(() => setCopiedCSS(false), 2000);
    };

    const openThemeDetail = (theme) => {
        setSelectedTheme(theme);
        setResult(theme.tokens);
        setPreviewHtml(theme.previewHtml || '');
        setTab('create');
    };

    return (
        <div className="themes-page">
            <div className="page-header">
                <div className="page-label">Criador de Temas</div>
                <h1 className="page-title">Design System <span className="gold">Themes</span></h1>
                <p className="page-desc">
                    Envie referências visuais e a IA extrairá um Design System completo para você.
                </p>
            </div>

            <div className="themes-tabs">
                <button className={`themes-tab ${tab === 'create' ? 'active' : ''}`} onClick={() => setTab('create')}>
                    ✦ Criar Tema
                </button>
                <button className={`themes-tab ${tab === 'gallery' ? 'active' : ''}`} onClick={() => setTab('gallery')}>
                    📁 Temas Salvos <span className="themes-tab-count">{savedThemes.length}</span>
                </button>
            </div>

            {tab === 'create' && (
                <div className="themes-create">
                    <div className="themes-split">
                        {/* Input Panel */}
                        <div className="themes-input-panel">
                            <div className="themes-field">
                                <label className="themes-label">Nome do Tema</label>
                                <input
                                    type="text"
                                    className="themes-input"
                                    placeholder="ex: Minimalist SaaS, Dark Premium, Neon Futuristic..."
                                    value={name}
                                    onChange={e => setName(e.target.value)}
                                    disabled={loading}
                                />
                            </div>

                            <div className="themes-field">
                                <label className="themes-label">Especificações / Descrição do Estilo</label>
                                <textarea
                                    className="themes-textarea"
                                    placeholder="Descreva o visual: cores predominantes, atmosfera, tipo de produto, público-alvo, referências de estilo..."
                                    value={specs}
                                    onChange={e => setSpecs(e.target.value)}
                                    rows={4}
                                    disabled={loading}
                                />
                            </div>

                            <div className="themes-field">
                                <label className="themes-label">URLs de Referência <span className="themes-optional">(opcional)</span></label>
                                <input
                                    type="text"
                                    className="themes-input"
                                    placeholder="https://site-referencia.com, https://outro-exemplo.com"
                                    value={urls}
                                    onChange={e => setUrls(e.target.value)}
                                    disabled={loading}
                                />
                            </div>

                            <div className="themes-field">
                                <label className="themes-label">Screenshots de Referência <span className="themes-optional">(até 5)</span></label>
                                <div
                                    className={`themes-dropzone ${images.length >= 5 ? 'full' : ''}`}
                                    onClick={() => images.length < 5 && fileInputRef.current?.click()}
                                    onDrop={handleDrop}
                                    onDragOver={e => e.preventDefault()}
                                >
                                    {previews.length === 0 ? (
                                        <div className="themes-dropzone-empty">
                                            <span className="themes-dropzone-icon">🖼️</span>
                                            <span>Clique ou arraste imagens aqui</span>
                                            <small>PNG, JPG, WebP — até 5 arquivos</small>
                                        </div>
                                    ) : (
                                        <div className="themes-dropzone-grid">
                                            {previews.map((src, i) => (
                                                <div key={i} className="themes-thumb">
                                                    <img src={src} alt={`ref-${i}`} />
                                                    <button className="themes-thumb-remove" onClick={(e) => { e.stopPropagation(); removeImage(i); }}>✕</button>
                                                </div>
                                            ))}
                                            {images.length < 5 && (
                                                <div className="themes-thumb themes-thumb-add">
                                                    <span>+</span>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/*"
                                    multiple
                                    hidden
                                    onChange={handleImageUpload}
                                />
                            </div>

                            {error && <div className="themes-error">{error}</div>}

                            <button className="themes-generate-btn" onClick={generate} disabled={loading}>
                                {loading ? (
                                    <><span className="themes-spinner" /> {status || 'Processando...'}</>
                                ) : (
                                    '✦ Gerar Design System'
                                )}
                            </button>
                        </div>

                        {/* Preview Panel */}
                        <div className="themes-preview-panel">
                            {!result && !loading && (
                                <div className="themes-preview-empty">
                                    <span className="themes-preview-empty-icon">🎨</span>
                                    <h3>Preview do Tema</h3>
                                    <p>Preencha as informações ao lado e clique em "Gerar" para visualizar o Design System extraído.</p>
                                </div>
                            )}

                            {loading && (
                                <div className="themes-preview-loading">
                                    <div className="themes-loading-dots">
                                        <span /><span /><span />
                                    </div>
                                    <p>{status}</p>
                                </div>
                            )}

                            {result && !loading && (
                                <div className="themes-result">
                                    <div className="themes-result-header">
                                        <div>
                                            <h2>{result.name || name}</h2>
                                            <p className="themes-result-desc">{result.description}</p>
                                            {result.personality && (
                                                <div className="themes-tags">
                                                    {result.personality.map((t, i) => <span key={i} className="themes-tag">{t}</span>)}
                                                </div>
                                            )}
                                        </div>
                                        <div className="themes-result-actions">
                                            <button className="themes-btn-save" onClick={handleSave}>💾 Salvar Tema</button>
                                            <button className="themes-btn-secondary" onClick={() => copyCSS(result.cssVariables || '')}>
                                                {copiedCSS ? '✓ Copiado!' : '📋 Copiar CSS'}
                                            </button>
                                        </div>
                                    </div>

                                    {/* Color Palette */}
                                    {result.colors && (
                                        <div className="themes-section">
                                            <h3 className="themes-section-title">🎨 Paleta de Cores</h3>
                                            <div className="themes-colors-grid">
                                                {Object.entries(result.colors).map(([key, hex]) => (
                                                    <div key={key} className="themes-color-swatch" onClick={() => { navigator.clipboard.writeText(hex); }}>
                                                        <div className="themes-color-circle" style={{ background: hex }} />
                                                        <div className="themes-color-info">
                                                            <span className="themes-color-name">{key}</span>
                                                            <code className="themes-color-hex">{hex}</code>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Typography */}
                                    {result.typography && (
                                        <div className="themes-section">
                                            <h3 className="themes-section-title">📝 Tipografia</h3>
                                            <div className="themes-type-families">
                                                <div className="themes-type-row">
                                                    <span className="themes-type-label">Heading</span>
                                                    <span className="themes-type-value" style={{ fontFamily: result.typography.fontHeading }}>{result.typography.fontHeading}</span>
                                                </div>
                                                <div className="themes-type-row">
                                                    <span className="themes-type-label">Body</span>
                                                    <span className="themes-type-value" style={{ fontFamily: result.typography.fontBody }}>{result.typography.fontBody}</span>
                                                </div>
                                                {result.typography.fontMono && (
                                                    <div className="themes-type-row">
                                                        <span className="themes-type-label">Mono</span>
                                                        <span className="themes-type-value" style={{ fontFamily: result.typography.fontMono }}>{result.typography.fontMono}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {/* Component Demos */}
                                    {result.components && (
                                        <div className="themes-section">
                                            <h3 className="themes-section-title">🧩 Componentes</h3>
                                            <div className="themes-components-demo">
                                                {result.components.buttonPrimary && (
                                                    <button style={{
                                                        background: result.components.buttonPrimary.background,
                                                        color: result.components.buttonPrimary.color,
                                                        borderRadius: result.components.buttonPrimary.borderRadius,
                                                        padding: result.components.buttonPrimary.padding,
                                                        fontSize: result.components.buttonPrimary.fontSize,
                                                        fontWeight: result.components.buttonPrimary.fontWeight,
                                                        border: 'none', cursor: 'pointer'
                                                    }}>Botão Primary</button>
                                                )}
                                                {result.components.buttonSecondary && (
                                                    <button style={{
                                                        background: result.components.buttonSecondary.background || 'transparent',
                                                        color: result.components.buttonSecondary.color,
                                                        border: result.components.buttonSecondary.border,
                                                        borderRadius: result.components.buttonSecondary.borderRadius,
                                                        padding: result.components.buttonSecondary.padding,
                                                        cursor: 'pointer'
                                                    }}>Botão Secondary</button>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {/* CSS Variables */}
                                    {result.cssVariables && (
                                        <div className="themes-section">
                                            <h3 className="themes-section-title">💻 CSS Variables</h3>
                                            <div className="themes-code-block">
                                                <div className="themes-code-header">
                                                    <span>:root { }</span>
                                                    <button onClick={() => copyCSS(result.cssVariables)}>
                                                        {copiedCSS ? '✓ Copiado' : 'Copiar'}
                                                    </button>
                                                </div>
                                                <pre className="themes-code-pre"><code>{result.cssVariables}</code></pre>
                                            </div>
                                        </div>
                                    )}

                                    {/* HTML Preview */}
                                    {previewHtml && (
                                        <div className="themes-section">
                                            <h3 className="themes-section-title">👁️ Preview Visual</h3>
                                            <div className="themes-iframe-wrap">
                                                <IframePreview html={previewHtml} />
                                            </div>
                                        </div>
                                    )}
                                    {loadingPreview && (
                                        <div className="themes-section">
                                            <h3 className="themes-section-title">👁️ Preview Visual</h3>
                                            <div className="themes-preview-loading" style={{ minHeight: '200px' }}>
                                                <div className="themes-loading-dots"><span /><span /><span /></div>
                                                <p>Gerando preview visual...</p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {tab === 'gallery' && (
                <div className="themes-gallery">
                    {savedThemes.length === 0 ? (
                        <div className="themes-gallery-empty">
                            <span>📭</span>
                            <h3>Nenhum tema salvo</h3>
                            <p>Crie seu primeiro tema na aba "Criar Tema".</p>
                        </div>
                    ) : (
                        <div className="themes-gallery-grid">
                            {savedThemes.map(theme => (
                                <div key={theme.id} className="themes-gallery-card" onClick={() => openThemeDetail(theme)}>
                                    <div className="themes-gallery-card-palette">
                                        {(theme.accentColors || []).slice(0, 5).map((c, i) => (
                                            <div key={i} className="themes-gallery-color" style={{ background: c }} />
                                        ))}
                                    </div>
                                    <div className="themes-gallery-card-info">
                                        <h4>{theme.name}</h4>
                                        <p>{theme.description || 'Design System personalizado'}</p>
                                        <span className="themes-gallery-date">
                                            {new Date(theme.createdAt).toLocaleDateString('pt-BR')}
                                        </span>
                                    </div>
                                    <div className="themes-gallery-card-actions">
                                        <button className="themes-btn-icon" title="Copiar CSS" onClick={(e) => {
                                            e.stopPropagation();
                                            copyCSS(theme.tokens?.cssVariables || '');
                                        }}>📋</button>
                                        <button className="themes-btn-icon themes-btn-danger" title="Deletar" onClick={(e) => {
                                            e.stopPropagation();
                                            handleDelete(theme.id);
                                        }}>🗑️</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

function IframePreview({ html }) {
    const iframeRef = useRef(null);
    useEffect(() => {
        if (iframeRef.current && html) {
            iframeRef.current.srcdoc = html;
        }
    }, [html]);
    return <iframe ref={iframeRef} className="themes-iframe" title="Theme Preview" sandbox="allow-scripts" />;
}
