const { createClient } = require('@supabase/supabase-js');

// Configuração do Supabase
const supabaseUrl = 'https://jywjqzhqynhnhetidzsa.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp5d2pxemhxeW5obmhldGlkenNhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDkyOTEzNCwiZXhwIjoyMDc2NTA1MTM0fQ.04Y2US3KKeveKGi_8PvhqxS1EKiAB4xNjuFZTP1VLOQ';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createStorageBucket() {
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
    
    // Configurar política RLS para permitir uploads públicos
    console.log('🔐 Configurando políticas de acesso...');
    
    // Política para permitir INSERT (upload) público
    const insertPolicy = `
      CREATE POLICY IF NOT EXISTS "Allow public uploads" ON storage.objects
      FOR INSERT WITH CHECK (bucket_id = 'articles');
    `;
    
    // Política para permitir SELECT (download) público
    const selectPolicy = `
      CREATE POLICY IF NOT EXISTS "Allow public downloads" ON storage.objects
      FOR SELECT USING (bucket_id = 'articles');
    `;
    
    // Executar as políticas
    const { error: insertPolicyError } = await supabase.rpc('exec_sql', { sql: insertPolicy });
    if (insertPolicyError) {
      console.log('⚠️ Política de INSERT pode já existir:', insertPolicyError.message);
    } else {
      console.log('✅ Política de upload configurada!');
    }
    
    const { error: selectPolicyError } = await supabase.rpc('exec_sql', { sql: selectPolicy });
    if (selectPolicyError) {
      console.log('⚠️ Política de SELECT pode já existir:', selectPolicyError.message);
    } else {
      console.log('✅ Política de download configurada!');
    }
    
    console.log('🎉 Configuração do Storage concluída!');
    
  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

// Executar a função
createStorageBucket();