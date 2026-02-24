# Metodologia: Estrutura de Design System (Baseada na Academia Lendária)

> **Como usar este arquivo:** Este documento é um prompt/metodologia para o Claude Code criar ou reorganizar qualquer design system existente, aplicando a estrutura de abas, navegação e documentação usada por Alan Nícolás na Academia Lendária. Substitua os blocos `[VARIÁVEL]` com os dados do seu projeto antes de usar.

---

## INSTRUÇÃO PRINCIPAL

Crie (ou reorganize) a seção de Design System do projeto `[NOME_DO_PROJETO]` seguindo exatamente a estrutura de navegação, documentação e componentização da Academia Lendária. O projeto já possui um design system com os seguintes elementos:

```
[COLE AQUI O SEU DESIGN SYSTEM ATUAL: cores, tipografia, componentes, tokens, etc.]
```

---

## PARTE 1 — ESTRUTURA DE NAVEGAÇÃO

### Top Navbar exclusiva do Design System

O Design System deve ter uma **top navbar própria**, separada da navegação principal do app. Ela fica no topo de todas as páginas `/design/*` e contém:

```
[Logo/Nome do Projeto] | Design System   [Visão Geral] [Identidade & Marca] [Tokens] [Biblioteca UI ▾] [Templates & Páginas ▾] [Documentação]
```

- O texto abaixo do logo mostra a subseção atual em letras pequenas e esmaecidas (ex: "BOTÕES")
- Abas com dropdown abrem submenus ao hover
- A aba ativa recebe destaque visual (underline ou cor diferente)

### Roteamento

Todas as rotas do Design System seguem o padrão `/design/[secao]/[subsecao]`:

| Rota | Conteúdo |
|------|----------|
| `/design/overview` | Visão Geral |
| `/design/identity` | Identidade & Marca |
| `/design/tokens/[token]` | Tokens (spacing, colors, typography, icons...) |
| `/design/components/[componente]` | Biblioteca de componentes |
| `/design/templates/[template]` | Templates e páginas prontas |
| `/design/docs` | Documentação / Manual de IA |

### Dropdown "Biblioteca UI" — preencha com seus componentes

```
Biblioteca UI
├── Botões
├── Componentes Básicos
├── Cards & Boxes
├── Formulários
├── Tabelas
├── Listas
├── Estados & Loading
├── Feedback
├── [Adicione seus componentes específicos]
└── Charts / Gráficos
```

### Dropdown "Templates & Páginas" — preencha com suas páginas

```
Templates & Páginas
├── [CATEGORIA 1 — ex: SaaS/App]
│   ├── [Template 1]
│   ├── [Template 2]
│   └── [Template 3]
├── [CATEGORIA 2 — ex: Marketing]
│   ├── [Template 1]
│   └── [Template 2]
└── [CATEGORIA 3]
    └── [Template 1]
```

---

## PARTE 2 — PADRÃO DE DOCUMENTAÇÃO DE COMPONENTES

### Estrutura obrigatória de cada página de componente

Toda página de componente deve seguir **exatamente** este padrão:

```tsx
// 1. HEADER DA PÁGINA
<PageHeader
  breadcrumb="BIBLIOTECA UI / [NOME DO COMPONENTE]"  // texto pequeno e esmaecido acima
  title="[Nome do Componente]"
  description="[Uma frase descrevendo a filosofia/propósito do componente]"
/>

// 2. SEÇÕES DE PREVIEW (quantas forem necessárias)
<ComponentSection title="[Nome da Variante/Grupo]">
  {/* Demo visual interativo e funcional do componente */}
  {/* Use os tokens reais do seu design system */}
</ComponentSection>

// 3. SEÇÃO DE ESTADOS (sempre presente)
<ComponentSection title="Estados">
  {/* Disabled, Loading/Processing, Error, Success, Interactive */}
</ComponentSection>

// 4. SEÇÃO DE EFEITOS ESPECIAIS (se o projeto tiver)
<ComponentSection title="Efeitos Especiais">
  {/* Animações, hover effects, variantes únicas da marca */}
</ComponentSection>

// 5. DIRETRIZES DE USO (sempre ao final — obrigatório)
<GuidelinesSection
  dos={[
    { title: "Regra positiva 1", description: "Explicação..." },
    { title: "Regra positiva 2", description: "Explicação..." },
  ]}
  donts={[
    { title: "Anti-padrão 1", description: "Por que evitar..." },
    { title: "Anti-padrão 2", description: "Por que evitar..." },
  ]}
/>
```

### Tags de contexto de uso

