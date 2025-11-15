## Objetivos
- Reduzir funções serverless para ficar abaixo do limite do plano Hobby.
- Unificar rotas redundantes sem alterar contratos públicos (URLs atuais continuam válidas).
- Remover dependências de servidores locais e handlers duplicados.
- Garantir que newsletter automática e SEO não sejam impactados.

## Inventário Atual (que impacta o limite)
- `api/send-alert-email.ts`
- `api/backup-status.ts`
- `api/auto-backup.ts`
- `api/analytics/web-vitals.ts`
- `api/sitemap-xml.ts`
- Arquivos de suporte na pasta `api/` que não deveriam ser funções (ex.: `api/server.ts`, `api/email-server.ts`, `api/email-queue-processor.ts`, `api/sitemap.ts`, utilitários e templates HTML).

## Estratégia de Consolidação
- Criar uma única função catch‑all: `api/[...svc].ts` que roteia internamente por caminho e método.
- Migrar lógica para subrotas internas:
  - `/send-alert-email` → mover código de `api/send-alert-email.ts` (incluir fallback de envio integrado).
  - `/backup-status` (GET/POST) → mover de `api/backup-status.ts`.
  - `/auto-backup` (POST) → mover de `api/auto-backup.ts` ou desativar se Supabase Edge cobrir o cron.
  - `/analytics/web-vitals` (HEAD/POST) → mover de `api/analytics/web-vitals.ts`.
- Manter `api/sitemap-xml.ts` isolada (SEO) para performance e simplicidade.

## Rewrites para Não Quebrar URLs
- Adicionar no `vercel.json` rewrites das rotas antigas para a catch‑all:
  - `/api/send-alert-email` → `/api/svc/send-alert-email`
  - `/api/backup-status` → `/api/svc/backup-status`
  - `/api/auto-backup` → `/api/svc/auto-backup`
  - `/api/analytics/web-vitals` → `/api/svc/analytics/web-vitals`
- Manter rewrite existente: `/sitemap.xml` → `/api/sitemap-xml`.

## Remoções e Ajustes
- Remover da pasta `api/` arquivos que não são funções HTTP para evitar contagem:
  - `api/server.ts`, `api/email-server.ts`, `api/email-queue-processor.ts`, `api/sitemap.ts`.
  - Mover utilitários e templates HTML para `src/email/templates/` ou semelhante (fora de `api/`).
- Se o processamento de fila for necessário, usar:
  - Supabase Edge Function com schedule da plataforma, ou
  - Vercel Cron chamando `/api/svc/auto-backup` (se mantido).

## Verificação de Uso (antes de remover)
- Mapear chamadas no código para `/api/*` e confirmar cobertura por rewrites.
- Validar que nenhuma chamada depende de `localhost:3001` (migrar para endpoint Vercel).
- Confirmar que newsletter/welcome usam caminhos ou triggers independentes (não alterar).

## Testes e Garantias
- Rodar build local e validar TypeScript.
- Testar manualmente endpoints consolidados:
  - `GET/POST /api/backup-status`
  - `POST /api/send-alert-email`
  - `POST /api/auto-backup` (se mantido)
  - `HEAD/POST /api/analytics/web-vitals`
  - `GET /sitemap.xml`
- Checar deploy na Vercel e confirmar que a contagem de funções ficou < 12.

## Plano de Rollback
- Manter branch de backup antes das remoções.
- Se qualquer endpoint falhar, reverter arquivos removidos e desativar rewrites recém‑adicionados.

## Entregáveis
- Catch‑all `api/[...svc].ts` implementada com roteamento interno.
- Rewrites no `vercel.json` preservando URLs atuais.
- Remoção/movimentação de arquivos indevidos da pasta `api/`.
- Verificação completa e deploy bem‑sucedido sem exceder o limite.