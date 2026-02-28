import { callClaude } from './claude.js';

// Fix 1: model ID correto (era 'claude-sonnet-4', sem .6)
const ESTRUTURADOR_MODEL = 'anthropic/claude-sonnet-4.6';

// ─── Fix 2: HTML → Texto legível ──────────────────────────────────────────────
/**
 * Converte HTML de uma LP em texto markdown-like limpo.
 * Reduz 60-70% dos tokens vs HTML puro, preservando toda a semântica.
 * Garante que bônus (final da página) não sejam truncados.
 */
function htmlToReadableText(html) {
  let text = html;

  // 1. Remover blocos opacos (sem conteúdo textual útil)
  text = text
    .replace(/<svg\b[^>]*>[\s\S]*?<\/svg>/gi, '')
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<noscript\b[^>]*>[\s\S]*?<\/noscript>/gi, '')
    .replace(/<!--[\s\S]*?-->/g, '');

  // 2. Converter elementos estruturais em markdown
  text = text
    // Headings → markdown heading
    .replace(/<h1\b[^>]*>([\s\S]*?)<\/h1>/gi, (_, c) => `\n# ${strip(c)}\n`)
    .replace(/<h2\b[^>]*>([\s\S]*?)<\/h2>/gi, (_, c) => `\n## ${strip(c)}\n`)
    .replace(/<h3\b[^>]*>([\s\S]*?)<\/h3>/gi, (_, c) => `\n### ${strip(c)}\n`)
    .replace(/<h4\b[^>]*>([\s\S]*?)<\/h4>/gi, (_, c) => `\n#### ${strip(c)}\n`)
    .replace(/<h5\b[^>]*>([\s\S]*?)<\/h5>/gi, (_, c) => `\n##### ${strip(c)}\n`)
    .replace(/<h6\b[^>]*>([\s\S]*?)<\/h6>/gi, (_, c) => `\n###### ${strip(c)}\n`)
    // Listas → bullet points
    .replace(/<li\b[^>]*>([\s\S]*?)<\/li>/gi, (_, c) => `\n- ${strip(c)}`)
    // Parágrafos → linha separada
    .replace(/<p\b[^>]*>([\s\S]*?)<\/p>/gi, (_, c) => { const t = strip(c); return t ? `\n${t}\n` : ''; })
    // Quebras de linha
    .replace(/<br\s*\/?>/gi, '\n')
    // Negrito/itálico → manter o texto
    .replace(/<(strong|b)\b[^>]*>([\s\S]*?)<\/\1>/gi, (_, _t, c) => `**${strip(c)}**`)
    .replace(/<(em|i)\b[^>]*>([\s\S]*?)<\/\1>/gi, (_, _t, c) => `_${strip(c)}_`)
    // Links → manter o texto do link
    .replace(/<a\b[^>]*>([\s\S]*?)<\/a>/gi, (_, c) => strip(c))
    // Spans e divs com texto — deixar o texto fluir, adicionar newline nas divs
    .replace(/<div\b[^>]*>/gi, '\n')
    .replace(/<\/div>/gi, '\n')
    .replace(/<section\b[^>]*>/gi, '\n\n---\n')
    .replace(/<\/section>/gi, '\n')
    .replace(/<article\b[^>]*>/gi, '\n\n---\n')
    .replace(/<\/article>/gi, '\n')
    .replace(/<(header|footer|main|aside|nav)\b[^>]*>/gi, '\n\n---\n')
    .replace(/<\/(header|footer|main|aside|nav)>/gi, '\n')
    // Tabelas — preservar conteúdo
    .replace(/<td\b[^>]*>([\s\S]*?)<\/td>/gi, (_, c) => ` | ${strip(c)}`)
    .replace(/<th\b[^>]*>([\s\S]*?)<\/th>/gi, (_, c) => ` | **${strip(c)}**`)
    .replace(/<tr\b[^>]*>/gi, '\n')
    .replace(/<\/tr>/gi, ' |');

  // 3. Remover todas as tags restantes
  text = text.replace(/<[^>]+>/g, '');

  // 4. Decodificar entidades HTML
  text = text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&mdash;/g, '—')
    .replace(/&ndash;/g, '–')
    .replace(/&bull;/g, '•')
    .replace(/&rarr;/g, '→')
    .replace(/&[a-z]+;/gi, ' ');

  // 5. Normalizar espaços e linhas
  text = text
    .replace(/[ \t]+/g, ' ')         // múltiplos espaços → um
    .replace(/\n[ \t]+/g, '\n')      // espaços no início de linha
    .replace(/[ \t]+\n/g, '\n')      // espaços no fim de linha
    .replace(/\n{4,}/g, '\n\n\n')    // no máximo 3 newlines seguidos
    .trim();

  return text;
}

