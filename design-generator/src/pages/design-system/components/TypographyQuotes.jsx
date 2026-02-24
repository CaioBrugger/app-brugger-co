import { DesignSystemLayout, PageHeader, ComponentSection, GuidelinesSection } from '../../../components/design-system';

export default function TypographyQuotes() {
    return (
        <DesignSystemLayout>
            <PageHeader
                breadcrumb="BIBLIOTECA UI / TIPOGRAFIA & QUOTES"
                title="Tipografia & Quotes"
                description="Elementos textuais focados, especialmente úteis para destacar trechos bíblicos e testemunhos."
            />

            <ComponentSection title="Citação Bíblica" tag="Destaque">
                <blockquote className="ds-blockquote" style={{ maxWidth: '600px' }}>
                    <p>"Porque a palavra de Deus é viva, e eficaz, e mais penetrante do que qualquer espada de dois gumes."</p>
                    <cite>— Hebreus 4:12</cite>
                </blockquote>
            </ComponentSection>

            <GuidelinesSection
                dos={[
                    { title: "Separação", description: "Utilize blockquotes como respiro visual entre seções densas." },
                    { title: "Estilo", description: "Sempre usar itálico para o texto da citação e DM Serif Display." }
                ]}
                donts={[
                    { title: "Tamanho", description: "Citações muito longas perdem o impacto visual e cansam a leitura." }
                ]}
            />
        </DesignSystemLayout>
    );
}
