#!/usr/bin/env node

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import readline from 'readline';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Interface para entrada do usuário
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function ask(question) {
  return new Promise((resolve) => {
    rl.question(question, resolve);
  });
}

// Cores para output
const colors = {
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  reset: '\x1b[0m'
};

function log(color, message) {
  console.log(`${color}${message}${colors.reset}`);
}

function openUrl(url) {
  try {
    const platform = process.platform;
    let command;
    if (platform === 'darwin') command = 'open';
    else if (platform === 'win32') command = 'start';
    else command = 'xdg-open';
    execSync(`${command} ${url}`);
  } catch (error) {
    log(colors.yellow, `⚠️  Não foi possível abrir o navegador automaticamente: ${error.message}`);
  }
}

console.log(`
${colors.magenta}╔══════════════════════════════════════════════════════════════╗${colors.reset}
${colors.magenta}║              🚀 CONFIGURADOR GOOGLE OAUTH                   ║${colors.reset}
${colors.magenta}║                    INTERATIVO 🤖                             ║${colors.reset}
${colors.magenta}╚══════════════════════════════════════════════════════════════╝${colors.reset}
`);

async function main() {
  try {
    // Carregar configuração
    const configPath = path.join(__dirname, 'oauth-config.json');
    if (!fs.existsSync(configPath)) {
      log(colors.red, '❌ Arquivo de configuração não encontrado!');
      log(colors.yellow, '💡 Execute primeiro: npm run setup-google-oauth');
      process.exit(1);
    }

    const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    
    log(colors.cyan, `📋 Projeto: ${config.projectRef}`);
    log(colors.cyan, `🔗 URL: ${config.supabaseUrl}\n`);

    // Passo 1: Google Cloud Console
    log(colors.blue, '🎯 PASSO 1: Google Cloud Console');
    log(colors.white, 'Vou abrir o Google Cloud Console para você criar um novo projeto...');
    await ask('\n🚀 Pressione ENTER para abrir o Google Cloud Console...');
    openUrl('https://console.cloud.google.com/');
    
    log(colors.yellow, '\n📋 INSTRUÇÕES:');
    log(colors.white, '1. Clique em "Select a project" → "New Project"');
    log(colors.white, `2. Nome do projeto: ${config.projectRef}-comments`);
    log(colors.white, '3. Clique em "Create"');
    log(colors.white, '4. Aguarde alguns segundos para o projeto ser criado');
    
    await ask('\n✅ Quando terminar, pressione ENTER para continuar...');

    // Passo 2: Habilitar APIs
    log(colors.blue, '\n🎯 PASSO 2: Habilitar APIs');
    log(colors.white, 'Abrindo a biblioteca de APIs...');
    await ask('\n🚀 Pressione ENTER para abrir a biblioteca de APIs...');
    openUrl('https://console.cloud.google.com/apis/library');
    
    log(colors.yellow, '\n📋 INSTRUÇÕES:');
    log(colors.white, '1. Pesquise e habilite: "Google+ API"');
    log(colors.white, '2. Também habilite: "Google People API" (recomendado)');
    
    await ask('\n✅ Quando terminar, pressione ENTER para continuar...');

    // Passo 3: OAuth Consent Screen
    log(colors.blue, '\n🎯 PASSO 3: OAuth Consent Screen');
    log(colors.white, 'Abrindo a tela de consentimento OAuth...');
    await ask('\n🚀 Pressione ENTER para abrir o OAuth Consent Screen...');
    openUrl('https://console.cloud.google.com/apis/credentials/consent');
    
    log(colors.yellow, '\n📋 INSTRUÇÕES:');
    log(colors.white, '1. Escolha: "External" (para testes) ou "Internal" (se tiver Workspace)');
    log(colors.white, `2. App name: ${config.projectRef} Comments`);
    log(colors.white, '3. Preencha seu email nos campos necessários');
    log(colors.white, '4. Adicione escopos: userinfo.email, userinfo.profile, openid');
    
    await ask('\n✅ Quando terminar, pressione ENTER para continuar...');

    // Passo 4: Criar Credenciais
    log(colors.blue, '\n🎯 PASSO 4: Criar Credenciais OAuth');
    log(colors.white, 'Abrindo a página de credenciais...');
    await ask('\n🚀 Pressione ENTER para abrir a página de credenciais...');
    openUrl('https://console.cloud.google.com/apis/credentials');
    
    log(colors.yellow, '\n📋 INSTRUÇÕES:');
    log(colors.white, '1. Clique em "Create Credentials" → "OAuth client ID"');
    log(colors.white, '2. Application type: "Web application"');
    log(colors.white, `3. Nome: ${config.projectRef}-web-client`);
    log(colors.white, '4. Adicione as URLs de origem autorizadas:');
    log(colors.green, '   - ' + config.supabaseUrl);
    log(colors.green, '   - http://localhost:5173');
    log(colors.green, '   - http://localhost:3000');
    log(colors.yellow, '   // Para produção, adicione manualmente: https://seu-dominio.vercel.app');
    log(colors.white, '5. Adicione as URLs de redirecionamento:');
    config.callbackUrls.forEach(url => {
      log(colors.green, '   - ' + url);
    });
    log(colors.white, '6. Clique em "Create"');
    log(colors.red, '7. ⚠️  COPIE O CLIENT ID E CLIENT SECRET!');
    
    const clientId = await ask('\n📋 Cole o Client ID aqui: ');
    const clientSecret = await ask('📋 Cole o Client Secret aqui: ');

    // Passo 5: Configurar no Supabase
    log(colors.blue, '\n🎯 PASSO 5: Configurar no Supabase Dashboard');
    log(colors.white, 'Abrindo o Supabase Dashboard...');
    await ask('\n🚀 Pressione ENTER para abrir o Supabase Dashboard...');
    openUrl(config.supabaseDashboard);
    
    log(colors.yellow, '\n📋 INSTRUÇÕES:');
    log(colors.white, '1. No menu lateral: "Authentication" → "Providers"');
    log(colors.white, '2. Encontre "Google" e clique em "Enable"');
    log(colors.white, `3. Client ID: ${clientId}`);
    log(colors.white, `4. Client Secret: ${clientSecret}`);
    log(colors.white, '5. Clique em "Save"');
    
    await ask('\n✅ Quando terminar, pressione ENTER para continuar...');

    // Salvar credenciais
    const credentialsPath = path.join(__dirname, 'google-oauth-credentials.json');
    const credentials = {
      clientId,
      clientSecret,
      projectRef: config.projectRef,
      createdAt: new Date().toISOString()
    };
    
    fs.writeFileSync(credentialsPath, JSON.stringify(credentials, null, 2));
    
    log(colors.green, '\n✅ Credenciais salvas com sucesso!');
    log(colors.blue, `📁 Arquivo: ${credentialsPath}`);

    // Testar configuração
    log(colors.blue, '\n🎯 PASSO 6: Testar Configuração');
    log(colors.white, 'Vamos verificar se tudo está funcionando...');
    
    await ask('\n🚀 Pressione ENTER para testar a configuração...');
    
    try {
      execSync('npm run check-auth', { stdio: 'inherit' });
      log(colors.green, '\n🎉 Configuração concluída com sucesso!');
    } catch (error) {
      log(colors.yellow, '\n⚠️  Erro ao testar configuração');
      log(colors.white, 'As credenciais podem levar alguns minutos para ativar');
      log(colors.white, 'Tente novamente mais tarde: npm run check-auth');
    }

    // Informações finais
    console.log(`
${colors.magenta}╔══════════════════════════════════════════════════════════════╗${colors.reset}
${colors.magenta}║                    🎉 CONFIGURAÇÃO CONCLUÍDA!                 ║${colors.reset}
${colors.magenta}╚══════════════════════════════════════════════════════════════╝${colors.reset}
`);
    
    log(colors.green, '✅ Google OAuth configurado com sucesso!');
    log(colors.green, '✅ Supabase Dashboard atualizado!');
    log(colors.green, '✅ Credenciais salvas localmente!');
    
    log(colors.blue, '\n📋 Próximos passos:');
    log(colors.white, '1. Teste o login na sua aplicação');
    log(colors.white, '2. Verifique a edição de comentários');
    log(colors.white, '3. Confira o ownership de comentários');
    
    log(colors.cyan, '\n🔗 Links úteis:');
    log(colors.white, '- Aplicação: http://localhost:5173');
    log(colors.white, `- Supabase: ${config.supabaseDashboard}`);
    log(colors.white, '- Google Cloud: https://console.cloud.google.com/');

  } catch (error) {
    log(colors.red, `\n❌ Erro: ${error.message}`);
    process.exit(1);
  } finally {
    rl.close();
  }
}

main();