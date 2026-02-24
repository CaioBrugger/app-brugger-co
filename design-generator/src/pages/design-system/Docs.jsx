import { DesignSystemLayout, PageHeader } from '../../components/design-system';

const manualContent = `
## Tech Stack
- **Framework**: React / Vite / React Router
- **CSS Solution**: Vanilla CSS Variables (\`style.css\`)
- **Icons**: SVG Inline (Lucide-inspired)
- **Fonts**: 'DM Serif Display' para headings, 'DM Sans' para todo o resto.

## Design Token Implementation
- **Primary Color**: \`--color-accent\` / #C9A962 → Ouro
- **Backgrounds**: \`--color-bg\` (#0C0C0E) e \`--color-surface\` (#131316)
- **Text**: \`--color-text\` (brancos) e \`--color-text-secondary\` (cinzas)
- **Border Radius**: \`--radius-lg\` (16px) para containers grandes, \`--radius-md\` (10px) para botões.
- **Dark Mode**: Padrão único. O sistema não usa Light Mode.

## Component Usage Rules
1. **Páginas e Sessões**: Toda seção nova ganha a classe \`.ds-section\` ou seu equivalente real no site principal.
2. **Textos**: NUNCA coloque textos brancos puros (\`#FFF\`) no parágrafo. Utilize sempre os tokens.
3. **Botões**: Elementos primários de ação usam a classe base predefinida (\`.ds-btn-primary\`).

## Regras Estéticas (Aesthetic Rules)
- O layout deve ter a aparência de um "Manuscrito Antigo Digital".
- Alto contraste entre fundo extremamente escuro e o brilho do ouro (\`#C9A962\`).
- Espaços grandes formam o design. "Quando achar que está bom o espaço, dobre-o" (para seções).
- Elementos (como badges de módulo) utilizam UPPERCASE e letter-spacing alargado (0.15em).
`;

export default function Docs() {
    return (
        <DesignSystemLayout>
            <PageHeader
                breadcrumb="DESIGN SYSTEM / DOCUMENTAÇÃO"
                title="Manual de IA"
                description="Instruções técnicas de implementação para LLMs e desenvolvedores."
            />

            <section className="ds-section">
                <div style={{
                    background: 'var(--color-surface-2)',
                    padding: '2rem',
                    borderRadius: 'var(--radius-lg)',
                    border: '1px solid var(--color-border)',
                    color: 'var(--color-text-secondary)'
                }}>
                    <pre style={{ whiteSpace: 'pre-wrap', fontFamily: 'inherit', lineHeight: 1.6 }}>
                        {manualContent.trim()}
                    </pre>
                </div>
            </section>
        </DesignSystemLayout>
    );
}
