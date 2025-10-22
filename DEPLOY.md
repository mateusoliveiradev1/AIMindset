# Guia de Deploy - AIMindset

## Pré-requisitos

Antes de fazer o deploy, certifique-se de que:

1. ✅ O build de produção está funcionando (`npm run build`)
2. ✅ Todas as variáveis de ambiente estão configuradas
3. ✅ O projeto Supabase está configurado e funcionando
4. ✅ Não há erros de TypeScript ou ESLint

## Variáveis de Ambiente Necessárias

Crie um arquivo `.env` na raiz do projeto com as seguintes variáveis:

```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Deploy na Vercel

### 1. Preparação

1. Faça commit de todas as alterações:
   ```bash
   git add .
   git commit -m "Preparar para deploy"
   git push origin main
   ```

2. Certifique-se de que o build está funcionando:
   ```bash
   npm run build
   ```

### 2. Deploy via Vercel CLI

1. Instale a Vercel CLI (se não tiver):
   ```bash
   npm i -g vercel
   ```

2. Faça login na Vercel:
   ```bash
   vercel login
   ```

3. Execute o deploy:
   ```bash
   vercel
   ```

4. Para deploy de produção:
   ```bash
   vercel --prod
   ```

### 3. Deploy via Dashboard Vercel

1. Acesse [vercel.com](https://vercel.com)
2. Clique em "New Project"
3. Conecte seu repositório GitHub
4. Configure as variáveis de ambiente:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
5. Clique em "Deploy"

### 4. Configurações Recomendadas para Vercel

Crie um arquivo `vercel.json` na raiz do projeto:

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite",
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

## Deploy na Netlify

### 1. Via Netlify CLI

1. Instale a Netlify CLI:
   ```bash
   npm i -g netlify-cli
   ```

2. Faça login:
   ```bash
   netlify login
   ```

3. Execute o deploy:
   ```bash
   netlify deploy --prod --dir=dist
   ```

### 2. Via Dashboard Netlify

1. Acesse [netlify.com](https://netlify.com)
2. Clique em "New site from Git"
3. Conecte seu repositório
4. Configure:
   - Build command: `npm run build`
   - Publish directory: `dist`
5. Adicione as variáveis de ambiente
6. Clique em "Deploy site"

### 3. Configurações para Netlify

Crie um arquivo `netlify.toml` na raiz do projeto:

```toml
[build]
  command = "npm run build"
  publish = "dist"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

## Configuração do Supabase para Produção

### 1. Configurar Domínios Autorizados

No painel do Supabase:
1. Vá em Authentication > Settings
2. Adicione seu domínio de produção em "Site URL"
3. Adicione o domínio em "Additional Redirect URLs"

### 2. Configurar RLS (Row Level Security)

Certifique-se de que as políticas RLS estão configuradas corretamente:

```sql
-- Exemplo de política para artigos
CREATE POLICY "Artigos são públicos para leitura" ON articles
FOR SELECT USING (published = true);

-- Exemplo de política para admin
CREATE POLICY "Apenas admins podem editar artigos" ON articles
FOR ALL USING (auth.role() = 'authenticated');
```

## Verificações Pós-Deploy

Após o deploy, verifique:

1. ✅ Site carrega corretamente
2. ✅ Navegação funciona (SPA routing)
3. ✅ Conexão com Supabase está funcionando
4. ✅ Login de admin funciona
5. ✅ CRUD de artigos funciona
6. ✅ Newsletter funciona
7. ✅ Formulário de contato funciona

## Otimizações de Performance

### 1. Análise do Bundle

```bash
npm run build
```

O build atual gera:
- CSS: ~35KB (gzipped: ~7KB)
- JS: ~1.4MB (gzipped: ~341KB)

### 2. Melhorias Recomendadas

1. **Code Splitting**: Implementar lazy loading para rotas
2. **Otimização de Imagens**: Usar formatos WebP
3. **Caching**: Configurar headers de cache apropriados

## Monitoramento

### 1. Analytics

Considere adicionar:
- Google Analytics
- Vercel Analytics
- Sentry para error tracking

### 2. Performance

- Lighthouse CI
- Web Vitals monitoring

## Troubleshooting

### Problemas Comuns

1. **Erro 404 em rotas**: Certifique-se de que os redirects estão configurados
2. **Erro de CORS**: Verifique as configurações do Supabase
3. **Variáveis de ambiente**: Confirme que estão configuradas no painel de deploy

### Logs

- **Vercel**: `vercel logs`
- **Netlify**: Verifique o painel de deploy

## Comandos Úteis

```bash
# Build local
npm run build

# Preview do build
npm run preview

# Verificar tipos TypeScript
npm run check

# Lint
npm run lint

# Deploy Vercel
vercel --prod

# Deploy Netlify
netlify deploy --prod --dir=dist
```

---

**Projeto pronto para deploy! 🚀**

Todas as verificações foram concluídas com sucesso:
- ✅ Build de produção funcionando
- ✅ TypeScript sem erros
- ✅ Preview local testado
- ✅ Variáveis de ambiente configuradas
- ✅ Documentação de deploy criada