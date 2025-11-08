import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.VITE_SUPABASE_ANON_KEY
);

async function testProcessLogs() {
    console.log('🔍 Testando processamento de logs...');
    
    try {
        // Buscar logs de alertas dos últimos 10 minutos
        const { data: logs, error } = await supabase
            .from('system_logs')
            .select('*')
            .eq('type', 'email_alert')
            .gte('created_at', new Date(Date.now() - 10 * 60 * 1000).toISOString())
            .order('created_at', { ascending: true });

        if (error) {
            console.error('❌ Erro ao buscar logs:', error.message);
            return;
        }

        console.log(`📊 Encontrados ${logs?.length || 0} logs de email_alert`);
        
        if (logs && logs.length > 0) {
            console.log('📋 Logs encontrados:');
            logs.forEach((log, index) => {
                console.log(`  ${index + 1}. ID: ${log.id}, Criado: ${log.created_at}`);
                console.log(`     Contexto: ${JSON.stringify(log.context, null, 2)}`);
            });
            
            // Processar o primeiro log
            const log = logs[0];
            console.log(`\n📤 Processando log ID ${log.id}...`);
            
            const context = log.context;
            const recipients = context.recipients;
            const alertData = context.alert_data;
            
            console.log(`📧 Destinatários: ${JSON.stringify(recipients)}`);
            console.log(`📋 Dados do alerta: ${JSON.stringify(alertData)}`);
            
            // Tentar enviar via Node.js
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
                    
                    // Registrar sucesso no banco
                    const { error: insertError } = await supabase
                        .from('system_logs')
                        .insert({
                            type: 'email_processed',
                            message: 'Email enviado com sucesso via processamento manual',
                            context: {
                                original_log_id: log.id,
                                email_result: result,
                                processed_at: new Date().toISOString()
                            }
                        });
                    
                    if (insertError) {
                        console.error('❌ Erro ao registrar sucesso:', insertError.message);
                    } else {
                        console.log('✅ Sucesso registrado no banco');
                    }
                } else {
                    console.error('❌ Erro no envio do email:', result.error);
                }
            } catch (fetchError) {
                console.error('💥 Erro na comunicação com servidor de email:', fetchError.message);
            }
        } else {
            console.log('ℹ️ Nenhum log de alerta pendente encontrado');
        }
        
    } catch (error) {
        console.error('💥 Erro geral:', error.message);
    }
}

testProcessLogs().catch(console.error);