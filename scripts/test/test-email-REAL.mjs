#!/usr/bin/env node

/**
 * TESTE DIRETO E REAL DE ENVIO DE EMAIL - VERSÃO DEFINITIVA
 * Este script vai REALMENTE enviar um email para verificar se funciona
 * ATUALIZADO: $(new Date().toISOString())
 */

import { Resend } from 'resend';
import dotenv from 'dotenv';

// Carregar variáveis de ambiente
dotenv.config();

const resend = new Resend(process.env.RESEND_API_KEY);

async function enviarEmailReal() {
    console.log('🚀 INICIANDO TESTE REAL DE EMAIL');
    console.log('📧 Destinatário: warface01031999@gmail.com');
    console.log('⏰ Horário:', new Date().toLocaleString('pt-BR'));
    
    try {
        console.log('📤 Enviando email...');
        
        const { data, error } = await resend.emails.send({
            from: 'AIMindset <onboarding@resend.dev>',
            to: ['warface01031999@gmail.com'],
            subject: `🎯 TESTE REAL - Email Funcionando! ${new Date().toLocaleString('pt-BR')}`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                    <h1 style="color: #28a745; text-align: center;">✅ EMAIL FUNCIONANDO!</h1>
                    
                    <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
                        <h2 style="color: #007bff;">🎉 Sucesso Total!</h2>
                        <p><strong>Este email chegou até você!</strong></p>
                        <p>O sistema de alertas está funcionando perfeitamente.</p>
                    </div>
                    
                    <div style="background: #e7f3ff; padding: 15px; border-radius: 5px; margin: 15px 0;">
                        <h3>📊 Detalhes do Teste:</h3>
                        <ul>
                            <li><strong>Horário:</strong> ${new Date().toLocaleString('pt-BR')}</li>
                            <li><strong>Servidor:</strong> Node.js + Resend</li>
                            <li><strong>Status:</strong> Funcionando 100%</li>
                            <li><strong>Teste:</strong> Direto e Real</li>
                        </ul>
                    </div>
                    
                    <div style="background: #d4edda; padding: 15px; border-radius: 5px; margin: 15px 0;">
                        <h3>🎯 Próximos Passos:</h3>
                        <p>Agora que confirmamos que o email funciona, você pode:</p>
                        <ul>
                            <li>✅ Usar o sistema de alertas com confiança</li>
                            <li>✅ Configurar alertas automáticos</li>
                            <li>✅ Monitorar o sistema via email</li>
                        </ul>
                    </div>
                    
                    <hr style="margin: 30px 0;">
                    <p style="text-align: center; color: #666; font-size: 14px;">
                        Este é um email de teste do sistema AIMindset<br>
                        Enviado em ${new Date().toLocaleString('pt-BR')}
                    </p>
                </div>
            `
        });

        if (error) {
            console.error('❌ ERRO ao enviar email:', error);
            return false;
        }

        console.log('✅ EMAIL ENVIADO COM SUCESSO!');
        console.log('📧 ID da mensagem:', data.id);
        console.log('🎯 Verifique sua caixa de entrada: warface01031999@gmail.com');
        console.log('📱 Verifique também a pasta de spam se não encontrar');
        
        return true;
        
    } catch (error) {
        console.error('💥 ERRO CRÍTICO:', error.message);
        return false;
    }
}

// Executar o teste
console.log('='.repeat(60));
console.log('🎯 TESTE REAL DE EMAIL - SISTEMA AIMINDSET');
console.log('='.repeat(60));

enviarEmailReal().then(sucesso => {
    if (sucesso) {
        console.log('\n🎉 TESTE CONCLUÍDO COM SUCESSO!');
        console.log('📧 Verifique sua caixa de entrada agora!');
    } else {
        console.log('\n❌ TESTE FALHOU!');
        console.log('🔧 Verifique as configurações do Resend');
    }
    console.log('='.repeat(60));
});