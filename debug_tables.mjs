import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function debugTables() {
  console.log('🔍 DEBUG - Estado atual das tabelas');
  console.log('============================================================');
  
  try {
    // Verificar artigos atuais
    const { data: articles, error: articlesError } = await supabase
      .from('articles')
      .select('id, title')
      .limit(5);
    
    if (articlesError) {
      console.log('❌ Erro ao buscar artigos:', articlesError.message);
    } else {
      console.log(`📊 Artigos atuais: ${articles.length}`);
      articles.forEach((article, index) => {
        console.log(`   ${index + 1}. ${article.id} - ${article.title}`);
      });
    }
    
    // Verificar backup
    const { data: backupArticles, error: backupError } = await supabase
      .from('backup_articles')
      .select('original_id, title')
      .limit(5);
    
    if (backupError) {
      console.log('❌ Erro ao buscar backup:', backupError.message);
    } else {
      console.log(`📊 Backup artigos: ${backupArticles.length}`);
      backupArticles.forEach((article, index) => {
        console.log(`   ${index + 1}. ${article.original_id} - ${article.title}`);
      });
    }
    
    // Verificar se há conflito de IDs
    if (articles && backupArticles) {
      const currentIds = articles.map(a => a.id);
      const backupIds = backupArticles.map(a => a.original_id);
      const conflicts = currentIds.filter(id => backupIds.includes(id));
      
      console.log(`⚠️  IDs em conflito: ${conflicts.length}`);
      conflicts.forEach(id => {
        console.log(`   - ${id}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
  }
}

debugTables();