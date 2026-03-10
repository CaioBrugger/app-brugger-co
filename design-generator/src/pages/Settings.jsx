import { useState, useEffect, useCallback } from 'react';

const SERVER = 'http://localhost:3333';

const API_GROUPS = [
    {
        id: 'openrouter',
        name: 'OpenRouter / Claude',
        keys: [
            { key: 'VITE_OPENROUTER_API_KEY', label: 'OpenRouter API Key' },
            { key: 'VITE_CLAUDE_API_KEY', label: 'Claude API Key (legado)' },
        ],
    },
    {
        id: 'gemini',
        name: 'Google Gemini',
        keys: [
            { key: 'VITE_GEMINI_API_KEY', label: 'Gemini API Key' },
        ],
    },
    {
        id: 'inference',
        name: 'inference.sh',
        keys: [
            { key: 'VITE_INFERENCE_API_KEY', label: 'Inference API Key' },
        ],
    },
    {
        id: 'supabase',
        name: 'Supabase',
        keys: [
            { key: 'VITE_SUPABASE_URL', label: 'URL' },
            { key: 'VITE_SUPABASE_ANON_KEY', label: 'Anon Key' },
            { key: 'VITE_SUPABASE_SERVICE_ROLE_KEY', label: 'Service Role Key' },
            { key: 'VITE_SUPABASE_DB_URL', label: 'Database URL' },
        ],
    },
];

const MCPS = [
    { name: 'Playwright', desc: 'Automação de browser, screenshots, web testing', type: 'Direct', icon: '🎭' },
    { name: 'Desktop Commander', desc: 'Operações via docker-gateway', type: 'Direct', icon: '🖥️' },
    { name: 'EXA', desc: 'Busca web, pesquisa, análise', type: 'Docker', icon: '🔍' },
    { name: 'Context7', desc: 'Documentação de bibliotecas e pacotes', type: 'Docker', icon: '📚' },
    { name: 'Apify', desc: 'Web scraping, extração de dados, mídias sociais', type: 'Docker', icon: '🕷️' },
];

function maskValue(val) {
    if (!val) return '';
    if (val.startsWith('http')) return val; // URLs não mascarar
    if (val.length <= 8) return '•'.repeat(val.length);
    return val.slice(0, 6) + '•'.repeat(Math.min(val.length - 10, 24)) + val.slice(-4);
}

function StatusDot({ status }) {
    const colors = { online: '#22c55e', offline: '#ef4444', checking: '#f59e0b', unknown: '#6b7280' };
    const labels = { online: 'online', offline: 'offline', checking: '...', unknown: '?' };
    return (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12 }}>
            <span style={{
                width: 8, height: 8, borderRadius: '50%',
                background: colors[status] || colors.unknown,
                boxShadow: status === 'online' ? `0 0 6px ${colors.online}` : 'none',
                flexShrink: 0,
            }} />
            <span style={{ color: colors[status] || colors.unknown }}>
                {labels[status] || status}
            </span>
        </span>
    );
}

