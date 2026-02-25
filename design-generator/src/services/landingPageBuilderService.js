import { generateLandingPageCopy } from './claude';
import { callGemini, generateImage } from '../api';
import { buildModularLandingPagePrompt, buildContextualImagePrompt } from '../prompt';
import { researchTopic } from './perplexity';
import { supabase } from '../lib/supabase';
import JSZip from 'jszip';

import copySystemRules from '../../../.agent/rules/copy-system.md?raw';
import structureRules from '../../../.agent/rules/structure.md?raw';
import frontendSpecialistRules from '../../../.agent/agents/frontend-specialist.md?raw';

const IMAGE_SECTIONS = ['hero', 'amostra', 'showcase', 'conteudo', 'conteúdo', 'desafio', 'bonus'];

const PREMIUM_ANIMATIONS_CSS = `
<style>
/* === PREMIUM SCROLL ANIMATIONS === */
.lp-animate { opacity: 0; transform: translateY(40px); transition: opacity 0.8s cubic-bezier(0.16, 1, 0.3, 1), transform 0.8s cubic-bezier(0.16, 1, 0.3, 1); }
.lp-animate.lp-visible { opacity: 1; transform: translateY(0); }
.lp-animate-delay-1 { transition-delay: 0.1s; }
.lp-animate-delay-2 { transition-delay: 0.2s; }
.lp-animate-delay-3 { transition-delay: 0.3s; }

/* === GOLD SHIMMER ON CTAs === */
@keyframes lp-shimmer {
  0% { background-position: -200% center; }
  100% { background-position: 200% center; }
}
.lp-cta-shimmer {
  background: linear-gradient(110deg, #C9A962 0%, #E8D5A3 25%, #C9A962 50%, #E8D5A3 75%, #C9A962 100%);
  background-size: 200% auto;
  animation: lp-shimmer 3s linear infinite;
}

/* === COUNTER ANIMATION === */
@keyframes lp-counter-pop { 0% { transform: scale(0.5); opacity: 0; } 100% { transform: scale(1); opacity: 1; } }
.lp-counter { animation: lp-counter-pop 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) both; }

/* === SMOOTH HOVER TRANSITIONS === */
a, button, [role="button"] { transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important; }
a:hover, button:hover, [role="button"]:hover { transform: translateY(-2px); }

/* === PARALLAX HERO === */
.lp-parallax { background-attachment: fixed; background-size: cover; background-position: center; }

/* === FADE-IN LEFT/RIGHT === */
.lp-fade-left { opacity: 0; transform: translateX(-30px); transition: all 0.7s ease; }
.lp-fade-right { opacity: 0; transform: translateX(30px); transition: all 0.7s ease; }
.lp-fade-left.lp-visible, .lp-fade-right.lp-visible { opacity: 1; transform: translateX(0); }

/* === CARD GLOW HOVER === */
.lp-card-glow:hover { box-shadow: 0 0 30px rgba(201, 169, 98, 0.15), 0 20px 60px rgba(0,0,0,0.3); }

/* === PULSE DOT === */
@keyframes lp-pulse { 0%, 100% { transform: scale(1); opacity: 1; } 50% { transform: scale(1.5); opacity: 0.5; } }
.lp-pulse { animation: lp-pulse 2s ease-in-out infinite; }
</style>

<script>
// IntersectionObserver for scroll animations
(function(){
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('lp-visible'); } });
  }, { threshold: 0.15, rootMargin: '0px 0px -50px 0px' });
  document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.lp-animate, .lp-fade-left, .lp-fade-right').forEach(el => observer.observe(el));
  });
  // Also run immediately for elements already in viewport
  setTimeout(() => {
    document.querySelectorAll('.lp-animate, .lp-fade-left, .lp-fade-right').forEach(el => observer.observe(el));
  }, 100);
})();
</script>
`;

/**
 * Orchestrates the full creation of a Landing Page (20 sections)
 */
