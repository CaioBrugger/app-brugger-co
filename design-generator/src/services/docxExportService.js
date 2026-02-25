/**
 * docxExportService.js
 *
 * Responsável por:
 *   a) buildDocx(markdown, imageMap, productName) → Blob DOCX
 *   b) downloadDocx(blob, filename) → dispara download
 *   c) generatePdf(markdown, imageMap, productName) → Blob PDF
 */

import {
    Document,
    Packer,
    Paragraph,
    TextRun,
    HeadingLevel,
    ImageRun,
    AlignmentType,
    BorderStyle,
    convertInchesToTwip,
    PageBreak,
    Footer,
    PageNumber,
    NumberFormat,
    Header,
    SectionType,
} from 'docx';

// ─── Constantes Visuais ────────────────────────────────────────────────────────
const ACCENT_COLOR  = 'C9A962';
const TEXT_COLOR    = '1A1A1A';
const HEADING_FONT  = 'DM Serif Display';
const BODY_FONT     = 'DM Sans';

// Tamanhos em half-points (1pt = 2 half-points)
const SIZES = {
    h1: 56,   // 28pt
    h2: 40,   // 20pt
    h3: 28,   // 14pt
    body: 22, // 11pt
    quote: 22,
    caption: 18, // 9pt
};

// ─── Helpers de estilo ─────────────────────────────────────────────────────────
function makeHeading1(text) {
    return new Paragraph({
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 480, after: 240 },
        children: [
            new TextRun({
                text,
                font: HEADING_FONT,
                size: SIZES.h1,
                color: ACCENT_COLOR,
                bold: false,
            }),
        ],
    });
}

function makeHeading2(text) {
    return new Paragraph({
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 360, after: 160 },
        children: [
            new TextRun({
                text,
                font: HEADING_FONT,
                size: SIZES.h2,
                color: 'E0C070',
                bold: false,
            }),
        ],
    });
}

function makeHeading3(text) {
    return new Paragraph({
        heading: HeadingLevel.HEADING_3,
        spacing: { before: 240, after: 120 },
        children: [
            new TextRun({
                text,
                font: BODY_FONT,
                size: SIZES.h3,
                color: '3A3A3A',
                bold: true,
            }),
        ],
    });
}

function makeBodyParagraph(runs) {
    return new Paragraph({
        spacing: { before: 0, after: 160, line: 360, lineRule: 'auto' },
        children: runs,
    });
}

function makeBibleQuote(text) {
    return new Paragraph({
        spacing: { before: 160, after: 160, line: 360 },
        indent: { left: convertInchesToTwip(0.6) },
        border: {
            left: {
                color: ACCENT_COLOR,
                space: 12,
                style: BorderStyle.THICK,
                size: 12,
            },
        },
        children: [
            new TextRun({
                text,
                font: BODY_FONT,
                size: SIZES.quote,
                italics: true,
                color: '555555',
            }),
        ],
    });
}

function makeBulletItem(text) {
    return new Paragraph({
        bullet: { level: 0 },
        spacing: { before: 40, after: 40, line: 320, lineRule: 'auto' },
        children: [
            new TextRun({
                text,
                font: BODY_FONT,
                size: SIZES.body,
                color: TEXT_COLOR,
            }),
        ],
    });
}

function makeImagePlaceholder(text) {
    return new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 240, after: 240 },
        children: [
            new TextRun({
                text: `[ Imagem: ${text} ]`,
                font: BODY_FONT,
                size: SIZES.caption,
                color: 'AAAAAA',
                italics: true,
            }),
        ],
    });
}

function makeImageParagraph(arrayBuffer, width, height) {
    return new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 240, after: 240 },
        children: [
            new ImageRun({
                data: arrayBuffer,
                transformation: { width, height },
                type: 'png',
            }),
        ],
    });
}

function makeEmptyParagraph() {
    return new Paragraph({
        spacing: { before: 0, after: 80 },
        children: [new TextRun({ text: '' })],
    });
}

// ─── Parser de inline ─────────────────────────────────────────────────────────
/**
 * Converte uma linha de texto com markdown inline (**bold**, *italic*) em TextRuns.
 */