export default function Settings() {
    const [vars, setVars] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [revealed, setRevealed] = useState({});
    const [editing, setEditing] = useState({});
    const [editValues, setEditValues] = useState({});
    const [saving, setSaving] = useState({});
    const [savedFlash, setSavedFlash] = useState({});
    const [serverStatus, setServerStatus] = useState({ cloner: 'checking', supabase: 'checking' });
    const [addingKey, setAddingKey] = useState(false);
    const [newKey, setNewKey] = useState({ key: '', value: '' });

    const loadEnv = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch(`${SERVER}/env`);
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const data = await res.json();
            setVars(data.vars || {});
        } catch {
            setError('Não foi possível carregar as variáveis. O servidor está rodando?');
        } finally {
            setLoading(false);
        }
    }, []);

    const checkServers = useCallback(async () => {
        setServerStatus({ cloner: 'checking', supabase: 'checking' });
        // Design Cloner
        try {
            const r = await fetch(`${SERVER}/health`, { signal: AbortSignal.timeout(3000) });
            setServerStatus(s => ({ ...s, cloner: r.ok ? 'online' : 'error' }));
        } catch {
            setServerStatus(s => ({ ...s, cloner: 'offline' }));
        }
        // Supabase
        try {
            const url = vars['VITE_SUPABASE_URL'] || 'http://127.0.0.1:54321';
            const r = await fetch(`${url}/rest/v1/`, { signal: AbortSignal.timeout(3000) });
            setServerStatus(s => ({ ...s, supabase: r.status < 500 ? 'online' : 'error' }));
        } catch {
            setServerStatus(s => ({ ...s, supabase: 'offline' }));
        }
    }, [vars]);

    useEffect(() => { loadEnv(); }, [loadEnv]);
    useEffect(() => { if (!loading) checkServers(); }, [loading, checkServers]);

    async function saveKey(key, value) {
        setSaving(s => ({ ...s, [key]: true }));
        try {
            const res = await fetch(`${SERVER}/env`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ vars: { [key]: value } }),
            });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            setVars(v => ({ ...v, [key]: value }));
            setEditing(e => ({ ...e, [key]: false }));
            setSavedFlash(s => ({ ...s, [key]: true }));
            setTimeout(() => setSavedFlash(s => ({ ...s, [key]: false })), 2000);
        } catch (e) {
            alert(`Erro ao salvar: ${e.message}`);
        } finally {
            setSaving(s => ({ ...s, [key]: false }));
        }
    }

    async function addNewKey() {
        if (!newKey.key.trim()) return;
        await saveKey(newKey.key.trim(), newKey.value.trim());
        setAddingKey(false);
        setNewKey({ key: '', value: '' });
    }

    const knownKeys = new Set(API_GROUPS.flatMap(g => g.keys.map(k => k.key)));
    const extraVars = Object.entries(vars).filter(([k]) => !knownKeys.has(k));

    return (
        <div style={{ padding: '2rem', maxWidth: 860, margin: '0 auto' }}>
            {/* Header */}
            <div style={{ marginBottom: '2rem' }}>
                <h1 style={{ fontSize: 24, fontWeight: 700, color: '#fff', margin: 0 }}>Configurações</h1>
                <p style={{ color: '#6b7280', margin: '4px 0 0', fontSize: 14 }}>
                    Conexões, chaves de API e serviços
                </p>
            </div>

            {error && (
                <div style={{
                    background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
                    borderRadius: 8, padding: '12px 16px', color: '#fca5a5',
                    marginBottom: '1.5rem', fontSize: 14,
                }}>
                    ⚠ {error}
                    <button onClick={loadEnv} style={{
                        marginLeft: 12, background: 'transparent', border: '1px solid #fca5a5',
                        color: '#fca5a5', borderRadius: 4, padding: '2px 8px', cursor: 'pointer', fontSize: 12,
                    }}>
                        Tentar novamente
                    </button>
                </div>
            )}

            {/* Servidores Locais */}
            <section style={{ marginBottom: '2rem' }}>
                <SectionTitle>Servidores Locais</SectionTitle>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <ServerCard
                        name="Design Cloner Server"
                        url="localhost:3333"
                        status={serverStatus.cloner}
                        onCheck={checkServers}
                    />
                    <ServerCard
                        name="Supabase"
                        url={vars['VITE_SUPABASE_URL'] || 'localhost:54321'}
                        status={serverStatus.supabase}
                        onCheck={checkServers}
                        extra={
                            <a
                                href="http://127.0.0.1:54323"
                                target="_blank"
                                rel="noreferrer"
                                style={{ color: '#a78bfa', fontSize: 12, textDecoration: 'none' }}
                            >
                                Abrir Studio →
                            </a>
                        }
                    />
                </div>
            </section>

            {/* API Keys */}
            <section style={{ marginBottom: '2rem' }}>
                <SectionTitle>Chaves de API</SectionTitle>

                {loading ? (
                    <div style={{ color: '#6b7280', fontSize: 14 }}>Carregando...</div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        {API_GROUPS.map(group => (
                            <ApiGroup key={group.id} title={group.name}>
                                {group.keys.map(({ key, label }) => (
                                    <KeyRow
                                        key={key}
                                        varKey={key}
                                        label={label}
                                        value={vars[key] || ''}
                                        revealed={!!revealed[key]}
                                        editing={!!editing[key]}
                                        editValue={editValues[key] ?? (vars[key] || '')}
                                        saving={!!saving[key]}
                                        savedFlash={!!savedFlash[key]}
                                        onToggleReveal={() => setRevealed(r => ({ ...r, [key]: !r[key] }))}
                                        onStartEdit={() => {
                                            setEditing(e => ({ ...e, [key]: true }));
                                            setEditValues(v => ({ ...v, [key]: vars[key] || '' }));
                                        }}
                                        onCancelEdit={() => setEditing(e => ({ ...e, [key]: false }))}
                                        onChangeEdit={val => setEditValues(v => ({ ...v, [key]: val }))}
                                        onSave={() => saveKey(key, editValues[key] ?? vars[key] ?? '')}
                                    />
                                ))}
                            </ApiGroup>
                        ))}

                        {/* Variáveis extras (não mapeadas) */}
                        {extraVars.length > 0 && (
                            <ApiGroup title="Outras variáveis">
                                {extraVars.map(([key, value]) => (
                                    <KeyRow
                                        key={key}
                                        varKey={key}
                                        label={key}
                                        value={value}
                                        revealed={!!revealed[key]}
                                        editing={!!editing[key]}
                                        editValue={editValues[key] ?? value}
                                        saving={!!saving[key]}
                                        savedFlash={!!savedFlash[key]}
                                        onToggleReveal={() => setRevealed(r => ({ ...r, [key]: !r[key] }))}
                                        onStartEdit={() => {
                                            setEditing(e => ({ ...e, [key]: true }));
                                            setEditValues(v => ({ ...v, [key]: value }));
                                        }}
                                        onCancelEdit={() => setEditing(e => ({ ...e, [key]: false }))}
                                        onChangeEdit={val => setEditValues(v => ({ ...v, [key]: val }))}
                                        onSave={() => saveKey(key, editValues[key] ?? value)}
                                    />
                                ))}
                            </ApiGroup>
                        )}

                        {/* Adicionar nova chave */}
                        {addingKey ? (
                            <div style={{
                                background: '#1a1a2e', border: '1px solid #2d2d4a',
                                borderRadius: 8, padding: 16,
                            }}>
                                <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                                    <input
                                        placeholder="NOME_DA_VARIAVEL"
                                        value={newKey.key}
                                        onChange={e => setNewKey(n => ({ ...n, key: e.target.value }))}
                                        style={inputStyle}
                                        autoFocus
                                    />
                                    <input
                                        placeholder="valor"
                                        value={newKey.value}
                                        onChange={e => setNewKey(n => ({ ...n, value: e.target.value }))}
                                        style={{ ...inputStyle, flex: 2 }}
                                    />
                                </div>
                                <div style={{ display: 'flex', gap: 8 }}>
                                    <Btn onClick={addNewKey} variant="primary">Salvar</Btn>
                                    <Btn onClick={() => { setAddingKey(false); setNewKey({ key: '', value: '' }); }}>
                                        Cancelar
                                    </Btn>
                                </div>
                            </div>
                        ) : (
                            <button
                                onClick={() => setAddingKey(true)}
                                style={{
                                    background: 'transparent',
                                    border: '1px dashed #374151',
                                    color: '#6b7280',
                                    borderRadius: 8,
                                    padding: '10px 16px',
                                    cursor: 'pointer',
                                    fontSize: 13,
                                    width: '100%',
                                    textAlign: 'left',
                                    transition: 'all 0.15s',
                                }}
                                onMouseEnter={e => { e.target.style.borderColor = '#6b7280'; e.target.style.color = '#9ca3af'; }}
                                onMouseLeave={e => { e.target.style.borderColor = '#374151'; e.target.style.color = '#6b7280'; }}
                            >
                                + Adicionar variável
                            </button>
                        )}
                    </div>
                )}
            </section>

            {/* MCPs */}
            <section>
                <SectionTitle>MCPs Configurados</SectionTitle>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 10 }}>
                    {MCPS.map(mcp => (
                        <div key={mcp.name} style={{
                            background: '#111827', border: '1px solid #1f2937',
                            borderRadius: 8, padding: '12px 14px',
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                                <span style={{ fontSize: 16 }}>{mcp.icon}</span>
                                <span style={{ color: '#e5e7eb', fontWeight: 600, fontSize: 13 }}>{mcp.name}</span>
                                <span style={{
                                    marginLeft: 'auto',
                                    fontSize: 10,
                                    background: mcp.type === 'Docker' ? 'rgba(99,102,241,0.15)' : 'rgba(34,197,94,0.12)',
                                    color: mcp.type === 'Docker' ? '#818cf8' : '#4ade80',
                                    border: `1px solid ${mcp.type === 'Docker' ? 'rgba(99,102,241,0.3)' : 'rgba(34,197,94,0.2)'}`,
                                    borderRadius: 4, padding: '2px 6px',
                                }}>
                                    {mcp.type}
                                </span>
                            </div>
                            <p style={{ color: '#6b7280', fontSize: 12, margin: 0 }}>{mcp.desc}</p>
                        </div>
                    ))}
                </div>
                <p style={{ color: '#4b5563', fontSize: 12, marginTop: 10 }}>
                    MCPs são gerenciados via <code style={{ color: '#6b7280' }}>~/.claude.json</code> e <code style={{ color: '#6b7280' }}>~/.docker/mcp/</code>.
                    Use <code style={{ color: '#6b7280' }}>@devops *add-mcp</code> para adicionar novos.
                </p>
            </section>
        </div>
    );
}

