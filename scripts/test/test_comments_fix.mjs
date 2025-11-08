import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variáveis de ambiente do Supabase não encontradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testCommentsRelation() {
  try {
    console.log('🔍 Testando relacionamento articles↔comments...');
    
    // 1. Verificar se existem comentários
    console.log('\\n1️⃣ Verificando comentários existentes...');
    const { data: comments, error: commentsError } = await supabase
      .from('comments')
      .select('*')
      .limit(5);
    
    if (commentsError) {
      console.log(`❌ Erro ao buscar comentários: ${commentsError.message}`);
    } else {
      console.log(`✅ Encontrados ${comments.length} comentários`);
      if (comments.length > 0) {
        console.log('📋 Primeiros comentários:');
        comments.forEach((comment, index) => {
          console.log(`   ${index + 1}. ID: ${comment.id}, Article: ${comment.article_id}`);
        });
      }
    }
    
    // 2. Tentar relacionamento direto
    console.log('\\n2️⃣ Testando relacionamento direto...');
    const { data: articlesWithComments, error: relationError } = await supabase
      .from('articles')
      .select(`
        id, 
        title,
        comments!inner (
          id,
          content,
          created_at
        )
      `)
      .limit(3);
    
    if (relationError) {
      console.log(`❌ Erro no relacionamento: ${relationError.message}`);
    } else {
      console.log(`✅ Relacionamento funcionando! ${articlesWithComments.length} artigos com comentários`);
    }
    
    // 3. Tentar relacionamento sem inner
    console.log('\\n3️⃣ Testando relacionamento sem inner...');
    const { data: articlesWithCommentsOuter, error: relationOuterError } = await supabase
      .from('articles')
      .select(`
        id, 
        title,
        comments (
          id,
          content,
          created_at
        )
      `)
      .limit(3);
    
    if (relationOuterError) {
      console.log(`❌ Erro no relacionamento outer: ${relationOuterError.message}`);
    } else {
      console.log(`✅ Relacionamento outer funcionando! ${articlesWithCommentsOuter.length} artigos verificados`);
    }
    
  } catch (error) {
    console.error('❌ Erro geral:', error.message);
  }
}

testCommentsRelation();