function parseInlineMarkdown(line) {
    const runs = [];
    // Regex para bold+italic, bold, italic
    const regex = /(\*\*\*(.+?)\*\*\*|\*\*(.+?)\*\*|\*(.+?)\*|(.+?))/g;
    let match;
    let lastIndex = 0;

    while ((match = regex.exec(line)) !== null) {
        if (match.index > lastIndex) {
            // Texto entre matches — não deve acontecer mas por segurança
            runs.push(new TextRun({ text: line.slice(lastIndex, match.index), font: BODY_FONT, size: SIZES.body, color: TEXT_COLOR }));
        }

        if (match[2]) {
            // Bold + Italic
            runs.push(new TextRun({ text: match[2], font: BODY_FONT, size: SIZES.body, bold: true, italics: true, color: TEXT_COLOR }));
        } else if (match[3]) {
            // Bold
            runs.push(new TextRun({ text: match[3], font: BODY_FONT, size: SIZES.body, bold: true, color: TEXT_COLOR }));
        } else if (match[4]) {
            // Italic
            runs.push(new TextRun({ text: match[4], font: BODY_FONT, size: SIZES.body, italics: true, color: TEXT_COLOR }));
        } else if (match[5]) {
            // Texto normal
            runs.push(new TextRun({ text: match[5], font: BODY_FONT, size: SIZES.body, color: TEXT_COLOR }));
        }

        lastIndex = regex.lastIndex;
        if (match[0].length === 0) regex.lastIndex++;
    }

    return runs.length > 0 ? runs : [new TextRun({ text: line, font: BODY_FONT, size: SIZES.body, color: TEXT_COLOR })];
}

// ─── Parser principal de Markdown → docx elements ────────────────────────────
/**
 * Parseia markdown linha a linha e gera elementos do docx.
 *
 * @param {string} markdown
 * @param {Map<number, { arrayBuffer: ArrayBuffer|null, prompt: string }>} imageMap
 * @returns {Paragraph[]}
 */
