/**
 * promptGeneratorService.js
 *
 * Gera o prompt completo para Claude baseado no tipo do entregável.
 *
 * Tipos de item suportados:
 *   { _type: 'module' }  — módulo específico do produto principal
 *   { _type: 'bonus'  }  — bônus ou order bump completo
 */

const BODY_FONT = 'DM Sans';

// ─── System prompt base ────────────────────────────────────────────────────────
function buildSystemPrompt(publico, isImagens) {
    return `Você é um especialista em criação de infoprodutos bíblicos digitais de alta qualidade para o mercado brasileiro.

Seu trabalho é escrever o conteúdo COMPLETO com profundidade, riqueza e qualidade editorial.

REGRAS ABSOLUTAS:
- Escreva TODO o conteúdo em português brasileiro (pt-BR) acessível e envolvente
- Cite apenas versículos REAIS da Bíblia — nunca invente citações
- Formato das citações: "Texto do versículo" (Livro Capítulo:Versículo)
- Tom: ${isImagens ? 'visual, cinematográfico e devocional' : 'acolhedor, devocional e prático'}
- Cada tópico deve ter no mínimo 3-4 parágrafos de conteúdo real
- NÃO use placeholders como "[Conteúdo aqui]" ou "[Desenvolver]" — escreva o conteúdo real
- Público-alvo: ${publico || 'cristãos em busca de crescimento espiritual'}`;
}

// ─── Bloco de instrução de imagens ────────────────────────────────────────────
const IMAGE_INSTRUCTION = `

IMAGENS:
Insira blocos [IMAGEM]...[/IMAGEM] a cada 2-3 seções para ilustrar visualmente o tema.

Formato EXATO obrigatório:
[IMAGEM]
prompt: [descrição visual em inglês, cinematográfica e bíblica]
style: photorealistic, warm golden tones, cinematic lighting, biblical scene
aspect: 16:9
[/IMAGEM]

Regras:
- Prompt SEMPRE em inglês
- Cenas concretas e evocativas (não abstratas)
- Mínimo de 3 blocos no documento inteiro
- Posicione nas transições entre tópicos importantes`;

// ─── Formatação de tópicos ─────────────────────────────────────────────────────
function formatTopicos(topicos) {
    if (!topicos || topicos.length === 0) return '';
    return topicos.map(t => `- ${t}`).join('\n');
}

// ─── Gerador para MÓDULO específico ───────────────────────────────────────────
function generateModulePrompt(item, result) {
    const produto    = result.produto || {};
    const isImagens  = item.tipo === 'ebook_imagens';
    const topicosStr = formatTopicos(item.topicos);
    const paginas    = item.paginas || 20;
    const palavras   = paginas * 250;

    const systemPrompt = buildSystemPrompt(item.publicoAlvo || produto.publicoAlvo, isImagens);

    const userPrompt = `Crie o conteúdo COMPLETO do Módulo ${item.numero} — "${item.nome}" do ebook "${item.productNome || produto.nome}".

${topicosStr ? `TÓPICOS OBRIGATÓRIOS A COBRIR:\n${topicosStr}\n\nCubra TODOS os tópicos acima com profundidade.` : 'Crie subtópicos relevantes e desenvolva-os com profundidade.'}

FORMATAÇÃO OBRIGATÓRIA:
# Módulo ${item.numero} — ${item.nome}

## [Subtítulo introdutório evocativo]

[Parágrafo de introdução do módulo — contexto histórico/bíblico, por que este tema importa...]

### [Primeiro tópico]

[3-4 parágrafos de conteúdo real e profundo...]

> "Versículo bíblico relevante" (Livro X:Y)

[Desenvolvimento após o versículo...]

### [Segundo tópico]
[...]

## Aplicação Prática

[Como aplicar este conhecimento no dia a dia da fé...]

## Reflexão Final

[Encerramento reflexivo do módulo com oração ou chamado à ação...]

VOLUME MÍNIMO: ~${paginas} páginas (~${palavras} palavras)

Escreva o módulo completo agora. NÃO resuma — escreva todo o conteúdo real de cada tópico.${isImagens ? IMAGE_INSTRUCTION : ''}`;

    return {
        systemPrompt,
        userPrompt,
        ctx: {
            tipo: item.tipo,
            nome: `Módulo ${item.numero} — ${item.nome}`,
            productNome: item.productNome || produto.nome,
            paginas,
        },
    };
}

// ─── Gerador para BÔNUS / ORDER BUMP ─────────────────────────────────────────
function generateBonusPrompt(item, result) {
    const produto   = result.produto || {};
    const isImagens = item.tipo === 'ebook_imagens';
    const paginas   = item.paginas || 30;
    const palavras  = paginas * 250;

    const systemPrompt = buildSystemPrompt(item.publicoAlvo || produto.publicoAlvo, isImagens);

    const userPrompt = `Crie o conteúdo COMPLETO de "${item.nome}"${item.descricao ? ` — ${item.descricao}` : ''}.

ESTRUTURA SUGERIDA (adapte ao tema):
# ${item.nome}

## Introdução

[Por que este conteúdo é valioso, o que o leitor vai aprender...]

## [Capítulo/Seção 1]

[Conteúdo com profundidade, versículos reais, aplicações práticas...]

> "Versículo" (Livro X:Y)

## [Capítulo/Seção 2]
[...]

## Conclusão e Próximos Passos

[Encerramento motivacional com chamado à ação...]

VOLUME MÍNIMO: ~${paginas} páginas (~${palavras} palavras)

Escreva o conteúdo completo agora. NÃO resuma — escreva tudo de verdade.${isImagens ? IMAGE_INSTRUCTION : ''}`;

    return {
        systemPrompt,
        userPrompt,
        ctx: {
            tipo: item.tipo,
            nome: item.nome,
            productNome: produto.nome,
            paginas,
        },
    };
}

// ─── Export principal ──────────────────────────────────────────────────────────
/**
 * Gera o par { systemPrompt, userPrompt, ctx } para o item dado.
 *
 * @param {Object} item  — item com _type: 'module' | 'bonus'
 * @param {Object} result — resultado do estruturadorService
 * @returns {{ systemPrompt, userPrompt, ctx }}
 */
export function generatePrompt(item, result) {
    if (item._type === 'module') {
        return generateModulePrompt(item, result);
    }
    // 'bonus' | 'orderBump' | fallback
    return generateBonusPrompt(item, result);
}
