import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Script de build com relatório de performance
 * Coleta métricas antes e depois do build e gera um relatório detalhado
 */

class BuildPerformanceReporter {
  constructor() {
    this.startTime = Date.now();
    this.metrics = {
      timestamp: new Date().toISOString(),
      buildTime: 0,
      bundleSize: {},
      chunks: [],
      warnings: [],
      errors: [],
      performance: {
        startTime: this.startTime,
        memoryUsage: process.memoryUsage(),
        nodeVersion: process.version,
        platform: process.platform
      }
    };
  }

  async run() {
    console.log('🚀 Iniciando build com relatório de performance...');
    
    try {
      // Coletar métricas antes do build
      await this.collectPreBuildMetrics();
      
      // Executar build
      await this.runBuild();
      
      // Coletar métricas após o build
      await this.collectPostBuildMetrics();
      
      // Gerar relatório
      await this.generateReport();
      
      console.log('✅ Build concluído com sucesso!');
      
    } catch (error) {
      console.error('❌ Erro durante o build:', error);
      this.metrics.errors.push({
        message: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString()
      });
      
      await this.generateReport();
      process.exit(1);
    }
  }

  async collectPreBuildMetrics() {
    console.log('📊 Coletando métricas pré-build...');
    
    // Verificar tamanho dos arquivos fonte
    const srcDir = path.join(__dirname, '..', 'src');
    const srcSize = this.getDirectorySize(srcDir);
    
    // Verificar package.json
    const packageJson = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'package.json'), 'utf8'));
    
    this.metrics.preBuild = {
      srcSize,
      dependencies: Object.keys(packageJson.dependencies || {}).length,
      devDependencies: Object.keys(packageJson.devDependencies || {}).length,
      totalFiles: this.countFiles(srcDir)
    };
    
    console.log(`📁 Tamanho do código fonte: ${(srcSize / 1024 / 1024).toFixed(2)} MB`);
    console.log(`📦 Dependências: ${this.metrics.preBuild.dependencies}`);
  }

  async runBuild() {
    console.log('🔨 Executando build...');
    const buildStart = Date.now();
    
    try {
      // Executar build do Vite
      execSync('npm run build', { 
        stdio: 'pipe',
        cwd: path.join(__dirname, '..'),
        timeout: 300000 // 5 minutos timeout
      });
      
      this.metrics.buildTime = Date.now() - buildStart;
      console.log(`⏱️ Tempo de build: ${(this.metrics.buildTime / 1000).toFixed(2)}s`);
      
    } catch (error) {
      // Tentar capturar saída de erro
      if (error.stdout) {
        const output = error.stdout.toString();
        if (output.includes('warning')) {
          this.metrics.warnings.push(...this.extractWarnings(output));
        }
      }
      throw error;
    }
  }

  async collectPostBuildMetrics() {
    console.log('📈 Coletando métricas pós-build...');
    
    const distDir = path.join(__dirname, '..', 'dist');
    
    if (!fs.existsSync(distDir)) {
      throw new Error('Diretório dist não encontrado. Build falhou?');
    }
    
    // Analisar bundle
    const bundleAnalysis = await this.analyzeBundle(distDir);
    this.metrics.bundleSize = bundleAnalysis.totalSize;
    this.metrics.chunks = bundleAnalysis.chunks;
    
    // Verificar manifest.json se existir
    const manifestPath = path.join(distDir, 'manifest.json');
    if (fs.existsSync(manifestPath)) {
      this.metrics.manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    }
    
    // Verificar se há source maps
    const hasSourceMaps = fs.readdirSync(distDir).some(file => file.endsWith('.map'));
    this.metrics.hasSourceMaps = hasSourceMaps;
    
    console.log(`📦 Tamanho total do bundle: ${(bundleAnalysis.totalSize.bytes / 1024).toFixed(2)} KB`);
    console.log(`🧩 Chunks gerados: ${bundleAnalysis.chunks.length}`);
  }

  async analyzeBundle(distDir) {
    const files = this.getAllFiles(distDir);
    const chunks = [];
    let totalSize = 0;
    
    files.forEach(file => {
      const stats = fs.statSync(file);
      const relativePath = path.relative(distDir, file);
      const size = stats.size;
      
      totalSize += size;
      
      // Categorizar por tipo
      const ext = path.extname(file);
      const category = this.getFileCategory(relativePath, ext);
      
      chunks.push({
        file: relativePath,
        size: size,
        sizeFormatted: this.formatBytes(size),
        category,
        ext
      });
    });
    
    return {
      totalSize: {
        bytes: totalSize,
        formatted: this.formatBytes(totalSize)
      },
      chunks: chunks.sort((a, b) => b.size - a.size)
    };
  }

  getFileCategory(filePath, ext) {
    if (filePath.includes('assets/')) return 'assets';
    if (ext === '.js') return 'javascript';
    if (ext === '.css') return 'stylesheet';
    if (ext === '.html') return 'html';
    if (['.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp'].includes(ext)) return 'image';
    if (['.woff', '.woff2', '.ttf', '.eot'].includes(ext)) return 'font';
    return 'other';
  }

  getDirectorySize(dir) {
    let size = 0;
    const files = this.getAllFiles(dir);
    files.forEach(file => {
      size += fs.statSync(file).size;
    });
    return size;
  }

  getAllFiles(dir, files = []) {
    const items = fs.readdirSync(dir);
    
    items.forEach(item => {
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        this.getAllFiles(fullPath, files);
      } else {
        files.push(fullPath);
      }
    });
    
    return files;
  }

  countFiles(dir) {
    return this.getAllFiles(dir).length;
  }

  formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  extractWarnings(output) {
    const warnings = [];
    const lines = output.split('\n');
    
    lines.forEach(line => {
      if (line.toLowerCase().includes('warning')) {
        warnings.push({
          message: line.trim(),
          timestamp: new Date().toISOString()
        });
      }
    });
    
    return warnings;
  }

  async generateReport() {
    const reportPath = path.join(__dirname, '..', 'performance-reports');
    
    // Criar diretório se não existir
    if (!fs.existsSync(reportPath)) {
      fs.mkdirSync(reportPath, { recursive: true });
    }
    
    const reportFile = path.join(reportPath, `build-report-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.json`);
    const htmlReportFile = path.join(reportPath, `build-report-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.html`);
    
    // Salvar JSON
    fs.writeFileSync(reportFile, JSON.stringify(this.metrics, null, 2));
    
    // Gerar HTML
    const htmlContent = this.generateHTMLReport();
    fs.writeFileSync(htmlReportFile, htmlContent);
    
    // Gerar relatório resumido no console
    this.printSummary();
    
    console.log(`\n📊 Relatórios gerados:`);
    console.log(`   JSON: ${reportFile}`);
    console.log(`   HTML: ${htmlReportFile}`);
  }

  generateHTMLReport() {
    return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Relatório de Performance - Build AIMindset</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; background: white; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); overflow: hidden; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; }
        .header h1 { margin: 0; font-size: 2.5em; font-weight: 300; }
        .header p { margin: 10px 0 0; opacity: 0.9; }
        .content { padding: 30px; }
        .metric-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin: 20px 0; }
        .metric-card h3 { color: #2d3748; margin: 0 0 15px 0; font-size: 1.2em; }
        .metric-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin: 20px 0; }
        .metric-item { text-align: center; padding: 20px; background: white; border-radius: 8px; border: 1px solid #e2e8f0; }
        .metric-value { font-size: 2em; font-weight: bold; color: #667eea; margin: 10px 0; }
        .metric-label { color: #718096; font-size: 0.9em; }
        .chunk-list { max-height: 300px; overflow-y: auto; }
        .chunk-item { display: flex; justify-content: space-between; align-items: center; padding: 10px; border-bottom: 1px solid #e2e8f0; }
        .chunk-item:last-child { border-bottom: none; }
        .status-good { color: #38a169; }
        .status-warning { color: #d69e2e; }
        .status-bad { color: #e53e3e; }
        .footer { text-align: center; padding: 20px; color: #718096; font-size: 0.9em; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🚀 Relatório de Performance</h1>
            <p>Build AIMindset - ${new Date(this.metrics.timestamp).toLocaleString('pt-BR')}</p>
        </div>
        
        <div class="content">
            <div class="metric-card">
                <h3>📊 Resumo do Build</h3>
                <div class="metric-grid">
                    <div class="metric-item">
                        <div class="metric-value">${(this.metrics.buildTime / 1000).toFixed(2)}s</div>
                        <div class="metric-label">Tempo de Build</div>
                    </div>
                    <div class="metric-item">
                        <div class="metric-value">${this.formatBytes(this.metrics.bundleSize.bytes)}</div>
                        <div class="metric-label">Tamanho do Bundle</div>
                    </div>
                    <div class="metric-item">
                        <div class="metric-value">${this.metrics.chunks.length}</div>
                        <div class="metric-label">Chunks Gerados</div>
                    </div>
                    <div class="metric-item">
                        <div class="metric-value">${this.metrics.warnings.length}</div>
                        <div class="metric-label">Avisos</div>
                    </div>
                </div>
            </div>

            <div class="metric-card">
                <h3>🧩 Chunks Gerados (Top 10)</h3>
                <div class="chunk-list">
                    ${this.metrics.chunks.slice(0, 10).map(chunk => `
                        <div class="chunk-item">
                            <div>
                                <strong>${chunk.file}</strong>
                                <br><small style="color: #718096;">Categoria: ${chunk.category}</small>
                            </div>
                            <div style="text-align: right;">
                                <div style="font-weight: bold; color: #667eea;">${chunk.sizeFormatted}</div>
                                <small style="color: #718096;">${((chunk.size / this.metrics.bundleSize.bytes) * 100).toFixed(1)}%</small>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>

            <div class="metric-card">
                <h3>⚠️ Avisos (${this.metrics.warnings.length})</h3>
                ${this.metrics.warnings.length > 0 ? `
                    <div style="background: #fff5cd; border: 1px solid #f6e05e; border-radius: 4px; padding: 15px;">
                        ${this.metrics.warnings.map(warning => `
                            <div style="margin: 5px 0; color: #744210;">• ${warning.message}</div>
                        `).join('')}
                    </div>
                ` : '<p style="color: #38a169;">✅ Nenhum aviso encontrado</p>'}
            </div>

            <div class="metric-card">
                <h3>🔧 Informações Técnicas</h3>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
                    <div>
                        <strong>Node.js:</strong> ${this.metrics.performance.nodeVersion}<br>
                        <strong>Plataforma:</strong> ${this.metrics.performance.platform}<br>
                        <strong>Source Maps:</strong> ${this.metrics.hasSourceMaps ? '✅ Sim' : '❌ Não'}
                    </div>
                    <div>
                        <strong>Memória RSS:</strong> ${this.formatBytes(this.metrics.performance.memoryUsage.rss)}<br>
                        <strong>Memória Heap:</strong> ${this.formatBytes(this.metrics.performance.memoryUsage.heapUsed)} / ${this.formatBytes(this.metrics.performance.memoryUsage.heapTotal)}
                    </div>
                </div>
            </div>
        </div>
        
        <div class="footer">
            <p>Relatório gerado automaticamente pelo script de build performance</p>
            <p>AIMindset - Otimização de Performance</p>
        </div>
    </div>
</body>
</html>
    `;
  }

  printSummary() {
    console.log('\n' + '='.repeat(60));
    console.log('📊 RESUMO DO BUILD');
    console.log('='.repeat(60));
    console.log(`⏱️  Tempo de build: ${(this.metrics.buildTime / 1000).toFixed(2)}s`);
    console.log(`📦 Tamanho do bundle: ${this.metrics.bundleSize.formatted}`);
    console.log(`🧩 Chunks: ${this.metrics.chunks.length}`);
    console.log(`⚠️  Avisos: ${this.metrics.warnings.length}`);
    console.log(`❌ Erros: ${this.metrics.errors.length}`);
    
    if (this.metrics.warnings.length > 0) {
      console.log('\n⚠️  Avisos encontrados:');
      this.metrics.warnings.forEach(warning => {
        console.log(`   • ${warning.message}`);
      });
    }
    
    console.log('\n🎯 Top 5 maiores chunks:');
    this.metrics.chunks.slice(0, 5).forEach(chunk => {
      console.log(`   • ${chunk.file}: ${chunk.sizeFormatted} (${((chunk.size / this.metrics.bundleSize.bytes) * 100).toFixed(1)}%)`);
    });
    
    console.log('='.repeat(60));
  }
}

// Executar o script
const reporter = new BuildPerformanceReporter();
reporter.run().catch(console.error);