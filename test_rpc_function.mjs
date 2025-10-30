import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function testRPCFunction() {
  console.log('🧪 Testando função RPC get_article_metrics...');
  
  // Primeiro, pegar um artigo que tem dados
  const { data: articles } = await supabase
    .from('articles')
    .select('id, title')
    .limit(3);
  
  if (!articles || articles.length === 0) {
    console.log('❌ Nenhum artigo encontrado');
    return;
  }
  
  console.log('📄 Artigos encontrados:', articles.length);
  
  for (const article of articles) {
    console.log(`\n🎯 Testando artigo: ${article.title} (ID: ${article.id})`);
    
    try {
      const { data: rpcData, error: rpcError } = await supabase
        .rpc('get_article_metrics', { target_article_id: article.id });
      
      if (rpcError) {
        console.log('❌ Erro na função RPC:', rpcError.message);
      } else {
        console.log('✅ Métricas RPC:', rpcData);
        console.log('🔍 Total replies:', rpcData.total_replies);
      }
    } catch (e) {
      console.log('❌ Erro ao chamar RPC:', e.message);
    }
  }
}

testRPCFunction();