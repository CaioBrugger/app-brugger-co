/**
 * imageGeneratorService.js
 *
 * Gera imagens usando a API REST do Google Gemini (Nano Banana) diretamente.
 * Baseado no app funcional "Gerador de Imagens via Prompt" que usa o mesmo
 * modelo gemini-2.5-flash-image com response_modalities=["Image"].
 *
 * Fluxo:
 *   1. POST https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent
 *   2. Resposta: candidates[0].content.parts[].inlineData = { mimeType, data (base64) }
 *   3. Converte base64 → ArrayBuffer → JPEG (via Canvas)
 *
 * Fallback: Pollinations.ai (gratuito, sem API key)
 */

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || import.meta.env.NEXT_PUBLIC_GEMINI_API_KEY;

const GEMINI_BASE = 'https://generativelanguage.googleapis.com/v1beta';
const GEMINI_MODEL = 'gemini-3.1-flash-image-preview';

// ─── Helpers de tamanho ────────────────────────────────────────────────────────
function aspectToDimensions(aspect) {
    const map = {
        '16:9': { width: 1024, height: 576 },
        '1:1': { width: 1024, height: 1024 },
        '2:3': { width: 768, height: 1024 },
        '3:2': { width: 1024, height: 768 },
        '4:3': { width: 1024, height: 768 },
    };
    return map[aspect] || { width: 1024, height: 768 };
}

// ─── Gemini REST API — Image Generation ───────────────────────────────────────
/**
 * Gera imagem via Gemini REST API (mesmo backend do app Python funcional).
 *
 * @param {string} prompt
 * @param {string} aspect - Aspect ratio (ex: "16:9", "1:1")
 * @param {AbortSignal} [signal]
 * @returns {Promise<{ base64: string, mimeType: string }>}
 */
async function generateViaGemini(prompt, aspect, signal) {
    const url = `${GEMINI_BASE}/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;

    console.log(`[ImageGen] Chamando Gemini API model="${GEMINI_MODEL}", aspect="${aspect}"...`);

    const response = await fetch(url, {
        method: 'POST',
        signal,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            contents: [
                {
                    parts: [{ text: prompt }],
                },
            ],
            generationConfig: {
                responseModalities: ['IMAGE'],
                // A API Gemini não aceita width/height diretamente no REST,
                // mas aceita aspect_ratio no SDK. No REST, embute no prompt.
            },
        }),
    });

    if (!response.ok) {
        const errText = await response.text().catch(() => '');
        console.error(`[ImageGen] Gemini API erro ${response.status}:`, errText.slice(0, 500));
        let errMsg = `Gemini API ${response.status}`;
        try {
            const errJson = JSON.parse(errText);
            errMsg = errJson.error?.message || errMsg;
        } catch { }
        throw new Error(errMsg);
    }

    const data = await response.json();

    // Extrair imagem: candidates[0].content.parts[].inlineData
    const parts = data.candidates?.[0]?.content?.parts;
    if (!parts || parts.length === 0) {
        console.error('[ImageGen] Gemini API retornou sem parts:', JSON.stringify(data).slice(0, 500));
        throw new Error('Gemini API: nenhuma parte na resposta');
    }

    for (const part of parts) {
        if (part.inlineData?.data) {
            const base64 = part.inlineData.data;
            const mimeType = part.inlineData.mimeType || 'image/png';
            console.log(`[ImageGen] Gemini API gerou imagem: ${mimeType}, ~${Math.round(base64.length * 0.75 / 1024)}KB`);
            return { base64, mimeType };
        }
    }

    // Nenhuma inlineData encontrada — log diagnóstico
    const partTypes = parts.map(p => Object.keys(p).join(','));
    console.error(`[ImageGen] Gemini API: nenhum inlineData. Part types:`, partTypes);
    throw new Error('Gemini API: imagem não encontrada na resposta (sem inlineData)');
}

/**
 * Converte base64 em ArrayBuffer.
 */
function base64ToArrayBuffer(base64) {
    const binaryStr = atob(base64);
    const bytes = new Uint8Array(binaryStr.length);
    for (let i = 0; i < binaryStr.length; i++) {
        bytes[i] = binaryStr.charCodeAt(i);
    }
    return bytes.buffer;
}

// ─── Pollinations.ai — fallback gratuito ──────────────────────────────────────
function generateViaPollinations(prompt, style, aspect) {
    const { width, height } = aspectToDimensions(aspect);
    const fullPrompt = style ? `${prompt}, ${style}` : prompt;
    const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(fullPrompt)}?width=${width}&height=${height}&model=flux&nologo=true&seed=${Math.floor(Math.random() * 9999)}`;
    return url;
}

// ─── Download como ArrayBuffer ────────────────────────────────────────────────
async function fetchImageAsArrayBuffer(url, signal) {
    const timeoutMs = 130_000;
    const timeoutController = new AbortController();
    const timeoutId = setTimeout(() => timeoutController.abort(), timeoutMs);

    const combined = signal
        ? AbortSignal.any([signal, timeoutController.signal])
        : timeoutController.signal;

    try {
        // Tentar via design-cloner-server local
        try {
            const localProxy = `http://localhost:3333/fetch-image?url=${encodeURIComponent(url)}`;
            const r = await fetch(localProxy, { signal: combined });
            if (r.ok) {
                const buf = await r.arrayBuffer();
                if (buf.byteLength > 1000) return buf;
                throw new Error('Buffer vazio do proxy');
            }
        } catch (e) {
            if (e.name === 'AbortError') throw e;
        }

        // Fallback: proxies externos
        const proxies = [url, `https://corsproxy.io/?${encodeURIComponent(url)}`];
        for (const proxyUrl of proxies) {
            try {
                const r = await fetch(proxyUrl, { signal: combined });
                if (r.ok) {
                    const buf = await r.arrayBuffer();
                    if (buf.byteLength > 1000) return buf;
                }
            } catch (e) {
                if (e.name === 'AbortError') throw e;
            }
        }

        throw new Error(`Download falhou: ${url.slice(0, 80)}`);
    } finally {
        clearTimeout(timeoutId);
    }
}

