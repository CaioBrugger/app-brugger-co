const API_BASE = 'https://generativelanguage.googleapis.com/v1beta/models';
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const DEFAULT_MODEL = 'gemini-2.5-pro';
const IMAGE_MODEL = 'gemini-2.5-flash-image';

const MAX_RETRIES = 3;

/**
 * Retry wrapper for Gemini API calls.
 * Catches rate-limit / quota errors and waits before retrying.
 */
async function withRetry(fn, label = 'Gemini') {
    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
        try {
            return await fn();
        } catch (err) {
            const msg = err.message || '';
            const isRateLimit = msg.includes('quota') || msg.includes('429') || msg.includes('rate') || msg.includes('RESOURCE_EXHAUSTED');

            if (!isRateLimit || attempt === MAX_RETRIES) throw err;

            // Extract wait time from error message (e.g. "retry in 13.33s")
            const waitMatch = msg.match(/retry in ([\d.]+)/i);
            const waitSec = waitMatch ? Math.ceil(parseFloat(waitMatch[1])) + 2 : 15;

            console.warn(`[${label}] ⏳ Quota excedida. Tentativa ${attempt}/${MAX_RETRIES}. Aguardando ${waitSec}s...`);
            await new Promise(r => setTimeout(r, waitSec * 1000));
        }
    }
}

export async function callGemini(prompt, model = DEFAULT_MODEL) {
    return withRetry(async () => {
        const url = `${API_BASE}/${model}:generateContent?key=${API_KEY}`;

        const safetySettings = [
            { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
            { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
            { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
            { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" }
        ];

        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                safetySettings,
                generationConfig: {
                    temperature: 0.9,
                    maxOutputTokens: 65536,
                    responseMimeType: 'application/json'
                }
            })
        });

        if (!response.ok) {
            const err = await response.json().catch(() => ({}));
            console.error('Gemini API Error:', err);
            throw new Error(err.error?.message || `Erro na API: ${response.status}`);
        }

        const data = await response.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!text) {
            console.error('Gemini Empty Response Data:', data);
            const reason = data.candidates?.[0]?.finishReason || 'Desconhecido';
            if (reason === 'SAFETY') throw new Error('Bloqueado por filtro de segurança do Google');
            throw new Error(`Resposta vazia do Gemini (Motivo: ${reason})`);
        }

        return parseResponse(text);
    }, 'callGemini');
}

/**
 * Calls Gemini with text + images (multi-modal).
 * @param {string} prompt - Text prompt
 * @param {{ mimeType: string, data: string }[]} images - Array of base64 images
 * @param {string} model - Model to use
 */
export async function callGeminiWithImages(prompt, images = [], model = DEFAULT_MODEL) {
    return withRetry(async () => {
        const url = `${API_BASE}/${model}:generateContent?key=${API_KEY}`;

        const parts = [{ text: prompt }];
        for (const img of images) {
            parts.push({ inlineData: { mimeType: img.mimeType, data: img.data } });
        }

        const safetySettings = [
            { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
            { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
            { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
            { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" }
        ];

        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts }],
                safetySettings,
                generationConfig: {
                    temperature: 0.7,
                    maxOutputTokens: 65536,
                    responseMimeType: 'application/json'
                }
            })
        });

        if (!response.ok) {
            const err = await response.json().catch(() => ({}));
            console.error('Gemini API Error with Images:', err);
            throw new Error(err.error?.message || `Erro na API: ${response.status}`);
        }

        const data = await response.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!text) {
            console.error('Gemini Empty Response Data with Images:', data);
            const reason = data.candidates?.[0]?.finishReason || 'Desconhecido';
            if (reason === 'SAFETY') throw new Error('Bloqueado por filtro de segurança do Google');
            throw new Error(`Resposta vazia do Gemini (Motivo: ${reason})`);
        }

        return parseResponse(text);
    }, 'callGeminiWithImages');
}

export async function generateImage(prompt) {
    return withRetry(async () => {
        const url = `${API_BASE}/${IMAGE_MODEL}:generateContent?key=${API_KEY}`;

        const body = {
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
                responseModalities: ['Text', 'Image']
            }
        };

        console.log('[NanoBanana] Calling API...', { model: IMAGE_MODEL });

        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });

        if (!response.ok) {
            const err = await response.json().catch(() => ({}));
            console.error('[NanoBanana] API Error:', err);
            throw new Error(err.error?.message || `Erro na API de imagem: ${response.status}`);
        }

        const data = await response.json();
        console.log('[NanoBanana] Response received:', {
            candidatesCount: data.candidates?.length,
            partsCount: data.candidates?.[0]?.content?.parts?.length
        });

        const parts = data.candidates?.[0]?.content?.parts || [];

        const images = [];
        let description = '';

        for (const part of parts) {
            if (part.text) {
                description += part.text;
            } else if (part.inlineData) {
                console.log('[NanoBanana] Image found:', part.inlineData.mimeType);
                images.push({
                    mimeType: part.inlineData.mimeType,
                    data: part.inlineData.data
                });
            }
        }

        if (images.length === 0) {
            console.error('[NanoBanana] No images in response. Parts:', parts);
            throw new Error('Nenhuma imagem gerada — tente um prompt diferente');
        }

        return { images, description };
    }, 'generateImage');
}

function parseResponse(text) {
    try {
        return JSON.parse(text);
    } catch {
        const match = text.match(/```(?:json)?\s*([\s\S]*?)```/);
        if (match) return JSON.parse(match[1].trim());

        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) return JSON.parse(jsonMatch[0]);

        throw new Error('Falha ao interpretar resposta da API');
    }
}
