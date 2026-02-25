# Pipeline de Produção de Entregáveis — ProductCreator

## Visão Geral

Este pipeline transforma um item do plano de produção (ebook_simples ou ebook_imagens)
em arquivos finais DOCX + PDF prontos para entrega ao cliente.

## Arquitetura

```
[PlanoTab] → botão "Criar" por item
     ↓
[WorkflowModal] — UI com progresso step-a-step
     ↓
productionWorkflowService.js  ← orquestrador
     ├── 1. promptGeneratorService.js  → gera o prompt ideal
     ├── 2. contentGeneratorService.js → Claude via OpenRouter → Markdown + [IMAGEM] blocks
     ├── 3. docxExportService.js       → DOCX inicial (sem imagens)
     ├── 4. (interno)                  → extrai blocos [IMAGEM]
     ├── 5. imageGeneratorService.js   → FLUX via OpenRouter → URLs de imagens
     ├── 6. docxExportService.js       → DOCX final com imagens inseridas
     └── 7. docxExportService.js       → PDF via jsPDF → downloads
```

## APIs Utilizadas

| Serviço | Endpoint | Modelo |
|---------|----------|--------|
| Texto (Claude) | `POST /api/v1/chat/completions` | `anthropic/claude-sonnet-4.6` |
| Imagens (FLUX) | `POST /api/v1/images/generations` | `black-forest-labs/flux-1.1-pro` |

**Base URL:** `https://openrouter.ai`
**Auth:** `VITE_OPENROUTER_API_KEY` (já presente no .env)

## Tipos de Entregável Suportados

| Tipo | Suporte | Imagens | Ferramenta |
|------|---------|---------|------------|
| `ebook_simples` | ✅ Completo | Sem imagens | Claude |
| `ebook_imagens` | ✅ Completo | FLUX geradas | Claude + FLUX |
| `ebook_slide` | 🔒 Futuro | — | Gamma.app |
| `videoaula` | 🔒 Futuro | — | NotebookLM |
| `audio` | 🔒 Futuro | — | NotebookLM |
| `checklist` | 🔒 Futuro | — | Claude |

## Formato dos Blocos [IMAGEM]

O Claude gera blocos especiais no Markdown para indicar onde inserir imagens:

```
[IMAGEM]
prompt: A serene biblical landscape at golden hour, warm light filtering through ancient olive trees
style: photorealistic, cinematic lighting, 16:9 aspect ratio
aspect: 16:9
[/IMAGEM]
```

Campos obrigatórios:
- `prompt`: Descrição da imagem **em inglês** para o FLUX
- `style`: Estilo visual e aspectos técnicos
- `aspect`: Proporção (16:9 para landscape, 1:1 para square, 2:3 para portrait)

## Formato de Chamada de Imagem (OpenRouter)

```js
POST https://openrouter.ai/api/v1/images/generations
Headers:
  Authorization: Bearer ${VITE_OPENROUTER_API_KEY}
  Content-Type: application/json

Body:
{
  "model": "black-forest-labs/flux-1.1-pro",
  "prompt": "...",
  "n": 1,
  "size": "1024x768"
}

Response:
{
  "data": [{ "url": "https://..." }]
}
```

## Template Visual do DOCX

### Estilos de Parágrafo
- **Heading1**: DM Serif Display 28pt, cor accent #C9A962, espaço após 12pt
- **Heading2**: DM Serif Display 20pt, cor #E0C070, espaço após 8pt
- **Heading3**: DM Sans 14pt Bold, cor #FAFAFA, espaço após 6pt
- **BodyText**: DM Sans 11pt, cor #1A1A1A, espaçamento 1.5, espaço após 8pt
- **BibleQuote**: DM Sans 11pt Itálico, indentado 1.5cm, borda dourada esquerda
- **BulletItem**: DM Sans 11pt, marcador •, indentado 1.2cm

### Layout da Página
- Tamanho: A4 (21cm × 29.7cm)
- Margens: 2.5cm top/bottom, 3cm left/right
- Cabeçalho: Nome do produto (exceto capa)
- Rodapé: Numeração centralizada

### Página de Capa
- Fundo: #0C0C0E (cinza escuro)
- Título: Branco centralizado, fonte grande
- Subtítulo: Dourado (#C9A962) centralizado
- Sem cabeçalho/rodapé

## Prompts de Geração de Conteúdo

### Modelo A — ebook_simples
```
Você é um especialista em infoprodutos bíblicos digitais.
Crie o conteúdo completo do [NOME DO PRODUTO] para [PÚBLICO-ALVO].

ESTRUTURA OBRIGATÓRIA:
# [Título]
## Módulo 1 — [Nome]
### [Subtópico]
[Conteúdo do subtópico...]

REGRAS:
- Mínimo X páginas (estimado)
- Tom: [ton definido]
- Linguagem: Português brasileiro acessível
- Baseado em versículos reais da Bíblia
- NÃO inventar citações bíblicas
- Citações no formato: "Texto" (Livro X:Y)
```

### Modelo B — ebook_imagens (adicional ao A)
```
IMAGENS:
- Insira blocos [IMAGEM]...[/IMAGEM] a cada 2-3 páginas
- Cada bloco deve ter: prompt (inglês), style, aspect
- Prompts devem ser evocativos, bíblicos, cinematográficos
- Estilo padrão: photorealistic, warm golden tones, cinematic
- Aspecto padrão: 16:9 (landscape)
```

## Estender para Novos Tipos

Para adicionar suporte a `checklist`:

1. Em `promptGeneratorService.js`: adicionar case `checklist` no switch
2. Em `productionWorkflowService.js`: no step 5, pular geração de imagens para checklist
3. Em `docxExportService.js`: adicionar parseamento do formato checklist específico
4. Em `ProductCreator.jsx`: remover `checklist` da lista de tipos desabilitados

## Tratamento de Erros

- **Falha no Claude**: Relança com mensagem clara, cancela workflow
- **Falha em imagem individual**: Log de aviso, continua com placeholder vazio
- **DOCX inválido**: Relança com sugestão de verificar conteúdo
- **AbortController**: Cada step verifica `signal.aborted` antes de executar

## Dependências

```json
{
  "docx": "^8.5.0",
  "jspdf": "^2.5.2"
}
```

`html2canvas` já está instalado no projeto.
