import { DesignSystemLayout, PageHeader, TokenTable } from '../../../components/design-system';

const colorGroups = [
    { token: '--color-bg', hex: '#0C0C0E', label: 'Background principal da página' },
    { token: '--color-surface', hex: '#131316', label: 'Cards, seções alternadas' },
    { token: '--color-surface-2', hex: '#1A1A1F', label: 'Cards elevados, containers de conteúdo' },
    { token: '--color-surface-3', hex: '#222228', label: 'Hover de cards, elementos interativos' },
    { token: '--color-border', hex: '#2A2A32', label: 'Bordas padrão de cards e divisores' },
    { token: '--color-border-light', hex: '#3A3A45', label: 'Bordas em estado hover ou destaque sutil' },
    { token: '--color-text', hex: '#FAFAFA', label: 'Texto principal (títulos, headlines)' },
    { token: '--color-text-secondary', hex: '#A0A0A8', label: 'Texto de apoio, descrições, parágrafos' },
    { token: '--color-text-muted', hex: '#6B6B75', label: 'Labels, texto terciário, captions' },
    { token: '--color-accent', hex: '#C9A962', label: 'Cor principal: CTAs, preço, destaques' },
    { token: '--color-accent-light', hex: '#DFC07A', label: 'Hover de botões, texto com destaque leve' },
    { token: '--color-accent-dark', hex: '#A88C4A', label: 'Pressed state, bordas douradas' },
    { token: '--color-success', hex: '#4ADE80', label: 'Checkmarks, confirmações, benefícios ✓' },
    { token: '--color-error', hex: '#F87171', label: 'Preço riscado ("De"), alertas de escassez' }
];

export default function Colors() {
    return (
        <DesignSystemLayout>
            <PageHeader
                breadcrumb="TOKENS / CORES"
                title="Cores"
                description="Os tokens de cor para o design Dark Luxury Biblical."
            />
            <section className="ds-section">
                <TokenTable tokens={colorGroups} />
            </section>
        </DesignSystemLayout>
    );
}
