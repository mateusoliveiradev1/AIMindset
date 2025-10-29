# Scripts de Debug e Diagnóstico

Esta pasta contém scripts para diagnóstico, verificação e debug do sistema.

## Categorias de Scripts

### 🔍 Scripts de Verificação
- `check_admin_discrepancy.mjs` - Verifica discrepâncias no admin
- `check_all_articles.mjs` - Verifica todos os artigos
- `check_current_feedback_state.mjs` - Estado atual do feedback
- `check_feedback_table.mjs` - Verifica tabela de feedback
- `check_function_direct.mjs` - Verificação direta de funções
- `check_new_comment.mjs` - Verifica novos comentários
- `check_triggers.mjs` - Verifica triggers do banco
- `check_categories.js` - Verifica categorias
- `VERIFICAR_DUAS_TABELAS.mjs` - Verifica duas tabelas específicas

### 🐛 Scripts de Debug
- `debug_data_discrepancy.mjs` - Debug de discrepâncias de dados
- `debug_database_state.mjs` - Debug do estado do banco
- `debug_feedback.mjs` - Debug do sistema de feedback
- `debug_triggers.mjs` - Debug de triggers
- `debug_feedback.js` - Debug adicional de feedback
- `debug_supabase.js` - Debug do Supabase

### 🔬 Scripts de Diagnóstico
- `diagnose_feedback_sync.mjs` - Diagnóstico de sincronização
- `diagnose_hero_system.mjs` - Diagnóstico do sistema hero

### 📊 Scripts de Análise
- `analyze_article_images.mjs` - Análise de imagens de artigos

### 🔎 Scripts de Busca
- `find_startup_article.mjs` - Encontra artigo inicial
- `find_correct_article.js` - Encontra artigo correto

### 📈 Scripts de Obtenção de Dados
- `get_categories.mjs` - Obtém categorias
- `get_startup_article_content.mjs` - Obtém conteúdo do artigo inicial

### ✅ Scripts de Verificação Final
- `verificacao_final_admin.mjs` - Verificação final do admin
- `verificar_admin_limpo.mjs` - Verifica se admin está limpo

## Como Usar

```bash
# Executar script de debug
node scripts/debug/nome-do-script.mjs

# Exemplo: Verificar estado do feedback
node scripts/debug/check_current_feedback_state.mjs

# Exemplo: Debug do banco de dados
node scripts/debug/debug_database_state.mjs
```

## Dicas de Debug

1. **Sempre comece com scripts de verificação** antes de executar correções
2. **Use scripts de diagnóstico** para entender problemas complexos
3. **Scripts de análise** ajudam a entender o estado atual dos dados
4. **Combine múltiplos scripts** para ter uma visão completa do sistema