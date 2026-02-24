# Design System — Academia Lendária (Alan Nícolás)

> Documentação completa do Design System "DOMINUS" usado na plataforma Academia Lendária.
> Baseado na análise do vídeo e do site https://www.academialendaria.ai/
> URL local do sistema: `localhost:5173/design/[secao]`

---

## IDENTIDADE & MARCA

### Nome e Posicionamento
- **Plataforma:** Academia Lendária
- **Tagline:** "Crie o Lendário" / "Um ecossistema de design feito para precisão e performance"
- **Persona:** Minimalist Luxury — alta precisão, fundo escuro profundo, luxo sutil
- **Público:** Empreendedores digitais, criadores de conteúdo, profissionais de negócios online

### Paleta de Cores

#### Cores Primitivas
| Token | Nome | Hex/HSL | Uso |
|-------|------|---------|-----|
| `--primary` | Brand Gold | `#C9B298` / hsl equivalente | CTAs principais, destaques, elementos de alta conversão |
| `--background` | Deep Black | `#0a0a0a` | Fundo principal |
| `--surface` | Surface Dark | `zinc-900` / `#18181b` | Cards, containers |
| `--surface-2` | Surface Elevated | `zinc-800/50` | Cards elevados, hovers |
| `--border` | Border Subtle | `zinc-800` / `#27272a` | Bordas de cards e separadores |
| `--text-primary` | Text Primary | branco / `#fafafa` | Títulos, texto principal |
| `--text-muted` | Text Muted | `zinc-400` / `#a1a1aa` | Subtítulos, descrições, breadcrumbs |
| `--success` | Success Green | verde | Banners de sucesso, estados positivos |
| `--error` | Error Red | vermelho | Banners de erro, estados críticos |
| `--warning` | Warning Amber | âmbar | Alertas, estados de atenção |

#### Regra dos 8%
> O Gold (`#C9B298`) é usado com **parcimônia** — no máximo 8% da interface. Ele aparece em: botão CTA principal, destaques de ranking, badges "Novo", acentos de tipografia em landing pages.

### Tipografia

| Uso | Fonte | Peso | Tamanho |
|-----|-------|------|---------|
| UI / Headings | **Inter** (sans-serif) | Bold / Semibold | H1: 32px, H2: 24px, H3: 20px |
| Body text / Elegante | **Source Serif 4** (serif) | Regular | 16px |
| Labels / Micro-copy | **Inter** | Medium | 12-14px |
| Breadcrumbs / Tags | **Inter** | Regular | 11-12px, uppercase |

### Estética "Legendary"
- **Minimalist Luxury:** Alto whitespace, sombras sutis, sem excesso de elementos
- **Corner Smoothing:** Preferência por `rounded-xl` em cards, `rounded-md` em controles pequenos
- **Dark Mode First:** O sistema é projetado para dark mode como padrão
- **Liquid Shimmer:** Efeito padrão de hover em botões — animação suave de shimmer
- **Glow Effect:** Efeito brilho colorido em elementos de alta conversão (variant="glowing")

---

## TECH STACK

```
- React 18+ (TypeScript)
- Tailwind CSS 3.4
- Radix UI Primitives
- Icons: Custom component (Flaticon UIcons wrapper)
  → NÃO usar Lucide ou FontAwesome diretamente
  → Sempre: import { Icon } from '@/components/ui/icon'
- Fonts: 'Inter' (sans-serif) + 'Source Serif 4' (serif)
- Gráficos: SVG nativo (zero dependências externas)
```

---

## NAVEGAÇÃO DO DESIGN SYSTEM

### Top Navbar
```
⊗ Lendár[IA]OS         Visão Geral  |  Identidade & Marca  |  Tokens  |  Biblioteca UI ▾  |  Templates & Páginas ▾  |  Documentação    🔔
                SUBSEÇÃO ATUAL
```

### Dropdown — Biblioteca UI
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
├── Interações Avançadas
├── Grafos (Redes)
└── Charts (KPIs)
```

### Dropdown — Templates & Páginas
```
Templates & Páginas
├── SAAS / APP
│   ├── CMS / Blog Manager
│   ├── Kanban / Projetos
│   ├── Configurações / Perfil
│   └── Sidebar (Legacy)
├── MARKETING TEMPLATES
│   ├── Guia de Copywriting
│   ├── Landing Page
│   ├── Advertorial
│   ├── Página de Vendas
│   ├── Baixar Ebook
│   ├── Página VSL (Vídeo)
│   ├── Registro Webinário
│   └── Obrigado / Upsell
└── COMUNIDADE LENDÁRIA
    ├── Captura Comunidade
    ├── Advertorial Comunidade
    ├── PV Comunidade
    ├── VSL Comunidade
    └── Sequência de Emails
