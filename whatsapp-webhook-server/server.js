/**
 * whatsapp-webhook-server v2.0
 *
 * Usa whatsapp-web.js (sem Docker) para:
 * - Conectar seu WhatsApp pessoal via QR Code
 * - Monitorar mensagens enviadas para si mesmo (self-chat)
 * - Classificar com IA e salvar como tarefas no Supabase
 *
 * Porta: 3334
 * QR Code: salvo em ./qrcode.png (abra para escanear)
 */

const http = require('http');
const https = require('https');
const path = require('path');
const fs = require('fs');
const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode');

// ── Config ────────────────────────────────────────────────────────────────────
const PORT                 = 3334;
const OPENROUTER_API_KEY   = process.env.OPENROUTER_API_KEY;
const SUPABASE_URL         = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SELF_JID             = process.env.WHATSAPP_SELF_JID || ''; // 5521986536867@c.us

const QR_PNG_PATH = path.join(__dirname, 'qrcode.png');
const AUTH_PATH   = path.join(__dirname, '.wwebjs_auth');
const LOG_PATH    = path.join(__dirname, 'webhook.log');

// Log com flush imediato para arquivo
const logStream = fs.createWriteStream(LOG_PATH, { flags: 'a' });
function log(...args) {
  const msg = `[${new Date().toISOString()}] ${args.join(' ')}\n`;
  process.stdout.write(msg);
  logStream.write(msg);
}

let clientReady  = false;
let clientNumber = null;
let clientLid    = null; // LID capturado dos eventos @lid do próprio número

// Deduplicação: evita processar a mesma mensagem mais de uma vez
const processedIds = new Set();
function isDuplicate(msgId) {
  if (processedIds.has(msgId)) return true;
  processedIds.add(msgId);
  if (processedIds.size > 200) {
    const first = processedIds.values().next().value;
    processedIds.delete(first);
  }
  return false;
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function jsonRequest(url, options, body) {
  return new Promise((resolve, reject) => {
    const lib = url.startsWith('https') ? https : http;
    const req = lib.request(url, options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(data) }); }
        catch { resolve({ status: res.statusCode, body: data }); }
      });
    });
    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function classifyWithAI(message) {
  const res = await jsonRequest(
    'https://openrouter.ai/api/v1/chat/completions',
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
      },
    },
    {
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
        { role: 'user', content: `Mensagem: "${message}"` },
      ],
      max_tokens: 100,
      temperature: 0.1,
    }
  );

  if (res.status !== 200) throw new Error(`OpenRouter ${res.status}`);
  const content = res.body.choices[0].message.content.trim();
  const match = content.match(/\{[\s\S]*\}/);
  if (!match) throw new Error('IA não retornou JSON');
  return JSON.parse(match[0]);
}

async function replyAsZeus(userMessage) {
  const res = await jsonRequest(
    'https://openrouter.ai/api/v1/chat/completions',
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
      },
    },
    {
      model: 'anthropic/claude-haiku-4-5',
      messages: [
        {
          role: 'system',
          content: `Você é Zeus, assistente de IA integrado ao app Brugger CO.
Você responde mensagens do WhatsApp do próprio usuário (self-chat).
Seja direto, útil e conciso. Use linguagem casual em português.
Se a mensagem for uma tarefa/lembrete, confirme que foi salva no dashboard.
Se for uma pergunta, responda brevemente.
Máximo 3 linhas de resposta.`,
        },
        { role: 'user', content: userMessage },
      ],
      max_tokens: 200,
      temperature: 0.7,
    }
  );

  if (res.status !== 200) throw new Error(`OpenRouter ${res.status}`);
  return res.body.choices[0].message.content.trim();
}

async function saveTodo(text) {
  const res = await jsonRequest(
    `${SUPABASE_URL}/rest/v1/todos`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
        'apikey': SUPABASE_SERVICE_KEY,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation',
      },
    },
    { text, done: false, source: 'whatsapp' }
  );
  if (res.status !== 201) throw new Error(`Supabase ${res.status}: ${JSON.stringify(res.body)}`);
  return Array.isArray(res.body) ? res.body[0] : res.body;
}

// ── WhatsApp Client ───────────────────────────────────────────────────────────
const client = new Client({
  authStrategy: new LocalAuth({ dataPath: AUTH_PATH }),
  puppeteer: {
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--no-first-run',
      '--no-zygote',
      '--disable-gpu',
    ],
  },
});

