import { DesignSystemLayout, PageHeader, ComponentSection, GuidelinesSection } from '../../../components/design-system';

export default function Buttons() {
    return (
        <DesignSystemLayout>
            <PageHeader
                breadcrumb="BIBLIOTECA UI / BOTÕES"
                title="Botões"
                description="O elemento principal para guiar a ação do usuário de forma clara e inequívoca."
            />

            <ComponentSection title="Variantes" tag="Ações">
                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                    <button className="ds-btn-primary">Adquirir Agora</button>
                    <button className="ds-btn-secondary">Saiba Mais</button>
                    <button className="ds-btn-outline">Ver Detalhes</button>
                </div>
            </ComponentSection>

            <ComponentSection title="Estados" tag="Feedback">
                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                    <button className="ds-btn-primary" disabled>Desabilitado</button>
                </div>
            </ComponentSection>

            <GuidelinesSection
                dos={[
                    { title: "Hierarquia Visual", description: "Use apenas um botão primário por tela. Use variantes secundárias para ações de suporte." },
                    { title: "Verbos de Ação", description: "Comece com verbos fortes: 'Comprar', 'Adquirir', 'Inscrever-se'. Evite 'Ok' ou 'Sim'." }
                ]}
                donts={[
                    { title: "Muitos Primários", description: "Não coloque vários botões primários lado a lado. Isso confunde a decisão do usuário." },
                    { title: "Texto Longo", description: "Não crie botões com frases inteiras, mantenha no máximo de 2 a 3 palavras." }
                ]}
            />
        </DesignSystemLayout>
    );
}