// ─── Sub-componentes ───────────────────────────────────────────────────────────

function SectionTitle({ children }) {
    return (
        <h2 style={{
            fontSize: 11, fontWeight: 600, color: '#6b7280',
            textTransform: 'uppercase', letterSpacing: '0.08em',
            margin: '0 0 10px',
        }}>
            {children}
        </h2>
    );
}

function ServerCard({ name, url, status, onCheck, extra }) {
    return (
        <div style={{
            background: '#111827', border: '1px solid #1f2937',
            borderRadius: 8, padding: '14px 16px',
        }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ color: '#e5e7eb', fontWeight: 600, fontSize: 14 }}>{name}</span>
                <StatusDot status={status} />
            </div>
            <div style={{ color: '#6b7280', fontSize: 12, fontFamily: 'monospace', marginBottom: extra ? 8 : 0 }}>
                {url}
            </div>
            {extra && <div>{extra}</div>}
            <button
                onClick={onCheck}
                style={{
                    marginTop: 10, background: 'transparent', border: '1px solid #374151',
                    color: '#9ca3af', borderRadius: 4, padding: '3px 10px',
                    cursor: 'pointer', fontSize: 11,
                }}
            >
                Verificar
            </button>
        </div>
    );
}

function ApiGroup({ title, children }) {
    return (
        <div style={{
            background: '#111827', border: '1px solid #1f2937',
            borderRadius: 8, overflow: 'hidden',
        }}>
            <div style={{
                padding: '8px 14px', borderBottom: '1px solid #1f2937',
                background: '#0f172a',
                fontSize: 12, fontWeight: 600, color: '#9ca3af',
            }}>
                {title}
            </div>
            <div>{children}</div>
        </div>
    );
}

