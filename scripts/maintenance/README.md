# Scripts de Manutenção

Esta pasta contém scripts para manutenção, limpeza e correção do sistema.

## Categorias de Scripts

### 🧹 Scripts de Limpeza
- `LIMPEZA_BRUTAL_MANUAL.mjs` - Limpeza completa manual
- `LIMPEZA_DIRETA_BANCO.mjs` - Limpeza direta no banco
- `LIMPAR_AMBAS_TABELAS.mjs` - Limpeza de tabelas específicas
- `LIMPAR_CACHE_TOTAL.mjs` - Limpeza total de cache
- `complete_cleanup.mjs` - Limpeza completa do sistema

### 🔄 Scripts de Sincronização
- `complete_metrics_sync.mjs` - Sincronização completa de métricas
- `sync_counters_manually.mjs` - Sincronização manual de contadores
- `FORCAR_ATUALIZACAO_UI.mjs` - Força atualização da UI
- `FORCAR_SYNC_UI_EMERGENCIA.mjs` - Sincronização de emergência da UI

### 🔧 Scripts de Correção
- `fix_comment_like.mjs` - Correção de likes em comentários
- `fix_feedback_sync.mjs` - Correção de sincronização de feedback
- `fix_final_metrics.mjs` - Correção final de métricas
- `fix_future_section_image.mjs` - Correção de imagens de seção
- `fix_hero_system.mjs` - Correção do sistema hero
- `fix_image_duplicates.mjs` - Correção de imagens duplicadas
- `fix_missing_articles.mjs` - Correção de artigos faltantes
- `fix_startup_article_images.mjs` - Correção de imagens de artigos
- `fix_sync_counters.mjs` - Correção de contadores

### 🗑️ Scripts de Reset
- `ZERAR_TUDO_EMERGENCIAL.mjs` - Reset de emergência
- `zerar_agora.mjs` - Reset imediato
- `zerar_banco.mjs` - Reset do banco

### 📝 Scripts de Atualização
- `update_startup_article.mjs` - Atualização de artigo inicial
- `update_article_image.js` - Atualização de imagens
- `update_by_id.js` - Atualização por ID
- `update_categories_descriptions.js` - Atualização de descrições
- `update_correct_categories.js` - Correção de categorias

### ➕ Scripts de Adição
- `add_images_to_startup_article.mjs` - Adiciona imagens ao artigo

### 🔄 Scripts de Restauração
- `restore_feedback_final.mjs` - Restauração final de feedback
- `restore_real_feedback_data.mjs` - Restauração de dados reais

## Como Usar

```bash
# Executar script de manutenção
node scripts/maintenance/nome-do-script.mjs

# Exemplo: Limpeza completa
node scripts/maintenance/complete_cleanup.mjs
```

⚠️ **CUIDADO**: Estes scripts podem modificar ou apagar dados. Sempre verifique o que o script faz antes de executar!