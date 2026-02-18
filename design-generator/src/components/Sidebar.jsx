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
        path: '/agents',
        label: 'Agentes IA',
        icon: (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2a4 4 0 014 4c0 1.95-1.4 3.57-3.25 3.92L12 10V8a2 2 0 10-2-2H8a4 4 0 014-4z" />
                <path d="M9 12H5a2 2 0 00-2 2v4a2 2 0 002 2h4" />
                <path d="M15 12h4a2 2 0 012 2v4a2 2 0 01-2 2h-4" />
                <path d="M12 16v6" />
                <circle cx="12" cy="12" r="2" />
            </svg>
        )
    },
    {
        path: '/skills',
        label: 'Skills',
        icon: (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z" />
            </svg>
        )
    },
    {
        path: '/workflows',
        label: 'Workflows',
        icon: (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="16 3 21 3 21 8" />
                <line x1="4" y1="20" x2="21" y2="3" />
                <polyline points="21 16 21 21 16 21" />
                <line x1="15" y1="15" x2="21" y2="21" />
                <line x1="4" y1="4" x2="9" y2="9" />
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
        path: '/extractor',
        label: 'Extrator DS',
        icon: (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M2 22l1-1h3l9-9" />
                <path d="M15 12l-3-3" />
                <path d="M17.5 2.5a2.12 2.12 0 013 3L14 12l-4 1 1-4z" />
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
