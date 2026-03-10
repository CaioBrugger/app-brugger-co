import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchThemes } from '../services/themesService';
import { LLM_MODELS } from '../services/claude';
import { generateFullLandingPage, regenerateLandingPageSection, exportLandingPageAsZip, exportLandingPageAsHtml } from '../services/landingPageBuilderService';
import { saveLandingPage } from '../services/landingPagesService';
import { fetchTemplates, fetchTemplate, saveTemplate, deleteTemplate } from '../services/lpTemplatesService';
import { fetchComponents } from '../services/lpComponentsService';
import PreviewFrame from '../components/LandingPage/PreviewFrame';
import BuilderCommandPalette from '../components/LandingPage/BuilderCommandPalette';
import BuilderProgress from '../components/LandingPage/BuilderProgress';
import SectionVariationPicker from '../components/LandingPage/SectionVariationPicker';

const COMP_PREVIEW = (html) => `<!DOCTYPE html><html><head><meta charset="UTF-8">
<link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=DM+Serif+Display&display=swap" rel="stylesheet">
<style>*{box-sizing:border-box;margin:0;padding:0}:root{--accent:#C9A962;--bg:#0C0C0E;--surface:#131316;--text:#F5F0E8;--text-muted:rgba(245,240,232,0.5);--border:rgba(245,240,232,0.08);--font-body:'DM Sans',sans-serif;--font-heading:'DM Serif Display',serif}body{background:var(--bg);color:var(--text);font-family:var(--font-body)}</style>
</head><body>${html}</body></html>`;

