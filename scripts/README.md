# Scripts do Projeto AIMindset

Esta pasta contém todos os scripts organizados por categoria para facilitar a manutenção e desenvolvimento do projeto.

## Estrutura de Pastas

### 📊 `/database`
Scripts relacionados ao banco de dados:
- Consultas SQL
- Scripts de criação e alteração de tabelas
- Funções e triggers do banco

### 🔧 `/maintenance`
Scripts de manutenção e correção:
- Limpeza de dados
- Sincronização de contadores
- Correções de bugs
- Atualizações de dados

### 🐛 `/debug`
Scripts de diagnóstico e debug:
- Verificação de estado do sistema
- Análise de discrepâncias
- Diagnóstico de problemas

### 🧪 `/test`
Scripts de teste e validação:
- Testes de funcionalidades
- Validação de dados
- Testes de integração

### 🔄 `/migration`
Scripts de migração de dados:
- Migrações de banco de dados
- Transformações de estrutura

### 💾 `/backup`
Scripts de backup e restauração:
- Backup de dados
- Restauração de estado

## Como Usar

1. Navegue até a pasta apropriada
2. Execute o script desejado com Node.js:
   ```bash
   node scripts/categoria/nome-do-script.mjs
   ```

## Convenções

- Scripts `.mjs` são módulos ES6
- Scripts `.js` são CommonJS
- Scripts `.sql` são consultas diretas ao banco
- Nomes descritivos indicam a função do script