```

---

## TOKENS

### Espaçamentos — Grid de 8px
| px | Classe Tailwind |
|----|----------------|
| 4px | `p-1` / `gap-1` |
| 8px | `p-2` / `gap-2` |
| 16px | `p-4` / `gap-4` |
| 24px | `p-6` / `gap-6` |
| 32px | `p-8` / `gap-8` |
| 40px | `p-10` / `gap-10` |
| 48px | `p-12` / `gap-12` |
| 64px | `p-16` / `gap-16` |
| 88px | `p-20` / `gap-20` |
| 96px | `p-24` / `gap-24` |
| 128px | `p-32` / `gap-32` |

> "A consistência visual nasce da precisão matemática. Utilizamos um grid de 8px."

### Ícones — Flaticon UIcons (agrupados por categoria)

**USUÁRIOS:**
`user` `gears` `users-alt` `user-edit` `user-time` `id-badge` `address-book` `following` `circle-user` `portrait`

**CONHECIMENTO E EDUCAÇÃO:**
`graduation-cap` `book` `book-stack` `book-clt` `book-open-cover` `library` `award` `medal` `trophy` `brain` `brain-circuit`

**GERAL E OBJETOS:**
`calendar` `clock` `sun` `moon` `folder` `document` `shield-check` `shield` `magic-wand` `star` `heart` `diamond` `crown` `key` `gift` `route` `map-marker` `info` `exclamation` `exclamation-tr` `interrogation` `circle-question` `zip` `bolt` `bulb` `lightbulb` `pen-nib` `robot`

**Redes & Marcas (Simple Icons) — SVG Paths:**
```tsx
<SocialIcon name="github" />
<SocialIcon name="linkedin" />
<SocialIcon name="twitter" />    // X
<SocialIcon name="instagram" />
<SocialIcon name="youtube" />
<SocialIcon name="facebook" />
<SocialIcon name="tiktok" />
<SocialIcon name="whatsapp" />
<SocialIcon name="discord" />
<SocialIcon name="telegram" />
<SocialIcon name="twitch" />
<SocialIcon name="spotify" />
<SocialIcon name="apple" />
<SocialIcon name="google" />
```

---

## BIBLIOTECA UI

### Botões (`/design/components/buttons`)

**Variantes:**
| Variante | Uso | Estilo visual |
|----------|-----|---------------|
| `primary` (Gold) | CTA principal — 1 por tela | Fundo `brand-gold`, texto escuro |
| `secondary` | Ações de suporte | Fundo secundário |
| `outline` | Ações alternativas | Borda visível, fundo transparente |
| `ghost` | Ações terciárias | Sem borda, hover sutil |
| `destructive` | Deletar, ações irreversíveis | Vermelho |

**Efeitos Especiais (Lendários):**
- `variant="glowing"` — Sombra colorida suave para alta conversão em fundo escuro
- **Shimmer (Default Hover)** — Efeito "liquid shimmer" no hover em todos os botões padrão

**Estados:**
```tsx
<Button disabled>Desabilitado</Button>          // opacity 50%
<Button loading>Processing</Button>              // spinner animado
<Button onClick={fn}>Clique para Carregar</Button>  // estado interativo
```

**Diretrizes:**
- ✅ **DO:** Use 1 botão primário (Gold) por tela/seção. Comece com verbos: "Criar", "Salvar", "Enviar"
- ❌ **DON'T:** Não coloque vários botões Gold lado a lado. Não misture tamanhos na mesma linha

---

### Componentes Básicos (`/design/components/basics`)

**Avatars:**
```tsx
// Pilha de avatares sobrepostos
<AvatarStack users={users} max={3} label="Times" />
<AvatarStack users={onlineUsers} showStatus label="Online" />
```

**Accordion:**
```tsx
// FAQ padrão
<Accordion type="faq">
  <AccordionItem question="O que é a Academia Lendária?" />
</Accordion>

// Módulos de curso [tag: FAQ & Módulos]
<Accordion type="modules">
  <AccordionItem title="MÓDULO 01" subtitle="Fundamentos da IA" />
  <AccordionItem title="MÓDULO 02" subtitle="Aplicações de Negócio" />
