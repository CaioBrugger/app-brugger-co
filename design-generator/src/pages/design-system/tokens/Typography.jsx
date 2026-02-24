import { DesignSystemLayout, PageHeader, TokenTable } from '../../../components/design-system';

const typeScale = [
    { name: '--font-heading', value: 'DM Serif Display', description: 'Títulos H1, H2, H3, Citações bíblicas' },
    { name: '--font-body', value: 'DM Sans', description: 'Corpo, botões, labels, preços' },
    { name: 'H1 (headline)', value: '48–56px', description: 'Normal, DM Serif Display' },
    { name: 'H2 (seção)', value: '40–48px', description: 'Normal, DM Serif Display' },
    { name: 'H3 (subtítulo)', value: '24–28px', description: 'Normal, DM Serif Display' },
    { name: 'Corpo/parágrafo', value: '16–18px', description: '400, DM Sans' },
    { name: 'Label de seção', value: '12–14px', description: '600, DM Sans, UPPERCASE' },
    { name: 'Botão CTA', value: '16–18px', description: '600, DM Sans' },
    { name: 'Preço grande', value: '64–80px', description: '700, DM Sans' },
];

export default function Typography() {
    return (
        <DesignSystemLayout>
            <PageHeader
                breadcrumb="TOKENS / TIPOGRAFIA"
                title="Tipografia"
                description="Tipografia dual: DM Serif Display para títulos e DM Sans para corpo."
            />
            <section className="ds-section">
                <TokenTable tokens={typeScale} />
            </section>
        </DesignSystemLayout>
    );
}
