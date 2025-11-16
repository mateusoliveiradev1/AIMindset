## Diagnóstico
- A mensagem indesejada é renderizada em `src/components/Home/FeaturedArticles.tsx:95–104`, quando `featuredArticles.length === 0`.
- Há um segundo estado vazio redundante em `src/components/Home/FeaturedArticles.tsx:127–134`.
- `featuredArticles` vem de `useHomeOptimization` e é preenchido por `useArticles.getFeaturedArticles()` via RPC `get_featured_articles`. Em alguns cenários essa RPC retorna lista vazia, gerando o estado que você não quer ver.

## Mudanças Propostas
- Hook `useHomeOptimization`:
  - Implementar fallback para `featuredArticles`: se o RPC retornar vazio, usar os artigos já carregados em `homeData.articles` (publicados) e montar uma lista de destaque alternativa.
  - Critério de ordenação do fallback: `approval_rate` desc, `positive_feedback` desc, `created_at` desc; limitar a 6 itens.
  - Resultado: `featuredArticles` nunca fica vazio quando existem artigos publicados.
- Componente `FeaturedArticles.tsx`:
  - Remover o bloco de retorno que exibe "Nenhum artigo em destaque encontrado" e os contadores (`src/components/Home/FeaturedArticles.tsx:95–104`).
  - Remover o bloco interno redundante de vazio (`src/components/Home/FeaturedArticles.tsx:127–134`).
  - Comportamento desejado:
    - Quando `loading && featuredArticles.length === 0`, manter `FeaturedArticlesSkeleton`.
    - Quando `featuredArticles.length === 0` após carregamento, ocultar a seção (retornar `null`).
    - Caso contrário, renderizar a grade normalmente.

## Verificação
- Executar a aplicação e acessar a Home.
- Forçar um cenário sem destaque (quando o RPC retornar vazio): verificar que a seção não exibe "Nenhum artigo em destaque encontrado" e que, havendo artigos publicados, mostra os 6 melhores pelo fallback.
- Validar que os contadores "Total de artigos | Publicados" não aparecem mais.

## Impacto e Segurança
- UX: elimina estados vazios visíveis na Home e mantém conteúdo relevante.
- Performance: o fallback usa dados já carregados em `homeData` sem novas requisições.
- Escopo: alterações locais em um hook e um componente; nenhuma mudança em schema/BD.

## Próximo Passo
- Aplicar as alterações descritas e validar no servidor de preview. Posso implementar agora.