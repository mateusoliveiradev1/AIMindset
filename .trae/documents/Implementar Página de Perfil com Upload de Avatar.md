## Restrições de Deploy
- Não criar novas funções serverless (`api/*.ts`) no Vercel.
- Não alterar `vercel.json`, `server.js` ou a estrutura de deploy.
- Toda a lógica de upload/persistência feita via cliente Supabase existente.

## Estratégia Sem Serverless
- Upload de avatar diretamente no Supabase Storage (`supabase-js`), como feito em artigos (`src/components/ArticleEditor.tsx:166-186`).
- Persistência de perfil via `upsert` no `user_profiles` (como `updateUserName` em `src/contexts/AuthContext.tsx:659-681`).
- Atualização de metadados do usuário autenticado com `supabase.auth.updateUser`.
- Atualização de comentários do próprio usuário via Supabase `update()` no cliente (sem endpoints novos).

## Mudanças de Dados (Supabase)
- `user_profiles`: adicionar `avatar_url TEXT` (opcional: `bio`, `website`, `location`, `linkedin_url`, `github_url`).
- `comments`: adicionar `user_avatar_url TEXT` para persistir avatar do autor.
- Bucket `avatars`: `avatars/{user.id}/avatar-{timestamp}.webp`; escrita restrita ao dono; leitura pública opcional.

## Atualizações Frontend
- `AuthContext` (`src/contexts/AuthContext.tsx`):
  - `updateUserAvatar(avatarUrl)`: atualiza metadados, `user_profiles.avatar_url`, estado local, sessão e executa update em lote na tabela `comments` do usuário atual.
  - `removeUserAvatar()`: limpa metadados e `avatar_url` do perfil; opcionalmente apaga arquivo.
- `Profile.tsx` (`src/pages/Profile.tsx:42-73`):
  - Adicionar `AvatarUploader` com validação (tipo/tamanho), preview, progresso; após upload, chama `updateUserAvatar` para refletir instantaneamente.
  - Exibir avatar com `AvatarImage` (`src/components/Performance/ImageOptimizer.tsx:187-206`) e aplicar cache busting por timestamp.
- Comentários:
  - `CommentItem.tsx:150-153, 302-306`: substituir ícones por `AvatarImage` usando:
    - Avatar do usuário atual via `supabaseUser.user_metadata.avatar_url` do contexto (instantâneo).
    - Avatar de outros autores via `comment.user_avatar_url`, com fallback ao ícone.
  - `useComments.ts:274-284`: incluir `user_avatar_url` ao inserir comentários (pego do metadado atual do usuário).

## Segurança & Acessibilidade
- Rotas admin seguem protegidas com `ProtectedRoute` (`src/App.tsx:221-234`), sem mudanças.
- Sanitizar URLs com `SecurityHeaders.sanitizeUrl` e validar arquivos (≤ 2MB, `image/png|jpeg|webp`).
- UI acessível: labels, foco, estados de carregamento, textos alternativos.

## Critérios de Aceite
- Alterar avatar atualiza imediatamente no Perfil e em comentários do usuário atual (sem reload).
- Listagens futuras de comentários exibem avatar atualizado por persistência em DB.
- Visual segue o padrão do projeto (Tailwind + componentes existentes).
- Nenhuma função nova no Vercel; deploy não quebra.

## Fases
1. Supabase: adicionar colunas e bucket `avatars` (sem mexer no Vercel).
2. Contexto: `updateUserAvatar`/`removeUserAvatar` e atualização em lote dos comentários do usuário.
3. UI Perfil: `AvatarUploader` e exibição com `AvatarImage`.
4. Comentários: renderizar avatar e enviar `user_avatar_url` no insert.
5. Testes manuais e ajustes de UX/performance.

Confirma este plano sem novas funções no Vercel para começarmos a implementação?