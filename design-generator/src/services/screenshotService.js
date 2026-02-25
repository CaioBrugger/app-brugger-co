const PROXY = 'https://api.allorigins.win/get?url=';

// Load html2canvas from CDN (avoids npm resolution issues with Google Drive paths)
let html2canvasLoaded = null;
function loadHtml2Canvas() {
    if (html2canvasLoaded) return html2canvasLoaded;
    html2canvasLoaded = new Promise((resolve, reject) => {
        if (window.html2canvas) { resolve(window.html2canvas); return; }
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js';
        script.onload = () => resolve(window.html2canvas);
        script.onerror = () => reject(new Error('Failed to load html2canvas from CDN'));
        document.head.appendChild(script);
    });
    return html2canvasLoaded;
}

/**
 * Captures desktop + mobile screenshots of a URL by rendering its HTML in a hidden iframe.
 * Returns base64 PNG images ready for multi-modal AI analysis.
 */
export async function captureScreenshots(url) {
    const screenshots = [];

    try {
        const html2canvas = await loadHtml2Canvas();

        // Fetch full HTML via proxy
        const res = await fetch(`${PROXY}${encodeURIComponent(url)}`);
        if (!res.ok) throw new Error(`Proxy fetch failed: ${res.status}`);

        const data = await res.json();
        const html = data.contents;
        if (!html) throw new Error('Empty HTML response');

        // Resolve relative URLs in the HTML
        const resolvedHtml = resolveRelativeUrls(html, url);

        // Capture desktop (1440×900)
        const desktopShot = await renderAndCapture(html2canvas, resolvedHtml, 1440, 900, 'Desktop');
        if (desktopShot) screenshots.push(desktopShot);

        // Capture mobile (375×812)
        const mobileShot = await renderAndCapture(html2canvas, resolvedHtml, 375, 812, 'Mobile');
        if (mobileShot) screenshots.push(mobileShot);

    } catch (err) {
        console.warn('[ScreenshotService] Screenshot capture failed:', err.message);
    }

    return { screenshots };
}

/**
 * Resolves relative URLs (images, fonts, CSS) to absolute URLs based on the site's origin.
 */
function resolveRelativeUrls(html, baseUrl) {
    try {
        const origin = new URL(baseUrl).origin;
        return html
            .replace(/(href|src|action)="(?!https?:\/\/|data:|#|mailto:)([^"]*?)"/gi, (m, attr, path) => {
                const abs = path.startsWith('/') ? `${origin}${path}` : `${origin}/${path}`;
                return `${attr}="${abs}"`;
            })
            .replace(/url\((?!['"]?(?:data:|https?:))(["']?)([^)'"]+)\1\)/gi, (m, q, path) => {
                const abs = path.startsWith('/') ? `${origin}${path}` : `${origin}/${path}`;
                return `url(${q}${abs}${q})`;
            });
    } catch {
        return html;
    }
}

/**
 * Renders HTML in a hidden iframe and captures it with html2canvas.
 */
async function renderAndCapture(html2canvas, html, width, height, label) {
    return new Promise((resolve) => {
        const iframe = document.createElement('iframe');
        iframe.style.cssText = `
            position: fixed; top: -9999px; left: -9999px;
            width: ${width}px; height: ${height}px;
            border: none; opacity: 0; pointer-events: none;
        `;
        document.body.appendChild(iframe);

        const timeout = setTimeout(() => {
            cleanup();
            resolve(null);
        }, 15000);

        const cleanup = () => {
            clearTimeout(timeout);
            try { document.body.removeChild(iframe); } catch { }
        };

        iframe.onload = async () => {
            try {
                // Wait for images/fonts to load
                await new Promise(r => setTimeout(r, 2000));

                const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
                if (!iframeDoc?.body) { cleanup(); resolve(null); return; }

                const canvas = await html2canvas(iframeDoc.body, {
                    width,
                    height,
                    useCORS: true,
                    allowTaint: true,
                    logging: false,
                    scale: 1,
                    backgroundColor: null,
                });

                const dataUrl = canvas.toDataURL('image/png', 0.85);
                const base64 = dataUrl.split(',')[1];

                cleanup();
                resolve({
                    mimeType: 'image/png',
                    data: base64,
                    label,
                    width,
                    height,
                    dataUrl
                });
            } catch (err) {
                console.warn(`[ScreenshotService] html2canvas failed for ${label}:`, err.message);
                cleanup();
                resolve(null);
            }
        };

        iframe.onerror = () => {
            cleanup();
            resolve(null);
        };

        // Write HTML to iframe
        try {
            const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
            if (iframeDoc) {
                iframeDoc.open();
                iframeDoc.write(html);
                iframeDoc.close();
            }
        } catch (err) {
            console.warn('[ScreenshotService] iframe write failed:', err.message);
            cleanup();
            resolve(null);
        }
    });
}
