import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Carregar variáveis de ambiente
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

console.log('🔍 Testando tabela seo_metadata...');
console.log('URL:', supabaseUrl);
console.log('Key:', supabaseKey ? 'Configurada' : 'Não encontrada');

const supabase = createClient(supabaseUrl, supabaseKey);

async function testSeoMetadata() {
  try {
    console.log('\n📊 Verificando dados na tabela seo_metadata...');
    
    // Buscar todos os registros
    const { data: allData, error: allError } = await supabase
      .from('seo_metadata')
      .select('*');
    
    if (allError) {
      console.error('❌ Erro ao buscar todos os dados:', allError);
    } else {
      console.log(`✅ Total de registros encontrados: ${allData?.length || 0}`);
      if (allData && allData.length > 0) {
        console.log('📋 Primeiros registros:');
        allData.slice(0, 3).forEach((item, index) => {
          console.log(`  ${index + 1}. Tipo: ${item.page_type}, Slug: ${item.page_slug}, Título: ${item.title}`);
        });
      }
    }

    // Testar busca específica pelo slug problemático
    const problemSlug = 'futuro-inteligencia-artificial-10-previsoes-revolucionarias-2025-2030';
    console.log(`\n🎯 Testando busca específica pelo slug: ${problemSlug}`);
    
    const { data: specificData, error: specificError } = await supabase
      .from('seo_metadata')
      .select('*')
      .eq('page_type', 'article')
      .eq('page_slug', problemSlug);
    
    if (specificError) {
      console.error('❌ Erro na busca específica:', specificError);
    } else {
      console.log(`✅ Resultado da busca específica: ${specificData?.length || 0} registros`);
      if (specificData && specificData.length > 0) {
        console.log('📄 Dados encontrados:', JSON.stringify(specificData[0], null, 2));
      } else {
        console.log('⚠️ Nenhum registro encontrado para este slug específico');
      }
    }

    // Testar busca por artigos
    console.log('\n📰 Verificando todos os artigos na tabela seo_metadata...');
    const { data: articlesData, error: articlesError } = await supabase
      .from('seo_metadata')
      .select('*')
      .eq('page_type', 'article');
    
    if (articlesError) {
      console.error('❌ Erro ao buscar artigos:', articlesError);
    } else {
      console.log(`✅ Total de artigos com SEO: ${articlesData?.length || 0}`);
      if (articlesData && articlesData.length > 0) {
        console.log('📋 Slugs dos artigos:');
        articlesData.forEach((item, index) => {
          console.log(`  ${index + 1}. ${item.page_slug}`);
        });
      }
    }

  } catch (error) {
    console.error('💥 Erro geral no teste:', error);
  }
}

testSeoMetadata();