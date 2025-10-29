import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Carregar variáveis de ambiente
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variáveis de ambiente do Supabase não encontradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

console.log('🔍 DIAGNÓSTICO DE SINCRONIZAÇÃO DE FEEDBACK');
console.log('='.repeat(70));

// Dados reais de produção conforme relatado pelo usuário
const DADOS_REAIS_PRODUCAO = {
  total_feedbacks_positivos: 6,
  artigos: {
    'Produtividade Digital: Ferramentas e Estratégias para Maximizar Resultados': {
      feedbacks_positivos: 2,
      comentarios: 0,
      likes: 0
    },
    'Revolução na Educação: Tecnologias Emergentes Transformando o Aprendizado': {
      feedbacks_positivos: 2,
      comentarios: 2, // 1 comentário + 1 resposta
      likes: 1 // 1 curtida de comentário
    },
    'IA & Tecnologia: A Convergência que Está Transformando o Mundo': {
      feedbacks_positivos: 1,
      comentarios: 0,
      likes: 0
    },
    'Computação Quântica: A Próxima Fronteira Tecnológica': {
      feedbacks_positivos: 0,
      comentarios: 1, // 1 comentário positivo
      likes: 0
    }
  }
};

async function diagnosticarSincronizacao() {
  try {
    console.log('\n1. 📊 Verificando dados atuais no banco...');
    
    // Buscar todos os artigos com seus dados
    const { data: artigos, error: artigosError } = await supabase
      .from('articles')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (artigosError) {
      console.error('❌ Erro ao buscar artigos:', artigosError);
      return;
    }
    
    console.log(`✅ Encontrados ${artigos.length} artigos no banco`);
    
    // Buscar todos os feedbacks
    const { data: feedbacks, error: feedbacksError } = await supabase
      .from('feedbacks')
      .select('*');
    
    if (feedbacksError) {
      console.error('❌ Erro ao buscar feedbacks:', feedbacksError);
      return;
    }
    
    console.log(`✅ Encontrados ${feedbacks.length} feedbacks no banco`);
    
    // Buscar todos os comentários
    const { data: comentarios, error: comentariosError } = await supabase
      .from('comments')
      .select('*');
    
    if (comentariosError) {
      console.error('❌ Erro ao buscar comentários:', comentariosError);
      return;
    }
    
    console.log(`✅ Encontrados ${comentarios.length} comentários no banco`);
    
    console.log('\n2. 🔍 Analisando discrepâncias...');
    
    // Contar feedbacks positivos por artigo
    const feedbacksPorArtigo = {};
    feedbacks.forEach(feedback => {
      if (feedback.type === 'positive') {
        feedbacksPorArtigo[feedback.article_id] = (feedbacksPorArtigo[feedback.article_id] || 0) + 1;
      }
    });
    
    // Contar comentários por artigo
    const comentariosPorArtigo = {};
    comentarios.forEach(comentario => {
      comentariosPorArtigo[comentario.article_id] = (comentariosPorArtigo[comentario.article_id] || 0) + 1;
    });
    
    // Contar likes de comentários por artigo
    const likesPorArtigo = {};
    comentarios.forEach(comentario => {
      if (comentario.likes_count > 0) {
        likesPorArtigo[comentario.article_id] = (likesPorArtigo[comentario.article_id] || 0) + comentario.likes_count;
      }
    });
    
    console.log('\n3. 📋 Comparação detalhada:');
    console.log('='.repeat(50));
    
    let totalFeedbacksPositivos = 0;
    let discrepanciasEncontradas = 0;
    
    // Verificar cada artigo mencionado nos dados reais
    for (const [tituloReal, dadosReais] of Object.entries(DADOS_REAIS_PRODUCAO.artigos)) {
      console.log(`\n📄 "${tituloReal}"`);
      
      // Encontrar artigo no banco (busca por título similar)
      const artigo = artigos.find(a => 
        a.title.toLowerCase().includes(tituloReal.toLowerCase().substring(0, 20)) ||
        tituloReal.toLowerCase().includes(a.title.toLowerCase().substring(0, 20))
      );
      
      if (!artigo) {
        console.log('   ❌ ARTIGO NÃO ENCONTRADO NO BANCO');
        discrepanciasEncontradas++;
        continue;
      }
      
      console.log(`   🆔 ID no banco: ${artigo.id}`);
      console.log(`   📝 Título no banco: "${artigo.title}"`);
      
      // Dados do banco
      const feedbacksBanco = feedbacksPorArtigo[artigo.id] || 0;
      const comentariosBanco = comentariosPorArtigo[artigo.id] || 0;
      const likesBanco = likesPorArtigo[artigo.id] || 0;
      
      // Dados dos contadores na tabela articles
      const feedbacksContador = artigo.positive_feedback || 0;
      const comentariosContador = artigo.comments_count || 0;
      const likesContador = artigo.likes_count || 0;
      
      console.log('\n   📊 COMPARAÇÃO:');
      console.log('   ┌─────────────────────────────────────────────────────────┐');
      console.log('   │                    │ Real │ Banco │ Contador │ Status   │');
      console.log('   ├─────────────────────────────────────────────────────────┤');
      console.log(`   │ Feedbacks Positivos│  ${dadosReais.feedbacks_positivos.toString().padStart(3)}  │  ${feedbacksBanco.toString().padStart(3)}  │    ${feedbacksContador.toString().padStart(3)}   │ ${feedbacksBanco === dadosReais.feedbacks_positivos && feedbacksContador === dadosReais.feedbacks_positivos ? '✅' : '❌'} ${feedbacksBanco !== feedbacksContador ? 'DESSYNC' : ''} │`);
      console.log(`   │ Comentários        │  ${dadosReais.comentarios.toString().padStart(3)}  │  ${comentariosBanco.toString().padStart(3)}  │    ${comentariosContador.toString().padStart(3)}   │ ${comentariosBanco === dadosReais.comentarios && comentariosContador === dadosReais.comentarios ? '✅' : '❌'} ${comentariosBanco !== comentariosContador ? 'DESSYNC' : ''} │`);
      console.log(`   │ Likes              │  ${dadosReais.likes.toString().padStart(3)}  │  ${likesBanco.toString().padStart(3)}  │    ${likesContador.toString().padStart(3)}   │ ${likesBanco === dadosReais.likes && likesContador === dadosReais.likes ? '✅' : '❌'} ${likesBanco !== likesContador ? 'DESSYNC' : ''} │`);
      console.log('   └─────────────────────────────────────────────────────────┘');
      
      // Verificar discrepâncias
      if (feedbacksBanco !== dadosReais.feedbacks_positivos || 
          feedbacksContador !== dadosReais.feedbacks_positivos ||
          comentariosBanco !== dadosReais.comentarios ||
          comentariosContador !== dadosReais.comentarios ||
          likesBanco !== dadosReais.likes ||
          likesContador !== dadosReais.likes) {
        discrepanciasEncontradas++;
        console.log('   🚨 DISCREPÂNCIA DETECTADA!');
      }
      
      totalFeedbacksPositivos += feedbacksBanco;
    }
    
    console.log('\n4. 📈 Resumo Geral:');
    console.log('='.repeat(50));
    console.log(`   Total de feedbacks positivos esperado: ${DADOS_REAIS_PRODUCAO.total_feedbacks_positivos}`);
    console.log(`   Total de feedbacks positivos no banco: ${totalFeedbacksPositivos}`);
    console.log(`   Discrepâncias encontradas: ${discrepanciasEncontradas}`);
    
    if (totalFeedbacksPositivos !== DADOS_REAIS_PRODUCAO.total_feedbacks_positivos) {
      console.log('   ❌ TOTAL NÃO CONFERE - Há problema de sincronização!');
    } else {
      console.log('   ✅ TOTAL CONFERE - Problema pode ser nos contadores individuais');
    }
    
    console.log('\n5. 🔧 Verificando função get_featured_articles()...');
    
    const { data: featuredArticles, error: featuredError } = await supabase.rpc('get_featured_articles');
    
    if (featuredError) {
      console.error('❌ Erro na função get_featured_articles:', featuredError);
      return;
    }
    
    console.log('✅ Função get_featured_articles executada com sucesso');
    console.log('\n📊 Dados retornados pela função:');
    
    featuredArticles.forEach((article, index) => {
      console.log(`\n   ${index + 1}. "${article.title}"`);
      console.log(`      • Score: ${article.rank_score}`);
      console.log(`      • Positive Feedbacks: ${article.positive_feedbacks}`);
      console.log(`      • Negative Feedbacks: ${article.negative_feedbacks}`);
      console.log(`      • Comments: ${article.comments_count}`);
      console.log(`      • Likes: ${article.likes_count}`);
    });
    
    console.log('\n' + '='.repeat(70));
    console.log('🎯 DIAGNÓSTICO COMPLETO:');
    
    if (discrepanciasEncontradas > 0) {
      console.log('❌ PROBLEMAS ENCONTRADOS:');
      console.log('   • Há discrepâncias entre dados reais e banco');
      console.log('   • Contadores podem estar desatualizados');
      console.log('   • Necessário corrigir sincronização');
    } else {
      console.log('✅ DADOS SINCRONIZADOS:');
      console.log('   • Todos os dados conferem');
      console.log('   • Sistema funcionando corretamente');
    }
    
  } catch (error) {
    console.error('❌ Erro durante diagnóstico:', error);
  }
}

// Executar diagnóstico
diagnosticarSincronizacao().then(() => {
  console.log('\n🏁 Diagnóstico concluído');
  process.exit(0);
}).catch(error => {
  console.error('❌ Erro fatal:', error);
  process.exit(1);
});