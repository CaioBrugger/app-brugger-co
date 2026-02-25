import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { fetchTodos, createTodo, toggleTodo, deleteTodo } from '../services/todosService';

const agentCount = Object.keys(
    import.meta.glob('../../.agent/agents/*.md')
).length;

// ── Helpers ────────────────────────────────────────────────

function getGreeting() {
    const h = new Date().getHours();
    if (h < 12) return 'Bom dia';
    if (h < 18) return 'Boa tarde';
    return 'Boa noite';
}

function formatDate() {
    const days = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
    const months = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
    const d = new Date();
    return `${days[d.getDay()]}, ${d.getDate()} de ${months[d.getMonth()]} de ${d.getFullYear()}`;
}

const pad = n => String(n).padStart(2, '0');

// ── Hooks ──────────────────────────────────────────────────

function useLiveClock() {
    const [t, setT] = useState(new Date());
    useEffect(() => {
        const id = setInterval(() => setT(new Date()), 1000);
        return () => clearInterval(id);
    }, []);
    return t;
}

function useCountUp(target, delay = 0, duration = 900) {
    const num = Number(target);
    const isNum = !isNaN(num) && String(target) !== '∞' && String(target) !== '—';
    const [val, setVal] = useState(isNum ? 0 : target);

    useEffect(() => {
        if (!isNum) { setVal(target); return; }
        const timeout = setTimeout(() => {
            if (num === 0) { setVal(0); return; }
            const steps = 32;
            const interval = duration / steps;
            let step = 0;
            const timer = setInterval(() => {
                step++;
                const ease = 1 - Math.pow(1 - step / steps, 3);
                setVal(Math.round(ease * num));
                if (step >= steps) { setVal(num); clearInterval(timer); }
            }, interval);
            return () => clearInterval(timer);
        }, delay);
        return () => clearTimeout(timeout);
    }, [num, isNum, target, delay, duration]);

    return val;
}

// ── Sub-components ─────────────────────────────────────────

function ProgressRing({ done, total }) {
    const pct = total === 0 ? 0 : Math.round((done / total) * 100);
    const r = 26;
    const circ = 2 * Math.PI * r;
    const offset = circ - (circ * pct / 100);
    return (
        <div className="dash-ring-wrap">
            <svg width="68" height="68" viewBox="0 0 68 68">
                <circle cx="34" cy="34" r={r} fill="none" stroke="var(--border)" strokeWidth="3" />
                <circle
                    cx="34" cy="34" r={r} fill="none"
                    stroke="var(--accent)" strokeWidth="3"
                    strokeDasharray={circ}
                    strokeDashoffset={offset}
                    strokeLinecap="round"
                    transform="rotate(-90 34 34)"
                    style={{ transition: 'stroke-dashoffset 1s cubic-bezier(0.4,0,0.2,1)' }}
                />
            </svg>
            <div className="dash-ring-label">
                <span className="dash-ring-pct">{pct}%</span>
                <span className="dash-ring-sub">feitas</span>
            </div>
        </div>
    );
}

function StatCard({ value, label, delay, icon }) {
    const count = useCountUp(value, delay * 1000);
    return (
        <div className="dash-stat-card" style={{ '--delay': `${delay}s` }}>
            <div className="dash-stat-icon-wrap">{icon}</div>
            <div className="dash-stat-value">{count}</div>
            <div className="dash-stat-label">{label}</div>
            <div className="dash-stat-line"><div className="dash-stat-line-fill" /></div>
        </div>
    );
}

// ── SVG Icons ──────────────────────────────────────────────

const IconWrench = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
    </svg>
);

const IconRobot = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="11" width="18" height="11" rx="2" />
        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
        <circle cx="9" cy="16" r="1" fill="currentColor" />
        <circle cx="15" cy="16" r="1" fill="currentColor" />
    </svg>
);

const IconTask = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 11l3 3L22 4" />
        <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />
    </svg>
);

const IconPlug = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 3a3 3 0 0 0-3 3v12a3 3 0 0 0 3 3 3 3 0 0 0 3-3 3 3 0 0 0-3-3H6a3 3 0 0 0-3 3 3 3 0 0 0 3 3 3 3 0 0 0 3-3V6a3 3 0 0 0-3-3 3 3 0 0 0-3 3 3 3 0 0 0 3 3h12a3 3 0 0 0 3-3 3 3 0 0 0-3-3z" />
    </svg>
);

// ── Tools List ─────────────────────────────────────────────

