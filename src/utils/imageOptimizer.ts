// src/utils/imageOptimizer.ts
import imageCompression from 'browser-image-compression';

export interface OptimizationOptions {
    maxSizeMB?: number;
    maxWidthOrHeight?: number;
    useWebWorker?: boolean;
}

/**
 * Comprime uma imagem e converte para WebP (se possível) no lado do cliente.
 * 
 * @param file O arquivo de imagem original
 * @param options Opções de compressão
 * @returns O arquivo comprimido
 */
export async function optimizeImage(
    file: File,
    options: OptimizationOptions = {}
): Promise<File> {
    const defaultOptions: OptimizationOptions = {
        maxSizeMB: 0.8, // Menos de 1MB por requisito
        maxWidthOrHeight: 1920,
        useWebWorker: true,
        ...options
    };

    try {
        console.log(`🖼️ [Optimizer] Original: ${file.size / 1024 / 1024}MB`);

        const compressedFile = await imageCompression(file, defaultOptions);

        console.log(`✅ [Optimizer] Comprimido: ${compressedFile.size / 1024 / 1024}MB`);
        return compressedFile;
    } catch (error) {
        console.error('❌ [Optimizer] Erro na compressão:', error);
        return file; // Retorna original em caso de erro
    }
}

/**
 * Gera um nome de arquivo amigável para SEO.
 * 
 * @param originalName Nome original
 * @param prefix Prefixo (ex: título do artigo)
 * @returns Nome sanitizado
 */
export function generateSEOFileName(originalName: string, prefix: string): string {
    const ext = originalName.split('.').pop();
    const cleanPrefix = prefix
        .toLowerCase()
        .replace(/[^\w\s-]/g, '')
        .replace(/\s+/g, '-')
        .substring(0, 50);

    return `${cleanPrefix}-${Date.now()}.${ext}`;
}
