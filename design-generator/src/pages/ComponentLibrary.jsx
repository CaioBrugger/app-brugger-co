import { useState, useEffect, useRef } from 'react';
import { callClaude } from '../services/claude';
import {
    fetchComponents,
    saveComponent,
    updateComponent,
    deleteComponent,
    COMPONENT_CATEGORIES,
} from '../services/lpComponentsService';

const PREVIEW_WRAPPER = (html) => `<!DOCTYPE html>
<html><head><meta charset="UTF-8">
<link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=DM+Serif+Display&display=swap" rel="stylesheet">
<style>
*{box-sizing:border-box;margin:0;padding:0}
:root{--accent:#C9A962;--bg:#0C0C0E;--surface:#131316;--text:#F5F0E8;--text-muted:rgba(245,240,232,0.5);--border:rgba(245,240,232,0.08);--radius-md:8px;--font-body:'DM Sans',sans-serif;--font-heading:'DM Serif Display',serif}
body{background:var(--bg);color:var(--text);font-family:var(--font-body);overflow-x:hidden}
</style></head><body>${html}</body></html>`;

const AI_SYSTEM = `You are a landing page section designer. Generate a complete, self-contained HTML section.
Rules:
- Use CSS variables: var(--accent), var(--bg), var(--surface), var(--text), var(--text-muted), var(--border)
- Use font-family: 'DM Sans', sans-serif for body text; 'DM Serif Display', serif for headings
- Include a <style> block before the HTML
- Dark background theme (--bg is #0C0C0E, --text is #F5F0E8, --accent is gold #C9A962)
- Make it responsive, visually polished, and modern
- Output ONLY the raw HTML+CSS code. No explanations, no markdown fences.`;

