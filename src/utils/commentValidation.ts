import { z } from 'zod';

// Schema de validação para comentários
export const CommentSchema = z.object({
  user_name: z
    .string()
    .min(2, 'Nome deve ter pelo menos 2 caracteres')
    .max(50, 'Nome deve ter no máximo 50 caracteres')
    .regex(/^[a-zA-ZÀ-ÿ\s]+$/, 'Nome deve conter apenas letras e espaços'),
  content: z
    .string()
    .min(10, 'Comentário deve ter pelo menos 10 caracteres')
    .max(500, 'Comentário deve ter no máximo 500 caracteres')
});

export type CommentFormData = z.infer<typeof CommentSchema>;

// Função para validar dados de comentário
export const validateComment = (data: unknown) => {
  return CommentSchema.safeParse(data);
};

// Função para sanitizar nome de usuário
export const sanitizeUserName = (name: string): string => {
  return name
    .trim()
    .replace(/\s+/g, ' ') // Remove espaços extras
    .replace(/[^\w\sÀ-ÿ]/g, ''); // Remove caracteres especiais, mantém acentos
};

// Função para sanitizar conteúdo do comentário
export const sanitizeCommentContent = (content: string): string => {
  return content
    .trim()
    .replace(/\s+/g, ' ') // Remove espaços extras
    .replace(/<[^>]*>/g, '') // Remove tags HTML
    .replace(/javascript:/gi, '') // Remove javascript:
    .replace(/on\w+\s*=/gi, ''); // Remove event handlers
};