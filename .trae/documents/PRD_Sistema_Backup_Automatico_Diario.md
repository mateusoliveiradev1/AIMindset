# 💾 PRD — Backup Automático Diário do AIMindset

## 1. Product Overview

Sistema de backup automático diário para o AIMindset, utilizando Supabase Edge Functions e cron job (Scheduler), totalmente integrado ao sistema existente de backup manual, logs e alertas por e-mail.

- **Objetivo**: Garantir a segurança e continuidade dos dados sem necessidade de ação manual, mantendo compatibilidade total com a arquitetura atual
- **Usuários**: Sistema automático (execução via cron job) e administradores (monitoramento via painel existente)
- **Valor do produto**: Automatização do processo já funcional de backup manual, sem alterações na infraestrutura atual

## 2. 🔒 Requisitos Gerais e Compatibilidade

### 2.1 Restrições Críticas
1. **NÃO alterar** nenhuma função SQL existente (`backup_all_data`, `restore_from_backup`, `log_backup` etc.)
2. O novo sistema deve **apenas automatizar** o processo já funcional de backup manual
3. Backup automático deve:
   - Registrar logs em `backup_logs` e `system_logs`
   - Enviar e-mail de alerta em caso de falha
4. Nenhuma mudança visual ou estrutural no painel admin
5. Total compatibilidade com:
   - Sistema de cache TTL
   - Logs e alertas automáticos
   - Triggers e funções SQL atuais
6. Deve executar **fora do ciclo principal do app**, via Edge Function e cron job do Supabase
7. Não afetar desempenho, nem uso de CPU/RAM durante execução normal do site

## 3. Core Features

### 3.1 User Roles

| Role | Registration Method | Core Permissions |
|------|---------------------|------------------|
| Sistema Automático | Execução via Supabase Scheduler | Executa backup_all_data() via Edge Function, registra logs, envia alertas |
| Administrador | Acesso via painel admin existente | Monitora logs de backup automático, recebe alertas por e-mail |

### 3.2 Feature Module

Nosso sistema de backup automático consiste dos seguintes componentes principais:

1. **🧱 Função SQL Existente**: usar `SELECT backup_all_data();` sem modificações
2. **⚡ Edge Function**: `auto-backup.ts` para execução automatizada via Supabase
3. **⏰ Supabase Scheduler**: cron job configurado para execução às 03:00 da manhã
4. **📧 Sistema de Alertas**: integração com `alert-processor` existente para notificações de falha
5. **📊 Monitoramento**: registro em `backup_logs` e `system_logs` para rastreabilidade total

### 3.3 Page Details

| Page Name | Module Name | Feature description |
|-----------|-------------|---------------------|
| N/A (Sistema Backend) | Edge Function Auto Backup | Executa backup_all_data(), registra logs de sucesso/erro, integra com sistema de alertas existente |
| Painel Admin (Existente) | Logs & Monitoramento | Visualiza logs de backup automático nos tipos 'auto_backup' e 'auto_backup_error' |
| Sistema de E-mail (Existente) | Alert Processor | Envia alertas por e-mail quando backup automático falha |

## 4. Core Process

### 4.1 🧱 Arquitetura Técnica

**1️⃣ Função SQL**
Usar a função já existente no banco:
```sql
SELECT backup_all_data();
```

**2️⃣ Edge Function (`auto-backup.ts`)**
- Executa fora do ciclo principal do app
- Chama `backup_all_data()` via RPC do Supabase
- Registra logs automáticos em `backup_logs` e `system_logs`
- Integra com sistema de alertas existente

**3️⃣ Supabase Scheduler (Cron Job)**
- Configuração: `0 3 * * *` (03:00 da manhã, todos os dias)
- Executa Edge Function `auto-backup` automaticamente
- Não afeta performance do site principal

### 4.2 Fluxos de Processo

**Fluxo Principal - Backup Automático Diário:**

1. **⏰ Agendamento**: Supabase Scheduler executa Edge Function às 03:00
2. **⚡ Execução**: Edge Function chama `backup_all_data()` via RPC
3. **📊 Registro de Sucesso**: Insere logs em `backup_logs` (action_type: 'auto_backup') e `system_logs` (type: 'auto_backup')
4. **👁️ Monitoramento**: Logs ficam disponíveis no painel admin existente

**Fluxo de Erro - Falha no Backup:**

1. **🚨 Detecção de Erro**: Edge Function captura exceção durante backup
2. **📝 Registro de Erro**: Insere log em `system_logs` (type: 'auto_backup_error')
3. **📧 Alerta por E-mail**: Chama `alert-processor` existente para enviar notificação
4. **🔍 Monitoramento**: Erro fica visível no painel admin para investigação

```mermaid
graph TD
    A[⏰ Supabase Scheduler - 03:00] --> B[⚡ Edge Function auto-backup]
    B --> C[🧱 Executa backup_all_data()]
    C --> D{✅ Backup Sucesso?}
    D -->|Sim| E[📊 Registra em backup_logs]
    E --> F[📝 Registra em system_logs]
    F --> G[✅ Backup Concluído]
    D -->|Não| H[🚨 Registra erro em system_logs]
    H --> I[📧 Chama alert-processor]
    I --> J[📬 Envia e-mail de alerta]
    J --> K[❌ Erro Registrado]
```

## 5. User Interface Design

### 5.1 Design Style

- **🔒 Zero Alterações**: Nenhuma mudança visual ou estrutural no painel admin existente
- **📊 Integração Total**: Utiliza sistema de logs existente com ícones e cores já definidas
- **📧 Templates Existentes**: Utiliza templates de e-mail já implementados no `alert-processor`
- **👁️ Monitoramento Transparente**: Logs aparecem na aba "Logs & Monitoramento" existente

### 5.2 Page Design Overview

| Page Name | Module Name | UI Elements |
|-----------|-------------|-------------|
| Painel Admin - Logs | Sistema de Logs Existente | Novos tipos: 'auto_backup' (💾 verde) e 'auto_backup_error' (❌ vermelho) |
| E-mail de Alerta | Template alert-processor | Assunto: "🚨 [AIMindset] Falha no Backup Automático" |

### 5.3 Responsiveness

- **🚀 Performance**: Sistema backend não afeta responsividade ou performance do site
- **📱 Mobile**: Logs de backup automático visíveis em dispositivos móveis via painel admin
- **📧 E-mails Responsivos**: Templates já implementados e testados no sistema de alertas

## 6. 🎯 Benefícios e Garantias

### 6.1 Compatibilidade Total
- ✅ Usa função SQL `backup_all_data()` existente sem modificações
- ✅ Integra com sistema de logs existente (`backup_logs` + `system_logs`)
- ✅ Utiliza `alert-processor` existente para e-mails
- ✅ Zero impacto na performance do site principal

### 6.2 Monitoramento e Segurança
- ✅ Logs detalhados para auditoria e troubleshooting
- ✅ Alertas automáticos por e-mail em caso de falha
- ✅ Execução isolada via Edge Function (fora do app principal)
- ✅ Agendamento confiável via Supabase Scheduler