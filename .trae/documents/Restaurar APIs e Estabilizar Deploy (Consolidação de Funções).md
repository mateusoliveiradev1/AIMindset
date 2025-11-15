## Diagnóstico
- O deploy falhou por validação de schema em `vercel.json` e pelo bloqueio de `api/**` no `.vercelignore`, o que quebrou o sistema de backup automático.
- O projeto tem várias rotas em `api/` (email, backup, analytics). Vercel cria uma function por arquivo; muitas functions podem aumentar o tempo/complexidade do deploy e a superfície de erro.
- `api/server.ts` usa Express com `app.listen`, o que não é adequado a functions serverless do Vercel.

## Objetivo
- Restaurar TODAS as APIs necessárias e fazer o deploy funcionar.
- Reduzir o número de functions combinando endpoints correlatos em handlers únicos, mantendo compatibilidade e rollback simples.

## Plano de Consolidação
- Remover o ignore de `api/**` no `.vercelignore` para que as rotas sejam publicadas novamente.
- Manter `vercel.json` minimal (build estático), deixando Vercel detectar `api/*` automaticamente.
- Consolidar endpoints em handlers únicos:
  1) `api/backup.ts` (substitui `auto-backup.ts` + `backup-status.ts`):
  - Query/Body `action`: `run` (inicia backup), `status` (consulta status), `logs` (opcional).
  - Reutiliza lógica atual das funções originais.
  2) `api/email.ts` (substitui `send-email.ts`, `send-alert-email.ts`, `create-email-template.ts`, `email-fallback.ts`, `email-queue-processor.ts`):
  - `action`: `send`, `send-alert`, `create-template`, `fallback`, `process-queue`.
  - Reutiliza `emailService` e validações; mantém suporte ao Resend.
  3) Manter `api/analytics/web-vitals.ts` como função independente (leve e útil para métricas).
- Descontinuar `api/server.ts` no deploy (não usar Express com `listen` em Vercel). Se necessário, manter apenas para dev local, mas excluir do deploy.
- Incorporar templates HTML diretamente no `emailService` (já temos um sistema de template inline), removendo necessidade de arquivos `.html` individuais.

## Implementação Técnica
- Criar `api/backup.ts`: export default handler (`(req, res)`) que roteia por `req.method` e `action` do body/query, chamando utilidades atuais.
- Criar `api/email.ts`: export default handler roteando por `action` e chamando `emailService`, `email-queue-processor` (migrado como função interna).
- Ajustar imports para evitar dependências pesadas desnecessárias; aplicar lazy import quando preciso.
- Remover o ignore de `api/**` em `.vercelignore` e manter ignores de `scripts/**`, `supabase/functions/**`, `supabase/migrations/**`, `.trae/**`, `dist/`, `node_modules/`.
- Conferir variáveis de ambiente no `.env` (ex.: `RESEND_API_KEY`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`) — sem logar segredos.

## Verificação
- Lint e build: `npm run lint`, `vite build` sem erros.
- Testes locais dos handlers (com `vercel dev` ou requests diretas se aplicável).
- Deploy: monitorar logs do Vercel; confirmar que apenas 3 functions efetivas foram geradas: `api/backup`, `api/email`, `api/analytics/web-vitals`.

## Compatibilidade e Rollback
- Manter compatibilidade: os endpoints antigos serão cobertos via `action` no novo handler.
- Rollback simples: restaurar arquivos originais se necessário.

## Entrega
- Código consolidado e funcional das APIs.
- Deploy estável com número reduzido de funções e sem schema errors.
- Documentação breve no PR (mensagem de commit) indicando mapeamento `old → new` e ações suportadas.

## Próximo
- Após sua aprovação, realizo as alterações, removo o ignore de `api/**`, consolido handlers e valido deploy.