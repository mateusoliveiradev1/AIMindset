# Sistema de Alertas - AIMindset

## 📧 Status Atual do Sistema

✅ **Sistema Corrigido e Funcional!**

O sistema de alertas foi completamente corrigido e agora possui:

### 🔧 Correções Implementadas

1. **Edge Function Atualizada**
   - ✅ Implementado envio real de emails usando Resend
   - ✅ Fallback para modo desenvolvimento (apenas logs)
   - ✅ Tratamento robusto de erros
   - ✅ Logs detalhados para debug

2. **Função RPC Alternativa**
   - ✅ Criada função `send_alert_direct()` como backup
   - ✅ Processamento de alertas em fila quando pg_net não disponível
   - ✅ Função `process_queued_alerts()` para processar alertas pendentes

3. **Triggers Melhorados**
   - ✅ Função `process_automatic_alert()` reescrita com fallbacks
   - ✅ Primeiro tenta pg_net, depois função RPC
   - ✅ Logs detalhados de cada tentativa

4. **Configuração de Ambiente**
   - ✅ Variável `ENVIRONMENT=development` para controle
   - ✅ Suporte para `RESEND_API_KEY` (opcional)

## 🚀 Como Funciona Agora

### ✅ Modo Atual (PRODUÇÃO - ATIVO)
- 📧 **EMAILS REAIS SENDO ENVIADOS via Resend**
- 🔍 Todos os alertas são registrados no `system_logs` para monitoramento
- ⚡ API Key configurada: `re_5y6JWySh_J6LFqLCLGhjkXyYhYvi7KQXW`
- 🚀 Ambiente: `ENVIRONMENT=production`

### Modo Desenvolvimento (Para Desativar Envio Real)
1. Mudar no `.env`: `ENVIRONMENT=development`
2. Comentar a linha: `# RESEND_API_KEY=re_5y6JWySh_J6LFqLCLGhjkXyYhYvi7KQXW`
3. Emails voltarão a ser apenas logados no console

## 📋 Como Testar

### 1. Teste Básico (Interface)
```
1. Acesse: http://localhost:5174/admin
2. Vá para "Gerenciar Alertas"
3. Clique em "Testar Sistema de Alertas"
4. Verifique os logs no console do navegador
```

### 2. Teste via SQL (Direto no Banco)
```sql
-- Testar alerta de erro da aplicação
SELECT test_alert_system('app_error', 'Teste de erro da aplicação');

-- Testar alerta de segurança
SELECT test_alert_system('security', 'Teste de alerta de segurança');

-- Enviar alerta diretamente
SELECT send_alert_direct(
    'error',
    'teste_manual',
    'Teste manual do sistema de alertas',
    '{"teste": true}'::jsonb
);
```

### 3. Verificar Logs
```sql
-- Ver logs de alertas recentes
SELECT * FROM system_logs 
WHERE type IN ('alert_sent', 'alert_fallback', 'alert_failed', 'alert_queued')
ORDER BY created_at DESC 
LIMIT 10;
```

## 🔍 Monitoramento

### Tipos de Logs Gerados
- `alert_sent`: Alerta enviado com sucesso via pg_net
- `alert_fallback`: Alerta enviado via função RPC (fallback)
- `alert_failed`: Falha ao enviar alerta
- `alert_queued`: Alerta em fila (pg_net indisponível)
- `alert_processed`: Alerta da fila processado

### Verificar Status do Sistema
```sql
-- Estatísticas de alertas das últimas 24h
SELECT 
    type,
    COUNT(*) as total,
    MAX(created_at) as ultimo_alerta
FROM system_logs 
WHERE type LIKE 'alert_%' 
AND created_at > now() - interval '24 hours'
GROUP BY type
ORDER BY total DESC;
```

## ⚙️ Configurações Avançadas

### Variáveis de Ambiente Suportadas
```env
# Obrigatórias (já configuradas)
VITE_SUPABASE_URL=https://jywjqzhqynhnhetidzsa.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# Sistema de Alertas
ENVIRONMENT=development          # development | production
RESEND_API_KEY=re_xxxxxxxxx     # Opcional: para envio real de emails
```

### Funções RPC Disponíveis
- `test_alert_system(tipo, mensagem)` - Testar alertas
- `send_alert_direct(tipo, origem, mensagem, detalhes)` - Enviar alerta direto
- `process_queued_alerts()` - Processar alertas em fila
- `manage_alert_subscription(email, acao)` - Gerenciar assinantes

## 🎯 Próximos Passos

Para ativar envio real de emails:

1. **Criar conta Resend (Gratuita)**
   ```
   - Acesse: https://resend.com
   - Plano gratuito: 3.000 emails/mês
   - Verificar domínio (opcional)
   ```

2. **Configurar API Key**
   ```env
   RESEND_API_KEY=re_sua_chave_aqui
   ENVIRONMENT=production
   ```

3. **Testar em Produção**
   ```
   - Adicionar email real nos assinantes
   - Disparar teste de alerta
   - Verificar recebimento do email
   ```

## 🛠️ Troubleshooting

### Problema: Alertas não aparecem nos logs
**Solução**: Verificar se os triggers estão ativos
```sql
SELECT * FROM information_schema.triggers 
WHERE trigger_name LIKE '%alert%';
```

### Problema: pg_net não disponível
**Solução**: O sistema usa automaticamente a função RPC como fallback

### Problema: Emails não chegam (modo produção)
**Verificar**:
1. API Key da Resend está correta
2. Email do remetente está verificado
3. Logs de erro no `system_logs`