function KeyRow({ varKey, label, value, revealed, editing, editValue, saving, savedFlash,
    onToggleReveal, onStartEdit, onCancelEdit, onChangeEdit, onSave }) {
    const display = revealed ? (value || '—') : (value ? maskValue(value) : <span style={{ color: '#4b5563', fontStyle: 'italic' }}>não configurado</span>);

    return (
        <div style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '10px 14px', borderBottom: '1px solid #1a2035',
        }}>
            {/* Label */}
            <div style={{ minWidth: 200 }}>
                <div style={{ color: '#e5e7eb', fontSize: 13 }}>{label}</div>
                <div style={{ color: '#374151', fontSize: 11, fontFamily: 'monospace', marginTop: 2 }}>{varKey}</div>
            </div>

            {/* Value / Edit */}
            <div style={{ flex: 1 }}>
                {editing ? (
                    <input
                        value={editValue}
                        onChange={e => onChangeEdit(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter') onSave(); if (e.key === 'Escape') onCancelEdit(); }}
                        autoFocus
                        style={inputStyle}
                    />
                ) : (
                    <span style={{
                        fontFamily: 'monospace', fontSize: 12,
                        color: value ? '#d1d5db' : '#4b5563',
                    }}>
                        {display}
                    </span>
                )}
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                {savedFlash && (
                    <span style={{ color: '#4ade80', fontSize: 12, alignSelf: 'center' }}>✓ salvo</span>
                )}
                {editing ? (
                    <>
                        <Btn onClick={onSave} variant="primary" disabled={saving}>
                            {saving ? '...' : 'Salvar'}
                        </Btn>
                        <Btn onClick={onCancelEdit}>Cancelar</Btn>
                    </>
                ) : (
                    <>
                        {value && (
                            <Btn onClick={onToggleReveal}>{revealed ? 'Ocultar' : 'Ver'}</Btn>
                        )}
                        <Btn onClick={onStartEdit}>Editar</Btn>
                    </>
                )}
            </div>
        </div>
    );
}

function Btn({ onClick, children, variant, disabled }) {
    return (
        <button
            onClick={onClick}
            disabled={disabled}
            style={{
                background: variant === 'primary' ? '#4f46e5' : 'transparent',
                border: `1px solid ${variant === 'primary' ? '#4f46e5' : '#374151'}`,
                color: variant === 'primary' ? '#fff' : '#9ca3af',
                borderRadius: 4, padding: '3px 10px',
                cursor: disabled ? 'not-allowed' : 'pointer',
                fontSize: 12, opacity: disabled ? 0.6 : 1,
                transition: 'all 0.15s',
            }}
        >
            {children}
        </button>
    );
}

const inputStyle = {
    flex: 1,
    width: '100%',
    background: '#0f172a',
    border: '1px solid #374151',
    borderRadius: 4,
    color: '#e5e7eb',
    padding: '5px 10px',
    fontSize: 12,
    fontFamily: 'monospace',
    outline: 'none',
};
