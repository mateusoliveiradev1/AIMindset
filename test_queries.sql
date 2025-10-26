-- Teste de queries diretas para debug
-- Verificar se há dados nas tabelas

-- 1. Testar acesso às categorias
SELECT * FROM categories;

-- 2. Testar acesso aos artigos
SELECT * FROM articles;

-- 3. Verificar políticas RLS para categories
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'categories';

-- 4. Verificar políticas RLS para articles
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'articles';

-- 5. Verificar se RLS está habilitado
SELECT schemaname, tablename, rowsecurity, forcerowsecurity
FROM pg_tables 
WHERE tablename IN ('categories', 'articles');

-- 6. Testar query específica que o frontend usa para categorias
SELECT id, name, slug, description 
FROM categories 
ORDER BY name;

-- 7. Testar query específica que o frontend usa para artigos
SELECT 
  id, title, excerpt, content, image_url, 
  category_id, author_id, published, 
  created_at, updated_at, slug, tags
FROM articles 
WHERE published = true 
ORDER BY created_at DESC;