export const generateFullLandingPage = async (productDescription, themeTokens, onProgress, selectedModel) => {
    try {
        // Step 1: Perplexity Research
        onProgress({ step: 'research', message: '💡 Pesquisando o mercado no Perplexity.ai...', percentage: 5 });
        let researchData = '';
        try {
            researchData = await researchTopic(productDescription);
        } catch (researchErr) {
            console.warn("Perplexity research failed, continuing without it:", researchErr);
        }

        // Step 2: Copy Strategy with selected LLM
        const modelName = selectedModel?.split('/')?.pop() || 'claude-sonnet-4';
        onProgress({ step: 'copy', message: `🧠 Gerando 20 seções de neuro-copy com ${modelName}...`, percentage: 15 });
        const copyJsonString = await generateLandingPageCopy(productDescription, copySystemRules, structureRules, researchData, selectedModel);

        let copySections = [];
        try {
            const startIdx = copyJsonString.indexOf('[');
            const endIdx = copyJsonString.lastIndexOf(']');
            const cleanJson = startIdx >= 0 && endIdx >= 0 ? copyJsonString.substring(startIdx, endIdx + 1) : copyJsonString;
            copySections = JSON.parse(cleanJson);
        } catch (e) {
            throw new Error("Falha ao organizar a copy. O modelo não retornou JSON válido.");
        }

        if (copySections.length < 15) {
            console.warn(`Model returned only ${copySections.length} sections (expected 20).`);
        }

        // Step 3: Generate Images with Gemini Flash Image (parallel)
        onProgress({ step: 'images', message: '📸 Gerando imagens cinematográficas com Gemini Flash...', percentage: 35 });

        const imageDictionary = {};
        const imagePromises = [];

        for (let section of copySections) {
            const sectId = section.id?.toLowerCase() || '';
            const sectName = section.name?.toLowerCase() || '';
            const needsImage = IMAGE_SECTIONS.some(kw => sectId.includes(kw) || sectName.includes(kw));

            if (needsImage) {
                const promise = (async () => {
                    try {
                        const imgPrompt = buildContextualImagePrompt(section.name, productDescription, productDescription, section.id, section.content);
                        const imgData = await generateImage(imgPrompt);

                        if (imgData?.images?.length > 0) {
                            const b64 = `data:${imgData.images[0].mimeType};base64,${imgData.images[0].data}`;
                            const placeholder = `IMAGE_PLACEHOLDER_${section.id}`;
                            imageDictionary[placeholder] = b64;
                            section.suggestedImages = [placeholder];
                            console.log(`[LP Builder] ✅ Image generated for ${section.id}`);
                        }
                    } catch (imgError) {
                        console.warn(`[LP Builder] Image failed for ${section.id}:`, imgError.message);
                        const safePrompt = encodeURIComponent(`Cinematic photorealistic luxury dark biblical: ${productDescription} - ${section.name}`);
                        section.suggestedImages = [
                            `https://image.pollinations.ai/prompt/${safePrompt}?width=800&height=600&nologo=true&seed=${Date.now()}`
                        ];
                    }
                })();
                imagePromises.push(promise);
            }
        }

        await Promise.allSettled(imagePromises);
        onProgress({ step: 'images_done', message: `📸 ${Object.keys(imageDictionary).length} imagens geradas!`, percentage: 55 });

        // Step 4: UI Generation with Gemini Pro
        onProgress({ step: 'design', message: '✨ Construindo UI Dark Luxury com Gemini Pro (20 seções)...', percentage: 65 });

        const condensedFrontendRules = frontendSpecialistRules.substring(0, 4000);
        const designPrompt = buildModularLandingPagePrompt(copySections, themeTokens, condensedFrontendRules);
        const designResponse = await callGemini(designPrompt);

        if (!designResponse || !Array.isArray(designResponse)) {
            throw new Error("O Gemini não retornou o array de seções HTML.");
        }

        // Step 5: Inject real images into HTML
        onProgress({ step: 'inject', message: '🖼️ Injetando imagens de alta resolução...', percentage: 80 });

        designResponse.forEach(sectionResult => {
            if (sectionResult.html) {
                let finalHtml = sectionResult.html;
                Object.keys(imageDictionary).forEach(placeholder => {
                    finalHtml = finalHtml.split(placeholder).join(imageDictionary[placeholder]);
                });
                sectionResult.html = finalHtml;
            }
        });

        // Step 6: Inject premium animations CSS + JS into first section
        if (designResponse.length > 0) {
            designResponse[0].html = PREMIUM_ANIMATIONS_CSS + designResponse[0].html;
        }

        // Step 7: HTML Review Pass
        onProgress({ step: 'review', message: '🔍 Revisando enquadramento e responsividade...', percentage: 90 });
        try {
            const reviewedSections = await reviewAndFixHtml(designResponse, themeTokens);
            if (reviewedSections && Array.isArray(reviewedSections) && reviewedSections.length > 0) {
                // Merge fixes
                reviewedSections.forEach(fixed => {
                    const original = designResponse.find(s => s.id === fixed.id);
                    if (original && fixed.html) original.html = fixed.html;
                });
            }
        } catch (reviewErr) {
            console.warn('[LP Builder] Review pass failed, using original:', reviewErr.message);
        }

        onProgress({ step: 'done', message: '🚀 Landing Page finalizada! 20 seções + imagens + animações.', percentage: 100 });
        return designResponse;

    } catch (error) {
        console.error("Error in generateFullLandingPage:", error);
        throw error;
    }
};