// ─── Normalização via Canvas → JPEG ──────────────────────────────────────────
async function normalizeToJpeg(arrayBuffer) {
    if (!arrayBuffer || arrayBuffer.byteLength === 0) {
        return { buffer: arrayBuffer, type: 'jpg' };
    }

    return new Promise((resolve) => {
        const blob = new Blob([arrayBuffer]);
        const blobUrl = URL.createObjectURL(blob);
        const img = new Image();

        img.onload = () => {
            try {
                const canvas = document.createElement('canvas');
                canvas.width = img.naturalWidth || 1024;
                canvas.height = img.naturalHeight || 576;
                const ctx = canvas.getContext('2d');
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                ctx.drawImage(img, 0, 0);

                canvas.toBlob(
                    (jpegBlob) => {
                        URL.revokeObjectURL(blobUrl);
                        if (!jpegBlob) {
                            resolve({ buffer: arrayBuffer, type: 'jpg' });
                            return;
                        }
                        jpegBlob.arrayBuffer()
                            .then(buffer => resolve({ buffer, type: 'jpg' }))
                            .catch(() => resolve({ buffer: arrayBuffer, type: 'jpg' }));
                    },
                    'image/jpeg',
                    0.92
                );
            } catch {
                URL.revokeObjectURL(blobUrl);
                resolve({ buffer: arrayBuffer, type: 'jpg' });
            }
        };

        img.onerror = () => {
            URL.revokeObjectURL(blobUrl);
            resolve({ buffer: arrayBuffer, type: 'jpg' });
        };

        img.src = blobUrl;
    });
}

// ─── Export principal ─────────────────────────────────────────────────────────
/**
 * Gera múltiplas imagens a partir de blocos extraídos do Markdown.
 * Usa Gemini API (Nano Banana) como primário e Pollinations como fallback.
 *
 * @param {Array<{ index, prompt, style, aspect }>} blocks
 * @param {AbortSignal} [signal]
 * @param {Function} [onImageProgress]
 * @returns {Promise<Array<{ index, url, arrayBuffer, error }>>}
 */
export async function generateImages(blocks, signal, onImageProgress) {
    if (!blocks || blocks.length === 0) return [];

    const results = [];
    let done = 0;

    for (const block of blocks) {
        if (signal?.aborted) break;

        let arrayBuffer = null;
        let imageType = 'jpg';
        let errorMsg = null;
        let url = null;

        const fullPrompt = block.style
            ? `${block.prompt}, ${block.style}`
            : block.prompt;

        // ── Primário: Gemini API direta (Nano Banana) ────────────────────
        if (GEMINI_API_KEY) {
            try {
                const result = await generateViaGemini(fullPrompt, block.aspect, signal);
                const rawBuffer = base64ToArrayBuffer(result.base64);
                console.log(`[ImageGen] Imagem ${block.index} via Gemini: ${rawBuffer.byteLength} bytes (${result.mimeType})`);

                const normalized = await normalizeToJpeg(rawBuffer);
                arrayBuffer = normalized.buffer;
                imageType = normalized.type;
                console.log(`[ImageGen] Imagem ${block.index} normalizada: ${arrayBuffer.byteLength} bytes`);
            } catch (e) {
                if (e.name === 'AbortError') throw e;
                console.warn(`[ImageGen] Gemini API falhou para imagem ${block.index}:`, e.message);
                console.warn(`[ImageGen] Tentando Pollinations como fallback...`);
            }
        } else {
            console.warn('[ImageGen] VITE_GEMINI_API_KEY não configurada, usando Pollinations...');
        }

        // ── Fallback: Pollinations.ai ────────────────────────────────────
        if (!arrayBuffer) {
            try {
                url = generateViaPollinations(block.prompt, block.style, block.aspect);
                console.log(`[ImageGen] Imagem ${block.index} via Pollinations: ${url.slice(0, 80)}...`);

                const rawBuffer = await fetchImageAsArrayBuffer(url, signal);
                console.log(`[ImageGen] Imagem ${block.index} download OK: ${rawBuffer.byteLength} bytes`);

                const normalized = await normalizeToJpeg(rawBuffer);
                arrayBuffer = normalized.buffer;
                imageType = normalized.type;
            } catch (e) {
                if (e.name === 'AbortError') throw e;
                errorMsg = `Todos os provedores falharam: ${e.message}`;
                console.warn(`[ImageGen] Pollinations também falhou para imagem ${block.index}:`, e.message);
            }
        }

        if (!arrayBuffer && !errorMsg) {
            errorMsg = 'Nenhum provedor de imagem disponível';
        }

        results.push({ index: block.index, url, arrayBuffer, imageType, error: errorMsg });

        done++;
        onImageProgress?.({ done, total: blocks.length, index: block.index, arrayBuffer, imageType, error: errorMsg });
    }

    return results;
}
