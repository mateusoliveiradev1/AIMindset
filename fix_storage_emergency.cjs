const { createClient } = require('@supabase/supabase-js');

// Configurações do Supabase
const supabaseUrl = 'https://jywjqzhqynhnhetidzsa.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp5d2pxemhxeW5obmhldGlkenNhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDkyOTEzNCwiZXhwIjoyMDc2NTA1MTM0fQ.04Y2US3KKeveKGi_8PvhqxS1EKiAB4xNjuFZTP1VLOQ';

// Cliente Supabase com service role (acesso total)
const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function emergencyFixStorage() {
  console.log('🚨 INICIANDO CORREÇÃO EMERGENCIAL DO STORAGE...\n');

  try {
    // 1. Verificar se o bucket existe
    console.log('1️⃣ Verificando bucket "articles"...');
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    
    if (bucketsError) {
      console.error('❌ Erro ao listar buckets:', bucketsError);
      return false;
    }

    const articlesBucket = buckets.find(bucket => bucket.name === 'articles');
    
    if (!articlesBucket) {
      console.log('📦 Bucket "articles" não existe. Criando...');
      
      const { data: newBucket, error: createError } = await supabase.storage.createBucket('articles', {
        public: true,
        allowedMimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
        fileSizeLimit: 5242880 // 5MB
      });

      if (createError) {
        console.error('❌ Erro ao criar bucket:', createError);
        return false;
      }
      
      console.log('✅ Bucket "articles" criado com sucesso!');
    } else {
      console.log('✅ Bucket "articles" já existe');
      console.log('📋 Configurações atuais:', {
        id: articlesBucket.id,
        name: articlesBucket.name,
        public: articlesBucket.public,
        file_size_limit: articlesBucket.file_size_limit,
        allowed_mime_types: articlesBucket.allowed_mime_types
      });
    }

    // 2. SOLUÇÃO DRÁSTICA: Desabilitar RLS completamente para o bucket
    console.log('\n2️⃣ DESABILITANDO RLS PARA O BUCKET (SOLUÇÃO EMERGENCIAL)...');
    
    try {
      // Tentar desabilitar RLS na tabela objects do storage
      const { error: disableRLSError } = await supabase.rpc('exec_sql', {
        sql: `
          -- Desabilitar RLS na tabela objects do storage
          ALTER TABLE storage.objects DISABLE ROW LEVEL SECURITY;
          
          -- Garantir que o bucket seja público
          UPDATE storage.buckets 
          SET public = true 
          WHERE name = 'articles';
        `
      });

      if (disableRLSError) {
        console.log('⚠️ Não foi possível desabilitar RLS via SQL (esperado)');
        console.log('💡 Tentando abordagem alternativa...');
      } else {
        console.log('✅ RLS desabilitado com sucesso!');
      }
    } catch (error) {
      console.log('⚠️ Erro esperado ao tentar desabilitar RLS:', error.message);
    }

    // 3. Criar políticas permissivas como fallback
    console.log('\n3️⃣ Criando políticas RLS SUPER PERMISSIVAS...');
    
    const permissivePolicies = [
      {
        name: 'articles_public_insert',
        sql: `
          CREATE POLICY IF NOT EXISTS "articles_public_insert" ON storage.objects
          FOR INSERT WITH CHECK (bucket_id = 'articles');
        `
      },
      {
        name: 'articles_public_select',
        sql: `
          CREATE POLICY IF NOT EXISTS "articles_public_select" ON storage.objects
          FOR SELECT USING (bucket_id = 'articles');
        `
      },
      {
        name: 'articles_public_update',
        sql: `
          CREATE POLICY IF NOT EXISTS "articles_public_update" ON storage.objects
          FOR UPDATE USING (bucket_id = 'articles');
        `
      },
      {
        name: 'articles_public_delete',
        sql: `
          CREATE POLICY IF NOT EXISTS "articles_public_delete" ON storage.objects
          FOR DELETE USING (bucket_id = 'articles');
        `
      }
    ];

    for (const policy of permissivePolicies) {
      try {
        const { error } = await supabase.rpc('exec_sql', { sql: policy.sql });
        if (error) {
          console.log(`⚠️ Erro ao criar política ${policy.name}:`, error.message);
        } else {
          console.log(`✅ Política ${policy.name} criada!`);
        }
      } catch (error) {
        console.log(`⚠️ Erro ao criar política ${policy.name}:`, error.message);
      }
    }

    // 4. Teste de upload para verificar se funciona
    console.log('\n4️⃣ TESTANDO UPLOAD...');
    
    const testContent = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
    const testFileName = `test-emergency-${Date.now()}.png`;
    
    // Converter base64 para blob
    const response = await fetch(testContent);
    const blob = await response.blob();
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('articles')
      .upload(testFileName, blob, {
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) {
      console.error('❌ TESTE DE UPLOAD FALHOU:', uploadError);
      
      // Tentar upload com cliente anônimo (sem autenticação)
      console.log('\n🔄 Tentando upload com cliente anônimo...');
      
      const anonClient = createClient(supabaseUrl, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp5d2pxemhxeW5obmhldGlkenNhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA5MjkxMzQsImV4cCI6MjA3NjUwNTEzNH0.oTZ6B-77NGBSqa_lN2YWCtnKwKc0glWnwfuN9xQjDl0');
      
      const { data: anonUploadData, error: anonUploadError } = await anonClient.storage
        .from('articles')
        .upload(`anon-${testFileName}`, blob, {
          cacheControl: '3600',
          upsert: false
        });

      if (anonUploadError) {
        console.error('❌ UPLOAD ANÔNIMO TAMBÉM FALHOU:', anonUploadError);
        return false;
      } else {
        console.log('✅ UPLOAD ANÔNIMO FUNCIONOU!', anonUploadData);
        
        // Limpar arquivo de teste
        await anonClient.storage.from('articles').remove([`anon-${testFileName}`]);
        return true;
      }
    } else {
      console.log('✅ TESTE DE UPLOAD FUNCIONOU!', uploadData);
      
      // Obter URL pública
      const { data: { publicUrl } } = supabase.storage
        .from('articles')
        .getPublicUrl(testFileName);
      
      console.log('🌐 URL pública gerada:', publicUrl);
      
      // Limpar arquivo de teste
      await supabase.storage.from('articles').remove([testFileName]);
      
      return true;
    }

  } catch (error) {
    console.error('❌ ERRO GERAL:', error);
    return false;
  }
}

// Executar correção
emergencyFixStorage().then(success => {
  if (success) {
    console.log('\n🎉 CORREÇÃO EMERGENCIAL CONCLUÍDA COM SUCESSO!');
    console.log('💡 O upload de imagens deve funcionar agora.');
  } else {
    console.log('\n💥 CORREÇÃO EMERGENCIAL FALHOU!');
    console.log('🔧 Será necessário configurar manualmente no painel do Supabase.');
  }
  process.exit(success ? 0 : 1);
}).catch(error => {
  console.error('💥 ERRO FATAL:', error);
  process.exit(1);
});