import { useState, useEffect, useRef } from 'react';
import { fetchThemes } from '../services/themesService';
import { LLM_MODELS } from '../services/claude';
import { generateFullLandingPage, regenerateLandingPageSection, saveLandingPage, exportLandingPageAsZip, exportLandingPageAsHtml } from '../services/landingPageBuilderService';
import PreviewFrame from '../components/LandingPage/PreviewFrame';
import BuilderCommandPalette from '../components/LandingPage/BuilderCommandPalette';
import BuilderProgress from '../components/LandingPage/BuilderProgress';
import SectionVariationPicker from '../components/LandingPage/SectionVariationPicker';

export default function LandingPageBuilder() {
    const [productDescription, setProductDescription] = useState('');
    const [themes, setThemes] = useState([]);
    const [selectedThemeId, setSelectedThemeId] = useState('');
    const [themeDropdownOpen, setThemeDropdownOpen] = useState(false);

    // LLM Selection
    const [selectedModel, setSelectedModel] = useState(LLM_MODELS[0].id);
    const [llmDropdownOpen, setLlmDropdownOpen] = useState(false);

    // UI State
    const [generationState, setGenerationState] = useState({ isGenerating: false, step: '', message: '', percentage: 0 });
    const [sections, setSections] = useState([]);
    const [viewMode, setViewMode] = useState('desktop');
    const [selectedSectionId, setSelectedSectionId] = useState(null);
    const [sectionVariations, setSectionVariations] = useState([]);
    const [showVariationPicker, setShowVariationPicker] = useState(false);
    const [saveMenuOpen, setSaveMenuOpen] = useState(false);

    const dropdownRef = useRef(null);
    const llmDropdownRef = useRef(null);
    const saveMenuRef = useRef(null);

    useEffect(() => {
        loadThemes();
        const handleClickOutside = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setThemeDropdownOpen(false);
            if (llmDropdownRef.current && !llmDropdownRef.current.contains(e.target)) setLlmDropdownOpen(false);
            if (saveMenuRef.current && !saveMenuRef.current.contains(e.target)) setSaveMenuOpen(false);
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const loadThemes = async () => {
        try {
            const data = await fetchThemes();
            setThemes(data);
            if (data.length > 0) setSelectedThemeId(data[0].id);
        } catch (error) { console.error("Failed to load themes", error); }
    };

    const handleGenerate = async () => {
        if (!productDescription.trim()) return alert("Descreva o seu produto primeiro.");
        const theme = themes.find(t => t.id === selectedThemeId);
        if (!theme) return alert("Selecione um design system base.");

        setGenerationState({ isGenerating: true, step: 'start', message: 'Iniciando arquitetura...', percentage: 0 });
        setSelectedSectionId(null);
        setSectionVariations([]);
        setShowVariationPicker(false);

        try {
            const generatedSections = await generateFullLandingPage(
                productDescription, theme.tokens,
                (statusObj) => setGenerationState(prev => ({ ...prev, ...statusObj })),
                selectedModel
            );
            setSections(generatedSections);
            setTimeout(() => setGenerationState({ isGenerating: false, step: '', message: '', percentage: 0 }), 1500);
        } catch (error) {
            console.error("Generation error:", error);
            alert("Erro ao gerar: " + error.message);
            setGenerationState({ isGenerating: false, step: '', message: '', percentage: 0 });
        }
    };

    const handleRegenerateSection = async (sectionId, instructions) => {
        const theme = themes.find(t => t.id === selectedThemeId);
        const sectionToUpdate = sections.find(s => s.id === sectionId);
        if (!sectionToUpdate || !theme) return;

        setGenerationState({ isGenerating: true, step: 'refine', message: `Gerando 3 variações para ${sectionId}...`, percentage: 50 });
        setSectionVariations([]);

        try {
            const result = await regenerateLandingPageSection(sectionId, sectionToUpdate.html, theme.tokens, instructions);
            if (result.variations && result.variations.length > 0) {
                setSectionVariations(result.variations);
                setShowVariationPicker(true);
            }
        } catch (error) {
            console.error("Regeneration error:", error);
            alert("Erro ao regerar sessão: " + error.message);
        } finally {
            setGenerationState({ isGenerating: false, step: '', message: '', percentage: 0 });
        }
    };

    const handlePickVariation = (sectionId, newHtml) => {
        setSections(prev => prev.map(s => s.id === sectionId ? { ...s, html: newHtml } : s));
        setSectionVariations([]);
        setShowVariationPicker(false);
        setSelectedSectionId(null);
    };

    const handleSaveToSupabase = async () => {
        if (sections.length === 0) return alert("Gere a página primeiro.");
        try {
            await saveLandingPage(productDescription, selectedThemeId, sections);
            alert("✅ Landing Page salva com sucesso no Supabase!");
        } catch (err) { alert("Erro ao salvar: " + err.message); }
        setSaveMenuOpen(false);
    };

    const handleDownloadZip = async () => {
        if (sections.length === 0) return alert("Gere a página primeiro.");
        await exportLandingPageAsZip(sections, productDescription);
        setSaveMenuOpen(false);
    };

    const handleDownloadHtml = () => {
        if (sections.length === 0) return alert("Gere a página primeiro.");
        exportLandingPageAsHtml(sections, productDescription);
        setSaveMenuOpen(false);
    };

    const fullHtml = `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Preview</title><link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=DM+Serif+Display&display=swap" rel="stylesheet"><style>body{margin:0;padding:0;background:#0C0C0E;overflow-x:hidden}.lp-section-wrapper{position:relative}.lp-section-wrapper::after{content:'';position:absolute;top:0;left:0;right:0;bottom:0;border:2px dashed #C9A962;pointer-events:none;z-index:9998;opacity:0;transition:opacity .2s}.lp-section-wrapper:hover::after{opacity:1}.lp-section-trigger{position:absolute;top:12px;right:12px;z-index:9999;background:rgba(12,12,14,.85);color:#C9A962;border:1px solid #C9A962;padding:10px 20px;border-radius:8px;font-family:'DM Sans',sans-serif;font-size:13px;font-weight:600;cursor:pointer;opacity:0;transform:translateY(-5px);transition:all .2s;backdrop-filter:blur(8px);box-shadow:0 4px 16px rgba(0,0,0,.5)}.lp-section-wrapper:hover .lp-section-trigger{opacity:1;transform:translateY(0)}.lp-section-trigger:hover{background:#C9A962;color:#0C0C0E}</style></head><body>${sections.map(s => `<div class="lp-section-wrapper" data-section-id="${s.id}"><button class="lp-section-trigger" onclick="window.parent.postMessage({type:'SELECT_SECTION',id:'${s.id}'},'*')">✨ Gerar 3 Variações</button>${s.html}</div>`).join('\n')}</body></html>`;

    const selectedThemeName = themes.find(t => t.id === selectedThemeId)?.name || 'Selecione um Tema';
    const selectedModelObj = LLM_MODELS.find(m => m.id === selectedModel) || LLM_MODELS[0];

    return (
        <div className="page-container" style={{ position: 'relative', display: 'flex', flexDirection: 'column', height: '100vh', padding: 0, backgroundColor: 'var(--bg)', color: 'var(--text)', overflow: 'hidden' }}>

            <BuilderProgress state={generationState} />

            {showVariationPicker && sectionVariations.length > 0 && (
                <SectionVariationPicker
                    variations={sectionVariations}
                    sectionId={selectedSectionId}
                    onPick={handlePickVariation}
                    onClose={() => { setShowVariationPicker(false); setSectionVariations([]); }}
                />
            )}

            {/* TOP BAR */}
            <div style={{ padding: '0.75rem 1.5rem', borderBottom: '1px solid var(--border)', background: 'var(--surface)', display: 'flex', alignItems: 'center', gap: '1rem', zIndex: 10 }}>
                {/* Logo */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
                    <div style={{ width: '10px', height: '10px', background: 'var(--accent)', borderRadius: '50%', boxShadow: '0 0 8px var(--accent)' }}></div>
                    <h1 style={{ margin: 0, fontFamily: 'var(--font-heading)', fontSize: '18px' }}>Studio<span style={{ color: 'var(--accent)' }}>.</span></h1>
                </div>

                {/* LLM Model Selector */}
                <div ref={llmDropdownRef} style={{ position: 'relative', minWidth: '180px' }}>
                    <div onClick={() => setLlmDropdownOpen(!llmDropdownOpen)} style={{
                        background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)',
                        padding: '0.5rem 0.8rem', fontSize: '12px', borderRadius: 'var(--radius-md)',
                        cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '6px'
                    }}>
                        <span>🤖 {selectedModelObj.icon} {selectedModelObj.name}</span>
                        <span style={{ fontSize: '8px', color: 'var(--text-muted)', transform: llmDropdownOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>▼</span>
                    </div>
                    {llmDropdownOpen && (
                        <div style={{
                            position: 'absolute', top: '100%', left: 0, right: 0, marginTop: '4px',
                            background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)',
                            boxShadow: '0 10px 30px rgba(0,0,0,0.6)', zIndex: 100, overflow: 'hidden'
                        }}>
                            {LLM_MODELS.map(m => (
                                <div key={m.id} onClick={() => { setSelectedModel(m.id); setLlmDropdownOpen(false); }}
                                    style={{
                                        padding: '0.5rem 0.8rem', cursor: 'pointer', fontSize: '12px',
                                        background: selectedModel === m.id ? 'var(--bg)' : 'transparent',
                                        borderLeft: selectedModel === m.id ? '3px solid var(--accent)' : '3px solid transparent',
                                        color: selectedModel === m.id ? 'var(--accent)' : 'var(--text)',
                                        transition: 'all 0.2s'
                                    }}
                                    onMouseEnter={e => { if (selectedModel !== m.id) e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; }}
                                    onMouseLeave={e => { if (selectedModel !== m.id) e.currentTarget.style.background = 'transparent'; }}
                                >{m.icon} {m.name}</div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Theme Dropdown */}
                <div ref={dropdownRef} style={{ position: 'relative', minWidth: '180px' }}>
                    <div onClick={() => setThemeDropdownOpen(!themeDropdownOpen)} style={{
                        background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)',
                        padding: '0.5rem 0.8rem', fontSize: '12px', borderRadius: 'var(--radius-md)',
                        cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                    }}>
                        <span>🎨 {selectedThemeName}</span>
                        <span style={{ fontSize: '8px', color: 'var(--text-muted)', transform: themeDropdownOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>▼</span>
                    </div>
                    {themeDropdownOpen && (
                        <div style={{
                            position: 'absolute', top: '100%', left: 0, right: 0, marginTop: '4px',
                            background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)',
                            boxShadow: '0 10px 30px rgba(0,0,0,0.5)', zIndex: 100, overflow: 'hidden'
                        }}>
                            {themes.map(t => (
                                <div key={t.id} onClick={() => { setSelectedThemeId(t.id); setThemeDropdownOpen(false); }}
                                    style={{
                                        padding: '0.5rem 0.8rem', cursor: 'pointer', fontSize: '12px',
                                        background: selectedThemeId === t.id ? 'var(--bg)' : 'transparent',
                                        borderLeft: selectedThemeId === t.id ? '3px solid var(--accent)' : '3px solid transparent',
                                        color: selectedThemeId === t.id ? 'var(--accent)' : 'var(--text)',
                                    }}
                                >{t.name}</div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Product Input */}
                <input
                    style={{
                        flex: 1, background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)',
                        padding: '0.5rem 0.8rem', fontFamily: 'var(--font-body)', fontSize: '12px',
                        borderRadius: 'var(--radius-md)', outline: 'none', transition: 'border-color 0.2s'
                    }}
                    onFocus={e => e.target.style.borderColor = 'var(--accent)'}
                    onBlur={e => e.target.style.borderColor = 'var(--border)'}
                    placeholder="Descreva seu Produto (ex: Ebook sobre Anjos, Querubins e Arcanjos na Bíblia)..."
                    value={productDescription}
                    onChange={e => setProductDescription(e.target.value)}
                />

                {/* Generate Button */}
                <button
                    style={{
                        background: 'var(--accent)', color: '#0C0C0E', border: 'none',
                        padding: '0.5rem 1.2rem', fontFamily: 'var(--font-body)', fontSize: '12px', fontWeight: '700',
                        borderRadius: 'var(--radius-md)', cursor: 'pointer', flexShrink: 0,
                        transition: 'all 0.2s', boxShadow: '0 4px 12px rgba(201, 169, 98, 0.2)'
                    }}
                    onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-1px)'}
                    onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
                    onClick={handleGenerate}
                >Construir LP</button>

                {/* Save/Export Menu */}
                <div ref={saveMenuRef} style={{ position: 'relative', flexShrink: 0 }}>
                    <button onClick={() => setSaveMenuOpen(!saveMenuOpen)} style={{
                        background: 'transparent', color: 'var(--text)', border: '1px solid var(--border)',
                        padding: '0.5rem 0.8rem', fontFamily: 'var(--font-body)', fontSize: '12px', fontWeight: '600',
                        borderRadius: 'var(--radius-md)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px',
                        transition: 'all 0.2s'
                    }}
                        onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.color = 'var(--accent)'; }}
                        onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text)'; }}
                    >
                        💾 Exportar
                    </button>
                    {saveMenuOpen && (
                        <div style={{
                            position: 'absolute', top: '100%', right: 0, marginTop: '4px', minWidth: '220px',
                            background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)',
                            boxShadow: '0 10px 30px rgba(0,0,0,0.5)', zIndex: 100, overflow: 'hidden'
                        }}>
                            <div onClick={handleSaveToSupabase} style={{ padding: '0.7rem 1rem', cursor: 'pointer', fontSize: '12px', color: 'var(--text)', display: 'flex', alignItems: 'center', gap: '8px', transition: 'background 0.2s' }}
                                onMouseEnter={e => e.currentTarget.style.background = 'var(--bg)'}
                                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                            >☁️ Salvar no Supabase</div>
                            <div onClick={handleDownloadZip} style={{ padding: '0.7rem 1rem', cursor: 'pointer', fontSize: '12px', color: 'var(--text)', display: 'flex', alignItems: 'center', gap: '8px', borderTop: '1px solid var(--border)', transition: 'background 0.2s' }}
                                onMouseEnter={e => e.currentTarget.style.background = 'var(--bg)'}
                                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                            >📦 Download ZIP (HTML+CSS+JS)</div>
                            <div onClick={handleDownloadHtml} style={{ padding: '0.7rem 1rem', cursor: 'pointer', fontSize: '12px', color: 'var(--text)', display: 'flex', alignItems: 'center', gap: '8px', borderTop: '1px solid var(--border)', transition: 'background 0.2s' }}
                                onMouseEnter={e => e.currentTarget.style.background = 'var(--bg)'}
                                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                            >📄 Download HTML (arquivo único)</div>
                        </div>
                    )}
                </div>
            </div>

            {/* MAIN WORKSPACE */}
            <div style={{ position: 'relative', flex: 1, display: 'flex', flexDirection: 'column', background: 'var(--bg)', overflow: 'hidden' }}>
                {/* Viewport Toolbar */}
                <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', padding: '0.3rem', background: '#08080A', borderBottom: '1px solid #1a1a1f', zIndex: 2 }}>
                    {['desktop', 'mobile'].map(mode => (
                        <button key={mode} style={{
                            background: viewMode === mode ? '#131316' : 'transparent',
                            color: viewMode === mode ? 'var(--accent)' : 'var(--text-muted)',
                            border: '1px solid', borderColor: viewMode === mode ? 'var(--accent)' : 'transparent',
                            borderRadius: '4px', padding: '2px 12px', fontSize: '11px',
                            fontFamily: 'var(--font-body)', cursor: 'pointer', transition: 'all 0.2s'
                        }} onClick={() => setViewMode(mode)}
                        >{mode === 'desktop' ? '💻 Desktop' : '📱 Mobile'}</button>
                    ))}
                    {sections.length > 0 && (
                        <span style={{ marginLeft: '1rem', fontSize: '11px', color: 'var(--text-muted)' }}>
                            {sections.length} seções • {selectedModelObj.name}
                        </span>
                    )}
                </div>

                {/* IFrame Preview */}
                <div style={{ flex: 1, overflow: 'hidden', display: 'flex', justifyContent: 'center', padding: viewMode === 'desktop' ? '0' : '1.5rem 0' }}>
                    <PreviewFrame
                        html={sections.length > 0 ? fullHtml : ''}
                        viewMode={viewMode}
                        onSelectSection={(id) => { setSelectedSectionId(id); setSectionVariations([]); setShowVariationPicker(false); }}
                    />
                </div>

                {/* Command Palette */}
                <BuilderCommandPalette
                    selectedSectionId={selectedSectionId}
                    sections={sections}
                    onRegenerate={handleRegenerateSection}
                    isGenerating={generationState.isGenerating}
                    onClose={() => { setSelectedSectionId(null); setSectionVariations([]); setShowVariationPicker(false); }}
                    variations={[]}
                    onPickVariation={handlePickVariation}
                />
            </div>
        </div>
    );
}
