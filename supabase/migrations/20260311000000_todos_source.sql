-- Adiciona coluna source na tabela todos
-- Para distinguir tarefas criadas via WhatsApp vs manual
alter table public.todos
  add column if not exists source text not null default 'manual'
    check (source in ('manual', 'whatsapp'));

comment on column public.todos.source is 'Origem da tarefa: manual (app) ou whatsapp';
