const PROXY = 'https://api.allorigins.win/get?url=';

/**
 * Fetch HTML + CSS from a URL via CORS proxy.
 * Returns a structured text representation of all styles found.
 */
export async function fetchSiteStyles(url) {
    try {
        const proxyUrl = `${PROXY}${encodeURIComponent(url)}`;
        const res = await fetch(proxyUrl);
        if (!res.ok) throw new Error(`Fetch failed: ${res.status}`);

        const data = await res.json();
        const html = data.contents;
        if (!html) throw new Error('Empty response');

        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');

        // Extract all inline <style> blocks
        const inlineStyles = Array.from(doc.querySelectorAll('style'))
            .map(s => s.textContent)
            .join('\n');

        // Extract linked CSS URLs and try to fetch them
        const linkHrefs = Array.from(doc.querySelectorAll('link[rel="stylesheet"]'))
            .map(l => l.getAttribute('href'))
            .filter(Boolean)
            .map(href => {
                if (href.startsWith('http')) return href;
                try {
                    return new URL(href, url).href;
                } catch {
                    return null;
                }
            })
            .filter(Boolean);

        const externalCSS = [];
        for (const cssUrl of linkHrefs.slice(0, 5)) {
            try {
                const cssRes = await fetch(`${PROXY}${encodeURIComponent(cssUrl)}`);
                if (cssRes.ok) {
                    const cssData = await cssRes.json();
                    if (cssData.contents) externalCSS.push(cssData.contents);
                }
            } catch { /* skip broken URLs */ }
        }

        // Extract Google Fonts import
        const fontLinks = Array.from(doc.querySelectorAll('link[href*="fonts.googleapis.com"]'))
            .map(l => l.getAttribute('href'))
            .filter(Boolean);
        const fontImports = (inlineStyles + externalCSS.join('\n'))
            .match(/@import\s+url\([^)]+fonts\.googleapis[^)]+\)/g) || [];

        // Extract meta info
        const title = doc.querySelector('title')?.textContent || '';
        const metaDesc = doc.querySelector('meta[name="description"]')?.getAttribute('content') || '';

        // Extract key HTML structure (headings, buttons, etc.)
        const headings = Array.from(doc.querySelectorAll('h1, h2, h3'))
            .slice(0, 10)
            .map(h => `<${h.tagName}>: "${h.textContent.trim().slice(0, 80)}"`);

        const allCSS = [inlineStyles, ...externalCSS].join('\n\n');

        // Truncate CSS if massive (keep first 30k chars — enough for token extraction)
        const trimmedCSS = allCSS.length > 30000 ? allCSS.slice(0, 30000) + '\n/* ... truncated ... */' : allCSS;

        return {
            success: true,
            title,
            metaDesc,
            headings,
            fontLinks,
            fontImports,
            css: trimmedCSS,
            htmlSnippet: html.slice(0, 5000)
        };
    } catch (err) {
        console.warn('Failed to fetch site styles:', err);
        return { success: false, error: err.message };
    }
}
