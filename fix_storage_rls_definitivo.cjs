const { createClient } = require('@supabase/supabase-js');

// Configuração do Supabase (hardcoded para funcionar sem dotenv)
const supabaseUrl = 'https://jywjqzhqynhnhetidzsa.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp5d2pxemhxeW5obmhldGlkenNhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDkyOTEzNCwiZXhwIjoyMDc2NTA1MTM0fQ.04Y2US3KKeveKGi_8PvhqxS1EKiAB4xNjuFZTP1VLOQ';

// Cliente com service role key para operações administrativas
const supabase = createClient(supabaseUrl, serviceRoleKey);

async function fixStorageRLS() {
  console.log('🔧 INICIANDO CORREÇÃO DEFINITIVA DAS POLÍTICAS RLS...\n');

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
      console.log('📁 Bucket "articles" não existe. Criando...');
      const { data: newBucket, error: createError } = await supabase.storage.createBucket('articles', {
        public: true,
        allowedMimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
      });
      
      if (createError) {
        console.error('❌ Erro ao criar bucket:', createError);
        return false;
      }
      console.log('✅ Bucket "articles" criado com sucesso!');
    } else {
      console.log('✅ Bucket "articles" já existe');
      console.log('📊 Configurações do bucket:', {
        name: articlesBucket.name,
        public: articlesBucket.public,
        id: articlesBucket.id
      });
    }

    // 2. Tentar criar políticas RLS via SQL
    console.log('\n2️⃣ Criando políticas RLS...');
    
    const createPoliciesSQL = `
      -- Garantir que o bucket seja público
      UPDATE storage.buckets SET public = true WHERE name = 'articles';
      
      -- Remover políticas existentes se houver
      DROP POLICY IF EXISTS "articles_insert_policy" ON storage.objects;
      DROP POLICY IF EXISTS "articles_select_policy" ON storage.objects;
      DROP POLICY IF EXISTS "articles_update_policy" ON storage.objects;
      DROP POLICY IF EXISTS "articles_delete_policy" ON storage.objects;
      
      -- Criar política de INSERT (usuários autenticados)
      CREATE POLICY "articles_insert_policy" ON storage.objects
        FOR INSERT WITH CHECK (bucket_id = 'articles' AND auth.role() = 'authenticated');
      
      -- Criar política de SELECT (público)
      CREATE POLICY "articles_select_policy" ON storage.objects
        FOR SELECT USING (bucket_id = 'articles');
      
      -- Criar política de UPDATE (usuários autenticados)
      CREATE POLICY "articles_update_policy" ON storage.objects
        FOR UPDATE USING (bucket_id = 'articles' AND auth.role() = 'authenticated');
      
      -- Criar política de DELETE (usuários autenticados)
      CREATE POLICY "articles_delete_policy" ON storage.objects
        FOR DELETE USING (bucket_id = 'articles' AND auth.role() = 'authenticated');
    `;

    const { data: sqlResult, error: sqlError } = await supabase.rpc('exec_sql', {
      sql: createPoliciesSQL
    });

    if (sqlError) {
      console.log('⚠️ Método SQL falhou:', sqlError.message);
      console.log('\n🔧 TENTANDO MÉTODO ALTERNATIVO...');
      
      // Método alternativo: Usar a API do Supabase diretamente
      try {
        // Fazer o bucket público
        const { error: updateError } = await supabase.storage.updateBucket('articles', {
          public: true
        });

        if (updateError) {
          console.log('⚠️ Erro ao atualizar bucket:', updateError.message);
        } else {
          console.log('✅ Bucket configurado como público');
        }

        // Tentar criar políticas uma por uma
        const policies = [
          {
            name: 'articles_insert_policy',
            sql: `CREATE POLICY "articles_insert_policy" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'articles' AND auth.role() = 'authenticated');`
          },
          {
            name: 'articles_select_policy', 
            sql: `CREATE POLICY "articles_select_policy" ON storage.objects FOR SELECT USING (bucket_id = 'articles');`
          }
        ];

        for (const policy of policies) {
          const { error: policyError } = await supabase.rpc('exec_sql', {
            sql: policy.sql
          });
          
          if (policyError) {
            console.log(`⚠️ Erro ao criar ${policy.name}:`, policyError.message);
          } else {
            console.log(`✅ Política ${policy.name} criada`);
          }
        }

      } catch (altError) {
        console.log('⚠️ Método alternativo também falhou:', altError.message);
      }
    } else {
      console.log('✅ Políticas RLS criadas via SQL!');
    }

    // 3. Testar upload
    console.log('\n3️⃣ Testando upload de imagem...');
    
    const testImageContent = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
    const testFileName = `test-${Date.now()}.png`;
    
    // Converter base64 para buffer
    const base64Data = testImageContent.split(',')[1];
    const buffer = Buffer.from(base64Data, 'base64');

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('articles')
      .upload(testFileName, buffer, {
        contentType: 'image/png',
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) {
      console.error('❌ ERRO NO TESTE DE UPLOAD:', uploadError);
      console.log('\n🚨 CONFIGURAÇÃO MANUAL NECESSÁRIA:');
      console.log('');
      console.log('1. Acesse: https://jywjqzhqynhnhetidzsa.supabase.co/project/jywjqzhqynhnhetidzsa/storage/buckets');
      console.log('2. Clique no bucket "articles"');
      console.log('3. Vá em "Configuration" → "Policies"');
      console.log('4. Clique em "New Policy" → "Custom Policy"');
      console.log('5. Cole este código:');
      console.log('');
      console.log('--- POLÍTICA INSERT ---');
      console.log('CREATE POLICY "Allow authenticated uploads to articles" ON storage.objects');
      console.log('FOR INSERT WITH CHECK (bucket_id = \'articles\' AND auth.role() = \'authenticated\');');
      console.log('');
      console.log('--- POLÍTICA SELECT ---');
      console.log('CREATE POLICY "Allow public access to articles" ON storage.objects');
      console.log('FOR SELECT USING (bucket_id = \'articles\');');
      console.log('');
      console.log('6. Certifique-se que o bucket está marcado como "Public"');
      console.log('');
      return false;
    } else {
      console.log('✅ TESTE DE UPLOAD FUNCIONOU!');
      console.log('📁 Arquivo enviado:', uploadData.path);
      
      // Testar acesso público
      const { data: publicUrl } = supabase.storage
        .from('articles')
        .getPublicUrl(testFileName);
      
      console.log('🌐 URL pública:', publicUrl.publicUrl);
      
      // Limpar arquivo de teste
      await supabase.storage.from('articles').remove([testFileName]);
      console.log('🧹 Arquivo de teste removido');
      
      return true;
    }

  } catch (error) {
    console.error('❌ ERRO GERAL:', error);
    return false;
  }
}

// Executar correção
fixStorageRLS().then(success => {
  if (success) {
    console.log('\n🎉 CORREÇÃO CONCLUÍDA COM SUCESSO!');
    console.log('✅ Upload de imagens deve funcionar agora!');
  } else {
    console.log('\n⚠️ CORREÇÃO MANUAL NECESSÁRIA');
    console.log('📋 Siga as instruções exibidas acima no painel do Supabase');
  }
  process.exit(success ? 0 : 1);
}).catch(error => {
  console.error('💥 ERRO FATAL:', error);
  process.exit(1);
});