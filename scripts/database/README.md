# Scripts de Banco de Dados

Esta pasta contém scripts SQL e relacionados ao banco de dados Supabase.

## Arquivos Principais

### Scripts SQL de Consulta
- `query_article.sql` - Consultas de artigos
- `find_article.sql` - Busca de artigos específicos

### Scripts de Limpeza
- `cleanup_feedback.sql` - Limpeza de feedbacks
- `reset_feedbacks.sql` - Reset completo de feedbacks
- `ZERAR_TUDO_AGORA.sql` - Limpeza total do sistema

### Scripts de Teste
- `create_test_article.sql` - Criação de artigos de teste
- `test_featured_articles.sql` - Teste de artigos em destaque
- `test_featured_fix.sql` - Correção de artigos em destaque

### Scripts de Debug
- `debug_feedback.sql` - Debug de sistema de feedback

### Scripts de Verificação
- `check_current_function.sql` - Verificação de funções
- `check_data.sql` - Verificação de dados
- `check_function.sql` - Verificação de funções específicas
- `check_function_exists.sql` - Verificação de existência de funções
- `check_triggers.sql` - Verificação de triggers

### Scripts de Correção
- `fix_boolean_conversion_final.sql` - Correção de conversão booleana
- `fix_hero_system.sql` - Correção do sistema hero
- `fix_hero_system_v2.sql` - Versão 2 da correção hero
- `fix_rpc_ultimate.sql` - Correção final de RPC
- `fix_rpc_with_rls.sql` - Correção RPC com RLS
- `fix_type_issue_final.sql` - Correção final de tipos

## Como Usar

Execute os scripts diretamente no Supabase SQL Editor ou use ferramentas como psql:

```bash
# Para scripts que retornam dados
psql -h your-host -d your-db -f script.sql

# Para scripts de modificação (cuidado!)
psql -h your-host -d your-db -f script.sql
```

⚠️ **ATENÇÃO**: Scripts de limpeza e modificação podem apagar dados. Sempre faça backup antes de executar!