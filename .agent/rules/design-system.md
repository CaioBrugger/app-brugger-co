# 🎨 DESIGN SYSTEM — Landing Pages Saber Cristão

> Sistema visual completo para criação de landing pages de infoprodutos bíblicos.
> Todas as páginas criadas com este sistema devem parecer ter sido feitas pela mesma pessoa/marca.

---

## 1. FILOSOFIA VISUAL

A identidade visual segue o conceito **"Dark Luxury Biblical"** — um design escuro, premium e sofisticado que transmite autoridade, seriedade teológica e alto valor percebido. O visual combina a sobriedade de um manuscrito antigo com a modernidade de uma interface dark mode.

**Princípios fundamentais:**
- Fundo escuro predominante (dark mode completo)
- Acentos dourados que remetem a ouro, realeza bíblica e valor premium
- Tipografia serifada nos títulos (elegância clássica) e sans-serif no corpo (legibilidade)
- Espaçamento generoso — a página "respira"
- Imagens cinematográficas de alta qualidade como prova visual do conteúdo
- Minimalismo funcional: cada elemento tem um propósito de conversão

---

## 2. PALETA DE CORES

### Cores de Fundo (Backgrounds)
| Token                  | Hex       | Uso                                          |
|------------------------|-----------|----------------------------------------------|
| `--color-bg`           | `#0C0C0E` | Background principal da página               |
| `--color-surface`      | `#131316` | Cards, seções alternadas                     |
| `--color-surface-2`    | `#1A1A1F` | Cards elevados, containers de conteúdo       |
| `--color-surface-3`    | `#222228` | Hover de cards, elementos interativos        |

### Cores de Borda
| Token                  | Hex       | Uso                                          |
|------------------------|-----------|----------------------------------------------|
| `--color-border`       | `#2A2A32` | Bordas padrão de cards e divisores           |
| `--color-border-light` | `#3A3A45` | Bordas em estado hover ou destaque sutil     |

### Cores de Texto
| Token                      | Hex       | Uso                                      |
|----------------------------|-----------|------------------------------------------|
| `--color-text`             | `#FAFAFA` | Texto principal (títulos, headlines)      |
| `--color-text-secondary`   | `#A0A0A8` | Texto de apoio, descrições, parágrafos    |
| `--color-text-muted`       | `#6B6B75` | Labels, texto terciário, captions         |

### Cor de Destaque (Accent — Dourado)
| Token                  | Hex       | Uso                                          |
|------------------------|-----------|----------------------------------------------|
| `--color-accent`       | `#C9A962` | Cor principal: CTAs, preço, destaques        |
| `--color-accent-light` | `#DFC07A` | Hover de botões, texto com destaque leve     |
| `--color-accent-dark`  | `#A88C4A` | Pressed state, bordas douradas               |

### Cores Funcionais
| Token             | Hex       | Uso                                         |
|-------------------|-----------|---------------------------------------------|
| `--color-success` | `#4ADE80` | Checkmarks, confirmações, benefícios ✓      |
| `--color-error`   | `#F87171` | Preço riscado ("De"), alertas de escassez   |

### REGRAS DE APLICAÇÃO DE COR
1. **Nunca** usar cores claras ou brancas como fundo de seção
2. O dourado (`--color-accent`) é EXCLUSIVO para: botões CTA, preço final, palavras-chave no título (highlight), labels de seção, bordas de cards de destaque
3. Texto do corpo SEMPRE em `--color-text-secondary`, NUNCA em branco puro
4. Preço "De" (riscado) usa `--color-text-muted` ou `--color-error`
5. Preço final usa `--color-accent` em tamanho grande e bold
6. Ícones de check (✓) em benefícios usam `--color-success`

---

## 3. TIPOGRAFIA

### Fontes
| Token            | Família                                              | Uso                          |
|------------------|------------------------------------------------------|------------------------------|
| `--font-heading` | `'DM Serif Display', Georgia, serif`                 | Títulos H1, H2, H3          |
| `--font-body`    | `'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif` | Corpo, botões, labels  |

### Importação Google Fonts
```html
<link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=DM+Serif+Display&display=swap" rel="stylesheet">
```

