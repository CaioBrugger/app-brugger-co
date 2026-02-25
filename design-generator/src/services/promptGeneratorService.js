/**
 * promptGeneratorService.js
 *
 * Gera o prompt completo para Claude baseado no tipo do entregável
 * e no contexto do resultado do estruturadorService.
 *
 * Modelos:
 *   A → ebook_simples: texto puro
 *   B → ebook_imagens: texto + blocos [IMAGEM]...[/IMAGEM]
 */

/**
 * Encontra o item de contexto (bônus, produto principal, order bump)
 * correspondente ao item do plano de produção.
 *
 * @param {Object} item - Item do planoProducao
 * @param {Object} result - Resultado completo do estruturadorService
 * @returns {{ tipo, nome, descricao, modulos, topicos, paginas, publicoAlvo, ferramenta }}
 */
function resolveItemContext(item, result) {
    const nome = item.nome || '';
    const fase = item.fase || '';

    // Produto Principal
    if (fase === 'Produto Principal') {
        const p = result.produto || {};
        const tipo = (p.imagens && p.imagens > 0) ? 'ebook_imagens' : 'ebook_simples';
        return {
            tipo,
            nome: p.nome || nome,
            descricao: p.subtitulo || '',
            modulos: p.modulos || [],
            topicos: [],
            paginas: p.paginas || 80,
            publicoAlvo: p.publicoAlvo || 'cristãos em busca de crescimento espiritual',
            ferramenta: item.ferramenta || 'Claude',
        };
    }

    // Bônus
    if (fase === 'Bônus') {
        const bonus = (result.bonus || []).find(b =>
            b.nome?.toLowerCase().includes(nome.toLowerCase()) ||
            nome.toLowerCase().includes(b.nome?.toLowerCase())
        ) || {};
        return {
            tipo: bonus.tipo || 'ebook_simples',
            nome: bonus.nome || nome,
            descricao: bonus.descricao || '',
            modulos: [],
            topicos: [],
            paginas: bonus.paginasEstimadas || 30,
            publicoAlvo: result.produto?.publicoAlvo || 'cristãos em busca de crescimento espiritual',
            ferramenta: bonus.ferramenta || item.ferramenta || 'Claude',
        };
    }

    // Order Bumps
    if (fase === 'Order Bumps') {
        const ob = (result.orderBumps || []).find(o =>
            o.nome?.toLowerCase().includes(nome.toLowerCase()) ||
            nome.toLowerCase().includes(o.nome?.toLowerCase())
        ) || {};
        return {
            tipo: ob.tipo || 'ebook_simples',
            nome: ob.nome || nome,
            descricao: ob.descricao || '',
            modulos: [],
            topicos: [],
            paginas: 30,
            publicoAlvo: result.produto?.publicoAlvo || 'cristãos em busca de crescimento espiritual',
            ferramenta: ob.ferramenta || item.ferramenta || 'Claude',
        };
    }

    // Fallback genérico
    return {
        tipo: 'ebook_simples',
        nome,
        descricao: item.descricao || '',
        modulos: [],
        topicos: [],
        paginas: 40,
        publicoAlvo: result.produto?.publicoAlvo || 'cristãos em busca de crescimento espiritual',
        ferramenta: item.ferramenta || 'Claude',
    };
}

/**
 * Formata os módulos para o prompt.
 */
function formatModules(modulos) {
    if (!modulos || modulos.length === 0) return '';
    return modulos.map(m => {
        const topicos = m.topicos?.length
            ? m.topicos.map(t => `    - ${t}`).join('\n')
            : '';
        return `  Módulo ${m.numero ?? ''} — ${m.nome}${topicos ? '\n' + topicos : ''}`;
    }).join('\n');
}

/**
 * Gera o system prompt para Claude (mesmo para ambos os modelos).
 */
