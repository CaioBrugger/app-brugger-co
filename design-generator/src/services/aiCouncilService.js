import { researchTopic } from './perplexity';
import { callClaude, LLM_MODELS } from './claude';

const COUNCIL_MODELS = [
    { key: 'researcher', name: 'Perplexity Sonar', icon: '🔍', id: 'perplexity/sonar', role: 'Pesquisa de mercado' },
    { key: 'strategist', name: LLM_MODELS[0].name, icon: LLM_MODELS[0].icon, id: LLM_MODELS[0].id, role: 'Estratégia de produto' },
    { key: 'challenger', name: LLM_MODELS[1].name, icon: LLM_MODELS[1].icon, id: LLM_MODELS[1].id, role: "Devil's Advocate" },
    { key: 'analyst', name: LLM_MODELS[2].name, icon: LLM_MODELS[2].icon, id: LLM_MODELS[2].id, role: 'Análise de viabilidade' },
    { key: 'judge', name: LLM_MODELS[3].name, icon: LLM_MODELS[3].icon, id: LLM_MODELS[3].id, role: 'Veredito final' }
];

const SCORE_THRESHOLD = 7;
const MIN_APPROVED = 3;
const MAX_ATTEMPTS = 4;

function parseJSON(raw) {
    if (typeof raw !== 'string') return raw;
    try {
        return JSON.parse(raw.replace(/```json?\s*/g, '').replace(/```/g, '').trim());
    } catch {
        const match = raw.match(/\{[\s\S]*\}/);
        return match ? JSON.parse(match[0]) : null;
    }
}

/**
 * Runs one round of phases 2-5 (Claude → Grok → DeepSeek → GPT).
 * Returns merged idea objects with scores.
 */
