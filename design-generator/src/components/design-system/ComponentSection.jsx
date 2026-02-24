export function ComponentSection({ title, tag, children }) {
    return (
        <section className="ds-component-section">
            <h2 className="ds-section-title">
                {title}
                {tag && <span className="ds-section-tag">{tag}</span>}
            </h2>
            <div className="ds-component-demo">
                {children}
            </div>
        </section>
    );
}