function parseMarkdownToDocx(markdown, imageMap) {
    const elements = [];
    const lines = markdown.split('\n');
    let i = 0;

    while (i < lines.length) {
        const line = lines[i];
        const trimmed = line.trim();

        // Linha vazia
        if (!trimmed) {
            elements.push(makeEmptyParagraph());
            i++;
            continue;
        }

        // Placeholder de imagem __IMAGE_N__
        const imgPlaceholderMatch = trimmed.match(/^__IMAGE_(\d+)__$/);
        if (imgPlaceholderMatch) {
            const imgIndex = parseInt(imgPlaceholderMatch[1], 10);
            const imgData = imageMap?.get(imgIndex);
            if (imgData?.arrayBuffer) {
                // Dimensões padrão para ebook (largura máxima A4 menos margens ≈ 600px)
                const width = 600;
                const height = Math.round(600 * (9 / 16)); // aspecto 16:9 padrão
                elements.push(makeImageParagraph(imgData.arrayBuffer, width, height));
            } else {
                elements.push(makeImagePlaceholder(imgData?.prompt || `Imagem ${imgIndex + 1}`));
            }
            i++;
            continue;
        }

        // Bloco [IMAGEM]...[/IMAGEM] restante (não substituído)
        if (trimmed.startsWith('[IMAGEM]')) {
            // Pular o bloco até [/IMAGEM]
            while (i < lines.length && !lines[i].includes('[/IMAGEM]')) {
                i++;
            }
            i++;
            continue;
        }

        // # Heading 1
        if (trimmed.startsWith('# ')) {
            elements.push(makeHeading1(trimmed.slice(2).trim()));
            i++;
            continue;
        }

        // ## Heading 2
        if (trimmed.startsWith('## ')) {
            elements.push(makeHeading2(trimmed.slice(3).trim()));
            i++;
            continue;
        }

        // ### Heading 3
        if (trimmed.startsWith('### ')) {
            elements.push(makeHeading3(trimmed.slice(4).trim()));
            i++;
            continue;
        }

        // #### ou mais → tratado como h3
        if (trimmed.startsWith('####')) {
            elements.push(makeHeading3(trimmed.replace(/^#+\s*/, '').trim()));
            i++;
            continue;
        }

        // > Blockquote (citação bíblica)
        if (trimmed.startsWith('> ')) {
            const quoteLines = [];
            while (i < lines.length && lines[i].trim().startsWith('> ')) {
                quoteLines.push(lines[i].trim().slice(2));
                i++;
            }
            elements.push(makeBibleQuote(quoteLines.join(' ')));
            continue;
        }

        // - Bullet list
        if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
            elements.push(makeBulletItem(trimmed.slice(2).trim()));
            i++;
            continue;
        }

        // Numeração 1. 2. etc
        if (/^\d+\.\s/.test(trimmed)) {
            elements.push(makeBulletItem(trimmed.replace(/^\d+\.\s/, '').trim()));
            i++;
            continue;
        }

        // --- ou *** (linha divisória) → parágrafo vazio
        if (/^[-*_]{3,}$/.test(trimmed)) {
            elements.push(makeEmptyParagraph());
            i++;
            continue;
        }

        // Texto normal
        const runs = parseInlineMarkdown(trimmed);
        elements.push(makeBodyParagraph(runs));
        i++;
    }

    return elements;
}

// ─── Página de capa ───────────────────────────────────────────────────────────
function buildCoverPage(productName, subtitle) {
    return [
        // Espaços antes do título
        ...Array(8).fill(null).map(() => makeEmptyParagraph()),

        // Linha decorativa
        new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 0, after: 160 },
            children: [
                new TextRun({
                    text: '✦',
                    font: BODY_FONT,
                    size: 32,
                    color: ACCENT_COLOR,
                }),
            ],
        }),

        // Título
        new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 0, after: 240 },
            children: [
                new TextRun({
                    text: productName || 'Produto Digital',
                    font: HEADING_FONT,
                    size: 72,
                    color: '1A1A1A',
                    bold: false,
                }),
            ],
        }),

        // Subtítulo
        ...(subtitle ? [
            new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { before: 0, after: 480 },
                children: [
                    new TextRun({
                        text: subtitle,
                        font: BODY_FONT,
                        size: 26,
                        color: ACCENT_COLOR,
                        italics: true,
                    }),
                ],
            }),
        ] : [makeEmptyParagraph()]),

        // Linha decorativa inferior
        new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 0, after: 0 },
            children: [
                new TextRun({
                    text: '───────────────',
                    font: BODY_FONT,
                    size: 20,
                    color: 'CCCCCC',
                }),
            ],
        }),

        // Page break após capa
        new Paragraph({
            children: [new PageBreak()],
        }),
    ];
}

// ─── Cabeçalho e Rodapé ───────────────────────────────────────────────────────
function buildHeader(productName) {
    return new Header({
        children: [
            new Paragraph({
                alignment: AlignmentType.RIGHT,
                border: { bottom: { color: ACCENT_COLOR, space: 4, style: BorderStyle.SINGLE, size: 6 } },
                children: [
                    new TextRun({
                        text: productName || '',
                        font: BODY_FONT,
                        size: 18,
                        color: 'AAAAAA',
                        italics: true,
                    }),
                ],
            }),
        ],
    });
}

function buildFooter() {
    return new Footer({
        children: [
            new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                    new TextRun({ text: 'Página ', font: BODY_FONT, size: 18, color: 'AAAAAA' }),
                    new TextRun({ children: [PageNumber.CURRENT], font: BODY_FONT, size: 18, color: 'AAAAAA' }),
                ],
            }),
        ],
    });
}

// ─── Exportação principal ─────────────────────────────────────────────────────
/**
 * Constrói o documento DOCX completo.
 *
 * @param {string} markdown - Conteúdo em Markdown (com ou sem placeholders __IMAGE_N__)
 * @param {Map<number, { arrayBuffer: ArrayBuffer|null, prompt: string }>} imageMap
 * @param {string} productName
 * @param {string} [subtitle]
 * @returns {Promise<Blob>} DOCX como Blob
 */
