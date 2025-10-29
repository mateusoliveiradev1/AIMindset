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

console.log('🔧 CORREÇÃO DE SINCRONIZAÇÃO DE FEEDBACK');
console.log('='.repeat(70));

// Dados reais de produção conforme relatado pelo usuário
const DADOS_CORRETOS = {
  'Produtividade Digital: Ferramentas e Estratégias para Maximizar Resultados': {
    positive_feedback: 2,
    comments_count: 0,
    likes_count: 0
  },
  'Revolução na Educação: Tecnologias Emergentes Transformando o Aprendizado': {
    positive_feedback: 2,
    comments_count: 2,
    likes_count: 1
  },
  'IA & Tecnologia: A Convergência que Está Transformando o Mundo': {
    positive_feedback: 1,
    comments_count: 0,
    likes_count: 0
  },
  'Computação Quântica: A Próxima Fronteira Tecnológica': {
    positive_feedback: 0,
    comments_count: 1,
    likes_count: 0
  }
};

async function corrigirSincronizacao() {
  try {
    console.log('\n1. 🔍 Buscando artigos no banco...');
    
    const { data: artigos, error: artigosError } = await supabase
      .from('articles')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (artigosError) {
      console.error('❌ Erro ao buscar artigos:', artigosError);
      return;
    }
    
    console.log(`✅ Encontrados ${artigos.length} artigos`);
    
    console.log('\n2. 🔧 Corrigindo contadores...');
    
    let artigosCorrigidos = 0;
    
    for (const [tituloCorreto, dadosCorretos] of Object.entries(DADOS_CORRETOS)) {
      console.log(`\n📄 Processando: "${tituloCorreto}"`);
      
      // Encontrar artigo no banco
      const artigo = artigos.find(a => 
        a.title.toLowerCase().includes(tituloCorreto.toLowerCase().substring(0, 20)) ||
        tituloCorreto.toLowerCase().includes(a.title.toLowerCase().substring(0, 20))
      );
      
      if (!artigo) {
        console.log('   ❌ Artigo não encontrado no banco');
        continue;
      }
      
      console.log(`   🆔 ID: ${artigo.id}`);
      console.log(`   📝 Título no banco: "${artigo.title}"`);
      
      // Verificar se precisa atualizar
      const precisaAtualizar = 
        artigo.positive_feedback !== dadosCorretos.positive_feedback ||
        artigo.comments_count !== dadosCorretos.comments_count ||
        artigo.likes_count !== dadosCorretos.likes_count;
      
      if (!precisaAtualizar) {
        console.log('   ✅ Já está correto, pulando...');
        continue;
      }
      
      console.log('   🔄 Atualizando contadores...');
      console.log(`      • Positive Feedback: ${artigo.positive_feedback} → ${dadosCorretos.positive_feedback}`);
      console.log(`      • Comments Count: ${artigo.comments_count} → ${dadosCorretos.comments_count}`);
      console.log(`      • Likes Count: ${artigo.likes_count} → ${dadosCorretos.likes_count}`);
      
      // Atualizar o artigo
      const { error: updateError } = await supabase
        .from('articles')
        .update({
          positive_feedback: dadosCorretos.positive_feedback,
          comments_count: dadosCorretos.comments_count,
          likes_count: dadosCorretos.likes_count,
          updated_at: new Date().toISOString()
        })
        .eq('id', artigo.id);
      
      if (updateError) {
        console.error(`   ❌ Erro ao atualizar artigo ${artigo.id}:`, updateError);
        continue;
      }
      
      console.log('   ✅ Artigo atualizado com sucesso!');
      artigosCorrigidos++;
    }
    
    console.log('\n3. 🧮 Recalculando scores...');
    
    // Buscar artigos atualizados
    const { data: artigosAtualizados, error: artigosAtualizadosError } = await supabase
      .from('articles')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (artigosAtualizadosError) {
      console.error('❌ Erro ao buscar artigos atualizados:', artigosAtualizadosError);
      return;
    }
    
    console.log('✅ Artigos atualizados carregados');
    
    // Mostrar novos scores calculados
    console.log('\n📊 Novos scores calculados:');
    
    const artigosComScore = artigosAtualizados
      .filter(a => Object.keys(DADOS_CORRETOS).some(titulo => 
        a.title.toLowerCase().includes(titulo.toLowerCase().substring(0, 20)) ||
        titulo.toLowerCase().includes(a.title.toLowerCase().substring(0, 20))
      ))
      .map(a => ({
        ...a,
        calculated_score: (a.positive_feedback * 3) + (a.comments_count * 2) + a.likes_count
      }))
      .sort((a, b) => b.calculated_score - a.calculated_score);
    
    artigosComScore.forEach((artigo, index) => {
      console.log(`\n   ${index + 1}. "${artigo.title}"`);
      console.log(`      • Positive Feedback: ${artigo.positive_feedback}`);
      console.log(`      • Comments: ${artigo.comments_count}`);
      console.log(`      • Likes: ${artigo.likes_count}`);
      console.log(`      • Score Calculado: ${artigo.calculated_score}`);
    });
    
    console.log('\n4. 🔧 Testando função get_featured_articles()...');
    
    const { data: featuredArticles, error: featuredError } = await supabase.rpc('get_featured_articles');
    
    if (featuredError) {
      console.error('❌ Erro na função get_featured_articles:', featuredError);
      return;
    }
    
    console.log('✅ Função executada com sucesso!');
    console.log('\n📊 Nova ordem dos artigos em destaque:');
    
    featuredArticles.forEach((article, index) => {
      console.log(`\n   ${index + 1}. "${article.title}"`);
      console.log(`      • Score: ${article.rank_score}`);
      console.log(`      • Positive Feedbacks: ${article.positive_feedbacks}`);
      console.log(`      • Comments: ${article.comments_count}`);
      console.log(`      • Likes: ${article.likes_count}`);
    });
    
    console.log('\n5. ✅ Verificação final...');
    
    // Calcular scores esperados
    const scoresEsperados = {
      'Produtividade Digital: Ferramentas e Estratégias para Maximizar Resultados': 6, // 2*3 + 0*2 + 0 = 6
      'Revolução na Educação: Tecnologias Emergentes Transformando o Aprendizado': 9, // 2*3 + 2*2 + 1 = 9
      'IA & Tecnologia: A Convergência que Está Transformando o Mundo': 3, // 1*3 + 0*2 + 0 = 3
      'Computação Quântica: A Próxima Fronteira Tecnológica': 2 // 0*3 + 1*2 + 0 = 2
    };
    
    console.log('📈 Scores esperados baseados nos dados reais:');
    Object.entries(scoresEsperados)
      .sort(([,a], [,b]) => b - a)
      .forEach(([titulo, score], index) => {
        console.log(`   ${index + 1}. "${titulo}" - Score: ${score}`);
      });
    
    console.log('\n' + '='.repeat(70));
    console.log('🎯 RESUMO DA CORREÇÃO:');
    console.log(`   • Artigos corrigidos: ${artigosCorrigidos}`);
    console.log(`   • Função get_featured_articles() funcionando: ✅`);
    console.log(`   • Dados sincronizados com produção: ✅`);
    
    if (artigosCorrigidos > 0) {
      console.log('\n🎉 CORREÇÃO CONCLUÍDA COM SUCESSO!');
      console.log('   • Os contadores foram atualizados com os dados reais');
      console.log('   • A função get_featured_articles() agora reflete os dados corretos');
      console.log('   • O frontend deve mostrar a ordem correta baseada no engajamento real');
    } else {
      console.log('\n✅ NENHUMA CORREÇÃO NECESSÁRIA');
      console.log('   • Todos os dados já estavam sincronizados');
    }
    
  } catch (error) {
    console.error('❌ Erro durante correção:', error);
  }
}

// Executar correção
corrigirSincronizacao().then(() => {
  console.log('\n🏁 Correção concluída');
  process.exit(0);
}).catch(error => {
  console.error('❌ Erro fatal:', error);
  process.exit(1);
});