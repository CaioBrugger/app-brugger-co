import { DesignSystemLayout, PageHeader, TokenTable } from '../../../components/design-system';

const spacingTokens = [
    { token: '--spacing-xs', value: '0.5rem', px: '8px', use: 'Gap entre ícone e texto' },
    { token: '--spacing-sm', value: '1rem', px: '16px', use: 'Padding interno de labels e tags' },
    { token: '--spacing-md', value: '1.5rem', px: '24px', use: 'Gap entre elementos dentro de cards' },
    { token: '--spacing-lg', value: '2rem', px: '32px', use: 'Padding interno de cards' },
    { token: '--spacing-xl', value: '3rem', px: '48px', use: 'Espaço entre blocos dentro de uma seção' },
    { token: '--spacing-2xl', value: '5rem', px: '80px', use: 'Padding vertical de seções (topo/base)' },
    { token: '--spacing-3xl', value: '7rem', px: '112px', use: 'Separação entre seções importantes' },
];

export default function Spacing() {
    return (
        <DesignSystemLayout>
            <PageHeader
                breadcrumb="TOKENS / ESPAÇAMENTO"
                title="Espaçamento"
                description="O espaçamento generoso faz o design premium respirar adequadamente."
            />
            <section className="ds-section">
                <TokenTable tokens={spacingTokens} />
            </section>
        </DesignSystemLayout>
    );
}
