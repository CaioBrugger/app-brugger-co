import { DesignSystemLayout, PageHeader, ComponentSection, GuidelinesSection } from '../../../components/design-system';

export default function Price() {
    return (
        <DesignSystemLayout>
            <PageHeader
                breadcrumb="BIBLIOTECA UI / SEÇÃO DE PREÇO"
                title="Seção de Preço"
                description="O elemento central de conversão da landing page."
            />

            <ComponentSection title="Anatomia" tag="Conversão">
                <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', padding: '2rem', maxWidth: '400px', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <div style={{ textAlign: 'center' }}>
                        <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-accent)', textTransform: 'uppercase', letterSpacing: '0.15em' }}>OFERTA POR TEMPO LIMITADO</span>
                        <h3 style={{ margin: '0.5rem 0', fontFamily: 'var(--font-heading)', fontSize: '24px' }}>Nome do Produto</h3>
                        <p style={{ color: 'var(--color-text-secondary)', fontSize: '14px' }}>Acesso completo a todos os módulos.</p>
                    </div>

                    <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        {['Benefício 1 incluído', 'Benefício 2 incluído', 'Garantia de 30 dias'].map((b, i) => (
                            <li key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-text-secondary)', fontSize: '15px' }}>
                                <span style={{ color: 'var(--color-success)' }}>✓</span> {b}
                            </li>
                        ))}
                    </ul>

                    <div style={{ textAlign: 'center', marginTop: '1rem' }}>
                        <div style={{ color: 'var(--color-text-muted)', textDecoration: 'line-through', fontSize: '16px' }}>De R$ 197,00</div>
                        <div style={{ color: 'var(--color-text-secondary)', fontSize: '14px', marginBottom: '0.25rem' }}>Por apenas</div>
                        <div style={{ color: 'var(--color-accent)', fontSize: '48px', fontWeight: 700, lineHeight: 1 }}>R$ 47,00</div>
                    </div>

                    <button className="ds-btn-primary" style={{ width: '100%', padding: '1rem' }}>Quero Adquirir Agora</button>

                    <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', fontSize: '12px', color: 'var(--color-text-muted)' }}>
                        <span>🔒 Compra segura</span>
                        <span>⚡ Acesso imediato</span>
                    </div>
                </div>
            </ComponentSection>

            <GuidelinesSection
                dos={[
                    { title: "Contraste Imediato", description: "O preço atual deve ser a coisa mais chamativa da seção." },
                    { title: "Escassez", description: "Sempre reforce o motivo da oferta (ex: tempo limitado)." }
                ]}
                donts={[
                    { title: "Informação Oculta", description: "Nunca esconda se é assinatura ou pagamento único. Deixe isso claro próximo ao preço." }
                ]}
            />
        </DesignSystemLayout>
    );
}