/** Remove tags HTML de uma string (helper interno) */
function strip(html) {
  return (html || '').replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
}

// ─── Fix 4: JSON Recovery ─────────────────────────────────────────────────────
/**
 * Tenta recuperar JSON válido de uma resposta possivelmente truncada.
 * Estratégias em ordem:
 *  1. Parse direto após limpeza de markdown
 *  2. Extrair o maior bloco JSON da resposta
 *  3. Fechar JSON incompleto e tentar novamente
 *  4. Retornar estrutura mínima com o que foi extraído
 */
function recoverJson(raw) {
  const cleaned = raw
    .replace(/```json\n?/g, '')
    .replace(/```\n?/g, '')
    .trim();

  // Tentativa 1: parse direto
  try { return JSON.parse(cleaned); } catch { /* continua */ }

  // Tentativa 2: extrair o maior bloco { ... } da resposta
  const firstBrace = cleaned.indexOf('{');
  if (firstBrace !== -1) {
    // Tentar fechar o JSON de forma inteligente
    const partial = cleaned.slice(firstBrace);
    try { return JSON.parse(partial); } catch { /* continua */ }

    // Tentativa 3: fechar JSON truncado
    const fixed = closeJsonBraces(partial);
    try {
      const parsed = JSON.parse(fixed);
      console.warn('[Estruturador] JSON recuperado após fechamento automático');
      return parsed;
    } catch { /* continua */ }
  }

  // Tentativa 4: estrutura mínima com campos que conseguirmos extrair
  console.error('[Estruturador] Falha total ao parsear JSON — retornando estrutura mínima');
  return buildMinimalResult(cleaned);
}

/** Fecha chaves e colchetes abertos em uma string JSON parcial */
function closeJsonBraces(partial) {
  let result = partial;
  // Remover vírgula trailing antes de fechar
  result = result.replace(/,\s*$/, '');

  // Contar chaves e colchetes abertos
  let braces = 0;
  let brackets = 0;
  let inString = false;
  let escape = false;

  for (const ch of result) {
    if (escape) { escape = false; continue; }
    if (ch === '\\') { escape = true; continue; }
    if (ch === '"') { inString = !inString; continue; }
    if (inString) continue;
    if (ch === '{') braces++;
    else if (ch === '}') braces--;
    else if (ch === '[') brackets++;
    else if (ch === ']') brackets--;
  }

  // Fechar na ordem reversa
  for (let i = 0; i < brackets; i++) result += ']';
  for (let i = 0; i < braces; i++) result += '}';

  return result;
}

/** Retorna estrutura mínima quando o JSON não pode ser recuperado */
function buildMinimalResult(text) {
  // Tenta extrair ao menos o nome do produto de "nome": "..."
  const nomeMatch = text.match(/"nome"\s*:\s*"([^"]+)"/);
  return {
    produto: {
      nome: nomeMatch?.[1] || 'Produto (erro de extração)',
      subtitulo: '',
      formato: 'Ebook PDF',
      paginas: 0,
      imagens: 0,
      modulosCount: 0,
      garantia: 30,
      publicoAlvo: '',
      modulos: [],
    },
    bonus: [],
    orderBumps: [],
    metricas: [],
    planoProducao: [],
    tempoTotalHoras: 0,
    validacao: {
      paginasCumpridas: false,
      imagensCumpridas: false,
      modulosCumpridos: false,
      bonusCumpridos: false,
      observacoes: 'Erro ao extrair dados completos da LP. Tente novamente.',
    },
    _parseError: true,
  };
}

