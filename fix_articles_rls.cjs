const { createClient } = require('@supabase/supabase-js');

// Configuração do Supabase com Service Role
const supabaseUrl = 'https://jywjqzhqynhnhetidzsa.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp5d2pxemhxeW5obmhldGlkenNhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDkyOTEzNCwiZXhwIjoyMDc2NTA1MTM0fQ.04Y2US3KKeveKGi_8PvhqxS1EKiAB4xNjuFZTP1VLOQ';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fixArticlesRLS() {
  console.log('🔧 CORRIGINDO RLS DA TABELA ARTICLES...\n');

  try {
    // 1. Desabilitar RLS temporariamente
    console.log('1️⃣ Desabilitando RLS na tabela articles...');
    const { error: disableError } = await supabase.rpc('exec_sql', {
      sql: 'ALTER TABLE articles DISABLE ROW LEVEL SECURITY;'
    });

    if (disableError) {
      console.log('⚠️ Não foi possível desabilitar RLS via RPC, tentando SQL direto...');
      // Tentar via query direta
      const { error: directError } = await supabase
        .from('articles')
        .select('1')
        .limit(1);
      
      if (directError) {
        console.log('ℹ️ RLS ainda ativo, continuando...');
      }
    } else {
      console.log('✅ RLS desabilitado com sucesso!');
    }

    // 2. Criar política permissiva para inserção
    console.log('\n2️⃣ Criando política permissiva para inserção...');
    const createPolicySQL = `
      DROP POLICY IF EXISTS "Allow all inserts" ON articles;
      CREATE POLICY "Allow all inserts" ON articles
      FOR INSERT
      WITH CHECK (true);
    `;

    const { error: policyError } = await supabase.rpc('exec_sql', {
      sql: createPolicySQL
    });

    if (policyError) {
      console.log('⚠️ Não foi possível criar política via RPC');
    } else {
      console.log('✅ Política de inserção criada!');
    }

    // 3. Criar política permissiva para seleção
    console.log('\n3️⃣ Criando política permissiva para seleção...');
    const selectPolicySQL = `
      DROP POLICY IF EXISTS "Allow all selects" ON articles;
      CREATE POLICY "Allow all selects" ON articles
      FOR SELECT
      USING (true);
    `;

    const { error: selectPolicyError } = await supabase.rpc('exec_sql', {
      sql: selectPolicySQL
    });

    if (selectPolicyError) {
      console.log('⚠️ Não foi possível criar política de seleção via RPC');
    } else {
      console.log('✅ Política de seleção criada!');
    }

    // 4. Reabilitar RLS com políticas permissivas
    console.log('\n4️⃣ Reabilitando RLS com políticas permissivas...');
    const { error: enableError } = await supabase.rpc('exec_sql', {
      sql: 'ALTER TABLE articles ENABLE ROW LEVEL SECURITY;'
    });

    if (enableError) {
      console.log('⚠️ Não foi possível reabilitar RLS via RPC');
    } else {
      console.log('✅ RLS reabilitado com políticas permissivas!');
    }

    // 5. Testar inserção
    console.log('\n5️⃣ Testando inserção de artigo...');
    const testArticle = {
      title: 'Teste RLS Fix - ' + Date.now(),
      excerpt: 'Teste após correção do RLS',
      content: 'Conteúdo de teste',
      image_url: '',
      category_id: null,
      author_id: null,
      published: false
    };

    const { data: insertData, error: insertError } = await supabase
      .from('articles')
      .insert([testArticle])
      .select()
      .single();

    if (insertError) {
      console.error('❌ ERRO NO TESTE DE INSERÇÃO:', insertError);
    } else {
      console.log('✅ TESTE DE INSERÇÃO FUNCIONOU!');
      console.log('🎉 ID do artigo:', insertData.id);
      console.log('📋 Título:', insertData.title);
    }

  } catch (error) {
    console.error('💥 ERRO GERAL:', error);
  }
}

// Executar a correção
fixArticlesRLS();