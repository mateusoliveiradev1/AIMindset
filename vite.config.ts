import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { visualizer } from 'rollup-plugin-visualizer'

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
    })
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
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
        // Code splitting simplificado e mais estável
        manualChunks: {
          // Vendor chunks básicos
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'ui-vendor': ['lucide-react', 'sonner', 'react-helmet-async'],
          'supabase-vendor': ['@supabase/supabase-js']
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
      // Tree shaking mais conservador
      treeshake: {
        moduleSideEffects: 'no-external',
        propertyReadSideEffects: true,
        unknownGlobalSideEffects: true
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
