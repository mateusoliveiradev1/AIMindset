-- Inserir categorias padrão que estão hardcoded no Header
-- Estas categorias são necessárias para sincronizar o Header com o banco de dados

INSERT INTO categories (name, slug, description) VALUES
  ('IA & Tecnologia', 'ia-tecnologia', 'Artigos sobre Inteligência Artificial, Machine Learning, Deep Learning e as últimas inovações tecnológicas que estão transformando o mundo.'),
  ('Produtividade', 'produtividade', 'Dicas, ferramentas e estratégias para aumentar sua produtividade pessoal e profissional no mundo digital.'),
  ('Futuro', 'futuro', 'Explorando tendências emergentes, previsões tecnológicas e como se preparar para o futuro da humanidade e da tecnologia.')
ON CONFLICT (slug) DO NOTHING;

-- Verificar se as categorias foram inseridas
SELECT id, name, slug, description FROM categories WHERE slug IN ('ia-tecnologia', 'produtividade', 'futuro');