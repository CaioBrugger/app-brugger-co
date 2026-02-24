import designSystem from './data/design-system.md?raw';
import copySystem from './data/copy-system.md?raw';

export function buildGeneratePrompt(userInput, scope) {
  const scopeDesc = {
    section: 'uma SEÇÃO COMPLETA de landing page (hero, pricing, FAQ, testimonials, etc.)',
    component: 'um COMPONENTE ISOLADO (um card, um botão, um bloco de copy, etc.)',
    both: 'AMBOS: uma seção completa E também os componentes isolados que a compõem'
  };

  return `Você é um designer UI expert especializado em landing pages premium de infoprodutos bíblicos com tema "Dark Luxury Biblical" — escuro, premium, sofisticado.

## DESIGN SYSTEM COMPLETO (SIGA EXATAMENTE):
${designSystem}

## FRAMEWORK DE COPY (SIGA EXATAMENTE):
${copySystem}

## PEDIDO DO USUÁRIO:
"${userInput}"

## ESCOPO: ${scopeDesc[scope] || scopeDesc.section}

## TAREFA:
Gere EXATAMENTE 3 variações de design DIFERENTES. Cada variação deve:
1. Ser um arquivo HTML COMPLETO e auto-contido com CSS inline em <style> e JS inline em <script>
2. Seguir o design system EXATAMENTE (cores, fontes, espaçamentos, border-radius, sombras)
3. Aplicar os princípios do framework de copy para qualquer texto
4. Ser responsivo (mobile + desktop)
5. Incluir o import do Google Fonts (DM Serif Display + DM Sans) no <head>
6. Incluir animações suaves e efeitos hover
7. Cada variação deve ter um layout VISIVELMENTE DIFERENTE das outras
8. Usar o background escuro #0C0C0E e acentos dourados #C9A962
9. O HTML deve renderizar PERFEITAMENTE quando aberto sozinho em um browser

Retorne um JSON com esta estrutura EXATA:
{
  "variations": [
    {
      "title": "Nome descritivo da abordagem",
      "description": "O que torna esta variação única (1 frase)",
      "html": "<!DOCTYPE html>...arquivo HTML completo..."
    },
    { "title": "...", "description": "...", "html": "..." },
    { "title": "...", "description": "...", "html": "..." }
  ]
}

CRÍTICO: Retorne APENAS o JSON válido. As strings html devem conter HTML completo e funcional.`;
}

export function buildRefinePrompt(originalHtml, instructions) {
  return `Você é um designer UI expert. Aqui está o design HTML atual:

<HTML_ORIGINAL>
${originalHtml}
</HTML_ORIGINAL>

O usuário quer estas alterações:
"${instructions}"

Modifique o HTML implementando as alterações solicitadas. Mantenha o design system (backgrounds escuros, acentos dourados, fontes DM Serif Display + DM Sans). O HTML deve continuar sendo um arquivo completo e auto-contido.

Retorne um JSON:
{
  "title": "Nome do design atualizado",
  "description": "O que foi alterado",
  "html": "<!DOCTYPE html>...HTML completo atualizado..."
}

CRÍTICO: Retorne APENAS o JSON válido.`;
}

export function buildImagePrompt(designTitle, designDescription, userInput) {
  return `Gere uma imagem premium e cinematográfica para uma landing page de infoproduto bíblico com tema "Dark Luxury Biblical".

Contexto do design: "${designTitle}" — ${designDescription}
Ideia do usuário: "${userInput}"

Estilo da imagem:
- Cinematográfica, dramática, com iluminação volumétrica
- Tons quentes: dourado, âmbar, marrom profundo
- Fundo escuro (#0C0C0E) ou gradiente escuro
- Estilo épico/bíblico, como uma pintura renascentista moderna
- Alta qualidade, resolução profissional
- SEM texto na imagem
- Estilo de arte digital premium, como concept art de filmes
- A imagem deve evocar espiritualidade, autoridade e profundidade

Gere a imagem ideal para ser usada como visual principal desta seção de landing page.`;
}

