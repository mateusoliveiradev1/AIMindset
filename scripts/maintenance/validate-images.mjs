// scripts/maintenance/validate-images.mjs
import { createClient } from '@supabase/supabase-js';
import fetch from 'node-fetch';

// CONFIGURAÇÃO
const supabaseUrl = 'https://jywjqzhqynhnhetidzsa.supabase.co';
// Usando a service role key do script anterior para ter acesso total
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp5d2pxemhxeW5obmhldGlkenNhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDkyOTEzNCwiZXhwIjoyMDc2NTA1MTM0fQ.04Y2US3KKeveKGi_8PvhqxS1EKiAB4xNjuFZTP1VLOQ';

const supabase = createClient(supabaseUrl, supabaseKey);

async function validateImages() {
    console.log('🔍 Iniciando validação de imagens no banco de dados...');

    try {
        // 1. Buscar todos os artigos
        const { data: articles, error } = await supabase
            .from('articles')
            .select('id, title, image_url');

        if (error) throw error;

        console.log(`📊 Encontrados ${articles.length} artigos para verificar.`);

        const brokenImages = [];

        // 2. Verificar cada URL
        for (const article of articles) {
            const url = article.image_url;

            if (!url) {
                console.log(`⚠️ Artigo "${article.title}" (ID: ${article.id}) não tem imagem definida.`);
                continue;
            }

            try {
                const response = await fetch(url, { method: 'HEAD', timeout: 5000 });

                if (!response.ok) {
                    console.log(`❌ Imagem QUEBRADA (${response.status}): "${article.title}" -> ${url}`);
                    brokenImages.push({
                        id: article.id,
                        title: article.title,
                        url: url,
                        status: response.status
                    });
                } else {
                    console.log(`✅ Imagem OK: "${article.title}"`);
                }
            } catch (err) {
                console.log(`❌ Erro ao acessar URL: "${article.title}" -> ${url} (${err.message})`);
                brokenImages.push({
                    id: article.id,
                    title: article.title,
                    url: url,
                    error: err.message
                });
            }
        }

        // 3. Relatório Final
        console.log('\n--- RELATÓRIO DE VALIDAÇÃO ---');
        console.log(`Total verificado: ${articles.length}`);
        console.log(`Imagens funcionais: ${articles.length - brokenImages.length}`);
        console.log(`Imagens quebradas: ${brokenImages.length}`);

        if (brokenImages.length > 0) {
            console.log('\nLISTA DE IMAGENS QUEBRADAS:');
            brokenImages.forEach(img => {
                console.log(`- [${img.id}] ${img.title}: ${img.url} (${img.status || img.error})`);
            });

            console.log('\n💡 Sugestão: Use o ArticleEditor para substituir essas URLs por novas do Unsplash ou Pexels.');
        } else {
            console.log('\n🎉 Todas as imagens estão funcionando corretamente!');
        }

    } catch (error) {
        console.error('❌ Erro crítico no script:', error);
    }
}

validateImages();
