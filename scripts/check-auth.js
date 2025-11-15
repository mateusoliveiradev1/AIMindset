#!/usr/bin/env node

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
  console.log('🔍 Verificando configuração de autenticação...
');
  
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
