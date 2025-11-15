#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Cores para output
const colors = {
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  reset: '\x1b[0m'
};

function log(color, message) {
  console.log(`${color}${message}${colors.reset}`);
}

console.log(`
${colors.cyan}╔══════════════════════════════════════════════════════════════╗${colors.reset}
${colors.cyan}║              🚀 CONFIGURAÇÃO RÁPIDA GOOGLE OAUTH            ║${colors.reset}
${colors.cyan}╚══════════════════════════════════════════════════════════════╝${colors.reset}
`);

// Carregar configuração
const configPath = path.join(__dirname, 'oauth-config.json');
if (!fs.existsSync(configPath)) {
  log(colors.red, '❌ Arquivo de configuração não encontrado!');
  log(colors.yellow, '💡 Execute primeiro: npm run setup-google-oauth');
  process.exit(1);
}

const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));

// Instruções rápidas
const quickGuide = `
${colors.blue}📋 GUIA RÁPIDA DE CONFIGURAÇÃO:${colors.reset}

${colors.green}1. Acesse o Google Cloud Console:${colors.reset}
   ${colors.cyan}https://console.cloud.google.com/${colors.reset}

${colors.green}2. Crie um novo projeto:${colors.reset}
   • Nome: ${colors.yellow}${config.projectRef}-comments${colors.reset}
   • Clique em "Create"

${colors.green}3. Habilite as APIs:${colors.reset}
   • Acesse: ${colors.cyan}https://console.cloud.google.com/apis/library${colors.reset}
   • Habilite: "Google+ API" e "Google People API"

${colors.green}4. Configure OAuth Consent Screen:${colors.reset}
   • Acesse: ${colors.cyan}https://console.cloud.google.com/apis/credentials/consent${colors.reset}
   • Escolha: "External"
   • App name: ${colors.yellow}${config.projectRef} Comments${colors.reset}
   • Adicione escopos: userinfo.email, userinfo.profile, openid

${colors.green}5. Crie as credenciais OAuth:${colors.reset}
   • Acesse: ${colors.cyan}https://console.cloud.google.com/apis/credentials${colors.reset}
   • Clique em "Create Credentials" → "OAuth client ID"
   • Application type: "Web application"
   • Nome: ${colors.yellow}${config.projectRef}-web-client${colors.reset}

${colors.yellow}📋 URLs de Origem Autorizadas:${colors.reset}
   • ${config.supabaseUrl}
   • http://localhost:5173
   • http://localhost:3000

${colors.yellow}📋 URLs de Redirecionamento Autorizadas:${colors.reset}
${config.callbackUrls.map(url => `   • ${url}`).join('\n')}

${colors.green}6. Configure no Supabase:${colors.reset}
   • Acesse: ${colors.cyan}${config.supabaseDashboard}${colors.reset}
   • Vá para: "Authentication" → "Providers"
   • Ative "Google" e cole seus Client ID e Client Secret

${colors.red}⚠️  IMPORTANTE:${colors.reset}
   • Copie seu Client ID e Client Secret!
   • As credenciais podem levar alguns minutos para ativar

${colors.cyan}🔗 Links úteis:${colors.reset}
   • Aplicação: http://localhost:5173
   • Google Cloud: https://console.cloud.google.com/
   • Supabase: ${config.supabaseDashboard}
`;

console.log(quickGuide);

// Criar arquivo de anotações
const notesPath = path.join(__dirname, 'google-oauth-setup-notes.md');
const notes = `# Google OAuth Setup - ${config.projectRef}

## Projeto
- **Project Ref**: ${config.projectRef}
- **Supabase URL**: ${config.supabaseUrl}
- **Supabase Dashboard**: ${config.supabaseDashboard}

## Google Cloud Console
- **URL**: https://console.cloud.google.com/
- **Nome do Projeto**: ${config.projectRef}-comments
- **Nome do Cliente OAuth**: ${config.projectRef}-web-client

## URLs Autorizadas

### Origens JavaScript
${config.supabaseUrl}
http://localhost:5173
http://localhost:3000

### URIs de Redirecionamento
${config.callbackUrls.map(url => `- ${url}`).join('\n')}

## Próximos Passos
1. Execute: npm run check-auth
2. Teste o login na aplicação
3. Verifique edição de comentários
4. Confira ownership de comentários

## Notas
- Criado em: ${new Date().toISOString()}
- Lembre-se de copiar Client ID e Client Secret!
`;

fs.writeFileSync(notesPath, notes);

log(colors.green, '\n✅ Arquivo de anotações criado:');
log(colors.blue, `📁 ${notesPath}`);

log(colors.green, '\n🎉 Guia de configuração concluído!');
log(colors.yellow, '\n💡 Siga os passos acima para configurar o Google OAuth.');
log(colors.cyan, '\n🚀 Após configurar, execute: npm run check-auth');

// Abrir links automaticamente (opcional)
console.log(`
${colors.magenta}Deseja abrir os links automaticamente?${colors.reset}
`);

const { execSync } = await import('child_process');
function openUrl(url) {
  try {
    const platform = process.platform;
    let command;
    if (platform === 'darwin') command = 'open';
    else if (platform === 'win32') command = 'start';
    else command = 'xdg-open';
    execSync(`${command} ${url}`);
  } catch (error) {
    // Silencioso - não precisa abrir se falhar
  }
}

// Abrir links principais
try {
  log(colors.blue, '\n📱 Abrindo links principais...');
  openUrl('https://console.cloud.google.com/');
  openUrl(config.supabaseDashboard);
  openUrl('https://console.cloud.google.com/apis/library');
  log(colors.green, '✅ Links abertos no navegador!');
} catch (error) {
  log(colors.yellow, '\n⚠️  Não foi possível abrir os links automaticamente.');
}

log(colors.green, '\n🎯 Configuração Google OAuth - PRONTO!');
log(colors.cyan, '\n💪 Você consegue! Siga o guia acima e o OAuth estará funcionando em minutos! 💪');