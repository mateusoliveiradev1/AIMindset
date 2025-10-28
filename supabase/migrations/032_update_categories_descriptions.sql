-- Atualizar descrições das categorias com textos mais informativos e atraentes
-- Melhorar a experiência do usuário na página de categorias

-- Atualizar categoria Educação
UPDATE categories 
SET description = 'Transforme seu aprendizado com metodologias inovadoras, recursos educacionais digitais e estratégias de desenvolvimento pessoal e profissional para a era da informação.'
WHERE slug = 'educacao';

-- Atualizar categoria Futuro
UPDATE categories 
SET description = 'Explore as tendências emergentes que moldarão nossa sociedade: previsões tecnológicas, cenários futuros e insights sobre como se preparar para as transformações que estão por vir.'
WHERE slug = 'futuro';

-- Atualizar categoria IA & Tecnologia
UPDATE categories 
SET description = 'Mergulhe no universo da Inteligência Artificial: desde conceitos fundamentais de Machine Learning até as aplicações mais avançadas de Deep Learning que estão revolucionando indústrias inteiras.'
WHERE slug = 'ia-tecnologia';

-- Atualizar categoria Inovação
UPDATE categories 
SET description = 'Descubra as inovações disruptivas e descobertas científicas que estão redefinindo limites, criando novas possibilidades e transformando a forma como vivemos e trabalhamos.'
WHERE slug = 'inovacao';

-- Atualizar categoria Inteligência Artificial
UPDATE categories 
SET description = 'Compreenda o impacto da IA em nossa sociedade: algoritmos inteligentes, automação cognitiva e como a inteligência artificial está moldando o futuro dos negócios e da humanidade.'
WHERE slug = 'inteligencia-artificial';

-- Atualizar categoria Negócios
UPDATE categories 
SET description = 'Estratégias empresariais para a era digital: empreendedorismo inovador, modelos de negócio disruptivos e insights para prosperar em um mercado em constante transformação.'
WHERE slug = 'negocios';

-- Atualizar categoria Produtividade (manter a atual que já está boa, mas melhorar um pouco)
UPDATE categories 
SET description = 'Maximize seu potencial com ferramentas digitais avançadas, metodologias comprovadas e técnicas de otimização que transformarão sua eficiência pessoal e profissional.'
WHERE slug = 'produtividade';

-- Atualizar categoria Tecnologia
UPDATE categories 
SET description = 'Acompanhe as últimas tendências tecnológicas: inovações emergentes, gadgets revolucionários e como a tecnologia está redefinindo nossa experiência digital e conectividade.'
WHERE slug = 'tecnologia';

-- Verificar as atualizações
SELECT name, slug, description 
FROM categories 
ORDER BY name;