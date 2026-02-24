import { DesignSystemLayout, PageHeader } from '../../components/design-system';
import { NavLink } from 'react-router-dom';

export default function Overview() {
    return (
        <DesignSystemLayout>
            <div className="ds-overview-hero">
                <div className="ds-hero-content">
                    <span className="ds-hero-badge">Saber Cristão v1.0</span>
                    <h1 className="ds-hero-title">Dark Luxury Biblical</h1>
                    <p className="ds-hero-desc">
                        Um sistema de design unificado construído para conversão, autoridade e elegância teológica profunda.
                    </p>
                </div>
            </div>

            <section className="ds-section ds-overview-grid">
                <NavLink to="/design-system/identity" className="ds-overview-card">
                    <span className="ds-overview-icon">✦</span>
                    <div>
                        <h3>Identidade</h3>
                        <p>Filosofia, brand, cores e escala tipográfica</p>
                    </div>
                </NavLink>

                <NavLink to="/design-system/tokens/colors" className="ds-overview-card">
                    <span className="ds-overview-icon">🎨</span>
                    <div>
                        <h3>Design Tokens</h3>
                        <p>Variáveis CSS de core, sombras e bordas</p>
                    </div>
                </NavLink>

                <NavLink to="/design-system/components/buttons" className="ds-overview-card">
                    <span className="ds-overview-icon">🧩</span>
                    <div>
                        <h3>Biblioteca UI</h3>
                        <p>Botões, Cards, Modais, Accordion</p>
                    </div>
                </NavLink>

                <NavLink to="/design-system/docs" className="ds-overview-card">
                    <span className="ds-overview-icon">🤖</span>
                    <div>
                        <h3>Manual IA</h3>
                        <p>Regras de contexto técnico para Claude/ChatGPT</p>
                    </div>
                </NavLink>
            </section>

            <section className="ds-section">
                <h2 className="ds-section-title">Status do Sistema</h2>
                <div className="ds-status-list">
                    <div className="ds-status-item">
                        <span className="ds-status-indicator stable"></span>
                        <span className="ds-status-name">Fundation (Tokens)</span>
                        <span className="ds-status-tag">Estável</span>
                    </div>
                    <div className="ds-status-item">
                        <span className="ds-status-indicator progress"></span>
                        <span className="ds-status-name">Componentes React</span>
                        <span className="ds-status-tag">Em Produção</span>
                    </div>
                    <div className="ds-status-item">
                        <span className="ds-status-indicator planned"></span>
                        <span className="ds-status-name">Templates de E-Mail</span>
                        <span className="ds-status-tag">Planejado</span>
                    </div>
                </div>
            </section>
        </DesignSystemLayout>
    );
}
