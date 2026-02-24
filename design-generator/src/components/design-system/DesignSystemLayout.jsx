import { NavLink } from 'react-router-dom';

export default function DesignSystemLayout({ children }) {
    return (
        <div className="ds-layout">
            <DSNavbar />
            <div className="ds-main-content">
                {children}
            </div>
        </div>
    );
}

function DSNavbar() {
    return (
        <nav className="ds-navbar">
            <div className="ds-navbar-brand">
                <div className="ds-logo">
                    ✦ <span className="ds-logo-text">Design System</span>
                </div>
            </div>

            <div className="ds-nav-links">
                <NavLink to="/design-system" end className={({ isActive }) => `ds-nav-link ${isActive ? 'active' : ''}`}>
                    Visão Geral
                </NavLink>
                <NavLink to="/design-system/identity" className={({ isActive }) => `ds-nav-link ${isActive ? 'active' : ''}`}>
                    Identidade
                </NavLink>

                <div className="ds-nav-dropdown">
                    <button className="ds-nav-link">Tokens ▾</button>
                    <div className="ds-dropdown-menu">
                        <NavLink to="/design-system/tokens/colors">Cores</NavLink>
                        <NavLink to="/design-system/tokens/typography">Tipografia</NavLink>
                        <NavLink to="/design-system/tokens/spacing">Espaçamento</NavLink>
                        <NavLink to="/design-system/tokens/radius-shadows">Bordas & Sombras</NavLink>
                    </div>
                </div>

                <div className="ds-nav-dropdown">
                    <button className="ds-nav-link">Biblioteca UI ▾</button>
                    <div className="ds-dropdown-menu">
                        <NavLink to="/design-system/components/buttons">Botões</NavLink>
                        <NavLink to="/design-system/components/cards">Cards</NavLink>
                        <NavLink to="/design-system/components/typography">Tipografia & Quotes</NavLink>
                        <NavLink to="/design-system/components/accordion">Accordion FAQ</NavLink>
                        <NavLink to="/design-system/components/price">Seção de Preço</NavLink>
                    </div>
                </div>

                <NavLink to="/design-system/docs" className={({ isActive }) => `ds-nav-link ${isActive ? 'active' : ''}`}>
                    Manual IA
                </NavLink>
            </div>
        </nav>
    );
}