</Accordion>
```

**Scroll Area:**
```tsx
// Conteúdo longo em espaço limitado
<ScrollArea height="300px">
  <TermsOfService />
</ScrollArea>

// Lista compacta com muitos itens
<ScrollArea>
  <TagList tags={tags} />  // mostra contagem: "Tag #1 — 100 itens"
</ScrollArea>
```

---

### Cards & Boxes (`/design/components/cards`)

**CTA Card:**
```tsx
// Focado em conversão — footer com botões de alta prioridade
<Card variant="cta">
  <CardHeader icon={<Icon name="info" />}>Conceito Lendário</CardHeader>
  <CardContent>Minimalismo estrutural. Componentes isolados com responsabilidade única.</CardContent>
  <CardFooter>
    <Link>Saiba mais →</Link>
  </CardFooter>
</Card>
```

**Variações:**
| Variante | Descrição | Caso de uso |
|----------|-----------|-------------|
| Default | Card padrão | Conteúdo geral |
| Centralizado | Conteúdo centralizado | Leads, anúncios breves |
| Sem Dados | Estado empty state | "Nenhum registro encontrado nesta categoria" |
| Top Bordered | Borda colorida no topo | Status/categoria (azul para info) |
| Scrollable | Corpo com scroll interno | Termos de uso, listas longas |

**Diretrizes:**
- ✅ **DO:** Agrupe informações relacionadas. Use `CardFooter` para ações. Otimize imagens (aspect-ratio fixo)
- ❌ **DON'T:** Não sobrecarregue um card com conteúdo demais. Não coloque Cards dentro de Cards

---

### Formulários (`/design/components/forms`)

**Primitivos & Controles:**

```
TEXTO                    SELEÇÃO                    CONTROLES
─────────────────────    ─────────────────────────  ─────────────────────
Input Padrão             Select Dropdown            Toggle Switch    ●─
Input com Ícone 🔍       Combobox (Search)          Slider Range  ───●──
Date Picker (Interativo) Radio Group (A / B)        Rating (Estrelas) ★★★★☆
                                                    Checkbox simples  ☑
```

**Chat Input (Autosize):**
```tsx
// Textarea que cresce automaticamente ao digitar
// Com botão de envio integrado no canto
<ChatInput
  placeholder="Envie uma mensagem para a IA..."
  onSubmit={handleSubmit}
/>
```

**Agendamento & Datas:**
```tsx
<DatePicker interactive />    // Calendário Janeiro 2026 com seleção
<SchedulingCard
  title="Agendar Mentoria"
  description="Selecione sua sessão com a IA."
/>
```

---

### Tabelas (`/design/components/tables`)

**Ranking (Clássica):** [tag: Gamificação]
```
POS.  CONTRIBUIDOR              PROMPTS APROVADOS  SCORE MÉDIO  VISITAS  FAVORITOS  AVALIAÇÕES
🥇1°  Day Cavalcanti            5                  220          244      5          3
🥈2°  Lucas Charão              6                  164          260      2          0
🥉3°  Alan Nicolas              4                  125          164      1          0
```

**Histórico Financeiro:**
```
FATURA   STATUS       MÉTODO           DATA        VALOR
INV001   ✅ Pago      💳 Cartão        22/10/2023  R$ 250,00
INV002   ⏳ Pendente  🔷 PIX           23/10/2023  R$ 1.500,00
INV003   ❌ Cancelado 📄 Boleto         15/10/2023  -R$ 50,00
                                        Total:      R$ 1.750,00
```

---

### Estados & Loading (`/design/components/states`)

> "Gerenciando a expectativa do usuário durante latência, ausência de dados e falhas."

**Skeletons:**

```tsx
// Dashboard & Analytics
<SkeletonDashboard />  // 4 KPI cards + gráfico de barras

// Interface de Chat — IA Thinking
<SkeletonChat
  message="Crie uma estratégia de lançamento para um produto digital."
  thinking="Pensando..."
/>
```

**Banners de Estado:**
```tsx
<AlertBanner variant="error">
  Falha ao conectar com o servidor neural. Verifique suas credenciais de API.
</AlertBanner>

<AlertBanner variant="success">
  Transação concluída com êxito. O recibo foi enviado por email.
