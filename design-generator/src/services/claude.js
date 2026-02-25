const OPENROUTER_API_KEY = import.meta.env.VITE_OPENROUTER_API_KEY || import.meta.env.VITE_CLAUDE_API_KEY;
const DEFAULT_MODEL = 'anthropic/claude-sonnet-4.6';

export const LLM_MODELS = [
    { id: 'anthropic/claude-sonnet-4.6', name: 'Claude Sonnet 4.6', icon: '🟣' },
    { id: 'x-ai/grok-4-fast', name: 'Grok 4.1 Fast', icon: '⚡' },
    { id: 'deepseek/deepseek-r1', name: 'DeepSeek 3.2', icon: '🔵' },
    { id: 'openai/gpt-oss-120b', name: 'GPT-oss-120b', icon: '🟢' }
];

export async function callClaude(systemPrompt, userPrompt, model = DEFAULT_MODEL) {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
            'HTTP-Referer': 'http://localhost:3000',
            'X-Title': 'Brugger CO Toolbox'
        },
        body: JSON.stringify({
            model,
            max_tokens: 16384,
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt }
            ]
        })
    });

    if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        console.error(`[OpenRouter ${model}] API Error:`, err);
        throw new Error(err.error?.message || `Erro na API OpenRouter: ${response.status}`);
    }

    const data = await response.json();
    const text = data.choices?.[0]?.message?.content;
    if (!text) throw new Error(`Resposta vazia de ${model} via OpenRouter`);
    return text;
}

/**
 * Calls Claude (via OpenRouter) with text + images (multi-modal).
 * @param {string} systemPrompt - System instructions
 * @param {string} userPrompt - User text prompt
 * @param {{ mimeType: string, data: string }[]} images - Array of base64 images
 * @param {string} model - Model ID
 */
export async function callClaudeWithImages(systemPrompt, userPrompt, images = [], model = DEFAULT_MODEL) {
    const userContent = [
        { type: 'text', text: userPrompt }
    ];

    for (const img of images) {
        userContent.push({
            type: 'image_url',
            image_url: {
                url: `data:${img.mimeType};base64,${img.data}`
            }
        });
    }

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
            'HTTP-Referer': 'http://localhost:3000',
            'X-Title': 'Brugger CO Toolbox'
        },
        body: JSON.stringify({
            model,
            max_tokens: 16384,
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userContent }
            ]
        })
    });

    if (!response.ok) {
        let err;
        try {
            err = await response.json();
        } catch {
            err = { error: { message: `Status ${response.status}` } };
        }
        console.error(`[OpenRouter Vision ${model}] API Error:`, err);
        throw new Error(err.error?.message || `Erro na API OpenRouter Vision: ${response.status}`);
    }

    const data = await response.json();

    // OpenRouter can sometimes return 200 OK with an error object inside
    if (data.error) {
        console.error(`[OpenRouter Vision ${model}] Response Error:`, data.error);
        throw new Error(data.error.message || 'Erro desconhecido retornado pela API da OpenRouter');
    }

    const text = data.choices?.[0]?.message?.content;
    if (!text) {
        console.error('[OpenRouter Vision] Invalid response format:', data);
        throw new Error(`Resposta vazia ou formato inválido do modelo ${model}`);
    }
    return text;
}

export async function generateAgent(description) {
    const systemPrompt = `You are an expert AI Agent designer. You create comprehensive, well-structured agent definition files in Markdown format with YAML frontmatter.

Your output MUST follow this exact structure:
1. YAML frontmatter with: name, description, skills (comma-separated list)
2. A main heading with the agent name
3. Core Philosophy section
4. Detailed methodology/process sections
5. Tables for categorization when appropriate
6. Checklists for workflows
7. Anti-patterns section (what NOT to do)
8. When to use this agent section

Use the same high-quality format as these reference agents: orchestrator, debugger, frontend-specialist, backend-specialist.
The agent should be detailed, actionable, and follow best practices.
Write the entire content in English (standard for agent files), but the description can be bilingual if the user writes in Portuguese.`;

    return callClaude(systemPrompt,
        `Create a comprehensive AI agent definition file for the following agent idea:\n\n${description}\n\nGenerate the complete markdown file with YAML frontmatter. Make it detailed, professional, and actionable. Include tables, checklists, and examples where appropriate.`
    );
}

