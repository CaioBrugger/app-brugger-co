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
  return buildContextualImagePrompt(designTitle, designDescription, userInput, null, null);
}

/**
 * Builds a contextual image prompt based on the LP section type and its copy data.
 * Each section gets a prompt crafted for its specific role in the page.
 */
export function buildContextualImagePrompt(sectionName, productDescription, userInput, sectionId, sectionContent) {
  const id = (sectionId || sectionName || '').toLowerCase();
  const content = sectionContent || {};
  const productTheme = productDescription || userInput || '';

  // Extract useful content data for context
  const headline = content.headline || content.title || '';
  const subheadline = content.subheadline || content.subtitle || '';
  const images = content.images || content.categories || [];
  const modules = content.modules || [];
  const problems = content.problems || [];
  const bonuses = content.bonuses || [];

  const STYLE_BASE = `
ESTILO OBRIGATÓRIO:
- Fundo escuro (#0C0C0E ou gradiente para #1a1a2e)
- Tons quentes: dourado (#C9A962), âmbar, marrom profundo
- Iluminação volumétrica e cinematográfica
- SEM TEXTO na imagem (nenhuma letra, número ou palavra)
- Arte digital premium, resolução profissional
- Estética "Dark Luxury Biblical" — elegância e profundidade espiritual`;

  // ── HERO SECTION ──
  if (id.includes('hero')) {
    const coreSubject = extractCoreSubject(productTheme);
    return `Gere uma imagem HERO épica de tela cheia para a seção principal de uma landing page sobre "${coreSubject}".

O QUE MOSTRAR: Uma composição dramática e cinematic que represente visualmente o tema "${coreSubject}". ${headline ? `A imagem deve evocar o conceito: "${headline}".` : ''}
- Perspectiva ampla, grandiosa, como um pôster de filme épico
- O tema central "${coreSubject}" deve ser o foco visual absoluto
- Profundidade atmosférica: luz dourada cortando através de escuridão
- Composição que deixe espaço do lado esquerdo para texto sobreposto
${STYLE_BASE}

IMPORTANTE: A imagem é o visual CENTRAL da página — deve causar impacto imediato e comunicar "isto é premium e autoritativo".`;
  }

  // ── AMOSTRA / SAMPLE SECTION ──
  if (id.includes('amostra') || id.includes('sample')) {
    const imageDescriptions = images.map(img => img.name || img.description || '').filter(Boolean).slice(0, 4);
    const imageContext = imageDescriptions.length > 0
      ? `Os exemplos incluem: ${imageDescriptions.join(', ')}.`
      : `Páginas de um material premium sobre "${extractCoreSubject(productTheme)}".`;

    return `Gere uma imagem mostrando uma PRÉVIA VISUAL do conteúdo de um ebook/guia premium sobre "${extractCoreSubject(productTheme)}".

O QUE MOSTRAR: Um spread editorial elegante, como se fosse uma foto de páginas abertas do material. ${imageContext}
- Mostre 2-3 páginas/spreads flutuando em perspectiva isométrica
- As páginas devem ter ilustrações ricas e coloridas visíveis (não texto)
- Efeito de profundidade: páginas em diferentes planos focais
- Sombras suaves sob as páginas, como se flutuassem
${STYLE_BASE}

IMPORTANTE: O objetivo é provar visualmente a QUALIDADE do conteúdo — o visitante deve pensar "quero ver mais".`;
  }

  // ── SHOWCASE / POR DENTRO DO MATERIAL ──
  if (id.includes('showcase') || id.includes('dentro')) {
    const categoryNames = (content.categories || content.differentials || [])
      .map(c => c.name || c.title || '').filter(Boolean).slice(0, 5);
    const categoryContext = categoryNames.length > 0
      ? `Tipos de conteúdo: ${categoryNames.join(', ')}.`
      : '';

    return `Gere uma imagem mostrando a VARIEDADE DE CONTEÚDO de um material premium sobre "${extractCoreSubject(productTheme)}".

O QUE MOSTRAR: Uma composição tipo mood board ou grid editorial mostrando diferentes tipos de conteúdo do material. ${categoryContext}
- Layout tipo collage com 4-5 quadros/thumbnails de diferentes estilos de conteúdo
- Cada quadro mostra um tipo diferente (mapas, ilustrações, fotos, diagramas, infográficos)
- Os quadros flutuam com sombras, como cartas espalhadas sobre uma mesa escura
- Variedade visual: misture estilos (pintura, foto, esquema, mapa)
${STYLE_BASE}

IMPORTANTE: A imagem deve comunicar AMPLITUDE e PROFUNDIDADE — "este material cobre tudo".`;
  }

  // ── DESAFIO / PROBLEM SECTION ──
  if (id.includes('desafio') || id.includes('problem') || id.includes('challenge')) {
    const problemTitles = problems.map(p => p.title || '').filter(Boolean).slice(0, 3);
    const problemContext = problemTitles.length > 0
      ? `Os problemas abordados são: ${problemTitles.join('; ')}.`
      : `O desafio de compreender verdadeiramente "${extractCoreSubject(productTheme)}".`;

    return `Gere uma imagem que represente VISUALMENTE o desafio/problema que o público enfrenta ao estudar "${extractCoreSubject(productTheme)}".

O QUE MOSTRAR: Uma cena metafórica de BUSCA por conhecimento ou DIFICULDADE em compreender algo profundo. ${problemContext}
- Uma pessoa (silhueta escura) diante de algo vasto e misterioso que não consegue alcançar
- Contraste entre escuridão (ignorância) e luz distante (conhecimento)
- Atmosfera de mistério e magnitude — o tema é maior do que parece
- Mood contemplativo, não negativo — é uma lacuna que pode ser preenchida
${STYLE_BASE}

IMPORTANTE: A imagem deve fazer o visitante se IDENTIFICAR — "eu também sinto que me falta algo".`;
  }

  // ── CONTEÚDO COMPLETO / MODULES SECTION ──
  if (id.includes('conteudo') || id.includes('conteúdo') || id.includes('modules') || id.includes('content')) {
    const moduleNames = modules.map(m => m.title || '').filter(Boolean).slice(0, 6);
    const moduleContext = moduleNames.length > 0
      ? `Os módulos incluem: ${moduleNames.join(', ')}.`
      : '';

    return `Gere uma imagem representando a ESTRUTURA COMPLETA de um material didático premium sobre "${extractCoreSubject(productTheme)}".

O QUE MOSTRAR: Uma composição que represente organização e profundidade — como um mapa de conhecimento ou estante de sabedoria. ${moduleContext}
- Visualize como um "mapa do tesouro do conhecimento": caminhos que se ramificam
- Ou como uma estante dourada com volumes organizados, emanando luz
- Ou como um manuscrito aberto revelando camadas de conteúdo
- Sensação de jornada: há um início, desenvolvimento e ápice
${STYLE_BASE}

IMPORTANTE: A imagem deve comunicar COMPLETUDE — "tudo que você precisa está aqui, organizado".`;
  }

  // ── BÔNUS SECTION ──
  if (id.includes('bonus') || id.includes('bônus')) {
    const bonusNames = bonuses.map(b => b.name || '').filter(Boolean).slice(0, 3);
    const bonusContext = bonusNames.length > 0
      ? `Os bônus incluem: ${bonusNames.join(', ')}.`
      : '';

    return `Gere uma imagem representando BÔNUS EXCLUSIVOS de um pacote premium sobre "${extractCoreSubject(productTheme)}".

O QUE MOSTRAR: Uma composição de "presente aberto" revelando materiais extras valiosos. ${bonusContext}
- Materiais extras (ebooks, guias, cartões) emergindo de uma caixa de presente dourada
- Efeito de revelação: luz emanando do interior da caixa/pacote
- Os itens flutuam com brilho individual, como tesouros descobertos
- Sensação de abundância e generosidade
${STYLE_BASE}

IMPORTANTE: A imagem deve comunicar VALOR EXTRA — "você está recebendo muito mais do que esperava".`;
  }

  // ── FALLBACK for unmatched sections ──
  return `Gere uma imagem premium e contextual para a seção "${sectionName}" de uma landing page sobre "${extractCoreSubject(productTheme)}".

O QUE MOSTRAR: Uma imagem que se conecte diretamente ao tema "${extractCoreSubject(productTheme)}" e ao propósito da seção "${sectionName}".
${headline ? `Conceito visual sugerido: "${headline}"` : ''}
- A imagem deve parecer que foi FEITA para esta seção, não genérica
- Deve comunicar o mesmo sentimento que o texto da seção transmite
${STYLE_BASE}

Gere a imagem mais adequada para esta seção específica.`;
}