async function runCouncilRound({
    productsSummary,
    pipelineSummary,
    marketResearch,
    rejectedNames,
    attemptLabel,
    onPhase,
}) {
    const claude = COUNCIL_MODELS[1];
    const grok = COUNCIL_MODELS[2];
    const deepseek = COUNCIL_MODELS[3];
    const gpt = COUNCIL_MODELS[4];

    const rejectedNote = rejectedNames.length > 0
        ? `\n## IDEIAS JÁ REJEITADAS (score insuficiente — NÃO proponha variações destes):\n${rejectedNames.map(n => `• ${n}`).join('\n')}`
        : '';

    // ── Phase 2: Claude — Proposals ──
    onPhase('strategist', `${claude.icon} ${claude.name} criando propostas${attemptLabel}...`);

    const claudeSystem = `Você é um ESTRATEGISTA DE INFOPRODUTOS BÍBLICOS sênior. Mercado de ebooks e guias visuais cristãos low-ticket (R$9-29).

REGRAS:
- Cada sugestão DIFERENTE dos produtos existentes e dos já rejeitados
- Foco em LOW TICKET (R$9-29) — ebooks visuais, guias ilustrados
- ALTO valor percebido (imagens, mapas, ilustrações)
- Possibilidade de MULTI-IDIOMA (pt, es, en, fr, de)
- ESCALABILIDADE global

RETORNE JSON com exatamente 3 propostas:
{
  "ideas": [
    {
      "name": "Nome do Produto",
      "tagline": "Frase de impacto de 1 linha",
      "description": "2-3 frases do que é o produto",
      "reasoning": "3-4 frases de POR QUE funciona no nicho",
      "targetAudience": "Público-alvo específico",
      "contentIdea": "Estrutura do conteúdo",
      "pricePoint": "R$XX,XX",
      "difficulty": "baixa|média|alta",
      "category": "AT|NT|COMBO"
    }
  ]
}`;

    const claudeUser = `## PRODUTOS EXISTENTES (já no catálogo):
${productsSummary}
${pipelineSummary ? `\n## PRODUTOS EM PRODUÇÃO (pipeline — NÃO repita estes):\n${pipelineSummary}` : ''}${rejectedNote}

## PESQUISA DE MERCADO (Perplexity):
${marketResearch}

Sugira 3 NOVOS produtos low-ticket que NÃO sejam semelhantes a nenhum dos produtos acima. Retorne APENAS JSON.`;

    const claudeRaw = await callClaude(claudeSystem, claudeUser, claude.id);
    const claudeParsed = parseJSON(claudeRaw);
    const ideas = claudeParsed?.ideas || (Array.isArray(claudeParsed) ? claudeParsed : []);

    onPhase('strategist', `${claude.icon} ${claude.name} — ${ideas.length} propostas criadas${attemptLabel}`);

    // ── Phase 3: Grok — Devil's Advocate ──
    onPhase('challenger', `${grok.icon} ${grok.name} desafiando as propostas${attemptLabel}...`);

    const grokPrompt = `Você é o Devil's Advocate em um conselho de IAs para produtos bíblicos.

## PRODUTOS EXISTENTES (catálogo):
${productsSummary}
${pipelineSummary ? `\n## PRODUTOS EM PRODUÇÃO (pipeline):\n${pipelineSummary}` : ''}

## PROPOSTAS (Claude):
${JSON.stringify(ideas, null, 2)}

Para CADA proposta, aponte:
1. O MAIOR RISCO ou fraqueza
2. Uma MELHORIA concreta

Retorne JSON:
{ "challenges": [{ "originalName": "nome", "risk": "risco em 1 frase", "improvement": "melhoria em 1 frase" }] }

Retorne APENAS JSON.`;

    let challenges = [];
    try {
        const grokRaw = await callClaude(grokPrompt, 'Analise criticamente estas propostas de produtos.', grok.id);
        challenges = parseJSON(grokRaw)?.challenges || [];
    } catch (err) {
        console.warn('Grok challenge failed:', err);
    }

    onPhase('challenger', `${grok.icon} ${grok.name} — desafios apontados${attemptLabel}`);

    // ── Phase 4: DeepSeek — Viability Analysis ──
    onPhase('analyst', `${deepseek.icon} ${deepseek.name} analisando viabilidade${attemptLabel}...`);

    const deepseekPrompt = `Você é um analista de viabilidade de infoprodutos digitais. Avalie estas 3 propostas de produtos bíblicos low-ticket.

## PESQUISA DE MERCADO:
${marketResearch}

## PROPOSTAS:
${JSON.stringify(ideas, null, 2)}

Para CADA proposta, dê:
1. marketFit: "Alto|Médio|Baixo" com justificativa breve
2. productionDifficulty: 1-10
3. revenueEstimate: estimativa mensal em R$

Retorne JSON:
{ "analyses": [{ "originalName": "nome", "marketFit": "Alto — justificativa", "productionDifficulty": 5, "revenueEstimate": "R$X.XXX/mês" }] }

Retorne APENAS JSON.`;

    let analyses = [];
    try {
        const dsRaw = await callClaude(deepseekPrompt, 'Analise a viabilidade destas propostas.', deepseek.id);
        analyses = parseJSON(dsRaw)?.analyses || [];
    } catch (err) {
        console.warn('DeepSeek analysis failed:', err);
    }

    onPhase('analyst', `${deepseek.icon} ${deepseek.name} — análise concluída${attemptLabel}`);

    // ── Phase 5: GPT — Final Scoring & Verdict ──
    onPhase('judge', `${gpt.icon} ${gpt.name} dando veredito final${attemptLabel}...`);

    const gptPrompt = `Você é o JUIZ FINAL de um conselho de 5 IAs que avalia novos produtos digitais bíblicos.

## PROPOSTAS originais (Claude):
${JSON.stringify(ideas, null, 2)}

## DESAFIOS (Grok):
${JSON.stringify(challenges, null, 2)}

## ANÁLISE DE VIABILIDADE (DeepSeek):
${JSON.stringify(analyses, null, 2)}

Para CADA proposta, consolide tudo e dê:
1. score: 0-10 (viabilidade × demanda × originalidade × facilidade). Seja criterioso — score acima de 7 significa potencial real de mercado.
2. verdict: "Aprovado" | "Aprovado com ressalvas" | "Precisa repensar"
3. finalNote: 1 frase consolidando a opinião do conselho

Retorne JSON:
{ "verdicts": [{ "originalName": "nome", "score": 8.5, "verdict": "Aprovado", "finalNote": "frase" }] }

Retorne APENAS JSON.`;

    let verdicts = [];
    try {
        const gptRaw = await callClaude(gptPrompt, 'Dê o veredito final para cada proposta.', gpt.id);
        verdicts = parseJSON(gptRaw)?.verdicts || [];
    } catch (err) {
        console.warn('GPT verdict failed:', err);
    }

    onPhase('judge', `${gpt.icon} ${gpt.name} — vereditos emitidos${attemptLabel}`);

    // ── Merge ──
    return (Array.isArray(ideas) ? ideas : []).map((idea, i) => {
        const challenge = challenges[i] || {};
        const analysis = analyses[i] || {};
        const verdict = verdicts[i] || {};
        return {
            ...idea,
            score: verdict.score ?? 0,
            risk: challenge.risk || '',
            improvement: challenge.improvement || '',
            verdict: verdict.verdict || 'Precisa repensar',
            finalNote: verdict.finalNote || '',
            marketFit: analysis.marketFit || '',
            productionDifficulty: analysis.productionDifficulty || null,
            revenueEstimate: analysis.revenueEstimate || '',
            aiDebate: {
                researcher: COUNCIL_MODELS[0].name,
                proposer: claude.name,
                challenger: grok.name,
                analyst: deepseek.name,
                judge: gpt.name,
            }
        };
    });
}

/**
 * Runs the AI Council pipeline with all 5 models.
 * Loops phases 2-5 until 3 ideas with score > 7 are found (max 4 attempts).
 * Phase 1 (Perplexity research) runs only once.
 */
export async function runAICouncil(existingProducts, onProgress, pipelineIdeas = []) {
    const progressUpdate = (phase, message, percentage) => {
        if (onProgress) onProgress({ phase, message, percentage });
    };

    const productsSummary = existingProducts.map(p =>
        `• ${p.icon} ${p.name} (${p.category}) — ${p.description}`
    ).join('\n');

    const pipelineSummary = pipelineIdeas.length > 0
        ? pipelineIdeas.map(p =>
            `• ${p.name} (${p.category || 'AT'}) [${p.status}] — ${p.description || ''}`
          ).join('\n')
        : null;

    // ── Phase 1: Perplexity Research (once) ──
    progressUpdate('researcher', '🔍 Perplexity pesquisando tendências do mercado bíblico...', 5);

    let marketResearch = '';
    try {
        marketResearch = await researchTopic(
            `Tendências de mercado 2025-2026 para infoprodutos digitais bíblicos/cristãos low-ticket (R$9-29). ` +
            `Quais temas bíblicos estão em alta? Quais formatos (ebooks, guias visuais, devocionais ilustrados) vendem mais? ` +
            `Quais nichos dentro do público cristão estão sub-atendidos? ` +
            `Formato: bullets com dados específicos (volume de buscas, tendências, concorrência).`
        );
    } catch (err) {
        console.warn('Perplexity research failed, using fallback:', err);
        marketResearch = 'Pesquisa de mercado indisponível. Use conhecimento geral do nicho bíblico.';
    }

    progressUpdate('researcher', '🔍 Pesquisa de mercado concluída', 15);

    // ── Loop: fases 2-5 até ter MIN_APPROVED ideias com score > SCORE_THRESHOLD ──
    const approvedIdeas = [];
    const rejectedNames = [];
    let attempt = 0;

    while (approvedIdeas.length < MIN_APPROVED && attempt < MAX_ATTEMPTS) {
        attempt++;
        const attemptLabel = attempt > 1 ? ` (tentativa ${attempt}/${MAX_ATTEMPTS})` : '';

        // Progresso: distribui 15%→95% entre as tentativas
        const attemptRange = 80 / MAX_ATTEMPTS;
        const attemptBase = 15 + (attempt - 1) * attemptRange;

        const onPhase = (phase, message) => {
            // Avança o progresso dentro da faixa desta tentativa
            const phases = ['strategist', 'challenger', 'analyst', 'judge'];
            const phaseIndex = phases.indexOf(phase.replace(/ \(.*\)/, ''));
            const phasePct = phaseIndex >= 0 ? (phaseIndex / phases.length) * attemptRange : 0;
            progressUpdate(phase, message, Math.round(attemptBase + phasePct));
        };

        const roundResults = await runCouncilRound({
            productsSummary,
            pipelineSummary,
            marketResearch,
            rejectedNames,
            attemptLabel,
            onPhase,
        });

        for (const idea of roundResults) {
            if (idea.score > SCORE_THRESHOLD) {
                if (!approvedIdeas.some(a => a.name === idea.name)) {
                    approvedIdeas.push(idea);
                }
            } else {
                rejectedNames.push(idea.name);
            }
        }

        if (approvedIdeas.length < MIN_APPROVED && attempt < MAX_ATTEMPTS) {
            progressUpdate(
                'retry',
                `🔄 ${approvedIdeas.length}/${MIN_APPROVED} aprovada(s) — nova rodada com ideias diferentes...`,
                Math.round(attemptBase + attemptRange)
            );
        }
    }

    progressUpdate('done', `✅ Conselho concluído — ${approvedIdeas.length} ideia(s) aprovada(s) com score > ${SCORE_THRESHOLD}`, 100);

    return {
        ideas: approvedIdeas.slice(0, MIN_APPROVED),
        meta: {
            models: COUNCIL_MODELS,
            researchLength: marketResearch.length,
            attempts: attempt,
            timestamp: new Date().toISOString()
        }
    };
}

export { COUNCIL_MODELS };
