// Script de debug: testa a função RPC get_next_scheduled_article
// Uso: node scripts/debug/test_get_next_scheduled_article.mjs

import { createClient } from '@supabase/supabase-js';

function line(title = '') {
  const bar = '─'.repeat(40);
  return `${bar} ${title} ${bar}`;
}

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY não definidos no ambiente.');
  console.error('Defina variables e rode:');
  console.error("$env:SUPABASE_URL='https://<project>.supabase.co'; $env:SUPABASE_SERVICE_ROLE_KEY='<service_role_key>'; node scripts/debug/test_get_next_scheduled_article.mjs");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

async function main() {
  console.log(line('🔎 TESTE get_next_scheduled_article'));
  console.log(`SUPABASE_URL=${SUPABASE_URL}`);

  try {
    const { data, error } = await supabase.rpc('get_next_scheduled_article').single();
    if (error) {
      console.error('❌ Erro ao executar RPC:', error.message || error);
      process.exit(1);
    }

    if (!data) {
      console.log('ℹ️ A função não retornou nenhum artigo agendado.');
      console.log('Verifique se existe artigo com scheduling_status = "scheduled" e scheduled_for no futuro.');
      process.exit(0);
    }

    console.log('\n✅ RPC retornou um artigo:');
    console.log(`id: ${data.id}`);
    console.log(`title: ${data.title}`);
    console.log(`slug: ${data.slug}`);
    console.log(`excerpt: ${data.excerpt}`);
    console.log(`featured_image: ${data.featured_image}`);
    console.log(`scheduled_for: ${data.scheduled_for}`);
    console.log(`category_name: ${data.category_name}`);
    console.log(`author_name: ${data.author_name}`);
    console.log(`reading_time: ${data.reading_time}`);
  } catch (e) {
    console.error('❌ Exceção ao executar RPC:', e.message || e);
    process.exit(1);
  }
}

main();