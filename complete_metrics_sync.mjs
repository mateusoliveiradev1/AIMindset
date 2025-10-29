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

console.log('🔄 SINCRONIZAÇÃO COMPLETA DE MÉTRICAS');
console.log('==================================================');

async function syncAllMetrics() {
  try {
    console.log('📊 1. Buscando TODOS os artigos...');
    
    // Buscar todos os artigos
    const { data: articles, error: articlesError } = await supabase
      .from('articles')
      .select('*')
      .order('created_at', { ascending: false });

    if (articlesError) {
      console.error('❌ Erro ao buscar artigos:', articlesError);
      return;
    }

    console.log(`✅ Encontrados ${articles.length} artigos`);
    console.log('');

    const updates = [];

    for (const article of articles) {
      console.log(`🔍 Analisando: "${article.title}"`);
      console.log(`   ID: ${article.id}`);
      
      // Métricas atuais no banco
      const currentMetrics = {
        positive_feedbacks: article.positive_feedbacks || 0,
        negative_feedbacks: article.negative_feedbacks || 0,
        comments_count: article.comments_count || 0,
        likes_count: article.likes_count || 0
      };

      console.log('   📈 Métricas atuais:', currentMetrics);

      // 1. Contar feedbacks positivos
      const { count: positiveFeedbacks } = await supabase
        .from('feedbacks')
        .select('*', { count: 'exact', head: true })
        .eq('article_id', article.id)
        .eq('is_positive', true);

      // 2. Contar feedbacks negativos
      const { count: negativeFeedbacks } = await supabase
        .from('feedbacks')
        .select('*', { count: 'exact', head: true })
        .eq('article_id', article.id)
        .eq('is_positive', false);

      // 3. Contar comentários
      const { count: commentsCount } = await supabase
        .from('comments')
        .select('*', { count: 'exact', head: true })
        .eq('article_id', article.id);

      // 4. Somar TODOS os likes de comentários
      const { data: comments } = await supabase
        .from('comments')
        .select('likes_count')
        .eq('article_id', article.id);

      const totalLikes = comments?.reduce((sum, comment) => sum + (comment.likes_count || 0), 0) || 0;

      // Métricas reais calculadas
      const realMetrics = {
        positive_feedbacks: positiveFeedbacks || 0,
        negative_feedbacks: negativeFeedbacks || 0,
        comments_count: commentsCount || 0,
        likes_count: totalLikes
      };

      console.log('   🎯 Métricas reais:', realMetrics);

      // Verificar se há diferenças
      const hasChanges = 
        currentMetrics.positive_feedbacks !== realMetrics.positive_feedbacks ||
        currentMetrics.negative_feedbacks !== realMetrics.negative_feedbacks ||
        currentMetrics.comments_count !== realMetrics.comments_count ||
        currentMetrics.likes_count !== realMetrics.likes_count;

      if (hasChanges) {
        console.log('   🔄 PRECISA ATUALIZAR!');
        
        const changes = [];
        if (currentMetrics.positive_feedbacks !== realMetrics.positive_feedbacks) {
          changes.push(`Feedbacks+: ${currentMetrics.positive_feedbacks} → ${realMetrics.positive_feedbacks}`);
        }
        if (currentMetrics.negative_feedbacks !== realMetrics.negative_feedbacks) {
          changes.push(`Feedbacks-: ${currentMetrics.negative_feedbacks} → ${realMetrics.negative_feedbacks}`);
        }
        if (currentMetrics.comments_count !== realMetrics.comments_count) {
          changes.push(`Comentários: ${currentMetrics.comments_count} → ${realMetrics.comments_count}`);
        }
        if (currentMetrics.likes_count !== realMetrics.likes_count) {
          changes.push(`Likes: ${currentMetrics.likes_count} → ${realMetrics.likes_count}`);
        }
        
        console.log('   📝 Mudanças:', changes.join(', '));
        
        updates.push({
          id: article.id,
          title: article.title,
          current: currentMetrics,
          real: realMetrics
        });
      } else {
        console.log('   ✅ Já está sincronizado');
      }
      
      console.log('');
    }

    // Aplicar atualizações
    if (updates.length > 0) {
      console.log(`🔄 Aplicando ${updates.length} atualizações...`);
      console.log('');

      for (const update of updates) {
        console.log(`📝 Atualizando: "${update.title}"`);
        
        const { error: updateError } = await supabase
          .from('articles')
          .update({
            positive_feedbacks: update.real.positive_feedbacks,
            negative_feedbacks: update.real.negative_feedbacks,
            comments_count: update.real.comments_count,
            likes_count: update.real.likes_count
          })
          .eq('id', update.id);

        if (updateError) {
          console.error('   ❌ Erro na atualização:', updateError);
        } else {
          console.log('   ✅ Atualizado com sucesso');
        }
      }
    } else {
      console.log('✅ Todas as métricas já estão sincronizadas!');
    }

    console.log('');
    console.log('🎯 TESTE FINAL: get_featured_articles()');
    console.log('==================================================');

    // Testar função get_featured_articles
    const { data: featuredArticles, error: featuredError } = await supabase
      .rpc('get_featured_articles');

    if (featuredError) {
      console.error('❌ Erro ao executar get_featured_articles:', featuredError);
    } else {
      console.log('✅ Função executada com sucesso');
      console.log(`✅ Retornou ${featuredArticles.length} artigos em destaque`);
      console.log('');

      console.log('📊 ARTIGOS EM DESTAQUE (ordenados por score):');
      featuredArticles.forEach((article, index) => {
        const score = (article.positive_feedbacks * 3) + (article.comments_count * 2) + article.likes_count;
        console.log(`   ${index + 1}. "${article.title}"`);
        console.log(`      • Score: ${score}`);
        console.log(`      • Feedbacks+: ${article.positive_feedbacks}`);
        console.log(`      • Comentários: ${article.comments_count}`);
        console.log(`      • Likes: ${article.likes_count}`);
        console.log(`      • Is Featured: ${article.is_featured}`);
        console.log('');
      });
    }

    console.log('🎉 SINCRONIZAÇÃO COMPLETA FINALIZADA!');
    
  } catch (error) {
    console.error('❌ Erro durante a sincronização:', error);
  }
}

// Executar sincronização
syncAllMetrics();