### Escala Tipográfica
| Elemento             | Tamanho Desktop | Tamanho Mobile | Peso    | Família        |
|----------------------|-----------------|----------------|---------|----------------|
| H1 (headline)       | 48–56px         | 32–36px        | Normal  | DM Serif Display |
| H2 (seção)          | 40–48px         | 28–32px        | Normal  | DM Serif Display |
| H3 (subtítulo)      | 24–28px         | 20–24px        | Normal  | DM Serif Display |
| Corpo/parágrafo     | 16–18px         | 15–16px        | 400     | DM Sans        |
| Label de seção       | 12–14px         | 11–12px        | 600     | DM Sans        |
| Botão CTA           | 16–18px         | 15–16px        | 600     | DM Sans        |
| Preço grande         | 64–80px         | 48–56px        | 700     | DM Sans        |

### REGRAS TIPOGRÁFICAS
1. **H1 e H2 SEMPRE em DM Serif Display** — nunca usar sans-serif para títulos principais
2. Labels de seção (ex: "O DESAFIO", "CONTEÚDO COMPLETO") são em CAPS, `letter-spacing: 0.15em`, tamanho pequeno, cor dourada
3. O highlight dentro do H1 (palavras-chave) usa `color: var(--color-accent)` — o dourado
4. Parágrafos de corpo nunca ultrapassam `max-width: 700px` e são centralizados
5. Line-height: 1.7 para parágrafos, 1.2 para headings
6. Citações bíblicas em itálico DM Serif Display com aspas decorativas

---

## 4. ESPAÇAMENTO

### Tokens de Espaçamento
| Token            | Valor    | Uso                                              |
|------------------|----------|--------------------------------------------------|
| `--spacing-xs`   | `0.5rem` | Gap entre ícone e texto                          |
| `--spacing-sm`   | `1rem`   | Padding interno de labels e tags                 |
| `--spacing-md`   | `1.5rem` | Gap entre elementos dentro de cards              |
| `--spacing-lg`   | `2rem`   | Padding interno de cards                         |
| `--spacing-xl`   | `3rem`   | Espaço entre blocos dentro de uma seção          |
| `--spacing-2xl`  | `5rem`   | Padding vertical de seções (topo/base)           |
| `--spacing-3xl`  | `7rem`   | Separação entre seções importantes               |

### REGRAS DE ESPAÇAMENTO
1. Cada seção tem `padding: var(--spacing-2xl) 0` no mínimo
2. O container principal tem `max-width: 1200px` com `margin: 0 auto`
3. Padding lateral: `1.5rem` no mobile, `2rem` no desktop
4. Cards usam `padding: var(--spacing-lg)` internamente
5. Grid de cards: `gap: 1.5rem`

---

## 5. COMPONENTES

### 5.1 Navbar (Header Fixo)
```
┌─────────────────────────────────────────────────────┐
│  [Nome do Produto]           [Botão "Adquirir Agora"]│
│  Subtítulo em dourado                                │
└─────────────────────────────────────────────────────┘
```
- Background: `rgba(12, 12, 14, 0.95)` com `backdrop-filter: blur(20px)`
- Posição: `fixed`, topo, full-width
- Nome do produto: DM Serif Display, branco, bold
- Subtítulo: DM Sans, dourado, itálico
- Botão: fundo dourado, texto escuro, border-radius médio
- Inclui BARRA DE PREÇO FIXA no bottom em mobile com preço + botão comprar

