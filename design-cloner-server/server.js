/**
 * design-cloner-server/server.js
 *
 * Servidor local de extração de Design Systems via Playwright.
 * Roda em http://localhost:3001
 *
 * Endpoints:
 *   GET /health
 *   GET /extract?url=https://example.com
 */

const express = require('express');
const cors = require('cors');
const { chromium } = require('playwright');

const app = express();
const PORT = 3333;

app.use(cors({ origin: '*' }));
app.use(express.json());

// ─── Health Check ─────────────────────────────────────────────────────────────
app.get('/health', (req, res) => {
    res.json({ ok: true, version: '2.0.0', engine: 'playwright' });
});

// ─── Main Extraction Endpoint ─────────────────────────────────────────────────
app.get('/extract', async (req, res) => {
    const { url } = req.query;

    if (!url) {
        return res.status(400).json({ success: false, error: 'URL is required' });
    }

    console.log(`\n[extract] ► ${url}`);
    const startTime = Date.now();
    let browser;

    try {
        browser = await chromium.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
        });

        const context = await browser.newContext({
            viewport: { width: 1280, height: 800 },
            userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            ignoreHTTPSErrors: true,
        });

        const page = await context.newPage();

        // Dismiss cookie banners after navigation
        page.on('dialog', dialog => dialog.dismiss().catch(() => {}));

        console.log(`[extract] Navegando...`);
        try {
            await page.goto(url, { waitUntil: 'networkidle', timeout: 45000 });
        } catch {
            // networkidle pode dar timeout em SPAs — tentar com domcontentloaded
            await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
        }

        // Aguardar conteúdo dinâmico
        await page.waitForTimeout(2500);

        // Fechar overlays comuns (cookies, newsletter)
        await dismissOverlays(page);

        // Scroll para ativar lazy loading
        console.log(`[extract] Scrollando página...`);
        await autoScroll(page);

        // Voltar ao topo para screenshot limpo
        await page.evaluate(() => window.scrollTo(0, 0));
        await page.waitForTimeout(500);

        // Extrações em paralelo
        console.log(`[extract] Extraindo tokens...`);
        const [cssVars, rawColors, typography, spacings, components, meta] = await Promise.all([
            extractCSSVariables(page).catch(err => ({ vars: {}, error: err.message })),
            extractColors(page).catch(err => ({ colors: [], error: err.message })),
            extractTypography(page).catch(err => ({ fonts: [], sizes: [], weights: [], googleFonts: [] })),
            extractSpacings(page).catch(() => ({ spacings: [] })),
            extractComponents(page).catch(() => ({})),
            extractMeta(page).catch(() => ({})),
        ]);

        // Screenshot nativo via Playwright
        console.log(`[extract] Capturando screenshot...`);
        const screenshot = await captureScreenshot(page).catch(() => null);

        await browser.close();
        browser = null;

        // Processar cores com k-means OKLCH
        console.log(`[extract] Clusterizando cores (k-means OKLCH)...`);
        const colorPalette = clusterColors(rawColors.colors || []);

        // Normalizar espaçamentos
        const spacingScale = normalizeSpacing(spacings.spacings || []);

        const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
        console.log(`[extract] ✓ Concluído em ${elapsed}s | Cores: ${rawColors.colors?.length || 0} → ${colorPalette.palette?.length || 0} clusters | CSS vars: ${Object.keys(cssVars.vars || {}).length}`);

        res.json({
            success: true,
            url,
            extractedAt: new Date().toISOString(),
            elapsed: `${elapsed}s`,
            meta,
            cssVars: cssVars.vars || {},
            colorPalette,
            typography,
            spacingScale,
            components,
            screenshot, // { data: base64, mimeType, width, height }
        });

    } catch (err) {
        console.error(`[extract] ✗ Erro:`, err.message);
        res.status(500).json({ success: false, error: err.message, url });
    } finally {
        if (browser) {
            try { await browser.close(); } catch {}
        }
    }
});

// ─── Dismiss Common Overlays ──────────────────────────────────────────────────
async function dismissOverlays(page) {
    const selectors = [
        // Cookie banners
        'button[id*="accept"], button[id*="cookie"], button[class*="accept"], button[class*="cookie"]',
        '[aria-label*="accept"], [aria-label*="cookie"]',
        '.cookie-notice button, .cookie-banner button, .cookie-consent button',
        // Newsletter/modal close buttons
        'button[class*="close"], button[aria-label="Close"], [data-dismiss="modal"]',
    ];

    for (const sel of selectors) {
        try {
            const btn = await page.$(sel);
            if (btn) {
                await btn.click({ timeout: 1000 });
                await page.waitForTimeout(300);
            }
        } catch {}
    }
}

