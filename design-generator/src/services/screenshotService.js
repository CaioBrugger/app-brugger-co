const SCREENSHOT_API_KEY = import.meta.env.VITE_SCREENSHOT_API_KEY;
const SCREENSHOT_API_BASE = 'https://api.screenshotone.com/take';

/**
 * Captures real screenshots of a URL.
 *
 * Strategy (in order):
 *  1. ScreenshotOne API (if VITE_SCREENSHOT_API_KEY is set) — 3 viewports
 *  2. Google PageSpeed Insights (free, no key, real Chromium) — 1 viewport + thumbnail
 */
export async function captureScreenshots(url) {
    if (SCREENSHOT_API_KEY) {
        const result = await captureWithScreenshotOne(url);
        if (result.screenshots.length > 0) return result;
    }

    // Free fallback — Microlink API (50 free/day, reliable, real Chromium)
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
                dataUrl: optimizedDataUrl
            });
        } catch (err) {
            console.warn(`[ScreenshotOne] ${vp.label} failed:`, err.message);
        }
    }

    return { screenshots, error: screenshots.length === 0 ? 'ScreenshotOne: all captures failed' : null };
}

// ─── Microlink API (free, no API key, reliable) ────────────────────
async function captureWithMicrolink(url) {
    const screenshots = [];

    // We capture just Desktop Full Page to save up on quota (1 request)
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
                label: 'Desktop Full Page (Fallback)',
                width: data.data.screenshot.width || 1280,
                height: data.data.screenshot.height || 'full',
                dataUrl: optimizedDataUrl
            });
        }
    } catch (err) {
        console.warn('[Microlink] Screenshot capture failed:', err.message);
    }

    return {
        screenshots,
        error: screenshots.length === 0 ? 'Microlink: capture failed. Limite de requisições excedido?' : null
    };
}

// ─── Helpers ─────────────────────────────────────────────────────────

/**
 * Resizes a base64 image if it exceeds the maxDimension.
 * This prevents 400 Bad Request errors from Claude/OpenRouter when processing huge full-page screenshots.
 * Anthropic has a strict 8000px limit on image dimensions.
 */
async function resizeImagePayload(dataUrl, maxDimension = 7500) {
    return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => {
            let { width, height } = img;

            if (width <= maxDimension && height <= maxDimension) {
                resolve(dataUrl); // No resize needed
                return;
            }

            // Calculate new dimensions keeping aspect ratio
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

            // Fill with white background in case of transparency
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, width, height);
            ctx.drawImage(img, 0, 0, width, height);

            // Convert to JPEG for better compression of large images
            resolve(canvas.toDataURL('image/jpeg', 0.85));
        };
        img.onerror = () => resolve(dataUrl); // Fallback to original if load fails
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
