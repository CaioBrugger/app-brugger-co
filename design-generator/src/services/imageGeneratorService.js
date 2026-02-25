/**
 * imageGeneratorService.js
 *
 * Gera imagens com FLUX via inference.sh (primário) ou OpenRouter (fallback).
 *
 * inference.sh usa API assíncrona (job-based com polling):
 *   POST https://api.inference.sh/apps/run  → { task_id }
 *   GET  https://api.inference.sh/tasks/{task_id} → { status, output }
 *
 * OpenRouter usa chamada síncrona:
 *   POST https://openrouter.ai/api/v1/images/generations → { data: [{ url }] }
 */

const INFERENCE_API_KEY   = import.meta.env.VITE_INFERENCE_API_KEY;
const OPENROUTER_API_KEY  = import.meta.env.VITE_OPENROUTER_API_KEY || import.meta.env.VITE_CLAUDE_API_KEY;

const INFERENCE_BASE      = 'https://api.inference.sh';
const INFERENCE_FLUX_APP  = 'flux-pro-1.1';        // app no inference.sh
const OPENROUTER_MODEL    = 'black-forest-labs/flux-1.1-pro';

const POLL_INTERVAL_MS = 3000;   // checar a cada 3s
const POLL_TIMEOUT_MS  = 180000; // desistir após 3min

// ─── Helpers de tamanho ────────────────────────────────────────────────────────
function aspectToDimensions(aspect) {
    const map = {
        '16:9': { width: 1024, height: 576 },
        '1:1':  { width: 1024, height: 1024 },
        '2:3':  { width: 768,  height: 1024 },
        '3:2':  { width: 1024, height: 768  },
        '4:3':  { width: 1024, height: 768  },
    };
    return map[aspect] || { width: 1024, height: 768 };
}

function aspectToSize(aspect) {
    const { width, height } = aspectToDimensions(aspect);
    return `${width}x${height}`;
}

// ─── inference.sh — polling helper ───────────────────────────────────────────
/**
 * Submete um job ao inference.sh e aguarda conclusão via polling.
 *
 * @param {string} prompt
 * @param {string} aspect
 * @param {AbortSignal} [signal]
 * @returns {Promise<string>} URL da imagem gerada
 */
