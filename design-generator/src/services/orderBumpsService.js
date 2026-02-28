import { supabase } from '../lib/supabase';
import { callClaude, LLM_MODELS } from './claude';

// ─── Supabase CRUD ────────────────────────────────────────────────────────────

export async function saveOrderBumps(landingPageId, landingPageName, orderBumps) {
    const rows = orderBumps.map(ob => ({
        landing_page_id: landingPageId,
        landing_page_name: landingPageName,
        nome: ob.nome,
        descricao: ob.descricao || '',
        preco: parseFloat(ob.preco) || 0,
        copy_checkout: ob.copyCheckout || '',
        entregaveis: ob.entregaveis || '',
        categoria: ob.categoria || 'complementar',
        status: 'approved',
    }));

    const { data, error } = await supabase
        .from('order_bumps')
        .insert(rows)
        .select();

    if (error) throw error;
    return data;
}

export async function fetchOrderBumpsByLp(landingPageId) {
    const { data, error } = await supabase
        .from('order_bumps')
        .select('*')
        .eq('landing_page_id', landingPageId)
        .eq('status', 'approved')
        .order('created_at', { ascending: true });

    if (error) throw error;
    return data || [];
}

export async function fetchAllOrderBumps() {
    const { data, error } = await supabase
        .from('order_bumps')
        .select('*')
        .eq('status', 'approved')
        .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
}

export async function deleteOrderBump(id) {
    const { error } = await supabase
        .from('order_bumps')
        .delete()
        .eq('id', id);

    if (error) throw error;
}

// ─── AI Generation ────────────────────────────────────────────────────────────

const CLAUDE_MODEL = LLM_MODELS[0].id; // Claude Sonnet

function buildOrderBumpPrompt(lpHtml, count = 7, existingOBs = []) {
    const cleanHtml = lpHtml
        .replace(/<svg\b[^>]*>[\s\S]*?<\/svg>/gi, '')
        .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, '')
        .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '')
        .replace(/<!--[\s\S]*?-->/g, '')
        .replace(/\s+style="[^"]*"/gi, '')
        .replace(/\s+class="[^"]*"/gi, '')
        .replace(/\s+data-[a-z-]+="[^"]*"/gi, '')
        .replace(/\s{2,}/g, ' ')
        .replace(/<(div|span|p)>\s*<\/\1>/gi, '');

    const truncated = cleanHtml.length > 200000
        ? cleanHtml.substring(0, 200000) + '\n... [HTML truncado]'
        : cleanHtml;

    const existingNote = existingOBs.length > 0
        ? `\n\nORDER BUMPS JÁ APROVADOS (NÃO repita estes, sugira algo DIFERENTE):\n${existingOBs.map((ob, i) => `${i + 1}. ${ob.nome} (R$${ob.preco}) — ${ob.descricao}`).join('\n')}`
        : '';

    const systemPrompt = `Você é um ESTRATEGISTA DE INFOPRODUTOS BÍBLICOS especialista em Order Bumps de alta conversão.

Order Bumps são produtos complementares de baixo valor (R$7 a R$19) que aparecem no checkout.
Eles DEVEM ser complementares ao produto principal — algo que ENRIQUECE a experiência do comprador.

REGRAS PARA BONS ORDER BUMPS:
- Complementar ao produto principal (nunca competir)
- Baixo ticket: R$7 a R$19
- Fácil de produzir (ebooks curtos, guias visuais, checklists, mapas, wallpapers, flashcards)
- Copy de checkout deve ser CURTA e urgente (1-2 frases)
- Entregáveis devem ser concretos e quantificáveis
- Categorias válidas: "complementar" | "aprofundamento" | "ferramenta" | "visual" | "devocional"

RETORNE um JSON com exatamente ${count} order bumps:
{
  "orderBumps": [
    {
      "nome": "Nome do Order Bump",
      "descricao": "Descrição em 2-3 frases do que é o produto",
      "preco": 9.90,
      "copyCheckout": "Copy curta e urgente para exibir no checkout (1-2 frases)",
      "entregaveis": "Lista concreta do que o cliente recebe (ex: 1 PDF de 20 páginas, 30 imagens HD...)",
      "categoria": "complementar",
      "raciocinio": "Por quê este OB faz sentido estrategicamente para este produto"
    }
  ]
}

CRÍTICO: Retorne APENAS JSON válido. Cada order bump deve ser ÚNICO e genuinamente útil.`;

    const userPrompt = `Analise esta Landing Page e sugira ${count} Order Bumps complementares ao produto principal:${existingNote}

HTML DA LANDING PAGE:
${truncated}`;

    return { systemPrompt, userPrompt };
}

export async function generateOrderBumps(lpHtml, count = 7, existingOBs = [], onProgress) {
    if (onProgress) onProgress({ phase: 'generating', message: '🧠 Claude analisando a LP e criando sugestões...', percentage: 20 });

    const { systemPrompt, userPrompt } = buildOrderBumpPrompt(lpHtml, count, existingOBs);
    const raw = await callClaude(systemPrompt, userPrompt, CLAUDE_MODEL);

    if (onProgress) onProgress({ phase: 'parsing', message: '📋 Processando sugestões...', percentage: 80 });

    let parsed;
    if (typeof raw === 'string') {
        try {
            parsed = JSON.parse(raw.replace(/```json?\s*/g, '').replace(/```/g, '').trim());
        } catch {
            const match = raw.match(/\{[\s\S]*\}/);
            parsed = match ? JSON.parse(match[0]) : null;
        }
    } else {
        parsed = raw;
    }

    const orderBumps = parsed?.orderBumps || [];

    if (onProgress) onProgress({ phase: 'done', message: `✅ ${orderBumps.length} Order Bumps gerados!`, percentage: 100 });

    return orderBumps;
}

export async function generateSingleReplacement(lpHtml, existingOBs, onProgress) {
    if (onProgress) onProgress({ phase: 'replacing', message: '🔄 Gerando Order Bump substituto...', percentage: 50 });

    const bumps = await generateOrderBumps(lpHtml, 1, existingOBs);
    return bumps[0] || null;
}
