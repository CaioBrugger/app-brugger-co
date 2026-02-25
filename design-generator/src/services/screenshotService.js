const SCREENSHOT_API_KEY = import.meta.env.VITE_SCREENSHOT_API_KEY;
const SCREENSHOT_API_BASE = 'https://api.screenshotone.com/take';

/**
 * Captures real screenshots of a URL using ScreenshotOne API (Chromium-based).
 * Returns base64 PNG images for multi-modal AI analysis.
 *
 * Captures 3 viewports:
 *  - Desktop (1280×800)
 *  - Mobile (375×812)
 *  - Full-page scroll (1280×full height)
 */
export async function captureScreenshots(url) {
    if (!SCREENSHOT_API_KEY) {
        console.warn('[ScreenshotService] No API key. Add VITE_SCREENSHOT_API_KEY to .env');
        return { screenshots: [], error: 'API key not configured' };
    }

    const viewports = [
        { label: 'Desktop', width: 1280, height: 800, fullPage: false },
        { label: 'Full Page', width: 1280, height: 800, fullPage: true },
        { label: 'Mobile', width: 375, height: 812, fullPage: false },
    ];

    const screenshots = [];

    for (const vp of viewports) {
        try {
            const shot = await captureViewport(url, vp);
            if (shot) screenshots.push(shot);
        } catch (err) {
            console.warn(`[ScreenshotService] ${vp.label} capture failed:`, err.message);
        }
    }

    return {
        screenshots,
        error: screenshots.length === 0 ? 'All screenshot captures failed' : null
    };
}

/**
 * Captures a single viewport screenshot via ScreenshotOne API.
 */
async function captureViewport(url, { label, width, height, fullPage }) {
    const params = new URLSearchParams({
        access_key: SCREENSHOT_API_KEY,
        url,
        viewport_width: width,
        viewport_height: height,
        full_page: fullPage,
        format: 'png',
        image_quality: 80,
        delay: 3,                // Wait 3s for JS rendering
        block_ads: true,
        block_cookie_banners: true,
        block_trackers: true,
        dark_mode: false,
        reduced_motion: true,
        timeout: 30,
    });

    const apiUrl = `${SCREENSHOT_API_BASE}?${params.toString()}`;
    const response = await fetch(apiUrl);

    if (!response.ok) {
        const errorText = await response.text().catch(() => '');
        throw new Error(`ScreenshotOne API error ${response.status}: ${errorText}`);
    }

    // Response is raw PNG bytes
    const blob = await response.blob();
    const dataUrl = await blobToDataUrl(blob);
    const base64 = dataUrl.split(',')[1];

    return {
        mimeType: 'image/png',
        data: base64,
        label,
        width,
        height: fullPage ? 'full' : height,
        dataUrl
    };
}

/**
 * Converts a Blob to a data URL string.
 */
function blobToDataUrl(blob) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
}