</AlertBanner>
```

---

### Feedback (`/design/components/feedback`)

**Modais:**
| Tipo | Descrição |
|------|-----------|
| Cookies (Filled) | Consentimento de cookies com fundo preenchido |
| Image Top | Modal com imagem no topo |
| Switch Settings | Modal para alternar configurações |
| Transacional | Confirmar/Cancelar ações importantes |
| Informativo (Terms) | Exibir termos longos |
| Formulário (Edit) | Edição inline via modal |
| Sucesso (Action) | Confirmação de ação bem-sucedida |
| Crítico (Delete) | Confirmação de exclusão irreversível |

**Toasts:**
```tsx
toast.success("Ação concluída com êxito.")
toast.warning("Atenção: isso pode ter impacto.")
toast.error("Erro ao processar a solicitação.")
toast.default("Notificação padrão do sistema.")
```

**Tooltips:**
```tsx
<Tooltip content="Termo Técnico: Explicação contextual">
  <span>Termo Técnico</span>
</Tooltip>
<Tooltip content="Alan Nicolas — CEO & Chief Strategist">
  <Avatar initials="AN" />
</Tooltip>
<Tooltip content="Sistema Online">
  <StatusDot variant="online" />
</Tooltip>
```

---

### Grafos / Redes (`/design/components/graphs`)

**Grafo Radial:**
```tsx
// Ideal para hierarquias profundas e mapas mentais
// Diferente da árvore tradicional — aproveita melhor o espaço radial
<RadialGraph
  center="CORE"
  nodes={[
    { id: "marketing", label: "Marketing", children: ["Item 1", "Item 2", "Item 3"] },
    { id: "cultura", label: "Cultura", color: "red" },
    { id: "estrategia", label: "Estratégia" },
    { id: "tecnologia", label: "Tecnologia", color: "blue" },
  ]}
/>
```

**Cérebro Digital:** [tag: Digital Brain]
```tsx
// "Second Brain" — fundo escuro profundo para análises prolongadas
// Alto contraste + Efeito Glow (Neon) + Animação "Drift"
<DigitalBrain
  centerLabel="LENDARIA"
  nodes={knowledgeNodes}
  variant="dark"
/>
```

---

### Charts / KPIs (`/design/components/charts`)

> "Gráficos de negócio otimizados para rápida leitura. Utilizam SVG nativo para performance máxima e zero dependências."

```tsx
// Gráfico de Barras — Receita Semanal
<BarChart
  title="Receita Semanal"
  subtitle="Comparativo últimos 7 dias"
  badge="+12.5%"
  data={weeklyRevenue}
  xAxis={["SEG","TER","QUA","QUI","SEX","SÁB","DOM"]}
/>

// Gráfico de Linha — Crescimento
<LineChart
  title="Crescimento de Usuários"
  subtitle="Curva de adoção mensal"
  legend={[{ label: "Pro", color: "accent" }]}
  data={userGrowth}
/>

// Donut Chart — Distribuição
<DonutChart
  title="Distribuição de Tráfego"
  subtitle="Fontes de aquisição"
  segments={[
    { label: "Orgânico", value: 40, color: "primary" },
    { label: "Social", value: 25, color: "muted" },
    { label: "Ads", value: 20, color: "success" },
    { label: "Direto", value: 15, color: "warning" },
  ]}
/>

// KPI Cards
<KPICard label="CHURN RATE" value="1.2%" delta="-0.4% vs mês anterior" trend="up" />
<KPICard label="LTV MÉDIO" value="R$ 890" delta="+5.2% vs mês anterior" trend="up" />
<KPICard label="META ANUAL" value="82%" progress={82} />
```

---

## TEMPLATES & PÁGINAS

### Kanban / Projetos (`/design/templates/kanban`)
```
Board de Tarefas                Sprint 42     [Avatares AN JE TF +1]  [🔽]  [+ Nova Tarefa]

BACKLOG (↕)          EM PRODUÇÃO (↕)          REVISÃO (↕)           CONCLUÍDO (↕)
───────────────────  ───────────────────────  ──────────────────    ──────────────────
[Marketing]          [Design]                 [Vídeo]               [Dev]
Pesquisa de Keywords Criar wireframes do      Vídeo de Vendas (V1)  Setup Inicial
  AN    💬2 📎4 👁4   Dashboard (thumb Netflix)  AN    💬2 👁4         TR

[Design]             [Dev]                                          [Design]
Definir Paleta       Integração com Stripe    + Criar nova tarefa   Briefing...
  JD    💬2 📎4 👁4     TR    💬4 👁4                                  AN

