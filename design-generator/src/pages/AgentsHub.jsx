import { useState, useMemo, useCallback, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { generateAgent } from '../services/claude';

// Import all agent files at build time
const agentModules = import.meta.glob('../../../.agent/agents/*.md', { query: '?raw', import: 'default', eager: true });

// Parse YAML frontmatter
function parseFrontmatter(raw) {
    const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
    if (!match) return { meta: {}, content: raw };
    const yamlStr = match[1];
    const content = match[2];
    const meta = {};
    yamlStr.split('\n').forEach(line => {
        const idx = line.indexOf(':');
        if (idx > 0) {
            const key = line.slice(0, idx).trim();
            const val = line.slice(idx + 1).trim();
            meta[key] = val;
        }
    });
    return { meta, content };
}

// Agent metadata with Portuguese descriptions, icons, and categories
const agentMeta = {
    orchestrator: {
        icon: '🎯',
        category: 'Coordenação',
        ptDesc: 'O maestro dos agentes. Coordena múltiplos especialistas para tarefas complexas, decompondo problemas em subtarefas e sintetizando resultados em um relatório unificado.',
        color: '#C9A962'
    },
    debugger: {
        icon: '🐛',
        category: 'Diagnóstico',
        ptDesc: 'Especialista em análise de causa-raiz. Investiga bugs de forma sistemática com a técnica dos 5 Porquês, sem adivinhações — segue evidências até encontrar a origem real do problema.',
        color: '#F87171'
    },
    'frontend-specialist': {
        icon: '🎨',
        category: 'Desenvolvimento',
        ptDesc: 'Arquiteto Frontend Senior de React/Next.js. Constrói interfaces visuais com foco em performance, acessibilidade e design system. Proíbe clichês de design e prioriza originalidade.',
        color: '#60A5FA'
    },
    'backend-specialist': {
        icon: '⚙️',
        category: 'Desenvolvimento',
        ptDesc: 'Especialista em arquitetura de backend — APIs REST, GraphQL, bancos de dados, autenticação e lógica de servidor. Garante segurança, escalabilidade e boas práticas.',
        color: '#4ADE80'
    },
    'mobile-developer': {
        icon: '📱',
        category: 'Desenvolvimento',
        ptDesc: 'Desenvolvedor de apps mobile com React Native e Flutter. Foca em UX nativa, performance mobile e padrões de design específicos para iOS e Android.',
        color: '#A78BFA'
    },
    'security-auditor': {
        icon: '🔒',
        category: 'Segurança',
        ptDesc: 'Auditor de segurança que analisa vulnerabilidades usando OWASP como referência. Revisa autenticação, autorização, injeções e vazamento de dados com rigor profissional.',
        color: '#FBBF24'
    },
    'penetration-tester': {
        icon: '🛡️',
        category: 'Segurança',
        ptDesc: 'Testador de invasão (red team). Simula ataques reais para encontrar vulnerabilidades antes que invasores encontrem. Teste ativo, não apenas revisão de código.',
        color: '#FB923C'
    },
    'database-architect': {
        icon: '🗄️',
        category: 'Dados',
        ptDesc: 'Arquiteto de bancos de dados — Prisma, migrations, otimização de queries. Projeta schemas eficientes, indexação inteligente e garante integridade dos dados.',
        color: '#34D399'
    },
    'devops-engineer': {
        icon: '🚀',
        category: 'Infraestrutura',
        ptDesc: 'Engenheiro DevOps que gerencia deploy, CI/CD, monitoramento e infraestrutura. Automatiza pipelines e garante que o software chegue à produção com confiança.',
        color: '#38BDF8'
    },
    'project-planner': {
        icon: '📋',
        category: 'Gestão',
        ptDesc: 'Planejador de projetos que usa metodologia de 4 fases: Análise → Planejamento → Solução → Implementação. Cria roadmaps, divide tarefas e define milestones.',
        color: '#C084FC'
    },
    'game-developer': {
        icon: '🎮',
        category: 'Desenvolvimento',
        ptDesc: 'Desenvolvedor de jogos com experiência em Unity, Godot, Unreal e Phaser. Implementa game loops, sistemas de física, multiplayer e lógica de gameplay.',
        color: '#F472B6'
    },
    'performance-optimizer': {
        icon: '⚡',
        category: 'Qualidade',
        ptDesc: 'Otimizador de performance que mede antes de mexer. Perfila gargalos, cache strategies, bundle size e Core Web Vitals para garantir velocidade máxima.',
        color: '#FACC15'
    },
    'test-engineer': {
        icon: '🧪',
        category: 'Qualidade',
        ptDesc: 'Engenheiro de testes que segue a pirâmide Unit > Integration > E2E. Escreve testes com padrão AAA (Arrange/Act/Assert) e prioriza cobertura crítica.',
        color: '#2DD4BF'
    },
    'qa-automation-engineer': {
        icon: '✅',
        category: 'Qualidade',
        ptDesc: 'Engenheiro de automação QA focado em testes end-to-end com Playwright, Cypress e Selenium. Garante que fluxos completos do usuário funcionem corretamente.',
        color: '#86EFAC'
    },
    'product-manager': {
        icon: '📊',
        category: 'Gestão',
        ptDesc: 'Gerente de produto que prioriza funcionalidades baseado em impacto, define métricas de sucesso e alinha visão do produto com necessidades reais dos usuários.',
        color: '#FDA4AF'
    },
    'product-owner': {
        icon: '👤',
        category: 'Gestão',
        ptDesc: 'Dono do produto que gerencia backlog, define critérios de aceitação e prioriza entregas. Ponte entre stakeholders e time de desenvolvimento.',
        color: '#D8B4FE'
    },
    'seo-specialist': {
        icon: '🔍',
        category: 'Marketing',
        ptDesc: 'Especialista SEO que otimiza meta tags, heading structure, dados estruturados e performance de carregamento para máxima visibilidade nos mecanismos de busca.',
        color: '#67E8F9'
    },
    'documentation-writer': {
        icon: '📝',
        category: 'Comunicação',
        ptDesc: 'Escritor técnico que cria documentação clara e objetiva — READMEs, guias de API, comentários de código e wikis de projeto.',
        color: '#A3E635'
    },
    'explorer-agent': {
        icon: '🔭',
        category: 'Descoberta',
        ptDesc: 'Agente explorador que mapeia a estrutura do codebase, identifica dependências, encontra arquivos e entende a arquitetura existente antes de qualquer mudança.',
        color: '#E879F9'
    },
    'code-archaeologist': {
        icon: '🏛️',
        category: 'Descoberta',
        ptDesc: 'Arqueólogo de código que escava código legado, entende decisões históricas, documenta padrões antigos e identifica dívida técnica acumulada.',
        color: '#FCA5A5'
    },
};

// Category order for grouping
const categoryOrder = ['Coordenação', 'Desenvolvimento', 'Segurança', 'Qualidade', 'Dados', 'Infraestrutura', 'Gestão', 'Marketing', 'Descoberta', 'Comunicação'];

export default function AgentsHub() {
    const [activeTab, setActiveTab] = useState('list');
    const [selectedAgent, setSelectedAgent] = useState(null);
    const [uploadedAgents, setUploadedAgents] = useState([]);
    const [genDesc, setGenDesc] = useState('');
    const [genLoading, setGenLoading] = useState(false);
    const [genResult, setGenResult] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeCategory, setActiveCategory] = useState('all');
    const [toast, setToast] = useState({ msg: '', error: false, visible: false });
    const toastTimer = useRef(null);

    const showToast = useCallback((msg, error = false) => {
        clearTimeout(toastTimer.current);
        setToast({ msg, error, visible: true });
        toastTimer.current = setTimeout(() => setToast(t => ({ ...t, visible: false })), 3000);
    }, []);

    // Parse built-in agents
    const builtinAgents = useMemo(() => {
        return Object.entries(agentModules)
            .filter(([path]) => !path.includes('desktop.ini'))
            .map(([path, raw]) => {
                const filename = path.split('/').pop().replace('.md', '');
                const { meta, content } = parseFrontmatter(raw);
                const m = agentMeta[filename] || {};
                return {
                    id: filename,
                    name: meta.name || filename,
                    description: meta.description || '',
                    ptDesc: m.ptDesc || meta.description || '',
                    skills: meta.skills ? meta.skills.split(',').map(s => s.trim()) : [],
                    tools: meta.tools ? meta.tools.split(',').map(s => s.trim()) : [],
                    icon: m.icon || '🤖',
                    color: m.color || '#C9A962',
                    category: m.category || 'Outro',
                    content,
                    source: 'builtin'
                };
            })
            .sort((a, b) => {
                const catA = categoryOrder.indexOf(a.category);
                const catB = categoryOrder.indexOf(b.category);
                if (catA !== catB) return catA - catB;
                return a.name.localeCompare(b.name);
            });
    }, []);

    const allAgents = useMemo(() => [...builtinAgents, ...uploadedAgents], [builtinAgents, uploadedAgents]);

    // Filter agents
    const filteredAgents = useMemo(() => {
        return allAgents.filter(agent => {
            const matchesSearch = !searchQuery ||
                agent.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                agent.ptDesc.toLowerCase().includes(searchQuery.toLowerCase()) ||
                agent.category.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesCategory = activeCategory === 'all' || agent.category === activeCategory;
            return matchesSearch && matchesCategory;
        });
    }, [allAgents, searchQuery, activeCategory]);

    // Categories for filter
    const categories = useMemo(() => {
        const cats = [...new Set(allAgents.map(a => a.category))];
        return cats.sort((a, b) => categoryOrder.indexOf(a) - categoryOrder.indexOf(b));
    }, [allAgents]);

    // Drag & drop
    const [dragOver, setDragOver] = useState(false);
    const fileInputRef = useRef(null);

    const handleFileDrop = useCallback((e) => {
        e.preventDefault();
        setDragOver(false);
        const files = Array.from(e.dataTransfer?.files || e.target?.files || []);
        files.forEach(file => {
            if (!file.name.endsWith('.md')) {
                showToast('Apenas arquivos .md são aceitos', true);
                return;
            }
            const reader = new FileReader();
            reader.onload = (ev) => {
                const raw = ev.target.result;
                const { meta, content } = parseFrontmatter(raw);
                const name = meta.name || file.name.replace('.md', '');
                setUploadedAgents(prev => [...prev, {
                    id: `uploaded-${Date.now()}-${name}`,
                    name,
                    description: meta.description || 'Agente customizado',
                    ptDesc: meta.description || 'Agente importado pelo usuário',
                    skills: meta.skills ? meta.skills.split(',').map(s => s.trim()) : [],
                    tools: meta.tools ? meta.tools.split(',').map(s => s.trim()) : [],
                    icon: '📦',
                    color: '#C9A962',
                    category: 'Importado',
                    content,
                    source: 'uploaded'
                }]);
                showToast(`Agente "${name}" adicionado!`);
            };
            reader.readAsText(file);
        });
    }, [showToast]);

    // Generate agent with Claude
    const handleGenerate = async () => {
        if (!genDesc.trim()) return;
        setGenLoading(true);
        setGenResult(null);
        try {
            const markdown = await generateAgent(genDesc);
            setGenResult(markdown);
            showToast('Agente gerado com sucesso!');
        } catch (err) {
            console.error('[Claude] Error:', err);
            showToast(`Erro: ${err.message}`, true);
        } finally {
            setGenLoading(false);
        }
    };

    const addGeneratedAgent = () => {
        if (!genResult) return;
        const { meta, content } = parseFrontmatter(genResult);
        const name = meta.name || 'novo-agente';
        setUploadedAgents(prev => [...prev, {
            id: `gen-${Date.now()}`,
            name,
            description: meta.description || '',
            ptDesc: meta.description || 'Agente gerado por IA',
            skills: meta.skills ? meta.skills.split(',').map(s => s.trim()) : [],
            tools: meta.tools ? meta.tools.split(',').map(s => s.trim()) : [],
            icon: '🧠',
            color: '#4ADE80',
            category: 'Gerado',
            content,
            source: 'generated'
        }]);
        showToast(`Agente "${name}" adicionado!`);
        setGenResult(null);
        setGenDesc('');
        setActiveTab('list');
    };

    const downloadGenerated = () => {
        if (!genResult) return;
        const { meta } = parseFrontmatter(genResult);
        const name = meta.name || 'novo-agente';
        const blob = new Blob([genResult], { type: 'text/markdown' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${name}.md`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        showToast('Download iniciado!');
    };

    return (
        <div className="agents-page">
            {/* Hero */}
            <div className="agents-hero">
                <div className="agents-hero-content">
                    <div className="agents-hero-badge">Hub de Agentes</div>
                    <h1 className="agents-hero-title">
                        Seus Agentes<br />
                        <span className="agents-hero-accent">Especializados</span>
                    </h1>
                    <p className="agents-hero-desc">
                        {allAgents.length} agentes prontos para automatizar, analisar e construir.
                        Cada um domina seu campo — do frontend ao pentest.
                    </p>
                </div>
                <div className="agents-hero-stats">
                    <div className="agents-hero-stat">
                        <span className="agents-hero-stat-value">{builtinAgents.length}</span>
                        <span className="agents-hero-stat-label">Built-in</span>
                    </div>
                    <div className="agents-hero-stat-divider" />
                    <div className="agents-hero-stat">
                        <span className="agents-hero-stat-value">{uploadedAgents.length}</span>
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
                    { id: 'list', label: 'Meus Agentes', icon: '🤖' },
                    { id: 'upload', label: 'Importar', icon: '📦' },
                    { id: 'generate', label: 'Gerar com IA', icon: '✨' },
                ].map(tab => (
                    <button
                        key={tab.id}
                        className={`agents-tab ${activeTab === tab.id ? 'active' : ''}`}
                        onClick={() => setActiveTab(tab.id)}
                    >
                        <span className="agents-tab-icon">{tab.icon}</span>
                        {tab.label}
                        {tab.id === 'list' && <span className="agents-tab-count">{allAgents.length}</span>}
                    </button>
                ))}
            </div>

            {/* Tab: List */}
            {activeTab === 'list' && (
                <div>
                    {/* Search & Filter bar */}
                    <div className="agents-toolbar">
                        <div className="agents-search">
                            <SearchIcon />
                            <input
                                type="text"
                                placeholder="Buscar agente por nome, descrição ou categoria..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                        <div className="agents-filters">
                            <button
                                className={`agents-filter-chip ${activeCategory === 'all' ? 'active' : ''}`}
                                onClick={() => setActiveCategory('all')}
                            >
                                Todos
                            </button>
                            {categories.map(cat => (
                                <button
                                    key={cat}
                                    className={`agents-filter-chip ${activeCategory === cat ? 'active' : ''}`}
                                    onClick={() => setActiveCategory(cat)}
                                >
                                    {cat}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Agent Grid */}
                    <div className="agents-grid">
                        {filteredAgents.map((agent, i) => (
                            <div
                                key={agent.id}
                                className="agent-card-v2"
                                onClick={() => setSelectedAgent(agent)}
                                style={{ '--agent-color': agent.color, '--delay': `${i * 60}ms` }}
                            >
                                <div className="agent-card-v2-top">
                                    <div className="agent-card-v2-icon" style={{ color: agent.color }}>
                                        {agent.icon}
                                    </div>
                                    <span className="agent-card-v2-category">{agent.category}</span>
                                </div>
                                <h3 className="agent-card-v2-name">{agent.name}</h3>
                                <p className="agent-card-v2-desc">{agent.ptDesc}</p>
                                {agent.skills.length > 0 && (
                                    <div className="agent-card-v2-skills">
                                        {agent.skills.slice(0, 4).map(skill => (
                                            <span key={skill} className="agent-card-v2-skill">{skill}</span>
                                        ))}
                                        {agent.skills.length > 4 && (
                                            <span className="agent-card-v2-skill agent-card-v2-skill-more">+{agent.skills.length - 4}</span>
                                        )}
                                    </div>
                                )}
                                <div className="agent-card-v2-footer">
                                    <span className="agent-card-v2-cta">Explorar ↗</span>
                                    {agent.source !== 'builtin' && (
                                        <span className="agent-card-v2-badge" style={{
                                            color: agent.source === 'generated' ? 'var(--success)' : 'var(--info)',
                                            background: agent.source === 'generated' ? 'rgba(74,222,128,0.12)' : 'rgba(96,165,250,0.12)'
                                        }}>
                                            {agent.source === 'generated' ? 'gerado' : 'importado'}
                                        </span>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>

                    {filteredAgents.length === 0 && (
                        <div className="agents-empty">
                            <span className="agents-empty-icon">🔍</span>
                            <p>Nenhum agente encontrado para "{searchQuery}"</p>
                        </div>
                    )}
                </div>
            )}

            {/* Tab: Upload */}
            {activeTab === 'upload' && (
                <div>
                    <div className="agents-upload-intro">
                        <h2>Importar Agente</h2>
                        <p>Arraste um arquivo <code>.md</code> com frontmatter YAML ou clique para selecionar.</p>
                    </div>

                    <div
                        className={`agents-dropzone ${dragOver ? 'drag-over' : ''}`}
                        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                        onDragLeave={() => setDragOver(false)}
                        onDrop={handleFileDrop}
                        onClick={() => fileInputRef.current?.click()}
                    >
                        <div className="agents-dropzone-visual">
                            <div className="agents-dropzone-ring">
                                <span>📄</span>
                            </div>
                        </div>
                        <div className="agents-dropzone-text">
                            <strong>Solte o arquivo aqui</strong>
                            <span>ou clique para selecionar</span>
                        </div>
                        <div className="agents-dropzone-hint">Aceita arquivos .md com frontmatter YAML (name, description, skills)</div>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept=".md"
                            multiple
                            style={{ display: 'none' }}
                            onChange={handleFileDrop}
                        />
                    </div>

                    {uploadedAgents.length > 0 && (
                        <div style={{ marginTop: '2.5rem' }}>
                            <h3 style={{ fontFamily: 'var(--font-heading)', marginBottom: '1rem', fontSize: '1.15rem' }}>
                                Agentes Importados ({uploadedAgents.length})
                            </h3>
                            <div className="agents-grid">
                                {uploadedAgents.map((agent, i) => (
                                    <div
                                        key={agent.id}
                                        className="agent-card-v2"
                                        onClick={() => setSelectedAgent(agent)}
                                        style={{ '--agent-color': agent.color, '--delay': `${i * 60}ms` }}
                                    >
                                        <div className="agent-card-v2-top">
                                            <div className="agent-card-v2-icon" style={{ color: agent.color }}>{agent.icon}</div>
                                            <span className="agent-card-v2-category">{agent.category}</span>
                                        </div>
                                        <h3 className="agent-card-v2-name">{agent.name}</h3>
                                        <p className="agent-card-v2-desc">{agent.ptDesc}</p>
                                        <div className="agent-card-v2-footer">
                                            <span className="agent-card-v2-cta">Explorar ↗</span>
                                        </div>
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
                        <div className="agents-generate-badge">
                            <span>✦</span> Claude Opus 4.6
                        </div>
                        <h2>Criar Agente com IA</h2>
                        <p>Descreva o agente que você precisa. O Claude Opus 4.6 vai gerar um agente profissional,
                            detalhado e pronto para uso, seguindo o mesmo padrão dos agentes existentes.</p>
                    </div>

                    <div className="agents-generate-form">
                        <textarea
                            rows="6"
                            placeholder="Ex: Quero um agente especialista em email marketing que crie sequências de emails persuasivos para infoprodutos, usando gatilhos mentais e storytelling bíblico com tom de autoridade..."
                            value={genDesc}
                            onChange={(e) => setGenDesc(e.target.value)}
                            className="agents-generate-input"
                        />
                        <button
                            className="btn-primary btn-full"
                            onClick={handleGenerate}
                            disabled={genLoading || !genDesc.trim()}
                        >
                            {genLoading
                                ? <><span className="loading-spinner-sm" /> Criando agente com Claude Opus 4.6...</>
                                : '✦ Gerar Agente Especializado'
                            }
                        </button>
                    </div>

                    {genLoading && (
                        <div className="agents-gen-loading">
                            <div className="agents-gen-loading-orbit">
                                <div className="agents-gen-loading-dot" />
                                <div className="agents-gen-loading-dot" />
                                <div className="agents-gen-loading-dot" />
                            </div>
                            <p>Claude Opus 4.6 está arquitetando seu agente...</p>
                            <span>Isso pode levar até 30 segundos</span>
                        </div>
                    )}

                    {genResult && (
                        <div className="agents-gen-result">
                            <div className="agents-gen-result-header">
                                <h3>🧠 Agente Gerado</h3>
                                <div className="agents-gen-result-actions">
                                    <button className="btn-secondary" onClick={downloadGenerated}>⬇ Baixar .md</button>
                                    <button className="btn-primary" onClick={addGeneratedAgent}>+ Adicionar aos Meus Agentes</button>
                                </div>
                            </div>
                            <div className="agents-gen-result-body">
                                <ReactMarkdown remarkPlugins={[remarkGfm]}>{genResult}</ReactMarkdown>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Agent Detail Modal */}
            {selectedAgent && (
                <div className="agent-modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setSelectedAgent(null); }}>
                    <div className="agent-modal">
                        <div className="agent-modal-header">
                            <div className="agent-modal-header-left">
                                <span className="agent-modal-icon" style={{ color: selectedAgent.color }}>{selectedAgent.icon}</span>
                                <div>
                                    <h2>{selectedAgent.name}</h2>
                                    <span className="agent-modal-category">{selectedAgent.category}</span>
                                </div>
                            </div>
                            <button className="agent-modal-close" onClick={() => setSelectedAgent(null)}>
                                <CloseIcon />
                            </button>
                        </div>

                        <div className="agent-modal-summary">
                            <p>{selectedAgent.ptDesc}</p>
                        </div>

                        {selectedAgent.skills.length > 0 && (
                            <div className="agent-modal-meta">
                                <span className="agent-modal-meta-label">Skills</span>
                                <div className="agent-modal-skills">
                                    {selectedAgent.skills.map(skill => (
                                        <span key={skill} className="agent-card-v2-skill">{skill}</span>
                                    ))}
                                </div>
                            </div>
                        )}

                        {selectedAgent.tools.length > 0 && (
                            <div className="agent-modal-meta">
                                <span className="agent-modal-meta-label">Tools</span>
                                <div className="agent-modal-skills">
                                    {selectedAgent.tools.map(tool => (
                                        <span key={tool} className="agent-card-v2-skill" style={{ background: 'rgba(201,169,98,0.1)', color: 'var(--accent)' }}>{tool}</span>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="agent-modal-body">
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>{selectedAgent.content}</ReactMarkdown>
                        </div>
                    </div>
                </div>
            )}

            {/* Toast */}
            <div className={`toast ${toast.visible ? 'visible' : ''} ${toast.error ? 'error' : ''}`}>
                {toast.msg}
            </div>
        </div>
    );
}

// Icons
function SearchIcon() {
    return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <circle cx="11" cy="11" r="8" />
            <path d="M21 21l-4.35-4.35" />
        </svg>
    );
}

function CloseIcon() {
    return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M18 6L6 18" />
            <path d="M6 6l12 12" />
        </svg>
    );
}
