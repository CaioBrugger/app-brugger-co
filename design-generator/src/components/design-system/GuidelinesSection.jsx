export function GuidelinesSection({ dos, donts }) {
    return (
        <section className="ds-guidelines-section">
            <h3 className="ds-subsection-title">Diretrizes de Uso</h3>
            <div className="ds-guidelines-grid">
                <div className="ds-guidelines-card ds-guidelines-do">
                    <h4 className="ds-guidelines-header">
                        <span className="ds-icon-success">✓</span> O que fazer (Do)
                    </h4>
                    <ul className="ds-guidelines-list">
                        {dos.map((item, index) => (
                            <li key={index} className="ds-guidelines-item">
                                <strong>{item.title}:</strong> {item.description}
                            </li>
                        ))}
                    </ul>
                </div>

                <div className="ds-guidelines-card ds-guidelines-dont">
                    <h4 className="ds-guidelines-header">
                        <span className="ds-icon-error">✗</span> O que evitar (Don't)
                    </h4>
                    <ul className="ds-guidelines-list">
                        {donts.map((item, index) => (
                            <li key={index} className="ds-guidelines-item">
                                <strong>{item.title}:</strong> {item.description}
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </section>
    );
}
