/**
 * productionWorkflowService.js
 *
 * Orquestrador principal do pipeline de produção de entregáveis.
 * Recebe um item do plano + o resultado completo do estruturadorService
 * e executa 7 steps para gerar DOCX + PDF.
 *
 * Steps:
 *   1. Gerar prompt (promptGeneratorService)
 *   2. Gerar conteúdo Markdown (contentGeneratorService)
 *   3. Extrair blocos [IMAGEM] (contentGeneratorService)
 *   4. Gerar imagens FLUX (imageGeneratorService) [skip para ebook_simples]
 *   5. Montar imageMap
 *   6. Construir DOCX final (docxExportService)
 *   7. Gerar PDF + retornar blobs
 *
 * @param {Object} item - Item do planoProducao { nome, fase, ferramenta, ... }
 * @param {Object} result - Resultado completo do estruturadorService
 * @param {Function} onProgress - Callback({ step, label, pct, detail })
 * @param {AbortSignal} [signal]
 * @returns {Promise<{ docxBlob, pdfBlob, filename, markdown, imageBlocks }>}
 */

import { generatePrompt } from './promptGeneratorService.js';
import { generateContent, extractImageBlocks, replaceImageBlocksWithPlaceholders } from './contentGeneratorService.js';
import { generateImages } from './imageGeneratorService.js';
import { buildDocx } from './docxExportService.js';

const STEPS = [
    { n: 1, label: 'Gerando prompt otimizado',        pct: 10 },
    { n: 2, label: 'Claude gerando conteúdo',          pct: 35 },
    { n: 3, label: 'Extraindo blocos de imagem',       pct: 45 },
    { n: 4, label: 'Gerando imagens com FLUX',         pct: 75 },
    { n: 5, label: 'Montando imagens',                 pct: 88 },
    { n: 6, label: 'Construindo documento DOCX',       pct: 100 },
];

/**
 * Sanitiza o nome do arquivo para download.
 */
function sanitizeFilename(name) {
    return (name || 'ebook')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-zA-Z0-9_\- ]/g, '')
        .replace(/\s+/g, '_')
        .toLowerCase()
        .slice(0, 80);
}

export async function runProductionWorkflow(item, result, onProgress, signal) {
    const report = (step, detail) => {
        const s = STEPS[step - 1];
        onProgress?.({ step: s.n, label: s.label, pct: s.pct, detail: detail || '' });
    };

    // ── Step 1: Gerar prompt ───────────────────────────────────────────────────
    const itemLabel = item._type === 'module'
        ? `Módulo ${item.numero} — ${item.nome}`
        : item.nome;
    report(1, `Preparando prompt para "${itemLabel}"...`);
    if (signal?.aborted) throw new DOMException('Aborted', 'AbortError');

    const { systemPrompt, userPrompt, ctx } = generatePrompt(item, result);
    const isEbookImagens = ctx.tipo === 'ebook_imagens';

    // ── Step 2: Gerar conteúdo com Claude ────────────────────────────────────
    report(2, 'Enviando para Claude Sonnet 4.6...');
    if (signal?.aborted) throw new DOMException('Aborted', 'AbortError');

    const rawMarkdown = await generateContent(systemPrompt, userPrompt, signal);

    // ── Step 3: Extrair blocos [IMAGEM] ──────────────────────────────────────
    report(3, 'Analisando estrutura do conteúdo...');
    if (signal?.aborted) throw new DOMException('Aborted', 'AbortError');

    const imageBlocks = isEbookImagens ? extractImageBlocks(rawMarkdown) : [];
    console.log(`[ProductionWorkflow] Tipo: ${ctx.tipo}, isEbookImagens: ${isEbookImagens}, blocos de imagem encontrados: ${imageBlocks.length}`);
    if (imageBlocks.length > 0) {
        console.log('[ProductionWorkflow] imageBlocks:', imageBlocks.map(b => ({ index: b.index, aspect: b.aspect, prompt: b.prompt.slice(0, 60) })));
    }

    // Substituir blocos por placeholders no markdown final
    const processedMarkdown = imageBlocks.length > 0
        ? replaceImageBlocksWithPlaceholders(rawMarkdown, imageBlocks)
        : rawMarkdown;

    // ── Step 4: Gerar imagens (apenas ebook_imagens) ─────────────────────────
    let imageResults = [];
    if (isEbookImagens && imageBlocks.length > 0) {
        report(4, `Gerando ${imageBlocks.length} imagens com FLUX 1.1 Pro...`);
        if (signal?.aborted) throw new DOMException('Aborted', 'AbortError');

        imageResults = await generateImages(
            imageBlocks,
            signal,
            ({ done, total, index, arrayBuffer, imageType, error }) => {
                const stepPct = STEPS[3].pct;
                const prevPct = STEPS[2].pct;
                const progressPct = prevPct + Math.round(((done / total) * (stepPct - prevPct)));
                onProgress?.({
                    step: 4,
                    label: `Gerando imagem ${done}/${total}...`,
                    pct: progressPct,
                    detail: `Imagem ${done} de ${total} concluída`,
                    // dados da imagem recém-gerada para preview em tempo real
                    imageReady: { index, arrayBuffer, imageType, error },
                    totalImages: total,
                });
            }
        );
    } else {
        report(4, 'Pulando geração de imagens (ebook_simples)...');
    }

    // ── Step 5: Montar imageMap ───────────────────────────────────────────────
    report(5, 'Processando imagens...');
    if (signal?.aborted) throw new DOMException('Aborted', 'AbortError');

    // imageMap: Map<index, { arrayBuffer, url, prompt, imageType, aspect }>
    const imageMap = new Map();
    for (const ir of imageResults) {
        const block = imageBlocks.find(b => b.index === ir.index);
        imageMap.set(ir.index, {
            arrayBuffer: ir.arrayBuffer,
            url: ir.url,
            prompt: block?.prompt || '',
            imageType: ir.imageType || 'jpg',
            aspect: block?.aspect || '16:9',
        });
        console.log(`[ProductionWorkflow] imageMap[${ir.index}]: url=${ir.url ? '✓' : '✗'}, arrayBuffer=${ir.arrayBuffer ? `${ir.arrayBuffer.byteLength} bytes` : 'null'}, erro=${ir.error || 'nenhum'}`);
    }

    // ── Step 6: Construir DOCX ────────────────────────────────────────────────
    report(6, 'Montando documento Word...');
    if (signal?.aborted) throw new DOMException('Aborted', 'AbortError');

    // Para módulos: subtitle = nome do produto. Para bônus: subtitle = descrição do produto.
    const subtitle = item._type === 'module'
        ? ctx.productNome || result.produto?.nome || ''
        : result.produto?.subtitulo || '';
    const docxBlob = await buildDocx(processedMarkdown, imageMap, ctx.nome, subtitle);

    const filename = sanitizeFilename(ctx.nome);

    return {
        docxBlob,
        filename,
        markdown: processedMarkdown,
        imageBlocks,
        imageResults,
        ctx,
    };
}
