import React, { useState, useEffect, useRef } from 'react';

export default function BuilderCommandPalette({
    selectedSectionId,
    sections,
    onRegenerate,
    isGenerating,
    onClose,
    variations,
    onPickVariation
}) {
    const [instructions, setInstructions] = useState('');
    const inputRef = useRef(null);

    useEffect(() => {
        if (selectedSectionId && inputRef.current) {
            inputRef.current.focus();
            setInstructions('');
        }
    }, [selectedSectionId]);

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') onClose();
            if (e.key === 'Enter' && e.ctrlKey) handleSend();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onClose]);

    if (!selectedSectionId) return null;

    const section = sections.find(s => s.id === selectedSectionId) || {};
    const title = section.name || section.id || 'Sessão Desconhecida';

    const handleSend = () => {
        if (!instructions.trim() || isGenerating) return;
        onRegenerate(selectedSectionId, instructions);
    };

    const hasVariations = variations && variations.length > 0;

    return (
        <div style={{
            position: 'absolute',
            bottom: '40px',
            left: '50%',
            transform: 'translateX(-50%)',
            width: hasVariations ? '900px' : '600px',
            maxWidth: '95vw',
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-lg)',
            padding: '1.5rem',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 20px rgba(201, 169, 98, 0.1)',
            backdropFilter: 'blur(16px)',
            zIndex: 10000,
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem',
            fontFamily: 'var(--font-body)',
            transition: 'width 0.3s ease'
        }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ color: 'var(--accent)', fontSize: '18px' }}>✨</span>
                    <div>
                        <h4 style={{ margin: 0, color: 'var(--text)', fontSize: '16px', fontWeight: 600 }}>
                            {hasVariations ? 'Escolha sua Variação' : 'Refinar Design'}
                        </h4>
                        <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>Editando: {title}</span>
                    </div>
                </div>
                <button
                    onClick={onClose}
                    style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px', fontSize: '16px' }}
                >
                    ✕
                </button>
            </div>

            {/* VARIATION PICKER — shows 3 cards after generation */}
            {hasVariations && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
                    {variations.map((v, idx) => (
                        <div
                            key={idx}
                            onClick={() => onPickVariation(selectedSectionId, v.html)}
                            style={{
                                background: 'var(--bg)',
                                border: '1px solid var(--border)',
                                borderRadius: 'var(--radius-md)',
                                padding: '1rem',
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '0.5rem'
                            }}
                            onMouseEnter={e => {
                                e.currentTarget.style.borderColor = 'var(--accent)';
                                e.currentTarget.style.transform = 'translateY(-2px)';
                            }}
                            onMouseLeave={e => {
                                e.currentTarget.style.borderColor = 'var(--border)';
                                e.currentTarget.style.transform = 'translateY(0)';
                            }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <span style={{
                                    background: 'var(--accent)',
                                    color: '#0C0C0E',
                                    width: '24px', height: '24px',
                                    borderRadius: '50%',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontSize: '12px', fontWeight: 'bold'
                                }}>{idx + 1}</span>
                                <h5 style={{ margin: 0, color: 'var(--text)', fontSize: '14px', fontWeight: 600 }}>{v.title}</h5>
                            </div>
                            <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '12px', lineHeight: 1.4 }}>{v.description}</p>
                            <span style={{ color: 'var(--accent)', fontSize: '11px', fontWeight: 600, marginTop: 'auto' }}>Usar esta variação →</span>
                        </div>
                    ))}
                </div>
            )}

            {/* INPUT AREA — always visible */}
            {!hasVariations && (
                <>
                    <div style={{ position: 'relative' }}>
                        <textarea
                            ref={inputRef}
                            style={{
                                width: '100%',
                                background: 'var(--bg)',
                                border: '1px solid var(--border)',
                                color: 'var(--text)',
                                padding: '1rem',
                                paddingRight: '7rem',
                                fontFamily: 'var(--font-body)',
                                fontSize: '14px',
                                borderRadius: 'var(--radius-md)',
                                outline: 'none',
                                resize: 'none',
                                minHeight: '80px'
                            }}
                            placeholder="O que você quer mudar? (ex: Mude o fundo para gradiente, aumente o botão CTA, adicione mais badges)"
                            value={instructions}
                            onChange={e => setInstructions(e.target.value)}
                            disabled={isGenerating}
                        />
                        <button
                            onClick={handleSend}
                            disabled={isGenerating || !instructions.trim()}
                            style={{
                                position: 'absolute',
                                bottom: '12px',
                                right: '12px',
                                background: (isGenerating || !instructions.trim()) ? 'var(--surface)' : 'var(--accent)',
                                color: (isGenerating || !instructions.trim()) ? 'var(--text-muted)' : '#0C0C0E',
                                border: 'none',
                                borderRadius: '4px',
                                padding: '6px 16px',
                                cursor: (isGenerating || !instructions.trim()) ? 'not-allowed' : 'pointer',
                                fontWeight: 'bold',
                                transition: 'all 0.2s',
                                height: '32px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px'
                            }}
                        >
                            {isGenerating ? '⏳ Gerando 3 variações...' : 'Gerar 3 Variações ✨'}
                        </button>
                    </div>

                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', textAlign: 'right' }}>
                        <kbd style={{ background: 'var(--bg)', padding: '2px 4px', borderRadius: '3px' }}>Ctrl + Enter</kbd> para enviar
                    </div>
                </>
            )}
        </div>
    );
}