export default function LandingPageBuilder() {
    const navigate = useNavigate();
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
    const [variationTargetId, setVariationTargetId] = useState(null);
    const [saveMenuOpen, setSaveMenuOpen] = useState(false);

    // Save state
    const [saveModalOpen, setSaveModalOpen] = useState(false);
    const [saveName, setSaveName] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [saveToast, setSaveToast] = useState(null); // { message, id }
    const [saveAsTemplate, setSaveAsTemplate] = useState(false);

    // Templates modal
    const [showTemplatesModal, setShowTemplatesModal] = useState(false);
    const [templates, setTemplates] = useState([]);
    const [templatesLoading, setTemplatesLoading] = useState(false);

    // Components modal
    const [showComponentsModal, setShowComponentsModal] = useState(false);
    const [components, setComponents] = useState([]);
    const [componentsLoading, setComponentsLoading] = useState(false);
    const [compCategoryFilter, setCompCategoryFilter] = useState('all');

    const dropdownRef = useRef(null);
    const llmDropdownRef = useRef(null);
    const saveMenuRef = useRef(null);
    const saveNameRef = useRef(null);
    const generationCounterRef = useRef(0);

    useEffect(() => {
        loadThemes();
        // Load LP from Gallery if requested
        const raw = sessionStorage.getItem('lp_load');
        if (raw) {
            try {
                const { name, description, themeId, sections: loadedSections } = JSON.parse(raw);
                if (description) setProductDescription(description);
                if (themeId) setSelectedThemeId(themeId);
                if (loadedSections?.length) setSections(loadedSections);
            } catch (_) { }
            sessionStorage.removeItem('lp_load');
        }
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

    const openTemplatesModal = async () => {
        setShowTemplatesModal(true);
        setTemplatesLoading(true);
        try { setTemplates(await fetchTemplates()); } catch (e) { console.error(e); }
        finally { setTemplatesLoading(false); }
    };

    const handleLoadTemplate = async (templateId) => {
        try {
            const tmpl = await fetchTemplate(templateId);
            if (tmpl.sections_json?.length) {
                setSections(tmpl.sections_json);
                if (tmpl.theme_id) setSelectedThemeId(tmpl.theme_id);
            }
            setShowTemplatesModal(false);
        } catch (e) { alert('Erro ao carregar template: ' + e.message); }
    };

    const handleDeleteTemplate = async (id) => {
        if (!confirm('Deletar este template?')) return;
        await deleteTemplate(id);
        setTemplates(prev => prev.filter(t => t.id !== id));
    };

    const openComponentsModal = async () => {
        setShowComponentsModal(true);
        setComponentsLoading(true);
        setCompCategoryFilter('all');
        try { setComponents(await fetchComponents()); } catch (e) { console.error(e); }
        finally { setComponentsLoading(false); }
    };

    const handleInsertComponent = (comp) => {
        const newSection = {
            id: `comp-${comp.id}-${Date.now()}`,
            name: comp.name,
            html: comp.html,
            order: sections.length,
        };
        setSections(prev => [...prev, newSection]);
        setShowComponentsModal(false);
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

        // Incrementa o token de geração para invalidar respostas anteriores em andamento
        generationCounterRef.current += 1;
        const thisGeneration = generationCounterRef.current;

        setVariationTargetId(sectionId);
        setShowVariationPicker(false);
        setSectionVariations([]);
        setGenerationState({ isGenerating: true, step: 'refine', message: `Gerando 3 variações para ${sectionId}...`, percentage: 50 });

        try {
            const result = await regenerateLandingPageSection(sectionId, sectionToUpdate.html, theme.tokens, instructions);
            // Descarta resultado se uma geração mais nova foi iniciada
            if (thisGeneration !== generationCounterRef.current) return;
            if (result.variations && result.variations.length > 0) {
                setSectionVariations(result.variations);
                setShowVariationPicker(true);
            }
        } catch (error) {
            if (thisGeneration !== generationCounterRef.current) return;
            console.error("Regeneration error:", error);
            alert("Erro ao regerar seção: " + error.message);
        } finally {
            if (thisGeneration === generationCounterRef.current) {
                setGenerationState({ isGenerating: false, step: '', message: '', percentage: 0 });
            }
        }
    };

    const handlePickVariation = (sectionId, newHtml) => {
        setSections(prev => prev.map(s => s.id === sectionId ? { ...s, html: newHtml } : s));
        setSectionVariations([]);
        setShowVariationPicker(false);
        setSelectedSectionId(null);
        setVariationTargetId(null);
    };

    const openSaveModal = () => {
        if (sections.length === 0) return alert("Gere a página primeiro.");
        setSaveName(productDescription.substring(0, 70) || 'Minha Landing Page');
        setSaveModalOpen(true);
        setTimeout(() => saveNameRef.current?.focus(), 80);
    };

    const handleConfirmSave = async () => {
        if (!saveName.trim()) return;
        setIsSaving(true);
        try {
            const saved = await saveLandingPage({
                name: saveName.trim(),
                description: productDescription,
                themeId: selectedThemeId,
                modelUsed: selectedModel,
                sections,
            });
            if (saveAsTemplate) {
                await saveTemplate({
                    name: saveName.trim(),
                    description: productDescription,
                    sections,
                    themeId: selectedThemeId,
                });
            }
            setSaveModalOpen(false);
            setSaveAsTemplate(false);
            setSaveToast({ message: saveAsTemplate ? '✅ LP salva + Template criado!' : '✅ LP salva na Galeria!', id: saved.id });
            setTimeout(() => setSaveToast(null), 5000);
        } catch (err) {
            alert("Erro ao salvar: " + err.message);
        } finally {
            setIsSaving(false);
        }
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

            {/* BuilderProgress apenas para geração completa, não para variações */}
            <BuilderProgress state={generationState.step === 'refine' ? { isGenerating: false } : generationState} />

            {showVariationPicker && sectionVariations.length > 0 && (
                <SectionVariationPicker
                    variations={sectionVariations}
                    sectionId={variationTargetId}
                    themeTokens={themes.find(t => t.id === selectedThemeId)?.tokens}
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

                {/* Templates Button */}
                <button
                    onClick={openTemplatesModal}
                    style={{
                        background: 'var(--bg)', color: 'var(--text-muted)', border: '1px solid var(--border)',
                        padding: '0.5rem 0.8rem', fontFamily: 'var(--font-body)', fontSize: '12px', fontWeight: '600',
                        borderRadius: 'var(--radius-md)', cursor: 'pointer', flexShrink: 0,
                        display: 'flex', alignItems: 'center', gap: '5px', transition: 'all 0.2s',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.color = 'var(--accent)'; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-muted)'; }}
                >📁 Templates</button>

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

                {/* Insert Component Button */}
                {sections.length > 0 && (
                    <button
                        onClick={openComponentsModal}
                        style={{
                            background: 'var(--bg)', color: 'var(--text-muted)', border: '1px solid var(--border)',
                            padding: '0.5rem 0.8rem', fontFamily: 'var(--font-body)', fontSize: '12px', fontWeight: '600',
                            borderRadius: 'var(--radius-md)', cursor: 'pointer', flexShrink: 0,
                            display: 'flex', alignItems: 'center', gap: '5px', transition: 'all 0.2s',
                        }}
                        onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.color = 'var(--accent)'; }}
                        onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-muted)'; }}
                    >⊞ Componentes</button>
                )}

                {/* Save Button */}
                {sections.length > 0 && (
                    <button
                        onClick={openSaveModal}
                        style={{
                            background: 'rgba(201,169,98,0.1)', color: 'var(--accent)',
                            border: '1px solid rgba(201,169,98,0.3)',
                            padding: '0.5rem 0.9rem', fontFamily: 'var(--font-body)', fontSize: '12px', fontWeight: '600',
                            borderRadius: 'var(--radius-md)', cursor: 'pointer', flexShrink: 0,
                            transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: '5px'
                        }}
                        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(201,169,98,0.18)'; e.currentTarget.style.borderColor = 'rgba(201,169,98,0.5)'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'rgba(201,169,98,0.1)'; e.currentTarget.style.borderColor = 'rgba(201,169,98,0.3)'; }}
                    >☁ Salvar LP</button>
                )}

                {/* Download Menu */}
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
                        ↓ Exportar
                    </button>
                    {saveMenuOpen && (
                        <div style={{
                            position: 'absolute', top: '100%', right: 0, marginTop: '4px', minWidth: '220px',
                            background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)',
                            boxShadow: '0 10px 30px rgba(0,0,0,0.5)', zIndex: 100, overflow: 'hidden'
                        }}>
                            <div onClick={handleDownloadZip} style={{ padding: '0.7rem 1rem', cursor: 'pointer', fontSize: '12px', color: 'var(--text)', display: 'flex', alignItems: 'center', gap: '8px', transition: 'background 0.2s' }}
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
                        onSelectSection={(id) => {
                            setSelectedSectionId(id);
                            handleRegenerateSection(id, '');
                        }}
                    />
                </div>

                {/* Command Palette */}
                <BuilderCommandPalette
                    selectedSectionId={selectedSectionId}
                    sections={sections}
                    onRegenerate={handleRegenerateSection}
                    isGenerating={generationState.isGenerating}
                    onClose={() => { setSelectedSectionId(null); setSectionVariations([]); setShowVariationPicker(false); setVariationTargetId(null); }}
                />
            </div>

            {/* ── Save Modal ── */}
            {saveModalOpen && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(10px)', zIndex: 99998, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ background: '#131316', border: '1px solid rgba(201,169,98,0.2)', borderRadius: '10px', padding: '2rem', width: '440px', fontFamily: 'var(--font-body)', boxShadow: '0 32px 64px rgba(0,0,0,0.7)' }}>
                        <h3 style={{ margin: '0 0 0.375rem', color: '#F5F0E8', fontSize: '16px', fontFamily: 'var(--font-heading)', fontWeight: 400 }}>Salvar Landing Page</h3>
                        <p style={{ margin: '0 0 1.25rem', color: 'rgba(245,240,232,0.45)', fontSize: '12px' }}>Ela ficará disponível na Galeria de LPs.</p>
                        <label style={{ display: 'block', color: 'rgba(245,240,232,0.6)', fontSize: '11px', fontWeight: 600, marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Nome da LP</label>
                        <input
                            ref={saveNameRef}
                            style={{ width: '100%', background: 'var(--bg)', border: '1px solid rgba(201,169,98,0.25)', color: '#F5F0E8', padding: '10px 12px', borderRadius: '6px', fontFamily: 'var(--font-body)', fontSize: '13px', outline: 'none', boxSizing: 'border-box', marginBottom: '1.25rem', transition: 'border-color 0.2s' }}
                            value={saveName}
                            onChange={e => setSaveName(e.target.value)}
                            onFocus={e => e.target.style.borderColor = 'var(--accent)'}
                            onBlur={e => e.target.style.borderColor = 'rgba(201,169,98,0.25)'}
                            onKeyDown={e => { if (e.key === 'Enter') handleConfirmSave(); if (e.key === 'Escape') setSaveModalOpen(false); }}
                            placeholder="Ex: LP Anjos e Arcanjos na Bíblia"
                            maxLength={120}
                        />
                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1rem', cursor: 'pointer' }}>
                            <input
                                type="checkbox"
                                checked={saveAsTemplate}
                                onChange={e => setSaveAsTemplate(e.target.checked)}
                                style={{ accentColor: 'var(--accent)', width: '14px', height: '14px' }}
                            />
                            <span style={{ fontSize: '12px', color: 'rgba(245,240,232,0.5)' }}>
                                Salvar também como Template reutilizável
                            </span>
                        </label>
                        <div style={{ display: 'flex', gap: '8px' }}>
                            <button onClick={() => setSaveModalOpen(false)} style={{ flex: 1, background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(245,240,232,0.5)', padding: '10px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: 600, fontFamily: 'var(--font-body)', transition: 'all 0.2s' }}>
                                Cancelar
                            </button>
                            <button onClick={handleConfirmSave} disabled={isSaving || !saveName.trim()} style={{ flex: 2, background: isSaving || !saveName.trim() ? 'rgba(201,169,98,0.3)' : 'var(--accent)', color: '#0C0C0E', border: 'none', padding: '10px', borderRadius: '6px', cursor: isSaving || !saveName.trim() ? 'default' : 'pointer', fontSize: '12px', fontWeight: 700, fontFamily: 'var(--font-body)', transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                                {isSaving ? 'Salvando…' : '☁ Salvar na Galeria'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Templates Modal ── */}
            {showTemplatesModal && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(12px)', zIndex: 99998, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem' }}>
                    <div style={{ background: '#0e0e11', border: '1px solid rgba(201,169,98,0.2)', borderRadius: '12px', width: '100%', maxWidth: '860px', maxHeight: '80vh', display: 'flex', flexDirection: 'column', fontFamily: 'var(--font-body)', boxShadow: '0 32px 80px rgba(0,0,0,0.8)' }}>
                        <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <div>
                                <h3 style={{ margin: 0, fontSize: '16px', fontFamily: 'var(--font-heading)', fontWeight: 400 }}>Templates Salvos</h3>
                                <p style={{ margin: '4px 0 0', fontSize: '11px', color: 'var(--text-muted)' }}>Carregue um layout anterior e continue de onde parou</p>
                            </div>
                            <button onClick={() => setShowTemplatesModal(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '18px', lineHeight: 1 }}>✕</button>
                        </div>
                        <div style={{ flex: 1, overflowY: 'auto', padding: '1.25rem' }}>
                            {templatesLoading ? (
                                <div style={{ color: 'var(--text-muted)', padding: '3rem', textAlign: 'center', fontSize: '13px' }}>Carregando templates...</div>
                            ) : templates.length === 0 ? (
                                <div style={{ color: 'var(--text-muted)', padding: '3rem', textAlign: 'center', fontSize: '13px' }}>
                                    <div style={{ fontSize: '28px', marginBottom: '10px' }}>📁</div>
                                    Nenhum template ainda. Salve uma LP como template para aparecer aqui.
                                </div>
                            ) : (
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '0.75rem' }}>
                                    {templates.map(tmpl => (
                                        <div key={tmpl.id} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '8px', overflow: 'hidden', transition: 'border-color 0.2s' }}
                                            onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(201,169,98,0.3)'}
                                            onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
                                        >
                                            <div style={{ height: '130px', overflow: 'hidden', background: '#0C0C0E', position: 'relative' }}>
                                                {tmpl.thumbnail_html ? (
                                                    <iframe srcDoc={`<!DOCTYPE html><html><head><link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=DM+Serif+Display&display=swap" rel="stylesheet"><style>*{margin:0;padding:0;box-sizing:border-box}:root{--accent:#C9A962;--bg:#0C0C0E;--surface:#131316;--text:#F5F0E8;--text-muted:rgba(245,240,232,0.5);--border:rgba(245,240,232,0.08);--font-body:'DM Sans',sans-serif;--font-heading:'DM Serif Display',serif}body{background:var(--bg);color:var(--text);font-family:var(--font-body)}</style></head><body>${tmpl.thumbnail_html}</body></html>`}
                                                        style={{ width: '200%', height: '260px', transform: 'scale(0.5)', transformOrigin: '0 0', border: 'none', pointerEvents: 'none' }}
                                                        sandbox="allow-scripts" title={tmpl.name}
                                                    />
                                                ) : (
                                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)', fontSize: '28px' }}>📄</div>
                                                )}
                                            </div>
                                            <div style={{ padding: '0.75rem' }}>
                                                <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text)', marginBottom: '4px' }}>{tmpl.name}</div>
                                                <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginBottom: '10px' }}>
                                                    {new Date(tmpl.created_at).toLocaleDateString('pt-BR')}
                                                </div>
                                                <div style={{ display: 'flex', gap: '6px' }}>
                                                    <button onClick={() => handleLoadTemplate(tmpl.id)} style={{ flex: 1, background: 'var(--accent)', color: '#0C0C0E', border: 'none', padding: '6px', borderRadius: '5px', cursor: 'pointer', fontSize: '11px', fontWeight: 700, fontFamily: 'var(--font-body)' }}>
                                                        Carregar
                                                    </button>
                                                    <button onClick={() => handleDeleteTemplate(tmpl.id)} style={{ background: 'rgba(255,80,80,0.06)', border: '1px solid rgba(255,80,80,0.15)', color: '#ff6b6b', padding: '6px 10px', borderRadius: '5px', cursor: 'pointer', fontSize: '11px', fontFamily: 'var(--font-body)' }}>✕</button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* ── Components Picker Modal ── */}
            {showComponentsModal && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(12px)', zIndex: 99998, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem' }}>
                    <div style={{ background: '#0e0e11', border: '1px solid rgba(201,169,98,0.2)', borderRadius: '12px', width: '100%', maxWidth: '860px', maxHeight: '85vh', display: 'flex', flexDirection: 'column', fontFamily: 'var(--font-body)', boxShadow: '0 32px 80px rgba(0,0,0,0.8)' }}>
                        <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <div>
                                <h3 style={{ margin: 0, fontSize: '16px', fontFamily: 'var(--font-heading)', fontWeight: 400 }}>Inserir Componente</h3>
                                <p style={{ margin: '4px 0 0', fontSize: '11px', color: 'var(--text-muted)' }}>Selecione um componente para adicionar à sua LP</p>
                            </div>
                            <button onClick={() => setShowComponentsModal(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '18px', lineHeight: 1 }}>✕</button>
                        </div>
                        {/* Category filter */}
                        <div style={{ padding: '0.75rem 1.25rem', borderBottom: '1px solid var(--border)', display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                            {['all', ...new Set(components.map(c => c.category))].map(cat => (
                                <button key={cat}
                                    onClick={() => setCompCategoryFilter(cat)}
                                    style={{
                                        padding: '4px 12px', borderRadius: '20px', fontSize: '11px', fontWeight: 600,
                                        fontFamily: 'var(--font-body)', cursor: 'pointer', transition: 'all 0.2s',
                                        background: compCategoryFilter === cat ? 'var(--accent)' : 'var(--surface)',
                                        color: compCategoryFilter === cat ? '#0C0C0E' : 'var(--text-muted)',
                                        border: compCategoryFilter === cat ? 'none' : '1px solid var(--border)',
                                    }}
                                >{cat === 'all' ? 'Todos' : cat}</button>
                            ))}
                        </div>
                        <div style={{ flex: 1, overflowY: 'auto', padding: '1.25rem' }}>
                            {componentsLoading ? (
                                <div style={{ color: 'var(--text-muted)', padding: '3rem', textAlign: 'center', fontSize: '13px' }}>Carregando componentes...</div>
                            ) : components.length === 0 ? (
                                <div style={{ color: 'var(--text-muted)', padding: '3rem', textAlign: 'center', fontSize: '13px' }}>
                                    <div style={{ fontSize: '28px', marginBottom: '10px' }}>⊞</div>
                                    Nenhum componente ainda. Crie componentes em <strong style={{ color: 'var(--accent)' }}>Biblioteca de Componentes</strong>.
                                </div>
                            ) : (
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '0.75rem' }}>
                                    {components
                                        .filter(c => compCategoryFilter === 'all' || c.category === compCategoryFilter)
                                        .map(comp => (
                                            <div key={comp.id} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '8px', overflow: 'hidden', transition: 'border-color 0.2s', cursor: 'pointer' }}
                                                onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(201,169,98,0.4)'}
                                                onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
                                                onClick={() => handleInsertComponent(comp)}
                                            >
                                                <div style={{ height: '140px', overflow: 'hidden', background: '#0C0C0E', position: 'relative' }}>
                                                    <iframe srcDoc={COMP_PREVIEW(comp.html)}
                                                        style={{ width: '200%', height: '280px', transform: 'scale(0.5)', transformOrigin: '0 0', border: 'none', pointerEvents: 'none' }}
                                                        sandbox="allow-scripts" title={comp.name}
                                                    />
                                                    <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0)', transition: 'background 0.2s' }}
                                                        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(201,169,98,0.12)'; }}
                                                        onMouseLeave={e => { e.currentTarget.style.background = 'rgba(0,0,0,0)'; }}
                                                    />
                                                </div>
                                                <div style={{ padding: '0.65rem 0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                                    <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text)' }}>{comp.name}</span>
                                                    <span style={{ fontSize: '10px', color: 'var(--accent)', background: 'rgba(201,169,98,0.1)', padding: '2px 7px', borderRadius: '10px' }}>{comp.category}</span>
                                                </div>
                                            </div>
                                        ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* ── Save Toast ── */}
            {saveToast && (
                <div style={{ position: 'fixed', bottom: '28px', right: '28px', background: '#131316', border: '1px solid rgba(201,169,98,0.3)', borderRadius: '10px', padding: '14px 18px', zIndex: 99999, fontFamily: 'var(--font-body)', boxShadow: '0 12px 32px rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', gap: '12px', animation: 'toastIn .3s cubic-bezier(.4,0,.2,1)' }}>
                    <style>{`@keyframes toastIn { from { opacity:0; transform:translateY(16px) } to { opacity:1; transform:translateY(0) } }`}</style>
                    <span style={{ color: '#F5F0E8', fontSize: '13px', fontWeight: 500 }}>{saveToast.message}</span>
                    <button onClick={() => navigate('/gallery')} style={{ background: 'rgba(201,169,98,0.12)', border: '1px solid rgba(201,169,98,0.25)', color: 'var(--accent)', padding: '5px 12px', borderRadius: '5px', cursor: 'pointer', fontSize: '11px', fontWeight: 700, fontFamily: 'var(--font-body)', transition: 'all 0.2s', whiteSpace: 'nowrap' }}>
                        Ver Galeria →
                    </button>
                    <button onClick={() => setSaveToast(null)} style={{ background: 'transparent', border: 'none', color: 'rgba(245,240,232,0.35)', cursor: 'pointer', fontSize: '14px', padding: '2px', lineHeight: 1 }}>✕</button>
                </div>
            )}
        </div>
    );
}