function buildSystemPrompt(ctx) {
    return `Você é um especialista em criação de infoprodutos bíblicos digitais de alta qualidade para o mercado brasileiro.

Seu trabalho é escrever o conteúdo COMPLETO de um ebook com profundidade, riqueza e qualidade editorial.

REGRAS ABSOLUTAS:
- Escreva TODO o conteúdo em português brasileiro (pt-BR) acessível e envolvente
- Cite apenas versículos REAIS da Bíblia — nunca invente citações
- Formato das citações bíblicas: "Texto do versículo" (Livro Capítulo:Versículo)
- Mantenha um tom ${ctx.tipo === 'ebook_imagens' ? 'visual, cinematográfico e devocional' : 'acolhedor, devocional e prático'}
- Profundidade: cada tópico deve ter pelo menos 3-4 parágrafos de conteúdo real
- NÃO use placeholders como "[Conteúdo aqui]" ou "[Desenvolver]" — escreva o conteúdo real
- Público-alvo: ${ctx.publicoAlvo}`;
}

/**
 * Gera o user prompt — Modelo A (ebook_simples).
 */
function buildPromptModeloA(ctx) {
    const modulosText = formatModules(ctx.modulos);

    return `Crie o conteúdo COMPLETO do ebook "${ctx.nome}"${ctx.descricao ? ` — ${ctx.descricao}` : ''}.

ESTRUTURA OBRIGATÓRIA:
# ${ctx.nome}
${ctx.descricao ? `*${ctx.descricao}*\n` : ''}

${modulosText ? `MÓDULOS A COBRIR:\n${modulosText}\n\nSiga EXATAMENTE essa estrutura de módulos.` : `Crie uma estrutura com introdução, desenvolvimento em 4-6 capítulos temáticos e conclusão prática.`}

FORMATAÇÃO:
- Use # para o título principal
- Use ## para seções/módulos
- Use ### para subtópicos
- Use > para citações bíblicas (formato blockquote)
- Use **negrito** para termos importantes
- Use - para listas de pontos práticos

VOLUME MÍNIMO: ~${ctx.paginas} páginas equivalentes (aproximadamente ${ctx.paginas * 250} palavras)

Escreva o ebook completo agora. NÃO resuma — escreva todo o conteúdo real de cada seção.`;
}

/**
 * Gera o user prompt — Modelo B (ebook_imagens).
 * Igual ao A com instrução adicional de blocos [IMAGEM].
 */
function buildPromptModeloB(ctx) {
    const basePrompt = buildPromptModeloA(ctx);

    return `${basePrompt}

IMAGENS:
A cada 2-3 seções, insira um bloco de imagem no seguinte formato EXATO:

[IMAGEM]
prompt: [descrição visual em inglês, cinematográfica e bíblica]
style: photorealistic, warm golden tones, cinematic lighting, biblical scene
aspect: 16:9
[/IMAGEM]

REGRAS DOS BLOCOS [IMAGEM]:
- O prompt deve ser em INGLÊS
- Descreva cenas visuais concretas, não abstratas
- Use luz dourada, tons quentes, cenários bíblicos evocativos
- Mínimo de 4 blocos de imagem no documento inteiro
- Posicione as imagens em pontos de transição entre seções importantes`;
}

/**
 * Gera o par { systemPrompt, userPrompt } para o item e resultado dados.
 *
 * @param {Object} item - Item do planoProducao { nome, fase, ferramenta, ... }
 * @param {Object} result - Resultado do estruturadorService
 * @returns {{ systemPrompt: string, userPrompt: string, ctx: Object }}
 */
export function generatePrompt(item, result) {
    const ctx = resolveItemContext(item, result);

    const systemPrompt = buildSystemPrompt(ctx);
    const userPrompt = ctx.tipo === 'ebook_imagens'
        ? buildPromptModeloB(ctx)
        : buildPromptModeloA(ctx);

    return { systemPrompt, userPrompt, ctx };
}

/**
 * Retorna o tipo inferido de um item do plano de produção.
 * Útil para determinar se o botão "Criar" deve estar habilitado.
 *
 * @param {Object} item - Item do planoProducao
 * @param {Object} result - Resultado do estruturadorService
 * @returns {string} tipo ('ebook_simples', 'ebook_imagens', etc.)
 */
export function inferItemTipo(item, result) {
    const ctx = resolveItemContext(item, result);
    return ctx.tipo;
}
