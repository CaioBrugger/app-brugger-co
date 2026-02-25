/**
 * imageGeneratorService.js
 *
 * Gera imagens via FLUX (black-forest-labs/flux-1.1-pro) através da OpenRouter API.
 * Suporta múltiplos prompts e retorna ArrayBuffers para inserção no DOCX.
 *
 * Exporta:
 *   - generateImages(blocks, signal?) → [{ index, url, arrayBuffer }]
 */

const OPENROUTER_API_KEY = import.meta.env.VITE_OPENROUTER_API_KEY || import.meta.env.VITE_CLAUDE_API_KEY;
const IMAGE_MODEL = 'black-forest-labs/flux-1.1-pro';

/**
 * Mapeia aspect ratio para o formato de tamanho aceito pela API.
 */
function aspectToSize(aspect) {
    const map = {
        '16:9': '1024x576',
        '1:1':  '1024x1024',
        '2:3':  '768x1024',
        '3:2':  '1024x768',
        '4:3':  '1024x768',
    };
    return map[aspect] || '1024x768';
}

/**
 * Gera uma única imagem via OpenRouter FLUX.
 *
 * @param {string} prompt
 * @param {string} style
 * @param {string} aspect
 * @param {AbortSignal} [signal]
 * @returns {Promise<string>} URL da imagem gerada
 */
async function generateSingleImage(prompt, style, aspect, signal) {
    const fullPrompt = style ? `${prompt}, ${style}` : prompt;
    const size = aspectToSize(aspect);

    const response = await fetch('https://openrouter.ai/api/v1/images/generations', {
        method: 'POST',
        signal,
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
            'HTTP-Referer': 'http://localhost:3000',
            'X-Title': 'Brugger CO Toolbox',
        },
        body: JSON.stringify({
            model: IMAGE_MODEL,
            prompt: fullPrompt,
            n: 1,
            size,
        }),
    });

    if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error?.message || `Erro ao gerar imagem: ${response.status}`);
    }

    const data = await response.json();
    const url = data.data?.[0]?.url;
    if (!url) throw new Error('URL da imagem não retornada pela API');

    return url;
}

/**
 * Faz o download de uma imagem e retorna como ArrayBuffer.
 *
 * @param {string} url
 * @param {AbortSignal} [signal]
 * @returns {Promise<ArrayBuffer>}
 */
async function fetchImageAsArrayBuffer(url, signal) {
    // Tentar busca direta (algumas URLs do FLUX são públicas)
    // Se CORS bloquear, tentar via proxy
    const corsProxies = [
        url, // Tentar direto primeiro
        `https://corsproxy.io/?${encodeURIComponent(url)}`,
        `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(url)}`,
    ];

    for (const proxyUrl of corsProxies) {
        try {
            const resp = await fetch(proxyUrl, { signal });
            if (resp.ok) {
                return await resp.arrayBuffer();
            }
        } catch (err) {
            if (err.name === 'AbortError') throw err;
            // Tenta próximo proxy
        }
    }

    throw new Error(`Não foi possível fazer download da imagem: ${url}`);
}

/**
 * Gera múltiplas imagens a partir de um array de blocos extraídos do Markdown.
 * Falha em uma imagem individual não cancela as outras.
 *
 * @param {Array<{ index: number, prompt: string, style: string, aspect: string }>} blocks
 * @param {AbortSignal} [signal]
 * @param {Function} [onImageProgress] - Callback({ done: number, total: number })
 * @returns {Promise<Array<{ index: number, url: string|null, arrayBuffer: ArrayBuffer|null, error: string|null }>>}
 */
export async function generateImages(blocks, signal, onImageProgress) {
    if (!blocks || blocks.length === 0) return [];

    const results = [];
    let done = 0;

    for (const block of blocks) {
        if (signal?.aborted) break;

        try {
            const url = await generateSingleImage(block.prompt, block.style, block.aspect, signal);

            let arrayBuffer = null;
            try {
                arrayBuffer = await fetchImageAsArrayBuffer(url, signal);
            } catch (fetchErr) {
                if (fetchErr.name === 'AbortError') throw fetchErr;
                console.warn(`[ImageGenerator] Não foi possível fazer download da imagem ${block.index}:`, fetchErr.message);
                // Mantém url mas arrayBuffer null — o DOCX usará um placeholder
            }

            results.push({ index: block.index, url, arrayBuffer, error: null });
        } catch (err) {
            if (err.name === 'AbortError') throw err;
            console.warn(`[ImageGenerator] Erro ao gerar imagem ${block.index}:`, err.message);
            results.push({ index: block.index, url: null, arrayBuffer: null, error: err.message });
        }

        done++;
        onImageProgress?.({ done, total: blocks.length });
    }

    return results;
}
