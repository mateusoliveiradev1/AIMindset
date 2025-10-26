import type { Article, Category } from '../lib/supabase';

export const mockCategories: Category[] = [
  {
    id: '1',
    name: 'IA & Tecnologia',
    slug: 'ia-tecnologia',
    description: 'Artigos sobre IA, machine learning e deep learning',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  },
  {
    id: '2',
    name: 'Produtividade',
    slug: 'produtividade',
    description: 'Dicas e ferramentas para aumentar sua produtividade',
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
  },
  {
    id: '4',
    name: 'Machine Learning',
    slug: 'machine-learning',
    description: 'Artigos sobre aprendizado de máquina e algoritmos',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  },
  {
    id: '5',
    name: 'Deep Learning',
    slug: 'deep-learning',
    description: 'Redes neurais e aprendizado profundo',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  },
  {
    id: '6',
    name: 'Automação',
    slug: 'automacao',
    description: 'Automação de processos e robótica',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  },
  {
    id: '7',
    name: 'Inovação',
    slug: 'inovacao',
    description: 'Inovações tecnológicas e startups',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  },
  {
    id: '8',
    name: 'Negócios',
    slug: 'negocios',
    description: 'Aplicações de IA nos negócios',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  }
];

// RESET COMPLETO: 0 artigos - todas funcionalidades mantidas
export const mockArticles: Article[] = [
  {
    id: '1',
    title: 'O Futuro da Inteligência Artificial',
    slug: 'futuro-inteligencia-artificial',
    excerpt: 'Explore as tendências e inovações que estão moldando o futuro da IA e como elas impactarão nossa sociedade.',
    content: `# O Futuro da Inteligência Artificial

A inteligência artificial está evoluindo rapidamente, transformando diversos setores da economia e da sociedade. Neste artigo, exploramos as principais tendências e inovações que estão moldando o futuro da IA.

## Principais Tendências

### 1. IA Generativa
A IA generativa está revolucionando a criação de conteúdo, desde textos até imagens e vídeos.

### 2. Automação Inteligente
Processos cada vez mais complexos estão sendo automatizados com o auxílio da IA.

### 3. IA Explicável
A necessidade de transparência nos algoritmos está impulsionando o desenvolvimento de IA explicável.

## Impactos na Sociedade

A IA continuará a transformar:
- Educação
- Saúde
- Transporte
- Trabalho

## Conclusão

O futuro da IA é promissor, mas requer planejamento cuidadoso e consideração ética.`,
    category_id: '1',
    category: mockCategories[0],
    author_id: '1',
    published: true,
    featured: true,
    tags: ['IA', 'Futuro', 'Tecnologia', 'Inovação'],
    meta_title: 'O Futuro da Inteligência Artificial - AIMindset',
    meta_description: 'Explore as tendências e inovações que estão moldando o futuro da IA e como elas impactarão nossa sociedade.',
    created_at: '2024-01-15T10:00:00Z',
    updated_at: '2024-01-15T10:00:00Z'
  },
  {
    id: '2',
    title: 'Machine Learning na Prática',
    slug: 'machine-learning-pratica',
    excerpt: 'Aprenda como aplicar machine learning em projetos reais com exemplos práticos e ferramentas essenciais.',
    content: `# Machine Learning na Prática

Machine Learning é uma das áreas mais empolgantes da tecnologia atual. Este artigo apresenta como aplicar ML em projetos reais.

## Conceitos Fundamentais

### Tipos de Aprendizado
- **Supervisionado**: Aprendizado com dados rotulados
- **Não supervisionado**: Descoberta de padrões em dados
- **Por reforço**: Aprendizado através de recompensas

### Algoritmos Populares
1. Regressão Linear
2. Árvores de Decisão
3. Redes Neurais
4. SVM (Support Vector Machines)

## Ferramentas Essenciais

- **Python**: Linguagem principal
- **Scikit-learn**: Biblioteca fundamental
- **TensorFlow**: Para deep learning
- **Pandas**: Manipulação de dados

## Projeto Prático

Vamos criar um modelo de predição de preços:

\`\`\`python
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.linear_model import LinearRegression

# Carregar dados
data = pd.read_csv('dados.csv')

# Preparar dados
X = data[['feature1', 'feature2']]
y = data['target']

# Treinar modelo
model = LinearRegression()
model.fit(X, y)
\`\`\`

## Conclusão

Machine Learning é uma ferramenta poderosa quando aplicada corretamente.`,
    category_id: '4',
    category: mockCategories[3],
    author_id: '1',
    published: true,
    featured: true,
    tags: ['Machine Learning', 'Python', 'Prática', 'Tutorial'],
    meta_title: 'Machine Learning na Prática - Guia Completo',
    meta_description: 'Aprenda como aplicar machine learning em projetos reais com exemplos práticos e ferramentas essenciais.',
    created_at: '2024-01-10T14:30:00Z',
    updated_at: '2024-01-10T14:30:00Z'
  },
  {
    id: '3',
    title: 'Deep Learning: Redes Neurais Explicadas',
    slug: 'deep-learning-redes-neurais',
    excerpt: 'Entenda como funcionam as redes neurais e como elas estão revolucionando a inteligência artificial.',
    content: `# Deep Learning: Redes Neurais Explicadas

Deep Learning é um subcampo do machine learning que utiliza redes neurais artificiais para resolver problemas complexos.

## O que são Redes Neurais?

Redes neurais são modelos computacionais inspirados no funcionamento do cérebro humano. Elas consistem em:

- **Neurônios artificiais**: Unidades de processamento
- **Camadas**: Organizações dos neurônios
- **Pesos**: Conexões entre neurônios
- **Funções de ativação**: Determinam a saída dos neurônios

## Tipos de Redes Neurais

### 1. Perceptron Multicamadas (MLP)
- Rede neural básica
- Boa para problemas de classificação

### 2. Redes Neurais Convolucionais (CNN)
- Especializadas em processamento de imagens
- Usam filtros convolucionais

### 3. Redes Neurais Recorrentes (RNN)
- Processam sequências de dados
- Têm memória de estados anteriores

### 4. Transformers
- Arquitetura moderna
- Base dos modelos de linguagem como GPT

## Aplicações Práticas

- **Visão Computacional**: Reconhecimento de imagens
- **Processamento de Linguagem Natural**: Chatbots e tradução
- **Jogos**: AlphaGo e outros
- **Medicina**: Diagnóstico por imagem

## Desafios

- Necessidade de grandes volumes de dados
- Alto custo computacional
- Interpretabilidade limitada

## Conclusão

Deep Learning está transformando a IA e abrindo novas possibilidades.`,
    category_id: '5',
    category: mockCategories[4],
    author_id: '1',
    published: true,
    featured: false,
    tags: ['Deep Learning', 'Redes Neurais', 'IA', 'Tecnologia'],
    meta_title: 'Deep Learning: Redes Neurais Explicadas',
    meta_description: 'Entenda como funcionam as redes neurais e como elas estão revolucionando a inteligência artificial.',
    created_at: '2024-01-05T09:15:00Z',
    updated_at: '2024-01-05T09:15:00Z'
  },
  {
    id: '4',
    title: 'Automação com IA: Transformando Processos',
    slug: 'automacao-ia-processos',
    excerpt: 'Descubra como a inteligência artificial está automatizando processos e aumentando a eficiência empresarial.',
    content: `# Automação com IA: Transformando Processos

A automação inteligente está revolucionando a forma como as empresas operam, combinando IA com automação de processos.

## O que é Automação Inteligente?

Automação inteligente combina:
- **RPA (Robotic Process Automation)**
- **Machine Learning**
- **Processamento de Linguagem Natural**
- **Visão Computacional**

## Benefícios da Automação com IA

### Eficiência
- Redução de tempo de processamento
- Eliminação de erros humanos
- Operação 24/7

### Economia
- Redução de custos operacionais
- Melhor alocação de recursos humanos
- ROI mensurável

### Qualidade
- Consistência nos processos
- Melhoria contínua através de aprendizado
- Padronização de procedimentos

## Casos de Uso

### 1. Atendimento ao Cliente
- Chatbots inteligentes
- Classificação automática de tickets
- Análise de sentimento

### 2. Recursos Humanos
- Triagem de currículos
- Agendamento de entrevistas
- Análise de performance

### 3. Finanças
- Processamento de faturas
- Detecção de fraudes
- Reconciliação bancária

### 4. Logística
- Otimização de rotas
- Previsão de demanda
- Gestão de estoque

## Implementação

### Passos para Implementar
1. **Identificar processos**: Mapear processos candidatos
2. **Avaliar viabilidade**: Analisar ROI e complexidade
3. **Desenvolver piloto**: Criar prova de conceito
4. **Escalar**: Expandir para outros processos

### Ferramentas Populares
- **UiPath**: Plataforma RPA
- **Automation Anywhere**: Automação empresarial
- **Blue Prism**: RPA corporativo
- **Microsoft Power Automate**: Automação na nuvem

## Desafios e Considerações

- **Mudança organizacional**: Resistência à mudança
- **Segurança**: Proteção de dados sensíveis
- **Manutenção**: Atualização contínua dos sistemas
- **Ética**: Impacto no emprego

## Futuro da Automação

- **Hiperautomação**: Automação de ponta a ponta
- **IA Conversacional**: Interfaces mais naturais
- **Automação Cognitiva**: Tomada de decisões complexas

## Conclusão

A automação com IA não é apenas uma tendência, é uma necessidade para empresas que querem se manter competitivas.`,
    category_id: '6',
    category: mockCategories[5],
    author_id: '1',
    published: true,
    featured: true,
    tags: ['Automação', 'IA', 'Processos', 'Eficiência', 'RPA'],
    meta_title: 'Automação com IA: Transformando Processos Empresariais',
    meta_description: 'Descubra como a inteligência artificial está automatizando processos e aumentando a eficiência empresarial.',
    created_at: '2024-01-12T16:45:00Z',
    updated_at: '2024-01-12T16:45:00Z'
  },
  {
    id: '5',
    title: 'IA nos Negócios: Estratégias de Implementação',
    slug: 'ia-negocios-estrategias',
    excerpt: 'Aprenda como implementar inteligência artificial em sua empresa com estratégias práticas e casos de sucesso.',
    content: `# IA nos Negócios: Estratégias de Implementação

A implementação de IA nos negócios requer planejamento estratégico e execução cuidadosa. Este guia apresenta as melhores práticas.

## Por que IA nos Negócios?

### Vantagens Competitivas
- **Tomada de decisão baseada em dados**
- **Personalização em escala**
- **Otimização de operações**
- **Inovação de produtos e serviços**

### Retorno sobre Investimento
- Redução de custos operacionais
- Aumento de receita
- Melhoria da experiência do cliente
- Aceleração de processos

## Estratégias de Implementação

### 1. Avaliação e Planejamento

#### Análise de Maturidade
- Avaliar infraestrutura atual
- Identificar gaps de conhecimento
- Mapear dados disponíveis
- Definir objetivos claros

#### Roadmap Estratégico
- Priorizar casos de uso
- Estabelecer cronograma
- Definir orçamento
- Identificar recursos necessários

### 2. Casos de Uso por Setor

#### Varejo
- **Recomendação de produtos**
- **Otimização de preços**
- **Gestão de estoque**
- **Análise de comportamento do cliente**

#### Saúde
- **Diagnóstico assistido**
- **Descoberta de medicamentos**
- **Gestão de pacientes**
- **Análise de imagens médicas**

#### Finanças
- **Detecção de fraudes**
- **Análise de crédito**
- **Trading algorítmico**
- **Gestão de riscos**

#### Manufatura
- **Manutenção preditiva**
- **Controle de qualidade**
- **Otimização de produção**
- **Cadeia de suprimentos**

### 3. Implementação Técnica

#### Infraestrutura
- **Cloud Computing**: AWS, Azure, GCP
- **Plataformas de ML**: SageMaker, Azure ML
- **Ferramentas de dados**: Databricks, Snowflake
- **MLOps**: Kubeflow, MLflow

#### Equipe e Competências
- **Data Scientists**: Modelagem e análise
- **Engenheiros de ML**: Implementação e deploy
- **Engenheiros de dados**: Pipeline de dados
- **Product Managers**: Estratégia e roadmap

### 4. Governança e Ética

#### Princípios Éticos
- **Transparência**: Explicabilidade dos modelos
- **Fairness**: Evitar vieses discriminatórios
- **Privacidade**: Proteção de dados pessoais
- **Responsabilidade**: Accountability nas decisões

#### Compliance
- LGPD/GDPR compliance
- Regulamentações setoriais
- Auditoria de algoritmos
- Documentação de processos

## Casos de Sucesso

### Netflix
- Sistema de recomendação personalizado
- Otimização de conteúdo
- Análise de engajamento

### Amazon
- Alexa e assistentes virtuais
- Otimização logística
- Recomendações de produtos

### Tesla
- Condução autônoma
- Otimização de bateria
- Manutenção preditiva

## Desafios Comuns

### Técnicos
- **Qualidade dos dados**: Dados incompletos ou enviesados
- **Escalabilidade**: Modelos que não escalam
- **Integração**: Dificuldade de integrar com sistemas legados

### Organizacionais
- **Resistência à mudança**: Cultura organizacional
- **Falta de competências**: Escassez de talentos
- **Expectativas irreais**: Promessas exageradas

### Éticos e Legais
- **Vieses algorítmicos**: Discriminação não intencional
- **Privacidade**: Uso inadequado de dados
- **Transparência**: Modelos "caixa preta"

## Métricas de Sucesso

### KPIs Técnicos
- Acurácia do modelo
- Tempo de resposta
- Disponibilidade do sistema
- Taxa de erro

### KPIs de Negócio
- ROI da implementação
- Redução de custos
- Aumento de receita
- Satisfação do cliente

## Futuro da IA nos Negócios

### Tendências Emergentes
- **IA Generativa**: Criação de conteúdo
- **Edge AI**: Processamento local
- **Federated Learning**: Aprendizado distribuído
- **AutoML**: Democratização da IA

### Preparação para o Futuro
- Investimento contínuo em capacitação
- Cultura data-driven
- Parcerias estratégicas
- Inovação constante

## Conclusão

A implementação bem-sucedida de IA nos negócios requer uma abordagem holística que combine estratégia, tecnologia, pessoas e processos. O sucesso não vem apenas da tecnologia, mas de como ela é integrada à cultura e operações da empresa.`,
    category_id: '8',
    category: mockCategories[7],
    author_id: '1',
    published: true,
    featured: false,
    tags: ['IA', 'Negócios', 'Estratégia', 'Implementação', 'ROI'],
    meta_title: 'IA nos Negócios: Estratégias de Implementação - Guia Completo',
    meta_description: 'Aprenda como implementar inteligência artificial em sua empresa com estratégias práticas e casos de sucesso.',
    created_at: '2024-01-08T11:20:00Z',
    updated_at: '2024-01-08T11:20:00Z'
  }
];

export const mockAuthors = [
  {
    id: '1',
    name: 'AIMindset Team',
    bio: 'Equipe especializada em Inteligência Artificial e Tecnologia',
    avatar: '/favicon.svg',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  }
];

export const mockComments = [];

export const mockFeedback = [];