Cada demo de componente pode ter uma **tag pequena** no canto indicando onde aquele padrão é usado:

```
[FAQ & Módulos]    [Dashboard]    [Formulários]    [Marketing]    [SVG Paths]
```

---

## PARTE 3 — SEÇÕES OBRIGATÓRIAS

### Visão Geral (`/design/overview`)
- Apresentação do Design System: nome, versão, filosofia
- Cards de acesso rápido para cada seção principal
- Changelog ou "últimas atualizações"
- Status de cada área (estável, em progresso, planejado)

### Identidade & Marca (`/design/identity`)
- Logo em variações (principal, dark, light, ícone, horizontal)
- Paleta de cores da marca com:
  - Nome do token
  - Valor hex / hsl
  - Swatch visual
  - Usos corretos e incorretos
- Tom de voz e linguagem
- Exemplos de uso correto e incorreto da marca

### Tokens (`/design/tokens/[token]`)

#### Espaçamentos
Tabela com escala de espaçamento do projeto:
| Valor px | Classe/Token | Barra visual proporcional |
|---------|-------------|--------------------------|
| [x]px | [classe-do-projeto] | ▏ |

Regra: documente a escala base do seu projeto (ex: grid de 4px, 8px ou outro).

#### Cores
- Cores primitivas (a paleta raw)
- Cores semânticas (primary, secondary, accent, background, surface, text, border, error, success, warning)
- Dark mode vs Light mode
- Como aplicar: use `var(--primary)` ou a classe Tailwind equivalente

#### Tipografia
- Fontes utilizadas com fonte e fallback
- Escala de tamanhos (H1 → Caption)
- Exemplos visuais de cada tamanho
- Regras de uso (quando usar serif vs sans, quando usar bold vs regular)

#### Ícones
- Grid de todos os ícones agrupados por categoria
- Nome do ícone abaixo de cada um
- Instrução de uso: `<Icon name="[nome]" />`
- Seção separada para ícones de marcas/redes sociais: `<SocialIcon name="[nome]" />`

### Documentação (`/design/docs`)

Página com o **Manual de IA** — documento markdown renderizado para ser consumido por agentes de IA como contexto:

```markdown
## Tech Stack
- [Framework]: [versão]
- [CSS Solution]: [versão]
- [Component Library]: [versão]
- Icons: [Solução de ícones]
- Fonts: '[Font Principal]' para [uso], '[Font Secundária]' para [uso]

## Design Token Implementation
- Primary Color: "[nome-do-token]" / [valor] → [hex]
- Border Radius: '[classe]' para cards/containers, '[classe]' para small controls
- Spacing: Use múltiplos de [X] ([classes-exemplo])
- Dark Mode: [estratégia usada]

## Component Usage Rules
1. **[Componente 1]**: ALWAYS use `import { [Componente] } from '[caminho]'`
2. **Icons**: ALWAYS use `import { Icon } from '[caminho]'`
3. **Typography**:
   - Headings: [classe]
   - Body: [classe]
   - Labels/Micro-copy: [classe]

## Aesthetic Rules
- [Regra visual 1]
- [Regra visual 2]
- [Regra visual 3]
```

---

## PARTE 4 — COMPONENTES DE LAYOUT DO DESIGN SYSTEM

Crie estes componentes base **somente para o Design System** (não interferem no resto do app):

### `DesignSystemLayout`
```tsx
// Wrapper que envolve todas as páginas /design/*
// Renderiza a DSNavbar no topo e o conteúdo abaixo
// NÃO usa o layout principal do app (sem sidebar, sem header do app)
```

### `DSNavbar`
```tsx
// Top navbar exclusiva do Design System
// Props: currentSection, currentSubSection
// Contém: logo+nome, abas principais, dropdowns de Biblioteca UI e Templates
// Mostra subseção atual em texto menor abaixo do logo
```

### `PageHeader`
```tsx
// Props: breadcrumb, title, description
// breadcrumb: texto pequeno esmaecido acima do título (ex: "BIBLIOTECA UI / BOTÕES")
// title: H1 da página
// description: subtítulo explicativo
```

### `ComponentSection`
```tsx
// Props: title, tag?, children
// title: H2 da seção
// tag: badge opcional de contexto de uso (ex: "FAQ & Módulos")
// children: preview/demo do componente
```

### `GuidelinesSection`
```tsx
// Props: dos[], donts[]
// Renderiza dois cards lado a lado:
// - Card verde com "✓ O que fazer (Do)" + lista de boas práticas
// - Card vermelho com "✗ O que não fazer (Don't)" + lista de anti-padrões
// Cada item: { title: string, description: string }
```

