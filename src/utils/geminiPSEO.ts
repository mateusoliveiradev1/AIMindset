// src/utils/geminiPSEO.ts
import { GoogleGenerativeAI } from '@google/generative-ai';

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

export interface PSEOContent {
    title: string;
    excerpt: string;
    content: string;
    metaTitle: string;
    metaDescription: string;
    keywords: string[];
}

/**
 * Gera conteúdo programático usando Gemini 1.5 Flash.
 * 
 * @param template O template da página (ex: "As {n} melhores ferramentas de {subject} em {year}")
 * @param variables Objeto com os valores das variáveis
 * @returns O conteúdo gerado e estruturado
 */
export async function generatePSEOContent(
    template: string,
    variables: Record<string, any>
): Promise<PSEOContent | null> {
    if (!API_KEY) {
        console.error('Gemini API Key não encontrada.');
        return null;
    }

    try {
        const genAI = new GoogleGenerativeAI(API_KEY);
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

        const variableStr = Object.entries(variables)
            .map(([key, value]) => `${key}: ${value}`)
            .join('\n');

        const prompt = `
      Você é um estrategista de conteúdo e especialista em SEO. 
      Sua missão é gerar uma página de alta qualidade focada em SEO Programático.

      TEMPLATE: ${template}
      VARIÁVEIS:
      ${variableStr}

      REQUISITOS DE CONTEÚDO:
      1. Título H1 impactante com as variáveis.
      2. Introdução envolvente (Excerpt).
      3. Conteúdo principal em Markdown rico (use subtítulos H2, listas, tabelas de comparação, prós e contras).
      4. Foco técnico e informativo, evitando clichês de IA.
      5. Metadados SEO perfeitos para ranqueamento Google.

      RESPONDA APENAS EM FORMATO JSON VÁLIDO:
      {
        "title": "...",
        "excerpt": "...",
        "content": "...",
        "metaTitle": "...",
        "metaDescription": "...",
        "keywords": ["...", "...", "..."]
      }
    `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        const jsonStr = text.replace(/```json|```/g, '').trim();
        return JSON.parse(jsonStr) as PSEOContent;

    } catch (error) {
        console.error('Erro ao gerar pSEO content:', error);
        return null;
    }
}

/**
 * Gera uma lista massiva de sugestões de variáveis para pSEO com base em um tema raiz.
 */
export async function generateMassPSEOVariables(
    rootSubject: string,
    count: number = 10
): Promise<any[] | null> {
    if (!API_KEY) return null;

    try {
        const genAI = new GoogleGenerativeAI(API_KEY);
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

        const prompt = `
      Você é um gênio de dados e SEO. 
      Com base no tema raiz "${rootSubject}", gere ${count} variações únicas para Programmatic SEO.
      Cada variação deve ser um objeto JSON com campos relevantes (ex: subject, n, year, target_audience, niche).
      
      FOCO: Alta intenção de busca, cauda longa, nichos lucrativos.
      
      RESPONDA APENAS EM UM ARRAY JSON DE OBJETOS:
      [
        {"subject": "...", "n": 10, "year": 2025, "niche": "..."},
        {"subject": "...", "n": 7, "year": 2024, "niche": "..."}
      ]
    `;

        const result = await model.generateContent(prompt);
        const text = result.response.text();
        const jsonStr = text.replace(/```json|```/g, '').trim();
        return JSON.parse(jsonStr);
    } catch (error) {
        console.error('Erro no generateMassPSEOVariables:', error);
        return null;
    }
}
