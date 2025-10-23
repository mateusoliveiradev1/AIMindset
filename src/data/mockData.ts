import type { Article, Category } from '../lib/supabase';

export const mockCategories: Category[] = [
  {
    id: '1',
    name: 'Inteligência Artificial',
    slug: 'inteligencia-artificial',
    description: 'Artigos sobre IA, machine learning e deep learning',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  },
  {
    id: '2',
    name: 'Tecnologia',
    slug: 'tecnologia',
    description: 'Novidades e tendências em tecnologia',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  },
  {
    id: '3',
    name: 'Futuro',
    slug: 'futuro',
    description: 'Visões sobre o futuro da tecnologia',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  }
];

export const mockArticles: Article[] = [
  {
    id: '1',
    title: 'O Futuro da Inteligência Artificial: Tendências para 2024',
    slug: 'futuro-inteligencia-artificial-2024',
    content: `# O Futuro da Inteligência Artificial: Tendências para 2024

A inteligência artificial está evoluindo rapidamente, e 2024 promete ser um ano revolucionário. 
Neste artigo, exploramos as principais tendências que moldarão o futuro da IA.

## Principais Tendências

### 1. IA Generativa Mainstream
A IA generativa se tornará ainda mais acessível e integrada ao nosso dia a dia.

#### Aplicações Práticas
- Criação de conteúdo automatizada
- Assistentes virtuais mais inteligentes
- Ferramentas de design e arte

### 2. Automação Inteligente
Veremos avanços significativos na automação de processos complexos.

#### Setores Impactados
- Manufatura e produção
- Serviços financeiros
- Atendimento ao cliente

### 3. IA Ética e Responsável
O foco na ética e responsabilidade na IA será fundamental.

#### Desafios Éticos
- Viés algorítmico
- Privacidade de dados
- Transparência nos modelos

## Impactos na Sociedade

### Transformação do Trabalho
A IA mudará fundamentalmente como trabalhamos.

### Educação e Aprendizado
Novas formas de ensino e aprendizado emergirão.

## Conclusão

O futuro da IA é promissor, mas requer cuidado e responsabilidade.
    `,
    excerpt: 'Descubra as principais tendências da inteligência artificial para 2024 e como elas impactarão nosso futuro.',
    meta_description: 'Descubra as principais tendências da inteligência artificial para 2024 e como elas impactarão nosso futuro.',
    meta_title: 'O Futuro da Inteligência Artificial: Tendências para 2024',
    featured_image: '/images/ai-future-2024.jpg',
    category_id: '1',
    category: mockCategories[0],
    author_id: '1',
    published: true,
    reading_time: 8,
    created_at: '2024-01-15T10:00:00Z',
    updated_at: '2024-01-15T10:00:00Z',
    views: 1250,
    tags: ['IA', 'Futuro', 'Tecnologia', '2024']
  },
  {
    id: '2',
    title: 'ChatGPT vs Claude: Qual é o Melhor?',
    slug: 'chatgpt-vs-claude-comparacao',
    content: `
      Uma análise detalhada comparando os dois principais assistentes de IA do mercado.
      
      ## Características do ChatGPT
      - Desenvolvido pela OpenAI
      - Excelente para tarefas criativas
      - Interface intuitiva
      
      ## Características do Claude
      - Criado pela Anthropic
      - Foco em segurança e ética
      - Melhor para análises complexas
    `,
    excerpt: 'Comparativo completo entre ChatGPT e Claude, os dois principais assistentes de IA do mercado.',
    meta_description: 'Comparativo completo entre as duas principais ferramentas de geração de imagens por IA do mercado.',
    meta_title: 'ChatGPT vs Claude: Qual é o Melhor?',
    featured_image: '/images/chatgpt-vs-claude.jpg',
    category_id: '1',
    category: mockCategories[0],
    author_id: '1',
    published: true,
    reading_time: 6,
    created_at: '2024-01-10T14:30:00Z',
    updated_at: '2024-01-10T14:30:00Z',
    views: 890,
    tags: ['ChatGPT', 'Claude', 'Comparação', 'IA']
  },
  {
    id: '3',
    title: '5 Hacks de IA para Aumentar sua Produtividade',
    slug: '5-hacks-ia-produtividade',
    content: `
      Descubra como usar a inteligência artificial para ser mais produtivo no trabalho e na vida pessoal.
      
      ## 1. Automação de E-mails
      Use IA para redigir e responder e-mails automaticamente.
      
      ## 2. Geração de Conteúdo
      Crie conteúdo de qualidade em segundos.
      
      ## 3. Análise de Dados
      Transforme dados complexos em insights acionáveis.
    `,
    excerpt: 'Aprenda 5 hacks poderosos de IA para triplicar sua produtividade no trabalho e vida pessoal.',
    meta_description: 'Aprenda 5 hacks poderosos de IA para triplicar sua produtividade no trabalho e vida pessoal.',
    meta_title: '5 Hacks de IA para Aumentar sua Produtividade',
    featured_image: '/images/ai-productivity-hacks.jpg',
    category_id: '2',
    category: mockCategories[1],
    author_id: '1',
    published: true,
    reading_time: 5,
    created_at: '2024-01-08T09:15:00Z',
    updated_at: '2024-01-08T09:15:00Z',
    views: 2100,
    tags: ['Produtividade', 'IA', 'Hacks', 'Automação']
  },
  {
    id: '4',
    title: 'GPT-4 Turbo: Tudo o que Você Precisa Saber',
    slug: 'gpt-4-turbo-novidades',
    content: `
      A OpenAI lançou o GPT-4 Turbo com melhorias significativas. Vamos explorar todas as novidades.
      
      ## Principais Melhorias
      - Janela de contexto expandida
      - Melhor precisão
      - Velocidade otimizada
      - Custo reduzido
      
      ## Impacto no Mercado
      Essas melhorias revolucionarão como usamos IA no dia a dia.
    `,
    excerpt: 'Conheça todas as novidades do GPT-4 Turbo da OpenAI e como isso impacta o mercado de IA.',
    meta_description: 'Conheça todas as novidades do GPT-4 Turbo da OpenAI e como isso impacta o mercado de IA.',
    meta_title: 'GPT-4 Turbo: Tudo o que Você Precisa Saber',
    featured_image: '/images/gpt-4-turbo.jpg',
    category_id: '1',
    category: mockCategories[0],
    author_id: '1',
    published: true,
    reading_time: 7,
    created_at: '2024-01-05T16:45:00Z',
    updated_at: '2024-01-05T16:45:00Z',
    views: 1680,
    tags: ['GPT-4', 'OpenAI', 'Turbo', 'Novidades']
  },
  {
    id: '5',
    title: 'O Futuro da Humanidade com IA: Previsões para 2030',
    slug: 'futuro-humanidade-ia-2030',
    content: `
      Como a inteligência artificial transformará a sociedade até 2030? Exploramos cenários e previsões.
      
      ## Transformações Esperadas
      
      ### Trabalho e Emprego
      - Automação de tarefas repetitivas
      - Criação de novos tipos de emprego
      - Necessidade de requalificação
      
      ### Saúde e Medicina
      - Diagnósticos mais precisos
      - Tratamentos personalizados
      - Descoberta acelerada de medicamentos
    `,
    excerpt: 'Explore as principais tendências e previsões para o futuro da IA nos próximos anos.',
    meta_description: 'Explore as principais tendências e previsões para o futuro da IA nos próximos anos.',
    meta_title: 'O Futuro da Humanidade com IA: Previsões para 2030',
    featured_image: '/images/future-humanity-ai.jpg',
    category_id: '3',
    category: mockCategories[2],
    author_id: '1',
    published: true,
    reading_time: 10,
    created_at: '2024-01-03T11:20:00Z',
    updated_at: '2024-01-03T11:20:00Z',
    views: 950,
    tags: ['Futuro', 'Humanidade', 'IA', '2030', 'Previsões']
  }
];

// Helper functions
export const getArticlesByCategory = (categorySlug: string) => {
  return mockArticles.filter(article => 
    typeof article.category === 'object' && 
    'slug' in article.category &&
    article.category.slug === categorySlug && 
    article.published
  );
};

export const getArticleById = (id: string | number) => {
  return mockArticles.find(article => article.id.toString() === id.toString());
};

export const getArticlesByCategoryId = (categoryId: string) => {
  return mockArticles.filter(article => 
    article.category_id === categoryId &&
    article.published
  );
};

export const getCategoryBySlug = (slug: string) => {
  return mockCategories.find(category => category.slug === slug);
};