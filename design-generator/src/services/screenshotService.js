/**
 * screenshotService.js
 *
 * Captura screenshots de URLs para análise visual.
 * Estratégia em cascata:
 *  1. design-cloner-server (Playwright nativo) — quando disponível via _serverData
 *  2. ScreenshotOne API (se VITE_SCREENSHOT_API_KEY configurada)
 *  3. Microlink API (gratuito, 50 req/dia, fallback final)
 */

const SCREENSHOT_API_KEY = import.meta.env.VITE_SCREENSHOT_API_KEY;
const SCREENSHOT_API_BASE = 'https://api.screenshotone.com/take';

/**
 * Captura screenshots de um site.
 * Se o servidor local já capturou (via _serverData.screenshot), reutiliza.
 *
 * @param {string} url
 * @param {{ serverScreenshot?: object }} options
 */
export async function captureScreenshots(url, options = {}) {
    // ── Prioridade 1: Screenshot do design-cloner-server ──────────────────────
    if (options.serverScreenshot?.data) {
        const ss = options.serverScreenshot;
        const dataUrl = `data:${ss.mimeType};base64,${ss.data}`;
        return {
            screenshots: [{
                mimeType: ss.mimeType,
                data: ss.data,
                label: 'Desktop (Playwright)',
                width: ss.width || 1280,
                height: ss.height || 800,
                dataUrl,
            }],
            source: 'playwright-server',
        };
    }

    // ── Prioridade 2: ScreenshotOne API ───────────────────────────────────────
    if (SCREENSHOT_API_KEY) {
        const result = await captureWithScreenshotOne(url);
        if (result.screenshots.length > 0) return result;
    }

    // ── Prioridade 3: Microlink (fallback gratuito) ────────────────────────────
    return captureWithMicrolink(url);
}

// ─── ScreenshotOne (requires API key) ───────────────────────────────
async function captureWithScreenshotOne(url) {
    const viewports = [
        { label: 'Desktop', width: 1280, height: 800, fullPage: false },
        { label: 'Full Page', width: 1280, height: 800, fullPage: true },
        { label: 'Mobile', width: 375, height: 812, fullPage: false },
    ];

    const screenshots = [];
    for (const vp of viewports) {
        try {
            const params = new URLSearchParams({
                access_key: SCREENSHOT_API_KEY,
                url,
                viewport_width: vp.width,
                viewport_height: vp.height,
                full_page: vp.fullPage,
                format: 'png',
                image_quality: 80,
                delay: 3,
                block_ads: true,
                block_cookie_banners: true,
                block_trackers: true,
                timeout: 30,
            });

            const response = await fetch(`${SCREENSHOT_API_BASE}?${params.toString()}`);
            if (!response.ok) throw new Error(`API error ${response.status}`);

            const blob = await response.blob();
            const rawDataUrl = await blobToDataUrl(blob);
            const optimizedDataUrl = await resizeImagePayload(rawDataUrl);

            screenshots.push({
                mimeType: optimizedDataUrl.startsWith('data:image/jpeg') ? 'image/jpeg' : 'image/png',
                data: optimizedDataUrl.split(',')[1],
                label: vp.label,
                width: vp.width,
                height: vp.fullPage ? 'full' : vp.height,
                dataUrl: optimizedDataUrl,
            });
        } catch (err) {
            console.warn(`[ScreenshotOne] ${vp.label} failed:`, err.message);
        }
    }

    return {
        screenshots,
        source: 'screenshotone',
        error: screenshots.length === 0 ? 'ScreenshotOne: all captures failed' : null,
    };
}

// ─── Microlink API (free, no API key, reliable) ────────────────────
async function captureWithMicrolink(url) {
    const screenshots = [];

    try {
        const apiUrl = `https://api.microlink.io?url=${encodeURIComponent(url)}&screenshot=true&fullPage=true&meta=false&waitForTimeout=2000`;
        const res = await fetch(apiUrl);
        if (!res.ok) throw new Error(`Microlink fetch failed: ${res.status}`);

        const data = await res.json();
        if (data.status === 'success' && data.data?.screenshot?.url) {
            const imgRes = await fetch(data.data.screenshot.url);
            if (!imgRes.ok) throw new Error('Failed to download Microlink image');

            const blob = await imgRes.blob();
            const rawDataUrl = await blobToDataUrl(blob);
            const optimizedDataUrl = await resizeImagePayload(rawDataUrl);

            screenshots.push({
                mimeType: optimizedDataUrl.startsWith('data:image/jpeg') ? 'image/jpeg' : 'image/png',
                data: optimizedDataUrl.split(',')[1],
                label: 'Desktop Full Page (Microlink)',
                width: data.data.screenshot.width || 1280,
                height: data.data.screenshot.height || 'full',
                dataUrl: optimizedDataUrl,
            });
        }
    } catch (err) {
        console.warn('[Microlink] Screenshot capture failed:', err.message);
    }

    return {
        screenshots,
        source: 'microlink',
        error: screenshots.length === 0 ? 'Microlink: capture failed. Limite de requisições excedido?' : null,
    };
}

// ─── Helpers ─────────────────────────────────────────────────────────

/**
 * Redimensiona imagem base64 se exceder maxDimension.
 * Anthropic tem limite de 8000px nas dimensões.
 */
async function resizeImagePayload(dataUrl, maxDimension = 7500) {
    return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => {
            let { width, height } = img;

            if (width <= maxDimension && height <= maxDimension) {
                resolve(dataUrl);
                return;
            }

            if (width > height) {
                height = Math.round((height * maxDimension) / width);
                width = maxDimension;
            } else {
                width = Math.round((width * maxDimension) / height);
                height = maxDimension;
            }

            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, width, height);
            ctx.drawImage(img, 0, 0, width, height);
            resolve(canvas.toDataURL('image/jpeg', 0.85));
        };
        img.onerror = () => resolve(dataUrl);
        img.src = dataUrl;
    });
}

function blobToDataUrl(blob) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
}