const TOOLS = [
    {
        to: '/builder', label: 'LP Builder', desc: 'Crie landing pages com IA',
        icon: (
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
            </svg>
        )
    },
    {
        to: '/gallery', label: 'Galeria de LPs', desc: 'Todas as landing pages salvas',
        icon: (
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="7" height="5" rx="1" />
                <rect x="14" y="3" width="7" height="5" rx="1" />
                <rect x="3" y="12" width="7" height="9" rx="1" />
                <rect x="14" y="12" width="7" height="9" rx="1" />
            </svg>
        )
    },
    {
        to: '/design', label: 'Design Generator', desc: 'Gere designs completos com IA',
        icon: (
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2L2 7l10 5 10-5-10-5z" />
                <path d="M2 17l10 5 10-5" />
                <path d="M2 12l10 5 10-5" />
            </svg>
        )
    },
    {
        to: '/products', label: 'Produtos', desc: 'Catálogo Saber Cristão',
        icon: (
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z" />
                <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
                <line x1="12" y1="22.08" x2="12" y2="12" />
            </svg>
        )
    },
    {
        to: '/themes', label: 'Temas', desc: 'Paletas e estilos visuais',
        icon: (
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2.69l5.66 5.66a8 8 0 11-11.31 0z" />
            </svg>
        )
    },
    {
        to: '/design-system', label: 'Design System', desc: 'Tokens, componentes, docs',
        icon: (
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="13.5" cy="6.5" r="2.5" />
                <circle cx="6.5" cy="13.5" r="2.5" />
                <circle cx="17.5" cy="17.5" r="2.5" />
                <path d="M13.5 9C13.5 15 6.5 11 6.5 11" />
                <path d="M9 13.5c6 0 2 6.5 2 6.5" />
            </svg>
        )
    },
];

const AGENT_NAMES = ['Design', 'Dev', 'UX', 'PM', 'QA', 'Analyst', 'DevOps', 'Architect'];

// ── Main Component ─────────────────────────────────────────