---

✅ **Sistema 100% Funcional em Modo Desenvolvimento**
🚀 **Pronto para Produção com Configuração Simples**

## 📧 Status Atual do Sistema

✅ **Sistema Corrigido e Funcional!**

O sistema de alertas foi completamente corrigido e agora possui:

### 🔧 Correções Implementadas

1. **Edge Function Atualizada**
   - ✅ Implementado envio real de emails usando Resend
   - ✅ Fallback para modo desenvolvimento (apenas logs)
   - ✅ Tratamento robusto de erros
   - ✅ Logs detalhados para debug

2. **Função RPC Alternativa**
   - ✅ Criada função `send_alert_direct()` como backup
   - ✅ Processamento de alertas em fila quando pg_net não disponível
   - ✅ Função `process_queued_alerts()` para processar alertas pendentes

3. **Triggers Melhorados**
   - ✅ Função `process_automatic_alert()` reescrita com fallbacks
   - ✅ Primeiro tenta pg_net, depois função RPC
   - ✅ Logs detalhados de cada tentativa

4. **Configuração de Ambiente**
   - ✅ Variável `ENVIRONMENT=development` para controle
   - ✅ Suporte para `RESEND_API_KEY` (opcional)

## 🚀 Como Funciona Agora

### Modo Desenvolvimento (Atual)
- 📝 Emails são apenas logados no console
- 🔍 Todos os alertas são registrados no `system_logs`
- ⚡ Funciona sem necessidade de configuração adicional

### Modo Produção (Para Ativar)
1. Criar conta gratuita na [Resend](https://resend.com)
2. Obter API Key
3. Adicionar no `.env`: `RESEND_API_KEY=re_xxxxxxxxx`
4. Mudar `ENVIRONMENT=production`

## 📋 Como Testar

### 1. Teste Básico (Interface)
```
1. Acesse: http://localhost:5174/admin
2. Vá para "Gerenciar Alertas"
3. Clique em "Testar Sistema de Alertas"
4. Verifique os logs no console do navegador
```

### 2. Teste via SQL (Direto no Banco)
```sql
-- Testar alerta de erro da aplicação
SELECT test_alert_system('app_error', 'Teste de erro da aplicação');

-- Testar alerta de segurança
SELECT test_alert_system('security', 'Teste de alerta de segurança');

-- Enviar alerta diretamente
SELECT send_alert_direct(
    'error',
    'teste_manual',
    'Teste manual do sistema de alertas',
    '{"teste": true}'::jsonb
);
```

### 3. Verificar Logs
```sql
-- Ver logs de alertas recentes
SELECT * FROM system_logs 
WHERE type IN ('alert_sent', 'alert_fallback', 'alert_failed', 'alert_queued')
ORDER BY created_at DESC 
LIMIT 10;
```

## 🔍 Monitoramento

### Tipos de Logs Gerados
- `alert_sent`: Alerta enviado com sucesso via pg_net
- `alert_fallback`: Alerta enviado via função RPC (fallback)
- `alert_failed`: Falha ao enviar alerta
- `alert_queued`: Alerta em fila (pg_net indisponível)
- `alert_processed`: Alerta da fila processado

### Verificar Status do Sistema
```sql
-- Estatísticas de alertas das últimas 24h
SELECT 
    type,
    COUNT(*) as total,
    MAX(created_at) as ultimo_alerta
FROM system_logs 
WHERE type LIKE 'alert_%' 
AND created_at > now() - interval '24 hours'
GROUP BY type
ORDER BY total DESC;
```

## ⚙️ Configurações Avançadas

### Variáveis de Ambiente Suportadas
```env
# Obrigatórias (já configuradas)
VITE_SUPABASE_URL=https://jywjqzhqynhnhetidzsa.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# Sistema de Alertas
ENVIRONMENT=development          # development | production
RESEND_API_KEY=re_xxxxxxxxx     # Opcional: para envio real de emails
```

### Funções RPC Disponíveis
- `test_alert_system(tipo, mensagem)` - Testar alertas
- `send_alert_direct(tipo, origem, mensagem, detalhes)` - Enviar alerta direto
- `process_queued_alerts()` - Processar alertas em fila
- `manage_alert_subscription(email, acao)` - Gerenciar assinantes

## 🎯 Próximos Passos

Para ativar envio real de emails:

1. **Criar conta Resend (Gratuita)**
   ```
   - Acesse: https://resend.com
   - Plano gratuito: 3.000 emails/mês
   - Verificar domínio (opcional)
   ```

2. **Configurar API Key**
   ```env
   RESEND_API_KEY=re_sua_chave_aqui
   ENVIRONMENT=production
   ```

3. **Testar em Produção**
   ```
   - Adicionar email real nos assinantes
   - Disparar teste de alerta
   - Verificar recebimento do email
   ```

## 🛠️ Troubleshooting

### Problema: Alertas não aparecem nos logs
**Solução**: Verificar se os triggers estão ativos
```sql
SELECT * FROM information_schema.triggers 
WHERE trigger_name LIKE '%alert%';
```

### Problema: pg_net não disponível
**Solução**: O sistema usa automaticamente a função RPC como fallback

### Problema: Emails não chegam (modo produção)
**Verificar**:
1. API Key da Resend está correta
2. Email do remetente está verificado
3. Logs de erro no `system_logs`

---

✅ **Sistema 100% Funcional em Modo Desenvolvimento**
🚀 **Pronto para Produção com Configuração Simples**