# WhatsApp → To-Do: Guia de Setup

Mensagens enviadas do seu WhatsApp pessoal são classificadas por IA e viram tarefas no Dashboard automaticamente.

## Como funciona

Você manda mensagem **para você mesmo** no WhatsApp (self-chat).
Só essas mensagens são processadas — nenhuma conversa com outras pessoas é capturada.

```
Você → (seu próprio número) → Evolution API → Supabase Edge Function → Claude IA → todos table → Dashboard
```

---

## 1. Rodar a Migration SQL

No Supabase Dashboard → SQL Editor, execute:

```sql
-- Ou aplique via: supabase db push
ALTER TABLE public.todos
  ADD COLUMN IF NOT EXISTS source text NOT NULL DEFAULT 'manual'
    CHECK (source IN ('manual', 'whatsapp'));
```

---

## 2. Deploy da Edge Function

### Configure os secrets no Supabase:

```bash
supabase secrets set OPENROUTER_API_KEY=sua_chave_aqui
supabase secrets set WHATSAPP_WEBHOOK_SECRET=uma_senha_secreta_qualquer

# Seu número — só mensagens enviadas para você mesmo viram tarefas
# Formato: código do país + DDD + número (sem +, sem espaços) + @s.whatsapp.net
# Exemplo Brasil: 5511999999999@s.whatsapp.net
supabase secrets set WHATSAPP_SELF_JID=55119999999999@s.whatsapp.net
```

### Deploy:

```bash
supabase functions deploy whatsapp-webhook
```

A URL pública será:
```
https://<seu-projeto>.supabase.co/functions/v1/whatsapp-webhook
```

---

## 3. Setup da Evolution API (Docker)

### Instalar e rodar:

```bash
docker run -d \
  --name evolution-api \
  -p 8080:8080 \
  -e AUTHENTICATION_API_KEY=minha_chave_evolution \
  atendai/evolution-api:latest
```

Acesse: http://localhost:8080

### Criar instância e conectar WhatsApp:

```bash
# Criar instância
curl -X POST http://localhost:8080/instance/create \
  -H "apikey: minha_chave_evolution" \
  -H "Content-Type: application/json" \
  -d '{"instanceName": "brugger", "qrcode": true}'

# Ver QR code para escanear
curl http://localhost:8080/instance/qrcode/brugger?image=true \
  -H "apikey: minha_chave_evolution"
```

Abra a imagem do QR code e escaneie pelo WhatsApp (Dispositivos Conectados).

### Configurar webhook para a Edge Function:

```bash
curl -X POST http://localhost:8080/webhook/set/brugger \
  -H "apikey: minha_chave_evolution" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://<seu-projeto>.supabase.co/functions/v1/whatsapp-webhook",
    "webhook_by_events": false,
    "webhook_base64": false,
    "events": ["MESSAGES_UPSERT"]
  }'
```

> **Nota:** A Evolution API precisa alcançar a URL da Edge Function.
> Se você rodar localmente e a Supabase Edge Function for remota, funciona normalmente.
> Se quiser tudo local (incluindo Edge Function), use `supabase functions serve` + ngrok.

---

## 4. Como usar no dia a dia

No WhatsApp, procure seu próprio nome/número nos contatos e mande mensagem para si mesmo.
É como um bloco de notas — tudo que você escrever lá passa pelo filtro da IA.

## 5. Testar

Mande mensagens **para o seu próprio número** no WhatsApp:

- ✅ `"Comprar café amanhã"` → vira tarefa: **"Comprar café"**
- ✅ `"Ligar pro médico na segunda"` → vira tarefa: **"Ligar pro médico"**
- ✅ `"Pagar conta do cartão"` → vira tarefa: **"Pagar conta do cartão"**
- ❌ `"Oi, tudo bem?"` → ignorado (não é tarefa)
- ❌ `"Que dia bonito"` → ignorado

Tarefas criadas via WhatsApp aparecem com o ícone verde 🟢 (WhatsApp) no Dashboard.

---

## Variáveis de Ambiente

| Variável | Onde configurar | Valor |
|----------|----------------|-------|
| `OPENROUTER_API_KEY` | Supabase secrets | Sua chave OpenRouter |
| `SUPABASE_URL` | Auto (Supabase injeta) | — |
| `SUPABASE_SERVICE_ROLE_KEY` | Auto (Supabase injeta) | — |
| `WHATSAPP_WEBHOOK_SECRET` | Supabase secrets | Senha para proteger o webhook |
| `WHATSAPP_SELF_JID` | Supabase secrets | Seu número: `55119999999999@s.whatsapp.net` |

---

## Troubleshooting

**Edge Function não recebe mensagens:**
- Verifique se a URL do webhook está correta
- Confirme que a instância Evolution está conectada (`/instance/connectionState/brugger`)

**Tarefa não é criada:**
- Verifique os logs: `supabase functions logs whatsapp-webhook`
- Confirme que `fromMe: true` na mensagem (só suas mensagens viram tarefas)

**IA classificou errado:**
- O modelo é `claude-haiku-4-5` (rápido e econômico)
- Para maior precisão, troque por `anthropic/claude-sonnet-4-5` no `index.ts`