// ─── Auto Scroll ──────────────────────────────────────────────────────────────
async function autoScroll(page) {
    await page.evaluate(async () => {
        await new Promise((resolve) => {
            let totalHeight = 0;
            const distance = 400;
            const maxScroll = 15000;
            const timer = setInterval(() => {
                const scrollHeight = document.body.scrollHeight;
                window.scrollBy(0, distance);
                totalHeight += distance;
                if (totalHeight >= Math.min(scrollHeight, maxScroll)) {
                    clearInterval(timer);
                    resolve();
                }
            }, 80);
        });
    });
}

// ─── Meta Extraction ──────────────────────────────────────────────────────────
async function extractMeta(page) {
    return page.evaluate(() => ({
        title: document.title || '',
        description: document.querySelector('meta[name="description"]')?.content || '',
        themeColor: document.querySelector('meta[name="theme-color"]')?.content || '',
        favicon: document.querySelector('link[rel="icon"], link[rel="shortcut icon"]')?.href || '',
        ogImage: document.querySelector('meta[property="og:image"]')?.content || '',
        headings: Array.from(document.querySelectorAll('h1, h2, h3'))
            .slice(0, 8)
            .map(h => `<${h.tagName.toLowerCase()}>: "${h.textContent.trim().slice(0, 80)}"`),
    }));
}

// ─── CSS Variables Extraction ─────────────────────────────────────────────────
async function extractCSSVariables(page) {
    return page.evaluate(() => {
        const vars = {};
        const sheets = Array.from(document.styleSheets);

        for (const sheet of sheets) {
            try {
                const rules = Array.from(sheet.cssRules || []);
                for (const rule of rules) {
                    if (!rule.style) continue;
                    const sel = rule.selectorText || '';
                    // Incluir :root, html, body e seletores de tema
                    const isRoot = sel === ':root' || sel === 'html' || sel === 'body' ||
                        sel.includes('[data-theme') || sel.includes('.dark') || sel.includes('.light');
                    if (!isRoot) continue;

                    for (const prop of Array.from(rule.style)) {
                        if (prop.startsWith('--')) {
                            vars[prop] = rule.style.getPropertyValue(prop).trim();
                        }
                    }
                }
            } catch {
                // Cross-origin stylesheet — ignorar
            }
        }

        // Resolver variáveis usando computed styles do :root
        const rootStyle = getComputedStyle(document.documentElement);
        for (const key of Object.keys(vars)) {
            const computed = rootStyle.getPropertyValue(key).trim();
            if (computed) vars[key] = computed;
        }

        return { vars };
    });
}

