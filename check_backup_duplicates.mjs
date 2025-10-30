import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function checkBackupDuplicates() {
  console.log('🔍 VERIFICANDO DUPLICATAS NO BACKUP');
  console.log('============================================================');
  
  try {
    // Verificar duplicatas em backup_articles
    const { data: backupArticles, error: backupError } = await supabase
      .from('backup_articles')
      .select('original_id, title, backup_id');
    
    if (backupError) {
      console.log('❌ Erro ao buscar backup:', backupError.message);
      return;
    }
    
    console.log(`📊 Total de registros no backup: ${backupArticles.length}`);
    
    // Agrupar por original_id para encontrar duplicatas
    const idCounts = {};
    backupArticles.forEach(article => {
      if (idCounts[article.original_id]) {
        idCounts[article.original_id]++;
      } else {
        idCounts[article.original_id] = 1;
      }
    });
    
    const duplicates = Object.entries(idCounts).filter(([id, count]) => count > 1);
    
    if (duplicates.length > 0) {
      console.log(`⚠️  IDs duplicados encontrados: ${duplicates.length}`);
      duplicates.forEach(([id, count]) => {
        console.log(`   - ${id}: ${count} vezes`);
        
        // Mostrar detalhes das duplicatas
        const duplicateArticles = backupArticles.filter(a => a.original_id === id);
        duplicateArticles.forEach((article, index) => {
          console.log(`     ${index + 1}. Backup ID: ${article.backup_id} - ${article.title}`);
        });
      });
    } else {
      console.log('✅ Nenhuma duplicata encontrada no backup');
    }
    
    // Verificar quantos backup_ids únicos existem
    const uniqueBackupIds = [...new Set(backupArticles.map(a => a.backup_id))];
    console.log(`📊 Backup IDs únicos: ${uniqueBackupIds.length}`);
    uniqueBackupIds.forEach(backupId => {
      const count = backupArticles.filter(a => a.backup_id === backupId).length;
      console.log(`   - ${backupId}: ${count} registros`);
    });
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
  }
}

checkBackupDuplicates();