export default function Dashboard() {
    const [todos, setTodos] = useState([]);
    const [newTask, setNewTask] = useState('');
    const [filter, setFilter] = useState('all');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [mounted, setMounted] = useState(false);
    const time = useLiveClock();

    useEffect(() => {
        setMounted(true);
        fetchTodos()
            .then(setTodos)
            .catch(err => console.error('Erro ao carregar tarefas:', err))
            .finally(() => setLoading(false));
    }, []);

    const addTodo = async () => {
        const text = newTask.trim();
        if (!text || saving) return;
        setSaving(true);
        try {
            const todo = await createTodo(text);
            setTodos(prev => [todo, ...prev]);
            setNewTask('');
        } catch (err) {
            console.error('Erro ao criar tarefa:', err);
        } finally {
            setSaving(false);
        }
    };

    const handleToggle = async (id, done) => {
        try {
            const updated = await toggleTodo(id, !done);
            setTodos(prev => prev.map(t => t.id === id ? updated : t));
        } catch (err) {
            console.error('Erro ao atualizar tarefa:', err);
        }
    };

    const handleDelete = async (id) => {
        try {
            await deleteTodo(id);
            setTodos(prev => prev.filter(t => t.id !== id));
        } catch (err) {
            console.error('Erro ao deletar tarefa:', err);
        }
    };

    const filtered = todos.filter(t => {
        if (filter === 'pending') return !t.done;
        if (filter === 'done') return t.done;
        return true;
    });

    const pendingCount = todos.filter(t => !t.done).length;
    const doneCount = todos.filter(t => t.done).length;

    const hm = `${pad(time.getHours())}:${pad(time.getMinutes())}`;
    const sec = pad(time.getSeconds());

    return (
        <div className={`dash-page${mounted ? ' dash-mounted' : ''}`}>

            {/* ══ HERO ════════════════════════════════════════════ */}
            <header className="dash-hero">
                <div className="dash-hero-rule"><span className="dash-star">✦</span></div>

                <div className="dash-hero-body">
                    <div className="dash-hero-copy">
                        <p className="dash-hero-eyebrow">{getGreeting()},</p>
                        <h1 className="dash-hero-name">
                            Brugger CO<span className="dash-dot">.</span>
                        </h1>
                        <p className="dash-hero-date">{formatDate()}</p>
                    </div>

                    <div className="dash-hero-clock">
                        <div className="dash-clock-hm">
                            {hm}<span className="dash-clock-s">:{sec}</span>
                        </div>
                        <div className="dash-clock-lbl">horário atual</div>
                    </div>
                </div>

                <div className="dash-hero-rule"><span className="dash-star">✦</span></div>
            </header>

            {/* ══ STATS ═══════════════════════════════════════════ */}
            <div className="dash-stats">
                <StatCard value={String(TOOLS.length)} label="Ferramentas"   delay={0}    icon={<IconWrench />} />
                <StatCard value={String(agentCount)}   label="Agentes IA"    delay={0.08} icon={<IconRobot />} />
                <StatCard value={String(todos.length)} label="Tarefas"       delay={0.16} icon={<IconTask />} />
                <StatCard value="2"                    label="APIs Ativas"   delay={0.24} icon={<IconPlug />} />
            </div>

            {/* ══ MAIN GRID ════════════════════════════════════════ */}
            <div className="dash-grid">

                {/* ── Todo Widget ── */}
                <section className="dash-todo">
                    <div className="dash-todo-header">
                        <div className="dash-todo-top">
                            <h2 className="dash-section-title">
                                <IconTask />
                                Tarefas
                            </h2>
                            <div className="dash-todo-badges">
                                <span className="dash-badge dash-badge--amber">
                                    {pendingCount} pendente{pendingCount !== 1 ? 's' : ''}
                                </span>
                                <span className="dash-badge dash-badge--green">
                                    {doneCount} feita{doneCount !== 1 ? 's' : ''}
                                </span>
                            </div>
                        </div>

                        <div className="dash-todo-meta">
                            <ProgressRing done={doneCount} total={todos.length} />
                            <div className="dash-todo-filters">
                                {[
                                    { key: 'all', label: 'Todas' },
                                    { key: 'pending', label: 'Pendentes' },
                                    { key: 'done', label: 'Feitas' },
                                ].map(f => (
                                    <button
                                        key={f.key}
                                        className={`dash-todo-filter${filter === f.key ? ' active' : ''}`}
                                        onClick={() => setFilter(f.key)}
                                    >
                                        {f.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="dash-todo-input-row">
                        <input
                            type="text"
                            className="dash-todo-input"
                            placeholder="Nova tarefa..."
                            value={newTask}
                            onChange={e => setNewTask(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && addTodo()}
                            disabled={saving}
                        />
                        <button
                            className="dash-todo-add"
                            onClick={addTodo}
                            disabled={!newTask.trim() || saving}
                            aria-label="Adicionar tarefa"
                        >
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                <line x1="12" y1="5" x2="12" y2="19" />
                                <line x1="5" y1="12" x2="19" y2="12" />
                            </svg>
                        </button>
                    </div>

                    <div className="dash-todo-list">
                        {loading && (
                            <div className="dash-todo-empty">
                                <div className="dash-loading-dots">
                                    <span /><span /><span />
                                </div>
                                Carregando tarefas...
                            </div>
                        )}
                        {!loading && filtered.length === 0 && (
                            <div className="dash-todo-empty">
                                {filter === 'all'
                                    ? 'Nenhuma tarefa ainda. Adicione sua primeira!'
                                    : filter === 'pending'
                                        ? 'Todas as tarefas foram concluídas!'
                                        : 'Nenhuma tarefa concluída ainda.'}
                            </div>
                        )}
                        {filtered.map((todo, idx) => (
                            <div
                                key={todo.id}
                                className={`dash-todo-item${todo.done ? ' done' : ''}`}
                                style={{ '--i': idx }}
                            >
                                <button
                                    className={`dash-todo-check${todo.done ? ' checked' : ''}`}
                                    onClick={() => handleToggle(todo.id, todo.done)}
                                    aria-label={todo.done ? 'Desmarcar tarefa' : 'Marcar como concluída'}
                                >
                                    {todo.done && (
                                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                                            <polyline points="20 6 9 17 4 12" />
                                        </svg>
                                    )}
                                </button>
                                <span className="dash-todo-text">{todo.text}</span>
                                <button
                                    className="dash-todo-delete"
                                    onClick={() => handleDelete(todo.id)}
                                    aria-label="Deletar tarefa"
                                >
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <line x1="18" y1="6" x2="6" y2="18" />
                                        <line x1="6" y1="6" x2="18" y2="18" />
                                    </svg>
                                </button>
                            </div>
                        ))}
                    </div>
                </section>

                {/* ── Right Column ── */}
                <div className="dash-right">

                    {/* Quick Access */}
                    <section className="dash-quick">
                        <h2 className="dash-section-title">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                            </svg>
                            Ferramentas
                        </h2>
                        <div className="dash-quick-list">
                            {TOOLS.map((tool, i) => (
                                <Link
                                    key={tool.to}
                                    to={tool.to}
                                    className="dash-quick-item"
                                    style={{ '--qi': i }}
                                >
                                    <span className="dash-quick-icon">{tool.icon}</span>
                                    <span className="dash-quick-info">
                                        <span className="dash-quick-name">{tool.label}</span>
                                        <span className="dash-quick-desc">{tool.desc}</span>
                                    </span>
                                    <svg className="dash-quick-arrow" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <line x1="5" y1="12" x2="19" y2="12" />
                                        <polyline points="12 5 19 12 12 19" />
                                    </svg>
                                </Link>
                            ))}
                        </div>
                    </section>

                    {/* AI Agents Panel */}
                    <section className="dash-agents">
                        <h2 className="dash-section-title">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                            </svg>
                            Agentes IA
                        </h2>
                        <div className="dash-agents-hero">
                            <span className="dash-agents-big">{agentCount}</span>
                            <span className="dash-agents-sub">configurados<br />e ativos</span>
                        </div>
                        <div className="dash-agents-grid">
                            {AGENT_NAMES.map((name, i) => (
                                <div
                                    key={name}
                                    className="dash-agent-chip"
                                    style={{ '--ai': i }}
                                >
                                    <span className="dash-agent-dot" />
                                    {name}
                                </div>
                            ))}
                        </div>
                    </section>

                </div>
            </div>
        </div>
    );
}