async function generateViaInferenceSh(prompt, aspect, signal) {
    const { width, height } = aspectToDimensions(aspect);

    // 1. Submeter job
    const runResp = await fetch(`${INFERENCE_BASE}/apps/run`, {
        method: 'POST',
        signal,
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${INFERENCE_API_KEY}`,
        },
        body: JSON.stringify({
            app: INFERENCE_FLUX_APP,
            input: {
                prompt,
                width,
                height,
                num_images_per_prompt: 1,
            },
        }),
    });

    if (!runResp.ok) {
        const err = await runResp.json().catch(() => ({}));
        throw new Error(err.error?.message || err.message || `inference.sh erro ${runResp.status}`);
    }

    const runData = await runResp.json();
    const taskId = runData.task_id || runData.id;
    if (!taskId) throw new Error('inference.sh não retornou task_id');

    // 2. Polling
    const deadline = Date.now() + POLL_TIMEOUT_MS;

    while (Date.now() < deadline) {
        if (signal?.aborted) throw new DOMException('Aborted', 'AbortError');

        await new Promise(r => setTimeout(r, POLL_INTERVAL_MS));

        const pollResp = await fetch(`${INFERENCE_BASE}/tasks/${taskId}`, {
            signal,
            headers: { 'Authorization': `Bearer ${INFERENCE_API_KEY}` },
        });

        if (!pollResp.ok) continue; // ignora erros transientes

        const pollData = await pollResp.json();
        const status = pollData.status?.toLowerCase() || '';

        if (status === 'completed' || status === 'succeeded' || status === 'success') {
            // Extrair URL da saída
            const output = pollData.output || pollData.result || {};
            const url =
                output.image_url ||
                output.url ||
                output.images?.[0] ||
                (Array.isArray(pollData.output) ? pollData.output[0] : null);

            if (!url) throw new Error('inference.sh: imagem concluída mas URL não encontrada');
            return url;
        }

        if (status === 'failed' || status === 'error' || status === 'cancelled') {
            throw new Error(`inference.sh: task falhou com status "${status}"`);
        }

        // status 'queued' | 'running' | 'processing' → continuar polling
    }

    throw new Error('inference.sh: timeout aguardando geração da imagem');
}

// ─── OpenRouter — fallback ────────────────────────────────────────────────────
async function generateViaOpenRouter(prompt, style, aspect, signal) {
    const fullPrompt = style ? `${prompt}, ${style}` : prompt;
    const size = aspectToSize(aspect);

    const resp = await fetch('https://openrouter.ai/api/v1/images/generations', {
        method: 'POST',
        signal,
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
            'HTTP-Referer': 'http://localhost:3000',
            'X-Title': 'Brugger CO Toolbox',
        },
        body: JSON.stringify({
            model: OPENROUTER_MODEL,
            prompt: fullPrompt,
            n: 1,
            size,
        }),
    });

    if (!resp.ok) {
        const err = await resp.json().catch(() => ({}));
        throw new Error(err.error?.message || `OpenRouter imagem erro ${resp.status}`);
    }

    const data = await resp.json();
    const url = data.data?.[0]?.url;
    if (!url) throw new Error('OpenRouter: URL da imagem não retornada');
    return url;
}

// ─── Download como ArrayBuffer ────────────────────────────────────────────────
async function fetchImageAsArrayBuffer(url, signal) {
    const proxies = [
        url,
        `https://corsproxy.io/?${encodeURIComponent(url)}`,
        `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(url)}`,
    ];

    for (const proxyUrl of proxies) {
        try {
            const r = await fetch(proxyUrl, { signal });
            if (r.ok) return await r.arrayBuffer();
        } catch (e) {
            if (e.name === 'AbortError') throw e;
        }
    }

    throw new Error(`Não foi possível fazer download da imagem: ${url}`);
}

// ─── Export principal ─────────────────────────────────────────────────────────
/**
 * Gera múltiplas imagens a partir de blocos extraídos do Markdown.
 * Usa inference.sh como primário e OpenRouter como fallback.
 * Falha individual não cancela as outras.
 *
 * @param {Array<{ index, prompt, style, aspect }>} blocks
 * @param {AbortSignal} [signal]
 * @param {Function} [onImageProgress] — ({ done, total })
 * @returns {Promise<Array<{ index, url, arrayBuffer, error }>>}
 */
export async function generateImages(blocks, signal, onImageProgress) {
    if (!blocks || blocks.length === 0) return [];

    const results = [];
    let done = 0;

    for (const block of blocks) {
        if (signal?.aborted) break;

        let url = null;
        let errorMsg = null;

        // Montar prompt completo com estilo
        const fullPrompt = block.style
            ? `${block.prompt}, ${block.style}`
            : block.prompt;

        // Tentar inference.sh primeiro (se chave disponível)
        if (INFERENCE_API_KEY) {
            try {
                url = await generateViaInferenceSh(fullPrompt, block.aspect, signal);
            } catch (e) {
                if (e.name === 'AbortError') throw e;
                console.warn(`[ImageGen] inference.sh falhou para imagem ${block.index}, tentando OpenRouter:`, e.message);
            }
        }

        // Fallback: OpenRouter
        if (!url && OPENROUTER_API_KEY) {
            try {
                url = await generateViaOpenRouter(block.prompt, block.style, block.aspect, signal);
            } catch (e) {
                if (e.name === 'AbortError') throw e;
                errorMsg = e.message;
                console.warn(`[ImageGen] OpenRouter também falhou para imagem ${block.index}:`, e.message);
            }
        }

        if (!url && !errorMsg) {
            errorMsg = 'Nenhum provedor de imagem disponível (configure VITE_INFERENCE_API_KEY ou VITE_OPENROUTER_API_KEY)';
        }

        // Download como ArrayBuffer para inserção no DOCX
        let arrayBuffer = null;
        if (url) {
            try {
                arrayBuffer = await fetchImageAsArrayBuffer(url, signal);
            } catch (e) {
                if (e.name === 'AbortError') throw e;
                console.warn(`[ImageGen] Download falhou para imagem ${block.index}:`, e.message);
            }
        }

        results.push({ index: block.index, url, arrayBuffer, error: errorMsg });

        done++;
        onImageProgress?.({ done, total: blocks.length });
    }

    return results;
}
