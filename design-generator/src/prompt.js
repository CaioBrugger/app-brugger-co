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
