import puppeteer from 'puppeteer';

async function testArticleLoading() {
  console.log('🚀 Iniciando teste de carregamento de artigos...');
  
  const browser = await puppeteer.launch({ 
    headless: false,
    devtools: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  try {
    const page = await browser.newPage();
    
    // Interceptar logs do console
    page.on('console', msg => {
      const type = msg.type();
      const text = msg.text();
      
      if (type === 'error') {
        console.log('❌ [Browser Error]:', text);
      } else if (type === 'warn') {
        console.log('⚠️ [Browser Warning]:', text);
      } else if (text.includes('Supabase') || text.includes('SEO') || text.includes('fetch')) {
        console.log(`📊 [Browser ${type.toUpperCase()}]:`, text);
      }
    });
    
    // Interceptar requisições de rede
    page.on('requestfailed', request => {
      console.log('🚫 [Network Failed]:', request.url(), request.failure()?.errorText);
    });
    
    page.on('response', response => {
      const url = response.url();
      const status = response.status();
      
      if (url.includes('supabase') || url.includes('seo_metadata')) {
        console.log(`🌐 [Network Response]: ${status} - ${url}`);
      }
    });
    
    console.log('📱 Navegando para a página inicial...');
    await page.goto('http://localhost:5173/', { 
      waitUntil: 'networkidle2',
      timeout: 30000 
    });
    
    // Aguardar carregamento dos artigos em destaque
    console.log('⏳ Aguardando carregamento dos artigos em destaque...');
    
    try {
      await page.waitForSelector('[data-testid="featured-articles"]', { timeout: 10000 });
      console.log('✅ Seção de artigos em destaque encontrada!');
    } catch (error) {
      console.log('⚠️ Seção de artigos em destaque não encontrada, tentando seletor alternativo...');
      
      try {
        await page.waitForSelector('.featured-articles, .articles-grid, article', { timeout: 5000 });
        console.log('✅ Artigos encontrados com seletor alternativo!');
      } catch (error2) {
        console.log('❌ Nenhum artigo encontrado na página');
      }
    }
    
    // Verificar se há skeleton loading travado
    const skeletonElements = await page.$$('.skeleton, [class*="skeleton"], [data-testid*="skeleton"]');
    if (skeletonElements.length > 0) {
      console.log(`⚠️ Encontrados ${skeletonElements.length} elementos skeleton ainda carregando`);
      
      // Aguardar mais um pouco para ver se desaparecem
      await page.waitForTimeout(5000);
      
      const remainingSkeletons = await page.$$('.skeleton, [class*="skeleton"], [data-testid*="skeleton"]');
      if (remainingSkeletons.length > 0) {
        console.log(`❌ ${remainingSkeletons.length} skeletons ainda presentes após 5s - possível travamento`);
      } else {
        console.log('✅ Skeletons desapareceram - carregamento normal');
      }
    } else {
      console.log('✅ Nenhum skeleton loading encontrado');
    }
    
    // Testar navegação para um artigo específico
    console.log('🔍 Testando navegação para artigo específico...');
    
    const articleLinks = await page.$$('a[href*="/artigo/"]');
    if (articleLinks.length > 0) {
      console.log(`📄 Encontrados ${articleLinks.length} links de artigos`);
      
      // Clicar no primeiro artigo
      const firstArticleHref = await page.evaluate(el => el.href, articleLinks[0]);
      console.log(`🔗 Navegando para: ${firstArticleHref}`);
      
      await Promise.all([
        page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 30000 }),
        articleLinks[0].click()
      ]);
      
      console.log('✅ Navegação para artigo concluída');
      
      // Verificar se a página do artigo carregou corretamente
      const articleTitle = await page.$('h1, .article-title, [data-testid="article-title"]');
      if (articleTitle) {
        const titleText = await page.evaluate(el => el.textContent, articleTitle);
        console.log(`📖 Título do artigo: ${titleText}`);
      } else {
        console.log('⚠️ Título do artigo não encontrado');
      }
      
    } else {
      console.log('❌ Nenhum link de artigo encontrado na página inicial');
    }
    
    console.log('✅ Teste de carregamento concluído com sucesso!');
    
  } catch (error) {
    console.error('💥 Erro durante o teste:', error.message);
  } finally {
    await browser.close();
  }
}

testArticleLoading();