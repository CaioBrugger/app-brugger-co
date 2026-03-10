import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { callGeminiWithImages, callGemini } from '../api';
import { callClaudeWithImages } from '../services/claude';
import { buildExtractThemePrompt, buildThemePreviewPrompt, buildVisualAnalysisPrompt } from '../prompt';
import { fetchThemes, saveTheme, deleteTheme } from '../services/themesService';
import { fetchSiteStyles, checkDesignClonerServer, listLocalPages, fetchLocalPage } from '../services/urlFetcher';
import { captureScreenshots } from '../services/screenshotService';

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

const STEPS = [
    { id: 'fetch', label: 'Renderizando site (Playwright)', icon: '🔍' },
    { id: 'screenshot', label: 'Capturando screenshot', icon: '📸' },
    { id: 'vision', label: 'Claude analisando visualmente', icon: '🧠' },
    { id: 'extract', label: 'Extraindo Design System', icon: '⚛️' },
    { id: 'preview', label: 'Gerando preview', icon: '🎨' },
    { id: 'done', label: 'Concluído', icon: '✅' }
];

export default function Themes() {
    const navigate = useNavigate();
    const [name, setName] = useState('');
    const [specs, setSpecs] = useState('');
    const [urls, setUrls] = useState('');
    const [images, setImages] = useState([]);
    const [previews, setPreviews] = useState([]);
    const [loading, setLoading] = useState(false);
    const [currentStep, setCurrentStep] = useState(-1);
    const [result, setResult] = useState(null);
    const [previewHtml, setPreviewHtml] = useState('');
    const [screenshots, setScreenshots] = useState([]);
    const [visualAnalysis, setVisualAnalysis] = useState(null);
    const [stepStatus, setStepStatus] = useState({});
    const [savedThemes, setSavedThemes] = useState([]);
    const [copiedCSS, setCopiedCSS] = useState(false);
    const [error, setError] = useState('');
    const [tab, setTab] = useState('create');
    const [galleryView, setGalleryView] = useState(null);
    const [localPages, setLocalPages] = useState([]);
    const fileInputRef = useRef(null);
    const previewRef = useRef(null);

    useEffect(() => {
        fetchThemes().then(setSavedThemes);
    }, []);

    useEffect(() => {
        if (tab === 'local') listLocalPages().then(setLocalPages);
    }, [tab]);

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

    const hasInput = () => name.trim() && (specs.trim() || images.length > 0 || urls.trim());

    const generate = async () => {
        if (!name.trim()) { setError('Dê um nome ao tema'); return; }
        if (!specs.trim() && images.length === 0 && !urls.trim()) {
            setError('Adicione ao menos uma fonte: descrição, imagens ou URL');
            return;
        }

        setLoading(true);
        setError('');
        setResult(null);
        setPreviewHtml('');
        setScreenshots([]);
        setVisualAnalysis(null);
        setStepStatus({});
        setCurrentStep(0);

        const status = {};
        const updateStatus = (step, icon, msg) => {
            status[step] = { icon, msg };
            setStepStatus({ ...status });
        };

        try {
            // ── Step 1: Fetch via servidor Playwright ou CORS proxy ──
            let siteData = null;
            const firstUrl = urls.trim() ? urls.trim().split(',')[0].trim() : null;
            if (firstUrl) {
                try {
                    // checkDesignClonerServer() é chamado internamente pelo fetchSiteStyles
                    siteData = await fetchSiteStyles(firstUrl);
                    if (siteData?.success) {
                        const isPlaywright = siteData.source === 'playwright-server';
                        const palette = siteData._serverData?.colorPalette?.palette?.length || 0;
                        const cssVarsCount = siteData._serverData?.cssVarsCount || 0;
                        if (isPlaywright) {
                            updateStatus('fetch', '✅', `Playwright: ${palette} cores clusterizadas, ${cssVarsCount} CSS vars`);
                        } else {
                            const cssSize = siteData.css ? `${(siteData.css.length / 1024).toFixed(1)}KB` : '0KB';
                            updateStatus('fetch', '⚠️', `CORS proxy (servidor offline): ${cssSize}`);
                        }
                    } else {
                        updateStatus('fetch', '⚠️', 'CSS parcial ou indisponível');
                    }
                } catch {
                    updateStatus('fetch', '❌', 'Falha ao buscar CSS');
                }
            } else {
                updateStatus('fetch', '⏭️', 'Nenhuma URL — pulado');
            }

            setCurrentStep(1);

            // ── Step 2: Screenshot — reusar do servidor se já capturado ──
            let capturedScreenshots = [];
            if (firstUrl) {
                try {
                    // Se o servidor já capturou screenshot, reutilizar
                    const serverScreenshot = siteData?._serverData?.screenshot || null;
                    const ssResult = await captureScreenshots(firstUrl, { serverScreenshot });
                    capturedScreenshots = ssResult.screenshots || [];
                    setScreenshots(capturedScreenshots);
                    if (capturedScreenshots.length > 0) {
                        const source = ssResult.source === 'playwright-server' ? 'Playwright' : ssResult.source;
                        updateStatus('screenshot', '✅', `${capturedScreenshots.length} screenshot(s) via ${source}`);
                    } else {
                        updateStatus('screenshot', '❌', 'Nenhum screenshot capturado');
                    }
                } catch (ssErr) {
                    updateStatus('screenshot', '❌', ssErr.message);
                }
            } else {
                updateStatus('screenshot', '⏭️', 'Nenhuma URL — pulado');
            }

            setCurrentStep(2);

            // ── Step 3: Claude Sonnet visual analysis ──
            let visionResult = null;
            const allImages = [
                ...capturedScreenshots.filter(Boolean).map(s => ({ mimeType: s.mimeType, data: s.data })),
                ...(await Promise.all(images.map(fileToBase64)))
            ];

            if (allImages.length > 0) {
                try {
                    const visionPrompt = buildVisualAnalysisPrompt(name.trim());
                    const visionRaw = await callClaudeWithImages(
                        visionPrompt,
                        `Analyze these ${allImages.length} screenshot(s) of the website "${name.trim()}" and extract the complete design system. Return ONLY valid JSON.`,
                        allImages
                    );
                    try {
                        visionResult = typeof visionRaw === 'string'
                            ? JSON.parse(visionRaw.replace(/```json?\s*/g, '').replace(/```/g, '').trim())
                            : visionRaw;
                    } catch {
                        const jsonMatch = visionRaw?.match(/\{[\s\S]*\}/);
                        visionResult = jsonMatch ? JSON.parse(jsonMatch[0]) : null;
                    }
                    setVisualAnalysis(visionResult);
                    updateStatus('vision', '✅', `Análise visual completa — ${visionResult?.personality?.join(', ') || 'tokens extraídos'}`);
                } catch (vErr) {
                    updateStatus('vision', '❌', `Claude falhou: ${vErr.message}`);
                }
            } else {
                updateStatus('vision', '⏭️', 'Sem imagens — análise visual pulada');
            }

            setCurrentStep(3);

            // ── Anti-invention check ──
            const isUrlExtraction = !!firstUrl;
            const hasVisual = !!visionResult;
            const hasCss = siteData?.success && siteData.css?.length > 100;
            const hasServerData = !!(siteData?._serverData?.colorPalette?.palette?.length);
            const hasUserImages = images.length > 0;

            if (isUrlExtraction && !hasVisual && !hasCss && !hasServerData && !hasUserImages) {
                updateStatus('extract', '❌', 'Sem dados suficientes do site');
                throw new Error(
                    'Não foi possível capturar screenshots nem CSS válido deste site. ' +
                    'Tente: (1) Iniciar o design-cloner-server/start-server.bat para extração via Playwright, ' +
                    'ou (2) Fazer upload manual de screenshots do site na seção "Screenshots".'
                );
            }

            // ── Step 4: Gemini — merge todos os dados → final tokens ──
            const prompt = buildExtractThemePrompt(name.trim(), specs.trim(), urls.trim(), siteData, visionResult);

            let tokens;
            if (allImages.length > 0) {
                tokens = await callGeminiWithImages(prompt, allImages);
            } else {
                tokens = await callGemini(prompt);
            }

            setResult(tokens);
            const extractSource = hasServerData ? 'Playwright + k-means' : hasVisual ? 'visual + CSS' : hasCss ? 'CSS' : 'descrição';
            updateStatus('extract', '✅', `Design System extraído (${extractSource})`);
            setCurrentStep(4);

            // ── Step 5: Generate preview ──
            try {
                const previewPrompt = buildThemePreviewPrompt(tokens);
                const preview = await callGemini(previewPrompt);
                if (preview?.html) {
                    setPreviewHtml(preview.html);
                    updateStatus('preview', '✅', 'Preview gerado');
                } else {
                    updateStatus('preview', '⚠️', 'Preview vazio');
                }
            } catch (previewErr) {
                updateStatus('preview', '❌', 'Falha ao gerar preview');
                console.warn('Preview generation failed:', previewErr);
            }

            setCurrentStep(5);
        } catch (err) {
            setError(err.message || 'Erro ao gerar tema');
            setCurrentStep(-1);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!result) return;
        const atoms = result.atoms || result;
        const colors = atoms.colors || result.colors || {};
        const meta = result.meta || {};

        // Embed screenshots and visual analysis in tokens for persistence
        const tokensToSave = {
            ...result,
            _screenshots: screenshots.map(s => s.dataUrl).filter(Boolean),
            _visualAnalysis: visualAnalysis,
            _designSummary: visualAnalysis?.summary || ''
        };

        const theme = await saveTheme({
            name: meta.name || result.name || name,
            description: meta.description || result.description || '',
            tokens: tokensToSave,
            previewHtml,
            accentColors: [
                colors.accent,
                colors.background,
                colors.text,
                colors.surface,
                colors.accentLight
            ].filter(Boolean)
        });
        setSavedThemes(prev => [theme, ...prev]);
        setTab('gallery');
    };

    const handleDelete = async (id) => {
        await deleteTheme(id);
        setSavedThemes(prev => prev.filter(t => t.id !== id));
        if (galleryView?.id === id) setGalleryView(null);
    };

    const copyCSS = (css) => {
        navigator.clipboard.writeText(css);
        setCopiedCSS(true);
        setTimeout(() => setCopiedCSS(false), 2000);
    };

    const openThemeDetail = (theme) => {
        setGalleryView(theme);
    };

    const generateFromLocal = async (fileName) => {
        const themeName = name.trim() || fileName.replace(/\.(html?|htm)$/i, '');
        if (!name.trim()) setName(themeName);
        // Mudar para aba create imediatamente para mostrar progresso
        setTab('create');
        await new Promise(r => setTimeout(r, 50));

        setLoading(true);
        setError('');
        setResult(null);
        setPreviewHtml('');
        setScreenshots([]);
        setVisualAnalysis(null);
        setStepStatus({});
        setCurrentStep(0);

        const status = {};
        const updateStatus = (step, icon, msg) => {
            status[step] = { icon, msg };
            setStepStatus({ ...status });
        };

        try {
            // Step 1: Extrair via Playwright local
            let siteData = null;
            try {
                siteData = await fetchLocalPage(fileName);
                const palette = siteData._serverData?.colorPalette?.palette?.length || 0;
                const cssVarsCount = siteData._serverData?.cssVarsCount || 0;
                updateStatus('fetch', '✅', `Local Playwright: ${palette} cores, ${cssVarsCount} CSS vars — ${fileName}`);
            } catch (e) {
                updateStatus('fetch', '❌', `Falha: ${e.message}`);
                throw e;
            }

            setCurrentStep(1);

            // Step 2: Screenshot do servidor
            let capturedScreenshots = [];
            const serverScreenshot = siteData?._serverData?.screenshot;
            if (serverScreenshot) {
                capturedScreenshots = [{
                    data: serverScreenshot.data,
                    mimeType: serverScreenshot.mimeType,
                    dataUrl: `data:${serverScreenshot.mimeType};base64,${serverScreenshot.data}`,
                    label: fileName,
                    width: serverScreenshot.width,
                    height: serverScreenshot.height,
                }];
                setScreenshots(capturedScreenshots);
                updateStatus('screenshot', '✅', '1 screenshot via Playwright local');
            } else {
                updateStatus('screenshot', '⏭️', 'Screenshot não disponível');
            }

            setCurrentStep(2);

            // Step 3: Claude Sonnet visual analysis
            let visionResult = null;
            const allImages = capturedScreenshots.filter(Boolean).map(s => ({ mimeType: s.mimeType, data: s.data }));
            if (allImages.length > 0) {
                try {
                    const visionPrompt = buildVisualAnalysisPrompt(themeName);
                    const visionRaw = await callClaudeWithImages(
                        visionPrompt,
                        `Analyze this screenshot of the page "${themeName}" and extract the complete design system. Return ONLY valid JSON.`,
                        allImages
                    );
                    try {
                        visionResult = typeof visionRaw === 'string'
                            ? JSON.parse(visionRaw.replace(/```json?\s*/g, '').replace(/```/g, '').trim())
                            : visionRaw;
                    } catch {
                        const jsonMatch = visionRaw?.match(/\{[\s\S]*\}/);
                        visionResult = jsonMatch ? JSON.parse(jsonMatch[0]) : null;
                    }
                    setVisualAnalysis(visionResult);
                    updateStatus('vision', '✅', `Análise visual — ${visionResult?.personality?.join(', ') || 'tokens extraídos'}`);
                } catch (vErr) {
                    updateStatus('vision', '❌', `Claude falhou: ${vErr.message}`);
                }
            } else {
                updateStatus('vision', '⏭️', 'Sem screenshots — pulado');
            }

            setCurrentStep(3);

            // Step 4: Gemini token extraction
            const prompt = buildExtractThemePrompt(themeName, '', '', siteData, visionResult);
            let tokens;
            if (allImages.length > 0) {
                tokens = await callGeminiWithImages(prompt, allImages);
            } else {
                tokens = await callGemini(prompt);
            }
            setResult(tokens);
            updateStatus('extract', '✅', 'Design System extraído (Playwright local)');
            setCurrentStep(4);

            // Step 5: Preview
            try {
                const previewPrompt = buildThemePreviewPrompt(tokens);
                const preview = await callGemini(previewPrompt);
                if (preview?.html) {
                    setPreviewHtml(preview.html);
                    updateStatus('preview', '✅', 'Preview gerado');
                } else {
                    updateStatus('preview', '⚠️', 'Preview vazio');
                }
            } catch {
                updateStatus('preview', '❌', 'Falha ao gerar preview');
            }

            setCurrentStep(5);
        } catch (err) {
            setError(err.message || 'Erro ao processar arquivo local');
            setCurrentStep(-1);
        } finally {
            setLoading(false);
        }
    };

    const getTokenColors = (tokens) => {
        if (!tokens) return {};
        return tokens.atoms?.colors || tokens.colors || {};
    };

    const getTokenMeta = (tokens) => {
        if (!tokens) return {};
        return tokens.meta || { name: tokens.name, description: tokens.description, personality: tokens.personality };
    };

    const getCSS = (tokens) => {
        if (!tokens) return '';
        return tokens.meta?.cssVariables || tokens.cssVariables || '';
    };

    return (
        <div className="themes-page">
            <div className="page-header">
                <div className="page-label">Design System Extractor</div>
                <h1 className="page-title">Atomic <span className="gold">Themes</span></h1>
                <p className="page-desc">
                    Extraia Design Systems completos a partir de um link, imagem ou descrição. Metodologia Atomic Design.
                </p>
            </div>

            <div className="themes-tabs">
                <button className={`themes-tab ${tab === 'create' ? 'active' : ''}`} onClick={() => setTab('create')}>
                    ⚛️ Extrair DS
                </button>
                <button className={`themes-tab ${tab === 'gallery' ? 'active' : ''}`} onClick={() => setTab('gallery')}>
                    📁 Galeria <span className="themes-tab-count">{savedThemes.length}</span>
                </button>
                <button className={`themes-tab ${tab === 'local' ? 'active' : ''}`} onClick={() => setTab('local')}>
                    📂 Local {localPages.length > 0 && <span className="themes-tab-count">{localPages.length}</span>}
                </button>
            </div>

            {tab === 'create' && (
                <div className="themes-create">
                    <div className="themes-split">
                        {/* Input Panel */}
                        <div className="themes-input-panel">
                            <div className="themes-field">
                                <label className="themes-label">Nome do Design System</label>
                                <input
                                    type="text"
                                    className="themes-input"
                                    placeholder="ex: Saber Cristão, Fintech Bold, Neo Brutalist..."
                                    value={name}
                                    onChange={e => setName(e.target.value)}
                                    disabled={loading}
                                />
                            </div>

                            {/* Multimodal Input Cards */}
                            <div className="themes-sources">
                                <div className="themes-source-card">
                                    <div className="themes-source-header">
                                        <span className="themes-source-icon">🔗</span>
                                        <span className="themes-source-title">URL de Referência</span>
                                        {urls.trim() && <span className="themes-source-active">✓</span>}
                                    </div>
                                    <input
                                        type="text"
                                        className="themes-input themes-input-sm"
                                        placeholder="https://exemplo.com"
                                        value={urls}
                                        onChange={e => setUrls(e.target.value)}
                                        disabled={loading}
                                    />
                                    <small className="themes-source-hint">CSS, fontes e cores serão extraídos automaticamente</small>
                                </div>

                                <div className="themes-source-card">
                                    <div className="themes-source-header">
                                        <span className="themes-source-icon">🖼️</span>
                                        <span className="themes-source-title">Screenshots</span>
                                        {images.length > 0 && <span className="themes-source-active">✓ {images.length}</span>}
                                    </div>
                                    <div
                                        className={`themes-dropzone-mini ${images.length >= 5 ? 'full' : ''}`}
                                        onClick={() => images.length < 5 && fileInputRef.current?.click()}
                                        onDrop={handleDrop}
                                        onDragOver={e => e.preventDefault()}
                                    >
                                        {previews.length === 0 ? (
                                            <span className="themes-dropzone-mini-text">Clique ou arraste (até 5)</span>
                                        ) : (
                                            <div className="themes-dropzone-mini-grid">
                                                {previews.map((src, i) => (
                                                    <div key={i} className="themes-thumb-mini">
                                                        <img src={src} alt={`ref-${i}`} />
                                                        <button className="themes-thumb-remove" onClick={(e) => { e.stopPropagation(); removeImage(i); }}>✕</button>
                                                    </div>
                                                ))}
                                                {images.length < 5 && (
                                                    <div className="themes-thumb-mini themes-thumb-add">+</div>
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

                                <div className="themes-source-card themes-source-card-wide">
                                    <div className="themes-source-header">
                                        <span className="themes-source-icon">📝</span>
                                        <span className="themes-source-title">Descrição do Estilo</span>
                                        {specs.trim() && <span className="themes-source-active">✓</span>}
                                    </div>
                                    <textarea
                                        className="themes-textarea"
                                        placeholder="Descreva o visual: cores, atmosfera, tipo de produto, público-alvo, referências de estilo... Quanto mais detalhes, melhor a extração."
                                        value={specs}
                                        onChange={e => setSpecs(e.target.value)}
                                        rows={3}
                                        disabled={loading}
                                    />
                                </div>
                            </div>

                            {error && <div className="themes-error">{error}</div>}

                            {/* Progress Bar */}
                            {loading && (
                                <div className="themes-progress">
                                    {STEPS.map((step, i) => (
                                        <div key={step.id} className={`themes-progress-step ${i < currentStep ? 'done' : ''} ${i === currentStep ? 'active' : ''}`}>
                                            <span className="themes-progress-icon">{i < currentStep ? '✅' : step.icon}</span>
                                            <span className="themes-progress-label">{step.label}</span>
                                        </div>
                                    ))}
                                    <div className="themes-progress-bar">
                                        <div className="themes-progress-fill" style={{ width: `${Math.max(5, (currentStep / (STEPS.length - 1)) * 100)}%` }} />
                                    </div>
                                </div>
                            )}

                            <button className="themes-generate-btn" onClick={generate} disabled={loading || !name.trim()}>
                                {loading ? (
                                    <><span className="themes-spinner" /> {STEPS[currentStep]?.label || 'Processando...'}</>
                                ) : (
                                    '⚛️ Extrair Design System'
                                )}
                            </button>
                        </div>

                        {/* Preview Panel */}
                        <div className="themes-preview-panel" ref={previewRef}>
                            {!result && !loading && (
                                <div className="themes-preview-empty">
                                    <span className="themes-preview-empty-icon">⚛️</span>
                                    <h3>Atomic Design Preview</h3>
                                    <p>Preencha ao menos o nome + uma fonte (URL, imagem ou descrição) e clique em "Extrair" para visualizar o Design System completo.</p>
                                    <div className="themes-preview-atoms">
                                        <span>Atoms</span>
                                        <span>→</span>
                                        <span>Molecules</span>
                                        <span>→</span>
                                        <span>Organisms</span>
                                        <span>→</span>
                                        <span>Templates</span>
                                    </div>
                                </div>
                            )}

                            {loading && !result && (
                                <div className="themes-preview-loading">
                                    <div className="themes-loading-orb" />
                                    <p>{STEPS[currentStep]?.label || 'Processando...'}</p>
                                    {Object.keys(stepStatus).length > 0 && (
                                        <div className="themes-step-log">
                                            {Object.entries(stepStatus).map(([key, { icon, msg }]) => (
                                                <div key={key} className="themes-step-log-item">
                                                    <span className="themes-step-icon">{icon}</span>
                                                    <span className="themes-step-msg">{msg}</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}

                            {result && !loading && (
                                <div className="themes-result">
                                    {/* Header */}
                                    <div className="themes-result-header">
                                        <div>
                                            <h2>{getTokenMeta(result).name || result.name || name}</h2>
                                            <p className="themes-result-desc">{getTokenMeta(result).description || result.description}</p>
                                            {(getTokenMeta(result).personality || result.personality) && (
                                                <div className="themes-tags">
                                                    {(getTokenMeta(result).personality || result.personality || []).map((t, i) => <span key={i} className="themes-tag">{t}</span>)}
                                                </div>
                                            )}
                                        </div>
                                        <div className="themes-result-actions">
                                            <button className="themes-btn-save" onClick={handleSave}>💾 Salvar</button>
                                            <button className="themes-btn-secondary" onClick={() => copyCSS(getCSS(result))}>
                                                {copiedCSS ? '✓ Copiado!' : '📋 CSS'}
                                            </button>
                                        </div>
                                    </div>

                                    {/* Screenshots + Visual Analysis */}
                                    {(screenshots.length > 0 || visualAnalysis) && (
                                        <div className="themes-analysis-section">
                                            {screenshots.length > 0 && (
                                                <div className="themes-screenshots">
                                                    <h4 className="themes-atom-title">📸 Screenshots Capturados</h4>
                                                    <div className="themes-screenshots-grid">
                                                        {screenshots.map((ss, idx) => (
                                                            <div key={idx} className="themes-screenshot-thumb" onClick={() => window.open(ss.dataUrl, '_blank')}>
                                                                <img src={ss.dataUrl} alt={ss.label} />
                                                                <span className="themes-screenshot-label">{ss.label} ({ss.width}×{ss.height})</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                            {visualAnalysis?.summary && (
                                                <div className="themes-design-brief">
                                                    <h4 className="themes-atom-title">🧠 Design Brief (Claude Sonnet)</h4>
                                                    <p>{visualAnalysis.summary}</p>
                                                    {visualAnalysis.personality && (
                                                        <div className="themes-tags" style={{ marginTop: '0.5rem' }}>
                                                            {visualAnalysis.personality.map((k, i) => <span key={i} className="themes-tag">{k}</span>)}
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* Quick Atoms Preview */}
                                    <div className="themes-atoms-grid">
                                        {/* Colors Swatch */}
                                        <div className="themes-atom-section">
                                            <h4 className="themes-atom-title">🎨 Colors</h4>
                                            <div className="themes-colors-row">
                                                {Object.entries(getTokenColors(result)).map(([key, hex]) => {
                                                    if (typeof hex !== 'string' || hex.startsWith('linear')) return null;
                                                    return (
                                                        <div key={key} className="themes-color-dot" title={`${key}: ${hex}`}
                                                            onClick={() => { navigator.clipboard.writeText(hex); }}
                                                            style={{ background: hex }}
                                                        />
                                                    );
                                                })}
                                            </div>
                                        </div>

                                        {/* Typography */}
                                        {(result.atoms?.typography || result.typography) && (
                                            <div className="themes-atom-section">
                                                <h4 className="themes-atom-title">📝 Typography</h4>
                                                <div className="themes-type-preview">
                                                    <span className="themes-type-heading"
                                                        style={{ fontFamily: (result.atoms?.typography || result.typography)?.fontHeading }}>
                                                        {(result.atoms?.typography || result.typography)?.fontHeading}
                                                    </span>
                                                    <span className="themes-type-body"
                                                        style={{ fontFamily: (result.atoms?.typography || result.typography)?.fontBody }}>
                                                        {(result.atoms?.typography || result.typography)?.fontBody}
                                                    </span>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Full Preview Iframe */}
                                    {previewHtml && (
                                        <div className="themes-section">
                                            <h3 className="themes-section-title">👁️ Design System Showcase</h3>
                                            <div className="themes-iframe-wrap themes-iframe-wrap-large">
                                                <IframePreview html={previewHtml} />
                                            </div>
                                        </div>
                                    )}

                                    {/* Raw JSON (collapsible) */}
                                    {getCSS(result) && (
                                        <details className="themes-details">
                                            <summary className="themes-details-summary">💻 CSS Variables</summary>
                                            <div className="themes-code-block">
                                                <div className="themes-code-header">
                                                    <span>:root {'{}'}</span>
                                                    <button onClick={() => copyCSS(getCSS(result))}>
                                                        {copiedCSS ? '✓ Copiado' : 'Copiar'}
                                                    </button>
                                                </div>
                                                <pre className="themes-code-pre"><code>{getCSS(result)}</code></pre>
                                            </div>
                                        </details>
                                    )}

                                    <details className="themes-details">
                                        <summary className="themes-details-summary">🧬 JSON Completo (Atomic Design)</summary>
                                        <div className="themes-code-block">
                                            <pre className="themes-code-pre"><code>{JSON.stringify(result, null, 2)}</code></pre>
                                        </div>
                                    </details>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {tab === 'gallery' && (
                <div className="themes-gallery">
                    {galleryView ? (
                        <div className="themes-gallery-detail">
                            <button className="themes-back-btn" onClick={() => setGalleryView(null)}>
                                ← Voltar à galeria
                            </button>
                            <div className="themes-result">
                                <div className="themes-result-header">
                                    <div>
                                        <h2>{galleryView.name}</h2>
                                        <p className="themes-result-desc">{galleryView.description}</p>
                                        {getTokenMeta(galleryView.tokens)?.personality && (
                                            <div className="themes-tags">
                                                {(getTokenMeta(galleryView.tokens).personality || []).map((t, i) =>
                                                    <span key={i} className="themes-tag">{t}</span>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                    <div className="themes-result-actions">
                                        <button className="themes-btn-secondary" onClick={() => copyCSS(getCSS(galleryView.tokens))}>
                                            {copiedCSS ? '✓ Copiado!' : '📋 CSS'}
                                        </button>
                                        <button className="themes-btn-danger" onClick={() => { handleDelete(galleryView.id); setGalleryView(null); }}>
                                            🗑️ Deletar
                                        </button>
                                    </div>
                                </div>
                                {/* Color dots */}
                                <div className="themes-atoms-grid">
                                    <div className="themes-atom-section">
                                        <h4 className="themes-atom-title">🎨 Colors</h4>
                                        <div className="themes-colors-row">
                                            {Object.entries(getTokenColors(galleryView.tokens)).map(([key, hex]) => {
                                                if (typeof hex !== 'string' || hex.startsWith('linear')) return null;
                                                return (
                                                    <div key={key} className="themes-color-dot" title={`${key}: ${hex}`}
                                                        onClick={() => navigator.clipboard.writeText(hex)}
                                                        style={{ background: hex }}
                                                    />
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>
                                {/* Saved Screenshots + Design Brief */}
                                {(galleryView.tokens?._screenshots?.length > 0 || galleryView.tokens?._designSummary) && (
                                    <div className="themes-analysis-section">
                                        {galleryView.tokens._screenshots?.length > 0 && (
                                            <div className="themes-screenshots">
                                                <h4 className="themes-atom-title">📸 Screenshots</h4>
                                                <div className="themes-screenshots-grid">
                                                    {galleryView.tokens._screenshots.map((dataUrl, idx) => (
                                                        <div key={idx} className="themes-screenshot-thumb" onClick={() => window.open(dataUrl, '_blank')}>
                                                            <img src={dataUrl} alt={`Screenshot ${idx + 1}`} />
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                        {galleryView.tokens._designSummary && (
                                            <div className="themes-design-brief">
                                                <h4 className="themes-atom-title">🧠 Design Brief</h4>
                                                <p>{galleryView.tokens._designSummary}</p>
                                            </div>
                                        )}
                                    </div>
                                )}
                                {/* Preview */}
                                {galleryView.previewHtml && (
                                    <div className="themes-section">
                                        <h3 className="themes-section-title">👁️ Design System Showcase</h3>
                                        <div className="themes-iframe-wrap themes-iframe-wrap-large">
                                            <IframePreview html={galleryView.previewHtml} />
                                        </div>
                                    </div>
                                )}
                                {getCSS(galleryView.tokens) && (
                                    <details className="themes-details">
                                        <summary className="themes-details-summary">💻 CSS Variables</summary>
                                        <div className="themes-code-block">
                                            <pre className="themes-code-pre"><code>{getCSS(galleryView.tokens)}</code></pre>
                                        </div>
                                    </details>
                                )}
                                <details className="themes-details">
                                    <summary className="themes-details-summary">🧬 JSON Completo</summary>
                                    <div className="themes-code-block">
                                        <pre className="themes-code-pre"><code>{JSON.stringify(galleryView.tokens, null, 2)}</code></pre>
                                    </div>
                                </details>
                            </div>
                        </div>
                    ) : (
                        <>
                            {savedThemes.length === 0 ? (
                                <div className="themes-gallery-empty">
                                    <span>📭</span>
                                    <h3>Nenhum tema salvo</h3>
                                    <p>Crie seu primeiro Design System na aba "Extrair DS".</p>
                                </div>
                            ) : (
                                <div className="themes-gallery-grid">
                                    {savedThemes.map(theme => (
                                        <div key={theme.id} className="themes-gallery-card" onClick={() => navigate(`/themes/${theme.id}`)}>
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
                                                <button className="themes-btn-icon" title="Ver Design System" onClick={(e) => {
                                                    e.stopPropagation();
                                                    navigate(`/themes/${theme.id}`);
                                                }}>⚛️</button>
                                                <button className="themes-btn-icon" title="Copiar CSS" onClick={(e) => {
                                                    e.stopPropagation();
                                                    copyCSS(getCSS(theme.tokens));
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
                        </>
                    )}
                </div>
            )}
            {tab === 'local' && (
                <div className="themes-gallery">
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1.5rem', gap: '1rem' }}>
                        <div>
                            <h3 style={{ margin: '0 0 0.25rem', color: '#fff', fontSize: '1rem' }}>Páginas para Clonar</h3>
                            <p style={{ margin: 0, color: '#888', fontSize: '0.8rem' }}>
                                Coloque arquivos <code style={{ background: '#1a1a1a', padding: '1px 4px', borderRadius: '3px' }}>.html</code> na pasta{' '}
                                <code style={{ background: '#1a1a1a', padding: '1px 4px', borderRadius: '3px' }}>pages-to-clone/</code> do projeto
                            </p>
                        </div>
                        <button
                            className="themes-btn-secondary"
                            onClick={() => listLocalPages().then(setLocalPages)}
                            style={{ flexShrink: 0 }}
                        >
                            ↺ Atualizar
                        </button>
                    </div>

                    {/* Campo de nome opcional */}
                    <div className="themes-field" style={{ marginBottom: '1.25rem' }}>
                        <label className="themes-label">Nome do Design System (opcional)</label>
                        <input
                            type="text"
                            className="themes-input"
                            placeholder="Deixe em branco para usar o nome do arquivo"
                            value={name}
                            onChange={e => setName(e.target.value)}
                            disabled={loading}
                        />
                    </div>

                    {error && <div className="themes-error" style={{ marginBottom: '1rem' }}>{error}</div>}

                    {localPages.length === 0 ? (
                        <div className="themes-gallery-empty">
                            <span>📂</span>
                            <h3>Nenhum arquivo encontrado</h3>
                            <p>
                                Salve páginas <code>.html</code> na pasta{' '}
                                <strong>pages-to-clone/</strong> e clique em "Atualizar".<br />
                                <small style={{ color: '#666' }}>Dica: use "Salvar como → Página Web Completa" no browser.</small>
                            </p>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            {localPages.map(file => (
                                <div key={file.name} style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.75rem',
                                    padding: '0.75rem 1rem',
                                    background: '#111',
                                    border: '1px solid #2a2a2a',
                                    borderRadius: '8px',
                                }}>
                                    <span style={{ fontSize: '1.1rem' }}>📄</span>
                                    <span style={{ flex: 1, color: '#e0e0e0', fontSize: '0.875rem', fontFamily: 'monospace' }}>{file.name}</span>
                                    <span style={{ color: '#555', fontSize: '0.75rem' }}>{(file.size / 1024).toFixed(0)} KB</span>
                                    <span style={{ color: '#555', fontSize: '0.75rem' }}>
                                        {new Date(file.modified).toLocaleDateString('pt-BR')}
                                    </span>
                                    <button
                                        className="themes-generate-btn"
                                        style={{ padding: '0.4rem 0.9rem', fontSize: '0.8rem', minWidth: 'auto' }}
                                        onClick={() => generateFromLocal(file.name)}
                                        disabled={loading}
                                    >
                                        {loading ? '⏳' : '⚛️ Extrair'}
                                    </button>
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
