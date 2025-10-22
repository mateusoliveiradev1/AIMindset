import DOMPurify from 'dompurify';

// Configuração do DOMPurify para sanitização segura
const purifyConfig = {
  ALLOWED_TAGS: [], // Não permitir nenhuma tag HTML
  ALLOWED_ATTR: [], // Não permitir nenhum atributo
  KEEP_CONTENT: true, // Manter o conteúdo de texto
  ALLOW_DATA_ATTR: false, // Não permitir atributos data-*
};

/**
 * Sanitiza texto removendo HTML, scripts e caracteres perigosos
 */
export const sanitizeText = (text: string): string => {
  if (!text || typeof text !== 'string') {
    return '';
  }

  // Primeira passada: DOMPurify para remover HTML e scripts
  const purified = DOMPurify.sanitize(text, purifyConfig);
  
  // Segunda passada: limpeza adicional
  return purified
    .trim()
    .replace(/\s+/g, ' ') // Normalizar espaços
    .replace(/[\x00-\x1F\x7F]/g, '') // Remover caracteres de controle
    .replace(/javascript:/gi, '') // Remover javascript:
    .replace(/data:/gi, '') // Remover data:
    .replace(/vbscript:/gi, '') // Remover vbscript:
    .replace(/on\w+\s*=/gi, ''); // Remover event handlers
};

/**
 * Sanitiza nome de usuário com regras específicas
 */
export const sanitizeUserName = (name: string): string => {
  if (!name || typeof name !== 'string') {
    return '';
  }

  return sanitizeText(name)
    .replace(/[^\w\sÀ-ÿ]/g, '') // Manter apenas letras, números, espaços e acentos
    .replace(/\d/g, '') // Remover números
    .replace(/\s+/g, ' ') // Normalizar espaços
    .trim();
};

/**
 * Sanitiza conteúdo de comentário
 */
export const sanitizeCommentContent = (content: string): string => {
  if (!content || typeof content !== 'string') {
    return '';
  }

  return sanitizeText(content)
    .replace(/[<>]/g, '') // Remover < e > restantes
    .replace(/&[#\w]+;/g, '') // Remover entidades HTML
    .trim();
};

/**
 * Valida se o texto contém apenas caracteres seguros
 */
export const isTextSafe = (text: string): boolean => {
  if (!text || typeof text !== 'string') {
    return false;
  }

  // Verificar se contém scripts ou HTML
  const dangerousPatterns = [
    /<script/i,
    /<\/script>/i,
    /javascript:/i,
    /vbscript:/i,
    /data:/i,
    /on\w+\s*=/i,
    /<iframe/i,
    /<object/i,
    /<embed/i,
    /<link/i,
    /<meta/i,
    /<style/i,
  ];

  return !dangerousPatterns.some(pattern => pattern.test(text));
};

/**
 * Escape de caracteres especiais para exibição segura
 */
export const escapeHtml = (text: string): string => {
  if (!text || typeof text !== 'string') {
    return '';
  }

  const htmlEscapes: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '/': '&#x2F;',
  };

  return text.replace(/[&<>"'/]/g, (match) => htmlEscapes[match] || match);
};