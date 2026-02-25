import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchLandingPages, fetchLandingPage, deleteLandingPage } from '../services/landingPagesService';

// ─── Design tokens ──────────────────────────────────────────────────────────
const BG      = '#0C0C0E';
const SURFACE = '#131316';
const ACCENT  = '#C9A962';
const TEXT    = '#F5F0E8';
const MUTED   = 'rgba(245,240,232,0.42)';
const BORDER  = 'rgba(255,255,255,0.07)';

// ─── Helpers ─────────────────────────────────────────────────────────────────
function timeAgo(dateStr) {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins  = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days  = Math.floor(diff / 86400000);
    if (mins  < 2)   return 'agora mesmo';
    if (mins  < 60)  return `há ${mins} min`;
    if (hours < 24)  return `há ${hours}h`;
    if (days  < 30)  return `há ${days}d`;
    return new Date(dateStr).toLocaleDateString('pt-BR');
}

function buildThumbnailDoc(html) {
    return `<!DOCTYPE html>
<html lang="pt-BR"><head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0">
<link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=DM+Serif+Display&display=swap" rel="stylesheet">
<style>
  :root {
    --bg:#0C0C0E; --surface:#131316; --accent:#C9A962;
    --accent-light:#E8D5A3; --text:#F5F0E8; --text-muted:rgba(245,240,232,0.5);
    --border:rgba(255,255,255,0.08); --font-heading:'DM Serif Display',serif;
    --font-body:'DM Sans',sans-serif; --radius-sm:4px; --radius-md:8px; --radius-lg:16px;
  }
  * { box-sizing:border-box; margin:0; padding:0; }
  body { background:${BG}; overflow:hidden; font-family:'DM Sans',sans-serif; }
  /* Disable all transitions for fast thumbnail */
  *, *::before, *::after { transition:none !important; animation:none !important; }
  .lp-animate,.lp-fade-left,.lp-fade-right { opacity:1 !important; transform:none !important; }
</style>
</head><body>${html}</body></html>`;
}

function buildFullDoc(htmlContent) {
    return `<!DOCTYPE html>
<html lang="pt-BR"><head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0">
<link href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,wght@0,400;0,500;0,600;0,700;1,400&family=DM+Serif+Display:ital@0;1&display=swap" rel="stylesheet">
<style>
  :root {
    --bg:#0C0C0E; --surface:#131316; --accent:#C9A962;
    --accent-light:#E8D5A3; --text:#F5F0E8; --text-muted:rgba(245,240,232,0.5);
    --border:rgba(255,255,255,0.08); --font-heading:'DM Serif Display',serif;
    --font-body:'DM Sans',sans-serif; --radius-sm:4px; --radius-md:8px; --radius-lg:16px;
  }
  * { box-sizing:border-box; }
  body { margin:0; background:#0C0C0E; overflow-x:hidden; }
  .lp-animate,.lp-fade-left,.lp-fade-right { opacity:1; transform:none; }
</style>
</head><body>${htmlContent}</body></html>`;
}

// ─── Card mini-preview ────────────────────────────────────────────────────────
function MiniPreview({ html }) {
    const SCALE = 0.26;
    return (
        <div style={{ width: '100%', height: '200px', overflow: 'hidden', position: 'relative', background: BG, flexShrink: 0 }}>
            {html ? (
                <iframe
                    srcDoc={buildThumbnailDoc(html)}
                    style={{
                        width:  `${100 / SCALE}%`,
                        height: `${200 / SCALE}px`,
                        transform: `scale(${SCALE})`,
                        transformOrigin: 'top left',
                        border: 'none',
                        pointerEvents: 'none',
                    }}
                    scrolling="no"
                    title="preview"
                />
            ) : (
                <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: MUTED, fontSize: '12px' }}>
                    Sem preview
                </div>
            )}
        </div>
    );
}

