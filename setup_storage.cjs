const { createClient } = require('@supabase/supabase-js');

// Configuração do Supabase
const supabaseUrl = 'https://jywjqzhqynhnhetidzsa.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp5d2pxemhxeW5obmhldGlkenNhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDkyOTEzNCwiZXhwIjoyMDc2NTA1MTM0fQ.04Y2US3KKeveKGi_8PvhqxS1EKiAB4xNjuFZTP1VLOQ';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function setupStorage() {
  try {
    console.log('🔍 Verificando buckets existentes...');
    
    // Listar buckets existentes
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    
    if (listError) {
      console.error('❌ Erro ao listar buckets:', listError);
      return;
    }
    
    console.log('📦 Buckets existentes:', buckets.map(b => b.name));
    
    // Verificar se o bucket 'articles' já existe
    const articlesExists = buckets.some(bucket => bucket.name === 'articles');
    
    if (articlesExists) {
      console.log('✅ Bucket "articles" já existe!');
    } else {
      console.log('🚀 Criando bucket "articles"...');
      
      // Criar o bucket 'articles'
      const { data: createData, error: createError } = await supabase.storage.createBucket('articles', {
        public: true,
        allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
        fileSizeLimit: 5242880 // 5MB
      });
      
      if (createError) {
        console.error('❌ Erro ao criar bucket:', createError);
        return;
      }
      
      console.log('✅ Bucket "articles" criado com sucesso!', createData);
    }
    
    console.log('🎉 Configuração do Storage concluída!');
    console.log('📝 Agora você pode fazer upload de imagens para o bucket "articles"');
    
  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

// Executar a função
setupStorage();