const CLAUDE_API_KEY = import.meta.env.VITE_CLAUDE_API_KEY;
const CLAUDE_MODEL = 'claude-opus-4-6-20250715';

async function callClaude(systemPrompt, userPrompt) {
    const response = await fetch('/api/claude/v1/messages', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'x-api-key': CLAUDE_API_KEY,
            'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
            model: CLAUDE_MODEL,
            max_tokens: 8192,
            system: systemPrompt,
            messages: [{ role: 'user', content: userPrompt }]
        })
    });

    if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        console.error('[Claude] API Error:', err);
        throw new Error(err.error?.message || `Erro na API Claude: ${response.status}`);
    }

    const data = await response.json();
    const text = data.content?.[0]?.text;
    if (!text) throw new Error('Resposta vazia do Claude');
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

