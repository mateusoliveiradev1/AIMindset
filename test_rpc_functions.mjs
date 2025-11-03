#!/usr/bin/env node

/**
 * Teste das funções RPC de alertas em produção
 * Verifica se as funções send_alert_direct e test_alert_system estão funcionando
 */

import { createClient } from '@supabase/supabase-js';

console.log('🔧 Testando Funções RPC de Alertas em Produção\n');

const SUPABASE_URL = 'https://jywjqzhqynhnhetidzsa.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp5d2pxemhxeW5obmhldGlkenNhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA5MjkxMzQsImV4cCI6MjA3NjUwNTEzNH0.oTZ6B-77NGBSqa_lN2YWCtnKwKc0glWnwfuN9xQjDl0';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testSendAlertDirect() {
    try {
        console.log('📡 Testando função RPC send_alert_direct...');
        
        const { data, error } = await supabase.rpc('send_alert_direct', {
            p_subject: 'Teste do Sistema de Alertas - Produção',
            p_message: 'Este é um teste da função send_alert_direct em produção. Se você receber este email, o sistema está funcionando!'
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

async function testAlertSystem() {
    try {
        console.log('\n📡 Testando função RPC test_alert_system...');
        
        const { data, error } = await supabase.rpc('test_alert_system', {
            alert_type: 'app_error',
            test_message: 'Teste do sistema de alertas em produção - função RPC'
        });

        if (error) {
            console.error('❌ Erro na função test_alert_system:', error);
            return { success: false, error: error.message };
        }

        console.log('✅ Função test_alert_system executada com sucesso!');
        console.log('📊 Resultado:', JSON.stringify(data, null, 2));
        return { success: true, data };

    } catch (error) {
        console.error('❌ Erro ao testar test_alert_system:', error.message);
        return { success: false, error: error.message };
    }
}

async function testAlertSystemSimple() {
    try {
        console.log('\n📡 Testando função RPC test_alert_system_simple...');
        
        const { data, error } = await supabase.rpc('test_alert_system_simple', {
            alert_type: 'security',
            test_message: 'Teste simples do sistema de alertas em produção'
        });

        if (error) {
            console.error('❌ Erro na função test_alert_system_simple:', error);
            return { success: false, error: error.message };
        }

        console.log('✅ Função test_alert_system_simple executada com sucesso!');
        console.log('📊 Resultado:', JSON.stringify(data, null, 2));
        return { success: true, data };

    } catch (error) {
        console.error('❌ Erro ao testar test_alert_system_simple:', error.message);
        return { success: false, error: error.message };
    }
}

async function checkAlertSubscribers() {
    try {
        console.log('\n📡 Verificando assinantes de alertas...');
        
        const { data, error } = await supabase
            .from('alert_subscriptions')
            .select('*');

        if (error) {
            console.error('❌ Erro ao verificar assinantes:', error);
            return { success: false, error: error.message };
        }

        console.log('✅ Assinantes verificados com sucesso!');
        console.log(`📊 Total de assinantes: ${data?.length || 0}`);
        
        if (data && data.length > 0) {
            console.log('📋 Assinantes encontrados:');
            data.forEach((subscriber, index) => {
                console.log(`  ${index + 1}. ${subscriber.email} (ativo: ${subscriber.is_active})`);
            });
        } else {
            console.log('⚠️ Nenhum assinante encontrado!');
        }

        return { success: true, data, count: data?.length || 0 };

    } catch (error) {
        console.error('❌ Erro ao verificar assinantes:', error.message);
        return { success: false, error: error.message };
    }
}

async function checkRecentLogs() {
    try {
        console.log('\n📡 Verificando logs recentes do sistema...');
        
        const { data, error } = await supabase
            .from('system_logs')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(10);

        if (error) {
            console.error('❌ Erro ao verificar logs:', error);
            return { success: false, error: error.message };
        }

        console.log('✅ Logs verificados com sucesso!');
        console.log(`📊 Últimos ${data?.length || 0} logs:`);
        
        if (data && data.length > 0) {
            data.forEach((log, index) => {
                const timestamp = new Date(log.created_at).toLocaleString('pt-BR');
                console.log(`  ${index + 1}. [${timestamp}] ${log.type}: ${log.message}`);
            });
        } else {
            console.log('⚠️ Nenhum log encontrado!');
        }

        return { success: true, data, count: data?.length || 0 };

    } catch (error) {
        console.error('❌ Erro ao verificar logs:', error.message);
        return { success: false, error: error.message };
    }
}

async function main() {
    console.log('🚀 Iniciando testes das funções RPC...\n');
    
    // Teste 1: Verificar assinantes
    const subscribersTest = await checkAlertSubscribers();
    
    // Teste 2: Verificar logs recentes
    const logsTest = await checkRecentLogs();
    
    // Teste 3: Testar send_alert_direct
    const sendAlertTest = await testSendAlertDirect();
    
    // Teste 4: Testar test_alert_system
    const alertSystemTest = await testAlertSystem();
    
    // Teste 5: Testar test_alert_system_simple
    const alertSystemSimpleTest = await testAlertSystemSimple();
    
    console.log('\n📊 RESUMO DOS TESTES:');
    console.log('='.repeat(60));
    console.log(`👥 Assinantes: ${subscribersTest.success ? '✅ OK' : '❌ FALHOU'} (${subscribersTest.count || 0} encontrados)`);
    console.log(`📝 Logs: ${logsTest.success ? '✅ OK' : '❌ FALHOU'} (${logsTest.count || 0} logs recentes)`);
    console.log(`📧 send_alert_direct: ${sendAlertTest.success ? '✅ OK' : '❌ FALHOU'}`);
    console.log(`🚨 test_alert_system: ${alertSystemTest.success ? '✅ OK' : '❌ FALHOU'}`);
    console.log(`🔔 test_alert_system_simple: ${alertSystemSimpleTest.success ? '✅ OK' : '❌ FALHOU'}`);
    
    const allSuccess = subscribersTest.success && sendAlertTest.success && alertSystemTest.success && alertSystemSimpleTest.success;
    
    if (allSuccess) {
        console.log('\n🎉 SUCESSO TOTAL:');
        console.log('✅ Todas as funções RPC estão funcionando corretamente!');
        console.log('✅ Sistema de alertas operacional via RPC');
        
        if (subscribersTest.count === 0) {
            console.log('\n⚠️ ATENÇÃO:');
            console.log('❌ Nenhum assinante de alertas encontrado');
            console.log('💡 Adicione assinantes para receber alertas por email');
        }
    } else {
        console.log('\n🚨 PROBLEMAS IDENTIFICADOS:');
        
        if (!subscribersTest.success) {
            console.log('❌ Falha ao verificar assinantes de alertas');
        }
        
        if (!sendAlertTest.success) {
            console.log('❌ Função send_alert_direct não está funcionando');
            console.log(`   Erro: ${sendAlertTest.error}`);
        }
        
        if (!alertSystemTest.success) {
            console.log('❌ Função test_alert_system não está funcionando');
            console.log(`   Erro: ${alertSystemTest.error}`);
        }
        
        if (!alertSystemSimpleTest.success) {
            console.log('❌ Função test_alert_system_simple não está funcionando');
            console.log(`   Erro: ${alertSystemSimpleTest.error}`);
        }
    }
    
    console.log('\n' + '='.repeat(60));
}

main().catch(console.error);