export async function generateSkill(description) {
    const systemPrompt = `You are an expert AI Skill designer. You create comprehensive, well-structured skill definition files (SKILL.md) in Markdown format with YAML frontmatter.

Your output MUST follow this exact structure:
1. YAML frontmatter with: name, description, allowed-tools (Read, Write, Edit, Glob, Grep, Bash), version (1.0)
2. A main heading with the skill name
3. Core Principles section (as a table)
4. Detailed sections covering best practices, patterns, and guidelines
5. Tables for rules and categorization
6. Anti-Patterns section (what NOT to do)
7. Verification/Checklist section
8. Code examples where appropriate

Reference existing skills like: clean-code, frontend-design, testing-patterns, api-patterns.
Skills teach PRINCIPLES and PATTERNS, not specific implementations. They are reusable knowledge modules.
Write the entire content in English (standard for skill files), but the description can be bilingual if the user writes in Portuguese.`;

    return callClaude(systemPrompt,
        `Create a comprehensive AI skill definition file (SKILL.md) for the following skill idea:\n\n${description}\n\nGenerate the complete markdown file with YAML frontmatter. Make it detailed, professional, and actionable. Include tables with rules, code examples, checklists, and anti-patterns.`
    );
}

export async function generateWorkflow(description) {
    const systemPrompt = `You are an expert AI Workflow designer. You create comprehensive, well-structured workflow definition files in Markdown format with YAML frontmatter.

Your output MUST follow this exact structure:
1. YAML frontmatter with: description (one-line summary of what the command does)
2. A main heading with /command-name format
3. $ARGUMENTS placeholder
4. Purpose section explaining what it does
5. Steps section with numbered workflow steps
6. Sub-commands section (if applicable)
7. Output Format section with example markdown output
8. Usage Examples section with code blocks
9. Key Principles section

Reference existing workflows like: /create, /deploy, /debug, /test, /orchestrate.
Workflows are SLASH COMMANDS that automate multi-step processes. They coordinate agents, run scripts, and produce structured output.
Write the entire content in English (standard for workflow files), but the description can be bilingual if the user writes in Portuguese.`;

    return callClaude(systemPrompt,
        `Create a comprehensive AI workflow definition file for the following workflow idea:\n\n${description}\n\nGenerate the complete markdown file with YAML frontmatter. Make it detailed, professional, and actionable. Include step-by-step instructions, usage examples, and output format templates.`
    );
}

export async function extractDesignSystem(input) {
    const systemPrompt = `You are an expert design system analyst. Your task is to analyze a website, app, or UI description/URL provided and extract a comprehensive design system with precision.

You MUST analyze and document each section below. If a value cannot be determined with certainty, estimate based on what is visible and mark with ~ (approximate).

Your output MUST be a well-structured markdown document with these sections:

1. IDENTIDADE VISUAL - Name/brand, personality keywords, general style
2. PALETA DE CORES - All hex/rgb values organized by function (primary, secondary, neutral, semantic, surfaces, text, borders) as CSS custom properties
3. TIPOGRAFIA - Font families, size scale, weights, line-heights, letter-spacing, and composed text styles table (H1-H4, Body, Label, Caption, etc.)
4. ESPAÇAMENTO - Spacing scale as CSS custom properties (multiples of 4 or 8)
5. BORDER RADIUS - From none to full as CSS custom properties
6. SOMBRAS - Shadow scale as CSS custom properties
7. BORDAS - Border widths and styles
8. GRID E LAYOUT - Columns, gutters, container max-width, breakpoints
9. COMPONENTES - Detailed specs for: Buttons (variants, sizes), Inputs, Cards, Badges/Tags, Navigation, and any other identified components
10. ICONOGRAFIA - Library identified, style, sizes, stroke width
11. IMAGENS E MÍDIA - Image style, aspect ratios, border radius, treatment
12. ANIMAÇÕES E TRANSIÇÕES - Durations, easings, entrance/hover/loading animations
13. TOKENS FINAIS - Complete :root {} block with ALL extracted tokens
14. OBSERVAÇÕES E PADRÕES ÚNICOS - Any unique design detail

Format everything with clear headings, tables, and CSS code blocks. Be extremely detailed and precise.`;

    return callClaude(systemPrompt,
        `Analyze the following and extract a complete, detailed design system:\n\n${input}\n\nProvide the full design system documentation in markdown with all CSS custom properties, component specifications, and design tokens. Be thorough and precise.`
    );
}

