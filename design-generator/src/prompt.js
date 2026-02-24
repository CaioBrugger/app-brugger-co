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

export function buildExtractThemePrompt(themeName, userSpecs, referenceUrls) {
  return `Você é um especialista em design systems e UI/UX com precisão cirúrgica.

TAREFA: Analisar as referências visuais (imagens e/ou URLs) fornecidas pelo usuário e extrair um Design System COMPLETO e PRECISO.

NOME DO TEMA: "${themeName}"
ESPECIFICAÇÕES DO USUÁRIO: "${userSpecs}"
${referenceUrls ? `URLS DE REFERÊNCIA: ${referenceUrls}` : ''}

Analise CADA DETALHE visual: cores exatas, tipografia, espaçamentos, bordas, sombras, componentes, animações.

Retorne um JSON com esta estrutura EXATA:

{
  "name": "${themeName}",
  "description": "Descrição curta do estilo visual (1-2 frases)",
  "personality": ["keyword1", "keyword2", "keyword3"],
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
    "success": "#hex",
    "error": "#hex",
    "info": "#hex"
  },
  "typography": {
    "fontHeading": "Font Name",
    "fontBody": "Font Name",
    "fontMono": "Font Name",
    "googleFontsImport": "@import url('https://fonts.googleapis.com/css2?family=...')",
    "scale": {
      "xs": "12px",
      "sm": "14px",
      "base": "16px",
      "lg": "18px",
      "xl": "20px",
      "2xl": "24px",
      "3xl": "30px",
      "4xl": "36px",
      "5xl": "48px"
    },
    "weights": {
      "light": 300,
      "regular": 400,
      "medium": 500,
      "semibold": 600,
      "bold": 700
    }
  },
  "spacing": {
    "xs": "4px",
    "sm": "8px",
    "md": "16px",
    "lg": "24px",
    "xl": "32px",
    "2xl": "48px",
    "3xl": "64px"
  },
  "radius": {
    "none": "0",
    "sm": "4px",
    "md": "8px",
    "lg": "16px",
    "xl": "24px",
    "full": "9999px"
  },
  "shadows": {
    "sm": "0 1px 2px rgba(...)",
    "md": "0 4px 6px rgba(...)",
    "lg": "0 10px 25px rgba(...)",
    "xl": "0 20px 50px rgba(...)"
  },
  "components": {
    "buttonPrimary": {
      "background": "#hex",
      "color": "#hex",
      "borderRadius": "value",
      "padding": "value",
      "fontSize": "value",
      "fontWeight": "value",
      "hoverBackground": "#hex"
    },
    "buttonSecondary": {
      "background": "#hex",
      "color": "#hex",
      "border": "value",
      "borderRadius": "value",
      "padding": "value"
    },
    "card": {
      "background": "#hex",
      "border": "value",
      "borderRadius": "value",
      "padding": "value",
      "shadow": "value"
    },
    "input": {
      "background": "#hex",
      "border": "value",
      "borderRadius": "value",
      "padding": "value",
      "focusBorder": "#hex"
    }
  },
  "cssVariables": ":root { /* ALL CSS custom properties ready to copy */ }"
}

REGRAS CRÍTICAS:
- Extraia TODOS os valores com precisão máxima baseado nas imagens/referências
- Se não conseguir determinar um valor com certeza, estime com base no que é visível e use o valor mais próximo
- O campo "cssVariables" deve conter um bloco :root {} COMPLETO e pronto para uso
- Cores DEVEM ser hex válidos
- Fontes devem estar disponíveis no Google Fonts quando possível
- Retorne APENAS o JSON válido, sem markdown`;
}

export function buildThemePreviewPrompt(tokens) {
  return `Você é um designer UI expert. Crie um HTML COMPLETO de preview para visualizar este Design System:

${JSON.stringify(tokens, null, 2)}

O HTML deve mostrar:
1. Paleta de cores (swatches com nome do token e hex)
2. Demonstração tipográfica (headings H1-H4, body, captions)
3. Escala de espaçamento (barras visuais)
4. Demonstração de bordas e sombras
5. Componentes demo: botão primary, botão secondary, card, input
6. Um mini-hero section usando o tema

REGRAS:
- Use TODAS as cores e tokens do JSON acima
- HTML auto-contido com CSS inline em <style>
- Inclua o import do Google Fonts do tema
- O preview deve representar EXATAMENTE como o tema ficaria numa landing page
- Layout limpo e organizado com seções bem separadas
- Responsivo

Retorne um JSON:
{
  "html": "<!DOCTYPE html>...HTML completo..."
}

CRÍTICO: Retorne APENAS o JSON válido.`;
}

