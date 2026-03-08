
import { GoogleGenerativeAI } from '@google/generative-ai';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const API_KEY = process.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY;
const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY;

if (!API_KEY || !SUPABASE_URL || !SUPABASE_KEY) {
    console.error('Faltam variáveis de ambiente (GEMINI_API_KEY, SUPABASE_URL, SUPABASE_KEY)');
    process.exit(1);
}

const genAI = new GoogleGenerativeAI(API_KEY);
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const articlesSummary = `
Temas: Foco, Produtividade, IA Generativa, Educação Moderna, Lovable (no-code), Ética na IA, Negócios Inteligentes, Inovação, Carreira, Ferramentas Digitais, Natal/Mindset, Tecnologia na Saúde, Computação Quântica, Programação Moderna.
`;

async function generateMass() {
    console.log('Iniciando brainstorming de nichos...');

    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const brainstormPrompt = `
    Com base nesses temas:
    ${articlesSummary}

    Gere 50 nichos específicos para Programmatic SEO.
    Cada item deve ser um JSON com:
    1. subject: O tema específico (ex: "Advogados Criminais", "Atletas Amadores", "Devs React").
    2. template: Um título de template (ex: "As Melhores Estratégias de IA para {subject}").
    3. page_type: 'guide', 'comparison' ou 'listicle'.
    
    Retorne APENAS um array JSON válido.
  `;

    try {
        const brainstormResult = await model.generateContent(brainstormPrompt);
        const brainstormText = brainstormResult.response.text();
        const variations = JSON.parse(brainstormText.replace(/```json|```/g, '').trim());

        console.log(`Gerados ${variations.length} nichos. Iniciando criação de conteúdo...`);

        for (let i = 0; i < variations.length; i++) {
            const v = variations[i];
            console.log(`[${i + 1}/${variations.length}] Gerando: ${v.subject}...`);

            const contentPrompt = `
        Gere uma página de pSEO de alta qualidade.
        TEMPLATE: ${v.template}
        VARIÁVEL subject: ${v.subject}
        
        REQUISITOS:
        1. Título H1.
        2. Excerpt curto.
        3. Conteúdo em Markdown rico.
        4. Metadados SEO.
        
        RESPONDA APENAS JSON:
        {
          "title": "...",
          "excerpt": "...",
          "content": "...",
          "metaTitle": "...",
          "metaDescription": "...",
          "keywords": ["...", "..."]
        }
      `;

            try {
                const contentResult = await model.generateContent(contentPrompt);
                const contentText = contentResult.response.text();
                const content = JSON.parse(contentText.replace(/```json|```/g, '').trim());

                const slug = v.template.toLowerCase()
                    .replace(/[^\w\s-]/g, '')
                    .replace(/\s+/g, '-') + '-' + (v.subject || 'nicho').toLowerCase().replace(/\s+/g, '-') + '-' + Date.now();

                const { error } = await supabase.from('programmatic_pages').insert({
                    template_name: v.template,
                    page_type: v.page_type,
                    variables: { subject: v.subject },
                    slug: slug,
                    content: content.content,
                    meta_title: content.metaTitle,
                    meta_description: content.metaDescription,
                    keywords: content.keywords,
                    is_published: true
                });

                if (error) throw error;
                console.log(`Sucesso: ${slug}`);
            } catch (e) {
                console.error(`Erro em ${v.subject}:`, e.message);
            }

            // Delay para evitar rate limit
            await new Promise(r => setTimeout(r, 2000));
        }

        console.log('MISSÃO CUMPRIDA!');
    } catch (err) {
        console.error('Erro fatal:', err.message);
    }
}

generateMass();
