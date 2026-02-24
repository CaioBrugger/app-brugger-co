import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { fetchTodos, createTodo, toggleTodo, deleteTodo } from '../services/todosService';

const agentCount = Object.keys(
    import.meta.glob('../../.agent/agents/*.md')
).length;

function getGreeting() {
    const h = new Date().getHours();
    if (h < 12) return 'Bom dia';
    if (h < 18) return 'Boa tarde';
    return 'Boa noite';
}

export default function Dashboard() {
    const [todos, setTodos] = useState([]);
    const [newTask, setNewTask] = useState('');
    const [filter, setFilter] = useState('all');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
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

    return (
        <div className="dash-page">
            <div className="page-header">
                <div className="page-label">Painel de Controle</div>
                <h1 className="page-title">{getGreeting()}, <span className="gold">Brugger CO</span></h1>
                <p className="page-desc">
                    Sua caixa de ferramentas inteligente para gerenciar todos os aspectos da empresa.
                </p>
            </div>

            {/* Stats */}
            <div className="dash-stats">
                <div className="dash-stat-card">
                    <div className="dash-stat-value">4</div>
                    <div className="dash-stat-label">Ferramentas</div>
                </div>
                <div className="dash-stat-card">
                    <div className="dash-stat-value">{agentCount}</div>
                    <div className="dash-stat-label">Agentes IA</div>
                </div>
                <div className="dash-stat-card">
                    <div className="dash-stat-value">2</div>
                    <div className="dash-stat-label">APIs Ativas</div>
                </div>
                <div className="dash-stat-card">
                    <div className="dash-stat-value">∞</div>
                    <div className="dash-stat-label">Possibilidades</div>
                </div>
            </div>

            {/* Main Content: Two columns */}
            <div className="dash-content">
                {/* To-Do Widget */}
                <div className="dash-todo">
                    <div className="dash-todo-header">
                        <div className="dash-todo-title-row">
                            <h2 className="dash-section-title">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M9 11l3 3L22 4" />
                                    <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />
                                </svg>
                                Tarefas
                            </h2>
                            <div className="dash-todo-counts">
                                <span className="dash-todo-count pending">{pendingCount} pendente{pendingCount !== 1 ? 's' : ''}</span>
                                <span className="dash-todo-count done">{doneCount} feita{doneCount !== 1 ? 's' : ''}</span>
                            </div>
                        </div>
                        <div className="dash-todo-filters">
                            {[
                                { key: 'all', label: 'Todas' },
                                { key: 'pending', label: 'Pendentes' },
                                { key: 'done', label: 'Concluídas' }
                            ].map(f => (
                                <button
                                    key={f.key}
                                    className={`dash-todo-filter ${filter === f.key ? 'active' : ''}`}
                                    onClick={() => setFilter(f.key)}
                                >{f.label}</button>
                            ))}
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
                        <button className="dash-todo-add" onClick={addTodo} disabled={!newTask.trim() || saving}>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                <line x1="12" y1="5" x2="12" y2="19" />
                                <line x1="5" y1="12" x2="19" y2="12" />
                            </svg>
                        </button>
                    </div>

                    <div className="dash-todo-list">
                        {loading && (
                            <div className="dash-todo-empty">⏳ Carregando tarefas...</div>
                        )}
                        {!loading && filtered.length === 0 && (
                            <div className="dash-todo-empty">
                                {filter === 'all'
                                    ? '✨ Nenhuma tarefa ainda. Adicione sua primeira!'
                                    : filter === 'pending'
                                        ? '🎉 Todas as tarefas concluídas!'
                                        : '📝 Nenhuma tarefa concluída ainda.'}
                            </div>
                        )}
                        {filtered.map(todo => (
                            <div key={todo.id} className={`dash-todo-item ${todo.done ? 'done' : ''}`}>
                                <button
                                    className={`dash-todo-check ${todo.done ? 'checked' : ''}`}
                                    onClick={() => handleToggle(todo.id, todo.done)}
                                    aria-label={todo.done ? 'Desmarcar tarefa' : 'Marcar como concluída'}
                                >
                                    {todo.done && (
                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
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
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <line x1="18" y1="6" x2="6" y2="18" />
                                        <line x1="6" y1="6" x2="18" y2="18" />
                                    </svg>
                                </button>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Quick Access */}
                <div className="dash-quick">
                    <h2 className="dash-section-title">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                        </svg>
                        Acesso Rápido
                    </h2>
                    <div className="dash-quick-grid">
                        <Link to="/design" className="dash-quick-card">
                            <div className="dash-quick-icon">🎨</div>
                            <div>
                                <h3>Design Generator</h3>
                                <p>Gere designs de landing pages com IA.</p>
                            </div>
                        </Link>

                        <Link to="/agents" className="dash-quick-card">
                            <div className="dash-quick-icon">🤖</div>
                            <div>
                                <h3>Agentes IA</h3>
                                <p>Visualize e gere novos agentes.</p>
                            </div>
                        </Link>

                        <Link to="/products" className="dash-quick-card">
                            <div className="dash-quick-icon">📦</div>
                            <div>
                                <h3>Produtos</h3>
                                <p>Veja todos os produtos da Saber Cristão.</p>
                            </div>
                        </Link>

                        <Link to="/design-system" className="dash-quick-card">
                            <div className="dash-quick-icon">🎯</div>
                            <div>
                                <h3>Design System</h3>
                                <p>Componentes e tokens visuais.</p>
                            </div>
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
