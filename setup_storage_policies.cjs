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

    // 2. Verificar se as políticas já existem
    console.log('🔍 Verificando políticas existentes...');
    
    // Tentar fazer um upload de teste para verificar se as políticas funcionam
    console.log('🧪 Testando upload...');
    
    // Criar um arquivo de teste pequeno
    const testFile = new Blob(['test'], { type: 'text/plain' });
    const testFileName = `test-${Date.now()}.txt`;
    
    const { data: uploadTest, error: uploadTestError } = await supabase.storage
      .from('articles')
      .upload(testFileName, testFile);

    if (uploadTestError) {
      console.log('❌ Erro no teste de upload:', uploadTestError.message);
      console.log('🔧 Tentando configurar políticas via interface administrativa...');
      
      // Se o upload falhar, significa que precisamos configurar as políticas
      // Vamos tentar uma abordagem diferente usando a API administrativa
      console.log('📋 Para resolver este problema, você precisa:');
      console.log('1. Acessar o painel do Supabase: https://supabase.com/dashboard');
      console.log('2. Ir em Storage > Policies');
      console.log('3. Criar as seguintes políticas para o bucket "articles":');
      console.log('   - INSERT: authenticated users can upload');
      console.log('   - SELECT: public can read');
      console.log('4. Ou executar este SQL no SQL Editor:');
      console.log(`
CREATE POLICY "Allow authenticated users to upload to articles bucket" 
ON storage.objects
FOR INSERT 
TO authenticated
WITH CHECK (bucket_id = 'articles');

CREATE POLICY "Allow public read access to articles bucket" 
ON storage.objects
FOR SELECT 
TO public
USING (bucket_id = 'articles');
      `);
    } else {
      console.log('✅ Upload funcionando! Políticas já estão configuradas corretamente');
      
      // Limpar arquivo de teste
      await supabase.storage.from('articles').remove([testFileName]);
      console.log('🧹 Arquivo de teste removido');
    }

    console.log('🎉 Verificação concluída!');

  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

// Executar configuração
setupStoragePolicies();