const { createClient } = require('@supabase/supabase-js');

// Configuração do Supabase
const supabaseUrl = process.env.SUPABASE_URL || 'https://jywjqzhqynhnhetidzsa.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp5d2pxemhxeW5obmhldGlkenNhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDkyOTEzNCwiZXhwIjoyMDc2NTA1MTM0fQ.04Y2US3KKeveKGi_8PvhqxS1EKiAB4xNjuFZTP1VLOQ';

// Criar cliente com service role key para operações administrativas
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function setupStoragePolicies() {
  try {
    console.log('🔧 Configurando políticas de Storage para o bucket "articles"...');

    // 1. Tornar o bucket público para leitura
    const { data: bucketUpdate, error: bucketError } = await supabase
      .storage
      .updateBucket('articles', { public: true });

    if (bucketError) {
      console.error('❌ Erro ao tornar bucket público:', bucketError);
    } else {
      console.log('✅ Bucket "articles" configurado como público');
    }

    // 2. Criar política para upload (usando SQL direto)
    const uploadPolicySQL = `
      CREATE POLICY IF NOT EXISTS "Allow authenticated users to upload to articles bucket" 
      ON storage.objects
      FOR INSERT 
      TO authenticated
      WITH CHECK (bucket_id = 'articles');
    `;

    const { data: uploadPolicy, error: uploadError } = await supabase.rpc('exec_sql', {
      sql: uploadPolicySQL
    });

    if (uploadError) {
      console.log('⚠️  Política de upload pode já existir:', uploadError.message);
    } else {
      console.log('✅ Política de upload criada');
    }

    // 3. Criar política para leitura pública
    const readPolicySQL = `
      CREATE POLICY IF NOT EXISTS "Allow public read access to articles bucket" 
      ON storage.objects
      FOR SELECT 
      TO public
      USING (bucket_id = 'articles');
    `;

    const { data: readPolicy, error: readError } = await supabase.rpc('exec_sql', {
      sql: readPolicySQL
    });

    if (readError) {
      console.log('⚠️  Política de leitura pode já existir:', readError.message);
    } else {
      console.log('✅ Política de leitura pública criada');
    }

    console.log('🎉 Configuração de políticas concluída!');
    console.log('📝 Agora você pode fazer upload de imagens sem erro de RLS policy');

  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

// Executar configuração
setupStoragePolicies();