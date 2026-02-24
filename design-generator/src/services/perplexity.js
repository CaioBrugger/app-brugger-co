export async function researchTopic(productDescription) {
    const OPENROUTER_API_KEY = import.meta.env.VITE_OPENROUTER_API_KEY;

    if (!OPENROUTER_API_KEY) {
        throw new Error('Chave VITE_OPENROUTER_API_KEY não encontrada no .env para o Perplexity.');
    }

    const systemPrompt = `Você é um Estrategista de Marketing Direto Sênior. 
Faça uma pesquisa focada em CONVERSÃO sobre o tópico do produto fornecido pelo usuário.
Entregue um relatório direto com:
1. Dores (Pain points) profundas do público-alvo.
2. Desejos inconfessáveis e aspirações.
3. Ângulos de marketing (Hooks) mais fortes.
4. Possíveis objeções e como quebrá-las.
Seja conciso e use bullet points.`;

    const userPrompt = `Produto/Oferta: ${productDescription}`;

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
            'HTTP-Referer': 'http://localhost:3000',
            'X-Title': 'Brugger CO Toolbox'
        },
        body: JSON.stringify({
            model: 'perplexity/sonar',
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt }
            ]
        })
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Perplexity API Error via OpenRouter:', errorData);
        throw new Error(`Erro na API do Perplexity (OpenRouter): ${response.status} - ${errorData.error?.message || 'Desconhecido'}`);
    }

    const data = await response.json();
    const text = data.choices?.[0]?.message?.content;

    if (!text) {
        throw new Error('Resposta vazia do Perplexity (OpenRouter).');
    }

    return text;
}
