import { createClient } from '@supabase/supabase-js';

// Configuração do Supabase
const supabaseUrl = 'https://jywjqzhqynhnhetidzsa.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp5d2pxemhxeW5obmhldGlkenNhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA5MjkxMzQsImV4cCI6MjA3NjUwNTEzNH0.oTZ6B-77NGBSqa_lN2YWCtnKwKc0glWnwfuN9xQjDl0';

const supabase = createClient(supabaseUrl, supabaseKey);

// Mapeamento das descrições melhoradas usando os IDs das categorias
const improvedDescriptionsByName = {
  'Educação': 'Transforme seu aprendizado com metodologias inovadoras, recursos educacionais digitais e estratégias de desenvolvimento pessoal e profissional para a era da informação.',
  
  'Futuro': 'Explore as tendências emergentes que moldarão nossa sociedade: previsões tecnológicas, cenários futuros e insights sobre como se preparar para as transformações que estão por vir.',
  
  'IA & Tecnologia': 'Mergulhe no universo da Inteligência Artificial: desde conceitos fundamentais de Machine Learning até as aplicações mais avançadas de Deep Learning que estão revolucionando indústrias inteiras.',
  
  'Inovação': 'Descubra as inovações disruptivas e descobertas científicas que estão redefinindo limites, criando novas possibilidades e transformando a forma como vivemos e trabalhamos.',
  
  'Inteligência Artificial': 'Compreenda o impacto da IA em nossa sociedade: algoritmos inteligentes, automação cognitiva e como a inteligência artificial está moldando o futuro dos negócios e da humanidade.',
  
  'Negócios': 'Estratégias empresariais para a era digital: empreendedorismo inovador, modelos de negócio disruptivos e insights para prosperar em um mercado em constante transformação.',
  
  'Produtividade': 'Maximize seu potencial com ferramentas digitais avançadas, metodologias comprovadas e técnicas de otimização que transformarão sua eficiência pessoal e profissional.',
  
  'Tecnologia': 'Acompanhe as últimas tendências tecnológicas: inovações emergentes, gadgets revolucionários e como a tecnologia está redefinindo nossa experiência digital e conectividade.'
};

async function updateCategoriesDescriptions() {
  try {
    console.log('🔄 Atualizando descrições das categorias por nome...\n');
    
    let updatedCount = 0;
    let errorCount = 0;
    let notFoundCount = 0;
    
    for (const [categoryName, newDescription] of Object.entries(improvedDescriptionsByName)) {
      try {
        console.log(`📝 Atualizando categoria: ${categoryName}`);
        
        const { data, error } = await supabase
          .from('categories')
          .update({ description: newDescription })
          .eq('name', categoryName)
          .select();
        
        if (error) {
          console.error(`❌ Erro ao atualizar ${categoryName}:`, error.message);
          errorCount++;
        } else if (data && data.length > 0) {
          console.log(`✅ ${categoryName} atualizada com sucesso`);
          console.log(`   Nova descrição: ${newDescription.substring(0, 80)}...`);
          updatedCount++;
        } else {
          console.log(`⚠️  Categoria ${categoryName} não encontrada no banco`);
          notFoundCount++;
        }
        
        console.log('-'.repeat(80));
        
      } catch (err) {
        console.error(`❌ Erro inesperado ao atualizar ${categoryName}:`, err);
        errorCount++;
      }
    }
    
    console.log('\n📊 RESUMO DA ATUALIZAÇÃO:');
    console.log('='.repeat(50));
    console.log(`✅ Categorias atualizadas: ${updatedCount}`);
    console.log(`⚠️  Categorias não encontradas: ${notFoundCount}`);
    console.log(`❌ Erros encontrados: ${errorCount}`);
    console.log(`📋 Total processadas: ${Object.keys(improvedDescriptionsByName).length}`);
    
    if (updatedCount > 0) {
      console.log('\n🎉 Descrições das categorias melhoradas com sucesso!');
      console.log('💡 As novas descrições são mais informativas e atrativas para os usuários.');
    }
    
  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

updateCategoriesDescriptions();