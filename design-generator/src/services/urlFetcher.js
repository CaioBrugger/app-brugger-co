/**
 * urlFetcher.js
 *
 * Estratégia de extração em duas camadas:
 *  1. design-cloner-server (localhost:3001) — Playwright real, computed styles, k-means OKLCH
 *  2. CORS proxies (fallback) — CSS estático via proxy público
 */

const DESIGN_CLONER_SERVER = 'http://localhost:3333';
const SERVER_TIMEOUT_MS = 60000; // 60s para Playwright renderizar

// ─── Camada 1: design-cloner-server (Playwright) ──────────────────────────────

/**
 * Verifica se o servidor local está rodando.
 * @returns {Promise<boolean>}
 */
export async function checkDesignClonerServer() {
    try {
        const res = await fetch(`${DESIGN_CLONER_SERVER}/health`, {
            signal: AbortSignal.timeout(2000)
        });
        if (!res.ok) return false;
        const data = await res.json();
        return data.ok === true;
    } catch {
        return false;
    }
}

/**
 * Extrai design system completo via design-cloner-server (Playwright).
 * Retorna dados muito mais ricos que o CORS proxy.
 *
 * @param {string} url - URL do site a extrair
 * @returns {Promise<ServerExtractionResult>}
 */
export async function fetchFromDesignClonerServer(url) {
    const res = await fetch(
        `${DESIGN_CLONER_SERVER}/extract?url=${encodeURIComponent(url)}`,
        { signal: AbortSignal.timeout(SERVER_TIMEOUT_MS) }
    );

    if (!res.ok) {
        const err = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
        throw new Error(err.error || `Server error ${res.status}`);
    }

    return res.json();
}

// ─── Camada 2: CORS Proxies (Fallback) ────────────────────────────────────────

const CORS_PROXIES = [
    (url) => `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`,
    (url) => `https://corsproxy.io/?url=${encodeURIComponent(url)}`,
    (url) => `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(url)}`,
];

async function fetchViaProxy(url) {
    for (const buildProxy of CORS_PROXIES) {
        try {
            const proxyUrl = buildProxy(url);
            const res = await fetch(proxyUrl, { signal: AbortSignal.timeout(15000) });
            if (!res.ok) continue;

            const contentType = res.headers.get('content-type') || '';
            if (contentType.includes('application/json')) {
                const data = await res.json();
                const html = data.contents || data;
                if (html && typeof html === 'string' && html.length > 100) return html;
            } else {
                const html = await res.text();
                if (html && html.length > 100) return html;
            }
        } catch { /* tentar próximo proxy */ }
    }
    return null;
}

async function fetchSiteStylesViaProxy(url) {
    try {
        const html = await fetchViaProxy(url);
        if (!html) throw new Error('All CORS proxies failed');

        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');

        const inlineStyles = Array.from(doc.querySelectorAll('style'))
            .map(s => s.textContent)
            .join('\n');

        const linkHrefs = Array.from(doc.querySelectorAll('link[rel="stylesheet"]'))
            .map(l => l.getAttribute('href'))
            .filter(Boolean)
            .map(href => {
                if (href.startsWith('http')) return href;
                try { return new URL(href, url).href; } catch { return null; }
            })
            .filter(Boolean);

        const externalCSS = [];
        for (const cssUrl of linkHrefs.slice(0, 5)) {
            try {
                const cssText = await fetchViaProxy(cssUrl);
                if (cssText) externalCSS.push(cssText);
            } catch {}
        }

        const fontLinks = Array.from(doc.querySelectorAll('link[href*="fonts.googleapis.com"]'))
            .map(l => l.getAttribute('href'))
            .filter(Boolean);

        const allCSSText = inlineStyles + '\n' + externalCSS.join('\n');
        const fontImports = allCSSText.match(/@import\s+url\([^)]+fonts\.googleapis[^)]+\)/g) || [];
        const cssVarMatches = allCSSText.match(/--[\w-]+\s*:\s*[^;]+/g) || [];
        const cssVars = [...new Set(cssVarMatches)].slice(0, 100);

        const title = doc.querySelector('title')?.textContent || '';
        const metaDesc = doc.querySelector('meta[name="description"]')?.getAttribute('content') || '';
        const themeColor = doc.querySelector('meta[name="theme-color"]')?.getAttribute('content') || '';
        const ogImage = doc.querySelector('meta[property="og:image"]')?.getAttribute('content') || '';

        const headings = Array.from(doc.querySelectorAll('h1, h2, h3'))
            .slice(0, 10)
            .map(h => `<${h.tagName}>: "${h.textContent.trim().slice(0, 80)}"`);

        const computedLines = [];
        const selectors = ['h1', 'h2', 'h3', 'p', 'a', 'button', 'input', 'nav', 'header'];
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

        const allCSS = [inlineStyles, ...externalCSS].join('\n\n');
        const trimmedCSS = allCSS.length > 40000
            ? allCSS.slice(0, 40000) + '\n/* ... truncated ... */'
            : allCSS;

        return {
            success: true,
            source: 'cors-proxy',
            title, metaDesc, themeColor, ogImage, headings,
            fontLinks, fontImports, cssVars,
            computedStyles: computedLines.join('\n') || null,
            css: trimmedCSS,
            htmlSnippet: html.slice(0, 8000),
        };
    } catch (err) {
        console.warn('[urlFetcher] CORS proxy failed:', err.message);
        return { success: false, source: 'cors-proxy', error: err.message };
    }
}

