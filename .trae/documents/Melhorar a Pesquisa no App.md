## Estado Atual
- Input `SearchBar` controla valor, limpa e trata ESC em `src/components/UI/SearchBar.tsx:14,36,41`.
- Busca em artigos ocorre de três formas:
  - Hook com relevância e filtros em `src/hooks/useAdvancedSearch.ts:18,52-96,119-183`.
  - Busca otimizada por palavras e múltiplos campos em `src/hooks/usePerformanceOptimization.ts:240-291`.
  - Web Worker com fuzzy e score em `src/workers/articleProcessor.ts:84-170`; usado via `useArticleSearch` em `src/hooks/useWebWorker.ts:181-203`.
- Página `AllArticles` usa `SearchBar` e atualiza a URL em `src/pages/AllArticles.tsx:268-276,168-178`.
- Sintaxe de "busca avançada" existe no SEO Dashboard em `src/components/Admin/SEODashboard.tsx:1063-1077,1080-1107`.

## Objetivos
- Resultado mais relevante, rápido e consistente em todo o app.
- Fuzzy melhorado, suporte a acentos/sinônimos e gramática de consulta (`tag:`, `category:`, `title:`, `date:`).
- Sugestões e destaque visual de termos nos resultados.

## Alterações Técnicas
- Unificar backend de busca no Web Worker:
  - Expor somente `useArticleSearch.searchArticles` e remover duplicidade lógica do `usePerformanceOptimization`/`useAdvancedSearch` para a parte de matching.
  - Expandir `performSearch` com:
    - Normalização sem acentos e case-insensitive.
    - Índice invertido em memória (Map<termo, Set<id>>) para acelerar matching.
    - Fuzzy por trigramas/Levenshtein com `threshold` configurável.
    - Dicionário de sinônimos (ex.: `ia` ↔ `inteligência artificial`).
    - Retorno de posições/fields para highlighting.
- Gramática de consulta:
  - Reaproveitar a ideia do `parseAdvancedSearch` e suportar `title:`, `tag:`, `category:`, `date:`, `-term` para exclusão.
  - Parse no client e envio ao Worker como estrutura `{include, exclude, fields, dateRange}`.

## UX
- Debounce do input com `useDebouncedCallback`/`useSearchDebounce` (`src/hooks/useDebounce.ts:30-69,92-109`).
- Dropdown de sugestões (top 5) com termos de títulos/tags (reuso de `suggestions` de `useAdvancedSearch.ts:192-233`).
- Destaque dos termos correspondentes em título e excerpt.
- Acessibilidade: navegação por setas/Enter, ESC para fechar.

## Performance & Observabilidade
- Medir tempos no Worker e exibir métricas com `useWebWorkerPerformance` (`src/hooks/useWebWorker.ts:276-288`).
- Cache de resultados já existe no Worker (`articleProcessor.ts:18-21,107-113`); ajustar chave para incluir filtros avançados.

## Passos de Implementação
1. Centralizar uso do Worker na página `AllArticles` substituindo matching local por `useArticleSearch`.
2. Estender `performSearch` com normalização, índice invertido, sinônimos e retorno de `matchedFields`/posições.
3. Implementar parser de consulta avançada reutilizando padrão do SEO Dashboard e integrar ao Worker.
4. Aplicar debounce e adicionar sugestões no `SearchBar` com dropdown.
5. Implementar highlight de termos nos cards de resultados.
6. Ajustar métricas e logs de performance e garantir cache eficaz.

## Validação
- Testes unitários do matching (exato/fuzzy/sinônimos) e do parser.
- Comparar tempos antes/depois e verificar classificação por relevância.
- Testar acessibilidade do input e navegação do dropdown.
- Verificar consistência de resultados entre páginas que usam busca.
