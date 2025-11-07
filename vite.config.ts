import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { visualizer } from 'rollup-plugin-visualizer'
import fs from 'fs'
import { gzipSync, brotliCompressSync } from 'zlib'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    // Bundle analyzer para desenvolvimento
    process.env.ANALYZE && visualizer({
      filename: 'dist/stats.html',
      open: true,
      gzipSize: true,
      brotliSize: true,
    }),
    // Plugin para gerar relatório real de bundle e emitir ativos comprimidos
    {
      name: 'bundle-performance-report',
      generateBundle(options, bundle) {
        try {
          const outDir = (options.dir || 'dist') as string;
          let totalSize = 0;
          let totalGzip = 0;
          let totalBr = 0;
          const assets: Array<{ fileName: string; size: number; gzipSize: number; brSize: number }> = [];

          for (const [fileName, chunk] of Object.entries(bundle)) {
            if (chunk.type === 'chunk' || chunk.type === 'asset') {
              const source: any = (chunk as any).code || (chunk as any).source || '';
              const content = typeof source === 'string' ? Buffer.from(source) : Buffer.from(source || '');
              const size = content.length;
              totalSize += size;

              let gzipSize = 0;
              let brSize = 0;
              try { gzipSize = gzipSync(content).length; totalGzip += gzipSize; } catch {}
              try { brSize = brotliCompressSync(content).length; totalBr += brSize; } catch {}

              assets.push({ fileName, size, gzipSize, brSize });

              // Emitir versões comprimidas para JS/CSS
              if (/\.(js|css)$/.test(fileName)) {
                try { this.emitFile({ type: 'asset', fileName: `${fileName}.gz`, source: gzipSync(content) }); } catch {}
                try { this.emitFile({ type: 'asset', fileName: `${fileName}.br`, source: brotliCompressSync(content) }); } catch {}
              }
            }
          }

          const report = {
            generatedAt: new Date().toISOString(),
            totalSize,
            totalGzip,
            totalBr,
            assets
          };

          try {
            if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
            fs.writeFileSync(path.join(outDir, 'performance-report.json'), JSON.stringify(report, null, 2));
          } catch {}
        } catch (err) {
          console.error('[bundle-performance-report] erro ao gerar relatório:', err);
        }
      }
    }
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    reportCompressedSize: true,
    // Otimizações de build para performance
    target: 'es2020',
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.info', 'console.debug'],
      },
    },
    rollupOptions: {
      output: {
        // Code splitting agressivo com chunks dedicados
        manualChunks: {
          // Vendors base
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'ui-vendor': ['lucide-react', 'sonner', 'react-helmet-async'],
          'charts-vendor': ['recharts', 'chart.js', 'react-chartjs-2'],
          'markdown-vendor': ['react-markdown', 'remark-gfm'],
          'supabase-vendor': ['@supabase/supabase-js'],

          // Admin: separar áreas pesadas
          'admin-core': [
            './src/pages/admin/index',
            './src/pages/admin/articles',
            './src/pages/admin/users'
          ],
          'admin-logs': [
            './src/components/Admin/SystemLogsTab',
            './src/components/Admin/LogsDashboard',
            './src/components/Admin/BackendLogsTab',
            './src/components/Admin/AppLogsTab'
          ],
          'admin-monitor': [
            './src/pages/admin/feedback',
            './src/pages/admin/seo',
            './src/components/Admin/PerformanceDashboard',
            './src/components/Admin/UnifiedPerformanceDashboard'
          ],
          'admin-backup': [
            './src/pages/admin/backup',
            './src/components/Admin/BackupMonitoring'
          ],

          // Artigos e editores
          'articles-core': [
            './src/pages/AllArticles',
            './src/pages/Article',
            './src/hooks/useArticles'
          ],
          'editor-core': [
            './src/components/ArticleEditor'
          ]
        },
        // Nomes de chunks mais limpos
        chunkFileNames: (chunkInfo) => {
          const facadeModuleId = chunkInfo.facadeModuleId
            ? chunkInfo.facadeModuleId.split('/').pop()?.replace('.tsx', '').replace('.ts', '')
            : 'chunk'
          return `js/${facadeModuleId}-[hash].js`
        },
        entryFileNames: 'js/[name]-[hash].js',
        assetFileNames: (assetInfo) => {
          const info = assetInfo.name?.split('.') || []
          const ext = info[info.length - 1]
          if (/png|jpe?g|svg|gif|tiff|bmp|ico/i.test(ext || '')) {
            return `images/[name]-[hash][extname]`
          }
          if (/css/i.test(ext || '')) {
            return `css/[name]-[hash][extname]`
          }
          return `assets/[name]-[hash][extname]`
        }
      },
      // Tree shaking agressivo
      treeshake: {
        moduleSideEffects: false,
        propertyReadSideEffects: false,
        unknownGlobalSideEffects: false
      }
    },
    // Configurações de chunk size
    chunkSizeWarningLimit: 1000,
    // Sourcemaps apenas em desenvolvimento
    sourcemap: process.env.NODE_ENV === 'development',
    // Otimizações CSS
    cssCodeSplit: true,
    cssMinify: true,
    // Preload modules
    modulePreload: {
      polyfill: true
    }
  },
  // Otimizações de desenvolvimento
  server: {
    port: 5173,
    host: true,
    // HMR otimizado
    hmr: {
      overlay: true
    },
    // Proxy para APIs de backup
    proxy: {
      '/api/backup-status': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        secure: false
      },
      '/api/backup-health': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        secure: false
      },
      '/api/system-logs': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        secure: false
      }
    }
  },
  // Otimizações de dependências
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      'lucide-react',
      'sonner',
      'react-helmet-async',
      '@supabase/supabase-js'
    ],
    exclude: [
      // Excluir service workers e web workers
      'sw.js',
      'workbox-*'
    ],
    // Pre-bundling agressivo
    force: false,
    esbuildOptions: {
      target: 'es2020'
    }
  },
  // Configurações de preview
  preview: {
    port: 4173,
    host: true
  },
  // Configurações de CSS
  css: {
    devSourcemap: true,
    modules: {
      localsConvention: 'camelCase'
    }
  },
  // Configurações de worker
  worker: {
    format: 'es'
  }
})