// ─── API Pública ──────────────────────────────────────────────────────────────

/**
 * Extrai CSS e metadados de um site.
 * Tenta o servidor Playwright local primeiro, cai no CORS proxy se indisponível.
 *
 * @param {string} url
 * @param {{ useServer?: boolean }} options
 * @returns {Promise<SiteStylesResult>}
 */
export async function fetchSiteStyles(url, options = {}) {
    const { useServer = true } = options;

    if (useServer) {
        const serverAvailable = await checkDesignClonerServer();
        if (serverAvailable) {
            try {
                console.log('[urlFetcher] Usando design-cloner-server (Playwright)');
                const serverData = await fetchFromDesignClonerServer(url);
                // Converter formato do servidor para o formato esperado pelo frontend
                return adaptServerResponse(serverData);
            } catch (err) {
                console.warn('[urlFetcher] Server falhou, usando CORS proxy fallback:', err.message);
            }
        } else {
            console.log('[urlFetcher] Servidor local não detectado. Inicie design-cloner-server/start-server.bat para extração premium.');
        }
    }

    return fetchSiteStylesViaProxy(url);
}

/**
 * Adapta a resposta do design-cloner-server para o formato usado pelo frontend.
 * Preserva todos os dados extras do servidor para uso pelo prompt de extração.
 */
function adaptServerResponse(serverData) {
    const { meta = {}, cssVars = {}, colorPalette = {}, typography = {}, spacingScale = {}, components = {}, screenshot } = serverData;

    // Formatar CSS vars como lista de strings (formato esperado pelo prompt)
    const cssVarsList = Object.entries(cssVars).map(([k, v]) => `${k}: ${v}`);

    // Formatar palette como bloco de texto legível para o Claude/Gemini
    const paletteBlock = formatPaletteForPrompt(colorPalette);

    // Formatar componentes para prompt
    const componentsBlock = formatComponentsForPrompt(components);

    // Construir CSS simulado a partir dos dados extraídos (para retrocompatibilidade do prompt)
    const syntheticCSS = buildSyntheticCSS(cssVars, colorPalette, typography);

    return {
        success: true,
        source: 'playwright-server',
        // Campos do formato original (retrocompatível)
        title: meta.title || '',
        metaDesc: meta.description || '',
        themeColor: meta.themeColor || '',
        ogImage: meta.ogImage || '',
        headings: meta.headings || [],
        fontLinks: typography.googleFonts || [],
        fontImports: [],
        cssVars: cssVarsList,
        css: syntheticCSS,
        htmlSnippet: '',
        // Dados extras do servidor (usados pelo prompt melhorado)
        _serverData: {
            colorPalette,
            paletteBlock,
            typography,
            spacingScale,
            componentsBlock,
            components,
            screenshot, // { data, mimeType, width, height }
            cssVarsCount: cssVarsList.length,
            rawColorsCount: colorPalette.palette?.length || 0,
        },
    };
}

function formatPaletteForPrompt(colorPalette) {
    if (!colorPalette?.palette?.length) return 'Não disponível';

    const semantic = colorPalette.semantic || {};
    const lines = [
        '## Paleta Clusterizada (K-means OKLCH)',
        '',
        '### Roles Semânticos Detectados:',
        ...Object.entries(semantic)
            .filter(([, v]) => v)
            .map(([k, v]) => `  ${k}: ${v}`),
        '',
        '### Clusters de Cor (por frequência):',
        ...colorPalette.palette.slice(0, 12).map((c, i) =>
            `  ${i + 1}. ${c.hex} — freq: ${c.count} — contextos: [${c.contexts.join(', ')}]`
        ),
    ];
    return lines.join('\n');
}

function formatComponentsForPrompt(components) {
    if (!components || Object.keys(components).length === 0) return 'Não disponível';

    const lines = ['## Estilos de Componentes (Computed Styles Reais)'];
    for (const [name, style] of Object.entries(components)) {
        if (!style) continue;
        lines.push(`\n### ${name}:`);
        for (const [prop, val] of Object.entries(style)) {
            if (val && val !== 'none' && val !== 'normal' && val !== 'auto') {
                lines.push(`  ${prop}: ${val}`);
            }
        }
    }
    return lines.join('\n');
}

function buildSyntheticCSS(cssVars, colorPalette, typography) {
    const parts = [];

    // CSS vars reais
    if (Object.keys(cssVars).length > 0) {
        parts.push(':root {');
        for (const [k, v] of Object.entries(cssVars)) {
            parts.push(`  ${k}: ${v};`);
        }
        parts.push('}');
    }

    // Google Fonts
    if (typography?.googleFonts?.length > 0) {
        parts.push('');
        parts.push('/* Google Fonts detectadas: */');
        typography.googleFonts.forEach(url => parts.push(`/* ${url} */`));
    }

    // Paleta semântica como comentário
    if (colorPalette?.semantic) {
        parts.push('');
        parts.push('/* Paleta semântica (k-means OKLCH): */');
        for (const [role, hex] of Object.entries(colorPalette.semantic)) {
            if (hex) parts.push(`/* ${role}: ${hex} */`);
        }
    }

    return parts.join('\n');
}