export async function generateLandingPageCopy(productDescription, copySystemRules, structureRules, perplexityResearch, model = DEFAULT_MODEL) {
    const systemPrompt = `You are an elite direct-response copywriter specialized in low-ticket digital products (biblical ebooks, R$9-29).
Your task: generate the COMPLETE copy for a high-converting Landing Page.

## CRITICAL RULE: YOU MUST GENERATE EXACTLY 20 SECTIONS
The Landing Page has EXACTLY 20 mandatory sections. You MUST return ALL 20. Skipping any section is a FAILURE.

Here are the 20 MANDATORY section IDs you must return, IN THIS EXACT ORDER:

| # | id | name | content keys (minimum) |
|---|-----|------|----------------------|
| 1 | s01-navbar | Navbar Fixa | productName, subtitle, ctaText |
| 2 | s02-hero | Hero | preHeadline, headline, highlightedWords[], subheadline, volumeBadge, deliveryLabel |
| 3 | s03-metrics | Estatísticas de Impacto | metrics[{number, label}] (min 3) |
| 4 | s04-benefits | Lista de Benefícios | ctaText, ctaPrice, bullets[{text}] (min 6) |
| 5 | s05-amostra | Amostra do Conteúdo | sectionLabel, title, images[{name, description}] (min 4) |
| 6 | s06-quote1 | Citação Bíblica #1 | quote, reference |
| 7 | s07-desafio | O Desafio | sectionLabel, title, problems[{number, title, description}] (3), closingParagraph |
| 8 | s08-showcase | Por Dentro do Material | sectionLabel, title, categories[{name}], differentials[{icon, title, description}] |
| 9 | s09-conteudo | Conteúdo Completo | sectionLabel, title, modules[{number, badge, title, topics[]}] (min 6) |
| 10 | s10-quote2 | Citação Bíblica #2 | quote, reference |
| 11 | s11-para-quem | Para Quem É | sectionLabel, title, profiles[{title, description}] OR comparisons{wrong[], right[]} |
| 12 | s12-depoimentos | Depoimentos | sectionLabel, title, testimonials[{text, name, location}] (exactly 4) |
| 13 | s13-resumo | Resumo do que Você Recebe | badges[{icon, text}] (6) |
| 14 | s14-bonus | Bônus Exclusivos | sectionLabel, title, subtitle, bonuses[{name, description, originalPrice, badge?}], totalValue, superBonus |
| 15 | s15-preco | Seção de Preço | anchors[{item, price}], badge, productName, subtitle, benefits[], priceOriginal, priceFinal, ctaText, trustBadges[] |
| 16 | s16-garantia | Garantia | days, description, closingLine |
| 17 | s17-quote3 | Citação Bíblica #3 | quote, reference |
| 18 | s18-faq | FAQ | questions[{question, answer}] (min 5) |
| 19 | s19-cta-final | CTA Final | headline, subtitle, priceOriginal, priceFinal, ctaText, trustBadges[] |
| 20 | s20-footer | Footer | productName, copyright, links[] |

## OUTPUT FORMAT (MANDATORY)
Return a JSON ARRAY with EXACTLY 20 objects. Each object:
{
  "id": "s01-navbar",
  "name": "01. Navbar Fixa",
  "content": { ...keys from table above... }
}

Do NOT wrap in markdown. Return RAW JSON array only.

## COPY RULES
- All content in Brazilian Portuguese (pt-BR)
- Biblical quotes must be real and relevant to the product theme
- Testimonials: use realistic Brazilian names+cities (São Paulo, BH, Curitiba, Recife)
- Pricing: use R$ currency. "De" price = 3-10x final price
- Bonuses: minimum 6 bonuses + "Atualizações Vitalícias" as last
- Benefits: concrete, quantifiable (never generic like "conteúdo de qualidade")
- FAQs: each answer must reinforce a benefit

---
COPY SYSTEM RULES:
${copySystemRules}

---
STRUCTURE RULES (FULL DETAIL):
${structureRules}

---
MARKET RESEARCH (PERPLEXITY):
${perplexityResearch || 'No research provided.'}

---
PRODUCT DESCRIPTION:
"${productDescription}"
`;

    return callClaude(systemPrompt,
        `Generate the COMPLETE 20-section landing page copy as a JSON array. ALL 20 sections are MANDATORY. Do not skip any.`,
        model
    );
}

