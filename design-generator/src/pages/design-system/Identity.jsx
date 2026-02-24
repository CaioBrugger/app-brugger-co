import { DesignSystemLayout, PageHeader } from '../../components/design-system';

const colorGroups = [
    {
        title: 'Fundos (Backgrounds)',
        colors: [
            { token: '--color-bg', hex: '#0C0C0E', label: 'Background principal' },
            { token: '--color-surface', hex: '#131316', label: 'Cards, seções alternadas' },
            { token: '--color-surface-2', hex: '#1A1A1F', label: 'Cards elevados, containers' },
            { token: '--color-surface-3', hex: '#222228', label: 'Hover, elementos interativos' },
        ]
    },
    {
        title: 'Bordas',
        colors: [
            { token: '--color-border', hex: '#2A2A32', label: 'Bordas padrão, divisores' },
            { token: '--color-border-light', hex: '#3A3A45', label: 'Bordas hover, destaque sutil' },
        ]
    },
    {
        title: 'Texto',
        colors: [
            { token: '--color-text', hex: '#FAFAFA', label: 'Títulos, headlines' },
            { token: '--color-text-secondary', hex: '#A0A0A8', label: 'Descrições, parágrafos' },
            { token: '--color-text-muted', hex: '#6B6B75', label: 'Labels, captions' },
        ]
    },
    {
        title: 'Destaque (Dourado)',
        colors: [
            { token: '--color-accent', hex: '#C9A962', label: 'CTAs, preço, destaques' },
            { token: '--color-accent-light', hex: '#DFC07A', label: 'Hover de botões' },
            { token: '--color-accent-dark', hex: '#A88C4A', label: 'Pressed, bordas douradas' },
        ]
    },
    {
        title: 'Funcionais',
        colors: [
            { token: '--color-success', hex: '#4ADE80', label: 'Checks, confirmações' },
            { token: '--color-error', hex: '#F87171', label: 'Preço riscado, alertas' },
            { token: '--color-info', hex: '#60A5FA', label: 'Info, links secundários' },
        ]
    }
];

export default function Identity() {
    return (
        <DesignSystemLayout>
            <PageHeader
                breadcrumb="DESIGN SYSTEM / IDENTIDADE & MARCA"
                title="Identidade & Marca"
                description="Visual escuro, premium e sofisticado que transmite autoridade e alto valor percebido."
            />

            <section className="ds-section">
                <h2 className="ds-section-title">Paleta Semântica</h2>
                <div className="ds-color-groups-grid">
                    {colorGroups.map((group, gi) => (
                        <div key={gi} className="ds-color-group">
                            <h3 className="ds-subsection-title">{group.title}</h3>
                            <div className="ds-color-swatches">
                                {group.colors.map((c, ci) => (
                                    <div key={ci} className="ds-swatch">
                                        <div className="ds-swatch-color" style={{ background: c.hex, border: c.hex === '#0C0C0E' ? '1px solid #2A2A32' : 'none' }}></div>
                                        <div className="ds-swatch-info">
                                            <code className="ds-swatch-hex">{c.hex}</code>
                                            <span className="ds-swatch-token">{c.token}</span>
                                            <span className="ds-swatch-label">{c.label}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            <section className="ds-section">
                <h2 className="ds-section-title">Tom de Voz</h2>
                <p style={{ color: 'var(--color-text-secondary)', maxWidth: '800px', lineHeight: 1.7 }}>
                    A comunicação deve ser autoritária, bíblica, inspiradora e voltada para a ação. Evite linguagem excessivamente acadêmica ou casual demais. Use um tom pastoral, mas firme, guiando o usuário para uma decisão clara.
                </p>
            </section>
        </DesignSystemLayout>
    );
}