client.on('qr', async (qr) => {
  log('[whatsapp] 📱 QR Code gerado! Abrindo para escanear...');
  try {
    await qrcode.toFile(QR_PNG_PATH, qr, { width: 400, margin: 2 });
    log(`[whatsapp] ✅ QR Code salvo em: ${QR_PNG_PATH}`);
    log('[whatsapp] Abra o arquivo ou acesse: http://localhost:3334/qrcode');
    const { exec } = require('child_process');
    exec(`start "" "${QR_PNG_PATH}"`, (err) => {
      if (!err) log('[whatsapp] QR Code aberto automaticamente.');
    });
  } catch (e) {
    log('[whatsapp] Erro ao salvar QR Code:', e.message);
  }
});

client.on('ready', () => {
  clientReady  = true;
  clientNumber = client.info.wid.user;
  log(`[whatsapp] ✅ Conectado! Número: ${clientNumber}`);
  log(`[whatsapp] Monitorando self-chat (${clientNumber}@c.us)`);
  if (fs.existsSync(QR_PNG_PATH)) fs.unlinkSync(QR_PNG_PATH);
});

client.on('authenticated', () => { log('[whatsapp] Autenticado.'); });
client.on('auth_failure',  (m) => { log('[whatsapp] Auth falhou:', m); });
client.on('disconnected',  (r) => { clientReady = false; log('[whatsapp] Desconectado:', r); });

// Processa mensagem (reutilizado em message e message_create)
async function handleMessage(message) {
  const bodyPreview = (message.body||'').slice(0,60);
  const msgType = message.type || '?';
  // Captura o próprio LID a partir de eventos @lid (mesmo sem body)
  const extractBase = (jid) => (jid || '').replace(/@[^@]+$/, '').replace(/:\d+$/, '');
  if (!clientLid && message.fromMe && (message.from || '').includes('@lid')) {
    const lid = extractBase(message.from);
    if (lid) { clientLid = lid; log(`[whatsapp] 📱 LID capturado: ${clientLid}`); }
  }

  if (!bodyPreview && msgType !== 'chat') return; // ignora silenciosamente eventos sem texto

  // Deduplicação: rejeita se já processamos este ID
  const msgId = message.id?._serialized || message.id;
  if (msgId && isDuplicate(msgId)) return;

  log(`[whatsapp] 📩 Evento — type:${msgType} fromMe:${message.fromMe} from:${message.from} to:${message.to} body:"${bodyPreview}"`);

  if (!message.fromMe) return;

  const myNumber = clientNumber || SELF_JID.replace(/@[^@]+$/, '');
  const toBase   = extractBase(message.to);
  const fromBase = extractBase(message.from);

  // Self-chat: AMBOS from e to devem ser identificadores do próprio usuário
  // (número de telefone OU LID capturado)
  const myIds    = new Set([myNumber, clientLid].filter(Boolean));
  const isGroup  = (message.to || '').includes('@g.us');
  const sameLid  = toBase !== '' && toBase === fromBase;
  const isSelfChat = !isGroup && (sameLid || (myIds.has(toBase) && myIds.has(fromBase)));

  if (!isSelfChat) {
    log(`[whatsapp] ⏭ Não é self-chat (to:${message.to} from:${message.from})`);
    return;
  }

  const text = (message.body || '').trim();
  if (!text) return;

  // Ignora respostas do próprio Zeus para evitar loop infinito
  if (text.startsWith('*Zeus*')) return;

  log(`[whatsapp] 💬 Self-message: "${text}"`);

  const selfChatId = `${clientNumber}@c.us`;

  // Classifica a mensagem com IA
  let classification;
  try {
    classification = await classifyWithAI(text);
    log(`[whatsapp] 🤖 IA: isTask=${classification.isTask} taskText="${classification.taskText}"`);
  } catch (err) {
    log('[whatsapp] Erro na IA:', err.message);
    return;
  }

  // Salva como tarefa se for o caso
  let savedTask = null;
  if (classification.isTask && classification.taskText?.trim()) {
    try {
      savedTask = await saveTodo(classification.taskText.trim());
      log(`[whatsapp] ✅ Tarefa criada: "${classification.taskText}"`);
    } catch (err) {
      log('[whatsapp] Erro ao salvar:', err.message);
    }
  }

  // Responde como Zeus no WhatsApp
  try {
    const zeusReply = await replyAsZeus(text);
    const prefix = savedTask ? `*Zeus*\n✅ Tarefa salva no dashboard!\n\n` : `*Zeus*\n`;
    await client.sendMessage(selfChatId, prefix + zeusReply);
    log(`[whatsapp] 📤 Zeus respondeu`);
  } catch (err) {
    log('[whatsapp] Erro ao responder:', err.message);
  }
}

