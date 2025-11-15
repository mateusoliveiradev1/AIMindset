/**
 * Script para configurar Google OAuth no Supabase
 * Este script ajuda a configurar o Google Auth automaticamente
 */

const fs = require('fs');
const path = require('path');

console.log('🚀 Configurando Google OAuth para AIMindset...\n');

// Instruções passo a passo
const steps = [
  {
    title: '1. Criar Projeto no Google Cloud Console',
    instructions: [
      'Acesse: https://console.cloud.google.com/',
      'Clique em "Selecionar Projeto" (topo) → "Novo Projeto"',
      'Nome do projeto: "AIMindset Auth"',
      'Clique em "Criar"',
      'Aguarde a criação (30 segundos)'
    ]
  },
  {
    title: '2. Habilitar APIs Necessárias',
    instructions: [
      'No menu lateral: "APIs e Serviços" → "Biblioteca"',
      'Pesquise: "Google Identity Toolkit API"',
      'Clique em "Habilitar"',
      'Pesquise: "OAuth 2.0"',
      'Clique em "Habilitar"'
    ]
  },
  {
    title: '3. Criar Credenciais OAuth',
    instructions: [
      'Menu: "APIs e Serviços" → "Credenciais"',
      'Clique em "Criar Credenciais" → "ID do Cliente OAuth"',
      'Tipo de aplicativo: "Aplicativo Web"',
      'Nome: "AIMindset Web App"',
      'Origens autorizadas JavaScript:',
      '  - http://localhost:5173',
      '  - https://seu-dominio.com (quando tiver)',
      'URIs de redirecionamento autorizadas:',
      '  - http://localhost:5173',
      '  - https://jywjqzhqynhnhetidzsa.supabase.co/auth/v1/callback',
      'Clique em "Criar"'
    ]
  },
  {
    title: '4. Obter Client ID e Secret',
    instructions: [
      'Após criar, copie o Client ID (xxxxxx.apps.googleusercontent.com)',
      'Clique em "Baixar JSON" para salvar as credenciais',
      'Guarde o Client Secret em local seguro'
    ]
  },
  {
    title: '5. Configurar no Supabase',
    instructions: [
      'Acesse: https://app.supabase.com/project/jywjqzhqynhnhetidzsa/auth/providers',
      'Encontre "Google" e habilite',
      'Cole o Client ID e Client Secret',
      'Salve as alterações'
    ]
  }
];

// Mostrar instruções
steps.forEach((step, index) => {
  console.log(`\n📋 ${step.title}`);
  console.log('─'.repeat(50));
  step.instructions.forEach((instruction, i) => {
    console.log(`  ${i + 1}. ${instruction}`);
  });
});

console.log('\n\n✅ Após concluir, você terá:');
console.log('  • Client ID do Google');
console.log('  • Client Secret do Google');
console.log('  • Google Auth habilitado no Supabase');

console.log('\n\n📋 Resumo das URLs necessárias:');
console.log('Origens JavaScript:');
console.log('  - http://localhost:5173');
console.log('  - https://seu-dominio.com (produção)');
console.log('\nURIs de redirecionamento:');
console.log('  - http://localhost:5173');
console.log('  - https://jywjqzhqynhnhetidzsa.supabase.co/auth/v1/callback');

console.log('\n\n🎯 Próximos passos:');
console.log('1. Siga os passos acima para obter Client ID e Secret');
console.log('2. Configure no Supabase (passo 5)');
console.log('3. Teste o login com Google no seu app');
console.log('\n💡 Dica: Você pode copiar o Client ID e me enviar para eu ajudar a configurar!');

// Criar arquivo de ambiente template
const envTemplate = `
# Google OAuth Configuration (adicione seus valores aqui)
VITE_GOOGLE_CLIENT_ID=seu-client-id-aqui
VITE_GOOGLE_CLIENT_SECRET=seu-client-secret-aqui

# Supabase Configuration (já configurado)
VITE_SUPABASE_URL=https://jywjqzhqynhnhetidzsa.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp5d2pxemhxeW5obmhldGlkenNhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA5MjkxMzQsImV4cCI6MjA3NjUwNTEzNH0.oTZ6B-77NGBSqa_lN2YWCtnKwKc0glWnwfuN9xQjDl0
`;

const envPath = path.join(process.cwd(), '.env.local');
if (!fs.existsSync(envPath)) {
  fs.writeFileSync(envPath, envTemplate.trim());
  console.log('\n\n📁 Arquivo .env.local criado com template!');
  console.log('Adicione seus Client ID e Secret quando tiver.');
} else {
  console.log('\n\n📁 Arquivo .env.local já existe. Atualize com seus valores.');
}

console.log('\n🚀 Script concluído! Siga os passos acima para configurar o Google Auth.');