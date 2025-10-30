-- Atualizar imagem do artigo "O Futuro da Inteligência Artificial: 10 Previsões Revolucionárias para 2025-2030"
-- Nova imagem mais relevante ao futuro da humanidade e tecnologia

UPDATE articles 
SET 
    image_url = 'https://images.unsplash.com/photo-1518709268805-4e9042af2176?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80',
    updated_at = NOW()
WHERE slug = 'futuro-inteligencia-artificial-10-previsoes-revolucionarias-2025-2030';

-- Comentário: Nova imagem representa conceito futurista de cidade inteligente com tecnologia integrada
-- Diferente das imagens já utilizadas no site, mais específica para o tema do futuro da humanidade