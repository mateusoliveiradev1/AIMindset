import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

console.log('🔍 VERIFICANDO AMBAS AS TABELAS DE FEEDBACK!');
console.log('============================================');

try {
  // Verificar tabela 'feedback' (singular)
  console.log('\n1️⃣ Verificando tabela FEEDBACK (singular)...');
  const { data: feedbackSingular, error: errorSingular } = await supabase
    .from('feedback')
    .select('*');
    
  if (errorSingular) {
    console.log('❌ Erro na tabela FEEDBACK:', errorSingular.message);
  } else {
    console.log(`📊 Tabela FEEDBACK (singular): ${feedbackSingular?.length || 0} registros`);
    if (feedbackSingular?.length > 0) {
      console.log('❌ ENCONTRADOS DADOS NA TABELA FEEDBACK!');
      feedbackSingular.forEach((f, i) => {
        console.log(`   ${i+1}. ID: ${f.id}, Article: ${f.article_id}, Type: ${f.type}`);
      });
    }
  }
  
  // Verificar tabela 'feedbacks' (plural)  
  console.log('\n2️⃣ Verificando tabela FEEDBACKS (plural)...');
  const { data: feedbackPlural, error: errorPlural } = await supabase
    .from('feedbacks')
    .select('*');
    
  if (errorPlural) {
    console.log('❌ Erro na tabela FEEDBACKS:', errorPlural.message);
  } else {
    console.log(`📊 Tabela FEEDBACKS (plural): ${feedbackPlural?.length || 0} registros`);
    if (feedbackPlural?.length > 0) {
      console.log('❌ ENCONTRADOS DADOS NA TABELA FEEDBACKS!');
      feedbackPlural.forEach((f, i) => {
        console.log(`   ${i+1}. ID: ${f.id}, Article: ${f.article_id}, Type: ${f.type}`);
      });
    }
  }
  
  console.log('\n🎯 RESUMO FINAL:');
  console.log(`Feedback (singular): ${feedbackSingular?.length || 0} registros`);
  console.log(`Feedbacks (plural): ${feedbackPlural?.length || 0} registros`);
  console.log(`TOTAL GERAL: ${(feedbackSingular?.length || 0) + (feedbackPlural?.length || 0)} registros`);
  
  if ((feedbackSingular?.length || 0) + (feedbackPlural?.length || 0) > 0) {
    console.log('\n🚨 PROBLEMA IDENTIFICADO!');
    console.log('Existem dados em uma ou ambas as tabelas de feedback!');
    console.log('Isso explica por que o painel admin ainda mostra feedbacks!');
  } else {
    console.log('\n✅ AMBAS AS TABELAS ESTÃO VAZIAS!');
    console.log('O problema deve ser cache do frontend.');
  }
  
} catch (error) {
  console.error('❌ ERRO GERAL:', error.message);
  process.exit(1);
}