/**
 * HTML Review Pass — asks Gemini to fix common layout issues
 */
async function reviewAndFixHtml(sections, themeTokens) {
    const sectionsSummary = sections.map(s => ({
        id: s.id,
        name: s.name,
        htmlLength: s.html?.length || 0,
        htmlPreview: s.html?.substring(0, 200) || ''
    }));

    const reviewPrompt = `Você é um QA Frontend Sênior. Revise estas seções de Landing Page e corrija problemas COMUNS:

PROBLEMAS A VERIFICAR E CORRIGIR:
1. Tags HTML não fechadas (<div>, <section>, <span>)
2. Containers que vazam (overflow, width > 100vw)
3. Textos cortados em mobile (font-size muito grande sem responsividade)
4. Imagens sem max-width: 100% / object-fit
5. Botões CTA sem padding adequado ou sem hover
6. Seções sem padding vertical (min: 4rem top/bottom)
7. Fontes não importadas (verificar @import do Google Fonts)
8. Contraste de texto insuficiente (texto claro sobre fundo claro)

RETORNE APENAS as seções que precisam de correção, como um array JSON:
[{ "id": "s02-hero", "html": "<section>...HTML CORRIGIDO...</section>" }]

Se NENHUMA seção precisar de correção, retorne: []

SEÇÕES PARA REVISAR:
${JSON.stringify(sectionsSummary, null, 1)}

HTMLS COMPLETOS:
${sections.map(s => `--- ${s.id} ---\n${s.html}`).join('\n\n')}`;

    return await callGemini(reviewPrompt);
}

/**
 * Regenerates a single section with 3 VARIATIONS
 */
export const regenerateLandingPageSection = async (sectionId, originalHtml, themeTokens, userInstructions) => {
    try {
        const condensedRules = frontendSpecialistRules.substring(0, 3000);

        const prompt = `Você é um Arquiteto Frontend Sênior. Crie 3 VARIAÇÕES VISUAIS COMPLETAMENTE DISTINTAS para esta seção.

Id da Seção: ${sectionId}
HTML ATUAL DA SEÇÃO:
<HTML_ORIGINAL>
${originalHtml}
</HTML_ORIGINAL>

TOKENS DO DESIGN SYSTEM:
${JSON.stringify(themeTokens, null, 2)}

FRONTEND SPECIALIST RULES:
${condensedRules}

${userInstructions?.trim() ? `INSTRUÇÃO DO USUÁRIO: "${userInstructions}"\n` : ''}REGRAS OBRIGATÓRIAS PARA AS 3 VARIAÇÕES:
1. Cada variação DEVE ter layout COMPLETAMENTE DIFERENTE — topologia, hierarquia visual e composição distintas
2. Variação 1 ("Elegante"): composição simétrica, tipografia serif dominante, espaçamento generoso
3. Variação 2 ("Bold"): assimetria extrema (90/10), elementos hero oversized, alto contraste
4. Variação 3 ("Minimal"): espaço negativo generoso, grid fragmentado, foco em um único elemento âncora
5. TODAS devem: usar os tokens do design system, ser responsivas, ter animações suaves CSS
6. Incluir classes de animação: lp-animate, lp-fade-left, lp-fade-right, lp-card-glow, lp-cta-shimmer
7. NUNCA use roxo/violeta/indigo (Purple Ban absoluto)
8. Hover effects em TODOS os botões e cards com transform + transition
9. PROIBIDO: Bento Grid como default, glassmorphism, mesh gradient, layout split 50/50
10. Cada variação deve ser MEMORÁVEL — se parece template genérico, refaça
11. CRÍTICO: CADA VARIAÇÃO DEVE INCLUIR SEU PRÓPRIO CSS PURO DENTRO DE UMA TAG <style>. NÃO USE TAILWIND OU CLASSES UTILITY! O HTML DEVE SER RENDERIZADO PERFEITAMENTE DE FORMA INDEPENDENTE.

Retorne APENAS JSON (sem \`\`\`json):
{
  "variations": [
    {
      "title": "Nome descritivo",
      "description": "O que torna esta variação única",
      "html": "<section id='${sectionId}'>...HTML completo...</section>"
    },
    { "title": "...", "description": "...", "html": "..." },
    { "title": "...", "description": "...", "html": "..." }
  ]
}`;

        const designResponse = await callGemini(prompt);

        if (designResponse?.variations && Array.isArray(designResponse.variations)) {
            return { variations: designResponse.variations };
        }

        if (designResponse?.html) {
            return { variations: [{ title: 'Variação Única', description: 'Design atualizado', html: designResponse.html }] };
        }

        throw new Error("Formato de resposta inválido do Gemini.");
    } catch (error) {
        console.error("Error in regenerateLandingPageSection:", error);
        throw error;
    }
};

