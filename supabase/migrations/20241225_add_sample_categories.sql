-- Inserir categorias de exemplo se não existirem
INSERT INTO categories (name, slug, description) VALUES
('IA & Tecnologia', 'ia-tecnologia', 'Artigos sobre inteligência artificial, machine learning e tecnologias emergentes'),
('Produtividade', 'produtividade', 'Dicas e estratégias para aumentar sua produtividade pessoal e profissional'),
('Futuro', 'futuro', 'Tendências e previsões sobre o futuro da tecnologia e sociedade'),
('Inovação', 'inovacao', 'Novidades e inovações que estão transformando o mundo'),
('Negócios', 'negocios', 'Estratégias de negócios e empreendedorismo na era digital'),
('Educação', 'educacao', 'Métodos de aprendizado e educação no século XXI')
ON CONFLICT (slug) DO NOTHING;