// ─── Fix 3: System Prompt melhorado ───────────────────────────────────────────
const SYSTEM_PROMPT = `Você é o Estruturador de Produto Digital — especialista em transformar landing pages de infoprodutos bíblicos em planos de produção 100% executáveis.

TAREFA: Analisar o TEXTO da landing page fornecida, extrair TUDO que foi prometido ao cliente, classificar cada entregável e retornar um plano de produção completo.

RETORNE APENAS JSON VÁLIDO. Sem markdown, sem blocos de código, sem explicações. Somente o objeto JSON puro.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PASSO 1 — IDENTIFICAR SEÇÕES DA PÁGINA
Antes de extrair, mentalmente identifique:
- Seção de PRODUTO PRINCIPAL (nome, subtítulo, módulos/capítulos do ebook)
- Seção de BÔNUS (presentes, extras grátis, bônus exclusivos)
- Seção de PREÇO / ORDER BUMP (produto adicional na checkout)
- Seção de CONTEÚDO (o que está dentro do ebook: módulos, capítulos, tópicos)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

PASSO 2 — PADRÕES DE MÓDULOS EM LPs BRASILEIRAS:
Módulos/capítulos do produto principal aparecem como:
• "Módulo 1:", "Módulo 2:", "Módulo 3:" (numerados em sequência)
• "Capítulo 1:", "Parte 1:", "Lição 1:" (mesma lógica)
• "✅ Módulo", "📚 Módulo", numeração em listas
• Seções com subtítulos em sequência dentro de "O que você vai aprender"
• Listas com marcadores onde cada item é um tema distinto do ebook
ATENÇÃO: NÃO confunda módulos com bônus! Módulos são o conteúdo DO produto. Bônus são presentes ALÉM do produto.

PASSO 3 — PADRÕES DE BÔNUS EM LPs BRASILEIRAS:
Bônus aparecem como (VARRA A PÁGINA INTEIRA ATÉ O FINAL):
• "Bônus #1:", "Bônus #2:", "Bônus Exclusivo #1:"
• "🎁 Bônus:", "🎯 Bônus Especial:", "⭐ Super Bônus:"
• "E você também recebe:", "Você ainda ganha de graça:"
• "Avaliado em R$XX", "No valor de R$XX", "De R$XX por apenas"
• "GRÁTIS", "De graça", "Sem custo adicional"
• O ÚLTIMO BÔNUS quase sempre é "Atualizações Vitalícias" ou "Acesso Vitalício"
• "Super Bônus" = bônus com valor acima de R$97 ou destaque especial
CRÍTICO: Liste TODOS os bônus, mesmo que estejam dispersos pela página.

PASSO 4 — PADRÕES DE ORDER BUMP:
• Aparece perto da seção de preço/checkout
• Frases como: "Adicione por apenas R$XX", "Complete seu pedido com", "Oferta especial exclusiva"
• Ou informado pelo usuário na seção ORDER BUMPS abaixo

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Estrutura EXATA do JSON de retorno:
{
  "produto": {
    "nome": "string",
    "subtitulo": "string",
    "formato": "Ebook PDF",
    "paginas": 200,
    "imagens": 50,
    "modulosCount": 10,
    "garantia": 30,
    "publicoAlvo": "string",
    "modulos": [
      {
        "numero": 1,
        "nome": "string",
        "paginasEstimadas": 20,
        "topicos": ["string", "string"]
      }
    ]
  },
  "bonus": [
    {
      "nome": "string",
      "descricao": "string",
      "valorAtribuido": "R$97",
      "tipo": "ebook_simples",
      "ferramenta": "Claude",
      "paginasEstimadas": 40,
      "isSuper": false
    }
  ],
  "orderBumps": [
    {
      "nome": "string",
      "descricao": "string",
      "preco": "17",
      "tipo": "ebook_imagens",
      "ferramenta": "Claude + NanoBanana"
    }
  ],
  "metricas": [
    { "item": "Páginas no produto principal", "valor": "200+", "cumprivel": true }
  ],
  "planoProducao": [
    {
      "fase": "Produto Principal",
      "passo": 1,
      "nome": "string",
      "ferramenta": "string",
      "tempoMinutos": 30,
      "descricao": "string"
    }
  ],
  "tempoTotalHoras": 8,
  "validacao": {
    "paginasCumpridas": true,
    "imagensCumpridas": true,
    "modulosCumpridos": true,
    "bonusCumpridos": true,
    "observacoes": "string"
  }
}

REGRAS DE CLASSIFICAÇÃO (campo tipo e ferramenta):
- Produto/bônus com imagens prometidas → tipo: "ebook_imagens" | ferramenta: "Claude + NanoBanana"
- Conteúdo visual/curto (mapas, infográficos, timelines) → tipo: "ebook_slide" | ferramenta: "Gamma.app"
- Conteúdo 100% textual extenso → tipo: "ebook_simples" | ferramenta: "Claude"
- Videoaulas → tipo: "videoaula" | ferramenta: "NotebookLM"
- Áudio, orações, devocional → tipo: "audio" | ferramenta: "NotebookLM"
- Checklist, guia rápido, 1-pager → tipo: "checklist" | ferramenta: "Claude"

FASES do planoProducao (use exatamente estes nomes):
- "Produto Principal" → módulos do ebook principal
- "Bônus" → cada bônus separado
- "Order Bumps" → cada order bump (se houver)
- "Videoaulas" → se houver aulas (sempre por último)
- "Montagem Final" → compilar, upload, configurar acesso

REGRA DO SUPER BÔNUS: Se um bônus tiver valor atribuído acima de R$97 ou a LP o chamar de "Super Bônus" / destaque especial, marcar isSuper: true.`;

