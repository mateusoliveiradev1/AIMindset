## Objetivo
- Finalizar Fase 1 com o repositório limpo: confirmar e enviar quaisquer arquivos ainda em stage.
- Planejar e executar uma task dedicada para ajustar o erro de deploy causado pela quantidade de funções.

## Passo 1 — Commit e Push dos Staged
- Verificar estado atual do repositório:
  - `git status` para ver staged/unstaged e branch.
  - `git diff --name-only --cached` para listar exatamente os arquivos em stage.
- Caso haja arquivos em stage:
  - Realizar commit com mensagem clara (ex.: `"chore: finalizar Fase 1 (lint & configs)"`).
  - Executar `git push` para `origin/main`.
- Caso não haja arquivos em stage:
  - Confirmar que o working tree está limpo e seguir para o diagnóstico de deploy.

## Passo 2 — Diagnóstico de Deploy (muitas funções)
- Coletar e entender o erro atual:
  - Obter logs do deploy (Vercel) e identificar se o limite é por número de rotas/functions, bundle size, tempo de build ou memória.
- Auditoria de funções/rotas:
  - Mapear handlers em `api/*` e funções em `supabase/functions/*` (Edge Functions).
  - Identificar endpoints redundantes ou altamente correlatos que podem ser consolidados.
- Propostas técnicas:
  - Consolidar endpoints correlatos em um único handler com roteamento interno para reduzir o número de functions.
  - Adicionar `vercel.json` com `functions` → `include/exclude` e `ignore` para limitar o que entra no deploy.
  - Evitar importações pesadas nas rotas (`resend`, libs grandes) quando não necessárias; aplicar lazy import quando possível.
  - Revisar `tsconfig` e bundling das rotas para reduzir bundle size (sem afetar o app).
  - Se necessário, mover tarefas batch (ex.: processadores) para uma única função cron, disparada por RPC, reduzindo o número de endpoints.
- Verificação:
  - Testar build local (`npx vite build`) e lint.
  - Validar deploy com as novas regras/configuração e confirmar redução de funções e sucesso do deploy.

## Entregáveis
- Commit e push dos arquivos em stage.
- Ajustes de configuração (vercel.json) e eventuais consolidações de rotas com PR pequeno e reversível.
- Relatório breve: lista de endpoints consolidados, funções excluídas do build e impacto no deploy.

## Observações
- Todas as mudanças serão compatíveis e reversíveis (rollback simples).
- Não alteraremos o visual nem a lógica da Fase 1; apenas a pipeline de deploy e a organização das funções.

## Próximo
- Após aprovação, executo os comandos (status → commit → push) e inicio a task de ajuste de deploy imediatamente.