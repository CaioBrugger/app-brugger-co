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
        const allCSSText = inlineStyles + '\n' + externalCSS.join('\n');
        const fontImports = allCSSText
            .match(/@import\s+url\([^)]+fonts\.googleapis[^)]+\)/g) || [];

        // Extract CSS custom properties (:root variables)
        const cssVarMatches = allCSSText.match(/--[\w-]+\s*:\s*[^;]+/g) || [];
        const cssVars = [...new Set(cssVarMatches)].slice(0, 100);

        // Extract meta info
        const title = doc.querySelector('title')?.textContent || '';
        const metaDesc = doc.querySelector('meta[name="description"]')?.getAttribute('content') || '';
        const themeColor = doc.querySelector('meta[name="theme-color"]')?.getAttribute('content') || '';
        const ogImage = doc.querySelector('meta[property="og:image"]')?.getAttribute('content') || '';

        // Extract key HTML structure (headings, buttons, etc.)
        const headings = Array.from(doc.querySelectorAll('h1, h2, h3'))
            .slice(0, 10)
            .map(h => `<${h.tagName}>: "${h.textContent.trim().slice(0, 80)}"`);

        // Extract computed-style-like data from inline styles on key elements
        const computedLines = [];
        const selectors = ['h1', 'h2', 'h3', 'p', 'a', 'button', 'input', 'nav', 'header', 'footer', 'section'];
        for (const sel of selectors) {
            const el = doc.querySelector(sel);
            if (el) {
                const style = el.getAttribute('style');
                const classes = el.getAttribute('class');
                if (style || classes) {
                    computedLines.push(`<${sel}> class="${classes || ''}" style="${style || ''}"`);
                }
            }
        }
        const computedStyles = computedLines.length > 0
            ? computedLines.join('\n')
            : null;

        const allCSS = [inlineStyles, ...externalCSS].join('\n\n');

        // Truncate CSS if massive (keep first 40k chars — more context for atomic extraction)
        const trimmedCSS = allCSS.length > 40000 ? allCSS.slice(0, 40000) + '\n/* ... truncated ... */' : allCSS;

        return {
            success: true,
            title,
            metaDesc,
            themeColor,
            ogImage,
            headings,
            fontLinks,
            fontImports,
            cssVars,
            computedStyles,
            css: trimmedCSS,
            htmlSnippet: html.slice(0, 8000)
        };
    } catch (err) {
        console.warn('Failed to fetch site styles:', err);
        return { success: false, error: err.message };
    }
}
