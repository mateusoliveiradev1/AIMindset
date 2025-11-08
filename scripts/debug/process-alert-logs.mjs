#!/usr/bin/env node

/**
 * Processador de Logs de Alertas
 * 
 * Este script monitora os logs do sistema no Supabase e processa
 * os alertas que precisam ser enviados por email.
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Carregar variáveis de ambiente
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Variáveis de ambiente do Supabase não configuradas');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Enviar email via servidor Node.js
 */
async function sendEmailViaNodeJS(recipients, alertData) {
    try {
        const response = await fetch('http://localhost:3001/api/send-alert-email', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                recipients,
                alertData
            })
        });

        const result = await response.json();
        
        if (response.ok) {
            console.log('✅ Email enviado com sucesso:', result.messageId);
            return { success: true, messageId: result.messageId };
        } else {
            console.error('❌ Erro no envio do email:', result.error);
            return { success: false, error: result.error };
        }
    } catch (error) {
        console.error('💥 Erro na comunicação com servidor de email:', error.message);
        return { success: false, error: error.message };
    }
}

/**
 * Processar logs de alertas pendentes
 */
async function processAlertLogs() {
    try {
        console.log('🔍 Verificando logs de alertas pendentes...');

        // Buscar logs de alertas que precisam ser processados
        const { data: logs, error } = await supabase
            .from('system_logs')
            .select('*')
            .eq('type', 'email_alert')
            .gte('created_at', new Date(Date.now() - 5 * 60 * 1000).toISOString()) // Últimos 5 minutos
            .order('created_at', { ascending: true });

        if (error) {
            console.error('❌ Erro ao buscar logs:', error.message);
            return;
        }

        if (!logs || logs.length === 0) {
            console.log('ℹ️ Nenhum log de alerta pendente encontrado');
            return;
        }

        console.log(`📧 Encontrados ${logs.length} alertas para processar`);

        for (const log of logs) {
            try {
                const context = log.context;
                const recipients = context.recipients;
                const alertData = context.alert_data;

                console.log(`📤 Processando alerta ID ${log.id}...`);
                console.log(`   Destinatários: ${context.recipients_count}`);
                console.log(`   Tipo: ${alertData.type}`);

                // Enviar email
                const emailResult = await sendEmailViaNodeJS(recipients, alertData);

                // Registrar resultado
                await supabase
                    .from('system_logs')
                    .insert({
                        type: 'email_processed',
                        message: emailResult.success ? 'Email enviado com sucesso' : 'Falha no envio do email',
                        context: {
                            original_log_id: log.id,
                            email_result: emailResult,
                            processed_at: new Date().toISOString(),
                            recipients_count: context.recipients_count,
                            alert_type: alertData.type
                        }
                    });

                if (emailResult.success) {
                    console.log(`✅ Alerta ${log.id} processado com sucesso`);
                } else {
                    console.log(`❌ Falha no processamento do alerta ${log.id}: ${emailResult.error}`);
                }

            } catch (error) {
                console.error(`💥 Erro ao processar alerta ${log.id}:`, error.message);
                
                // Registrar erro
                await supabase
                    .from('system_logs')
                    .insert({
                        type: 'email_error',
                        message: 'Erro no processamento do alerta',
                        context: {
                            original_log_id: log.id,
                            error: error.message,
                            processed_at: new Date().toISOString()
                        }
                    });
            }
        }

    } catch (error) {
        console.error('💥 Erro geral no processamento:', error.message);
    }
}

/**
 * Testar o sistema completo
 */
async function testCompleteSystem() {
    console.log('🧪 Testando sistema completo de alertas...');

    try {
        // 1. Testar função RPC
        console.log('1️⃣ Testando função RPC...');
        const { data: rpcResult, error: rpcError } = await supabase
            .rpc('test_alert_system_working', {
                alert_type: 'test_complete',
                test_message: 'Teste completo do sistema de alertas'
            });

        if (rpcError) {
            console.error('❌ Erro na função RPC:', rpcError.message);
            return;
        }

        console.log('✅ Função RPC executada:', rpcResult);

        // 2. Aguardar um pouco e processar logs
        console.log('2️⃣ Aguardando e processando logs...');
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        await processAlertLogs();

        console.log('🎉 Teste completo finalizado!');

    } catch (error) {
        console.error('💥 Erro no teste completo:', error.message);
    }
}

/**
 * Função principal
 */
async function main() {
    const args = process.argv.slice(2);
    const command = args[0] || 'process';

    switch (command) {
        case 'test':
            await testCompleteSystem();
            break;
        case 'process':
            await processAlertLogs();
            break;
        case 'monitor':
            console.log('🔄 Iniciando monitoramento contínuo...');
            setInterval(processAlertLogs, 30000); // A cada 30 segundos
            break;
        default:
            console.log('Uso: node process-alert-logs.mjs [test|process|monitor]');
            console.log('  test    - Testa o sistema completo');
            console.log('  process - Processa logs pendentes uma vez');
            console.log('  monitor - Monitora continuamente (padrão)');
    }
}

// Executar se chamado diretamente
if (import.meta.url === `file://${process.argv[1]}`) {
    main().catch(console.error);
}

export { processAlertLogs, testCompleteSystem };