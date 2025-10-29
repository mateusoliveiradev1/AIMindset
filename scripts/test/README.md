# Scripts de Teste e Validação

Esta pasta contém scripts para testar funcionalidades e validar o sistema.

## Categorias de Scripts

### 🧪 Scripts de Teste Geral
- `test_1_fixed_2_auto.mjs` - Teste de correção automática
- `test_admin_checkbox.mjs` - Teste de checkbox do admin
- `test_cache_clear.mjs` - Teste de limpeza de cache
- `test_cache_interference.mjs` - Teste de interferência de cache
- `test_complete_engagement.mjs` - Teste de engajamento completo
- `test_corrected_function.mjs` - Teste de função corrigida
- `test_corrected_function_final.mjs` - Teste final de função
- `test_get_article_metrics.mjs` - Teste de métricas de artigos

### 🎯 Scripts de Teste de Funcionalidades
- `test_featured_articles_final.mjs` - Teste final de artigos em destaque
- `test_featured_fix.sql` - Correção de teste de destaque
- `test_frontend_featured.mjs` - Teste de frontend destacado
- `test_frontend_final.mjs` - Teste final de frontend
- `test_frontend_integration.mjs` - Teste de integração frontend
- `test_hero_system.mjs` - Teste do sistema hero
- `test_hybrid_mode.mjs` - Teste de modo híbrido
- `test_hybrid_system_final.mjs` - Teste final do sistema híbrido

### 🔄 Scripts de Teste de Sistema
- `test_interface_final.mjs` - Teste final de interface
- `test_limit_increase.mjs` - Teste de aumento de limite
- `test_max_one_featured.mjs` - Teste de máximo um destaque
- `test_metrics_debug.mjs` - Debug de métricas de teste
- `test_ranking_fix.mjs` - Teste de correção de ranking

### 📝 Scripts de Teste de UI
- `testar_feedback_ui.mjs` - Teste de UI de feedback

### 🔍 Scripts de Investigação
- `investigate_likes_detailed.mjs` - Investigação detalhada de likes
- `investigate_ordering_bug.mjs` - Investigação de bug de ordenação
- `investigate_ordering_critical.mjs` - Investigação crítica de ordenação
- `investigate_raw_data.mjs` - Investigação de dados brutos

### ✅ Scripts de Validação
- `validate_ordering_success.mjs` - Validação de sucesso de ordenação
- `validate_triggers.mjs` - Validação de triggers

### 🔄 Scripts de Teste Final
- `final_ordering_test.mjs` - Teste final de ordenação
- `final_realtime_test.mjs` - Teste final de tempo real
- `final_sync_test.mjs` - Teste final de sincronização
- `final_test_corrected.mjs` - Teste final corrigido
- `final_validation.mjs` - Validação final
- `TESTE_FINAL_SINCRONIZACAO.mjs` - Teste final de sincronização

### 📊 Scripts de Criação de Dados de Teste
- `create_test_data_for_ordering.mjs` - Cria dados para teste de ordenação
- `create_test_feedbacks.mjs` - Cria feedbacks de teste

### 🔍 Scripts de Verificação de Estado
- `verify_featured_articles.mjs` - Verifica artigos em destaque
- `verify_feedback_state.mjs` - Verifica estado do feedback

## Como Usar

```bash
# Executar teste específico
node scripts/test/nome-do-teste.mjs

# Exemplo: Testar sistema de feedback
node scripts/test/testar_feedback_ui.mjs

# Exemplo: Validação final
node scripts/test/final_validation.mjs
```

## Fluxo de Testes Recomendado

1. **Testes de Funcionalidade Básica**: Comece com testes de componentes individuais
2. **Testes de Integração**: Execute testes de integração frontend/backend
3. **Testes de Sistema**: Teste o sistema completo
4. **Validação Final**: Execute scripts de validação para confirmar tudo está funcionando

## Tipos de Teste

- **Unitários**: Testam componentes individuais
- **Integração**: Testam interação entre componentes
- **Sistema**: Testam o sistema completo
- **Validação**: Confirmam que tudo está funcionando corretamente