/**
 * Extracts the core subject from a product description.
 * e.g. "Ebook sobre Geografia Bíblica com 280 imagens" → "Geografia Bíblica"
 */
function extractCoreSubject(description) {
  const cleaned = description
    .replace(/^(ebook|guia|material|curso|produto)\s*(sobre|de|do|da|dos|das)?\s*/i, '')
    .replace(/\s*(com|contendo|incluindo|—|–|-)\s*\d+.*$/i, '')
    .trim();
  return cleaned.length > 5 ? cleaned.substring(0, 80) : description.substring(0, 80);
}

export function buildExtractThemePrompt(themeName, userSpecs, referenceUrls, siteData) {
  let contextBlock = '';

  if (siteData?.success && siteData.css) {
    contextBlock = `
## CÓDIGO CSS REAL EXTRAÍDO DA PÁGINA (FONTE DE VERDADE — USE ESTES VALORES EXATOS):

### Google Fonts encontradas:
${siteData.fontLinks?.join('\n') || 'Nenhuma'}
${siteData.fontImports?.join('\n') || ''}

### CSS Custom Properties (:root variables):
${siteData.cssVars?.join('\n') || 'Nenhuma encontrada'}

### Headings encontrados na página:
${siteData.headings?.join('\n') || 'Nenhum'}

### Computed Styles dos elementos-chave:
${siteData.computedStyles || 'Não disponível'}

### CSS completo da página (ANALISE CADA PROPRIEDADE):
\`\`\`css
${siteData.css}
\`\`\`

### HTML da página (primeiros 8000 chars para contexto):
\`\`\`html
${siteData.htmlSnippet}
\`\`\`
`;
  }

  return `Você é um ENGENHEIRO DE DESIGN SYSTEMS com 20 anos de experiência, especialista em Atomic Design.
Sua precisão é CIRÚRGICA — você extrai valores EXATOS, não aproximados.

METODOLOGIA: Atomic Design (Brad Frost)
- ATOMS: os menores tokens (cores, tipografia, espaçamento, bordas, texturas, sombras)
- MOLECULES: combinações de átomos (botões, inputs, badges, tooltips)
- ORGANISMS: componentes maiores (cards, navbars, heroes, seções)
- ANIMATIONS: todo o motion design (durations, easings, hover, entrance, keyframes)

TAREFA: Analisar TODAS as referências fornecidas e criar um Design System COMPLETO e DETALHADO.
Se CSS real foi fornecido, EXTRAIA valores EXATOS. Se apenas descrição/imagem, CRIE um DS premium e coerente.

NOME DO TEMA: "${themeName}"
${userSpecs ? `\nESPECIFICAÇÕES DO USUÁRIO: "${userSpecs}"` : ''}
${referenceUrls ? `\nURLS DE REFERÊNCIA: ${referenceUrls}` : ''}
${contextBlock}

## INSTRUÇÕES DE PRECISÃO:

### CORES — REGRAS ABSOLUTAS:
- Se o CSS real foi fornecido, EXTRAIA os hex/rgb/hsl EXATOS. NÃO INVENTE.
- Procure: background, color, border-color, box-shadow, gradient, --custom-properties
- Categorize TODAS as cores por função na hierarquia atômica
- Para rgb()/hsl(), converta para hex
- Identifique GRADIENTES usados (direction + color stops)

### TIPOGRAFIA — REGRAS ABSOLUTAS:
- Extraia nomes EXATOS das fontes (Google Fonts links, font-family declarations)
- Identifique a escala tipográfica COMPLETA (xs até 7xl)
- Capture font-weight, line-height e letter-spacing de cada nível
- Monte a URL do Google Fonts Import completa

### COMPONENTES — analise CADA interação:
- Botões: background, cor, borda, radius, padding, hover state, shadow, transition
- Inputs: background, borda, radius, padding, focus state, placeholder color
- Cards: background, borda, radius, padding, shadow, hover transform/shadow
- Badges, tooltips, dividers — se encontrados

### ANIMAÇÕES — analise motion design:
- Durations padrão para fast/normal/slow
- Easing curves usadas (transitions)
- Hover effects (scale, translate, glow, shadow change)
- Entrance animations (fadeUp, fadeLeft, scaleIn)
- Keyframe animations (shimmer, pulse, float)

### TEXTURAS E EFEITOS:
- Grain/noise overlays
- Background patterns
- Blur effects (backdrop-filter)
- Overlay gradients

Retorne um JSON com esta estrutura EXATA (Atomic Design):

{
  "atoms": {
    "colors": {
      "background": "#hex",
      "surface": "#hex",
      "surface2": "#hex",
      "surface3": "#hex",
      "border": "#hex",
      "borderLight": "#hex",
      "text": "#hex",
      "textSecondary": "#hex",
      "textMuted": "#hex",
      "accent": "#hex",
      "accentLight": "#hex",
      "accentDark": "#hex",
      "accentGradient": "linear-gradient(...)",
      "success": "#hex",
      "warning": "#hex",
      "error": "#hex"
    },
    "typography": {
      "fontHeading": "Font Name",
      "fontBody": "Font Name",
      "fontMono": "Font Name or null",
      "googleFontsUrl": "https://fonts.googleapis.com/css2?family=...",
      "scale": { "xs":"12px","sm":"14px","base":"16px","lg":"18px","xl":"20px","2xl":"24px","3xl":"30px","4xl":"36px","5xl":"48px","6xl":"64px","7xl":"80px" },
      "weights": { "light":300,"regular":400,"medium":500,"semibold":600,"bold":700,"black":900 },
      "lineHeights": { "tight":"1.1","snug":"1.25","normal":"1.5","relaxed":"1.75" },
      "letterSpacing": { "tight":"-0.02em","normal":"0","wide":"0.05em","wider":"0.1em" }
    },
    "spacing": { "2xs":"2px","xs":"4px","sm":"8px","md":"16px","lg":"24px","xl":"32px","2xl":"48px","3xl":"64px","4xl":"96px","5xl":"128px" },
    "radius": { "none":"0","xs":"2px","sm":"4px","md":"8px","lg":"12px","xl":"16px","2xl":"24px","full":"9999px" },
    "shadows": { "xs":"val","sm":"val","md":"val","lg":"val","xl":"val","inner":"val" },
    "borders": { "thin":"1px solid","medium":"2px solid","thick":"3px solid" },
    "textures": { "grain":"description or data-uri","noise":"description or null","pattern":"description or null" },
    "iconStyle": "outlined or filled or duotone"
  },
  "molecules": {
    "buttonPrimary": { "bg":"#hex","color":"#hex","radius":"val","padding":"val","fontSize":"val","fontWeight":"val","shadow":"val","hoverBg":"#hex","hoverShadow":"val","transition":"val" },
    "buttonSecondary": { "bg":"transparent or #hex","color":"#hex","border":"val","radius":"val","padding":"val","hoverBg":"#hex" },
    "buttonGhost": { "color":"#hex","hoverBg":"rgba(...)","padding":"val","radius":"val" },
    "inputField": { "bg":"#hex","border":"val","radius":"val","padding":"val","focusBorder":"#hex","focusShadow":"val","placeholderColor":"#hex" },
    "badge": { "bg":"#hex","color":"#hex","radius":"val","padding":"val","fontSize":"val" },
    "divider": { "color":"#hex","style":"solid or dashed or gradient","height":"val" }
  },
  "organisms": {
    "card": { "bg":"#hex","border":"val","radius":"val","padding":"val","shadow":"val","hoverShadow":"val","hoverTransform":"val" },
    "navbar": { "bg":"#hex","height":"val","blur":"val","borderBottom":"val" },
    "hero": { "minHeight":"val","textAlign":"val","overlayGradient":"val" },
    "section": { "paddingY":"val","maxWidth":"val","gap":"val" },
    "footer": { "bg":"#hex","paddingY":"val","borderTop":"val" }
  },
  "animations": {
    "durations": { "fast":"150ms","normal":"300ms","slow":"500ms","xslow":"1000ms" },
    "easings": { "default":"cubic-bezier(0.4,0,0.2,1)","spring":"cubic-bezier(0.34,1.56,0.64,1)","bounce":"cubic-bezier(0.68,-0.55,0.265,1.55)" },
    "hover": { "scale":"1.02","lift":"-2px","glowColor":"rgba(accent,0.3)","glowSpread":"20px" },
    "entrance": { "fadeUp":"translateY(20px) → 0","fadeLeft":"translateX(-20px) → 0","scaleIn":"scale(0.95) → 1","duration":"600ms","stagger":"100ms" },
    "keyframes": { "shimmer":"background-position 200% sweep","pulse":"scale 1→1.05→1","float":"translateY 0→-10px→0" }
  },
  "meta": {
    "name": "${themeName}",
    "description": "Descrição precisa do estilo visual em 1-2 frases",
    "personality": ["keyword1","keyword2","keyword3","keyword4"],
    "cssVariables": ":root { /* TODAS as variáveis CSS organizadas */ }"
  }
}

REGRAS FINAIS:
- Se CSS real disponível: valores EXATOS, extraídos do código. NÃO inventar.
- Se só descrição/imagem: criar DS coerente, premium e detalhado com TODOS os campos preenchidos.
- O cssVariables em meta DEVE ser um :root {} COMPLETO e FUNCIONAL com todas as variáveis.
- Preencha TODOS os campos — não deixe nenhum vazio ou genérico.
- Retorne APENAS o JSON válido, sem markdown wrapping.`;
}

