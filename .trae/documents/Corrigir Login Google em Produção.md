## Objetivo
Configurar o fluxo de login com Google para produção usando o domínio `https://www.aimindset.com.br`, removendo dependências de `localhost` e garantindo redirects corretos.

## Ajustes no Código
1. `src/pages/AdminLogin.tsx:270`
- Alterar `redirectTo` para usar `SITE_URL` por env: `const siteUrl = import.meta.env.VITE_SITE_URL || import.meta.env.NEXT_PUBLIC_SITE_URL || window.location.origin;`
- Usar `redirectTo: `${siteUrl}/auth/v1/callback``
2. `src/utils/corsConfig.ts:5` e `src/utils/security.ts:344`
- Incluir `https://www.aimindset.com.br` e `https://aimindset.com.br` em origens permitidas, mantendo `localhost` para dev.
3. `vercel.json`
- Adicionar redirect canônico (opcional): redirecionar `https://aimindset.com.br/*` → `https://www.aimindset.com.br/$1` ou vice-versa, conforme preferência.
4. `.env.local` (dev) e Vercel (prod)
- Adicionar `VITE_SITE_URL=https://www.aimindset.com.br` (e/ou `NEXT_PUBLIC_SITE_URL`).

## Supabase (Dashboard → Authentication)
1. Site URL
- Definir `Site URL`: `https://www.aimindset.com.br`.
2. Additional Redirect URLs
- Adicionar: `https://www.aimindset.com.br/auth/v1/callback` e, opcional, `https://aimindset.com.br/auth/v1/callback`.
3. Provider Google
- Confirmar `Client ID` e `Client Secret` do Google.

## Google Cloud OAuth
1. Authorized JavaScript origins
- Adicionar: `https://www.aimindset.com.br` e `https://aimindset.com.br`.
2. Authorized redirect URIs
- Adicionar: `https://www.aimindset.com.br/auth/v1/callback` e, opcional, `https://aimindset.com.br/auth/v1/callback`.
- (Compatibilidade) Manter `https://jywjqzhqynhnhetidzsa.supabase.co/auth/v1/callback` se desejar fallback.

## Variáveis na Vercel
- Garantir: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` conforme `VERCEL_ENV_SETUP.md:11-17`.
- Adicionar `NEXT_PUBLIC_SITE_URL=https://www.aimindset.com.br`.

## Validação
- Abrir `https://www.aimindset.com.br/admin/login`.
- Clicar “Entrar com Google (Admin)” (`src/pages/AdminLogin.tsx:261-297`).
- Confirmar retorno para `/auth/v1/callback` e sessão válida (`src/pages/AuthCallback.tsx:33-138`).

## Observações de Segurança
- Não comitar `Client Secret` ou chaves. Usar variáveis de ambiente.

Confirme para eu aplicar essas mudanças automaticamente e guiar os ajustes no Supabase/Google OAuth/Vercel.