// ─── Fullscreen preview modal ─────────────────────────────────────────────────
function PreviewModal({ lp, onClose, onOpenBuilder, onDownload }) {
    const [frameHtml, setFrameHtml] = useState(null);
    const [loading, setLoading]     = useState(true);

    useEffect(() => {
        setLoading(true);
        fetchLandingPage(lp.id)
            .then(full => setFrameHtml(buildFullDoc(full.html_content)))
            .finally(() => setLoading(false));
    }, [lp.id]);

    useEffect(() => {
        const onKey = e => { if (e.key === 'Escape') onClose(); };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [onClose]);

    return (
        <div style={{
            position: 'fixed', inset: 0,
            background: 'rgba(0,0,0,0.92)',
            backdropFilter: 'blur(14px)',
            zIndex: 99999,
            display: 'flex', flexDirection: 'column',
            fontFamily: "'DM Sans', sans-serif",
            animation: 'gal-fade .18s ease',
        }}>
            {/* Header */}
            <div style={{
                padding: '0.9rem 1.75rem',
                borderBottom: `1px solid ${BORDER}`,
                background: 'rgba(13,13,16,0.98)',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                flexShrink: 0,
            }}>
                <div>
                    <h2 style={{ margin: 0, color: TEXT, fontSize: '16px', fontFamily: "'DM Serif Display',serif", fontWeight: 400 }}>
                        {lp.name}
                    </h2>
                    <p style={{ margin: '3px 0 0', color: MUTED, fontSize: '11px' }}>
                        {lp.section_count} seções · {timeAgo(lp.created_at)}
                    </p>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                    <button onClick={onDownload} style={btnStyle('ghost')}>↓ HTML</button>
                    <button onClick={onOpenBuilder} style={btnStyle('ghost')}>✏ Abrir no Builder</button>
                    <button onClick={onClose} style={btnStyle('ghost')}>✕ Fechar</button>
                </div>
            </div>

            {/* iframe */}
            <div style={{ flex: 1, position: 'relative', background: BG }}>
                {loading && (
                    <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '14px' }}>
                        <div style={{ width: '44px', height: '44px', borderRadius: '50%', border: `2px solid rgba(201,169,98,0.15)`, borderTopColor: ACCENT, animation: 'gal-spin .75s linear infinite' }} />
                        <p style={{ color: MUTED, fontSize: '13px', margin: 0 }}>Carregando LP…</p>
                    </div>
                )}
                {frameHtml && (
                    <iframe
                        srcDoc={frameHtml}
                        style={{ width: '100%', height: '100%', border: 'none', opacity: loading ? 0 : 1, transition: 'opacity .35s' }}
                        title={lp.name}
                    />
                )}
            </div>
        </div>
    );
}