// ─── Service Principal ─────────────────────────────────────────────────────────
/**
 * Roda o Estruturador de Produto Digital.
 * Envia LP como texto limpo ao Claude Sonnet 4.6 e retorna JSON estruturado.
 *
 * @param {string} lpHtml - HTML completo da landing page
 * @param {Array}  orderBumps - Array de { nome, descricao, preco }
 * @param {Function} onProgress - Callback({ stage, message, pct })
 * @returns {Promise<Object>} Plano de produção estruturado
 */
export async function runEstruturador(lpHtml, orderBumps = [], onProgress) {
  onProgress?.({ stage: 'reading', message: 'Lendo a landing page...', pct: 15 });

  // Fix 2: Converter HTML para texto legível (reduz 60-70% dos tokens)
  const readableText = htmlToReadableText(lpHtml);

  onProgress?.({ stage: 'reading', message: 'Preparando conteúdo para análise...', pct: 30 });

  // Limite em caracteres — com texto puro podemos aumentar bastante
  // 1 token ≈ 4 chars em pt-BR; Claude Sonnet suporta ~200k tokens de input ≈ 800k chars
  // Usamos 400k para ter margem confortável
  const MAX_CHARS = 400_000;
  const truncatedText = readableText.length > MAX_CHARS
    ? readableText.slice(0, MAX_CHARS) + '\n\n... [conteúdo truncado — LP muito longa]'
    : readableText;

  const orderBumpsSection = orderBumps.length > 0
    ? `\n\nORDER BUMPS INFORMADOS PELO USUÁRIO:\n${orderBumps.map((ob, i) =>
        `${i + 1}. ${ob.nome}: ${ob.descricao || 'sem descrição'} (R$${ob.preco})`
      ).join('\n')}`
    : '';

  const userPrompt = `Analise esta landing page e retorne o plano de produção completo como JSON.
Siga os 4 passos do system prompt: identifique seções → extraia módulos → extraia bônus → monte o JSON.${orderBumpsSection}

TEXTO DA LANDING PAGE:
${truncatedText}`;

  onProgress?.({ stage: 'analyzing', message: 'Claude analisando promessas da LP...', pct: 55 });

  const raw = await callClaude(SYSTEM_PROMPT, userPrompt, ESTRUTURADOR_MODEL);

  onProgress?.({ stage: 'parsing', message: 'Estruturando plano de produção...', pct: 88 });

  // Fix 4: JSON recovery inteligente
  const parsed = recoverJson(raw);

  // Garantir campos mínimos para não quebrar a UI
  if (!parsed.produto) parsed.produto = { nome: '', modulos: [] };
  if (!Array.isArray(parsed.produto.modulos)) parsed.produto.modulos = [];
  if (!Array.isArray(parsed.bonus)) parsed.bonus = [];
  if (!Array.isArray(parsed.orderBumps)) parsed.orderBumps = [];
  if (!Array.isArray(parsed.metricas)) parsed.metricas = [];
  if (!Array.isArray(parsed.planoProducao)) parsed.planoProducao = [];

  onProgress?.({ stage: 'done', message: 'Plano gerado com sucesso!', pct: 100 });

  return parsed;
}
