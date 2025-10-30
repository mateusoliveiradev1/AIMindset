-- Criar artigo de teste com conteúdo específico para debug do TableOfContents
-- Este artigo será usado para testar a navegação do índice

INSERT INTO articles (
  title,
  slug,
  excerpt,
  content,
  category_id,
  author_id,
  published,
  tags,
  image_url,
  created_at,
  updated_at
) VALUES (
  'TESTE TESTE - Artigo para Debug do TableOfContents',
  'teste-teste',
  'Artigo de teste criado especificamente para debugar o funcionamento do TableOfContents e navegação do índice.',
  '# Introdução à IA

Este é um artigo de teste para verificar o funcionamento do TableOfContents.

## O que é Inteligência Artificial

A inteligência artificial é uma área da ciência da computação que se concentra no desenvolvimento de sistemas capazes de realizar tarefas que normalmente requerem inteligência humana.

### Tipos de IA

Existem diferentes tipos de inteligência artificial:

1. **IA Fraca (Narrow AI)**: Sistemas especializados em tarefas específicas
2. **IA Forte (General AI)**: Sistemas com capacidades cognitivas gerais
3. **Super IA**: Sistemas que superam a inteligência humana

### Aplicações Práticas

A IA tem diversas aplicações no mundo real:

- Assistentes virtuais
- Carros autônomos
- Sistemas de recomendação
- Diagnóstico médico

## Como Implementar IA

Para implementar soluções de IA, é necessário seguir alguns passos fundamentais.

### Ferramentas Necessárias

As principais ferramentas para trabalhar com IA incluem:

- Python
- TensorFlow
- PyTorch
- Jupyter Notebooks

### Primeiros Passos

Para começar com IA, recomenda-se:

1. Aprender programação em Python
2. Estudar matemática e estatística
3. Praticar com datasets públicos
4. Participar de competições online',
  (SELECT id FROM categories WHERE slug = 'ia-tecnologia' LIMIT 1),
  (SELECT id FROM admin_users LIMIT 1),
  true,
  'teste, debug, table of contents, navegação, índice, ia, inteligência artificial',
  'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800',
  NOW(),
  NOW()
) ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  content = EXCLUDED.content,
  excerpt = EXCLUDED.excerpt,
  updated_at = NOW();