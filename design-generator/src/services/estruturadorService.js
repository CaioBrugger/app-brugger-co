import { callClaude } from './claude.js';

const ESTRUTURADOR_MODEL = 'anthropic/claude-sonnet-4';

/**
 * Runs the Estruturador de Produto Digital agent.
 * Sends LP HTML to Claude Sonnet and returns structured production plan JSON.
 *
 * @param {string} lpHtml - Full HTML content of the landing page
 * @param {Array}  orderBumps - Array of { nome, descricao, preco } objects
 * @param {Function} onProgress - Callback({ stage, message, pct })
 * @returns {Promise<Object>} Structured production plan
 */
export async function runEstruturador(lpHtml, orderBumps = [], onProgress) {
  onProgress?.({ stage: 'reading', message: 'Lendo a landing page...', pct: 20 });

  const systemPrompt = `Você é o Estruturador de Produto Digital — especialista em transformar landing pages de infoprodutos bíblicos em planos de produção 100% executáveis.

TAREFA: Analisar o HTML da landing page fornecida, extrair TUDO que foi prometido ao cliente, classificar cada entregável e retornar um plano de produção completo.

RETORNE APENAS JSON VÁLIDO. Sem markdown, sem blocos de código, sem explicações. Somente o objeto JSON puro.

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
- "Bônus" → cada bônus separado (Atenção redobrada: procure ativamente por seções de "Bônus", "Bônus Exclusivos", "Presentes" na LP).
- "Order Bumps" → cada order bump (se houver)
- "Videoaulas" → se houver aulas (sempre por último)
- "Montagem Final" → compilar, upload, configurar acesso

REGRA DO SUPER BÔNUS: Se um bônus tiver valor atribuído muito alto (acima de R$97) ou a LP o chamar de "Super Bônus" / destaque especial, marcar isSuper: true.`;

  const orderBumpsSection = orderBumps.length > 0
    ? `\n\nORDER BUMPS INFORMADOS PELO USUÁRIO:\n${orderBumps.map((ob, i) => `${i + 1}. ${ob.nome}: ${ob.descricao || 'sem descrição'} (R$${ob.preco})`).join('\n')}`
    : '';

  // Clean HTML to save tokens (remove svgs, styles, scripts, comments)
  const cleanHtml = lpHtml
    .replace(/<svg\b[^>]*>[\s\S]*?<\/svg>/gi, '[SVG ICON]')
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<!--[\s\S]*?-->/g, '');

  // Truncate HTML to ~250K chars to stay within token limits (Claude 3.5 Sonnet supports 200k tokens ≈ 800k chars)
  const truncatedHtml = cleanHtml.length > 250000
    ? cleanHtml.substring(0, 250000) + '\n\n... [conteúdo HTML truncado para otimização de tokens]'
    : cleanHtml;

  const userPrompt = `Analise esta landing page e retorne o plano de produção completo como JSON:${orderBumpsSection}

HTML DA LANDING PAGE:
${truncatedHtml}`;

  onProgress?.({ stage: 'analyzing', message: 'Claude analisando promessas da LP...', pct: 50 });

  const result = await callClaude(systemPrompt, userPrompt, ESTRUTURADOR_MODEL);

  onProgress?.({ stage: 'parsing', message: 'Estruturando plano de produção...', pct: 85 });

  let parsed;
  try {
    const cleaned = result
      .replace(/```json\n?/g, '')
      .replace(/```\n?/g, '')
      .trim();
    parsed = JSON.parse(cleaned);
  } catch {
    throw new Error('Erro ao interpretar resposta da IA. Verifique sua conexão e tente novamente.');
  }

  onProgress?.({ stage: 'done', message: 'Plano gerado com sucesso!', pct: 100 });

  return parsed;
}
