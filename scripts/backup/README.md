# Scripts de Backup e Restauração

Esta pasta contém scripts para backup e restauração de dados do sistema.

## Estrutura

Atualmente esta pasta está vazia, mas está preparada para receber:

### 💾 Tipos de Backup
- **Backup Completo**: Backup de todo o banco de dados
- **Backup Incremental**: Backup apenas das mudanças
- **Backup de Tabelas Específicas**: Backup de tabelas críticas
- **Backup de Configurações**: Backup de configurações do sistema

### 📋 Convenções de Nomenclatura
```
backup_YYYY-MM-DD_HH-MM_tipo.sql
restore_YYYY-MM-DD_HH-MM_tipo.sql
backup_YYYY-MM-DD_HH-MM_tipo.mjs
```

Exemplo:
```
backup_2024-01-15_14-30_completo.sql
backup_2024-01-15_14-30_feedbacks.mjs
restore_2024-01-15_14-30_completo.sql
```

### 🔄 Estratégia de Backup Recomendada

1. **Backup Diário**: Backup automático diário
2. **Backup Antes de Mudanças**: Sempre antes de migrações ou atualizações
3. **Backup de Emergência**: Backup manual quando necessário
4. **Teste de Restauração**: Teste regular dos backups

## Como Usar

```bash
# Executar backup
node scripts/backup/backup_completo.mjs

# Executar restauração
node scripts/backup/restore_data.mjs
```

## Exemplo de Script de Backup

```javascript
// Exemplo de script de backup
import { createClient } from '@supabase/supabase-js'
import fs from 'fs'

const supabase = createClient(url, key)

async function backup() {
  console.log('Iniciando backup...')
  
  // 1. Conectar ao banco
  // 2. Exportar dados
  // 3. Salvar em arquivo
  // 4. Comprimir se necessário
  
  console.log('Backup concluído!')
}

backup().catch(console.error)
```

## Localização dos Backups

Os backups devem ser salvos em:
- Serviços de nuvem - Para backups permanentes
- Sistemas externos - Para redundância

Esta pasta será populada conforme necessário durante o desenvolvimento do projeto.