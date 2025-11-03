#!/usr/bin/env node

/**
 * Teste da função send_alert_direct com parâmetros corretos
 */

import { createClient } from '@supabase/supabase-js';

console.log('🔧 Testando send_alert_direct com parâmetros corretos\n');

const SUPABASE_URL = 'https://jywjqzhqynhnhetidzsa.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp5d2pxemhxeW5obmhldGlkenNhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA5MjkxMzQsImV4cCI6MjA3NjUwNTEzNH0.oTZ6B-77NGBSqa_lN2YWCtnKwKc0glWnwfuN9xQjDl0';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testSendAlertDirectCorrect() {
    try {
        console.log('📡 Testando send_alert_direct com parâmetros corretos...');
        
        // Baseado no hint: public.send_alert_direct(p_details, p_email, p_message, p_subject)
        const { data, error } = await supabase.rpc('send_alert_direct', {
            p_subject: 'Teste do Sistema de Alertas - Produção',
            p_message: 'Este é um teste da função send_alert_direct em produção. Se você receber este email, o sistema está funcionando!',
            p_email: 'admin@aimindset.com', // Email de teste
            p_details: {
                test: true,
                timestamp: new Date().toISOString(),
                environment: 'production'
            }
        });

        if (error) {
            console.error('❌ Erro na função send_alert_direct:', error);
            return { success: false, error: error.message };
        }

        console.log('✅ Função send_alert_direct executada com sucesso!');
        console.log('📊 Resultado:', JSON.stringify(data, null, 2));
        return { success: true, data };

    } catch (error) {
        console.error('❌ Erro ao testar send_alert_direct:', error.message);
        return { success: false, error: error.message };
    }
}

async function testSendAlertDirectMinimal() {
    try {
        console.log('\n📡 Testando send_alert_direct com parâmetros mínimos...');
        
        // Teste com parâmetros mínimos
        const { data, error } = await supabase.rpc('send_alert_direct', {
            p_subject: 'Teste Mínimo',
            p_message: 'Teste mínimo do sistema de alertas'
        });

        if (error) {
            console.error('❌ Erro na função send_alert_direct (mínimo):', error);
            return { success: false, error: error.message };
        }

        console.log('✅ Função send_alert_direct (mínimo) executada com sucesso!');
        console.log('📊 Resultado:', JSON.stringify(data, null, 2));
        return { success: true, data };

    } catch (error) {
        console.error('❌ Erro ao testar send_alert_direct (mínimo):', error.message);
        return { success: false, error: error.message };
    }
}

async function testSendAlertDirectWithoutEmail() {
    try {
        console.log('\n📡 Testando send_alert_direct sem email específico...');
        
        // Teste sem email específico (deve usar assinantes)
        const { data, error } = await supabase.rpc('send_alert_direct', {
            p_subject: 'Teste para Assinantes',
            p_message: 'Teste enviado para todos os assinantes de alertas',
            p_details: {
                test: true,
                type: 'broadcast'
            }
        });

        if (error) {
            console.error('❌ Erro na função send_alert_direct (sem email):', error);
            return { success: false, error: error.message };
        }

        console.log('✅ Função send_alert_direct (sem email) executada com sucesso!');
        console.log('📊 Resultado:', JSON.stringify(data, null, 2));
        return { success: true, data };

    } catch (error) {
        console.error('❌ Erro ao testar send_alert_direct (sem email):', error.message);
        return { success: false, error: error.message };
    }
}

async function main() {
    console.log('🚀 Iniciando testes da função send_alert_direct...\n');
    
    // Teste 1: Com todos os parâmetros
    const fullTest = await testSendAlertDirectCorrect();
    
    // Teste 2: Com parâmetros mínimos
    const minimalTest = await testSendAlertDirectMinimal();
    
    // Teste 3: Sem email específico
    const broadcastTest = await testSendAlertDirectWithoutEmail();
    
    console.log('\n📊 RESUMO DOS TESTES:');
    console.log('='.repeat(60));
    console.log(`📧 Teste completo: ${fullTest.success ? '✅ OK' : '❌ FALHOU'}`);
    console.log(`📧 Teste mínimo: ${minimalTest.success ? '✅ OK' : '❌ FALHOU'}`);
    console.log(`📧 Teste broadcast: ${broadcastTest.success ? '✅ OK' : '❌ FALHOU'}`);
    
    const anySuccess = fullTest.success || minimalTest.success || broadcastTest.success;
    
    if (anySuccess) {
        console.log('\n🎉 SUCESSO:');
        console.log('✅ Pelo menos uma variação da função send_alert_direct está funcionando!');
        
        if (fullTest.success) {
            console.log('✅ Função completa com todos os parâmetros: OK');
        }
        if (minimalTest.success) {
            console.log('✅ Função com parâmetros mínimos: OK');
        }
        if (broadcastTest.success) {
            console.log('✅ Função para broadcast (assinantes): OK');
        }
    } else {
        console.log('\n🚨 PROBLEMAS IDENTIFICADOS:');
        console.log('❌ Nenhuma variação da função send_alert_direct está funcionando');
        
        if (!fullTest.success) {
            console.log(`   Teste completo: ${fullTest.error}`);
        }
        if (!minimalTest.success) {
            console.log(`   Teste mínimo: ${minimalTest.error}`);
        }
        if (!broadcastTest.success) {
            console.log(`   Teste broadcast: ${broadcastTest.error}`);
        }
    }
    
    console.log('\n' + '='.repeat(60));
}

main().catch(console.error);