export function buildThemePreviewPrompt(tokens) {
  // Normalize: support both old flat format and new Atomic Design format
  const atoms = tokens.atoms || tokens;
  const molecules = tokens.molecules || tokens.components || {};
  const organisms = tokens.organisms || {};
  const animations = tokens.animations || {};
  const meta = tokens.meta || { name: tokens.name, description: tokens.description };
  const colors = atoms.colors || tokens.colors || {};
  const typography = atoms.typography || tokens.typography || {};

  return `Você é um DESIGNER UI SÊNIOR e ARQUITETO FRONTEND. Crie um SHOWCASE DE DESIGN SYSTEM premium que demonstre FIELMENTE cada camada atômica do DS.

DESIGN SYSTEM COMPLETO (Atomic Design):
${JSON.stringify(tokens, null, 2)}

CRIE UMA PÁGINA HTML COMPLETA com estas 7 SEÇÕES DE SHOWCASE:

## SEÇÃO 1: HERO + HEADER
- Navbar fixa translúcida com nome do tema e botão accent
- Hero grande com título em fontHeading (tamanho 5xl-7xl), subtítulo em fontBody
- Use a cor accent como destaque no título (highlight em parte do texto)
- Background com sutil gradiente ou textura grain se disponível
- Mínimo 70vh de altura
- Animação de entrada fade-up no título e subtítulo

## SEÇÃO 2: COLOR PALETTE
- Título "Color Palette" com label de seção
- Grid com TODOS os swatches de cores do DS
- Cada swatch: círculo/quadrado com a cor + nome + hex abaixo
- Organize em grupos: Backgrounds, Text, Accent, Semantic
- Hover no swatch mostra borda accent

## SEÇÃO 3: TYPOGRAPHY SCALE
- Título "Typography"
- Lado esquerdo: specimen do fontHeading em vários tamanhos (7xl→lg)
- Lado direito: specimen do fontBody em vários tamanhos
- Mostrar cada weight disponível (light, regular, medium, bold, black)
- Uma frase de exemplo para cada combinação
- Mostrar letterSpacing e lineHeight visualmente

## SEÇÃO 4: BUTTONS & INPUTS
- Título "Interactive Elements"
- Linha 1: Button Primary (normal, hover), Button Secondary (normal, hover), Button Ghost
- Linha 2: Input field (normal, focus), Badge variants, Divider
- Cada botão deve ter transição hover REAL com CSS :hover
- Input deve ter transição de focus com :focus
- Use os valores EXATOS dos molecules

## SEÇÃO 5: CARDS & COMPONENTS
- Título "Components"
- 3 cards lado a lado demonstrando o organism card
- Cada card com: ícone, título (fontHeading), texto (fontBody), badge
- Hover effect: shadow e transform dos tokens
- Uma card com ênfase (borda ou glow accent)

## SEÇÃO 6: ANIMATIONS SHOWCASE
- Título "Motion & Effects"
- 4 boxes lado a lado, cada um demonstrando uma animação:
  1. Hover Scale + Lift (passe o mouse)
  2. Shimmer (animação contínua dourada/accent)
  3. Pulse (animação contínua suave)
  4. Float (animação contínua flutuante)
- CSS @keyframes para cada uma
- Um botão "Replay Entrance" que reinicia as animações de entrada (JS)

## SEÇÃO 7: LAYOUT COMPOSITION
- Título "Real-World Preview"
- Um mini-layout que combina TODOS os elementos: navbar, hero com CTA, 3 cards, pricing card, footer
- Tudo em escala menor (como um mockup dentro da página)
- Background surface2, com borda sutil
- Demonstra como TODOS os tokens se combinam num layout real

REGRAS OBRIGATÓRIAS:
- Use EXATAMENTE os tokens (cores hex, fontes, radius, shadows — sem NENHUMA alteração)
- O Google Fonts import DEVE estar no <head> (use a URL googleFontsUrl do DS)
- CSS todo em <style> block, JS em <script> block, sem dependências externas
- Background principal = cor background do tema
- Accent/Primary = cor accent do tema
- Títulos = fontHeading, corpo = fontBody
- TODOS os border-radius, shadows, paddings devem ser os valores EXATOS dos tokens
- A página deve parecer ABSOLUTAMENTE PREMIUM — como showcase de uma design agency
- Responsivo (mobile + desktop com media queries)
- Mínimo 500vh de altura total (é um showcase longo e rico)
- Inclua scroll-triggered animations via IntersectionObserver
- Cada seção deve ter um separador visual sutil (divider ou espaçamento)
- Labels de seção em uppercase com cor accent e traço decorativo
- Use os easings e durations dos tokens para TODAS as transições

Estilo visual da página:
- Dark and premium feel
- Seções alternando background e surface
- Micro-animações em hover de TODOS os elementos interativos
- Grain/noise texture sutil no hero se disponível nos tokens
- A página deve impressionar e demonstrar CADA detalhe do Design System

Retorne um JSON:
{
  "html": "<!DOCTYPE html>...HTML COMPLETO e auto-contido com todos os 7 seções..."
}

CRÍTICO: O HTML deve ser ESPETACULAR, PREMIUM e FIEL aos tokens. TODAS as 7 seções são obrigatórias. Retorne APENAS o JSON válido.`;
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