export async function buildDocx(markdown, imageMap, productName, subtitle) {
    const coverElements = buildCoverPage(productName, subtitle);
    const contentElements = parseMarkdownToDocx(markdown, imageMap);

    const doc = new Document({
        creator: 'Brugger CO Toolbox',
        title: productName,
        description: subtitle || '',
        styles: {
            default: {
                document: {
                    run: {
                        font: BODY_FONT,
                        size: SIZES.body,
                        color: TEXT_COLOR,
                    },
                    paragraph: {
                        spacing: { line: 360, lineRule: 'auto' },
                    },
                },
            },
        },
        sections: [
            {
                // Seção da capa (sem cabeçalho/rodapé)
                properties: {
                    type: SectionType.NEXT_PAGE,
                    page: {
                        margin: {
                            top: convertInchesToTwip(0.98),    // ~2.5cm
                            bottom: convertInchesToTwip(0.98),
                            left: convertInchesToTwip(1.18),   // ~3cm
                            right: convertInchesToTwip(1.18),
                        },
                    },
                },
                children: coverElements,
            },
            {
                // Seção do conteúdo (com cabeçalho/rodapé)
                properties: {
                    type: SectionType.CONTINUOUS,
                    page: {
                        margin: {
                            top: convertInchesToTwip(0.98),
                            bottom: convertInchesToTwip(0.98),
                            left: convertInchesToTwip(1.18),
                            right: convertInchesToTwip(1.18),
                        },
                        pageNumbers: {
                            start: 1,
                            formatType: NumberFormat.DECIMAL,
                        },
                    },
                },
                headers: { default: buildHeader(productName) },
                footers: { default: buildFooter() },
                children: contentElements,
            },
        ],
    });

    const buffer = await Packer.toBlob(doc);
    return buffer;
}

/**
 * Dispara o download de um Blob como arquivo.
 *
 * @param {Blob} blob
 * @param {string} filename
 */
export function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 5000);
}

/**
 * Gera um PDF a partir do conteúdo Markdown usando html2canvas + jsPDF.
 *
 * @param {string} markdown - Conteúdo em Markdown (com placeholders __IMAGE_N__)
 * @param {Map<number, { arrayBuffer: ArrayBuffer|null, url: string|null }>} imageMap
 * @param {string} productName
 * @returns {Promise<Blob>} PDF como Blob
 */
export async function generatePdf(markdown, imageMap, productName) {
    const { default: jsPDF } = await import('jspdf');

    // Renderizar HTML em um div oculto
    const container = document.createElement('div');
    container.style.cssText = `
        position: fixed;
        left: -9999px;
        top: 0;
        width: 794px;
        background: white;
        color: #1A1A1A;
        font-family: 'Georgia', serif;
        font-size: 14px;
        line-height: 1.7;
        padding: 60px 80px;
        box-sizing: border-box;
    `;

    // Construir HTML a partir do Markdown (simplificado para PDF)
    const html = buildHtmlForPdf(markdown, imageMap, productName);
    container.innerHTML = html;
    document.body.appendChild(container);

    const pdf = new jsPDF('p', 'mm', 'a4');
    const pageWidth = 210;
    const pageHeight = 297;
    const margin = 15;
    const contentWidth = pageWidth - margin * 2;

    try {
        const { default: html2canvas } = await import('html2canvas');

        const canvas = await html2canvas(container, {
            scale: 1.5,
            useCORS: true,
            allowTaint: true,
            backgroundColor: '#ffffff',
            width: 794,
            logging: false,
        });

        const imgData = canvas.toDataURL('image/jpeg', 0.85);
        const canvasWidth = canvas.width;
        const canvasHeight = canvas.height;

        // Calcular quantas páginas A4 são necessárias
        const pdfPageHeight = (canvasWidth * pageHeight) / pageWidth;
        const totalPages = Math.ceil(canvasHeight / pdfPageHeight);

        for (let page = 0; page < totalPages; page++) {
            if (page > 0) pdf.addPage();

            const srcY = page * pdfPageHeight;
            const srcHeight = Math.min(pdfPageHeight, canvasHeight - srcY);

            // Criar canvas para a fatia da página
            const pageCanvas = document.createElement('canvas');
            pageCanvas.width = canvasWidth;
            pageCanvas.height = srcHeight;
            const ctx = pageCanvas.getContext('2d');
            ctx.drawImage(canvas, 0, srcY, canvasWidth, srcHeight, 0, 0, canvasWidth, srcHeight);

            const pageImgData = pageCanvas.toDataURL('image/jpeg', 0.85);
            const imgHeight = (srcHeight * contentWidth) / canvasWidth;

            pdf.addImage(pageImgData, 'JPEG', margin, margin, contentWidth, imgHeight);
        }

        return pdf.output('blob');
    } finally {
        document.body.removeChild(container);
    }
}

