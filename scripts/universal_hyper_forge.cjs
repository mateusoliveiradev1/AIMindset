
const { createClient } = require("@supabase/supabase-js");
const fetch = require("node-fetch"); // Precisamos garantir que esteja disponível ou usar o nativo se o node for 18+

const SUPABASE_URL = "https://jywjqzhqynhnhetidzsa.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp5d2pxemhxeW5obmhldGlkenNhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA5MjkxMzQsImV4cCI6MjA3NjUwNTEzNH0.oTZ6B-77NGBSqa_lN2YWCtnKwKc0glWnwfuN9xQjDl0";
const GEMINI_KEY = "AIzaSyCN8LfpGQlnhzsrLc69qw9g85Nc1DuMdXY";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const clusterDefinitions = [
    { cluster: "Tecnologia", topics: ["Engenharia de Software", "Engenharia Civil", "Arquitetura de Dados", "DevOps", "Cybersegurança", "Cloud Computing", "Blockchain", "Sistemas Embarcados", "Engenharia de Prompt", "QA Testing", "Redes de Computadores", "Bioinformática", "Telecomunicações", "Robótica Industrial", "Visão Computacional"] },
    { cluster: "Negócios", topics: ["Vendas B2B", "Gerenciamento de Projetos", "Liderança", "Recrutamento (RH)", "Vendas B2C", "Gestão Financeira", "Logística Portuária", "Supply Chain", "Seguros", "Imobiliário", "Consultoria", "Empreendedorismo Digital", "Planejamento Tributário", "E-commerce", "Franquias"] },
    { cluster: "Marketing", topics: ["Marketing Digital", "Copywriting", "Design UX/UI", "Social Media", "Criação de Conteúdo", "Podcasting", "Vídeo Marketing", "Tráfego Pago", "Branding", "Motion Design", "Ilustração Digital", "Moda", "Artes Visuais", "Fotografia", "Edição de Vídeo"] },
    { cluster: "Saúde", topics: ["Medicina", "Nutrição", "Psicologia", "Fisioterapia", "Odontologia", "Veterinária", "Biohacking", "Farmácia", "Radiologia", "Enfermagem", "Educação Física", "Dermatologia", "Oncologia", "Saúde Pública", "Terapia Holística"] },
    { cluster: "Educação", topics: ["Educação Personalizada", "Pesquisa Acadêmica", "Ensino de Idiomas", "Alfabetização", "Pós-graduação", "Desenvolvimento Infantil", "Matemática Aplicada", "História", "EAD (Ensino a Distância)", "Treinamento Corporativo"] },
    { cluster: "Finanças", topics: ["Investimentos em Cripto", "Planejamento de Aposentadoria", "Day Trading", "Análise Fundamentalista", "Educação Financeira", "Seguros de Vida", "Finanças para Startups", "Cartões de Crédito", "Empréstimos P2P", "Câmbio e Forex", "Compliance Financeiro", "Auditoria Contábil", "Gestão de Patrimônio", "Microfinanças", "Pagamentos Digitais"] },
    { cluster: "Design", topics: ["Design de Produto", "Animação 3D", "Arquitetura de Interiores", "Design Gráfico Industrial", "Produção Musical AI", "Storyboard Digital", "VFX para Cinema", "Social Media Analytics", "E-mail Marketing", "Criação de Games Indie", "Realidade Virtual", "Streaming de Vídeo", "Fotografia de Moda", "Web Design Progressivo", "Ilustração Editorial"] },
    { cluster: "Logística", topics: ["Logística Reversa", "Gestão de Frotas", "Automação de Armazéns", "Mineração de Lítio", "Saneamento Básico", "Gestão de Resíduos", "Transporte Ferroviário", "Aviação Civil", "Construção de Estradas", "Engenharia Hidráulica", "Indústria Têxtil", "Produção de Alimentos", "Petróleo e Gás", "Metalurgia", "Segurança no Trabalho"] },
    { cluster: "Especialidades Médicas", topics: ["Pediatria", "Cardiologia", "Neurologia", "Ortopedia", "Oftalmologia", "Ginecologia", "Endocrinologia", "Psiquiatria", "Radiologia Intervencionista", "Cirurgia Robótica", "Medicina do Sono", "Nutrologia Esportiva", "Dermatologia Estética", "Infectologia", "Oncologia de Precisão"] },
    { cluster: "Científico", topics: ["Astronomia de Dados", "Física de Partículas", "Química Medicinal", "Biologia Sintética", "Gestão de Laboratórios", "Publicação Científica", "Análise de Variáveis", "Bioestatística", "Ecologia Teórica", "Climatologia", "Geologia Prospectiva", "Oceanografia", "Arqueologia Digital", "Neurociência Cognitiva", "Farmacologia"] }
];

function slugify(text) {
    return text.toString().toLowerCase()
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
        .replace(/[^\w\s-]/g, '')
        .trim().replace(/\s+/g, '-');
}

async function generateUniqueContent(topic, cluster) {
    const prompt = `Gere um artigo técnico e profundo (mínimo 1000 palavras) sobre como a IA está transformando a área de "${topic}" (cluster "${cluster}") em 2026.
    
    ESTRUTURA OBRIGATÓRIA (Markdown):
    1. H1: Título Impactante.
    2. Introdução Técnica.
    3. Seção "O Novo Paradigma em ${topic}".
    4. Tabela "Top 5 Ferramentas de IA para ${topic}" (Nome, Função, Diferencial). Use ferramentas REAIS.
    5. Seção "Guia de Implementação 2026" (3 passos).
    6. Seção "FAQ" (Explique 3 dúvidas comuns do setor).

    IMPORTANTE: Tudo deve ser 100% único e focado APENAS em ${topic}.`;

    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: { maxOutputTokens: 3000 }
            })
        });

        const json = await response.json();
        if (!json.candidates) throw new Error("Sem resposta do Gemini: " + JSON.stringify(json));
        return json.candidates[0].content.parts[0].text;
    } catch (e) {
        console.error(`Erro Gemini em ${topic}:`, e.message);
        return null;
    }
}

async function startUniversalForge() {
    console.log("🔥 FORJA UNIVERSAL HIPER-ÚNICA ATIVADA 🔥");

    // Purificar antes de começar
    await supabase.from('programmatic_pages').delete().neq('id', '00000000-0000-0000-0000-000000000000');

    let total = 0;
    for (const group of clusterDefinitions) {
        for (const topic of group.topics) {
            total++;
            console.log(`[${total}] Forjando conteúdo único para: ${topic}...`);

            const content = await generateUniqueContent(topic, group.cluster);
            if (!content) continue;

            const slug = slugify(`como-usar-ia-em-${topic}`);
            const { error } = await supabase.from('programmatic_pages').insert({
                title: `Como a IA está revolucionando ${topic} em 2026`,
                template_name: 'Universal Unique',
                page_type: 'guide',
                variables: { subject: topic, cluster: group.cluster },
                slug: slug,
                content: content,
                meta_title: `IA em ${topic}: O Guia Definitivo 2026 | AIMindset`,
                meta_description: `Descubra as tendências e ferramentas de IA para ${topic}. Guia técnico profundo para 2026.`,
                keywords: ["IA", topic, group.cluster, "Futuro"],
                is_published: true
            });

            if (error) console.error(`❌ Erro DB: ${error.message}`);
            else console.log(`✅ Sucesso: /pseo/${slug}`);

            // Rate limit safety
            await new Promise(r => setTimeout(r, 2500));
        }
    }
    console.log("✨ OPERAÇÃO COMPLETA: Blog nos céus! ✨");
}

startUniversalForge();