export function buildExtractThemePrompt(themeName, userSpecs, referenceUrls, siteData) {
  let contextBlock = '';

  if (siteData?.success && siteData.css) {
    contextBlock = `
## CÓDIGO CSS REAL EXTRAÍDO DA PÁGINA (FONTE DE VERDADE — USE ESTES VALORES EXATOS):

### Google Fonts encontradas:
${siteData.fontLinks?.join('\n') || 'Nenhuma'}
${siteData.fontImports?.join('\n') || ''}

### Headings encontrados na página:
${siteData.headings?.join('\n') || 'Nenhum'}

### CSS completo da página (ANALISE CADA PROPRIEDADE):
\`\`\`css
${siteData.css}
\`\`\`

### HTML da página (primeiros 5000 chars para contexto):
\`\`\`html
${siteData.htmlSnippet}
\`\`\`
`;
  }

  return `Você é um ENGENHEIRO DE DESIGN SYSTEMS com 20 anos de experiência. Sua precisão é CIRÚRGICA — você extrai valores EXATOS, não aproximados.

TAREFA CRÍTICA: Analisar as referências visuais + código CSS fornecido e criar um Design System IDÊNTICO ao original. CADA COR, CADA FONTE, CADA ESPAÇAMENTO DEVE SER EXATO.

NOME DO TEMA: "${themeName}"
${userSpecs ? `ESPECIFICAÇÕES DO USUÁRIO: "${userSpecs}"` : ''}
${referenceUrls ? `URLS DE REFERÊNCIA: ${referenceUrls}` : ''}
${contextBlock}

## INSTRUÇÕES DE PRECISÃO:

### CORES — REGRAS ABSOLUTAS:
- Se o CSS real foi fornecido acima, EXTRAIA os hex/rgb/hsl EXATOS do código. NÃO INVENTE.
- Procure pelas propriedades: background, background-color, color, border-color, box-shadow, gradient
- Identifique TODAS as cores usadas e categorize por função (bg, text, accent, surface, border)
- Para cores em rgb(), converta para hex. Para hsl(), converta para hex.

### TIPOGRAFIA — REGRAS ABSOLUTAS:
- Se há Google Fonts links, extraia os nomes exatos das fontes
- Se há font-family no CSS, copie EXATAMENTE como declarado
- Identifique a escala tipográfica (font-size) usada no CSS real
- Identifique os font-weight usados

### ESPAÇAMENTO — REGRAS ABSOLUTAS:
- Analise padding e margin no CSS para deduzir a escala de espaçamento
- Identifique padrões (múltiplos de 4px, 8px, etc.)

### BORDAS E SOMBRAS:
- Extraia border-radius EXATOS do CSS
- Extraia box-shadow EXATOS do CSS

Retorne um JSON com esta estrutura EXATA:

{
  "name": "${themeName}",
  "description": "Descrição precisa do estilo visual em 1-2 frases",
  "personality": ["keyword1", "keyword2", "keyword3", "keyword4"],
  "colors": {
    "background": "#hex_exato",
    "surface": "#hex_exato",
    "surface2": "#hex_exato",
    "surface3": "#hex_exato",
    "border": "#hex_exato",
    "borderLight": "#hex_exato",
    "text": "#hex_exato",
    "textSecondary": "#hex_exato",
    "textMuted": "#hex_exato",
    "accent": "#hex_exato",
    "accentLight": "#hex_exato",
    "accentDark": "#hex_exato",
    "success": "#hex_exato",
    "error": "#hex_exato",
    "info": "#hex_exato"
  },
  "typography": {
    "fontHeading": "Font Name exata",
    "fontBody": "Font Name exata",
    "fontMono": "Font Name ou null",
    "googleFontsImport": "@import url exata",
    "scale": { "xs": "12px", "sm": "14px", "base": "16px", "lg": "18px", "xl": "20px", "2xl": "24px", "3xl": "30px", "4xl": "36px", "5xl": "48px" },
    "weights": { "light": 300, "regular": 400, "medium": 500, "semibold": 600, "bold": 700 }
  },
  "spacing": { "xs": "4px", "sm": "8px", "md": "16px", "lg": "24px", "xl": "32px", "2xl": "48px", "3xl": "64px" },
  "radius": { "none": "0", "sm": "valor_exato", "md": "valor_exato", "lg": "valor_exato", "xl": "valor_exato", "full": "9999px" },
  "shadows": { "sm": "valor_exato", "md": "valor_exato", "lg": "valor_exato", "xl": "valor_exato" },
  "components": {
    "buttonPrimary": { "background": "#hex", "color": "#hex", "borderRadius": "valor", "padding": "valor", "fontSize": "valor", "fontWeight": "valor", "hoverBackground": "#hex" },
    "buttonSecondary": { "background": "#hex", "color": "#hex", "border": "valor", "borderRadius": "valor", "padding": "valor" },
    "card": { "background": "#hex", "border": "valor", "borderRadius": "valor", "padding": "valor", "shadow": "valor" },
    "input": { "background": "#hex", "border": "valor", "borderRadius": "valor", "padding": "valor", "focusBorder": "#hex" }
  },
  "cssVariables": ":root { /* TODAS as variáveis CSS organizadas */ }"
}

REGRAS FINAIS:
- Cores DEVEM ser hex extraídos do CSS real (se disponível), NÃO inventados
- Fontes DEVEM ser as mesmas do site original
- O cssVariables deve ser um bloco :root {} COMPLETO e FUNCIONAL
- Se um valor não pode ser determinado com certeza, sinalize com comentário /* ~estimado */
- Retorne APENAS o JSON válido, sem markdown wrapping`;
}

