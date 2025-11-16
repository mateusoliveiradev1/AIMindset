# PRD: Página de Perfil e Upload de Avatar

## Objetivo
Entregar uma experiência de perfil completa, simples e segura, permitindo ao usuário editar informações básicas e gerenciar seu avatar (foto de perfil), com reflexo consistente em toda a aplicação (header, comentários) e políticas de segurança adequadas.

## Escopo
- Perfil do usuário com campos: email (read-only), nome exibido, nome completo, bio curta, links sociais.
- Upload de avatar com corte, pré-visualização e validações.
- Exibição de avatar na UI: header e comentários, com placeholder quando ausente.
- Preferências iniciais: tema, idioma, reduzir animações.
- Persistência em `user_profiles` e sincronização com `user_metadata` do Supabase.
- Políticas de storage e RLS para o bucket de avatares.

## Personas e Casos de Uso
- Usuário autenticado: deseja personalizar nome e avatar, configurar preferências.
- Admin: visualiza perfil com os mesmos recursos; painel admin continua restrito.

## Requisitos Funcionais
1. Editar nome exibido, nome completo e bio.
2. Enviar avatar com validações: tipos aceitos `webp`, `jpg`, `png`; tamanho ≤ 2MB; dimensões mínimas 256x256; corte quadrado; conversão para `webp`.
3. Salvar avatar no `Supabase Storage` em `avatars/{user_id}/profile.webp`.
4. Persistir `avatar_url` em `user_profiles` e refletir em `supabaseUser.user_metadata`.
5. Atualizar comentários do usuário para refletir `user_name` sem quebrar histórico.
6. Exibir avatar e nome no header e na seção de comentários com fallback de iniciais.
7. Preferências: tema e idioma salvos localmente e em `user_profiles`.
8. UX resiliente: estados de carregando, sucesso e erro; reintento; suporte offline com fila.

## Requisitos Não Funcionais
- Segurança: RLS assegura que apenas o dono deve escrever no seu path; leitura pública opcional.
- Performance: compressão client-side; cache control adequado; invalidação ao trocar avatar.
- Compatibilidade: CSP atual permite `img-src 'self' data: https: blob:` e `connect-src https://*.supabase.co`.
- Acessibilidade: foco gerenciado, labels, ARIA, contraste; uploads com descrições.

## UX/Fluxo
1. Página `/perfil`: usuário vê email, nome exibido, campos adicionais e card de avatar.
2. Ao clicar em “Trocar avatar”: escolhe arquivo, recorta, pré-visualiza e salva.
3. Nome exibido: edição inline com “Salvar” e feedback; refletido na UI.
4. Preferências: selects/checkboxes com persistência imediata.

## Dados e Modelo
- Tabela `user_profiles`:
  - `email` (PK/unique), `name`, `full_name`, `bio`, `avatar_url`, `preferences_json`, `updated_at`.
- `supabaseUser.user_metadata`: `name`, `full_name`, `avatar_url` sincronizados.

## Storage e Políticas
- Bucket `avatars`:
  - Path: `avatars/{user_id}/profile.webp`.
  - Regras: `insert/update/delete` apenas por `auth.uid() = {user_id}`; leitura pública ou restrita conforme definição.
  - Headers: cache agressivo com invalidation ao atualizar o arquivo (nome fixo + query param version).

## API/Integrações
- Uso do SDK do Supabase:
  - Upload para Storage com `from('avatars')`.
  - Upsert em `user_profiles` e update em `auth.updateUser`.
- Sem endpoints próprios inicialmente.

## Segurança
- Sanitização de strings; limite de tamanho e formatos; strip de metadados.
- Rate limit client-side para uploads.
- Policies no Supabase para garantir isolamento por usuário.

## Rollout
1. Criar bucket e policies no Supabase.
2. Implementar UI de avatar e persistência.
3. Exibir avatar no header e comentários.
4. Testes locais e staging; validação em produção.

## Métricas de Sucesso
- % de usuários com avatar configurado.
- Tempo médio de upload e taxa de erro.
- Redução de erros de nome/consistência nos comentários.

## Riscos e Mitigações
- Erros de upload e CSP: validar headers e paths; fallback robusto.
- Quota de Storage: compressão `webp`, limite de tamanho, imagem única por usuário.
- Offline: fila local e mensagens claras.

## Cronograma
- Semana 1: storage/policies e UI de upload no perfil.
- Semana 2: sincronização e exibição na UI, testes e ajustes.