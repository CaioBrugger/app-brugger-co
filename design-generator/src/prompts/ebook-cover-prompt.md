# Ebook Cover Image — Prompt Template

> Template de prompt para geração da capa do ebook no hero da landing page.
> O placeholder `{{TITLE}}` será substituído pelo título real do produto em runtime.

---

## Prompt

```
Create a premium, professional EBOOK COVER design with the following specifications:

TITLE TEXT (must appear prominently on the cover):
"{{TITLE}}"

PUBLISHER TEXT (must appear at the bottom):
"Editora Saber Cristão"

BEST SELLER SEAL:
- Include a circular golden "BEST SELLER" seal/badge in the upper-right area of the cover
- The seal should have a ribbon or starburst design
- Text inside the seal: "BEST SELLER"

COVER DESIGN REQUIREMENTS:
- Format: vertical book cover (2:3 aspect ratio, portrait orientation)
- The title "{{TITLE}}" must be the largest text element, centered or top-third positioned
- Use an elegant serif font style for the title (similar to Playfair Display or DM Serif)
- Publisher name "Editora Saber Cristão" at the bottom, smaller, in a refined sans-serif style
- Background: deep dark tones (#0C0C0E to #1a1a2e gradient) with rich atmospheric imagery related to the book's biblical theme
- Color palette: gold (#C9A962), warm amber, deep burgundy, royal dark blue accents
- Lighting: dramatic volumetric golden light rays, divine glow effect
- Include subtle thematic visual elements related to "{{TITLE}}" as background imagery (not overpowering the text)
- Add a thin elegant golden border or frame around the cover edges
- Overall feel: luxurious, authoritative, spiritual, premium — like a bestselling religious book

COMPOSITION RULES:
- Top area: Best Seller seal (golden, circular)
- Upper-center: Title text (large, golden, serif)
- Center: Thematic background imagery with atmospheric lighting
- Bottom: Publisher name "Editora Saber Cristão" (smaller, elegant)
- All text must be perfectly legible against the dark background
- The cover should look like a real, published, premium ebook cover

QUALITY:
- Ultra-high resolution, sharp details
- Professional typography rendering
- No spelling errors, no garbled text
- The final result should be indistinguishable from a professionally designed book cover
```

---

## Notas de Uso

- **Modelo recomendado:** `gemini-3.1-flash-image-preview` (NanoBanana 2)
- **Aspect ratio:** 2:3 (portrait) — ideal para capa de ebook
- **responseModalities:** `["IMAGE"]` (somente imagem, sem texto auxiliar)
- O `{{TITLE}}` é substituído em `prompt.js` antes de enviar para a API
- O prompt está em inglês para melhor qualidade de geração do Gemini