/**
 * Saves to Supabase
 */
export const saveLandingPage = async (productDescription, themeId, sections) => {
    try {
        const titleMatch = productDescription.substring(0, 50);
        const htmlContent = sections.map(s => `<!-- SECTION: ${s.name || s.id} -->\n${s.html}`).join('\n\n');

        const { data, error } = await supabase
            .from('landing_pages')
            .insert([{
                name: `LP: ${titleMatch}...`,
                project_description: productDescription,
                theme_id: themeId,
                html_content: htmlContent,
                sections_json: sections
            }])
            .select();

        if (error) throw error;
        return data;
    } catch (error) {
        console.error("Error in saveLandingPage:", error);
        throw error;
    }
};

/**
 * Exports the full LP as a ZIP file containing index.html, styles.css, scripts.js
 */
export const exportLandingPageAsZip = async (sections, productName) => {
    const allHtml = sections.map(s => s.html).join('\n');

    // Extract all <style> blocks
    const styleRegex = /<style[^>]*>([\s\S]*?)<\/style>/gi;
    let allCss = '';
    let match;
    while ((match = styleRegex.exec(allHtml)) !== null) {
        allCss += match[1] + '\n';
    }

    // Extract all <script> blocks
    const scriptRegex = /<script[^>]*>([\s\S]*?)<\/script>/gi;
    let allJs = '';
    while ((match = scriptRegex.exec(allHtml)) !== null) {
        allJs += match[1] + '\n';
    }

    // Clean HTML: remove inline styles and scripts
    let cleanHtml = allHtml
        .replace(styleRegex, '')
        .replace(scriptRegex, '');

    const fullHtml = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${productName || 'Landing Page'}</title>
    <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=DM+Serif+Display&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="styles.css">
</head>
<body style="margin:0; padding:0; background:#0C0C0E;">
${cleanHtml}
<script src="scripts.js"><\/script>
</body>
</html>`;

    const zip = new JSZip();
    zip.file('index.html', fullHtml);
    zip.file('styles.css', allCss);
    zip.file('scripts.js', allJs);

    const blob = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${(productName || 'landing-page').replace(/\s+/g, '-').toLowerCase()}.zip`;
    a.click();
    URL.revokeObjectURL(url);
};

/**
 * Simple HTML download (single file)
 */
export const exportLandingPageAsHtml = (sections, productName) => {
    const fullHtml = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${productName || 'Landing Page'}</title>
    <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=DM+Serif+Display&display=swap" rel="stylesheet">
</head>
<body style="margin:0; padding:0; background:#0C0C0E;">
${sections.map(s => s.html).join('\n')}
</body>
</html>`;

    const blob = new Blob([fullHtml], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${(productName || 'landing-page').replace(/\s+/g, '-').toLowerCase()}.html`;
    a.click();
    URL.revokeObjectURL(url);
};
