import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const OPENROUTER_API_KEY = Deno.env.get('OPENROUTER_API_KEY')!;
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const WEBHOOK_SECRET = Deno.env.get('WHATSAPP_WEBHOOK_SECRET') ?? '';

// Seu número no formato: 5511999999999@s.whatsapp.net
// Só mensagens enviadas para você mesmo (self-chat) viram tarefas
const SELF_JID = Deno.env.get('WHATSAPP_SELF_JID') ?? '';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function classifyWithAI(message: string): Promise<{ isTask: boolean; taskText: string }> {
  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'anthropic/claude-haiku-4-5',
      messages: [
        {
          role: 'system',
          content: `Você é um assistente que analisa mensagens e decide se são tarefas a fazer.

Responda APENAS com JSON válido neste formato:
{"isTask": true/false, "taskText": "texto limpo da tarefa ou vazio se não for tarefa"}

Regras:
- isTask=true: a mensagem expressa algo a ser feito (comprar, ligar, enviar, agendar, pagar, estudar, etc.)
- isTask=true: lembretes, compromissos, afazeres
- isTask=false: conversas, perguntas, opiniões, comentários, conteúdo aleatório
- taskText: versão limpa e direta da tarefa (remova "preciso", "tenho que", "lembrar de", etc.)
- taskText deve ser conciso e no infinitivo quando possível`,
        },
        {
          role: 'user',
          content: `Mensagem: "${message}"`,
        },
      ],
      max_tokens: 100,
      temperature: 0.1,
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenRouter error: ${response.status}`);
  }

  const data = await response.json();
  const content = data.choices[0].message.content.trim();

  // Extrai JSON da resposta (às vezes vem com ```json ```)
  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('Resposta da IA sem JSON válido');

  return JSON.parse(jsonMatch[0]);
}

function extractMessageText(body: Record<string, unknown>): string | null {
  try {
    const data = body.data as Record<string, unknown>;
    if (!data) return null;

    // Filtra: só mensagens enviadas pelo próprio usuário (fromMe)
    const key = data.key as Record<string, unknown>;
    if (!key?.fromMe) return null;

    const remoteJid = key.remoteJid as string;

    // Filtra: só self-chat (mensagens enviadas para o próprio número)
    if (SELF_JID && remoteJid !== SELF_JID) return null;

    // Ignora mensagens de status/broadcast
    if (remoteJid?.includes('status@broadcast')) return null;
    if (remoteJid?.includes('newsletter')) return null;

    const message = data.message as Record<string, unknown>;
    if (!message) return null;

    // Tipos de mensagem suportados
    return (
      (message.conversation as string) ||
      (message.extendedTextMessage as Record<string, unknown>)?.text as string ||
      null
    );
  } catch {
    return null;
  }
}

serve(async (req) => {
  // Health check
  if (req.method === 'GET') {
    return new Response(JSON.stringify({ status: 'ok', service: 'whatsapp-webhook' }), {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  // Validação do secret (opcional mas recomendado)
  if (WEBHOOK_SECRET) {
    const authHeader = req.headers.get('apikey') || req.headers.get('authorization') || '';
    if (!authHeader.includes(WEBHOOK_SECRET)) {
      return new Response('Unauthorized', { status: 401 });
    }
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return new Response('Invalid JSON', { status: 400 });
  }

  // Só processa eventos de mensagem
  const event = body.event as string;
  if (!event?.includes('messages')) {
    return new Response(JSON.stringify({ skipped: true, reason: 'not a message event' }), {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const messageText = extractMessageText(body);
  if (!messageText || messageText.trim().length === 0) {
    return new Response(JSON.stringify({ skipped: true, reason: 'no text or not fromMe' }), {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // IA classifica se é tarefa
  let classification: { isTask: boolean; taskText: string };
  try {
    classification = await classifyWithAI(messageText);
  } catch (err) {
    console.error('Erro na classificação IA:', err);
    return new Response(JSON.stringify({ error: 'AI classification failed' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  if (!classification.isTask || !classification.taskText.trim()) {
    return new Response(JSON.stringify({ skipped: true, reason: 'not a task', message: messageText }), {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Salva no Supabase
  const { data, error } = await supabase
    .from('todos')
    .insert({
      text: classification.taskText.trim(),
      done: false,
      source: 'whatsapp',
    })
    .select()
    .single();

  if (error) {
    console.error('Erro ao salvar todo:', error);
    return new Response(JSON.stringify({ error: 'Failed to save task' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  console.log(`✅ Tarefa criada via WhatsApp: "${classification.taskText}"`);

  return new Response(JSON.stringify({ success: true, task: data }), {
    status: 201,
    headers: { 'Content-Type': 'application/json' },
  });
});
