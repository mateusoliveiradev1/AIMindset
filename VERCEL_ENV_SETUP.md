# Configuração de Variáveis de Ambiente no Vercel

Este guia descreve como configurar todas as variáveis necessárias para produção.

## Passo a Passo

1. Acesse seu projeto no Vercel
2. Vá em `Settings → Environment Variables`
3. Crie as variáveis abaixo:

### Supabase
- `NEXT_PUBLIC_SUPABASE_URL` → URL do projeto
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` → Chave Anon
- `SUPABASE_URL` → URL do projeto (server-side)
- `SUPABASE_ANON_KEY` → Chave Anon (server-side)
- `SUPABASE_SERVICE_ROLE_KEY` → Chave Service Role (server-side)

### Google Analytics 4 (Measurement Protocol)
- `GA4_MEASUREMENT_ID` → ex: `G-T9CX5BME74`
- `GA4_API_SECRET` → ex: `12354546232`

### Sistema de Alertas
- `ENVIRONMENT` → `production`
- `RESEND_API_KEY` → sua chave da Resend

## Observações
- O endpoint `/api/analytics/web-vitals` usa `GA4_MEASUREMENT_ID` e `GA4_API_SECRET` no servidor.
- O cliente só envia Web Vitals em produção (não em `localhost`).
- Após adicionar as variáveis, rode um novo deploy para que fiquem disponíveis.

## Validação
- Use o GA4 DebugView/Realtime para verificar evento `web_vitals` com parâmetros:
  - `cls`, `inp`, `fcp`, `lcp`, `ttfb`, `page_location`.