import { useState } from 'react';

export default function BuilderSidebar({ selectedSectionId, sections, onRegenerate, isGenerating }) {
    const [instructions, setInstructions] = useState('');

    const section = sections.find(s => s.id === selectedSectionId);

    if (!selectedSectionId || !section) {
        return (
            <div style={{ width: '350px', borderLeft: '1px solid var(--sidebar-border)', background: 'var(--sidebar-bg)', padding: '1.5rem', display: 'flex', flexDirection: 'column' }}>
                <h3 style={{ margin: '0 0 1rem 0', color: 'var(--text-color)' }}>Edição de Sessão</h3>
                <div style={{ color: 'var(--text-muted)' }}>
                    Passe o mouse sobre uma sessão na visualização à esquerda e clique em "Editar / Regerar Variação" para abrir as opções de modificação aqui.
                </div>
            </div>
        );
    }

    const handleSend = () => {
        if (instructions.trim() && onRegenerate) {
            onRegenerate(selectedSectionId, instructions);
            setInstructions('');
        }
    };

    return (
        <div style={{
            width: '400px',
            borderLeft: '1px solid var(--color-border)',
            background: 'var(--color-surface)',
            padding: '2rem',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '-4px 0 24px rgba(0,0,0,0.2)',
            zIndex: 10
        }}>
            <h3 style={{ margin: '0 0 1.5rem 0', color: 'var(--color-text)', fontFamily: 'var(--font-heading)', fontSize: '24px', fontWeight: 'normal' }}>
                Refinar Design<span style={{ color: 'var(--color-accent)' }}>.</span>
            </h3>

            <div style={{
                padding: '1.25rem',
                background: 'var(--color-surface-2)',
                borderRadius: 'var(--radius-md)',
                marginBottom: '1.5rem',
                border: '1px solid var(--color-border-light)'
            }}>
                <strong style={{ color: 'var(--color-accent)', fontFamily: 'var(--font-body)', fontSize: '12px', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Sessão Selecionada</strong><br />
                <span style={{ fontSize: '18px', color: 'var(--color-text)', marginTop: '0.25rem', display: 'block' }}>{section.name || section.id}</span>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', marginBottom: '1.5rem', color: 'var(--color-text-secondary)', fontSize: '0.95rem', lineHeight: '1.6' }}>
                <p>Nesta área você pode pedir ao Gemini para fazer ajustes precisos apenas na sessão selecionada. O resto do site não será afetado.</p>
                <p style={{ marginTop: '1rem', color: 'var(--color-text-muted)' }}>Exemplos de instruções:</p>
                <ul style={{ paddingLeft: '1.2rem', marginTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <li>"Mude a cor de fundo para vermelho escuro"</li>
                    <li>"Deixe a headline maior e com serifas"</li>
                    <li>"Reescreva os bullets com mais persuasão focada em escassez"</li>
                    <li>"Layout totalmente diferente com texto na direita"</li>
                </ul>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <textarea
                    placeholder="Instruções para o Gemini..."
                    rows={5}
                    value={instructions}
                    onChange={(e) => setInstructions(e.target.value)}
                    disabled={isGenerating}
                    style={{
                        resize: 'none',
                        background: 'var(--color-bg)',
                        border: '1px solid var(--color-border)',
                        color: 'var(--color-text)',
                        padding: '1rem',
                        fontFamily: 'var(--font-body)',
                        fontSize: '0.95rem',
                        borderRadius: 'var(--radius-sm)',
                        outline: 'none',
                        boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.1)'
                    }}
                />
                <button
                    onClick={handleSend}
                    disabled={!instructions.trim() || isGenerating}
                    style={{
                        background: 'var(--color-accent)',
                        color: '#0C0C0E',
                        border: 'none',
                        padding: '1rem',
                        fontFamily: 'var(--font-body)',
                        fontWeight: '600',
                        fontSize: '1rem',
                        borderRadius: 'var(--radius-sm)',
                        cursor: (!instructions.trim() || isGenerating) ? 'not-allowed' : 'pointer',
                        opacity: (!instructions.trim() || isGenerating) ? 0.5 : 1,
                        transition: 'all 0.3s ease',
                        boxShadow: '0 4px 15px rgba(201, 169, 98, 0.2)'
                    }}
                >
                    {isGenerating ? 'Trabalhando...' : 'Enviar Instrução ✨'}
                </button>
            </div>
        </div>
    );
}
