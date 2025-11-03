#!/usr/bin/env node

/**
 * Teste da Edge Function alert-processor em produção
 * Verifica se a função está deployada e funcionando corretamente
 */

console.log('🔧 Testando Edge Function alert-processor em produção\n');

const SUPABASE_URL = 'https://jywjqzhqynhnhetidzsa.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp5d2pxemhxeW5obmhldGlkenNhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA5MjkxMzQsImV4cCI6MjA3NjUwNTEzNH0.oTZ6B-77NGBSqa_lN2YWCtnKwKc0glWnwfuN9xQjDl0';

async function testEdgeFunction() {
    try {
        console.log('📡 Testando Edge Function alert-processor...');
        
        const edgeFunctionUrl = `${SUPABASE_URL}/functions/v1/alert-processor`;
        
        const testPayload = {
            type: 'error',
            source: 'test_system',
            message: 'Teste da Edge Function alert-processor em produção',
            details: {
                test: true,
                timestamp: new Date().toISOString(),
                environment: 'production'
            }
        };

        console.log(`🌐 URL da Edge Function: ${edgeFunctionUrl}`);
        console.log(`📦 Payload de teste:`, JSON.stringify(testPayload, null, 2));

        const response = await fetch(edgeFunctionUrl, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                'Content-Type': 'application/json',
                'apikey': SUPABASE_ANON_KEY
            },
            body: JSON.stringify(testPayload)
        });

        console.log(`📊 Status da resposta: ${response.status} ${response.statusText}`);
        
        const responseText = await response.text();
        console.log(`📄 Resposta bruta: ${responseText}`);

        if (response.ok) {
            try {
                const responseData = JSON.parse(responseText);
                console.log('✅ Edge Function funcionando corretamente!');
                console.log('📊 Dados da resposta:', JSON.stringify(responseData, null, 2));
                return { success: true, data: responseData };
            } catch (parseError) {
                console.log('✅ Edge Function respondeu, mas resposta não é JSON válido');
                console.log('📄 Resposta:', responseText);
                return { success: true, data: responseText };
            }
        } else {
            console.log('❌ Edge Function falhou ou não está deployada');
            console.log(`🚨 Erro: ${response.status} - ${responseText}`);
            return { success: false, error: `${response.status}: ${responseText}` };
        }

    } catch (error) {
        console.error('❌ Erro ao testar Edge Function:', error.message);
        return { success: false, error: error.message };
    }
}

async function testAlternativeEndpoint() {
    try {
        console.log('\n🔄 Testando endpoint alternativo...');
        
        // Testar se o endpoint existe fazendo uma requisição OPTIONS
        const edgeFunctionUrl = `${SUPABASE_URL}/functions/v1/alert-processor`;
        
        const optionsResponse = await fetch(edgeFunctionUrl, {
            method: 'OPTIONS',
            headers: {
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                'apikey': SUPABASE_ANON_KEY
            }
        });

        console.log(`📊 OPTIONS Status: ${optionsResponse.status} ${optionsResponse.statusText}`);
        
        if (optionsResponse.ok) {
            console.log('✅ Edge Function endpoint existe (responde a OPTIONS)');
            return { exists: true };
        } else {
            console.log('❌ Edge Function endpoint não encontrado');
            return { exists: false };
        }

    } catch (error) {
        console.error('❌ Erro ao testar endpoint alternativo:', error.message);
        return { exists: false, error: error.message };
    }
}

async function main() {
    console.log('🚀 Iniciando testes da Edge Function...\n');
    
    // Teste 1: Verificar se o endpoint existe
    const endpointTest = await testAlternativeEndpoint();
    
    // Teste 2: Testar a função completa
    const functionTest = await testEdgeFunction();
    
    console.log('\n📊 RESUMO DOS TESTES:');
    console.log('='.repeat(50));
    console.log(`🌐 Endpoint existe: ${endpointTest.exists ? '✅ SIM' : '❌ NÃO'}`);
    console.log(`🔧 Função funciona: ${functionTest.success ? '✅ SIM' : '❌ NÃO'}`);
    
    if (!endpointTest.exists) {
        console.log('\n🚨 PROBLEMA IDENTIFICADO:');
        console.log('❌ A Edge Function alert-processor NÃO está deployada no Supabase');
        console.log('💡 Solução: Deploy da Edge Function necessário');
    } else if (!functionTest.success) {
        console.log('\n🚨 PROBLEMA IDENTIFICADO:');
        console.log('⚠️ A Edge Function existe mas não está funcionando corretamente');
        console.log(`🚨 Erro: ${functionTest.error}`);
        console.log('💡 Solução: Verificar logs da função e configurações');
    } else {
        console.log('\n🎉 SUCESSO:');
        console.log('✅ Edge Function alert-processor está deployada e funcionando!');
    }
    
    console.log('\n' + '='.repeat(50));
}

main().catch(console.error);