### `TokenTable`
```tsx
// Para documentar design tokens em formato de tabela
// Props: tokens[] com { name, value, preview?, description? }
// Renderiza cada token com swatch visual quando aplicável
```

---

## PARTE 5 — VISUAL E ESTILO DO PRÓPRIO DESIGN SYSTEM

> O Design System deve ter um visual condizente com a identidade do projeto. Use os tokens reais do seu projeto para estilizar as páginas de documentação.

Padrões gerais a seguir:
- **Fundo**: use a cor de background do tema principal do projeto
- **Cards de seção**: superfície levemente elevada (`surface` color)
- **Bordas**: sutis, usando o token de borda do projeto
- **Breadcrumbs**: texto pequeno (12px), cor esmaecida (text-muted)
- **Títulos de seção (H2)**: tamanho médio (20-24px), peso semibold
- **Tags de contexto**: badge pequeno, cor neutra, texto uppercase pequeno
- **Cards Do/Don't**:
  - DO: border-left verde + fundo verde com opacity baixa
  - DON'T: border-left vermelho + fundo vermelho com opacity baixa
- **Demos interativos**: fundo levemente diferente para separar do conteúdo (checkerboard ou surface-2)

---

## PARTE 6 — CHECKLIST DE IMPLEMENTAÇÃO

Antes de considerar o Design System completo, verificar:

- [ ] Top navbar com todas as abas e dropdowns funcionando
- [ ] Roteamento `/design/*` configurado e isolado do layout principal
- [ ] Visão Geral com cards de acesso rápido
- [ ] Identidade & Marca com logo e paleta de cores
- [ ] Tokens: Espaçamento, Cores, Tipografia e Ícones documentados
- [ ] Cada componente do projeto tem sua página na Biblioteca UI
- [ ] Cada página de componente segue o padrão: Preview + Estados + Efeitos + Do/Don't
- [ ] Templates & Páginas com exemplos funcionais
- [ ] Manual de IA na Documentação com tech stack e regras de uso
- [ ] Design System usa os próprios tokens do projeto (come o próprio remédio)
- [ ] Responsivo: funciona em desktop (mínimo 1280px)
- [ ] Dark mode: se o projeto suporta, o Design System também

---

## EXEMPLO DE IMPLEMENTAÇÃO — PÁGINA DE BOTÕES

```tsx
// /design/components/buttons

export default function ButtonsPage() {
  return (
    <div>
      <PageHeader
        breadcrumb="BIBLIOTECA UI / BOTÕES"
        title="Botões"
        description="[Filosofia dos botões no seu projeto. Ex: 'A hierarquia clara de ações guia o usuário sem ambiguidade.']"
      />

      <ComponentSection title="Variantes Principais">
        {/* Renderize todas as variantes do seu Button component */}
        <Button variant="primary">Ação Principal</Button>
        <Button variant="secondary">Secundário</Button>
        <Button variant="outline">Outline</Button>
        <Button variant="ghost">Ghost</Button>
        <Button variant="destructive">Deletar</Button>
      </ComponentSection>

      <ComponentSection title="Tamanhos">
        <Button size="sm">Pequeno</Button>
        <Button size="md">Médio</Button>
        <Button size="lg">Grande</Button>
      </ComponentSection>

      <ComponentSection title="Estados">
        <Button disabled>Desabilitado</Button>
        <Button loading>Carregando...</Button>
        <Button onClick={handleClick}>Clique para Testar</Button>
      </ComponentSection>

      <GuidelinesSection
        dos={[
          {
            title: "Hierarquia Visual",
            description: "Use apenas um botão primário por tela. Use variantes secundárias para ações de suporte."
          },
          {
            title: "Verbos de Ação",
            description: "Comece com verbos fortes: 'Criar', 'Salvar', 'Enviar'. Evite 'Ok' ou 'Sim'."
          }
        ]}
        donts={[
          {
            title: "Muitos Primários",
            description: "Não coloque vários botões primários lado a lado. Isso confunde a decisão do usuário."
          },
          {
            title: "Tamanhos Misturados",
            description: "Mantenha consistência de tamanho — não misture 'sm' e 'lg' na mesma linha de ação."
          }
        ]}
      />
    </div>
  )
}
```

---

*Metodologia baseada na estrutura do Design System da Academia Lendária por Alan Nícolás.*
*Versão 1.0 — Adaptável a qualquer stack: React, Next.js, Vue, Svelte, etc.*
