export function PageHeader({ breadcrumb, title, description }) {
    return (
        <header className="ds-page-header">
            <div className="ds-breadcrumb">{breadcrumb}</div>
            <h1 className="ds-page-title">{title}</h1>
            <p className="ds-page-desc">{description}</p>
        </header>
    );
}
