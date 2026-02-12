// src/utils/affiliateManager.ts

/**
 * Configuração de Links de Afiliado
 * Adicione aqui as palavras-chave e seus respectivos links.
 */
export const AFFILIATE_LINKS: Record<string, string> = {
  // Ferramentas de IA
  'chatgpt': 'https://openai.com/chatgpt?ref=aimindset', // Exemplo
  'midjourney': 'https://midjourney.com?ref=aimindset',
  'copilot': 'https://github.com/features/copilot?ref=aimindset',
  
  // Produtividade
  'notion': 'https://affiliate.notion.so/aimindset',
  'trello': 'https://trello.com?ref=aimindset',
  'clickup': 'https://clickup.com?ref=aimindset',
  
  // Infraestrutura
  'hostinger': 'https://hostinger.com.br?ref=aimindset',
  'vercel': 'https://vercel.com?ref=aimindset',
  'supabase': 'https://supabase.com?ref=aimindset',
  
  // Educação
  'curso': 'https://udemy.com?ref=aimindset',
  'livro': 'https://amazon.com.br?tag=aimindset-20'
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
