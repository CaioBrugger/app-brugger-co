import { Link } from 'react-router-dom';

const agentCount = Object.keys(
    import.meta.glob('../../.agent/agents/*.md')
).length;

export default function Dashboard() {
    return (
        <div>
            <div className="page-header">
                <div className="page-label">Painel de Controle</div>
                <h1 className="page-title">Bem-vindo, <span className="gold">Brugger CO</span></h1>
                <p className="page-desc">
                    Sua caixa de ferramentas inteligente para gerenciar todos os aspectos da empresa.
                </p>
            </div>

            <div className="stats-grid">
                <div className="stat-card">
                    <div className="stat-value">3</div>
                    <div className="stat-label">Ferramentas</div>
                </div>
                <div className="stat-card">
                    <div className="stat-value">{agentCount}</div>
                    <div className="stat-label">Agentes IA</div>
                </div>
                <div className="stat-card">
                    <div className="stat-value">2</div>
                    <div className="stat-label">APIs Ativas</div>
                </div>
                <div className="stat-card">
                    <div className="stat-value">∞</div>
                    <div className="stat-label">Possibilidades</div>
                </div>
            </div>

            <div className="page-label" style={{ marginBottom: '1.25rem' }}>Acesso Rápido</div>

            <div className="quick-access">
                <Link to="/design" className="quick-card">
                    <div className="quick-card-icon">🎨</div>
                    <div className="quick-card-content">
                        <h3>Design Generator</h3>
                        <p>Gere designs de landing pages com IA usando nosso design system e copy system.</p>
                    </div>
                </Link>

                <Link to="/agents" className="quick-card">
                    <div className="quick-card-icon">🤖</div>
                    <div className="quick-card-content">
                        <h3>Agentes IA</h3>
                        <p>Visualize, adicione e gere novos agentes especializados para seu workflow.</p>
                    </div>
                </Link>

                <div className="quick-card" style={{ opacity: 0.5, cursor: 'default' }}>
                    <div className="quick-card-icon">🔧</div>
                    <div className="quick-card-content">
                        <h3>Em breve...</h3>
                        <p>Novas ferramentas serão adicionadas conforme a necessidade da Brugger CO.</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
