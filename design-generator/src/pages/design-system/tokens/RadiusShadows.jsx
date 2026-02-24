import { DesignSystemLayout, PageHeader, TokenTable } from '../../../components/design-system';

const radiusTokens = [
    { token: '--radius-sm', value: '6px', use: 'Tags, badges, inputs' },
    { token: '--radius-md', value: '10px', use: 'Botões, cards pequenos' },
    { token: '--radius-lg', value: '16px', use: 'Cards grandes, imagens' },
];

const shadowTokens = [
    { token: '--shadow-sm', value: '0 2px 8px rgba(0, 0, 0, 0.3)', use: 'Cards padrão' },
    { token: '--shadow-md', value: '0 4px 16px rgba(0, 0, 0, 0.4)', use: 'Cards hover, elevação média' },
    { token: '--shadow-lg', value: '0 8px 32px rgba(0, 0, 0, 0.5)', use: 'Modais, imagem do produto' },
];

export default function RadiusShadows() {
    return (
        <DesignSystemLayout>
            <PageHeader
                breadcrumb="TOKENS / BORDAS & SOMBRAS"
                title="Bordas & Sombras"
                description="Os tokens que definem a forma e profundidade da UI."
            />
            <section className="ds-section">
                <h2 className="ds-section-title">Border Radius</h2>
                <TokenTable tokens={radiusTokens} />
            </section>

            <section className="ds-section">
                <h2 className="ds-section-title">Box Shadows</h2>
                <TokenTable tokens={shadowTokens} />
            </section>
        </DesignSystemLayout>
    );
}
