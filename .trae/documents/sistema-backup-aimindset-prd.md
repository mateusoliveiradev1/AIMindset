# 🧩 PRD — Sistema de Backup Completo do AIMindset (Versão Segura e Compatível)

## 🎯 Objetivo
Implementar um sistema de backup completo e restaurável no AIMindset, garantindo que **nenhum dado seja perdido** em caso de falha, erro de banco ou atualização incorreta.

O sistema deve ser **100% compatível** com:
- A arquitetura atual do banco Supabase (já existente)
- As triggers, funções SQL e cache TTL ativos
- O visual atual do painel admin (sem mudanças de UI)

---

## 🔒 Requisitos de Segurança e Compatibilidade

1. **Nenhuma trigger ou função existente pode ser alterada.**
2. O backup deve ser **idempotente** (pode ser executado várias vezes sem duplicar registros).
3. Deve ser **independente de versionamento do banco** — ou seja, não depender de tabelas temporárias.
4. Deve respeitar o sistema de cache e performance já implementado.
5. Backup e restauração **nunca devem rodar automaticamente em deploys**.
6. Deve haver **mensagem de confirmação** antes da restauração ("Essa ação substituirá os dados atuais. Deseja continuar?").

---

## 🧱 Estrutura de Backup

### Tabelas de Backup
Criar tabelas com a **mesma estrutura das originais**, mas sem triggers associadas:
- `articles_backup`
- `comments_backup`
- `feedbacks_backup`

Essas tabelas devem conter índices e tipos iguais às originais, porém sem relações de chave estrangeira.

### Funções SQL

| Função | Ação | Observação |
|--------|------|-------------|
| `backup_all_data()` | Copia os dados atuais para as tabelas de backup | Deve limpar dados antigos antes de copiar |
| `restore_from_backup()` | Restaura dados do último backup | Deve limpar dados originais antes de restaurar |
| `log_backup(action_type)` | Registra ação (backup ou restore) na tabela `backup_logs` | Opcional, mas recomendado |

**Importante:**
Cada função deve ser validada antes da execução (verificar se as tabelas originais existem e contêm dados).

---

## 🖥️ Painel Admin — Integração Visual

Adicionar **uma nova aba "Backup & Segurança"** no painel admin (sem alterar o design atual), contendo:

| Elemento | Função | Observação |
|-----------|--------|------------|
| 🔄 Botão "Fazer Backup Agora" | Executa `supabase.rpc('backup_all_data')` | Exibir mensagem "Backup concluído com sucesso" |
| ♻️ Botão "Restaurar Backup" | Executa `supabase.rpc('restore_from_backup')` | Exibir aviso de confirmação antes da ação |
| 📅 Último backup realizado | Buscar o último registro em `backup_logs` | Exibir data/hora formatada |
| 🧾 Histórico de backups | Listar últimos 10 registros da tabela `backup_logs` | Exibir ação (backup/restore) e data |

---

## ⚙️ Requisitos Técnicos

- Integração 100% via Supabase RPC.
- Nenhum reload de página (usar reatividade do painel).
- Compatível com as versões atuais do Supabase SDK.
- Logs de backup devem aparecer também na futura aba "Monitoramento" (integração futura).

---

## 🧠 Futuras expansões (não implementar agora)

- Backup automático diário via **Supabase Edge Function (cron)**.
- Exportação manual de backup em CSV (botão "Baixar backup").
- Integração com alertas por e-mail em caso de falha.

---

## ✅ Critérios de Aceite

- O backup e a restauração funcionam sem quebrar o banco atual.
- Nenhum layout ou componente visual é alterado.
- O painel exibe confirmações e logs corretamente.
- Todos os dados das tabelas principais são copiados/restaurados corretamente.
- Logs são registrados em `backup_logs` com timestamp e ação.
- Teste final aprovado com `npm build` e `npm run dev`.

---

## 📌 Resumo Técnico
- **Banco:** Supabase
- **Linguagem:** TypeScript
- **Acesso via:** Supabase RPC
- **Visual:** Mantido conforme UI/UX atual do AIMindset
- **Foco:** Segurança, compatibilidade e estabilidade