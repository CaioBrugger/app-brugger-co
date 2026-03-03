# Ebook Cover Image — Prompt Template

> Template de prompt para geração da capa do ebook no hero da landing page.
> O placeholder `{{TITLE}}` será substituído pelo título real do produto em runtime.
> O título vem de `extractCoreSubject()` (ex: "Guia de Promessas Bíblicas", "Geografia Bíblica"),
> NÃO da headline de marketing.

---

## Prompt

```
Design a stunning, premium PHYSICAL BOOK COVER for a bestselling Christian ebook.

THIS IS THE BOOK TITLE (render this text prominently on the cover):
"{{TITLE}}"

THIS IS THE PUBLISHER (render at the bottom of the cover):
"Editora Saber Cristão"

MANDATORY VISUAL ELEMENTS:
1. GOLDEN "BEST SELLER" SEAL — A circular golden laurel wreath badge with "BEST SELLER" text, positioned in the upper area of the cover. Use a classic embossed golden medal/ribbon style.
2. TITLE TYPOGRAPHY — The title "{{TITLE}}" must be the dominant visual element. Use a bold, elegant serif typeface (like Playfair Display, Cormorant Garamond, or similar classic serif). The title should be large, perfectly centered, and highly legible. Render in warm gold/cream tones against the dark background.
3. PUBLISHER NAME — "Editora Saber Cristão" in a refined, smaller serif or sans-serif font at the bottom of the cover. Can include "Por:" or "Uma publicação de" prefix.
4. ORNAMENTAL FRAME — An elegant golden ornamental border or frame around the cover edges. Can use art nouveau flourishes, laurel branches, olive branches, or delicate golden filigree.

THEMATIC ILLUSTRATION (center/background of the cover):
Create a rich, detailed thematic illustration related to the book's subject "{{TITLE}}":
- Use elements that visually represent the biblical theme (open Bible, ancient scrolls, olive branches, crosses, doves, celestial light, ancient architecture, desert landscapes, crown of thorns, etc. — choose what fits the title best)
- The illustration should be detailed but NOT overpower the title text
- Use circular medallion vignettes, ornamental frames, or layered depth to integrate illustrations elegantly
- Warm golden light rays, divine glow, or ethereal light beams emanating from the illustration
- The illustration style should be rich, detailed, almost like a classical painting or illuminated manuscript

COLOR PALETTE:
- Background: deep navy blue (#0a1628) to dark midnight (#0C0C0E) gradient
- Primary accents: rich gold (#C9A962), warm amber (#D4A853), antique gold (#B8860B)
- Secondary accents: deep burgundy, royal blue, cream/ivory highlights
- Text: warm gold and ivory/cream tones
- All metallic elements should appear genuinely golden and luxurious

COVER STYLE AND COMPOSITION:
- This must look like a REAL, PROFESSIONALLY PUBLISHED physical book
- Show the book with slight 3D perspective — visible spine edge, subtle shadow, texture of the cover material
- The cover material should appear as premium leather, linen cloth, or matte finish
- Layout hierarchy (top to bottom): Best Seller seal → Title → Thematic illustration → Publisher name
- Overall aspect ratio: 2:3 portrait (vertical book format)
- The design should feel like a premium hardcover book you'd find in a Christian bookstore
- Inspired by bestselling religious book covers: rich, ornate, reverent, and authoritative

QUALITY STANDARDS:
- Ultra-high resolution, crisp details, no blurriness
- Professional-grade typography — perfectly rendered, no garbled or misspelled text
- The golden elements should appear genuinely metallic with highlights and depth
- Ornamental details should be intricate and refined, not generic clipart
- The final result must be indistinguishable from a professionally designed bestselling book cover
```

---

## Notas de Uso

- **Modelo recomendado**: `gemini-3.1-flash-image-preview` (NanoBanana 2)
- **Aspect ratio**: 2:3 (portrait) — formato de capa de livro
- **responseModalities**: `["IMAGE"]` (somente imagem)
- O `{{TITLE}}` vem de `extractCoreSubject(productTheme)` — extrai o nome curto do produto
  - Ex: "Ebook sobre Geografia Bíblica com 280 imagens" → "Geografia Bíblica"
  - Ex: "Guia de Promessas Bíblicas" → "Promessas Bíblicas"
- **NÃO usar** a headline de marketing (que é longa e descritiva)
- O prompt está em inglês para melhor qualidade de geração do Gemini