### 5.2 Botões CTA
**Botão Primário (Comprar/Adquirir)**
- Background: `var(--color-accent)` (#C9A962)
- Texto: `#0C0C0E` (escuro)
- Font: DM Sans, 600, 16-18px
- Padding: `1rem 2.5rem`
- Border-radius: `var(--radius-md)` (10px)
- Hover: `var(--color-accent-light)` com `transform: translateY(-2px)`
- Sombra no hover: `0 8px 25px rgba(201, 169, 98, 0.3)`

**Botão Secundário/Outline**
- Background: `transparent`
- Borda: `1px solid var(--color-accent)`
- Texto: `var(--color-accent)`
- Hover: Background `var(--color-accent)`, texto escuro

### 5.3 Cards
**Card Padrão (Conteúdo/Módulo)**
- Background: `var(--color-surface)` ou `var(--color-surface-2)`
- Borda: `1px solid var(--color-border)`
- Border-radius: `var(--radius-lg)` (16px)
- Padding: `2rem`
- Hover: borda muda para `var(--color-border-light)`, leve `translateY(-4px)`

**Card com Badge/Tag**
- Mesma base do card padrão
- Badge no topo: fundo dourado translúcido, texto dourado, uppercase, pequeno

**Card de Bônus**
- Mesma base com borda `var(--color-border)`
- Tag "GRÁTIS" em verde (`--color-success`) ou "Mais Vendido" em dourado
- Preço original riscado + "GRÁTIS" em destaque

### 5.4 Seção de Preço
```
┌─────────────────────────────────────────────┐
│              Oferta por tempo limitado       │
│                                             │
│  [Imagem do Produto]                        │
│                                             │
│  Nome do Produto                            │
│  Subtítulo                                  │
│                                             │
│  • Benefício 1                              │
│  • Benefício 2                              │
│  • Benefício 3                              │
│                                             │
│  De R$XX,XX (riscado, vermelho/muted)       │
│  Por apenas                                 │
│  R$ XX,XX (grande, dourado, bold)           │
│                                             │
│  Pagamento único | Acesso vitalício         │
│                                             │
│  [====== BOTÃO CTA GRANDE ======]           │
│                                             │
│  🔒 Compra segura  ⚡ Acesso instantâneo    │
└─────────────────────────────────────────────┘
```

### 5.5 Seção de Garantia
- Ícone de escudo ou medalha
- Texto "Garantia Total de" em fonte grande
- "30 Dias" em destaque dourado extra-grande
- Descrição da garantia em texto secundário
- Tom: "O risco é inteiramente nosso"

### 5.6 Citações Bíblicas (Blockquotes)
- Texto em DM Serif Display, itálico
- Cor: `var(--color-text-secondary)`
- Borda esquerda dourada (4px)
- Referência bíblica em destaque separado abaixo
- Usado como separador emocional entre seções

### 5.7 Depoimentos
- Card com avatar circular (80px)
- Nome em bold, localização em muted
- Texto do depoimento em itálico com aspas
- Grid de 2 colunas no desktop, 1 no mobile

### 5.8 FAQ (Accordion)
- Pergunta em DM Sans 600
- Resposta em DM Sans 400, cor secundária
- Ícone + que vira × ao expandir
- Borda sutil entre itens

### 5.9 Barra Fixa de Compra (Sticky Bottom Bar)
- Visível no scroll após hero
- Background escuro com blur
- Preço riscado + preço final + botão CTA
- Desaparece quando a seção de preço está visível

---

## 6. BORDER-RADIUS E SOMBRAS

### Border Radius
| Token          | Valor  | Uso                                    |
|----------------|--------|----------------------------------------|
| `--radius-sm`  | `6px`  | Tags, badges, inputs                   |
| `--radius-md`  | `10px` | Botões, cards pequenos                  |
| `--radius-lg`  | `16px` | Cards grandes, imagens, containers      |

### Sombras
| Token          | Valor                                    | Uso                          |
|----------------|------------------------------------------|------------------------------|
| `--shadow-sm`  | `0 2px 8px rgba(0, 0, 0, 0.3)`          | Cards padrão                 |
| `--shadow-md`  | `0 4px 16px rgba(0, 0, 0, 0.4)`         | Cards hover, elevação média  |
| `--shadow-lg`  | `0 8px 32px rgba(0, 0, 0, 0.5)`         | Modais, imagem do produto    |

---

## 7. ANIMAÇÕES E TRANSIÇÕES

### Transições Padrão
- Botões: `transition: all 0.3s ease`
- Cards hover: `transition: transform 0.3s ease, border-color 0.3s ease`
- Accordion FAQ: `transition: max-height 0.3s ease`

### Animações de Scroll (Reveal)
- Elementos entram com `opacity: 0 → 1` e `translateY(30px → 0)`
- Delay escalonado em grids: cada card tem +100ms de delay
- Usar IntersectionObserver ou CSS `@keyframes` simples

### Efeitos Específicos
- Imagem do produto no hero: leve flutuação (`translateY` alternando)
- Badge de páginas: leve pulse/glow no dourado
- Botão CTA: glow sutil no hover com `box-shadow` dourado

---

## 8. RESPONSIVIDADE

### Breakpoints
| Nome     | Valor       | Uso                              |
|----------|-------------|----------------------------------|
| Mobile   | `< 768px`   | 1 coluna, fontes menores         |
| Tablet   | `768–1024px` | 2 colunas, ajustes intermediários |
| Desktop  | `> 1024px`  | Layout completo, 3 colunas       |

### Regras Mobile
1. Grid de cards muda para 1 coluna
2. H1 reduz para 32-36px
3. Seção de preço ocupa full-width com padding lateral
4. Barra sticky de preço aparece no bottom fixo
5. Imagens do produto ficam 100% width
6. Galeria de amostras muda para scroll horizontal
7. FAQ accordion se mantém igual

---

## 9. IMAGENS

### Diretrizes de Imagens
1. **Capa do ebook**: sempre em mockup de tablet/iPad, levemente inclinado, com sombra
2. **Badge de páginas**: sobre a imagem do ebook, fundo dourado, texto escuro, uppercase
3. **Amostras de conteúdo**: grid com imagens em alta resolução, border-radius, overlay com nome
4. **Avatares de depoimentos**: circulares, 80px, com borda sutil
5. Todas as imagens devem ter `border-radius: var(--radius-lg)`

### Estilo Visual das Imagens
- Imagens cinematográficas, dramáticas, com boa iluminação
- Preferir tons quentes (dourado, âmbar) que combinem com a paleta
- Evitar imagens genéricas de stock — preferir ilustrações geradas por IA com estilo épico/bíblico

---

## 10. CSS VARIABLES — COPIAR E COLAR

```css
:root {
  /* Backgrounds */
  --color-bg: #0C0C0E;
  --color-surface: #131316;
  --color-surface-2: #1A1A1F;
  --color-surface-3: #222228;

  /* Borders */
  --color-border: #2A2A32;
  --color-border-light: #3A3A45;

  /* Text */
  --color-text: #FAFAFA;
  --color-text-secondary: #A0A0A8;
  --color-text-muted: #6B6B75;

  /* Accent (Gold) */
  --color-accent: #C9A962;
  --color-accent-light: #DFC07A;
  --color-accent-dark: #A88C4A;

  /* Functional */
  --color-success: #4ADE80;
  --color-error: #F87171;

  /* Typography */
  --font-heading: 'DM Serif Display', Georgia, serif;
  --font-body: 'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif;

  /* Spacing */
  --spacing-xs: 0.5rem;
  --spacing-sm: 1rem;
  --spacing-md: 1.5rem;
  --spacing-lg: 2rem;
  --spacing-xl: 3rem;
  --spacing-2xl: 5rem;
  --spacing-3xl: 7rem;

  /* Border Radius */
  --radius-sm: 6px;
  --radius-md: 10px;
  --radius-lg: 16px;

  /* Shadows */
  --shadow-sm: 0 2px 8px rgba(0, 0, 0, 0.3);
  --shadow-md: 0 4px 16px rgba(0, 0, 0, 0.4);
  --shadow-lg: 0 8px 32px rgba(0, 0, 0, 0.5);
}
```

---

## 11. CHECKLIST DE CONSISTÊNCIA VISUAL

Antes de publicar qualquer nova página, verificar:

- [ ] Background da página é `#0C0C0E`
- [ ] Fonte dos títulos é DM Serif Display
- [ ] Fonte do corpo é DM Sans
- [ ] Cor de destaque é dourado `#C9A962`
- [ ] Labels de seção estão em CAPS com letter-spacing
- [ ] Botão CTA é dourado com texto escuro
- [ ] Cards usam `--color-surface` com borda `--color-border`
- [ ] Preço riscado + preço final dourado grande está presente
- [ ] Barra fixa de compra funciona no scroll
- [ ] Pelo menos 1 citação bíblica como separador
- [ ] Seção de garantia 30 dias está presente
- [ ] FAQ accordion está presente
- [ ] Footer minimalista com copyright + links
- [ ] Responsivo testado em mobile