// Escuta eventos (fallback para eventos que funcionarem)
client.on('message',        handleMessage);
client.on('message_create', handleMessage);

// ── Polling: verifica self-chat a cada 8 segundos ─────────────────────────────
// (fallback pois eventos do whatsapp-web.js podem não disparar em todos os ambientes)
let lastMessageId = null;
let pollingStarted = false;

async function pollSelfChat() {
  if (!clientReady || !clientNumber) return;
  try {
    const selfChatId = `${clientNumber}@c.us`;
    const chat = await client.getChatById(selfChatId);
    const messages = await chat.fetchMessages({ limit: 10 });

    // Na primeira execução, marca o ID mais recente como referência
    if (!pollingStarted) {
      const fromMe = messages.filter(m => m.fromMe);
      if (fromMe.length > 0) lastMessageId = fromMe[fromMe.length - 1].id._serialized;
      pollingStarted = true;
      log(`[whatsapp] 🔄 Polling iniciado. Última msg: ${lastMessageId || 'nenhuma'}`);
      return;
    }

    // Filtra mensagens novas (enviadas por mim, mais novas que o lastMessageId)
    const myMessages = messages.filter(m => m.fromMe);
    let foundNew = false;
    for (const msg of myMessages) {
      const msgId = msg.id._serialized;
      if (lastMessageId && msgId === lastMessageId) break;
      if (!foundNew) {
        // Nova mensagem encontrada — atualiza referência
        lastMessageId = myMessages[myMessages.length - 1].id._serialized;
        foundNew = true;
      }
      await handleMessage(msg);
    }
  } catch (err) {
    log('[whatsapp] Polling erro:', err.message);
  }
}

client.on('ready', () => {
  // Inicia polling após 3 segundos
  setTimeout(() => {
    pollSelfChat(); // primeira execução = baseline
    setInterval(pollSelfChat, 8000);
    log('[whatsapp] 🔄 Polling ativo (a cada 8s)');
  }, 3000);
});

// Inicializar cliente WhatsApp
log('[whatsapp] Inicializando cliente WhatsApp...');
client.initialize();

// ── Servidor HTTP ─────────────────────────────────────────────────────────────
const server = http.createServer((req, res) => {
  const send = (status, body, type = 'application/json') => {
    res.writeHead(status, { 'Content-Type': type });
    res.end(typeof body === 'string' ? body : JSON.stringify(body));
  };

  if (req.method === 'GET' && req.url === '/health') {
    return send(200, {
      status: 'ok',
      service: 'whatsapp-webhook',
      connected: clientReady,
      number: clientNumber,
      selfJid: SELF_JID || `${clientNumber}@c.us`,
    });
  }

  // Enviar mensagem para o self-chat
  if (req.method === 'POST' && req.url === '/send') {
    if (!clientReady) return send(503, { error: 'WhatsApp não conectado' });
    let body = '';
    req.on('data', c => body += c);
    req.on('end', async () => {
      try {
        const { text, to } = JSON.parse(body);
        const target = to || `${clientNumber}@c.us`;
        await client.sendMessage(target, text || 'Olá do Zeus! 👑');
        return send(200, { ok: true, to: target });
      } catch (e) {
        return send(500, { error: e.message });
      }
    });
    return;
  }

  // Servir QR Code como imagem
  if (req.method === 'GET' && req.url === '/qrcode') {
    if (fs.existsSync(QR_PNG_PATH)) {
      res.writeHead(200, { 'Content-Type': 'image/png' });
      return fs.createReadStream(QR_PNG_PATH).pipe(res);
    }
    if (clientReady) {
      return send(200, { message: 'Já conectado! Não precisa de QR Code.' });
    }
    return send(404, { message: 'QR Code ainda não gerado. Aguarde...' });
  }

  return send(404, { error: 'not found' });
});

server.listen(PORT, () => {
  console.log('╔══════════════════════════════════════╗');
  console.log('║  whatsapp-webhook-server v2.0        ║');
  console.log(`║  http://localhost:${PORT}             ║`);
  console.log('╚══════════════════════════════════════╝');
  console.log('');
  console.log('  GET /health   → status da conexão');
  console.log('  GET /qrcode   → QR Code para escanear');
  console.log('');
});
