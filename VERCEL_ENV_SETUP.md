# 🚀 Configuração de Variáveis de Ambiente no Vercel

## ⚠️ IMPORTANTE: Configure estas variáveis no painel do Vercel

Para que o sistema de backup funcione em produção, você precisa configurar as seguintes variáveis de ambiente no painel do Vercel:

### 📋 Variáveis Obrigatórias

1. **NEXT_PUBLIC_SUPABASE_URL**
   - Valor: `https://jywjqzhqynhnhetidzsa.supabase.co`
   - Escopo: Production, Preview, Development

2. **NEXT_PUBLIC_SUPABASE_ANON_KEY**
   - Valor: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp5d2pxemhxeW5obmhldGlkenNhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA5MjkxMzQsImV4cCI6MjA3NjUwNTEzNH0.oTZ6B-77NGBSqa_lN2YWCtnKwKc0glWnwfuN9xQjDl0`
   - Escopo: Production, Preview, Development

3. **SUPABASE_SERVICE_ROLE_KEY**
   - Valor: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp5d2pxemhxeW5obmhldGlkenNhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDkyOTEzNCwiZXhwIjoyMDc2NTA1MTM0fQ.04Y2US3KKeveKGi_8PvhqxS1EKiAB4xNjuFZTP1VLOQ`
   - Escopo: Production, Preview, Development
   - ⚠️ **CRÍTICO**: Esta chave é necessária para as APIs de backup

4. **ENVIRONMENT**
   - Valor: `production`
   - Escopo: Production

5. **RESEND_API_KEY**
   - Valor: `re_5y6JWySh_J6LFqLCLGhjkXyYhYvi7KQXW`
   - Escopo: Production, Preview, Development

### 🔧 Como Configurar no Vercel

1. Acesse o painel do Vercel: https://vercel.com/dashboard
2. Selecione o projeto AIMindset
3. Vá em **Settings** > **Environment Variables**
4. Adicione cada variável com os valores acima
5. Certifique-se de marcar os escopos corretos
6. Faça um novo deploy após configurar

### ✅ Verificação

Após configurar, as APIs devem funcionar:
- `/api/backup-status` - Status do sistema de backup
- `/api/auto-backup` - Executar backup automático

### 🚨 Troubleshooting

Se ainda houver erro "Variáveis de ambiente do Supabase não configuradas":
1. Verifique se todas as variáveis foram adicionadas
2. Confirme os valores exatos (sem espaços extras)
3. Faça um novo deploy
4. Aguarde alguns minutos para propagação

## 🎯 Sistema Pronto

Com as variáveis configuradas, o sistema terá:
- ✅ Backup automático funcionando
- ✅ Monitoramento em tempo real
- ✅ Limpeza automática de logs
- ✅ Interface de administração
- ✅ APIs funcionais