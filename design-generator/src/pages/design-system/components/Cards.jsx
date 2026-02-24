import { DesignSystemLayout, PageHeader, ComponentSection, GuidelinesSection } from '../../../components/design-system';

export default function Cards() {
    return (
        <DesignSystemLayout>
            <PageHeader
                breadcrumb="BIBLIOTECA UI / CARDS"
                title="Cards & Containers"
                description="Usados para agrupar conteúdo relacionado, como módulos do curso ou depoimentos."
            />

            <ComponentSection title="Variantes" tag="Agrupamento">
                <div style={{ display: 'grid', gap: '1.5rem', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))' }}>
                    <div className="ds-card-demo">
                        <div className="ds-card-demo-badge">MÓDULO 1</div>
                        <h4>Card com Badge</h4>
                        <p>Conteúdo de demonstração com tipografia secundária e espaçamento consistente.</p>
                    </div>

                    <div className="ds-card-demo ds-card-demo-bonus">
                        <span className="ds-card-demo-tag-free">GRÁTIS</span>
                        <h4>Card de Bônus</h4>
                        <p>Com tag de preço e benefício extra para o usuário.</p>
                        <div className="ds-card-demo-price">
                            <s style={{ color: 'var(--color-text-muted)' }}>R$ 97,00</s>
                            <strong style={{ color: 'var(--color-success)' }}>GRÁTIS</strong>
                        </div>
                    </div>
                </div>
            </ComponentSection>

            <GuidelinesSection
                dos={[
                    { title: "Consistência de Altura", description: "Em um grid, faça com que os cards tenham a mesma altura (stretch)." },
                    { title: "Destaque Sutil", description: "Use os badges apenas para o que for realmente importante." }
                ]}
                donts={[
                    { title: "Sobrecarga de Conteúdo", description: "Não coloque textos enormes dentro dos cards. Use-os para resumos informativos." }
                ]}
            />
        </DesignSystemLayout>
    );
}