export function buildThemePreviewPrompt(tokens) {
  return `Você é um designer UI SÊNIOR. Crie uma LANDING PAGE DE DEMONSTRAÇÃO que represente FIELMENTE este Design System.

TOKENS DO DESIGN SYSTEM:
${JSON.stringify(tokens, null, 2)}

CRIE UMA PÁGINA HTML COMPLETA que demonstre o tema com estas seções:

1. **HERO SECTION**: Um hero impactante usando as cores de background, accent e tipografia do tema. Título grande com a fonte heading, subtítulo com fonte body.

2. **FEATURE CARDS**: 3 cards lado a lado mostrando as cores de surface, border, radius e shadow do tema. Cada card com ícone, título e texto.

3. **CTA SECTION**: Uma seção com botão primary e botão secondary, demonstrando exatamente os estilos de componente definidos nos tokens.

4. **FOOTER**: Seção com background surface e texto secondary.

REGRAS OBRIGATÓRIAS:
- Use EXATAMENTE os tokens fornecidos (cores hex, fontes, radius, shadows — sem alterar)
- O Google Fonts import DEVE estar no <head>
- CSS em <style> block, sem external dependencies
- O background PRINCIPAL deve ser a cor "background" do tema
- O accent/primary deve ser a cor "accent"
- Use a fonte "fontHeading" para títulos e "fontBody" para corpo
- Border-radius nos cards e botões devem ser os valores EXATOS dos tokens
- A página deve parecer PROFISSIONAL e PREMIUM, não genérica
- Inclua transições hover nos botões e cards
- Responsivo (mobile + desktop)
- Mínimo 100vh de altura

Retorne um JSON:
{
  "html": "<!DOCTYPE html>...HTML completo e auto-contido..."
}

CRÍTICO: O HTML deve ser BONITO e FIEL aos tokens. Retorne APENAS o JSON válido.`;
}

