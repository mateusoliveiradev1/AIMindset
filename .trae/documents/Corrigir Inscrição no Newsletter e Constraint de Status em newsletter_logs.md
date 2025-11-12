## Análise do Erro
- O erro ocorre ao inserir em `newsletter_logs`: `violates check constraint 'newsletter_logs_status_check'`.
- Há inconsistência entre constraints do campo `status`:
  - `create_newsletter_logs_table.sql:27` permite `success | error | pending | failed`.
  - `create_newsletter_campaigns_and_templates.sql:37–39` redefine a constraint nomeada para `sent | failed | scheduled | draft`.
  - Migrações `024` e `025` recriam a tabela com `success | error | pending | failed` (`024_fix_newsletter_logs_structure.sql:36`, `025_fix_newsletter_logs_structure.sql:36`).
- Triggers de boas‑vindas inserem `status = 'sent'` (`create_welcome_trigger.sql:35`, `create_welcome_trigger_fixed.sql:32`), o que conflita com schemas que esperam `success | error | pending | failed`.
- O app consome `newsletter_logs` com `status: 'success' | 'error' | 'pending' | 'failed'` (`src/hooks/useNewsletterLogs.ts:20, 171–173, 192–194`).

## Estrutura Atual
- `newsletter_logs.status` tem múltiplas definições ao longo de migrações, gerando interseção restritiva entre checks se coexistirem no banco.
- Fluxo de inscrição:
  - UI valida e chama `subscribe(email)` (`src/hooks/useNewsletter.ts:541–567`).
  - Inserção em `newsletter_subscribers` dispara trigger `send_welcome_email` que insere log com `status='sent'` (`create_welcome_trigger_fixed.sql:32`).

## Estratégia de Correção
- Unificar o conjunto de valores válidos de `newsletter_logs.status` para o domínio de logs: `success | error | pending | failed`.
- Manter `sent | scheduled | draft` apenas em `newsletter_campaigns.status` (já está consistente).
- Garantir que triggers e qualquer inserção em `newsletter_logs` usem os valores do domínio de logs.
- Tornar o trigger resiliente: se o insert do log falhar, não interromper a inscrição.

## Implementação Técnica
1. Migração de Schema
- Remover a constraint nomeada atual `newsletter_logs_status_check` e criar uma única constraint nomeada com `CHECK (status IN ('success','error','pending','failed'))`.
- Verificar e remover qualquer `CHECK` inline remanescente para evitar múltiplas constraints sobre `status`.
- Confirmar a estrutura de `newsletter_logs` conforme migrações `024/025` (campos como `event_type`, `event_data`, etc.).

2. Ajuste de Trigger de Boas‑vindas
- Atualizar `send_welcome_email` para inserir em `newsletter_logs` usando o schema novo:
  - `event_type = 'subscriber_added'` ou `campaign_sent` conforme o caso.
  - `status = 'success'` ao enviar boas‑vindas; `status = 'error'` com `error_message` quando falhar.
  - `event_data` com email e campanha.
- Envolver o `INSERT` em bloco `BEGIN ... EXCEPTION WHEN others THEN RAISE NOTICE ...; RETURN NEW; END;` para não abortar a transação de inscrição.
- Opcional: marcar a função como `SECURITY DEFINER` se as políticas RLS bloquearem o insert do trigger.

3. Validação de Aplicação
- Adicionar util de validação de status para qualquer criação/atualização de logs no app, garantindo apenas valores do domínio de logs.
- Conferir que `useNewsletterLogs` já utiliza o domínio correto; manter consistente.

## Tratamento de Erros
- No front‑end (`subscribe`), tratar `23514` (violação de check) com feedback claro e logar um evento `system_error` com `status='error'` via serviço/admin quando possível.
- No trigger, capturar exceções e registrar `RAISE NOTICE` em vez de falhar.

## Testes
- Cenários de sucesso: inserção de logs com `status = success | pending | error | failed` passa na constraint.
- Cenários inválidos: tentativa com `status = sent | draft | scheduled` resulta em erro de constraint e é capturada adequadamente.
- Fluxo de inscrição: inserir em `newsletter_subscribers` cria log de boas‑vindas com `status='success'` sem quebrar a inscrição.
- Compatibilidade: consultas e estatísticas em `useNewsletterLogs` continuam funcionando.
- Implementação proposta: adicionar Vitest como devDependency e criar testes unitários/integrados (ou scripts Node com Supabase client) que exercitam a constraint e o trigger.

## Documentação
- Criar `docs/newsletter_logs.md` com:
  - Valores permitidos para `status` de logs: `success | error | pending | failed`.
  - Diferença entre `newsletter_logs.status` e `newsletter_campaigns.status`.
  - Fluxo de inscrição e trigger de boas‑vindas.
  - Políticas RLS relevantes.

## Compatibilidade e Risco
- A mudança alinha o banco ao consumo atual do app, reduz risco de regressão.
- Triggers atualizados evitam interrupção da inscrição e mantêm integridade.

Confirma que posso aplicar a migração, atualizar o trigger e adicionar os testes e documentação conforme acima?