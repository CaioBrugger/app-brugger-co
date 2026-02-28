# Skill: LP Cover Image — Capa de Ebook Premium com Título

> Guia técnico para geração de imagens de capa de infoproduto no LP Builder.
> Foco em: imagem hero com título escrito, mockup de ebook flutuante, capa premium Dark Luxury.

---

## Quando usar esta skill

Use esta skill quando precisar gerar a **imagem principal (hero/capa)** de uma landing page de infoproduto, especialmente ebooks, guias e cursos digitais.

O objetivo é gerar uma imagem que:
1. Mostre o produto como um **ebook flutuante** ou **capa elegante**
2. Tenha o **título do produto claramente escrito** na imagem
3. Comunique **premium, autoridade e desejo** de compra

---

## Modelo recomendado: Reve (`falai/reve`)

O modelo **Reve** da inference.sh é o mais indicado para capas porque possui **text rendering nativo** — ele renderiza texto legível e elegante diretamente na imagem.

```bash
infsh app run falai/reve --input '{
  "prompt": "Premium dark luxury ebook cover. Title text: \"[TITULO]\". ...",
  "aspect_ratio": "3:2"
}'
```

**Fallback**: Seedream 4.5 (`bytedance/seedream-4-5`) — qualidade 4K cinematográfica, mas text rendering menos preciso.

---

## Aspect Ratios

| Tipo de imagem | Aspect | Uso |
|---------------|--------|-----|
| Capa standalone (livro) | `2:3` (portrait) | Download da capa, thumbnail |
| Hero mockup na LP | `3:2` (landscape) | Seção hero da LP ao lado do texto |
| Background atmosférico | `16:9` (widescreen) | Background da seção hero |

No LP Builder, o hero usa `3:2` por padrão (mockup ao lado do texto).

---

## Template de Prompt — Capa com Título (Reve)

```
Premium dark luxury ebook cover design. Portrait orientation.

TITLE TEXT (render exactly on the cover): "[TITULO EXATO DO PRODUTO]"

COVER DESIGN REQUIREMENTS:
- Background: Deep black gradient (#0C0C0E to #1a1a2e), atmospheric and cinematic
- TITLE displayed prominently in the center-upper area
- Title font: Elegant serif typeface, rich gold color (#C9A962), large and bold
- Title must be clearly legible — it is the most important visual element
- Decorative thin gold horizontal ornamental lines framing the title

BACKGROUND IMAGERY (behind the title):
- Dramatic [TEMA] themed scene — ancient manuscripts, scrolls, stone tablets, sacred landscapes
- Volumetric golden light beams emanating from center, illuminating the title
- Deep shadows around edges (vignette), light focuses on title area
- Subtle texture: aged parchment or dark leather

OVERALL COMPOSITION:
- Professional book cover quality
- Gold metallic sheen on title text with subtle emboss
- Authoritative, premium, spiritual, intellectual, luxurious mood

CRITICAL: The title text "[TITULO]" must appear as actual, clearly readable text on the cover.
```

---

## Template de Prompt — Hero Mockup (LP)

Use este prompt quando quer mostrar o ebook como um produto 3D flutuante:

```
Premium digital product mockup for a landing page hero section.

WHAT TO SHOW: A floating premium ebook mockup on a dark atmospheric background.
- A premium ebook cover floating at a slight 3D angle (perspective tilt ~15°)
- The ebook cover has a dark luxury design with gold title typography
- Dramatic lighting from above-left casting soft shadows below the book
- Subtle gold glow/halo effect around the floating ebook
- Mirror/reflection of the ebook below (semi-transparent, fading to black)
- Background: deep dark atmospheric [TEMA] scene (light rays, ancient textures, mist)
- Composition: centered or slightly right, leaving space on left for text overlay

STYLE:
- Dark background (#0C0C0E or gradient to #1a1a2e)
- Gold accents (#C9A962), warm amber, deep brown
- Volumetric cinematic lighting
- NO TEXT in the background (only on the ebook cover itself)
- Premium digital art, 4K photorealistic render

TECHNICAL: Product mockup quality, ultra-sharp, studio render. The ebook must look premium and desirable.
```

---

## Estratégia de Fallback no LP Builder

O sistema usa esta cascata automática:

```
1. Reve (falai/reve)              → text rendering, melhor para capa
   ↓ se falhar
2. Seedream 4.5 (bytedance/...)   → 4K cinematográfico
   ↓ se falhar
3. FLUX Pro (flux-pro-1.1)        → alta qualidade geral
   ↓ se falhar
4. OpenRouter FLUX                → fallback externo
   ↓ se tudo falhar
5. Pollinations.ai               → fallback sem API
```

---

## Dicas de Prompting para Capas Religiosas/Bíblicas

Para produtos com temática bíblica/espiritual, adicione ao prompt:

```
THEMATIC ELEMENTS:
- Ancient scrolls, stone tablets, papyrus, illuminated manuscripts
- Biblical architecture: temples, arches, ancient stone structures
- Sacred light: divine rays from above, celestial illumination
- Symbols: menorahs, olive branches, seals, ancient Hebrew/Greek motifs
- Earth tones: deep ochre, parchment yellow, stone gray mixed with gold
```

---

## Dicas para Títulos Longos

Se o título do produto tiver mais de 5 palavras, pode especificar a hierarquia:

```
TITLE HIERARCHY:
- MAIN TITLE (large, most prominent): "TITULO PRINCIPAL"
- SUBTITLE (smaller, below): "Subtítulo complementar"
- AUTHOR LINE (small, bottom): "por [Nome do Autor]"
```

---

## Integração no código

```javascript
import { buildCoverImagePrompt } from '../prompt';
import { generateLPImage } from './imageGeneratorService';

// Gera capa com título
const prompt = buildCoverImagePrompt(productTitle, productDescription);
const imageUrl = await generateLPImage(prompt, 'hero', '3:2', signal);
```

---

## Exemplo completo de uso

```javascript
// Extraindo título da seção hero depois da copy gerada
const heroSection = copySections.find(s => s.id?.includes('hero'));
const productTitle = heroSection?.content?.headline || 'Título do Produto';

// Gerando a capa
const coverPrompt = buildCoverImagePrompt(productTitle, productDescription);
const coverUrl = await generateLPImage(coverPrompt, 's02-hero', '3:2');

// Injetando na seção
section.suggestedImages = ['IMAGE_PLACEHOLDER_s02-hero'];
imageDictionary['IMAGE_PLACEHOLDER_s02-hero'] = coverUrl;
```