export function buildModularLandingPagePrompt(copySectionsJson, designSystemTokens, frontendSpecialistRules) {
  return `Você é um Arquiteto Frontend Sênior e um Designer de UI Expert.
Seu objetivo é gerar o código HTML e CSS para uma Landing Page completa, modular e de alta conversão.

Você receberá duas coisas:
1. O CONTEÚDO (Copy) estruturado em um array JSON de seções (cada seção pode ter "suggestedImages" com URLs/placeholders).
2. O DESIGN SYSTEM (Tokens) que definem a identidade visual da página.

VOCÊ DEVE:
Gerar um array JSON onde cada elemento representa uma <section> ou <header>/<footer> isolado.
Cada elemento deve conter o HTML completo para aquela seção com CSS embutido em <style> blocks.

## REGRAS DE DESIGN (OBRIGATÓRIAS):
1. Visual "Dark Luxury Biblical": fundo super escuro, textos claros, acentos dourados
2. NUNCA use roxo, violeta ou magenta (Purple Ban)
3. Geometria inovadora: sharp edges, brutalismo sutil, não genericamente arredondado
4. Não use glassmorphism barato. Use cores sólidas, texturas grain, sobreposições profundas
5. Mobile-First responsivo
6. Na PRIMEIRA seção, importe as fontes do Google Fonts no <style>

## REGRAS DE IMAGENS (OBRIGATÓRIO):
- Quando uma seção tiver "suggestedImages" no JSON da copy, você DEVE usar esses valores como src em tags <img>
- Formato: <img src="IMAGE_PLACEHOLDER_s02-hero" alt="..." style="width:100%; max-width:600px; border-radius:12px; object-fit:cover;">
- SEMPRE coloque max-width, border-radius e object-fit nas imagens
- NÃO invente URLs de imagem. Use SOMENTE as suggestedImages fornecidas

## REGRAS DE ANIMAÇÕES (OBRIGATÓRIO):
Adicione estas classes CSS nos elementos para animações de scroll:
- .lp-animate → elementos que devem fazer fade-in ao scroll
- .lp-animate-delay-1, .lp-animate-delay-2, .lp-animate-delay-3 → delays progressivos
- .lp-fade-left → entrada da esquerda
- .lp-fade-right → entrada da direita
- .lp-card-glow → glow dourado no hover em cards
- .lp-cta-shimmer → shimmer dourado nos botões CTA
- .lp-pulse → pulsação sutil (badges, dots)

Exemplos de uso:
<h2 class="lp-animate">Título</h2>
<div class="lp-animate lp-animate-delay-1">Card 1</div>
<button class="lp-cta-shimmer">Adquirir Agora</button>

## REGRAS DE QUALIDADE HTML:
- Todas as tags DEVEM estar fechadas corretamente
- max-width: 1200px e margin: 0 auto nos containers internos
- Padding vertical mínimo: 4rem (64px) em cada seção
- Todos os botões devem ter hover effects (transform, opacity, box-shadow)
- Todos os cards devem ter transição suave no hover
- Imagens com max-width: 100% e height: auto

TOKENS DO DESIGN SYSTEM:
${JSON.stringify(designSystemTokens, null, 2)}

FRONTEND SPECIALIST RULES:
${frontendSpecialistRules}

CONTEÚDO (COPY):
${JSON.stringify(copySectionsJson, null, 2)}

FORMATO DE SAÍDA (JSON puro, sem markdown):
[
  {
    "id": "s01-navbar",
    "name": "01. Navbar Fixa",
    "html": "<header id='s01-navbar'>... HTML completo com <style> ...</header>"
  },
  {
    "id": "s02-hero",
    "name": "02. Hero",
    "html": "<section id='s02-hero'>... HTML com classes lp-animate e imagens ...</section>"
  }
]

CRÍTICO: HTML bonito, limpo, responsivo. Use EXATAMENTE os tokens do Design System. Use as classes de animação. Use as suggestedImages.`;
}

export function buildRegenerateSectionPrompt(sectionId, sectionHtml, designSystemTokens, userInstructions) {
  return `Você é um Arquiteto Frontend Sênior. Sua tarefa é alterar o código de uma sessão isolada de uma Landing Page com base em um pedido do usuário.

Id da Seção: ${sectionId}
HTML ATUAL DA SEÇÃO:
<HTML_ORIGINAL>
${sectionHtml}
</HTML_ORIGINAL>

TOKENS DO DESIGN SYSTEM:
${JSON.stringify(designSystemTokens, null, 2)}

O usuário quer estas alterações:
"${userInstructions}"

Modifique o HTML implementando as alterações solicitadas. O tema DEVE continuar seguindo as regras de "Dark Luxury Biblical" (fundo escuro, títulos Serifados, acentos dourados) a menos que o pedido diga o contrário. 
Mantenha o HTML limpo, responsivo e modular.

Retorne APENAS um objeto JSON válido (sem \`\`\`json wraps):
{
  "id": "${sectionId}",
  "html": "<section id='${sectionId}'>... novo código da seção ...</section>"
}`;
}
