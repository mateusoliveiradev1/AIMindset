const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

// Diretórios para processar
const directories = [
  'public',
  'src/assets'
];

// Extensões de imagem suportadas
const imageExtensions = ['.png', '.jpg', '.jpeg'];

async function convertToWebP(inputPath, outputPath) {
  try {
    await sharp(inputPath)
      .webp({ quality: 85, effort: 6 })
      .toFile(outputPath);
    console.log(`✓ Convertido: ${inputPath} → ${outputPath}`);
  } catch (error) {
    console.error(`✗ Erro ao converter ${inputPath}:`, error.message);
  }
}

async function processDirectory(dirPath) {
  if (!fs.existsSync(dirPath)) {
    console.log(`Diretório não encontrado: ${dirPath}`);
    return;
  }

  const files = fs.readdirSync(dirPath, { withFileTypes: true });
  
  for (const file of files) {
    const fullPath = path.join(dirPath, file.name);
    
    if (file.isDirectory()) {
      await processDirectory(fullPath);
    } else if (file.isFile()) {
      const ext = path.extname(file.name).toLowerCase();
      
      if (imageExtensions.includes(ext)) {
        const webpPath = fullPath.replace(ext, '.webp');
        
        // Só converte se o arquivo WebP não existir
        if (!fs.existsSync(webpPath)) {
          await convertToWebP(fullPath, webpPath);
        } else {
          console.log(`⚠ Já existe: ${webpPath}`);
        }
      }
    }
  }
}

async function main() {
  console.log('🚀 Iniciando conversão para WebP...\n');
  
  for (const dir of directories) {
    console.log(`📁 Processando diretório: ${dir}`);
    await processDirectory(dir);
    console.log('');
  }
  
  console.log('✅ Conversão concluída!');
}

main().catch(console.error);