/**
 * Converte Markdown em HTML para renderização no PDF.
 */
function buildHtmlForPdf(markdown, imageMap, productName) {
    const lines = markdown.split('\n');
    const parts = [];

    // Capa
    parts.push(`
        <div style="text-align:center; padding: 80px 0; margin-bottom: 60px; border-bottom: 2px solid #C9A962;">
            <div style="font-size: 36px; font-family: Georgia, serif; color: #1A1A1A; margin-bottom: 16px;">${escHtml(productName || 'Produto')}</div>
        </div>
    `);

    let i = 0;
    while (i < lines.length) {
        const line = lines[i];
        const trimmed = line.trim();

        if (!trimmed) {
            parts.push('<p style="margin:6px 0;"></p>');
            i++;
            continue;
        }

        // Image placeholder
        const imgMatch = trimmed.match(/^__IMAGE_(\d+)__$/);
        if (imgMatch) {
            const idx = parseInt(imgMatch[1], 10);
            const imgData = imageMap?.get(idx);
            if (imgData?.url) {
                parts.push(`<div style="text-align:center; margin: 24px 0;"><img src="${escHtml(imgData.url)}" style="max-width:100%; border-radius:4px;" crossorigin="anonymous" /></div>`);
            }
            i++;
            continue;
        }

        if (trimmed.startsWith('[IMAGEM]')) {
            while (i < lines.length && !lines[i].includes('[/IMAGEM]')) i++;
            i++;
            continue;
        }

        if (trimmed.startsWith('# ')) {
            parts.push(`<h1 style="font-family:Georgia,serif; font-size:28px; color:#C9A962; margin:40px 0 16px; border-bottom:1px solid #eee; padding-bottom:8px;">${escHtml(trimmed.slice(2))}</h1>`);
        } else if (trimmed.startsWith('## ')) {
            parts.push(`<h2 style="font-family:Georgia,serif; font-size:22px; color:#555; margin:32px 0 12px;">${escHtml(trimmed.slice(3))}</h2>`);
        } else if (trimmed.startsWith('### ')) {
            parts.push(`<h3 style="font-family:Arial,sans-serif; font-size:16px; color:#333; margin:24px 0 8px; font-weight:700;">${escHtml(trimmed.slice(4))}</h3>`);
        } else if (trimmed.startsWith('> ')) {
            const quoteLines = [];
            while (i < lines.length && lines[i].trim().startsWith('> ')) {
                quoteLines.push(lines[i].trim().slice(2));
                i++;
            }
            parts.push(`<blockquote style="margin:20px 0; padding: 12px 16px; border-left: 4px solid #C9A962; background:#FFF9EE; font-style:italic; color:#555; border-radius:0 4px 4px 0;">${escHtml(quoteLines.join(' '))}</blockquote>`);
            continue;
        } else if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
            parts.push(`<li style="margin:4px 0; color:#1A1A1A;">${escHtml(trimmed.slice(2))}</li>`);
        } else if (/^---+$/.test(trimmed)) {
            parts.push('<hr style="border:none;border-top:1px solid #ddd;margin:24px 0;">');
        } else {
            parts.push(`<p style="margin:0 0 12px; color:#1A1A1A; line-height:1.7;">${inlineMarkdownToHtml(trimmed)}</p>`);
        }

        i++;
    }

    return parts.join('\n');
}

function escHtml(str) {
    if (!str) return '';
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

function inlineMarkdownToHtml(text) {
    return escHtml(text)
        .replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>')
        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.+?)\*/g, '<em>$1</em>');
}
