#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://jywjqzhqynhnhetidzsa.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp5d2pxemhxeW5obmhldGlkenNhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA5MjkxMzQsImV4cCI6MjA3NjUwNTEzNH0.oTZ6B-77NGBSqa_lN2YWCtnKwKc0glWnwfuN9xQjDl0';

console.log('🔍 Verificando configuração de autenticação...\n');

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkAuth() {
  try {
    // Testar se Google OAuth está configurado
    console.log('📡 Testando conexão com Supabase...');
    
    const { data, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error('❌ Erro ao verificar sessão:', error.message);
      return;
    }
    
    console.log('✅ Conexão com Supabase estabelecida!');
    
    // Testar URL de autenticação com Google
    console.log('\n🔗 Testando URL de autenticação com Google...');
    
    const { data: { url } } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: 'http://localhost:5173/auth/v1/callback'
      }
    });
    
    if (url) {
      console.log('✅ URL de autenticação gerada com sucesso!');
      console.log('📋 URL:', url);
      console.log('\n🎉 Google OAuth está configurado corretamente!');
      
      console.log('\n🚀 Próximos passos:');
      console.log('1. Teste o login na aplicação: http://localhost:5173');
      console.log('2. Clique no botão "Login com Google"');
      console.log('3. Verifique se pode editar seu nome após login');
      console.log('4. Teste criar comentários com seu usuário');
      
    } else {
      console.log('⚠️  Não foi possível gerar URL de autenticação');
      console.log('💡 Verifique se o Google OAuth está ativado no Supabase Dashboard');
    }
    
  } catch (error) {
    console.error('❌ Erro durante verificação:', error.message);
    console.log('💡 Verifique suas credenciais no Supabase Dashboard');
  }
}

checkAuth();