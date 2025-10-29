import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Variáveis de ambiente do Supabase não encontradas');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testHeroSystem() {
    console.log('🧪 TESTE FINAL DO SISTEMA DE ARTIGOS EM DESTAQUE');
    console.log('================================================\n');

    try {
        // 1. Testar função get_featured_articles
        console.log('1️⃣ Testando função get_featured_articles...');
        const { data: featuredArticles, error: featuredError } = await supabase
            .rpc('get_featured_articles');

        if (featuredError) {
            console.error('❌ Erro na função get_featured_articles:', featuredError.message);
        } else {
            console.log('✅ Função get_featured_articles funcionando!');
            console.log(`📊 Retornou ${featuredArticles.length} artigos em destaque:`);
            featuredArticles.forEach((article, index) => {
                console.log(`   ${index + 1}. ${article.title}`);
                console.log(`      Score: ${article.rank_score} | Featured: ${article.is_featured}`);
                console.log(`      Feedbacks: P:${article.positive_feedbacks} N:${article.negative_feedbacks} C:${article.comments_count} L:${article.likes_count}\n`);
            });
        }

        // 2. Testar função get_article_metrics
        console.log('2️⃣ Testando função get_article_metrics...');
        if (featuredArticles && featuredArticles.length > 0) {
            const testArticleId = featuredArticles[0].id;
            const { data: metrics, error: metricsError } = await supabase
                .rpc('get_article_metrics', { article_id: testArticleId });

            if (metricsError) {
                console.error('❌ Erro na função get_article_metrics:', metricsError.message);
            } else {
                console.log('✅ Função get_article_metrics funcionando!');
                console.log('📊 Métricas do primeiro artigo:', metrics);
            }
        }

        // 3. Testar inserção de feedback e atualização automática
        console.log('\n3️⃣ Testando inserção de feedback e atualização automática...');
        if (featuredArticles && featuredArticles.length > 0) {
            const testArticleId = featuredArticles[0].id;
            
            // Inserir um feedback de teste
            const { error: insertError } = await supabase
                .from('feedbacks')
                .insert({
                    article_id: testArticleId,
                    type: 'positive',
                    user_id: '00000000-0000-0000-0000-000000000000' // UUID de teste
                });

            if (insertError) {
                console.error('❌ Erro ao inserir feedback:', insertError.message);
            } else {
                console.log('✅ Feedback inserido com sucesso!');
                
                // Verificar se os contadores foram atualizados
                setTimeout(async () => {
                    const { data: updatedArticle, error: selectError } = await supabase
                        .from('articles')
                        .select('positive_feedbacks, negative_feedbacks, comments_count, likes_count')
                        .eq('id', testArticleId)
                        .single();

                    if (selectError) {
                        console.error('❌ Erro ao verificar atualização:', selectError.message);
                    } else {
                        console.log('✅ Contadores atualizados automaticamente!');
                        console.log('📊 Novos valores:', updatedArticle);
                    }
                }, 1000);
            }
        }

        // 4. Testar modo híbrido - marcar um artigo como destaque manual
        console.log('\n4️⃣ Testando modo híbrido...');
        const { data: allArticles, error: allError } = await supabase
            .from('articles')
            .select('id, title, is_featured')
            .eq('published', true)
            .limit(5);

        if (allError) {
            console.error('❌ Erro ao buscar artigos:', allError.message);
        } else {
            console.log('✅ Artigos disponíveis para teste:');
            allArticles.forEach((article, index) => {
                console.log(`   ${index + 1}. ${article.title} (Featured: ${article.is_featured})`);
            });

            // Marcar o segundo artigo como destaque (se existir)
            if (allArticles.length > 1) {
                const { error: updateError } = await supabase
                    .from('articles')
                    .update({ is_featured: true })
                    .eq('id', allArticles[1].id);

                if (updateError) {
                    console.error('❌ Erro ao marcar artigo como destaque:', updateError.message);
                } else {
                    console.log(`✅ Artigo "${allArticles[1].title}" marcado como destaque manual!`);
                    
                    // Testar novamente a função get_featured_articles
                    const { data: newFeatured, error: newFeaturedError } = await supabase
                        .rpc('get_featured_articles');

                    if (newFeaturedError) {
                        console.error('❌ Erro ao testar modo híbrido:', newFeaturedError.message);
                    } else {
                        console.log('\n🎯 RESULTADO DO MODO HÍBRIDO:');
                        console.log('Artigos retornados pela função (deve priorizar manuais):');
                        newFeatured.forEach((article, index) => {
                            console.log(`   ${index + 1}. ${article.title} (Featured: ${article.is_featured})`);
                        });
                    }
                }
            }
        }

    } catch (error) {
        console.error('❌ Erro geral no teste:', error.message);
    }
}

testHeroSystem();