// ─── LP Card ─────────────────────────────────────────────────────────────────
function LpCard({ lp, idx, onPreview, onOpenBuilder, onDownload, onDeleteRequest }) {
    const [hovered, setHovered] = useState(false);

    return (
        <div
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            style={{
                background: SURFACE,
                border: `1px solid ${hovered ? 'rgba(201,169,98,0.28)' : BORDER}`,
                borderRadius: '6px',
                overflow: 'hidden',
                display: 'flex', flexDirection: 'column',
                transition: 'border-color .22s ease, transform .22s ease, box-shadow .22s ease',
                transform: hovered ? 'translateY(-4px)' : 'none',
                boxShadow: hovered ? '0 16px 40px rgba(0,0,0,0.5), 0 0 0 1px rgba(201,169,98,0.06)' : '0 2px 8px rgba(0,0,0,0.3)',
                cursor: 'pointer',
                animation: `gal-card-in .35s ease ${idx * 0.055}s both`,
            }}
            onClick={() => onPreview(lp)}
        >
            {/* Mini preview */}
            <div style={{ position: 'relative' }}>
                <MiniPreview html={lp.thumbnail_html} />
                {/* Hover overlay */}
                <div style={{
                    position: 'absolute', inset: 0,
                    background: 'rgba(0,0,0,0.55)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    opacity: hovered ? 1 : 0,
                    transition: 'opacity .2s',
                }}>
                    <span style={{ color: TEXT, fontSize: '13px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '7px', background: 'rgba(12,12,14,0.8)', padding: '8px 18px', borderRadius: '20px', border: `1px solid ${BORDER}`, backdropFilter: 'blur(8px)' }}>
                        👁 Ver LP completa
                    </span>
                </div>
            </div>

            {/* Info */}
            <div style={{ padding: '0.875rem 1rem', flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <h3 style={{ margin: 0, color: TEXT, fontSize: '13px', fontWeight: 600, lineHeight: 1.3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {lp.name}
                </h3>
                {lp.description && (
                    <p style={{ margin: 0, color: MUTED, fontSize: '11px', lineHeight: 1.5, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                        {lp.description}
                    </p>
                )}

                {/* Meta badges */}
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '2px' }}>
                    <span style={badgeStyle}>{lp.section_count} seções</span>
                    {lp.model_used && (
                        <span style={badgeStyle}>{modelLabel(lp.model_used)}</span>
                    )}
                </div>

                <p style={{ margin: 0, color: 'rgba(245,240,232,0.28)', fontSize: '10px', marginTop: 'auto', paddingTop: '6px' }}>
                    {timeAgo(lp.created_at)}
                </p>
            </div>

            {/* Action bar */}
            <div
                onClick={e => e.stopPropagation()}
                style={{
                    padding: '0.6rem 0.875rem',
                    borderTop: `1px solid ${BORDER}`,
                    display: 'flex', gap: '6px',
                    background: 'rgba(0,0,0,0.2)',
                }}
            >
                <ActionBtn icon="👁" label="Preview"  onClick={() => onPreview(lp)} accent />
                <ActionBtn icon="✏" label="Builder"  onClick={() => onOpenBuilder(lp)} />
                <ActionBtn icon="↓" label="HTML"     onClick={() => onDownload(lp)} />
                <div style={{ flex: 1 }} />
                <ActionBtn icon="🗑" label="Deletar"  onClick={() => onDeleteRequest(lp)} danger />
            </div>
        </div>
    );
}

const badgeStyle = {
    background: 'rgba(255,255,255,0.04)',
    border: `1px solid ${BORDER}`,
    borderRadius: '4px',
    padding: '2px 7px',
    fontSize: '10px',
    color: MUTED,
    fontWeight: 500,
};

function modelLabel(modelId) {
    if (!modelId) return '';
    if (modelId.includes('claude'))     return 'Claude';
    if (modelId.includes('grok'))       return 'Grok';
    if (modelId.includes('deepseek'))   return 'DeepSeek';
    if (modelId.includes('gpt'))        return 'GPT';
    return modelId.split('/').pop();
}

function ActionBtn({ icon, label, onClick, accent, danger }) {
    const [hov, setHov] = useState(false);
    const base = {
        background: accent  ? (hov ? 'rgba(201,169,98,0.18)' : 'rgba(201,169,98,0.08)') :
                    danger  ? (hov ? 'rgba(239,68,68,0.18)' :  'rgba(239,68,68,0.06)')  :
                               hov ? 'rgba(255,255,255,0.07)'                            : 'transparent',
        border: `1px solid ${accent ? 'rgba(201,169,98,0.22)' : danger ? 'rgba(239,68,68,0.2)' : BORDER}`,
        color: accent ? ACCENT : danger ? '#ef4444' : MUTED,
        padding: '4px 9px', borderRadius: '5px',
        cursor: 'pointer', fontSize: '11px', fontWeight: 500,
        transition: 'all .18s', display: 'flex', alignItems: 'center', gap: '4px',
        fontFamily: "'DM Sans',sans-serif",
    };
    return (
        <button style={base} onClick={onClick}
            onMouseEnter={() => setHov(true)}
            onMouseLeave={() => setHov(false)}
            title={label}
        >
            {icon} {label}
        </button>
    );
}

function btnStyle(type) {
    const base = {
        background: type === 'accent' ? ACCENT : 'transparent',
        color:      type === 'accent' ? '#0C0C0E' : MUTED,
        border: `1px solid ${type === 'accent' ? ACCENT : 'rgba(255,255,255,0.1)'}`,
        padding: '6px 14px', borderRadius: '6px', cursor: 'pointer',
        fontSize: '12px', fontWeight: 600, transition: 'all .2s',
        fontFamily: "'DM Sans',sans-serif",
    };
    return base;
}

// ─── Delete confirmation modal ────────────────────────────────────────────────
function DeleteModal({ lp, deleting, onConfirm, onCancel }) {
    return (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)', zIndex: 99998, display: 'flex', alignItems: 'center', justifyContent: 'center', animation: 'gal-fade .15s ease' }}>
            <div style={{ background: SURFACE, border: `1px solid rgba(239,68,68,0.25)`, borderRadius: '10px', padding: '2rem', width: '380px', fontFamily: "'DM Sans',sans-serif" }}>
                <div style={{ fontSize: '28px', marginBottom: '1rem', textAlign: 'center' }}>🗑</div>
                <h3 style={{ margin: '0 0 .5rem', color: TEXT, fontSize: '16px', fontWeight: 600, textAlign: 'center' }}>Deletar LP?</h3>
                <p style={{ margin: '0 0 1.5rem', color: MUTED, fontSize: '13px', textAlign: 'center', lineHeight: 1.5 }}>
                    "<strong style={{ color: TEXT }}>{lp.name}</strong>" será removida permanentemente.
                </p>
                <div style={{ display: 'flex', gap: '8px' }}>
                    <button onClick={onCancel} style={{ flex: 1, ...btnStyle('ghost'), padding: '10px', fontSize: '13px', borderColor: BORDER }}>Cancelar</button>
                    <button onClick={() => onConfirm(lp.id)} disabled={deleting} style={{ flex: 1, background: '#dc2626', color: '#fff', border: 'none', padding: '10px', borderRadius: '6px', cursor: deleting ? 'default' : 'pointer', fontSize: '13px', fontWeight: 600, fontFamily: "'DM Sans',sans-serif", opacity: deleting ? 0.7 : 1 }}>
                        {deleting ? 'Deletando…' : 'Sim, deletar'}
                    </button>
                </div>
            </div>
        </div>
    );
}

// ─── Empty state ──────────────────────────────────────────────────────────────
function EmptyState({ filtered, onNew }) {
    return (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1.25rem', padding: '4rem 2rem' }}>
            <div style={{ fontSize: '56px', opacity: 0.3, lineHeight: 1 }}>◈</div>
            <div style={{ textAlign: 'center' }}>
                <h3 style={{ margin: '0 0 .5rem', color: TEXT, fontSize: '18px', fontFamily: "'DM Serif Display',serif", fontWeight: 400 }}>
                    {filtered ? 'Nenhuma LP encontrada' : 'Sua galeria está vazia'}
                </h3>
                <p style={{ margin: 0, color: MUTED, fontSize: '13px' }}>
                    {filtered ? 'Tente outro termo de busca.' : 'Crie sua primeira Landing Page com IA no Builder.'}
                </p>
            </div>
            {!filtered && (
                <button onClick={onNew} style={{ background: ACCENT, color: '#0C0C0E', border: 'none', padding: '10px 24px', borderRadius: '6px', fontSize: '13px', fontWeight: 700, cursor: 'pointer', fontFamily: "'DM Sans',sans-serif", marginTop: '8px', boxShadow: '0 4px 16px rgba(201,169,98,0.3)' }}>
                    + Criar primeira LP
                </button>
            )}
        </div>
    );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function Gallery() {
    const navigate = useNavigate();
    const [lps,     setLps]     = useState([]);
    const [loading, setLoading] = useState(true);
    const [error,   setError]   = useState(null);
    const [search,  setSearch]  = useState('');
    const [preview,       setPreview]       = useState(null);
    const [deleteTarget,  setDeleteTarget]  = useState(null);
    const [deleting,      setDeleting]      = useState(false);

    useEffect(() => { load(); }, []);

    const load = async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await fetchLandingPages();
            setLps(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenBuilder = async (lp) => {
        try {
            const full = await fetchLandingPage(lp.id);
            sessionStorage.setItem('lp_load', JSON.stringify({
                name:        full.name,
                description: full.description,
                themeId:     full.theme_id,
                sections:    full.sections_json,
            }));
            navigate('/builder');
        } catch (err) {
            alert('Erro ao carregar LP: ' + err.message);
        }
    };

    const handleDownload = async (lp) => {
        try {
            const full = await fetchLandingPage(lp.id);
            const blob = new Blob([full.html_content], { type: 'text/html;charset=utf-8' });
            const url  = URL.createObjectURL(blob);
            const a    = document.createElement('a');
            a.href     = url;
            a.download = `${lp.name.replace(/[^a-z0-9]/gi, '-').toLowerCase()}.html`;
            a.click();
            URL.revokeObjectURL(url);
        } catch (err) {
            alert('Erro ao baixar: ' + err.message);
        }
    };

    const handleDelete = async (id) => {
        setDeleting(true);
        try {
            await deleteLandingPage(id);
            setLps(prev => prev.filter(lp => lp.id !== id));
            setDeleteTarget(null);
        } catch (err) {
            alert('Erro ao deletar: ' + err.message);
        } finally {
            setDeleting(false);
        }
    };

    const filtered = lps.filter(lp =>
        lp.name.toLowerCase().includes(search.toLowerCase()) ||
        (lp.description || '').toLowerCase().includes(search.toLowerCase())
    );

    return (
        <>
            {/* ── Global keyframes ── */}
            <style>{`
                @keyframes gal-fade    { from { opacity:0 } to { opacity:1 } }
                @keyframes gal-spin    { to { transform:rotate(360deg) } }
                @keyframes gal-card-in { from { opacity:0; transform:translateY(16px) } to { opacity:1; transform:translateY(0) } }
                @keyframes gal-search-glow { 0%,100%{box-shadow:none} 50%{box-shadow:0 0 0 3px rgba(201,169,98,0.1)} }
                .gal-search:focus { border-color:${ACCENT} !important; outline:none; }
            `}</style>

            <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: BG, color: TEXT, fontFamily: "'DM Sans',sans-serif", overflow: 'hidden' }}>

                {/* ══════════════════════════════════════
                    TOP BAR
                ══════════════════════════════════════ */}
                <div style={{ padding: '1rem 2rem', borderBottom: `1px solid ${BORDER}`, background: SURFACE, display: 'flex', alignItems: 'center', gap: '1rem', flexShrink: 0 }}>
                    {/* Title */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1 }}>
                        <div style={{ width: '32px', height: '32px', borderRadius: '7px', background: 'rgba(201,169,98,0.12)', border: `1px solid rgba(201,169,98,0.25)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', flexShrink: 0 }}>
                            ◈
                        </div>
                        <div>
                            <h1 style={{ margin: 0, fontSize: '17px', fontFamily: "'DM Serif Display',serif", fontWeight: 400, color: TEXT, letterSpacing: '-0.01em' }}>
                                Galeria de LPs
                            </h1>
                            <p style={{ margin: 0, fontSize: '11px', color: MUTED }}>
                                {lps.length > 0 ? `${lps.length} landing page${lps.length > 1 ? 's' : ''} salva${lps.length > 1 ? 's' : ''}` : 'Nenhuma LP salva ainda'}
                            </p>
                        </div>
                    </div>

                    {/* Search */}
                    <div style={{ position: 'relative', width: '280px' }}>
                        <span style={{ position: 'absolute', left: '11px', top: '50%', transform: 'translateY(-50%)', color: MUTED, fontSize: '13px', pointerEvents: 'none' }}>🔍</span>
                        <input
                            className="gal-search"
                            type="text"
                            placeholder="Buscar LPs..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            style={{ width: '100%', background: BG, border: `1px solid ${BORDER}`, color: TEXT, padding: '7px 12px 7px 34px', fontSize: '12px', borderRadius: '6px', fontFamily: "'DM Sans',sans-serif", transition: 'border-color .2s' }}
                        />
                    </div>

                    {/* Reload */}
                    <button onClick={load} title="Recarregar" style={{ background: 'transparent', border: `1px solid ${BORDER}`, color: MUTED, padding: '7px 10px', borderRadius: '6px', cursor: 'pointer', fontSize: '14px', transition: 'all .2s' }}
                        onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'; e.currentTarget.style.color = TEXT; }}
                        onMouseLeave={e => { e.currentTarget.style.borderColor = BORDER; e.currentTarget.style.color = MUTED; }}
                    >↺</button>

                    {/* New LP */}
                    <button onClick={() => navigate('/builder')} style={{ background: ACCENT, color: '#0C0C0E', border: 'none', padding: '8px 18px', borderRadius: '6px', fontSize: '12px', fontWeight: 700, cursor: 'pointer', fontFamily: "'DM Sans',sans-serif", boxShadow: '0 4px 14px rgba(201,169,98,0.25)', transition: 'all .2s', flexShrink: 0 }}
                        onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(201,169,98,0.35)'; }}
                        onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 14px rgba(201,169,98,0.25)'; }}
                    >+ Nova LP</button>
                </div>

                {/* ══════════════════════════════════════
                    CONTENT
                ══════════════════════════════════════ */}
                <div style={{ flex: 1, overflowY: 'auto', padding: '1.75rem 2rem' }}>

                    {/* Loading */}
                    {loading && (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(320px,1fr))', gap: '1.25rem' }}>
                            {[1, 2, 3, 4, 5, 6].map(i => (
                                <div key={i} style={{ background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: '6px', overflow: 'hidden', animation: `gal-card-in .35s ease ${i * 0.05}s both` }}>
                                    <div style={{ height: '200px', background: 'rgba(255,255,255,0.025)', animation: 'gal-fade 1.5s ease infinite alternate' }} />
                                    <div style={{ padding: '0.875rem' }}>
                                        <div style={{ height: '13px', width: '65%', background: 'rgba(255,255,255,0.06)', borderRadius: '4px', marginBottom: '8px' }} />
                                        <div style={{ height: '10px', width: '45%', background: 'rgba(255,255,255,0.04)', borderRadius: '4px' }} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Error */}
                    {!loading && error && (
                        <div style={{ textAlign: 'center', padding: '4rem', color: '#ef4444' }}>
                            <p>Erro ao carregar: {error}</p>
                            <button onClick={load} style={{ marginTop: '1rem', ...btnStyle('ghost'), color: ACCENT, borderColor: ACCENT, padding: '8px 20px' }}>Tentar novamente</button>
                        </div>
                    )}

                    {/* Grid */}
                    {!loading && !error && filtered.length > 0 && (
                        <>
                            {/* Stats strip */}
                            <div style={{ display: 'flex', gap: '1.5rem', marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: `1px solid ${BORDER}` }}>
                                {[
                                    { label: 'Total',   value: lps.length },
                                    { label: 'Seções',  value: lps.reduce((acc, lp) => acc + (lp.section_count || 0), 0) },
                                    { label: 'Visíveis', value: filtered.length },
                                ].map(stat => (
                                    <div key={stat.label} style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                        <span style={{ fontSize: '20px', fontWeight: 700, color: ACCENT, fontFamily: "'DM Serif Display',serif" }}>{stat.value}</span>
                                        <span style={{ fontSize: '10px', color: MUTED, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{stat.label}</span>
                                    </div>
                                ))}
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(320px,1fr))', gap: '1.25rem' }}>
                                {filtered.map((lp, idx) => (
                                    <LpCard
                                        key={lp.id}
                                        lp={lp}
                                        idx={idx}
                                        onPreview={setPreview}
                                        onOpenBuilder={handleOpenBuilder}
                                        onDownload={handleDownload}
                                        onDeleteRequest={setDeleteTarget}
                                    />
                                ))}
                            </div>
                        </>
                    )}

                    {/* Empty */}
                    {!loading && !error && filtered.length === 0 && (
                        <EmptyState filtered={search.length > 0} onNew={() => navigate('/builder')} />
                    )}
                </div>
            </div>

            {/* ── Modals ── */}
            {preview && (
                <PreviewModal
                    lp={preview}
                    onClose={() => setPreview(null)}
                    onOpenBuilder={() => { setPreview(null); handleOpenBuilder(preview); }}
                    onDownload={() => handleDownload(preview)}
                />
            )}
            {deleteTarget && (
                <DeleteModal
                    lp={deleteTarget}
                    deleting={deleting}
                    onConfirm={handleDelete}
                    onCancel={() => setDeleteTarget(null)}
                />
            )}
        </>
    );
}
