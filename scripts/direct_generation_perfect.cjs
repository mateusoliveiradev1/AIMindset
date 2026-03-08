
const { createClient } = require("@supabase/supabase-js");

const SUPABASE_URL = "https://jywjqzhqynhnhetidzsa.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp5d2pxemhxeW5obmhldGlkenNhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA5MjkxMzQsImV4cCI6MjA3NjUwNTEzNH0.oTZ6B-77NGBSqa_lN2YWCtnKwKc0glWnwfuN9xQjDl0";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const subjects = [
    "Engenheiros de Software", "Marketing Digital", "Gerenciamento de Projetos", "Análise de Dados",
    "Copywriting", "Educação Personalizada", "Criação de Conteúdo", "E-commerce", "Cibersegurança",
    "Designers UX/UI", "Pequenos Negócios", "Medicina", "Social Media", "Logística", "Arquitetura",
    "Direito", "Recrutamento", "Agricultura", "Investimentos", "Fotografia", "Escritores",
    "Gastronomia", "Esportes", "Vendas B2B", "Turismo", "Finanças Pessoais", "Nutrição",
    "Psicologia", "Moda", "Música", "Games", "Desenvolvimento Mobile", "Cloud Computing",
    "Blockchain", "IoT", "Energia Renovável", "Manufatura", "Atendimento ao Cliente",
    "E-mail Marketing", "SEO Avançado", "Podcasting", "Vídeo Marketing", "Tradução",
    "Pesquisa Acadêmica", "Planejamento Urbano", "Moderação de Conteúdo", "Realidade Aumentada",
    "Gestão de Crise", "Inteligência Emocional", "Liderança"
];

function slugify(text) {
    return text.toString().toLowerCase()
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // remove acentos
        .replace(/[^\w\s-]/g, '') // remove pontuacao
        .trim().replace(/\s+/g, '-'); // espacos por hifen
}

async function insertPages() {
    console.log(`Iniciando inserção de ${subjects.length} páginas com slugs perfeitos...`);

    for (let i = 0; i < subjects.length; i++) {
        const subject = subjects[i];
        const slug = slugify(`como-usar-ia-em-${subject}`);

        console.log(`[${i + 1}/${subjects.length}] Criando: ${subject} (${slug})`);

        const content = `
# O Futuro de ${subject} com Inteligência Artificial

A Inteligência Artificial está transformando a forma como trabalhamos com **${subject}**. Neste guia, exploramos as principais tendências, ferramentas e o impacto real dessa tecnologia.

## Por que a IA é essencial em ${subject}?
A adoção de IA permite uma escala sem precedentes e uma precisão que antes era impossível. No contexto de **${subject}**, a IA não apenas acelera processos, mas também desbloqueia insights que eram invisíveis ao olho humano.

### Principais Benefícios
| Benefício | Descrição |
|-----------|-----------|
| **Velocidade** | Redução drástica no tempo de execução de tarefas repetitivas. |
| **Escalabilidade** | Capacidade de processar grandes volumes de trabalho com custos reduzidos. |
| **Inovação** | Criação de novos produtos e serviços impulsionados por algoritmos. |

## Melhores Ferramentas para ${subject} em 2026
1. **Ferramenta Especializada A:** A mais completa para iniciantes.
2. **Plataforma B:** Focada em automação de workflow complexo.
3. **Solução C:** Integração nativa com grandes LLMs.

## Impacto no Mercado de Trabalho
Dominar a IA em **${subject}** não é mais um diferencial, é uma necessidade para quem deseja se manter relevante. As empresas estão buscando profissionais que saibam orquestrar essas novas tecnologias.

## Conclusão
A jornada da IA em **${subject}** está apenas começando. Fique atento às atualizações do AIMindset para não perder nenhuma novidade.

---
*Este artigo foi gerado programaticamente como parte do ecossistema AIMindset.*
        `.trim();

        const { error } = await supabase.from('programmatic_pages').insert({
            title: `Como a IA está revolucionando ${subject}`,
            template_name: `Guia Definitivo: ${subject}`,
            page_type: 'guide',
            variables: { subject },
            slug: slug,
            content: content,
            meta_title: `Como a IA está revolucionando ${subject} | AIMindset`,
            meta_description: `Descubra como dominar a Inteligência Artificial aplicada a ${subject} e leve sua carreira/negócio para o próximo nível. Guia Completo.`,
            keywords: ["IA", subject, "Automação", "Tendências 2026", "AIMindset"],
            is_published: true
        });

        if (error) console.error(`Erro ao inserir ${subject}:`, error.message);
        else console.log(`Sucesso: ${slug}`);

        await new Promise(r => setTimeout(r, 50));
    }

    console.log("PROCESSO CONCLUÍDO!");
}

insertPages();
