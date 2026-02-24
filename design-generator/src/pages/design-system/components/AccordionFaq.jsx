import { useState } from 'react';
import { DesignSystemLayout, PageHeader, ComponentSection, GuidelinesSection } from '../../../components/design-system';

const faqItems = [
    { q: 'Posso personalizar o design system?', a: 'Sim, todos os tokens são CSS Custom Properties e podem ser sobrescritos no :root ou em qualquer escopo.' },
    { q: 'Funciona com Tailwind CSS?', a: 'Sim. Os tokens podem ser mapeados para o tailwind.config.js na seção theme.extend.' },
    { q: 'Quais componentes estão incluídos?', a: 'Botões (primário, secundário, outline), cards, badges, blockquotes, FAQ accordion, barra sticky e seção de preço.' },
];

export default function AccordionFaq() {
    const [openFaq, setOpenFaq] = useState(0);

    return (
        <DesignSystemLayout>
            <PageHeader
                breadcrumb="BIBLIOTECA UI / ACCORDION FAQ"
                title="Accordion FAQ"
                description="Listas expansíveis ideais para perguntas frequentes e objeções de vendas."
            />

            <ComponentSection title="Exemplo Interativo" tag="Expansível">
                <div className="ds-faq-list" style={{ maxWidth: '600px' }}>
                    {faqItems.map((item, i) => (
                        <div key={i} className={`ds-faq-item ${openFaq === i ? 'open' : ''}`}>
                            <button className="ds-faq-question" onClick={() => setOpenFaq(openFaq === i ? null : i)}>
                                <span>{item.q}</span>
                                <span className="ds-faq-icon">{openFaq === i ? '−' : '+'}</span>
                            </button>
                            {openFaq === i && <div className="ds-faq-answer">{item.a}</div>}
                        </div>
                    ))}
                </div>
            </ComponentSection>

            <GuidelinesSection
                dos={[
                    { title: "Respostas Curtas", description: "Mantenha o conteúdo da resposta direto ao ponto." },
                    { title: "Feedback Visual", description: "Garanta que o ícone (+/-) altere corretamente ao abrir e fechar." }
                ]}
                donts={[
                    { title: "Múltiplos Abertos", description: "Evite manter muitos itens abertos ao mesmo tempo, feche os anteriores se possível para economizar espaço em mobile." }
                ]}
            />
        </DesignSystemLayout>
    );
}