// ─── Color Extraction ─────────────────────────────────────────────────────────
async function extractColors(page) {
    const colors = await page.evaluate(() => {
        const colorMap = new Map();

        function normalizeColor(value) {
            if (!value || value === 'transparent' || value === 'rgba(0, 0, 0, 0)' ||
                value === 'inherit' || value === 'initial' || value === 'currentcolor') return null;
            try {
                const div = document.createElement('div');
                div.style.display = 'none';
                div.style.color = value;
                document.body.appendChild(div);
                const computed = getComputedStyle(div).color;
                document.body.removeChild(div);

                const m = computed.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
                if (!m) return null;
                const a = m[4] !== undefined ? parseFloat(m[4]) : 1;
                if (a < 0.15) return null; // Skip near-transparent

                const r = parseInt(m[1]), g = parseInt(m[2]), b = parseInt(m[3]);
                // Skip pure black/white noise
                if ((r === 0 && g === 0 && b === 0) || (r === 255 && g === 255 && b === 255)) return null;

                const hex = '#' + [r, g, b].map(x => x.toString(16).padStart(2, '0')).join('');
                return { hex, rgb: { r, g, b } };
            } catch {
                return null;
            }
        }

        function addColor(value, context, weight = 1) {
            const c = normalizeColor(value);
            if (!c) return;
            if (colorMap.has(c.hex)) {
                const entry = colorMap.get(c.hex);
                entry.count += weight;
                entry.contexts.add(context);
            } else {
                colorMap.set(c.hex, { hex: c.hex, rgb: c.rgb, count: weight, contexts: new Set([context]) });
            }
        }

        // Extrair de todos os elementos visíveis (limitado a 600 para performance)
        const elements = Array.from(document.querySelectorAll('*')).filter(el => {
            const rect = el.getBoundingClientRect();
            return rect.width > 0 && rect.height > 0;
        }).slice(0, 600);

        for (const el of elements) {
            const style = getComputedStyle(el);
            const tag = el.tagName.toLowerCase();
            const classList = el.className || '';

            const isButton = tag === 'button' || el.getAttribute('role') === 'button' ||
                (typeof classList === 'string' && (classList.includes('btn') || classList.includes('button')));
            const isNav = tag === 'nav' || tag === 'header';
            const isHeading = /^h[1-6]$/.test(tag);
            const isBody = tag === 'p' || tag === 'span' || tag === 'li';

            // Background
            const bg = style.backgroundColor;
            if (bg && bg !== 'rgba(0, 0, 0, 0)') {
                addColor(bg, isButton ? 'button-bg' : isNav ? 'nav-bg' : 'background', isButton ? 3 : 1);
            }

            // Text color
            addColor(style.color,
                isHeading ? 'heading' : isButton ? 'button-text' : tag === 'a' ? 'link' : isBody ? 'body-text' : 'text',
                isHeading ? 2 : isButton ? 3 : 1
            );

            // Border
            if (style.borderStyle !== 'none' && style.borderStyle !== '') {
                addColor(style.borderColor, 'border', 0.5);
            }

            // Outline / Ring
            addColor(style.outlineColor, 'outline', 0.5);
        }

        // Adicionar theme-color da meta tag
        const themeColor = document.querySelector('meta[name="theme-color"]')?.content;
        if (themeColor) addColor(themeColor, 'theme-color', 5);

        return Array.from(colorMap.values())
            .map(c => ({ ...c, contexts: Array.from(c.contexts) }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 300);
    });

    return { colors };
}

// ─── Typography Extraction ────────────────────────────────────────────────────
async function extractTypography(page) {
    return page.evaluate(() => {
        const fontMap = new Map();
        const sizes = new Set();
        const weights = new Set();

        function processEl(el, role) {
            if (!el) return;
            const s = getComputedStyle(el);
            const family = s.fontFamily;
            const size = parseFloat(s.fontSize);
            const weight = parseInt(s.fontWeight) || 400;

            if (family) {
                const primary = family.split(',')[0].trim().replace(/['"]/g, '');
                if (primary && primary !== 'serif' && primary !== 'sans-serif' && primary !== 'monospace') {
                    if (!fontMap.has(primary)) fontMap.set(primary, { family: primary, roles: new Set(), sizes: [] });
                    fontMap.get(primary).roles.add(role);
                    fontMap.get(primary).sizes.push(size);
                }
            }
            if (size > 0) sizes.add(Math.round(size));
            if (weight > 0) weights.add(weight);
        }

        // Headings
        for (const tag of ['h1', 'h2', 'h3', 'h4', 'h5', 'h6']) {
            processEl(document.querySelector(tag), `heading-${tag}`);
        }
        // Body
        processEl(document.querySelector('p') || document.querySelector('li') || document.body, 'body');
        // Button
        processEl(document.querySelector('button'), 'button');
        // Nav
        processEl(document.querySelector('nav a, header a'), 'nav');
        // Code
        processEl(document.querySelector('code, pre'), 'mono');

        const googleFonts = Array.from(document.querySelectorAll('link[href*="fonts.googleapis.com"]'))
            .map(l => l.href);

        // Detectar fontHeading e fontBody
        const fontList = Array.from(fontMap.values()).map(f => ({
            family: f.family,
            roles: Array.from(f.roles),
            avgSize: f.sizes.length ? f.sizes.reduce((a, b) => a + b, 0) / f.sizes.length : 0,
        }));

        const headingFont = fontList.find(f => f.roles.some(r => r.startsWith('heading')));
        const bodyFont = fontList.find(f => f.roles.includes('body') && f !== headingFont);
        const monoFont = fontList.find(f => f.roles.includes('mono'));

        return {
            fonts: fontList,
            fontHeading: headingFont?.family || null,
            fontBody: bodyFont?.family || null,
            fontMono: monoFont?.family || null,
            sizes: Array.from(sizes).sort((a, b) => a - b),
            weights: Array.from(weights).sort((a, b) => a - b),
            googleFonts,
        };
    });
}

// ─── Spacing Extraction ───────────────────────────────────────────────────────
async function extractSpacings(page) {
    const spacings = await page.evaluate(() => {
        const values = [];
        const props = ['paddingTop', 'paddingBottom', 'paddingLeft', 'paddingRight',
            'marginTop', 'marginBottom', 'gap', 'rowGap', 'columnGap'];

        const elements = Array.from(document.querySelectorAll('section, article, div, nav, header, footer, main'))
            .slice(0, 200);

        for (const el of elements) {
            const s = getComputedStyle(el);
            for (const prop of props) {
                const val = parseFloat(s[prop]);
                if (val > 0 && val < 600 && Number.isFinite(val)) {
                    values.push(Math.round(val));
                }
            }
        }
        return values;
    });

    return { spacings };
}

// ─── Component Extraction ─────────────────────────────────────────────────────
async function extractComponents(page) {
    return page.evaluate(() => {
        function getStyle(selector) {
            const el = document.querySelector(selector);
            if (!el) return null;
            const s = getComputedStyle(el);
            return {
                background: s.backgroundColor,
                color: s.color,
                border: s.border,
                borderColor: s.borderColor,
                borderRadius: s.borderRadius,
                padding: `${s.paddingTop} ${s.paddingRight} ${s.paddingBottom} ${s.paddingLeft}`,
                fontSize: s.fontSize,
                fontWeight: s.fontWeight,
                boxShadow: s.boxShadow,
                transition: s.transition,
                lineHeight: s.lineHeight,
            };
        }

        // Seletores robustos para componentes comuns
        const buttonStyle = getStyle('button:not([disabled])') ||
            getStyle('[class*="btn"]:not([class*="close"])') ||
            getStyle('[class*="button"]:not([class*="group"])');

        const inputStyle = getStyle('input[type="text"]') ||
            getStyle('input[type="email"]') ||
            getStyle('input:not([type="hidden"]):not([type="submit"]):not([type="checkbox"]):not([type="radio"])');

        const cardStyle = getStyle('[class*="card"]') ||
            getStyle('article') ||
            getStyle('[class*="Card"]');

        const navStyle = getStyle('nav') || getStyle('header');

        const linkStyle = getStyle('a:not([class*="btn"]):not([class*="button"])');

        // Nav height
        const navEl = document.querySelector('nav, header');
        const navHeight = navEl ? navEl.getBoundingClientRect().height : null;

        return { button: buttonStyle, input: inputStyle, card: cardStyle, nav: navStyle, link: linkStyle, navHeight };
    });
}

// ─── Screenshot Capture ───────────────────────────────────────────────────────
async function captureScreenshot(page) {
    // Viewport screenshot (1280x800) — leve e eficiente
    const buffer = await page.screenshot({
        type: 'jpeg',
        quality: 85,
        clip: { x: 0, y: 0, width: 1280, height: 800 },
    });

    // Verificar dimensões e comprimir se necessário (limite Anthropic: 8000px)
    const base64 = buffer.toString('base64');

    return {
        data: base64,
        mimeType: 'image/jpeg',
        width: 1280,
        height: 800,
    };
}

// ═══════════════════════════════════════════════════════════════════════════════
// PROCESSADORES
// ═══════════════════════════════════════════════════════════════════════════════

// ─── K-Means Color Clustering in OKLCH ───────────────────────────────────────

/**
 * Converte hex para OKLCH (perceptualmente uniforme).
 * @param {string} hex - Hex color (#rrggbb)
 * @returns {{ l: number, c: number, h: number } | null}
 */
function hexToOKLCH(hex) {
    try {
        const r = parseInt(hex.slice(1, 3), 16) / 255;
        const g = parseInt(hex.slice(3, 5), 16) / 255;
        const b = parseInt(hex.slice(5, 7), 16) / 255;

        // sRGB → Linear RGB
        const lin = (c) => c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
        const lr = lin(r), lg = lin(g), lb = lin(b);

        // Linear RGB → OKLab (via LMS)
        const l_ = Math.cbrt(0.4122214708 * lr + 0.5363325363 * lg + 0.0514459929 * lb);
        const m_ = Math.cbrt(0.2119034982 * lr + 0.6806995451 * lg + 0.1073969566 * lb);
        const s_ = Math.cbrt(0.0883024619 * lr + 0.2817188376 * lg + 0.6299787005 * lb);

        const L = 0.2104542553 * l_ + 0.7936177850 * m_ - 0.0040720468 * s_;
        const a = 1.9779984951 * l_ - 2.4285922050 * m_ + 0.4505937099 * s_;
        const bv = 0.0259040371 * l_ + 0.7827717662 * m_ - 0.8086757660 * s_;

        // OKLab → OKLCH
        const C = Math.sqrt(a * a + bv * bv);
        const H = ((Math.atan2(bv, a) * 180) / Math.PI + 360) % 360;

        return { l: L, c: C, h: H };
    } catch {
        return null;
    }
}

/**
 * Distância perceptual entre dois pontos OKLCH.
 * Hue tem peso menor quando croma é baixo (cinzas).
 */
function oklchDistance(a, b) {
    const dL = a.l - b.l;
    const dC = a.c - b.c;
    const rawDH = Math.abs(a.h - b.h);
    const dH = Math.min(rawDH, 360 - rawDH);
    // Peso do hue proporcional ao croma (cores vivas têm hue mais importante)
    const hWeight = Math.min(a.c, b.c) * 1.5;
    return Math.sqrt(dL * dL + dC * dC + hWeight * ((dH / 180) * (dH / 180)));
}

/** Média circular para ângulos de hue */
function circularMean(angles) {
    if (angles.length === 0) return 0;
    const toRad = (a) => (a * Math.PI) / 180;
    const sinSum = angles.reduce((s, a) => s + Math.sin(toRad(a)), 0);
    const cosSum = angles.reduce((s, a) => s + Math.cos(toRad(a)), 0);
    return ((Math.atan2(sinSum / angles.length, cosSum / angles.length) * 180) / Math.PI + 360) % 360;
}

/** K-Means com inicialização k-means++ */
function kmeans(colors, k, maxIter = 60) {
    if (colors.length <= k) return colors.map(c => [c]);

    // K-means++: iniciar centróides espalhados
    const centroids = [colors[Math.floor(Math.random() * colors.length)].oklch];
    while (centroids.length < k) {
        let maxDist = -1;
        let farthest = null;
        for (const color of colors) {
            if (!color.oklch) continue;
            const minDist = Math.min(...centroids.map(c => oklchDistance(color.oklch, c)));
            if (minDist > maxDist) { maxDist = minDist; farthest = color.oklch; }
        }
        if (farthest) centroids.push(farthest);
        else break;
    }

    let clusters = Array.from({ length: k }, () => []);

    for (let iter = 0; iter < maxIter; iter++) {
        // Atribuir ao centróide mais próximo
        const newClusters = Array.from({ length: k }, () => []);
        for (const color of colors) {
            if (!color.oklch) continue;
            let minDist = Infinity, best = 0;
            for (let i = 0; i < centroids.length; i++) {
                const d = oklchDistance(color.oklch, centroids[i]);
                if (d < minDist) { minDist = d; best = i; }
            }
            newClusters[best].push(color);
        }

        // Atualizar centróides
        let converged = true;
        for (let i = 0; i < k; i++) {
            if (newClusters[i].length === 0) continue;
            const cl = newClusters[i].map(c => c.oklch);
            const newC = {
                l: cl.reduce((s, c) => s + c.l, 0) / cl.length,
                c: cl.reduce((s, c) => s + c.c, 0) / cl.length,
                h: circularMean(cl.map(c => c.h)),
            };
            if (oklchDistance(centroids[i], newC) > 0.001) converged = false;
            centroids[i] = newC;
        }

        clusters = newClusters;
        if (converged) break;
    }

    return clusters;
}

/** Principal: clusteriza cores brutas em paleta semântica */
function clusterColors(rawColors) {
    if (!rawColors || rawColors.length === 0) return { palette: [], semantic: {} };

    // Converter para OKLCH
    const colors = rawColors
        .map(c => ({ ...c, oklch: hexToOKLCH(c.hex) }))
        .filter(c => c.oklch);

    if (colors.length === 0) return { palette: [], semantic: {} };

    // Número ideal de clusters: entre 6 e 12, baseado na quantidade de cores únicas
    const k = Math.min(Math.max(6, Math.floor(Math.sqrt(colors.length))), 12);
    const clusters = kmeans(colors, k);

    // Representante de cada cluster: cor com maior frequência
    const palette = clusters
        .filter(cl => cl.length > 0)
        .map(cl => {
            const rep = cl.reduce((best, c) => c.count > best.count ? c : best, cl[0]);
            const totalCount = cl.reduce((sum, c) => sum + c.count, 0);
            const allContexts = [...new Set(cl.flatMap(c => c.contexts))];
            return { hex: rep.hex, oklch: rep.oklch, count: totalCount, contexts: allContexts, size: cl.length };
        })
        .sort((a, b) => b.count - a.count);

    const semantic = classifySemanticColors(palette);

    return { palette, semantic };
}

/** Classifica cores da paleta em roles semânticos */
function classifySemanticColors(palette) {
    const result = {};
    if (palette.length === 0) return result;

    // Ordenar por lightness
    const byLight = [...palette].sort((a, b) => (a.oklch?.l || 0) - (b.oklch?.l || 0));
    const byChroma = [...palette].sort((a, b) => (b.oklch?.c || 0) - (a.oklch?.c || 0));
    const byCount = [...palette]; // já ordenado por count

    // Background: cor mais escura ou mais clara com maior frequência
    const bgCandidates = palette.filter(c => c.contexts.includes('background') || c.contexts.includes('nav-bg'));
    result.background = bgCandidates[0]?.hex || byLight[0]?.hex;

    // Texto: maior frequência de heading/body-text
    const textCandidates = palette.filter(c => c.contexts.some(cx => ['heading', 'body-text', 'text'].includes(cx)));
    result.text = textCandidates[0]?.hex;
    result.textSecondary = textCandidates[1]?.hex;

    // Accent: maior croma (mais colorido)
    const accentCandidates = byChroma.filter(c => (c.oklch?.c || 0) > 0.04);
    result.accent = accentCandidates[0]?.hex;
    result.accentLight = accentCandidates[1]?.hex;

    // Primary: botões
    const primaryCandidates = palette.filter(c => c.contexts.includes('button-bg'));
    result.primary = primaryCandidates[0]?.hex || result.accent;

    // Surface: segunda cor de fundo
    result.surface = bgCandidates[1]?.hex || byLight[1]?.hex;

    // Border
    const borderCandidates = palette.filter(c => c.contexts.includes('border'));
    result.border = borderCandidates[0]?.hex;

    // Link
    const linkCandidates = palette.filter(c => c.contexts.includes('link'));
    result.link = linkCandidates[0]?.hex;

    return result;
}

// ─── Spacing Normalization ────────────────────────────────────────────────────
function normalizeSpacing(values) {
    const DEFAULT_SCALE = (unit) => ({
        '0': '0px', '0.5': `${unit * 0.5}px`, '1': `${unit}px`,
        '2': `${unit * 2}px`, '3': `${unit * 3}px`, '4': `${unit * 4}px`,
        '5': `${unit * 5}px`, '6': `${unit * 6}px`, '8': `${unit * 8}px`,
        '10': `${unit * 10}px`, '12': `${unit * 12}px`, '16': `${unit * 16}px`,
        '20': `${unit * 20}px`, '24': `${unit * 24}px`, '32': `${unit * 32}px`,
    });

    if (!values || values.length === 0) return { unit: 4, scale: DEFAULT_SCALE(4) };

    // Detectar grid base: 4px ou 8px
    const mod4 = values.filter(v => v > 0 && v % 4 === 0).length;
    const mod8 = values.filter(v => v > 0 && v % 8 === 0).length;
    const unit = (mod8 / (values.length || 1)) > 0.45 ? 8 : 4;

    return { unit, scale: DEFAULT_SCALE(unit) };
}

// ─── Start Server ─────────────────────────────────────────────────────────────
app.listen(PORT, () => {
    console.log(`\n╔══════════════════════════════════════╗`);
    console.log(`║  design-cloner-server v2.0.0         ║`);
    console.log(`║  http://localhost:${PORT}               ║`);
    console.log(`╚══════════════════════════════════════╝`);
    console.log(`\n  GET /health`);
    console.log(`  GET /extract?url=https://example.com\n`);
});
