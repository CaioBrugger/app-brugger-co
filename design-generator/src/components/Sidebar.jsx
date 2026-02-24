import { NavLink } from 'react-router-dom';

const tools = [
    {
        path: '/',
        label: 'Dashboard',
        icon: (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="7" height="7" rx="1" />
                <rect x="14" y="3" width="7" height="7" rx="1" />
                <rect x="3" y="14" width="7" height="7" rx="1" />
                <rect x="14" y="14" width="7" height="7" rx="1" />
            </svg>
        )
    },
    {
        path: '/design',
        label: 'Design Generator',
        icon: (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2L2 7l10 5 10-5-10-5z" />
                <path d="M2 17l10 5 10-5" />
                <path d="M2 12l10 5 10-5" />
            </svg>
        )
    },
    {
        path: '/design-system',
        label: 'Design System',
        icon: (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="13.5" cy="6.5" r="2.5" />
                <circle cx="6.5" cy="13.5" r="2.5" />
                <circle cx="17.5" cy="17.5" r="2.5" />
                <path d="M13.5 9C13.5 15 6.5 11 6.5 11" />
                <path d="M9 13.5c6 0 2 6.5 2 6.5" />
            </svg>
        )
    },
    {
        path: '/products',
        label: 'Produtos',
        icon: (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z" />
                <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
                <line x1="12" y1="22.08" x2="12" y2="12" />
            </svg>
        )
    }
];

export default function Sidebar() {
    return (
        <aside className="sidebar">
            <div className="sidebar-brand">
                <div className="sidebar-logo">✦</div>
                <div>
                    <div className="sidebar-title">Brugger CO</div>
                    <div className="sidebar-subtitle">Toolbox</div>
                </div>
            </div>

            <nav className="sidebar-nav">
                <div className="sidebar-nav-label">Ferramentas</div>
                {tools.map((tool) => (
                    <NavLink
                        key={tool.path}
                        to={tool.path}
                        end={tool.path === '/'}
                        className={({ isActive }) =>
                            `sidebar-link ${isActive ? 'active' : ''}`
                        }
                    >
                        <span className="sidebar-link-icon">{tool.icon}</span>
                        <span className="sidebar-link-label">{tool.label}</span>
                    </NavLink>
                ))}
            </nav>

            <div className="sidebar-footer">
                <div className="sidebar-footer-text">v1.0 — Saber Cristão</div>
            </div>
        </aside>
    );
}
