// src/utils/geminiSEO.ts
import { GoogleGenerativeAI } from '@google/generative-ai';

// A chave deve ser configurada nas variáveis de ambiente do Vite
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

export interface SEOMetadata {
    title: string;
    description: string;
    keywords: string[];
}

/**
 * Utiliza o modelo Gemini 1.5 Flash para otimizar os metadados SEO de um artigo.
 * 
 * @param content O conteúdo markdown do artigo
 * @param currentTitle (Opcional) O título atual para contexto
 * @returns Um objeto contendo o título, descrição e palavras-chave otimizados
 */
export async function optimizeSEOWithGemini(
    content: string,
    currentTitle?: string
): Promise<SEOMetadata | null> {
    if (!API_KEY) {
        console.error('Gemini API Key não encontrada no ambiente.');
        return null;
    }

    try {
        const genAI = new GoogleGenerativeAI(API_KEY);
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

        const prompt = `
      Você é um especialista sênior em SEO técnico e redator estratégico. 
      Sua tarefa é analisar o conteúdo markdown de um artigo de blog sobre tecnologia/IA e sugerir os melhores metadados para indexação no Google.

      CONTEÚDO DO ARTIGO:
      ${content.substring(0, 10000)} // Limitar para economizar tokens e focar no início
      
      ${currentTitle ? `TÍTULO ATUAL: ${currentTitle}` : ''}

      REQUISITOS:
      1. TÍTULO SEO (Title Tag): Deve ser cativante, conter a palavra-chave principal no início e ter entre 50-60 caracteres.
      2. META DESCRIÇÃO: Resumo persuasivo com call-to-action (CTA), entre 150-160 caracteres.
      3. KEYWORDS: Lista de 5 a 8 palavras-chave ou frases de cauda longa (long-tail) relevantes.

      RESPONDA APENAS EM FORMATO JSON VÁLIDO:
      {
        "title": "...",
        "description": "...",
        "keywords": ["...", "...", "..."]
      }
    `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        // Tentar limpar a resposta caso o modelo envie markdown code blocks
        const jsonStr = text.replace(/```json|```/g, '').trim();
        return JSON.parse(jsonStr) as SEOMetadata;

    } catch (error) {
        console.error('Erro ao chamar o Gemini:', error);
        return null;
    }
}
/**
 * Gera metadados SEO para qualquer tipo de página (Home, Categoria, etc)
 */
export async function generateGenericSEO(
    pageType: string,
    context: string
): Promise<SEOMetadata | null> {
    if (!API_KEY) return null;

    try {
        const genAI = new GoogleGenerativeAI(API_KEY);
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

        const prompt = `
      Você é um especialista sênior em SEO. 
      Gere metadados para uma página do tipo "${pageType}".
      CONTEXTO DA PÁGINA: ${context}

      REQUISITOS:
      1. TÍTULO: Atraente, SEO-friendly, máx 60 caracteres.
      2. DESCRIÇÃO: Persuasiva, com CTA, 150-160 caracteres.
      3. KEYWORDS: 5 keywords relevantes.

      RESPONDA APENAS EM JSON:
      {
        "title": "...",
        "description": "...",
        "keywords": ["...", "...", "..."]
      }
    `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const jsonStr = response.text().replace(/```json|```/g, '').trim();
        return JSON.parse(jsonStr) as SEOMetadata;
    } catch (error) {
        console.error('Erro no generateGenericSEO:', error);
        return null;
    }
}
