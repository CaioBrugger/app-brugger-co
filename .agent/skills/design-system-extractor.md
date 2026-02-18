# Design System Extractor

## Como usar

Envie para o Claude:
> "Use o design-system-extractor.md e extraia o design system de: [link ou imagem]"

---

## Prompt de Extração

Você é um especialista em design systems e UI/UX. Sua tarefa é analisar o site, app ou imagem fornecido e extrair **todo o design system** com precisão cirúrgica.

Analise e documente **obrigatoriamente** cada seção abaixo. Não pule nenhuma. Se um valor não puder ser determinado com certeza, estime com base no que é visível e sinalize com `~` (aproximado).

---

### 1. IDENTIDADE VISUAL

```
Nome/Marca:
Personalidade (palavras-chave):
Estilo geral: [ ] Minimalista [ ] Corporativo [ ] Playful [ ] Bold [ ] Elegante [ ] Outro:
```

---

### 2. PALETA DE CORES

Extraia **todos** os valores hex/rgb encontrados, organizados por função:

```css
/* Primárias */
--color-primary:
--color-primary-hover:
--color-primary-active:

/* Secundárias */
--color-secondary:
--color-secondary-hover:

/* Neutras / Grays */
--color-neutral-50:
--color-neutral-100:
--color-neutral-200:
--color-neutral-300:
--color-neutral-400:
--color-neutral-500:
--color-neutral-600:
--color-neutral-700:
--color-neutral-800:
--color-neutral-900:

/* Semânticas */
--color-success:
--color-warning:
--color-error:
--color-info:

/* Superfícies */
--color-background:
--color-surface:
--color-surface-raised:
--color-surface-overlay:

/* Texto */
--color-text-primary:
--color-text-secondary:
--color-text-disabled:
--color-text-inverse:

/* Bordas */
--color-border:
--color-border-strong:
--color-border-focus:
```

---

### 3. TIPOGRAFIA

```css
/* Famílias */
--font-primary:        /* fonte principal */
--font-secondary:      /* fonte de apoio, se houver */
--font-mono:           /* fonte monospace, se houver */

/* Escala de tamanhos */
--text-xs:     /* px + rem */
--text-sm:
--text-base:
--text-lg:
--text-xl:
--text-2xl:
--text-3xl:
--text-4xl:
--text-5xl:

/* Pesos */
--font-light:    /* número */
--font-regular:
--font-medium:
--font-semibold:
--font-bold:
--font-extrabold:

/* Line heights */
--leading-tight:
--leading-normal:
--leading-relaxed:

/* Letter spacing */
--tracking-tight:
--tracking-normal:
--tracking-wide:
--tracking-wider:
```

Documente também os **estilos de texto compostos** (headings, body, labels, etc.):

| Estilo     | Fonte | Tamanho | Peso | Line-height | Letter-spacing | Uso |
|------------|-------|---------|------|-------------|----------------|-----|
| H1         |       |         |      |             |                |     |
| H2         |       |         |      |             |                |     |
| H3         |       |         |      |             |                |     |
| H4         |       |         |      |             |                |     |
| Body Large |       |         |      |             |                |     |
| Body       |       |         |      |             |                |     |
| Body Small |       |         |      |             |                |     |
| Caption    |       |         |      |             |                |     |
| Label      |       |         |      |             |                |     |
| Overline   |       |         |      |             |                |     |
| Code       |       |         |      |             |                |     |

---

### 4. ESPAÇAMENTO

```css
/* Escala base (geralmente múltiplos de 4 ou 8) */
--space-1:
--space-2:
--space-3:
--space-4:
--space-5:
--space-6:
--space-8:
--space-10:
--space-12:
--space-16:
--space-20:
--space-24:
--space-32:
--space-40:
--space-48:
--space-64:
```

---

### 5. BORDER RADIUS

```css
--radius-none:    /* 0 */
--radius-sm:
--radius-base:
--radius-md:
--radius-lg:
--radius-xl:
--radius-2xl:
--radius-full:    /* 9999px */
```

---

### 6. SOMBRAS

```css
--shadow-xs:
--shadow-sm:
--shadow-base:
--shadow-md:
--shadow-lg:
--shadow-xl:
--shadow-2xl:
--shadow-inner:
--shadow-none:
```