export default function ComponentLibrary() {
    const [components, setComponents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeCategory, setActiveCategory] = useState('all');
    const [modalOpen, setModalOpen] = useState(false);
    const [editTarget, setEditTarget] = useState(null);
    const [form, setForm] = useState({ name: '', category: 'custom', description: '', html: '' });
    const [generating, setGenerating] = useState(false);
    const [saving, setSaving] = useState(false);
    const previewRef = useRef(null);

    useEffect(() => {
        load();
    }, []);

    async function load() {
        setLoading(true);
        try { setComponents(await fetchComponents()); } catch (e) { console.error(e); }
        finally { setLoading(false); }
    }

    function openCreate() {
        setEditTarget(null);
        setForm({ name: '', category: 'custom', description: '', html: '' });
        setModalOpen(true);
    }

    function openEdit(comp) {
        setEditTarget(comp);
        setForm({ name: comp.name, category: comp.category, description: comp.description || '', html: comp.html });
        setModalOpen(true);
    }

    async function handleDelete(id) {
        if (!confirm('Deletar este componente?')) return;
        await deleteComponent(id);
        setComponents(prev => prev.filter(c => c.id !== id));
    }

    async function handleSave() {
        if (!form.name.trim() || !form.html.trim()) return alert('Preencha nome e HTML.');
        setSaving(true);
        try {
            if (editTarget) {
                const updated = await updateComponent(editTarget.id, form);
                setComponents(prev => prev.map(c => c.id === editTarget.id ? updated : c));
            } else {
                const created = await saveComponent(form);
                setComponents(prev => [created, ...prev]);
            }
            setModalOpen(false);
        } catch (e) { alert('Erro ao salvar: ' + e.message); }
        finally { setSaving(false); }
    }

    async function handleGenerate() {
        if (!form.description.trim()) return alert('Descreva o componente primeiro.');
        setGenerating(true);
        try {
            const userPrompt = `Crie uma seção "${form.category}" para uma landing page: ${form.description}`;
            const html = await callClaude(AI_SYSTEM, userPrompt);
            setForm(prev => ({ ...prev, html }));
        } catch (e) { alert('Erro ao gerar: ' + e.message); }
        finally { setGenerating(false); }
    }

    const filtered = activeCategory === 'all'
        ? components
        : components.filter(c => c.category === activeCategory);

    const catLabel = (id) => COMPONENT_CATEGORIES.find(c => c.id === id)?.label || id;

    return (
        <div className="page-container" style={{ color: 'var(--text)', fontFamily: 'var(--font-body)' }}>

            {/* ── Header ── */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem' }}>
                <div>
                    <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '26px', fontWeight: 400, margin: 0 }}>
                        Biblioteca de Componentes
                    </h1>
                    <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginTop: '6px' }}>
                        Crie e gerencie seções reutilizáveis para suas landing pages
                    </p>
                </div>
                <button
                    onClick={openCreate}
                    style={{
                        background: 'var(--accent)', color: '#0C0C0E', border: 'none',
                        padding: '0.6rem 1.4rem', borderRadius: 'var(--radius-md)',
                        fontFamily: 'var(--font-body)', fontSize: '13px', fontWeight: 700,
                        cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px',
                    }}
                >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                    Novo Componente
                </button>
            </div>

            {/* ── Category Filter ── */}
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
                <button
                    onClick={() => setActiveCategory('all')}
                    style={{
                        padding: '5px 14px', borderRadius: '20px', fontSize: '12px', fontWeight: 600,
                        fontFamily: 'var(--font-body)', cursor: 'pointer', transition: 'all 0.2s',
                        background: activeCategory === 'all' ? 'var(--accent)' : 'var(--surface)',
                        color: activeCategory === 'all' ? '#0C0C0E' : 'var(--text-muted)',
                        border: activeCategory === 'all' ? 'none' : '1px solid var(--border)',
                    }}
                >Todos ({components.length})</button>
                {COMPONENT_CATEGORIES.map(cat => {
                    const count = components.filter(c => c.category === cat.id).length;
                    if (count === 0) return null;
                    return (
                        <button key={cat.id}
                            onClick={() => setActiveCategory(cat.id)}
                            style={{
                                padding: '5px 14px', borderRadius: '20px', fontSize: '12px', fontWeight: 600,
                                fontFamily: 'var(--font-body)', cursor: 'pointer', transition: 'all 0.2s',
                                background: activeCategory === cat.id ? 'var(--accent)' : 'var(--surface)',
                                color: activeCategory === cat.id ? '#0C0C0E' : 'var(--text-muted)',
                                border: activeCategory === cat.id ? 'none' : '1px solid var(--border)',
                            }}
                        >{cat.label} ({count})</button>
                    );
                })}
            </div>

            {/* ── Grid ── */}
            {loading ? (
                <div style={{ color: 'var(--text-muted)', padding: '4rem', textAlign: 'center', fontSize: '13px' }}>
                    Carregando componentes...
                </div>
            ) : filtered.length === 0 ? (
                <div style={{
                    background: 'var(--surface)', border: '1px dashed var(--border)', borderRadius: 'var(--radius-md)',
                    padding: '4rem 2rem', textAlign: 'center',
                }}>
                    <div style={{ fontSize: '32px', marginBottom: '12px' }}>⊞</div>
                    <p style={{ color: 'var(--text-muted)', fontSize: '14px', margin: 0 }}>
                        {activeCategory === 'all'
                            ? 'Nenhum componente ainda. Crie o seu primeiro!'
                            : `Nenhum componente na categoria "${catLabel(activeCategory)}".`}
                    </p>
                </div>
            ) : (
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
                    gap: '1rem',
                }}>
                    {filtered.map(comp => (
                        <ComponentCard
                            key={comp.id}
                            comp={comp}
                            catLabel={catLabel}
                            onEdit={() => openEdit(comp)}
                            onDelete={() => handleDelete(comp.id)}
                        />
                    ))}
                </div>
            )}

            {/* ── Create/Edit Modal ── */}
            {modalOpen && (
                <div style={{
                    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)',
                    backdropFilter: 'blur(12px)', zIndex: 99998,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    padding: '1rem',
                }}>
                    <div style={{
                        background: '#0e0e11', border: '1px solid rgba(201,169,98,0.2)',
                        borderRadius: '12px', width: '100%', maxWidth: '1100px',
                        height: '90vh', display: 'flex', flexDirection: 'column',
                        fontFamily: 'var(--font-body)', boxShadow: '0 32px 80px rgba(0,0,0,0.8)',
                        overflow: 'hidden',
                    }}>
                        {/* Modal Header */}
                        <div style={{
                            padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border)',
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                            flexShrink: 0,
                        }}>
                            <h2 style={{ margin: 0, fontSize: '16px', fontFamily: 'var(--font-heading)', fontWeight: 400 }}>
                                {editTarget ? 'Editar Componente' : 'Novo Componente'}
                            </h2>
                            <button onClick={() => setModalOpen(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '18px', lineHeight: 1 }}>✕</button>
                        </div>

                        {/* Modal Body */}
                        <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
                            {/* Left: Form */}
                            <div style={{
                                width: '380px', flexShrink: 0, padding: '1.5rem',
                                borderRight: '1px solid var(--border)', overflowY: 'auto',
                                display: 'flex', flexDirection: 'column', gap: '1rem',
                            }}>
                                <Field label="Nome">
                                    <input
                                        value={form.name}
                                        onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                                        placeholder="Ex: Carrossel de Capas"
                                        style={inputStyle}
                                    />
                                </Field>

                                <Field label="Categoria">
                                    <select
                                        value={form.category}
                                        onChange={e => setForm(p => ({ ...p, category: e.target.value }))}
                                        style={{ ...inputStyle, cursor: 'pointer' }}
                                    >
                                        {COMPONENT_CATEGORIES.map(c => (
                                            <option key={c.id} value={c.id}>{c.label}</option>
                                        ))}
                                    </select>
                                </Field>

                                <Field label="Descrição (para geração com IA)">
                                    <textarea
                                        value={form.description}
                                        onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                                        placeholder="Ex: Carrossel horizontal mostrando capas de ebooks com título e botão de compra abaixo de cada item"
                                        rows={3}
                                        style={{ ...inputStyle, resize: 'vertical' }}
                                    />
                                </Field>

                                <button
                                    onClick={handleGenerate}
                                    disabled={generating || !form.description.trim()}
                                    style={{
                                        background: generating ? 'var(--surface)' : 'rgba(201,169,98,0.1)',
                                        color: generating ? 'var(--text-muted)' : 'var(--accent)',
                                        border: '1px solid rgba(201,169,98,0.3)',
                                        padding: '0.6rem 1rem', borderRadius: 'var(--radius-md)',
                                        fontFamily: 'var(--font-body)', fontSize: '12px', fontWeight: 600,
                                        cursor: generating ? 'default' : 'pointer',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                                    }}
                                >
                                    {generating ? (
                                        <>
                                            <span style={{ animation: 'spin 1s linear infinite', display: 'inline-block' }}>⟳</span>
                                            Gerando com IA...
                                        </>
                                    ) : '✦ Gerar HTML com IA'}
                                </button>
                                <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>

                                <Field label="HTML do Componente">
                                    <textarea
                                        value={form.html}
                                        onChange={e => setForm(p => ({ ...p, html: e.target.value }))}
                                        placeholder="Cole ou gere o HTML da seção aqui..."
                                        rows={14}
                                        style={{ ...inputStyle, resize: 'vertical', fontFamily: 'monospace', fontSize: '11px' }}
                                    />
                                </Field>
                            </div>

                            {/* Right: Preview */}
                            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                                <div style={{
                                    padding: '0.75rem 1rem', borderBottom: '1px solid var(--border)',
                                    fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600,
                                    textTransform: 'uppercase', letterSpacing: '0.05em', flexShrink: 0,
                                }}>
                                    Preview ao vivo
                                </div>
                                <iframe
                                    ref={previewRef}
                                    srcDoc={PREVIEW_WRAPPER(form.html || '<div style="padding:4rem;text-align:center;color:var(--text-muted);font-family:var(--font-body)">Gere ou escreva o HTML para ver o preview</div>')}
                                    style={{ flex: 1, border: 'none', width: '100%' }}
                                    title="preview"
                                    sandbox="allow-scripts"
                                />
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div style={{
                            padding: '1rem 1.5rem', borderTop: '1px solid var(--border)',
                            display: 'flex', justifyContent: 'flex-end', gap: '8px', flexShrink: 0,
                        }}>
                            <button onClick={() => setModalOpen(false)} style={{
                                background: 'transparent', border: '1px solid var(--border)',
                                color: 'var(--text-muted)', padding: '8px 20px',
                                borderRadius: 'var(--radius-md)', cursor: 'pointer',
                                fontFamily: 'var(--font-body)', fontSize: '12px', fontWeight: 600,
                            }}>Cancelar</button>
                            <button
                                onClick={handleSave}
                                disabled={saving || !form.name.trim() || !form.html.trim()}
                                style={{
                                    background: saving || !form.name.trim() || !form.html.trim() ? 'rgba(201,169,98,0.3)' : 'var(--accent)',
                                    color: '#0C0C0E', border: 'none', padding: '8px 28px',
                                    borderRadius: 'var(--radius-md)', cursor: 'pointer',
                                    fontFamily: 'var(--font-body)', fontSize: '12px', fontWeight: 700,
                                }}
                            >{saving ? 'Salvando…' : editTarget ? 'Salvar Alterações' : 'Salvar Componente'}</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function ComponentCard({ comp, catLabel, onEdit, onDelete }) {
    return (
        <div style={{
            background: 'var(--surface)', border: '1px solid var(--border)',
            borderRadius: 'var(--radius-md)', overflow: 'hidden',
            transition: 'border-color 0.2s',
        }}
            onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(201,169,98,0.3)'}
            onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
        >
            {/* Preview */}
            <div style={{ height: '180px', overflow: 'hidden', position: 'relative', background: '#0C0C0E' }}>
                <iframe
                    srcDoc={PREVIEW_WRAPPER(comp.html)}
                    style={{ width: '200%', height: '400px', transform: 'scale(0.5)', transformOrigin: '0 0', border: 'none', pointerEvents: 'none' }}
                    title={comp.name}
                    sandbox="allow-scripts"
                />
            </div>

            {/* Info */}
            <div style={{ padding: '0.75rem 1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text)' }}>{comp.name}</span>
                    <span style={{
                        fontSize: '10px', fontWeight: 600, padding: '2px 8px',
                        borderRadius: '10px', background: 'rgba(201,169,98,0.1)',
                        color: 'var(--accent)', border: '1px solid rgba(201,169,98,0.2)',
                    }}>{catLabel(comp.category)}</span>
                </div>
                {comp.description && (
                    <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: '0 0 0.75rem', lineHeight: 1.4, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                        {comp.description}
                    </p>
                )}
                <div style={{ display: 'flex', gap: '6px' }}>
                    <button onClick={onEdit} style={{
                        flex: 1, background: 'rgba(201,169,98,0.08)', border: '1px solid rgba(201,169,98,0.2)',
                        color: 'var(--accent)', padding: '6px', borderRadius: '5px',
                        cursor: 'pointer', fontSize: '11px', fontWeight: 600, fontFamily: 'var(--font-body)',
                    }}>Editar</button>
                    <button onClick={onDelete} style={{
                        background: 'rgba(255,80,80,0.06)', border: '1px solid rgba(255,80,80,0.15)',
                        color: '#ff6b6b', padding: '6px 10px', borderRadius: '5px',
                        cursor: 'pointer', fontSize: '11px', fontFamily: 'var(--font-body)',
                    }}>✕</button>
                </div>
            </div>
        </div>
    );
}

function Field({ label, children }) {
    return (
        <div>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'rgba(245,240,232,0.5)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                {label}
            </label>
            {children}
        </div>
    );
}

const inputStyle = {
    width: '100%', background: 'var(--bg)', border: '1px solid var(--border)',
    color: 'var(--text)', padding: '8px 10px', borderRadius: '6px',
    fontFamily: 'var(--font-body)', fontSize: '12px', outline: 'none', boxSizing: 'border-box',
};
