import { useState, useMemo, useCallback, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { generateSkill } from '../services/claude';

// Import all SKILL.md files at build time
const skillModules = import.meta.glob('../../../.agent/skills/*/SKILL.md', { query: '?raw', import: 'default', eager: true });

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

// Skill metadata with Portuguese descriptions, icons, and categories
const skillMeta = {
    'api-patterns': { icon: '🔌', category: 'Backend', ptDesc: 'Padrões para design de APIs RESTful — endpoints, versionamento, tratamento de erros, paginação e boas práticas de respostas HTTP.', color: '#60A5FA' },
    'app-builder': { icon: '🏗️', category: 'Construção', ptDesc: 'Kit completo para criação de aplicações do zero — scaffolding, estrutura de projeto, coordenação de agentes e fluxo de build.', color: '#34D399' },
    'architecture': { icon: '🏛️', category: 'Arquitetura', ptDesc: 'Princípios de arquitetura de software — patterns como MVC, Clean Architecture, microserviços e decisões de design de sistemas.', color: '#C9A962' },
    'bash-linux': { icon: '🐧', category: 'DevOps', ptDesc: 'Comandos bash e administração Linux — scripting, permissões, gerenciamento de processos e automação de tarefas do servidor.', color: '#A3E635' },
    'behavioral-modes': { icon: '🎭', category: 'IA', ptDesc: 'Modos comportamentais dos agentes IA — plan, edit, ask. Define como cada agente se comporta em diferentes contextos de trabalho.', color: '#F472B6' },
    'brainstorming': { icon: '💡', category: 'Criatividade', ptDesc: 'Framework de brainstorming estruturado — exploração de opções, análise de trade-offs e recomendações com prós e contras.', color: '#FBBF24' },
    'clean-code': { icon: '✨', category: 'Qualidade', ptDesc: 'Padrões pragmáticos de código limpo — SRP, DRY, KISS, YAGNI. Funções pequenas, nomes reveladores e zero comentários desnecessários.', color: '#2DD4BF' },
    'code-review-checklist': { icon: '📋', category: 'Qualidade', ptDesc: 'Checklist completo para revisão de código — legibilidade, segurança, performance, testes e conformidade com padrões.', color: '#86EFAC' },
    'database-design': { icon: '🗄️', category: 'Backend', ptDesc: 'Design de bancos de dados — normalização, indexação, migrations, Prisma schema e otimização de queries SQL/NoSQL.', color: '#38BDF8' },
    'deployment-procedures': { icon: '🚀', category: 'DevOps', ptDesc: 'Procedimentos de deploy em 5 fases — checklist pré-deploy, build, rollback, monitoramento e verificação pós-deploy.', color: '#FB923C' },
    'documentation-templates': { icon: '📝', category: 'Comunicação', ptDesc: 'Templates para documentação técnica — README, guias de API, CHANGELOG, contribuição e documentação de arquitetura.', color: '#A3E635' },
    'frontend-design': { icon: '🎨', category: 'Frontend', ptDesc: 'Sistema de design para UI web — psicologia UX, teoria de cores, tipografia, efeitos visuais, animações e princípios de layout.', color: '#F87171' },
    'game-development': { icon: '🎮', category: 'Especializado', ptDesc: 'Desenvolvimento de jogos — game loop, física, IA de NPCs, multiplayer, arte e áudio para Unity, Godot e Phaser.', color: '#E879F9' },
    'geo-fundamentals': { icon: '🌐', category: 'Marketing', ptDesc: 'Fundamentos de GEO (Generative Engine Optimization) — otimização de conteúdo para motores de busca com IA generativa.', color: '#67E8F9' },
    'i18n-localization': { icon: '🌍', category: 'Frontend', ptDesc: 'Internacionalização e localização — i18n, traduções, formatação de datas/moedas, RTL e pluralização multilíngue.', color: '#34D399' },
    'intelligent-routing': { icon: '🧭', category: 'IA', ptDesc: 'Roteamento inteligente de agentes — análise automática do domínio da tarefa e seleção do agente especialista mais adequado.', color: '#C084FC' },
    'lint-and-validate': { icon: '🔍', category: 'Qualidade', ptDesc: 'Linting e validação de código — ESLint, TypeScript strict, formatação e verificação automática de conformidade.', color: '#FACC15' },
    'mcp-builder': { icon: '🔧', category: 'Especializado', ptDesc: 'Construtor de MCPs (Model Context Protocol) — criação de servidores MCP para extensão de capacidades dos agentes IA.', color: '#A78BFA' },
    'mobile-design': { icon: '📱', category: 'Mobile', ptDesc: 'Design para apps mobile — padrões iOS/Android, gestos, navegação nativa, responsividade e guidelines de plataforma.', color: '#38BDF8' },
    'nextjs-react-expert': { icon: '⚛️', category: 'Frontend', ptDesc: 'Expertise em Next.js e React — SSR, App Router, Server Components, hooks avançados, otimização de bundle e patterns modernos.', color: '#60A5FA' },
    'nodejs-best-practices': { icon: '🟢', category: 'Backend', ptDesc: 'Boas práticas de Node.js — async/await, streams, clustering, error handling, segurança e padrões de arquitetura.', color: '#4ADE80' },
    'parallel-agents': { icon: '⚡', category: 'IA', ptDesc: 'Execução paralela de agentes — coordenação de múltiplos agentes trabalhando simultaneamente com sincronização de resultados.', color: '#FBBF24' },
    'performance-profiling': { icon: '📊', category: 'Qualidade', ptDesc: 'Profiling de performance — Lighthouse, Core Web Vitals, bundle analysis, memory leaks e otimização de carregamento.', color: '#F87171' },
    'plan-writing': { icon: '📐', category: 'Gestão', ptDesc: 'Escrita de planos de projeto — PLAN.md estruturado com fases, tarefas, agentes responsáveis e critérios de aceitação.', color: '#C9A962' },
    'powershell-windows': { icon: '💻', category: 'DevOps', ptDesc: 'PowerShell e administração Windows — cmdlets, scripts de automação, gerenciamento de serviços e configuração de ambiente.', color: '#38BDF8' },
    'python-patterns': { icon: '🐍', category: 'Backend', ptDesc: 'Padrões Python — dataclasses, type hints, decorators, async, testing com pytest e boas práticas da linguagem.', color: '#FBBF24' },
    'red-team-tactics': { icon: '🔴', category: 'Segurança', ptDesc: 'Táticas de Red Team — simulação de ataques ofensivos, engenharia social, exploração de vulnerabilidades e técnicas de invasão.', color: '#F87171' },
    'rust-pro': { icon: '🦀', category: 'Backend', ptDesc: 'Rust avançado — ownership, lifetimes, traits, async runtime, error handling e padrões de performance da linguagem.', color: '#FB923C' },
    'seo-fundamentals': { icon: '🔎', category: 'Marketing', ptDesc: 'Fundamentos de SEO — meta tags, dados estruturados, Core Web Vitals, sitemap, heading hierarchy e otimização de conteúdo.', color: '#4ADE80' },
    'server-management': { icon: '🖥️', category: 'DevOps', ptDesc: 'Gerenciamento de servidores — configuração, monitoramento, backup, segurança, logs e manutenção de infraestrutura.', color: '#A78BFA' },
    'systematic-debugging': { icon: '🔬', category: 'Diagnóstico', ptDesc: 'Debugging sistemático — metodologia dos 5 Porquês, binary search, análise de stack trace e isolamento de causa-raiz.', color: '#FCA5A5' },
    'tailwind-patterns': { icon: '🌊', category: 'Frontend', ptDesc: 'Padrões Tailwind CSS — utilities, responsive design, dark mode, customização de tema e componentes reutilizáveis.', color: '#38BDF8' },
    'tdd-workflow': { icon: '🔄', category: 'Qualidade', ptDesc: 'Workflow de TDD (Test-Driven Development) — Red-Green-Refactor, escrever testes primeiro e desenvolvimento guiado por testes.', color: '#F87171' },
    'testing-patterns': { icon: '🧪', category: 'Qualidade', ptDesc: 'Padrões de testes — pirâmide Unit > Integration > E2E, padrão AAA (Arrange/Act/Assert), mocking e cobertura estratégica.', color: '#2DD4BF' },
    'vulnerability-scanner': { icon: '🛡️', category: 'Segurança', ptDesc: 'Scanner de vulnerabilidades — detecção automática de falhas OWASP, dependências inseguras e secrets expostos no código.', color: '#FBBF24' },
    'web-design-guidelines': { icon: '📏', category: 'Frontend', ptDesc: 'Guidelines de design web — acessibilidade, foco, semântica HTML, performance visual e boas práticas pós-implementação.', color: '#86EFAC' },
    'webapp-testing': { icon: '🌐', category: 'Qualidade', ptDesc: 'Testes de aplicações web — Playwright, testes E2E, screenshots, interceptação de rede e validação de fluxos do usuário.', color: '#67E8F9' },
};

const categoryOrder = ['Frontend', 'Backend', 'Qualidade', 'Segurança', 'DevOps', 'IA', 'Arquitetura', 'Mobile', 'Gestão', 'Marketing', 'Especializado', 'Construção', 'Criatividade', 'Diagnóstico', 'Comunicação'];

export default function SkillsHub() {
    const [activeTab, setActiveTab] = useState('list');
    const [selectedSkill, setSelectedSkill] = useState(null);
    const [uploadedSkills, setUploadedSkills] = useState([]);
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

    // Parse built-in skills
    const builtinSkills = useMemo(() => {
        return Object.entries(skillModules)
            .filter(([path]) => !path.includes('desktop.ini') && !path.includes('templates'))
            .map(([path, raw]) => {
                const parts = path.split('/');
                const foldername = parts[parts.length - 2];
                const { meta, content } = parseFrontmatter(raw);
                const m = skillMeta[foldername] || {};
                return {
                    id: foldername, name: meta.name || foldername,
                    description: meta.description || '', ptDesc: m.ptDesc || meta.description || '',
                    icon: m.icon || '📦', color: m.color || '#C9A962', category: m.category || 'Outro',
                    version: meta.version || '', priority: meta.priority || '',
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

    const allSkills = useMemo(() => [...builtinSkills, ...uploadedSkills], [builtinSkills, uploadedSkills]);

    const filteredSkills = useMemo(() => {
        return allSkills.filter(skill => {
            const matchesSearch = !searchQuery ||
                skill.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                skill.ptDesc.toLowerCase().includes(searchQuery.toLowerCase()) ||
                skill.category.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesCategory = activeCategory === 'all' || skill.category === activeCategory;
            return matchesSearch && matchesCategory;
        });
    }, [allSkills, searchQuery, activeCategory]);

    const categories = useMemo(() => {
        const cats = [...new Set(allSkills.map(s => s.category))];
        return cats.sort((a, b) => (categoryOrder.indexOf(a) === -1 ? 99 : categoryOrder.indexOf(a)) - (categoryOrder.indexOf(b) === -1 ? 99 : categoryOrder.indexOf(b)));
    }, [allSkills]);

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
                setUploadedSkills(prev => [...prev, {
                    id: `uploaded-${Date.now()}-${name}`, name,
                    description: meta.description || 'Skill customizada',
                    ptDesc: meta.description || 'Skill importada pelo usuário',
                    icon: '📦', color: '#C9A962', category: 'Importado',
                    version: meta.version || '', priority: '',
                    content, source: 'uploaded'
                }]);
                showToast(`Skill "${name}" importada!`);
            };
            reader.readAsText(file);
        });
    }, [showToast]);

    // Generate skill with Claude
    const handleGenerate = async () => {
        if (!genDesc.trim()) return;
        setGenLoading(true); setGenResult(null);
        try {
            const markdown = await generateSkill(genDesc);
            setGenResult(markdown);
            showToast('Skill gerada com sucesso!');
        } catch (err) {
            console.error('[Claude] Error:', err);
            showToast(`Erro: ${err.message}`, true);
        } finally { setGenLoading(false); }
    };

    const addGeneratedSkill = () => {
        if (!genResult) return;
        const { meta, content } = parseFrontmatter(genResult);
        const name = meta.name || 'nova-skill';
        setUploadedSkills(prev => [...prev, {
            id: `gen-${Date.now()}`, name,
            description: meta.description || '', ptDesc: meta.description || 'Skill gerada por IA',
            icon: '🧠', color: '#4ADE80', category: 'Gerado',
            version: meta.version || '1.0', priority: '',
            content, source: 'generated'
        }]);
        showToast(`Skill "${name}" adicionada!`);
        setGenResult(null); setGenDesc(''); setActiveTab('list');
    };

    const downloadGenerated = () => {
        if (!genResult) return;
        const { meta } = parseFrontmatter(genResult);
        const name = meta.name || 'nova-skill';
        const blob = new Blob([genResult], { type: 'text/markdown' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = `${name}-SKILL.md`;
        document.body.appendChild(a); a.click();
        document.body.removeChild(a); URL.revokeObjectURL(url);
        showToast('Download iniciado!');
    };

    return (
        <div className="agents-page">
            {/* Hero */}
            <div className="agents-hero">
                <div className="agents-hero-content">
                    <div className="agents-hero-badge">Biblioteca de Skills</div>
                    <h1 className="agents-hero-title">
                        Skills<br />
                        <span className="agents-hero-accent">Especializadas</span>
                    </h1>
                    <p className="agents-hero-desc">
                        {allSkills.length} skills modulares que estendem as capacidades dos agentes.
                        Cada uma ensina princípios, padrões e boas práticas.
                    </p>
                </div>
                <div className="agents-hero-stats">
                    <div className="agents-hero-stat">
                        <span className="agents-hero-stat-value">{builtinSkills.length}</span>
                        <span className="agents-hero-stat-label">Built-in</span>
                    </div>
                    <div className="agents-hero-stat-divider" />
                    <div className="agents-hero-stat">
                        <span className="agents-hero-stat-value">{uploadedSkills.length}</span>
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
                    { id: 'list', label: 'Minhas Skills', icon: '🔧' },
                    { id: 'upload', label: 'Importar', icon: '📦' },
                    { id: 'generate', label: 'Gerar com IA', icon: '✨' },
                ].map(tab => (
                    <button key={tab.id} className={`agents-tab ${activeTab === tab.id ? 'active' : ''}`} onClick={() => setActiveTab(tab.id)}>
                        <span className="agents-tab-icon">{tab.icon}</span>
                        {tab.label}
                        {tab.id === 'list' && <span className="agents-tab-count">{allSkills.length}</span>}
                    </button>
                ))}
            </div>

            {/* Tab: List */}
            {activeTab === 'list' && (
                <div>
                    <div className="agents-toolbar">
                        <div className="agents-search">
                            <SearchIcon />
                            <input type="text" placeholder="Buscar skill por nome, descrição ou categoria..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                        </div>
                        <div className="agents-filters">
                            <button className={`agents-filter-chip ${activeCategory === 'all' ? 'active' : ''}`} onClick={() => setActiveCategory('all')}>Todas</button>
                            {categories.map(cat => (
                                <button key={cat} className={`agents-filter-chip ${activeCategory === cat ? 'active' : ''}`} onClick={() => setActiveCategory(cat)}>{cat}</button>
                            ))}
                        </div>
                    </div>

                    <div className="agents-grid">
                        {filteredSkills.map((skill, i) => (
                            <div key={skill.id} className="agent-card-v2" onClick={() => setSelectedSkill(skill)} style={{ '--agent-color': skill.color, '--delay': `${i * 50}ms` }}>
                                <div className="agent-card-v2-top">
                                    <div className="agent-card-v2-icon" style={{ color: skill.color }}>{skill.icon}</div>
                                    <span className="agent-card-v2-category">{skill.category}</span>
                                </div>
                                <h3 className="agent-card-v2-name">{skill.name}</h3>
                                <p className="agent-card-v2-desc">{skill.ptDesc}</p>
                                {(skill.version || skill.priority) && (
                                    <div className="agent-card-v2-skills">
                                        {skill.version && <span className="agent-card-v2-skill">v{skill.version}</span>}
                                        {skill.priority && <span className="agent-card-v2-skill" style={{ color: '#F87171', background: 'rgba(248,113,113,0.1)' }}>{skill.priority}</span>}
                                    </div>
                                )}
                                <div className="agent-card-v2-footer">
                                    <span className="agent-card-v2-cta">Ver documentação ↗</span>
                                    {skill.source !== 'builtin' && (
                                        <span className="agent-card-v2-badge" style={{
                                            color: skill.source === 'generated' ? 'var(--success)' : 'var(--info)',
                                            background: skill.source === 'generated' ? 'rgba(74,222,128,0.12)' : 'rgba(96,165,250,0.12)'
                                        }}>{skill.source === 'generated' ? 'gerado' : 'importado'}</span>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>

                    {filteredSkills.length === 0 && (
                        <div className="agents-empty"><span className="agents-empty-icon">🔍</span><p>Nenhuma skill encontrada para "{searchQuery}"</p></div>
                    )}
                </div>
            )}

            {/* Tab: Upload */}
            {activeTab === 'upload' && (
                <div>
                    <div className="agents-upload-intro">
                        <h2>Importar Skill</h2>
                        <p>Arraste um arquivo <code>SKILL.md</code> com frontmatter YAML ou clique para selecionar.</p>
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
                        <div className="agents-dropzone-hint">Aceita arquivos .md com frontmatter YAML (name, description, allowed-tools)</div>
                        <input ref={fileInputRef} type="file" accept=".md" multiple style={{ display: 'none' }} onChange={handleFileDrop} />
                    </div>
                    {uploadedSkills.length > 0 && (
                        <div style={{ marginTop: '2.5rem' }}>
                            <h3 style={{ fontFamily: 'var(--font-heading)', marginBottom: '1rem', fontSize: '1.15rem' }}>
                                Skills Importadas ({uploadedSkills.length})
                            </h3>
                            <div className="agents-grid">
                                {uploadedSkills.map((skill, i) => (
                                    <div key={skill.id} className="agent-card-v2" onClick={() => setSelectedSkill(skill)} style={{ '--agent-color': skill.color, '--delay': `${i * 60}ms` }}>
                                        <div className="agent-card-v2-top">
                                            <div className="agent-card-v2-icon" style={{ color: skill.color }}>{skill.icon}</div>
                                            <span className="agent-card-v2-category">{skill.category}</span>
                                        </div>
                                        <h3 className="agent-card-v2-name">{skill.name}</h3>
                                        <p className="agent-card-v2-desc">{skill.ptDesc}</p>
                                        <div className="agent-card-v2-footer"><span className="agent-card-v2-cta">Ver documentação ↗</span></div>
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
                        <h2>Criar Skill com IA</h2>
                        <p>Descreva a skill que você precisa. O Claude Opus 4.6 vai gerar uma skill profissional com princípios, padrões, regras e anti-patterns.</p>
                    </div>
                    <div className="agents-generate-form">
                        <textarea rows="6"
                            placeholder="Ex: Quero uma skill de micro-frontends que ensine Module Federation, compartilhamento de estado entre apps, versionamento e estratégias de deploy independente..."
                            value={genDesc} onChange={(e) => setGenDesc(e.target.value)} className="agents-generate-input"
                        />
                        <button className="btn-primary btn-full" onClick={handleGenerate} disabled={genLoading || !genDesc.trim()}>
                            {genLoading ? <><span className="loading-spinner-sm" /> Criando skill com Claude Opus 4.6...</> : '✦ Gerar Skill Especializada'}
                        </button>
                    </div>
                    {genLoading && (
                        <div className="agents-gen-loading">
                            <div className="agents-gen-loading-orbit"><div className="agents-gen-loading-dot" /><div className="agents-gen-loading-dot" /><div className="agents-gen-loading-dot" /></div>
                            <p>Claude Opus 4.6 está construindo sua skill...</p>
                            <span>Isso pode levar até 30 segundos</span>
                        </div>
                    )}
                    {genResult && (
                        <div className="agents-gen-result">
                            <div className="agents-gen-result-header">
                                <h3>🧠 Skill Gerada</h3>
                                <div className="agents-gen-result-actions">
                                    <button className="btn-secondary" onClick={downloadGenerated}>⬇ Baixar .md</button>
                                    <button className="btn-primary" onClick={addGeneratedSkill}>+ Adicionar às Minhas Skills</button>
                                </div>
                            </div>
                            <div className="agents-gen-result-body">
                                <ReactMarkdown remarkPlugins={[remarkGfm]}>{genResult}</ReactMarkdown>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Skill Detail Modal */}
            {selectedSkill && (
                <div className="agent-modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setSelectedSkill(null); }}>
                    <div className="agent-modal">
                        <div className="agent-modal-header">
                            <div className="agent-modal-header-left">
                                <span className="agent-modal-icon" style={{ color: selectedSkill.color }}>{selectedSkill.icon}</span>
                                <div>
                                    <h2>{selectedSkill.name}</h2>
                                    <span className="agent-modal-category">{selectedSkill.category}</span>
                                </div>
                            </div>
                            <button className="agent-modal-close" onClick={() => setSelectedSkill(null)}><CloseIcon /></button>
                        </div>
                        <div className="agent-modal-summary"><p>{selectedSkill.ptDesc}</p></div>
                        <div className="agent-modal-body">
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>{selectedSkill.content}</ReactMarkdown>
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