[Copywriting]        + Criar nova tarefa                            [Infra]
Escrever Copy da LP                                                 Compra de...
  AN AN  💬2 📎4 👁4                                                   TR

[Dev]
Configurar DNS
  TR    💬2 📎4 👁4

+ Criar nova tarefa
```

### Landing Page Concept (`/design/templates/landing`)
```
[Hero]
  Crie o Lendário ★ Academia Lendária
  "Um ecossistema de design feito para precisão e performance"
  [Começar Agora] ← botão Gold

[Feature Section]
  ✦ NOVO RECURSO
  Sincronize com Inteligencia.
  Em ambas direções.
  Gerencie suas tarefas de forma eficiente com sincronização
  bidirecional inteligente. Use nossa plataforma como front-end
  avançado para seus projetos e issues.
```

---

## DOCUMENTAÇÃO — MANUAL DE IA

```markdown
## Tech Stack
- React 18+ (TypeScript)
- Tailwind CSS 3.4
- Radix UI Primitives
- Icons: Custom component (Flaticon UIcons wrapper). DO NOT use Lucide or FontAwesome directly.
- Fonts: 'Inter' (sans-serif) para UI/Headings, 'Source Serif 4' (serif) para body text e textos elegantes

## Design Token Implementation
- Primary Color: "brand-gold" / hsl(var(--primary)) → #C9B298
- Border Radius: 'rounded-xl' para cards/containers, 'rounded-md' para small controls
- Spacing: Use múltiplos de 4 (p-4, p-8, gap-6)
- Dark Mode: Agnostic 'dark:' classes support is mandatory

## Component Usage Rules
1. **Buttons**: ALWAYS use `import { Button } from '@/components/ui/button'`
   - Primary: Gold background
   - Secondary: zinc-800 background
   - Ghost: transparent, hover sutil
2. **Icons**: ALWAYS use `import { Icon } from '@/components/ui/icon'`
   - Use: `<Icon name="brain" size="md" />`
   - Do NOT import from flaticon or other libraries directly
3. **Typography**:
   - H1-H3 (UI/Headings): font-sans font-bold
   - Body/Paragraphs (elegante): font-serif
   - Micro-copy/Labels: font-sans font-medium text-zinc-400
4. **Card Pattern**:
   <Card>
     <CardHeader>...</CardHeader>
     <CardContent>...</CardContent>
     <CardFooter>...</CardFooter>
   </Card>
5. **Social Icons**: `import { SocialIcon } from '@/components/ui/social-icon'`
   - Use: `<SocialIcon name="github" />`

## "Legendary" Aesthetic Rules
- **Minimalist Luxury**: High whitespace, subtle shadows, never cluttered
- **8% Color Rule**: Use Gold (#C9B298) sparingly — only for primary CTAs and key highlights
- **Corner Smoothing**: Always prefer rounded-xl for cards, rounded-md for inputs
- **Shimmer Default**: All buttons have liquid shimmer hover effect by default
- **Dark First**: Design for dark mode first, ensure light mode compatibility

## Behavior Rules
- If creating a new component, always implement dark: variants
- Always implement responsive breakpoints (sm, md, lg, xl)
- Ensure accessibility: aria-labels, keyboard navigation, focus states
- Button hierarchy per screen: max 1 primary (Gold) + multiple secondary/ghost
```

---

## IDENTIDADE DA PLATAFORMA — LENDÁR[IA]OS

O logo do sistema interno usa a tipagem estilizada: **Lendár[IA]OS**
- "IA" em destaque visual (indica Inteligência Artificial integrada)
- Ícone circular com símbolo ⊗ (usado no canto superior esquerdo das páginas do app)

### Sidebar Principal do App (separada do Design System)
```
⊗ Lendár[IA]OS  ×

Biblioteca
Área do Aluno
Desafios
Comunidade

TEAM
├── Academia
│   ├── Mentes Sintéticas
│   └── Identidade
│       ├── Design System  ← acesso ao Design System
│       ├── Identidade Visual
│       ├── Hall da Fama
│       └── Banco de Mídia
├── Criação & Conteúdo
├── Tráfego & Conversão
└── Vendas & Clientes
    ├── Sales AI
    ├── Lançamentos
    ├── CRM
    └── Previsão de Churn
Equipe & Cultura
Operações
Database Explorer

[Avatar] Alan Nicolas
         alan@alannícolas.com
```

---

*Design System "DOMINUS" — Academia Lendária by Alan Nícolás*
*Documentado por análise de vídeo + site https://www.academialendaria.ai/*
