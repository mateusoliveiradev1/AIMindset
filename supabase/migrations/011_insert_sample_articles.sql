-- Inserir artigos de exemplo para testar SEO otimizado
-- Primeiro, buscar ou criar categoria existente
DO $$
DECLARE
    categoria_id UUID;
BEGIN
    -- Buscar categoria existente ou usar a primeira disponível
    SELECT id INTO categoria_id FROM categories LIMIT 1;
    
    -- Se não encontrar nenhuma categoria, criar uma
    IF categoria_id IS NULL THEN
        INSERT INTO categories (name, slug, description) VALUES 
        ('Inteligência Artificial', 'inteligencia-artificial', 'Artigos sobre IA e suas aplicações')
        RETURNING id INTO categoria_id;
    END IF;

    -- Inserir artigos de exemplo com dados ricos para SEO
    INSERT INTO articles (
      title, 
      excerpt, 
      content, 
      image_url, 
      category_id, 
      published, 
      slug, 
      tags,
      created_at,
      updated_at
    ) VALUES 
    (
      'ChatGPT em 2025: Como Dominar a Ferramenta de IA Mais Poderosa',
      'Descubra as novas funcionalidades do ChatGPT em 2025 e aprenda técnicas avançadas para maximizar sua produtividade com inteligência artificial.',
      '<h2>Introdução ao ChatGPT 2025</h2><p>O ChatGPT revolucionou a forma como interagimos com inteligência artificial. Em 2025, a ferramenta ganhou novas funcionalidades que a tornam ainda mais poderosa para profissionais de todas as áreas.</p><h3>Principais Novidades</h3><p>As atualizações incluem melhor compreensão contextual, integração com ferramentas de produtividade e capacidades multimodais aprimoradas.</p><h3>Técnicas Avançadas</h3><p>Para dominar o ChatGPT, é essencial entender como criar prompts eficazes, usar templates personalizados e integrar a ferramenta em seu fluxo de trabalho diário.</p>',
      'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800',
      categoria_id,
      true,
      'chatgpt-2025-como-dominar-ferramenta-ia',
      'ChatGPT, IA, inteligência artificial, produtividade, automação, prompts, GPT-4',
      NOW() - INTERVAL '2 days',
      NOW() - INTERVAL '1 day'
    ),
    (
      'Automação com IA: 10 Ferramentas que Vão Revolucionar Seu Trabalho',
      'Conheça as melhores ferramentas de automação baseadas em IA que estão transformando a produtividade empresarial e pessoal em 2025.',
      '<h2>A Revolução da Automação</h2><p>A automação baseada em inteligência artificial está transformando radicalmente como trabalhamos. Estas 10 ferramentas representam o que há de mais avançado no mercado.</p><h3>Ferramentas de Produtividade</h3><p>Desde assistentes virtuais até sistemas de análise de dados, essas ferramentas podem automatizar tarefas repetitivas e liberar tempo para atividades estratégicas.</p><h3>Implementação Prática</h3><p>Aprenda como implementar essas ferramentas em seu dia a dia e medir o impacto na sua produtividade.</p>',
      'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=800',
      categoria_id,
      true,
      'automacao-ia-10-ferramentas-revolucionar-trabalho',
      'automação, IA, ferramentas, produtividade, tecnologia, inovação, eficiência',
      NOW() - INTERVAL '5 days',
      NOW() - INTERVAL '3 days'
    ),
    (
      'Machine Learning para Iniciantes: Guia Completo 2025',
      'Um guia abrangente sobre machine learning para quem está começando, com exemplos práticos e projetos reais para aplicar o conhecimento.',
      '<h2>O que é Machine Learning?</h2><p>Machine Learning é uma área da inteligência artificial que permite aos computadores aprender e tomar decisões sem serem explicitamente programados para cada situação.</p><h3>Tipos de Machine Learning</h3><p>Existem três tipos principais: aprendizado supervisionado, não supervisionado e por reforço. Cada um tem suas aplicações específicas.</p><h3>Primeiros Passos</h3><p>Para começar em ML, você precisa entender conceitos básicos de estatística, programação (Python é recomendado) e ter curiosidade para experimentar.</p><h3>Projetos Práticos</h3><p>Inclui exemplos de projetos como previsão de preços, classificação de imagens e análise de sentimentos em redes sociais.</p>',
      'https://images.unsplash.com/photo-1555949963-aa79dcee981c?w=800',
      categoria_id,
      true,
      'machine-learning-iniciantes-guia-completo-2025',
      'machine learning, ML, aprendizado de máquina, Python, algoritmos, dados, iniciantes',
      NOW() - INTERVAL '7 days',
      NOW() - INTERVAL '5 days'
    );
END $$;