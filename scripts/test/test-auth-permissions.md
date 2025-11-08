# Testes de Autenticação e Permissões - Agendamento

## Objetivo
Validar que:
- Usuário autenticado (admin) consegue agendar e cancelar
- Usuário sem permissão não consegue agendar/cancelar
- Sessão expirada é tratada e renovada sem falsos negativos

## Pré-requisitos
- Ambiente rodando (`npm run dev`)
- Conta admin cadastrada em `admin_users`

## Casos de Teste

1. Autenticação contínua
- Login com admin
- Navegar pelo painel por 15 minutos
- Agendar um artigo salvo
- Esperar 10 minutos (simular expiração parcial)
- Cancelar agendamento

Resultado esperado: ambos funcionam sem mensagem de sessão inválida.

2. Permissões por tipo de usuário
- Login com usuário não admin
- Tentar agendar um artigo
- Tentar cancelar agendamento

Resultado esperado: RPC retorna erro de permissão.

3. Sessão expirada e renovação
- Login com admin
- Limpar storage local (simular perda de sessão)
- Recarregar página e tentar agendar

Resultado esperado: interface pede login; após login, agendamento funciona.

## Observação
As funções RPC foram ajustadas para verificar permissões via `admin_users` usando `auth.jwt()->>'email'`, garantindo compatibilidade entre painel e API.