---

### 7. BORDAS

```css
--border-width-thin:
--border-width-base:
--border-width-thick:

--border-style:    /* solid, dashed, etc. */
```

---

### 8. GRID E LAYOUT

```
Colunas:
Gutter (espaço entre colunas):
Margin lateral (padding do container):
Max-width do container:

Breakpoints:
  - Mobile:
  - Tablet:
  - Desktop:
  - Wide:
```

---

### 9. COMPONENTES

Para cada componente identificado, documente:

#### Botões

| Variante  | Background | Texto | Border | Radius | Padding | Font-size | Font-weight | Estado hover | Estado disabled |
|-----------|------------|-------|--------|--------|---------|-----------|-------------|--------------|-----------------|
| Primary   |            |       |        |        |         |           |             |              |                 |
| Secondary |            |       |        |        |         |           |             |              |                 |
| Outline   |            |       |        |        |         |           |             |              |                 |
| Ghost     |            |       |        |        |         |           |             |              |                 |
| Danger    |            |       |        |        |         |           |             |              |                 |
| Link      |            |       |        |        |         |           |             |              |                 |

Tamanhos de botão:

| Size | Padding H | Padding V | Font-size | Height |
|------|-----------|-----------|-----------|--------|
| xs   |           |           |           |        |
| sm   |           |           |           |        |
| md   |           |           |           |        |
| lg   |           |           |           |        |
| xl   |           |           |           |        |

#### Inputs / Campos de Formulário

```
Background:
Border:
Border focus:
Border error:
Border radius:
Padding:
Font-size:
Placeholder color:
Label: (posição, tamanho, peso)
Helper text: (tamanho, cor)
Error text: (tamanho, cor)
Height:
```

#### Cards

```
Background:
Border:
Border radius:
Shadow:
Padding:
Gap entre elementos internos:
```

#### Badges / Tags / Chips

```
Variantes encontradas:
Border radius:
Padding:
Font-size:
Font-weight:
```

#### Navegação (Navbar / Sidebar / Tabs)

```
Tipo: [ ] Navbar [ ] Sidebar [ ] Tabs [ ] Bottom nav
Background:
Height/Width:
Item ativo: (cor, background, indicador)
Item hover:
Item inativo:
Font-size dos itens:
```

#### Outros componentes identificados

Liste e descreva qualquer componente adicional encontrado (modais, tooltips, accordions, dropdowns, etc.)

---

### 10. ICONOGRAFIA

```
Biblioteca identificada: (ex: Lucide, Heroicons, Material Icons, Feather, custom...)
Estilo: [ ] Outline [ ] Filled [ ] Duotone [ ] Mixed
Tamanhos usados:
Stroke width (se outline):
Cor padrão dos ícones:
```

---

### 11. IMAGENS E MÍDIA

```
Estilo das imagens: (ex: fotos reais, ilustrações, 3D, misto...)
Aspect ratios comuns:
Border radius das imagens:
Tratamento: (ex: overlay, grayscale, border...)
```

---

### 12. ANIMAÇÕES E TRANSIÇÕES

```
Duração padrão:
Easing padrão:
Animações de entrada:
Animações de hover:
Animações de loading:
Outros padrões de motion:
```

---

### 13. TOKENS FINAIS (CSS Custom Properties — pronto para uso)

Ao final, gere um bloco `:root {}` completo com **todos os tokens** extraídos, pronto para copiar e colar em qualquer projeto.

```css
:root {
  /* Cole aqui todos os tokens organizados das seções acima */
}
```

---

### 14. TAILWIND CONFIG (se aplicável)

Se solicitado, gere também o equivalente em `tailwind.config.js`:

```js
module.exports = {
  theme: {
    extend: {
      // tokens convertidos
    }
  }
}
```

---

### 15. OBSERVAÇÕES E PADRÕES ÚNICOS

Documente qualquer detalhe de design que seja característico da marca e que não se encaixe nas categorias acima (micro-interações, padrões visuais únicos, uso especial de gradientes, etc.)

---

*Arquivo: design-system-extractor.md*
*Atualizado: 2026-02-17*
