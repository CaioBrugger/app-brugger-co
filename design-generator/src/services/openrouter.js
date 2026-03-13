const OPENROUTER_API_KEY =
    import.meta.env.VITE_OPENROUTER_API_KEY ||
    import.meta.env.NEXT_PUBLIC_OPENROUTER_API_KEY;

function getAppOrigin() {
    if (typeof window !== 'undefined' && window.location?.origin) {
        return window.location.origin;
    }

    return 'http://localhost:3000';
}

export function getOpenRouterApiKey() {
    if (!OPENROUTER_API_KEY) {
        throw new Error(
            'OpenRouter não configurado. Defina VITE_OPENROUTER_API_KEY no Netlify e faça um novo deploy.'
        );
    }

    return OPENROUTER_API_KEY;
}

export function getOpenRouterHeaders() {
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getOpenRouterApiKey()}`,
        'HTTP-Referer': getAppOrigin(),
        'X-Title': 'Brugger CO Toolbox',
    };
}

export function buildOpenRouterErrorMessage(status, err, fallbackLabel = 'OpenRouter') {
    const apiMessage = err?.error?.message;

    if (status === 401) {
        return apiMessage
            ? `Erro de autenticação no ${fallbackLabel}: ${apiMessage}. Verifique se o deploy recebeu VITE_OPENROUTER_API_KEY válida e se a chave ainda existe no OpenRouter.`
            : `Erro de autenticação no ${fallbackLabel}. Verifique se o deploy recebeu VITE_OPENROUTER_API_KEY válida e se a chave ainda existe no OpenRouter.`;
    }

    return apiMessage || `Erro na API ${fallbackLabel}: ${status}`;
}
