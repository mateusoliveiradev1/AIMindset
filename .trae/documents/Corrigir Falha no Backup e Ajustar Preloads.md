## Resposta rápida
- Não: aumentar `statement_timeout` dentro da função Postgres não cria nem aumenta o número de funções serverless. É um ajuste de configuração no próprio banco.
- Também podemos acionar o backup diretamente pelo `pg_cron` com `SELECT backup_all_data();`, evitando passar por uma função serverless no ciclo automático.
- Ajustes de preload no front não têm qualquer impacto em funções serverless.

## Plano focado em não aumentar serverless
1. Banco de Dados
   - Recriar `backup_all_data()` com `SET statement_timeout TO '10min'` e `SET synchronous_commit TO off` para acelerar escrita, sem alterar a superfície de API.
   - Manter TRUNCATE nas tabelas de backup e revisar deleções antigas (harmonizar com `011_fix_backup_delete_clause.sql:7`).
   - (Opcional) Mudar cron para executar `SELECT backup_all_data();` diretamente, removendo dependência de HTTP; não adiciona funções serverless.
2. Backend existente
   - Manter `api/auto-backup.ts:70-71` intacto; com o timeout maior, a chamada deve concluir sem erro. Sem novas funções.
3. Front (manual)
   - Manter chamada única `src/hooks/useBackup.ts:75` e melhorar mensagens de erro, sem criar novas RPCs.
4. Preloads
   - Remover/condicionar preloads de imagens em `src/pages/Home.tsx:95` e `src/components/Home/FeaturedArticles.tsx:99`. Sem impacto em serverless.

## Validação
- Executar backup manual e automático e checar logs `backup_success`.
- Verificar que o warning de preload sumiu nas páginas afetadas.

## Observação
- Se futuramente quisermos dividir o backup em etapas para UX, isso sim aumentaria o número de chamadas RPC (não funções serverless novas), mas não será feito neste plano.