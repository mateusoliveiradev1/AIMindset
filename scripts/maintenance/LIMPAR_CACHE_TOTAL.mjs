import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Carregar variáveis de ambiente
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variáveis de ambiente não encontradas!');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

console.log('🧹 LIMPEZA TOTAL DE CACHE - FORÇA BRUTA!');
console.log('=====================================');

try {
  // 1. VERIFICAR ESTADO ATUAL
  console.log('\n1️⃣ VERIFICANDO ESTADO ATUAL...');
  
  const { data: feedbacks, error: feedbackError } = await supabase
    .from('feedbacks')
    .select('*');
    
  const { data: comments, error: commentError } = await supabase
    .from('comments')
    .select('*');
    
  const { data: articles, error: articleError } = await supabase
    .from('articles')
    .select('id, title, positive_feedbacks, negative_feedbacks, comments_count, likes_count');

  if (feedbackError || commentError || articleError) {
    throw new Error('Erro ao verificar estado atual');
  }

  console.log(`📊 Feedbacks no banco: ${feedbacks?.length || 0}`);
  console.log(`💬 Comentários no banco: ${comments?.length || 0}`);
  console.log(`📄 Artigos no banco: ${articles?.length || 0}`);

  // 2. CRIAR SCRIPT DE LIMPEZA DE CACHE FRONTEND
  console.log('\n2️⃣ CRIANDO SCRIPT DE LIMPEZA DE CACHE FRONTEND...');
  
  const cacheCleanupScript = `
// SCRIPT DE LIMPEZA TOTAL DE CACHE - EXECUTAR NO CONSOLE DO NAVEGADOR
console.log('🧹 INICIANDO LIMPEZA TOTAL DE CACHE...');

// 1. Limpar localStorage
console.log('🗑️ Limpando localStorage...');
const localStorageKeys = Object.keys(localStorage);
localStorageKeys.forEach(key => {
  if (key.includes('article') || key.includes('feedback') || key.includes('comment') || 
      key.includes('cache') || key.includes('supabase') || key.includes('aimindset')) {
    localStorage.removeItem(key);
    console.log('❌ Removido localStorage:', key);
  }
});

// 2. Limpar sessionStorage
console.log('🗑️ Limpando sessionStorage...');
const sessionStorageKeys = Object.keys(sessionStorage);
sessionStorageKeys.forEach(key => {
  if (key.includes('article') || key.includes('feedback') || key.includes('comment') || 
      key.includes('cache') || key.includes('supabase') || key.includes('aimindset')) {
    sessionStorage.removeItem(key);
    console.log('❌ Removido sessionStorage:', key);
  }
});

// 3. Limpar IndexedDB
console.log('🗑️ Limpando IndexedDB...');
if ('indexedDB' in window) {
  const deleteDB = (dbName) => {
    return new Promise((resolve, reject) => {
      const deleteReq = indexedDB.deleteDatabase(dbName);
      deleteReq.onsuccess = () => {
        console.log('❌ IndexedDB removido:', dbName);
        resolve();
      };
      deleteReq.onerror = () => reject(deleteReq.error);
    });
  };
  
  // Tentar deletar possíveis bancos de dados
  const possibleDBs = ['aimindset-cache', 'articles-cache', 'feedback-cache', 'supabase-cache'];
  possibleDBs.forEach(dbName => {
    deleteDB(dbName).catch(err => console.log('DB não existe:', dbName));
  });
}

// 4. Limpar Cache API (Service Worker)
console.log('🗑️ Limpando Cache API...');
if ('caches' in window) {
  caches.keys().then(cacheNames => {
    cacheNames.forEach(cacheName => {
      caches.delete(cacheName).then(() => {
        console.log('❌ Cache removido:', cacheName);
      });
    });
  });
}

// 5. Forçar reload da página
console.log('🔄 CACHE LIMPO! Recarregando página em 2 segundos...');
setTimeout(() => {
  window.location.reload(true);
}, 2000);
`;

  console.log('✅ Script de limpeza criado!');
  console.log('\n📋 INSTRUÇÕES PARA LIMPAR CACHE:');
  console.log('1. Abra o painel admin no navegador');
  console.log('2. Pressione F12 para abrir DevTools');
  console.log('3. Vá na aba Console');
  console.log('4. Cole e execute o script abaixo:');
  console.log('\n' + '='.repeat(50));
  console.log(cacheCleanupScript);
  console.log('='.repeat(50));

  // 3. VERIFICAR SE DADOS ESTÃO REALMENTE ZERADOS
  console.log('\n3️⃣ VERIFICAÇÃO FINAL DOS DADOS...');
  
  if (articles && articles.length > 0) {
    let allZeroed = true;
    articles.forEach(article => {
      const pos = article.positive_feedbacks || 0;
      const neg = article.negative_feedbacks || 0;
      const com = article.comments_count || 0;
      const likes = article.likes_count || 0;
      
      if (pos > 0 || neg > 0 || com > 0 || likes > 0) {
        allZeroed = false;
        console.log(`⚠️ ${article.title}: Pos:${pos}, Neg:${neg}, Com:${com}, Likes:${likes}`);
      }
    });
    
    if (allZeroed) {
      console.log('✅ TODOS os contadores estão zerados no banco!');
    } else {
      console.log('❌ ALGUNS contadores ainda não estão zerados!');
    }
  }

  console.log('\n🎯 RESUMO:');
  console.log(`✅ Feedbacks no banco: ${feedbacks?.length || 0}`);
  console.log(`✅ Comentários no banco: ${comments?.length || 0}`);
  console.log('✅ Script de limpeza de cache criado');
  console.log('\n🔥 PRÓXIMOS PASSOS:');
  console.log('1. Execute o script no console do navegador');
  console.log('2. Aguarde o reload automático');
  console.log('3. Verifique se os valores estão zerados no painel');

} catch (error) {
  console.error('❌ ERRO:', error);
  process.exit(1);
}