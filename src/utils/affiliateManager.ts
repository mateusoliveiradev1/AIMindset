// src/utils/affiliateManager.ts

/**
 * Configuração de Links de Afiliado
 * Adicione aqui as palavras-chave e seus respectivos links.
 * 
 * COMO PREENCHER:
 * 1. Cadastre-se nos programas de afiliados (ver README ou guia).
 * 2. Copie o seu link exclusivo (ex: https://partner.notion.so/seu-id).
 * 3. Cole abaixo substituindo os exemplos.
 */
export const AFFILIATE_LINKS: Record<string, string> = {
  // --- Ferramentas de IA ---
  // Jasper AI (Ótimo para redatores) - Cadastro: https://www.jasper.ai/partners
  'jasper': 'https://jasper.ai?fpr=seu-id-aqui',
  
  // Writesonic (Alternativa ao Jasper) - Cadastro: https://writesonic.com/affiliate
  'writesonic': 'https://writesonic.com?via=seu-id-aqui',

  // --- Produtividade & Organização ---
  // Notion (Muito popular) - Cadastro: https://www.notion.so/affiliates
  'notion': 'https://affiliate.notion.so/seu-id-aqui',
  
  // ClickUp (Gestão de Projetos) - Cadastro: https://clickup.com/partners/affiliate
  'clickup': 'https://clickup.com?fp_ref=seu-id-aqui',

  // --- Infraestrutura & Sites ---
  // Hostinger (Hospedagem) - Cadastro: https://www.hostinger.com.br/afiliados
  'hostinger': 'https://www.hostg.xyz/SH...',
  
  // Semrush (SEO e Marketing) - Cadastro: https://www.semrush.com/affiliate/
  'semrush': 'https://www.semrush.com/sem/?ref=seu-id-aqui',

  // --- Educação & Livros ---
  // Udemy (Cursos) - Cadastro: https://www.udemy.com/affiliate/
  'curso': 'https://click.linksynergy.com/fs-bin/click?id=...',
  
  // Amazon (Livros e Eletrônicos) - Cadastro: https://associados.amazon.com.br/
  'livro': 'https://amzn.to/seu-link-curto',
  'amazon': 'https://amzn.to/seu-link-curto',

  // Exemplos Genéricos (Substitua quando tiver parceiros reais)
  'chatgpt': 'https://openai.com/chatgpt', 
  'midjourney': 'https://midjourney.com',
};

/**
 * Injeta links de afiliado automaticamente no conteúdo Markdown.
 * Evita substituir palavras que já estão dentro de links markdown [texto](url).
 * 
 * @param content O conteúdo markdown original
 * @returns O conteúdo com links injetados
 */
export function injectAffiliateLinks(content: string): string {
  if (!content) return '';

  let newContent = content;
  const keywords = Object.keys(AFFILIATE_LINKS);

  // Ordena por tamanho (maior para menor) para evitar substituir substrings
  // Ex: "Marketing Digital" antes de "Marketing"
  keywords.sort((a, b) => b.length - a.length);

  keywords.forEach(keyword => {
    const url = AFFILIATE_LINKS[keyword];
    
    // Regex complexa para evitar substituir dentro de links já existentes.
    // Procura a palavra isolada (\b) que NÃO seja seguida por ]( ou ).
    // Esta é uma aproximação. Parsear AST seria o ideal, mas custoso.
    // Estratégia simples: Substituir apenas a primeira ocorrência para não poluir.
    
    const regex = new RegExp(`\\b(${keyword})\\b(?![^\\[]*\\])`, 'i');
    
    // Verifica se já não tem o link para evitar loops se rodar 2x
    if (!newContent.includes(`](${url})`)) {
       newContent = newContent.replace(regex, `[$1](${url})`);
    }
  });

  return newContent;
}
