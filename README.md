# 🧠 AIMindset

Plataforma de conteúdo com foco em agendamento inteligente, performance de ponta, SEO sólido e observabilidade completa.

![React](https://img.shields.io/badge/React-18-61DAFB?logo=react) ![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript) ![Vite](https://img.shields.io/badge/Vite-6-646CFF?logo=vite) ![Supabase](https://img.shields.io/badge/Supabase-DB%2FRPC-3ECF8E?logo=supabase) ![Express](https://img.shields.io/badge/Express-API-000000?logo=express) ![Resend](https://img.shields.io/badge/Email-Resend-000000?logo=resend) ![Web%20Vitals](https://img.shields.io/badge/Web%20Vitals-OK-4285F4?logo=google) ![License](https://img.shields.io/badge/License-MIT-green)

- Links rápidos: `SISTEMA_ALERTAS.md` • `SISTEMA_LOGS_IMPLEMENTADO.md` • `VERCEL_ENV_SETUP.md`

## Índice
- [Visão Geral](#visão-geral)
- [Features](#features)
- [Arquitetura](#arquitetura)
- [Estrutura de Pastas](#estrutura-de-pastas)
- [Setup](#setup)
- [Desenvolvimento](#desenvolvimento)
- [Build & Deploy](#build--deploy)
- [Scripts Úteis](#scripts-úteis)
- [Observabilidade & Alertas](#observabilidade--alertas)
- [API (Endpoints)](#api-endpoints)
- [Segurança](#segurança)
- [Screenshots](#screenshots)
- [Diagramas](#diagramas)
- [FAQ](#faq)
- [Troubleshooting](#troubleshooting)
- [Checklist de Qualidade](#checklist-de-qualidade)
- [Changelog Real](#changelog-real)
- [Roadmap](#roadmap)
- [Licença](#licença)
- [Contribuição](#contribuição)
- [Créditos](#créditos)

## Visão Geral
- Frontend moderno em React + Vite com otimizações avançadas de UX, performance e SEO.
- APIs/Serviços para logs, alertas e backup integrados ao Supabase e Resend.
- Painel administrativo com monitoramento de logs, estatísticas e gestão de alertas.

## Features
- Agendamento de artigos com preview minimalista e card premium (glassmorphism).
- Contador regressivo com barra de progresso e pulso quando urgente.
- Edição e reagendamento com validações inteligentes e feedback via toasts.
- Logs completos (backend/app/system) com estatísticas em tempo real.
- SEO: sitemap e robots automatizados; `react-helmet-async` para metadados.
- Performance: Web Vitals, lazy/virtualização, otimização de recursos e imagens.
- PWA: Service Worker (`public/sw.js`) e otimizações de carregamento.
- Alertas por email com templates HTML profissionais via Resend.

## Arquitetura
- Frontend: React 18, Vite 6, TypeScript, Tailwind, Zustand, Zod, `react-router-dom`.
- Observabilidade: `web-vitals`, logs e métricas; GA4 Measurement Protocol.
- Backend/APIs: Express (`server.js`) e endpoints dedicados em `api/`.
- Integração com Supabase (RPC, RLS) e Resend para e-mails.
- Workers/Service Worker: `public/workers/articleProcessor.js`, `public/sw.js`.

## Estrutura de Pastas
```
.
├─ src/                # App React (componentes, hooks, lib)
├─ api/                # SEO e email endpoints (Express)
├─ public/             # Assets, manifest, service worker
├─ scripts/            # Manutenção, debug, testes, database, backup
├─ server.js           # API local para logs/backup
├─ docs/               # Documentação auxiliar de deploy e sistemas
├─ README.md           # Este arquivo
```

## Setup
- Pré-requisitos: Node 18+, npm.
- Instalação:
```
npm install
```
- Variáveis de ambiente (`.env`):
```
# Cliente
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=

# Servidor
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Alertas
ENVIRONMENT=production|development
RESEND_API_KEY=

# Analytics
GA4_MEASUREMENT_ID=
GA4_API_SECRET=
```
- Segurança: nunca commitar segredos; Service Role só no servidor.

## Desenvolvimento
- Frontend:
```
npm run dev
```
- Qualidade:
```
npm run lint
npm run check
```
- API local de backup/logs (requer `SUPABASE_SERVICE_ROLE_KEY`):
```
node server.js
```

## Build & Deploy
- Build:
```
npm run build
```
- Preview:
```
npm run preview
```
- Deploy: Vercel (ver `VERCEL_ENV_SETUP.md`).

## Scripts Úteis
- Performance: `npm run build:perf`.
- Autenticação Google: `npm run setup-google-oauth`, `npm run google-oauth-wizard`, `npm run google-oauth-quick`, `npm run check-auth`.
- Pasta `scripts/` com utilitários de manutenção, debug, testes e banco.

## Observabilidade & Alertas
- Referências: `SISTEMA_LOGS_IMPLEMENTADO.md`, `SISTEMA_ALERTAS.md`.
- Resumo:
  - Logs: backend/app/system com RLS e índices otimizados.
  - Alertas automáticos com templates HTML (Resend) e assinantes.
  - Estatísticas e monitoramento no painel administrativo.

## API (Endpoints)
- `POST /api/system-logs` — insere logs do sistema (`server.js:62`).
- `POST /api/auto-backup` — executa backup com limpeza inteligente (`server.js:97`).
- `GET /api/backup-status` — status, próximos horários e estatísticas (`server.js:229`).
- `POST /api/backup-status` — força verificação de saúde + alerta (`server.js:348`).
- `GET /health` — saúde do servidor (`server.js:408`).
- `POST /api/send-alert-email` — envia alertas por email (`api/server.ts:27`).
- `POST /api/test-email-system` — testa sistema de email (`api/server.ts:72`).
- `GET /sitemap.xml`, `GET /robots.txt` — SEO (`api/server.ts:18`).

### Exemplos (curl)
```
# Inserir log de sistema
curl -X POST http://localhost:3001/api/system-logs \
  -H "Content-Type: application/json" \
  -d '{
    "type": "app_error",
    "message": "Falha ao processar pagamento",
    "context": { "order_id": "123", "user_id": "abc" }
  }'

# Executar backup automático
curl -X POST http://localhost:3001/api/auto-backup

# Verificar status do backup
curl http://localhost:3001/api/backup-status

# Enviar email de alerta
curl -X POST http://localhost:3001/api/send-alert-email \
  -H "Content-Type: application/json" \
  -d '{
    "recipients": ["admin@example.com"],
    "alertData": {
      "type": "error",
      "source": "backup_system",
      "message": "Falha na rotina de backup",
      "timestamp": "2025-11-19T12:00:00.000Z",
      "details": { "job": "backup_all_data" }
    }
  }'
```

## Segurança
- RLS em todas as tabelas de logs no Supabase.
- Service Role apenas server-side; rate limiting simples para `/api/system-logs` (`server.js:38-52`).

## Screenshots
- Placeholder de branding: ![Logo](public/favicon.svg)
- Recomendações:
  - Adicionar captura do preview minimalista
  - Adicionar captura do card de agendamento premium
  - Adicionar captura da aba "Logs & Monitoramento" no admin

## Diagramas
### Arquitetura Geral
```mermaid
flowchart LR
  A[Cliente React (Vite)] --> B[Express API]
  B --> C[Supabase (DB/RPC/RLS)]
  B --> D[Resend (Emails)]
  A --> E[GA4 (Web Vitals)]
  A --> F[Service Worker / Workers]
  B --> G[Sitemap/Robots]
```

### Fluxo de Alertas
```mermaid
sequenceDiagram
  participant App
  participant API
  participant DB as Supabase
  participant Mail as Resend

  App->>API: POST /api/send-alert-email
  API->>Mail: send(alertData)
  API->>DB: INSERT system_logs (alert_sent/failed)
  App-->>API: /api/test-email-system (teste)
  API->>Mail: send(test)
  API->>DB: INSERT system_logs (test)
```

## FAQ
- O projeto usa Docker? Não. Desenvolvimento roda com `npm run dev` e APIs em `node server.js`.
- Como configuro GA4? Ver `VERCEL_ENV_SETUP.md` e `.env.example` (`GA4_MEASUREMENT_ID`, `GA4_API_SECRET`).
- Onde envio emails? Endpoint `POST /api/send-alert-email` (`api/server.ts:27`), via Resend.
- Como garantir RLS? Políticas definidas no Supabase; use Service Role somente no backend.

## Troubleshooting
- Variáveis Supabase faltando: ver `.env.example` e `VERCEL_ENV_SETUP.md`.
- Emails não enviam: verificar `RESEND_API_KEY`, domínio verificado e logs (`system_logs`).
- GA4 sem eventos: conferir `ENVIRONMENT` e Measurement Protocol; usar DebugView.
- Rate limit em logs: reduzir chamadas por IP (implementado em `server.js:38-52`).

## Checklist de Qualidade
- `npm run lint` sem erros
- `npm run check` sem problemas de tipos
- `npm run build` com sucesso
- `.env` completo (Supabase, Resend, GA4)
- `/health` responde OK
- Web Vitals enviados em produção

## Changelog Real
### Fase 2.0
- Preview 100% minimalista, sem tags/categoria/data/TOC.
- Card premium para agendados; contador com barra e pulso; botão Voltar clean.

### Fase 2.1
- Reagendar funciona como editar; validações robustas.
- Feedback por toasts; logs completos; ordenação por data; limpeza de cancelados.

## Roadmap
- Fase 2.x: melhorias de SEO técnico e acessibilidade.
- Fase 3.x: automações avançadas de conteúdo e análises.

## Licença
- MIT — ver `LICENSE`.

## Contribuição
- Pull Requests e Issues são bem-vindos. Siga padrões de lint e tipos.

## Créditos
- AIMindset — engenharia, conteúdo e experiência.