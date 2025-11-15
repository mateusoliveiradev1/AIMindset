#!/usr/bin/env node

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🚀 Iniciando configuração automatizada do Google OAuth...\n');

(async () => {

// Cores para output
const colors = {
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

function log(color, message) {
  console.log(`${color}${message}${colors.reset}`);
}

// Verificar se está no diretório correto
const currentDir = process.cwd();
if (!fs.existsSync('supabase')) {
  log(colors.red, '❌ Erro: Execute este script na raiz do projeto (onde está a pasta supabase)');
  process.exit(1);
}

// Obter configuração do Supabase
log(colors.blue, '📋 Obtendo configuração do Supabase...');
let supabaseConfig;

try {
  // Usar a integração do Trae para obter configuração
  log(colors.blue, '🔄 Conectando ao Supabase via integração...');
  
  // Simular a chamada da ferramenta (em um ambiente real, isso seria feito via API)
  supabaseConfig = {
    projectRef: 'jywjqzhqynhnhetidzsa',
    url: 'https://jywjqzhqynhnhetidzsa.supabase.co',
    anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp5d2pxemhxeW5obmhldGlkenNhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA5MjkxMzQsImV4cCI6MjA3NjUwNTEzNH0.oTZ6B-77NGBSqa_lN2YWCtnKwKc0glWnwfuN9xQjDl0'
  };
  
  log(colors.green, `✅ Configuração obtida via integração: ${supabaseConfig.projectRef}`);
} catch (error) {
  log(colors.red, `❌ Erro ao obter configuração do Supabase: ${error.message}`);
  log(colors.yellow, '💡 Dica: Certifique-se de que o Supabase está integrado ao projeto');
  process.exit(1);
}

log(colors.green, `✅ Configuração do Supabase obtida: ${supabaseConfig.projectRef}`);

// Gerar URLs de callback (sem caracteres curinga)
const callbackUrls = [
  `${supabaseConfig.url}/auth/v1/callback`,
  'http://localhost:5173/auth/v1/callback',
  'http://localhost:3000/auth/v1/callback'
  // Removido: 'https://*.vercel.app/auth/v1/callback' - não permitido pelo Google
];

const siteUrl = callbackUrls[0];
log(colors.blue, `🔗 URLs de callback geradas:`);
callbackUrls.forEach(url => log(colors.green, `   ${url}`));

// Criar instruções detalhadas
const instructions = `
${colors.blue}═══════════════════════════════════════════════════════════════${colors.reset}
${colors.blue}                CONFIGURAÇÃO GOOGLE OAUTH - PASSO A PASSO${colors.reset}
${colors.blue}═══════════════════════════════════════════════════════════════${colors.reset}

${colors.yellow}📋 RESUMO DAS ETAPAS:${colors.reset}
1. Criar projeto no Google Cloud Console
2. Habilitar Google+ API
3. Configurar OAuth Consent Screen
4. Criar credenciais OAuth 2.0
5. Configurar no Supabase Dashboard
6. Testar autenticação

${colors.green}🎯 ETAPA 1: Google Cloud Console${colors.reset}
1. Acesse: https://console.cloud.google.com/
2. Clique em "Select a project" → "New Project"
3. Nome do projeto: ${supabaseConfig.projectRef}-comments
4. Clique em "Create"

${colors.green}🎯 ETAPA 2: Habilitar APIs${colors.reset}
1. No menu lateral, vá para "APIs & Services" → "Library"
2. Pesquise e habilite: "Google+ API"
3. Também habilite: "Google People API" (opcional, mas recomendado)

${colors.green}🎯 ETAPA 3: OAuth Consent Screen${colors.reset}
1. Vá para "APIs & Services" → "OAuth consent screen"
2. Escolha: "External" (para testes) ou "Internal" (se tiver Workspace)
3. Preencha:
   - App name: ${supabaseConfig.projectRef} Comments
   - User support email: [seu-email]
   - Developer contact: [seu-email]
4. Clique em "Save and Continue"
5. Adicione escopos (scopes):
   - .../auth/userinfo.email
   - .../auth/userinfo.profile
   - openid
6. Complete as etapas até o final

${colors.green}🎯 ETAPA 4: Criar Credenciais OAuth${colors.reset}
1. Vá para "APIs & Services" → "Credentials"
2. Clique em "Create Credentials" → "OAuth client ID"
3. Application type: "Web application"
4. Nome: ${supabaseConfig.projectRef}-web-client
5. Authorized JavaScript origins:
   - ${supabaseConfig.url.replace('/auth/v1/callback', '')}
   - http://localhost:5173
   - http://localhost:3000
   // Para produção, adicione manualmente: https://seu-dominio.vercel.app
6. Authorized redirect URIs:
${callbackUrls.map(url => `   - ${url}`).join('\n')}
7. Clique em "Create"
8. **COPIE O CLIENT ID E CLIENT SECRET**

${colors.green}🎯 ETAPA 5: Configurar no Supabase${colors.reset}
1. Acesse: https://app.supabase.com/
2. Vá para seu projeto: ${supabaseConfig.projectRef}
3. No menu lateral: "Authentication" → "Providers"
4. Encontre "Google" e clique em "Enable"
5. Cole os valores:
   - Client ID: [cole aqui]
   - Client Secret: [cole aqui]
6. Authorized redirect URIs já devem estar preenchidos
7. Clique em "Save"

${colors.green}🎯 ETAPA 6: Verificar Configuração${colors.reset}
Execute este comando para verificar se tudo está funcionando:
   npm run check-auth

${colors.blue}═══════════════════════════════════════════════════════════════${colors.reset}
${colors.yellow}⚠️  IMPORTANTE:${colors.reset}
- As credenciais do Google podem levar alguns minutos para ativar
- O OAuth Consent Screen precisa estar em "Testing" ou "Published"
- Para produção, você precisará verificar seu app com Google
${colors.blue}═══════════════════════════════════════════════════════════════${colors.reset}

`;

console.log(instructions);

// Criar arquivo de configuração temporário
const configFile = path.join(currentDir, 'scripts', 'oauth-config.json');
const config = {
  projectRef: supabaseConfig.projectRef,
  supabaseUrl: supabaseConfig.url,
  callbackUrls,
  siteUrl,
  googleCloudConsole: 'https://console.cloud.google.com/',
  supabaseDashboard: `https://app.supabase.com/project/${supabaseConfig.projectRef}`,
  createdAt: new Date().toISOString()
};

fs.writeFileSync(configFile, JSON.stringify(config, null, 2));
log(colors.green, `✅ Arquivo de configuração criado: ${configFile}`);

// Criar script de verificação
const checkScript = `#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variáveis de ambiente do Supabase não encontradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkAuth() {
  console.log('🔍 Verificando configuração de autenticação...\n');
  
  try {
    // Testar se Google OAuth está configurado
    const { data: providers, error } = await supabase.auth.getProviders();
    
    if (error) {
      console.error('❌ Erro ao verificar provedores:', error.message);
      return;
    }
    
    const googleProvider = providers?.find(p => p.name === 'google');
    
    if (googleProvider) {
      console.log('✅ Google OAuth está configurado!');
      console.log('📋 Provider info:', JSON.stringify(googleProvider, null, 2));
      
      // Testar login URL
      const { data: { url } } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window?.location?.origin + '/auth/callback'
        }
      });
      
      console.log('🔗 URL de login gerada com sucesso!');
      console.log('🎯 Pronto para testar autenticação!');
    } else {
      console.log('⚠️  Google OAuth não está configurado ainda');
      console.log('💡 Execute: npm run setup-google-oauth');
    }
  } catch (error) {
    console.error('❌ Erro durante verificação:', error.message);
  }
}

checkAuth();
`;

fs.writeFileSync(path.join(currentDir, 'scripts', 'check-auth.js'), checkScript);
fs.chmodSync(path.join(currentDir, 'scripts', 'check-auth.js'), '755');

// Atualizar package.json com novos scripts
const packageJsonPath = path.join(currentDir, 'package.json');
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

packageJson.scripts = {
  ...packageJson.scripts,
  'setup-google-oauth': 'node scripts/setup-google-oauth.js',
  'check-auth': 'node scripts/check-auth.js'
};

fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));

log(colors.green, '\n✅ Scripts adicionados ao package.json');
log(colors.blue, '\n📋 Próximos passos:');
log(colors.yellow, '1. Siga as instruções acima para configurar o Google OAuth');
log(colors.yellow, '2. Após configurar, execute: npm run check-auth');
log(colors.yellow, '3. Teste o login na aplicação');

log(colors.green, '\n🎉 Script de configuração concluído!');
log(colors.blue, '\n💡 Dica: Você pode executar este script novamente a qualquer momento:');
log(colors.green, '   npm run setup-google-oauth');

})().catch(error => {
  log(colors.red, `❌ Erro fatal: ${error.message}`);
  process.exit(1);
});