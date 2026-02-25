/**
 * contentGeneratorService.js
 *
 * Chama Claude via OpenRouter e retorna Markdown raw com blocos
 * [IMAGEM]...[/IMAGEM] intercalados quando o tipo é ebook_imagens.
 *
 * Exporta:
 *   - generateContent(systemPrompt, userPrompt, signal?) → string (Markdown)
 *   - extractImageBlocks(markdown) → [{ index, prompt, style, aspect, placeholder }]
 */

const OPENROUTER_API_KEY = import.meta.env.VITE_OPENROUTER_API_KEY || import.meta.env.VITE_CLAUDE_API_KEY;
const CONTENT_MODEL = 'anthropic/claude-sonnet-4.6';

/**
 * Chama Claude via OpenRouter com suporte a AbortSignal.
 *
 * @param {string} systemPrompt
 * @param {string} userPrompt
 * @param {AbortSignal} [signal]
 * @returns {Promise<string>} Markdown gerado
 */
export async function generateContent(systemPrompt, userPrompt, signal) {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        signal,
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
            'HTTP-Referer': 'http://localhost:3000',
            'X-Title': 'Brugger CO Toolbox',
        },
        body: JSON.stringify({
            model: CONTENT_MODEL,
            max_tokens: 16384,
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt },
            ],
        }),
    });

    if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        console.error('[ContentGenerator] API Error:', err);
        throw new Error(err.error?.message || `Erro na geração de conteúdo: ${response.status}`);
    }

    const data = await response.json();

    if (data.error) {
        throw new Error(data.error.message || 'Erro desconhecido na geração de conteúdo');
    }

    const text = data.choices?.[0]?.message?.content;
    if (!text) throw new Error('Resposta vazia do gerador de conteúdo');

    return text;
}

/**
 * Extrai todos os blocos [IMAGEM]...[/IMAGEM] de um Markdown.
 *
 * Formato esperado:
 * [IMAGEM]
 * prompt: A serene biblical landscape...
 * style: photorealistic, warm golden tones
 * aspect: 16:9
 * [/IMAGEM]
 *
 * @param {string} markdown
 * @returns {Array<{ index: number, prompt: string, style: string, aspect: string, placeholder: string, start: number, end: number }>}
 */
export function extractImageBlocks(markdown) {
    const blocks = [];
    const regex = /\[IMAGEM\]([\s\S]*?)\[\/IMAGEM\]/g;
    let match;
    let index = 0;

    while ((match = regex.exec(markdown)) !== null) {
        const inner = match[1];
        const promptMatch = inner.match(/prompt:\s*(.+)/i);
        const styleMatch = inner.match(/style:\s*(.+)/i);
        const aspectMatch = inner.match(/aspect:\s*(.+)/i);

        const prompt = promptMatch ? promptMatch[1].trim() : 'Biblical scene, warm golden light, cinematic';
        const style = styleMatch ? styleMatch[1].trim() : 'photorealistic, warm tones, cinematic lighting';
        const aspect = aspectMatch ? aspectMatch[1].trim() : '16:9';

        const placeholder = `__IMAGE_${index}__`;

        blocks.push({
            index,
            prompt,
            style,
            aspect,
            placeholder,
            fullMatch: match[0],
            start: match.index,
            end: match.index + match[0].length,
        });

        index++;
    }

    return blocks;
}

/**
 * Substitui os blocos [IMAGEM]...[/IMAGEM] por placeholders únicos.
 * Útil para processar o Markdown sem as marcações de imagem.
 *
 * @param {string} markdown
 * @param {Array} blocks - Resultado de extractImageBlocks()
 * @returns {string} Markdown com placeholders
 */
export function replaceImageBlocksWithPlaceholders(markdown, blocks) {
    let result = markdown;
    // Substituir de trás para frente para não afetar os índices
    for (let i = blocks.length - 1; i >= 0; i--) {
        const block = blocks[i];
        result = result.slice(0, block.start) + `\n${block.placeholder}\n` + result.slice(block.end);
    }
    return result;
}
