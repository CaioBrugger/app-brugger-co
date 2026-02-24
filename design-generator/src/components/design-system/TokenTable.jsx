import { useState, useCallback, useRef } from 'react';

export function TokenTable({ tokens }) {
    const [copiedToken, setCopiedToken] = useState(null);
    const [toast, setToast] = useState({ msg: '', visible: false });
    const toastTimer = useRef(null);

    const showToast = useCallback((msg) => {
        clearTimeout(toastTimer.current);
        setToast({ msg, visible: true });
        toastTimer.current = setTimeout(() => setToast(t => ({ ...t, visible: false })), 2000);
    }, []);

    const copyToClipboard = useCallback((text, label) => {
        navigator.clipboard.writeText(text);
        setCopiedToken(label);
        showToast(`${label} copiado!`);
        setTimeout(() => setCopiedToken(null), 2000);
    }, [showToast]);

    return (
        <div className="ds-token-table-wrapper">
            <table className="ds-token-table">
                <thead>
                    <tr>
                        <th>Nome / Token</th>
                        <th>Valor</th>
                        <th>Uso / Descrição</th>
                        <th>Preview</th>
                    </tr>
                </thead>
                <tbody>
                    {tokens.map((token, idx) => (
                        <tr key={idx} onClick={() => copyToClipboard(token.value || token.hex, token.name || token.token)}>
                            <td>
                                <code>{token.name || token.token}</code>
                            </td>
                            <td>
                                <span className="ds-token-value">{token.value || token.hex}</span>
                            </td>
                            <td>
                                <span className="ds-token-desc">{token.description || token.use || token.label}</span>
                            </td>
                            <td>
                                {token.hex && (
                                    <div className="ds-token-color-preview" style={{ backgroundColor: token.hex, border: token.hex === '#0C0C0E' ? '1px solid #2A2A32' : 'none' }}></div>
                                )}
                                {token.px && (
                                    <div className="ds-token-spacing-preview" style={{ width: token.px }}></div>
                                )}
                                {!token.hex && !token.px && token.value && token.value.includes('px') && !token.value.includes('shadow') && (
                                    <div className="ds-token-radius-preview" style={{ borderRadius: token.value }}></div>
                                )}
                                {token.value && token.value.includes('shadow') && (
                                    <div className="ds-token-shadow-preview" style={{ boxShadow: token.value }}></div>
                                )}
                                {copiedToken === (token.name || token.token) && <span className="ds-token-copied">✓</span>}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
            <div className={`toast ds-toast ${toast.visible ? 'visible' : ''}`}>{toast.msg}</div>
        </div>
    );
}
