import { useState, useMemo, useCallback, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { generateWorkflow } from '../services/claude';

// Import all workflow files at build time
const workflowModules = import.meta.glob('../../../.agent/workflows/*.md', { query: '?raw', import: 'default', eager: true });

// Parse YAML frontmatter
function parseFrontmatter(raw) {
    const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
    if (!match) return { meta: {}, content: raw };
    const yamlStr = match[1];
    let content = match[2];
    const meta = {};
    yamlStr.split('\n').forEach(line => {
        const idx = line.indexOf(':');
        if (idx > 0) {
            const key = line.slice(0, idx).trim();
            const val = line.slice(idx + 1).trim();
            if (key === 'description' && val) meta[key] = val;
        }
    });
    // Handle double frontmatter (ui-ux-pro-max)
    const secondMatch = content.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
    if (secondMatch) {
        if (!meta.description) {
            secondMatch[1].split('\n').forEach(line => {
                const idx = line.indexOf(':');
                if (idx > 0) {
                    const key = line.slice(0, idx).trim();
                    const val = line.slice(idx + 1).trim();
                    if (key === 'description' && val) meta[key] = val;
                }
            });
        }
        content = secondMatch[2];
    }
    return { meta, content };
}

// Workflow metadata with Portuguese descriptions
const workflowMeta = {
    brainstorm: { icon: '💡', category: 'Ideação', command: '/brainstorm', ptDesc: 'Brainstorming estruturado para explorar múltiplas opções antes de implementar. Gera pelo menos 3 abordagens com prós, contras e recomendação final.', color: '#FBBF24' },
    create: { icon: '🏗️', category: 'Construção', command: '/create', ptDesc: 'Cria aplicações do zero — análise de requisitos, planejamento com project-planner, build coordenado com app-builder e preview automático.', color: '#4ADE80' },
    debug: { icon: '🐛', category: 'Manutenção', command: '/debug', ptDesc: 'Investigação sistemática de bugs — coleta informações, forma hipóteses, testa cada uma por eliminação e aplica fix com prevenção.', color: '#F87171' },
    deploy: { icon: '🚀', category: 'DevOps', command: '/deploy', ptDesc: 'Deploy para produção com checklist pré-flight — verifica código, segurança, performance e documentação antes de lançar.', color: '#FB923C' },
    enhance: { icon: '✨', category: 'Construção', command: '/enhance', ptDesc: 'Adiciona funcionalidades em apps existentes — carrega estado do projeto, planeja mudanças, coordena agentes e atualiza preview.', color: '#60A5FA' },
    orchestrate: { icon: '🎯', category: 'Coordenação', command: '/orchestrate', ptDesc: 'Orquestração multi-agente para tarefas complexas — mínimo 3 agentes, fases de planning e implementation, verificação obrigatória.', color: '#C9A962' },
    plan: { icon: '📐', category: 'Gestão', command: '/plan', ptDesc: 'Cria plano de projeto com project-planner — PLAN.md com breakdown de tarefas, agentes responsáveis e checklist de verificação. Sem código.', color: '#C084FC' },
    preview: { icon: '👁️', category: 'DevOps', command: '/preview', ptDesc: 'Gerencia servidor de preview local — start, stop, status, health check e resolução de conflitos de porta automaticamente.', color: '#38BDF8' },
    status: { icon: '📊', category: 'Gestão', command: '/status', ptDesc: 'Mostra status completo do projeto e dos agentes — info do projeto, tech stack, features implementadas, pendências e health do preview.', color: '#86EFAC' },
    test: { icon: '🧪', category: 'Qualidade', command: '/test', ptDesc: 'Geração e execução de testes — analisa código, identifica edge cases, gera testes com AAA pattern e roda suite completa.', color: '#2DD4BF' },
    'ui-ux-pro-max': { icon: '🎨', category: 'Design', command: '/ui-ux-pro-max', ptDesc: 'Design inteligente com 50+ estilos, 95+ paletas de cores, 57 pares de fontes e 99 guidelines UX. Gera design systems completos.', color: '#E879F9' },
};

const categoryOrder = ['Coordenação', 'Construção', 'Design', 'Qualidade', 'Manutenção', 'DevOps', 'Gestão', 'Ideação'];

export default function WorkflowsHub() {
    const [activeTab, setActiveTab] = useState('list');
    const [selectedWorkflow, setSelectedWorkflow] = useState(null);
    const [uploadedWorkflows, setUploadedWorkflows] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeCategory, setActiveCategory] = useState('all');
    const [genDesc, setGenDesc] = useState('');
    const [genLoading, setGenLoading] = useState(false);
    const [genResult, setGenResult] = useState(null);
    const [toast, setToast] = useState({ msg: '', error: false, visible: false });
    const [dragOver, setDragOver] = useState(false);
    const toastTimer = useRef(null);
    const fileInputRef = useRef(null);

    const showToast = useCallback((msg, error = false) => {
        clearTimeout(toastTimer.current);
        setToast({ msg, error, visible: true });
        toastTimer.current = setTimeout(() => setToast(t => ({ ...t, visible: false })), 3000);
    }, []);

    // Parse workflows
    const builtinWorkflows = useMemo(() => {
        return Object.entries(workflowModules)
            .filter(([path]) => !path.includes('desktop.ini'))
            .map(([path, raw]) => {
                const filename = path.split('/').pop().replace('.md', '');
                const { meta, content } = parseFrontmatter(raw);
                const m = workflowMeta[filename] || {};
                return {
                    id: filename, name: filename,
                    description: meta.description || '', ptDesc: m.ptDesc || meta.description || '',
                    command: m.command || `/${filename}`,
                    icon: m.icon || '⚡', color: m.color || '#C9A962', category: m.category || 'Outro',
                    content, source: 'builtin'
                };
            })
            .sort((a, b) => {
                const catA = categoryOrder.indexOf(a.category);
                const catB = categoryOrder.indexOf(b.category);
                if (catA !== catB) return (catA === -1 ? 99 : catA) - (catB === -1 ? 99 : catB);
                return a.name.localeCompare(b.name);
            });
    }, []);

    const allWorkflows = useMemo(() => [...builtinWorkflows, ...uploadedWorkflows], [builtinWorkflows, uploadedWorkflows]);

    const filteredWorkflows = useMemo(() => {
        return allWorkflows.filter(wf => {
            const matchesSearch = !searchQuery ||
                wf.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                wf.ptDesc.toLowerCase().includes(searchQuery.toLowerCase()) ||
                wf.command.toLowerCase().includes(searchQuery.toLowerCase()) ||
                wf.category.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesCategory = activeCategory === 'all' || wf.category === activeCategory;
            return matchesSearch && matchesCategory;
        });
    }, [allWorkflows, searchQuery, activeCategory]);

    const categories = useMemo(() => {
        const cats = [...new Set(allWorkflows.map(w => w.category))];
        return cats.sort((a, b) => (categoryOrder.indexOf(a) === -1 ? 99 : categoryOrder.indexOf(a)) - (categoryOrder.indexOf(b) === -1 ? 99 : categoryOrder.indexOf(b)));
    }, [allWorkflows]);

    // Drag & drop import
    const handleFileDrop = useCallback((e) => {
        e.preventDefault();
        setDragOver(false);
        const files = Array.from(e.dataTransfer?.files || e.target?.files || []);
        files.forEach(file => {
            if (!file.name.endsWith('.md')) { showToast('Apenas arquivos .md são aceitos', true); return; }
            const reader = new FileReader();
            reader.onload = (ev) => {
                const raw = ev.target.result;
                const { meta, content } = parseFrontmatter(raw);
                const name = meta.name || file.name.replace('.md', '');
                setUploadedWorkflows(prev => [...prev, {
                    id: `uploaded-${Date.now()}-${name}`, name,
                    description: meta.description || 'Workflow customizado',
                    ptDesc: meta.description || 'Workflow importado pelo usuário',
                    command: `/${name}`,
                    icon: '📦', color: '#C9A962', category: 'Importado',
                    content, source: 'uploaded'
                }]);
                showToast(`Workflow "${name}" importado!`);
            };
            reader.readAsText(file);
        });
    }, [showToast]);

    // Generate workflow with Claude
    const handleGenerate = async () => {
        if (!genDesc.trim()) return;
        setGenLoading(true); setGenResult(null);
        try {
            const markdown = await generateWorkflow(genDesc);
            setGenResult(markdown);
            showToast('Workflow gerado com sucesso!');
        } catch (err) {
            console.error('[Claude] Error:', err);
            showToast(`Erro: ${err.message}`, true);
        } finally { setGenLoading(false); }
    };

    const addGeneratedWorkflow = () => {
        if (!genResult) return;
        const { meta, content } = parseFrontmatter(genResult);
        const name = meta.name || 'novo-workflow';
        setUploadedWorkflows(prev => [...prev, {
            id: `gen-${Date.now()}`, name,
            description: meta.description || '', ptDesc: meta.description || 'Workflow gerado por IA',
            command: `/${name}`,
            icon: '🧠', color: '#4ADE80', category: 'Gerado',
            content, source: 'generated'
        }]);
        showToast(`Workflow "${name}" adicionado!`);
        setGenResult(null); setGenDesc(''); setActiveTab('list');
    };

    const downloadGenerated = () => {
        if (!genResult) return;
        const { meta } = parseFrontmatter(genResult);
        const name = meta.name || 'novo-workflow';
        const blob = new Blob([genResult], { type: 'text/markdown' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = `${name}.md`;
        document.body.appendChild(a); a.click();
        document.body.removeChild(a); URL.revokeObjectURL(url);
        showToast('Download iniciado!');
    };

    return (
        <div className="agents-page">
            {/* Hero */}
            <div className="agents-hero">
                <div className="agents-hero-content">
                    <div className="agents-hero-badge">Automações</div>
                    <h1 className="agents-hero-title">
                        Workflows<br />
                        <span className="agents-hero-accent">& Comandos</span>
                    </h1>
                    <p className="agents-hero-desc">
                        {allWorkflows.length} workflows que automatizam processos complexos.
                        Cada um é um comando que aciona agentes, scripts e checklists.
                    </p>
                </div>
                <div className="agents-hero-stats">
                    <div className="agents-hero-stat">
                        <span className="agents-hero-stat-value">{builtinWorkflows.length}</span>
                        <span className="agents-hero-stat-label">Built-in</span>
                    </div>
                    <div className="agents-hero-stat-divider" />
                    <div className="agents-hero-stat">
                        <span className="agents-hero-stat-value">{uploadedWorkflows.length}</span>
                        <span className="agents-hero-stat-label">Custom</span>
                    </div>
                    <div className="agents-hero-stat-divider" />
                    <div className="agents-hero-stat">
                        <span className="agents-hero-stat-value">{categories.length}</span>
                        <span className="agents-hero-stat-label">Categorias</span>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="agents-tabs">
                {[
                    { id: 'list', label: 'Meus Workflows', icon: '⚡' },
                    { id: 'upload', label: 'Importar', icon: '📦' },
                    { id: 'generate', label: 'Gerar com IA', icon: '✨' },
                ].map(tab => (
                    <button key={tab.id} className={`agents-tab ${activeTab === tab.id ? 'active' : ''}`} onClick={() => setActiveTab(tab.id)}>
                        <span className="agents-tab-icon">{tab.icon}</span>
                        {tab.label}
                        {tab.id === 'list' && <span className="agents-tab-count">{allWorkflows.length}</span>}
                    </button>
                ))}
            </div>

            {/* Tab: List */}
            {activeTab === 'list' && (
                <div>
                    <div className="agents-toolbar">
                        <div className="agents-search">
                            <SearchIcon />
                            <input type="text" placeholder="Buscar workflow por nome, comando ou descrição..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                        </div>
                        <div className="agents-filters">
                            <button className={`agents-filter-chip ${activeCategory === 'all' ? 'active' : ''}`} onClick={() => setActiveCategory('all')}>Todos</button>
                            {categories.map(cat => (
                                <button key={cat} className={`agents-filter-chip ${activeCategory === cat ? 'active' : ''}`} onClick={() => setActiveCategory(cat)}>{cat}</button>
                            ))}
                        </div>
                    </div>

                    <div className="agents-grid">
                        {filteredWorkflows.map((wf, i) => (
                            <div key={wf.id} className="agent-card-v2" onClick={() => setSelectedWorkflow(wf)} style={{ '--agent-color': wf.color, '--delay': `${i * 60}ms` }}>
                                <div className="agent-card-v2-top">
                                    <div className="agent-card-v2-icon" style={{ color: wf.color }}>{wf.icon}</div>
                                    <span className="agent-card-v2-category">{wf.category}</span>
                                </div>
                                <h3 className="agent-card-v2-name">{wf.name}</h3>
                                <div className="workflow-command"><code>{wf.command}</code></div>
                                <p className="agent-card-v2-desc">{wf.ptDesc}</p>
                                <div className="agent-card-v2-footer">
                                    <span className="agent-card-v2-cta">Ver detalhes ↗</span>
                                    {wf.source !== 'builtin' && (
                                        <span className="agent-card-v2-badge" style={{
                                            color: wf.source === 'generated' ? 'var(--success)' : 'var(--info)',
                                            background: wf.source === 'generated' ? 'rgba(74,222,128,0.12)' : 'rgba(96,165,250,0.12)'
                                        }}>{wf.source === 'generated' ? 'gerado' : 'importado'}</span>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>

                    {filteredWorkflows.length === 0 && (
                        <div className="agents-empty"><span className="agents-empty-icon">🔍</span><p>Nenhum workflow encontrado para "{searchQuery}"</p></div>
                    )}
                </div>
            )}

            {/* Tab: Upload */}
            {activeTab === 'upload' && (
                <div>
                    <div className="agents-upload-intro">
                        <h2>Importar Workflow</h2>
                        <p>Arraste um arquivo <code>.md</code> de workflow com frontmatter YAML ou clique para selecionar.</p>
                    </div>
                    <div className={`agents-dropzone ${dragOver ? 'drag-over' : ''}`}
                        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                        onDragLeave={() => setDragOver(false)}
                        onDrop={handleFileDrop}
                        onClick={() => fileInputRef.current?.click()}
                    >
                        <div className="agents-dropzone-visual">
                            <div className="agents-dropzone-ring"><span>📄</span></div>
                        </div>
                        <div className="agents-dropzone-text">
                            <strong>Solte o arquivo aqui</strong>
                            <span>ou clique para selecionar</span>
                        </div>
                        <div className="agents-dropzone-hint">Aceita arquivos .md com frontmatter YAML (description)</div>
                        <input ref={fileInputRef} type="file" accept=".md" multiple style={{ display: 'none' }} onChange={handleFileDrop} />
                    </div>
                    {uploadedWorkflows.length > 0 && (
                        <div style={{ marginTop: '2.5rem' }}>
                            <h3 style={{ fontFamily: 'var(--font-heading)', marginBottom: '1rem', fontSize: '1.15rem' }}>
                                Workflows Importados ({uploadedWorkflows.length})
                            </h3>
                            <div className="agents-grid">
                                {uploadedWorkflows.map((wf, i) => (
                                    <div key={wf.id} className="agent-card-v2" onClick={() => setSelectedWorkflow(wf)} style={{ '--agent-color': wf.color, '--delay': `${i * 60}ms` }}>
                                        <div className="agent-card-v2-top">
                                            <div className="agent-card-v2-icon" style={{ color: wf.color }}>{wf.icon}</div>
                                            <span className="agent-card-v2-category">{wf.category}</span>
                                        </div>
                                        <h3 className="agent-card-v2-name">{wf.name}</h3>
                                        <div className="workflow-command"><code>{wf.command}</code></div>
                                        <p className="agent-card-v2-desc">{wf.ptDesc}</p>
                                        <div className="agent-card-v2-footer"><span className="agent-card-v2-cta">Ver detalhes ↗</span></div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Tab: Generate with Claude */}
            {activeTab === 'generate' && (
                <div>
                    <div className="agents-generate-intro">
                        <div className="agents-generate-badge"><span>✦</span> Claude Opus 4.6</div>
                        <h2>Criar Workflow com IA</h2>
                        <p>Descreva o workflow que você precisa. O Claude Opus 4.6 vai gerar um workflow completo com steps, sub-comandos, output format e exemplos de uso.</p>
                    </div>
                    <div className="agents-generate-form">
                        <textarea rows="6"
                            placeholder="Ex: Quero um workflow /migrate que automatize a migração de banco de dados — gera migration files, roda testes, faz backup antes e verifica integridade depois..."
                            value={genDesc} onChange={(e) => setGenDesc(e.target.value)} className="agents-generate-input"
                        />
                        <button className="btn-primary btn-full" onClick={handleGenerate} disabled={genLoading || !genDesc.trim()}>
                            {genLoading ? <><span className="loading-spinner-sm" /> Criando workflow com Claude Opus 4.6...</> : '✦ Gerar Workflow Automatizado'}
                        </button>
                    </div>
                    {genLoading && (
                        <div className="agents-gen-loading">
                            <div className="agents-gen-loading-orbit"><div className="agents-gen-loading-dot" /><div className="agents-gen-loading-dot" /><div className="agents-gen-loading-dot" /></div>
                            <p>Claude Opus 4.6 está desenhando seu workflow...</p>
                            <span>Isso pode levar até 30 segundos</span>
                        </div>
                    )}
                    {genResult && (
                        <div className="agents-gen-result">
                            <div className="agents-gen-result-header">
                                <h3>🧠 Workflow Gerado</h3>
                                <div className="agents-gen-result-actions">
                                    <button className="btn-secondary" onClick={downloadGenerated}>⬇ Baixar .md</button>
                                    <button className="btn-primary" onClick={addGeneratedWorkflow}>+ Adicionar aos Meus Workflows</button>
                                </div>
                            </div>
                            <div className="agents-gen-result-body">
                                <ReactMarkdown remarkPlugins={[remarkGfm]}>{genResult}</ReactMarkdown>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Workflow Detail Modal */}
            {selectedWorkflow && (
                <div className="agent-modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setSelectedWorkflow(null); }}>
                    <div className="agent-modal">
                        <div className="agent-modal-header">
                            <div className="agent-modal-header-left">
                                <span className="agent-modal-icon" style={{ color: selectedWorkflow.color }}>{selectedWorkflow.icon}</span>
                                <div>
                                    <h2>{selectedWorkflow.name}</h2>
                                    <span className="agent-modal-category">{selectedWorkflow.category} · <code style={{ color: 'var(--accent-light)', fontSize: '0.65rem' }}>{selectedWorkflow.command}</code></span>
                                </div>
                            </div>
                            <button className="agent-modal-close" onClick={() => setSelectedWorkflow(null)}><CloseIcon /></button>
                        </div>
                        <div className="agent-modal-summary"><p>{selectedWorkflow.ptDesc}</p></div>
                        <div className="agent-modal-body">
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>{selectedWorkflow.content}</ReactMarkdown>
                        </div>
                    </div>
                </div>
            )}

            {/* Toast */}
            <div className={`toast ${toast.visible ? 'visible' : ''} ${toast.error ? 'error' : ''}`}>{toast.msg}</div>
        </div>
    );
}

function SearchIcon() {
    return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
        </svg>
    );
}

function CloseIcon() {
    return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M18 6L6 18" /><path d="M6 6l12 12" />
        </svg>
    );
}
