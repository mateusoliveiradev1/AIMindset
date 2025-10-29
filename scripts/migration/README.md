# Scripts de Migração

Esta pasta contém scripts para migração de dados e estruturas do banco de dados.

## Estrutura

Atualmente esta pasta está vazia, mas está preparada para receber:

### 📦 Tipos de Migração
- **Migração de Dados**: Scripts para mover dados entre tabelas ou formatos
- **Migração de Estrutura**: Scripts para alterar estrutura do banco
- **Migração de Versão**: Scripts para atualizar versões do sistema

### 📋 Convenções de Nomenclatura
```
YYYY-MM-DD_HH-MM_descricao_da_migracao.sql
YYYY-MM-DD_HH-MM_descricao_da_migracao.mjs
```

Exemplo:
```
2024-01-15_14-30_consolidar_tabelas_feedback.sql
2024-01-15_14-35_migrar_dados_usuarios.mjs
```

### 🔄 Fluxo de Migração Recomendado

1. **Backup**: Sempre faça backup antes de executar migrações
2. **Teste**: Execute em ambiente de desenvolvimento primeiro
3. **Validação**: Valide os dados após a migração
4. **Rollback**: Tenha um plano de rollback preparado

## Como Usar

```bash
# Executar migração
node scripts/migration/nome-da-migracao.mjs

# Ou para SQL direto no Supabase
# Execute no SQL Editor do Supabase
```

## Exemplo de Estrutura de Migração

```javascript
// Exemplo de script de migração
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(url, key)

async function migrate() {
  console.log('Iniciando migração...')
  
  // 1. Backup dos dados
  // 2. Executar migração
  // 3. Validar resultado
  // 4. Confirmar sucesso
  
  console.log('Migração concluída!')
}

migrate().catch(console.error)
```

Esta pasta será populada conforme necessário durante o desenvolvimento do projeto.